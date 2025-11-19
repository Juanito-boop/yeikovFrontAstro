import { AlertCircle, CheckCircle, Clock, File, FileText, Image, Upload, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from '../Header';
import { logoutUser } from "../../lib/auth";
import { obtenerPlanesDocente, subirEvidencia, type PlanMejora, type PlanAccion } from "../../lib/evidencia.service";

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: Role
}

type Role = 'Director' | 'Docente' | 'Decano' | 'Administrador';

const NAV_ITEMS: Record<Role, string[]> = {
  Director: ['Dashboard', 'Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Dashboard', 'Mis Planes', 'Evidencias'],
  Decano: ['Dashboard', 'Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Dashboard', 'Usuarios', 'Facultades', 'Reportes Administrador'],
};

export default function DashboardEvidencias() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [planes, setPlanes] = useState<PlanMejora[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanMejora | null>(null);
  const [selectedAccion, setSelectedAccion] = useState<PlanAccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comentario, setComentario] = useState<string>('');

  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      // If parsing fails, silently ignore and keep user null
      // Optionally: console.warn('Failed to parse stored user', e)
    }
  }, []);

  useEffect(() => {
    if (user) {
      cargarPlanes();
    }
  }, [user]);

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      setError(null);
      const planesData = await obtenerPlanesDocente();
      setPlanes(planesData);

      // Seleccionar automáticamente el primer plan si existe
      if (planesData.length > 0) {
        setSelectedPlan(planesData[0]);
        if (planesData[0].acciones && planesData[0].acciones.length > 0) {
          setSelectedAccion(planesData[0].acciones[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    const result = `${first}${last}`.toUpperCase();
    return result || '';
  }, [user]);

  const handleSubirEvidencias = async () => {
    if (!selectedAccion) {
      setError('Selecciona una acción para subir evidencias');
      return;
    }

    if (uploadedFiles.length === 0) {
      setError('Debes seleccionar al menos un archivo');
      return;
    }

    if (!comentario.trim()) {
      setError('Debes agregar un comentario o descripción para las evidencias');
      return;
    }

    if (comentario.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      for (const file of uploadedFiles) {
        await subirEvidencia(selectedAccion.id, file, comentario.trim());
      }

      setSuccess(`${uploadedFiles.length} evidencia(s) subida(s) exitosamente`);
      setUploadedFiles([]);
      setComentario('');

      // Recargar planes para actualizar el estado
      await cargarPlanes();
    } catch (err: any) {
      setError(err.message || 'Error al subir evidencias');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header
          user={user}
          initials={initials}
          navItems={navItems.map((label) => ({
            label,
            href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
          }))}
          activeItem="Evidencias"
          onLogout={() => {
            setUser(null);
            logoutUser(true);
          }}
        />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando planes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPlan || planes.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <Header
          user={user}
          initials={initials}
          navItems={navItems.map((label) => ({
            label,
            href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
          }))}
          activeItem="Evidencias"
          onLogout={() => {
            setUser(null);
            logoutUser(true);
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
            <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Cargar Evidencias</h1>
            <p className="text-slate-800 font-medium drop-shadow">Sube los archivos relacionados con tu plan de mejoramiento</p>
          </div>

          <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-8 text-center">
            <div className="w-16 h-16 bg-(--santoto-accent)/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-(--santoto-accent)" />
            </div>
            <h3 className="text-lg font-medium text-(--santoto-primary) mb-2">
              No tienes planes asignados
            </h3>
            <p className="text-slate-800 font-medium">
              Actualmente no tienes planes de mejoramiento asignados. Contacta con tu director.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const planData = {
    id: selectedPlan.id,
    espacioAcademico: selectedPlan.titulo,
    motivo: selectedPlan.descripcion,
    estado: selectedPlan.estado,
    progreso: selectedPlan.progreso || 0,
    fechaLimite: selectedPlan.fechaLimite || 'Sin fecha límite'
  };

  // El docente puede subir evidencias cuando el plan está Activo o EnProgreso
  if (planData.estado !== 'Activo' && planData.estado !== 'EnProgreso') {
    return (
      <div className="h-screen flex flex-col">
        <Header
          user={user}
          initials={initials}
          navItems={navItems.map((label) => ({
            label,
            href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
          }))}
          activeItem="Evidencias"
          onLogout={() => {
            setUser(null);
            logoutUser(true);
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
            <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Cargar Evidencias</h1>
            <p className="text-slate-800 font-medium drop-shadow">Sube los archivos relacionados con tu plan de mejoramiento</p>
          </div>

          <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-8 text-center">
            <div className="w-16 h-16 bg-(--santoto-accent)/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-(--santoto-accent)" />
            </div>
            <h3 className="text-lg font-medium text-(--santoto-primary) mb-2">
              {planData.estado === 'PendienteDecano' && 'Plan Pendiente de Aprobación del Decano'}
              {planData.estado === 'RechazadoDecano' && 'Plan Rechazado por el Decano'}
              {planData.estado === 'RechazadoDocente' && 'Plan Rechazado'}
              {planData.estado === 'Cerrado' && 'Plan Cerrado'}
              {planData.estado === 'Completado' && 'Plan Completado'}
              {!['PendienteDecano', 'RechazadoDecano', 'RechazadoDocente', 'Cerrado', 'Completado'].includes(planData.estado) && 'Plan no disponible'}
            </h3>
            <p className="text-slate-800 font-medium">
              {planData.estado === 'PendienteDecano' && 'El plan está pendiente de aprobación por parte del decano. Una vez aprobado, podrás subir evidencias.'}
              {planData.estado === 'RechazadoDecano' && 'El plan fue rechazado por el decano. Contacta con tu director.'}
              {planData.estado === 'RechazadoDocente' && 'Has rechazado este plan. Contacta con tu director si necesitas ayuda.'}
              {(planData.estado === 'Cerrado' || planData.estado === 'Completado') && 'Este plan ya ha sido completado y cerrado. No se pueden subir más evidencias.'}
              {!['PendienteDecano', 'RechazadoDecano', 'RechazadoDocente', 'Cerrado', 'Completado'].includes(planData.estado) && 'Este plan no está en un estado que permita subir evidencias.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen flex flex-col ">
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Evidencias"
        onLogout={() => {
          setUser(null);
          logoutUser(true);
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Cargar Evidencias</h1>
          <p className="text-slate-800 font-medium drop-shadow">Sube los archivos relacionados con tu plan de mejoramiento</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 backdrop-blur-md bg-red-100/80 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 backdrop-blur-md bg-green-100/80 border-2 border-green-400 text-green-700 px-4 py-3 rounded-xl">
            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* Plan Selection */}
        {planes.length > 1 && (
          <div className="mb-6 backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-4">
            <label className="block text-sm font-medium text-(--santoto-primary) mb-2">
              Seleccionar Plan de Mejora
            </label>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => {
                const plan = planes.find(p => p.id === e.target.value);
                setSelectedPlan(plan || null);
                if (plan?.acciones && plan.acciones.length > 0) {
                  setSelectedAccion(plan.acciones[0]);
                } else {
                  setSelectedAccion(null);
                }
                setUploadedFiles([]);
                setComentario('');
              }}
              className="w-full px-4 py-2 border border-white/40 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-(--santoto-primary)"
            >
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.titulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Selection */}
        {selectedPlan && selectedPlan.acciones && selectedPlan.acciones.length > 0 && (
          <div className="mb-6 backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-4">
            <label className="block text-sm font-medium text-(--santoto-primary) mb-2">
              Seleccionar Acción del Plan
            </label>
            <select
              value={selectedAccion?.id || ''}
              onChange={(e) => {
                const accion = selectedPlan.acciones?.find(a => a.id === e.target.value);
                setSelectedAccion(accion || null);
                setUploadedFiles([]);
                setComentario('');
              }}
              className="w-full px-4 py-2 border border-white/40 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-(--santoto-primary)"
            >
              {selectedPlan.acciones.map((accion) => (
                <option key={accion.id} value={accion.id}>
                  {accion.descripcion}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Plan Info */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-(--santoto-primary) rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--santoto-primary)">
                Espacio Académico: {planData.espacioAcademico}
              </h2>
              <p className="text-slate-700 font-medium">Motivo: {planData.motivo}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700 font-medium">Límite: {planData.fechaLimite}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-slate-700 font-medium">Progreso: {planData.progreso}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-(--santoto-primary) h-2 rounded-full transition-all duration-300"
                style={{ width: `${planData.progreso}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 overflow-hidden">
          <div className="p-6 border-b border-white/30">
            <h3 className="text-lg font-semibold text-(--santoto-primary)">Cargar Evidencias</h3>
          </div>

          <div className="p-6">
            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragActive
                ? 'border-(--santoto-primary) bg-(--santoto-primary)/20'
                : 'border-white/60 hover:border-white/80 hover:bg-white/30'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <div className="w-16 h-16 bg-(--santoto-primary) rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>

                <div>
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-slate-500">
                    Soporta PDF, DOC, DOCX, JPG, PNG, MP4 y más
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-800 mb-4">
                  Archivos Seleccionados ({uploadedFiles.length})
                </h4>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-white/40 rounded-xl border border-white/50">
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comentario/Descripción */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-(--santoto-primary) mb-2">
                  Comentario / Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Describe las evidencias que estás subiendo (mínimo 10 caracteres)..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-white/40 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-(--santoto-primary) resize-none"
                  disabled={uploading}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Explica qué muestran estas evidencias y cómo se relacionan con el plan de mejoramiento
                  </p>
                  <p className={`text-xs ${comentario.length < 10 ? 'text-red-500' : comentario.length > 900 ? 'text-orange-500' : 'text-slate-500'}`}>
                    {comentario.length}/1000 caracteres {comentario.length < 10 && `(mínimo 10)`}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubirEvidencias}
                  disabled={uploading || !selectedAccion || !comentario.trim() || comentario.trim().length < 10}
                  className="flex items-center space-x-2 px-6 py-3 bg-(--santoto-primary) text-white font-medium rounded-xl hover:bg-(--santoto-primary)/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Subir Evidencias</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 backdrop-blur-md bg-(--santoto-primary)/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
          <h4 className="text-sm font-semibold text-(--santoto-primary) mb-3 drop-shadow">Instrucciones para subir evidencias:</h4>
          <ul className="text-sm text-slate-800 font-medium space-y-2">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 shrink-0"></span>
              <span>Los archivos deben estar relacionados directamente con el plan de mejoramiento</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 shrink-0"></span>
              <span>Es obligatorio agregar un comentario descriptivo (mínimo 10 caracteres)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 shrink-0"></span>
              <span>Tamaño máximo por archivo: 50MB</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 shrink-0"></span>
              <span>Formatos aceptados: PDF, DOC, DOCX, JPG, PNG, MP4, entre otros</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}