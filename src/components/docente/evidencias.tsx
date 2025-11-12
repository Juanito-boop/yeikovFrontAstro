import { AlertCircle, CheckCircle, Clock, File, FileText, Image, LogOut, Upload, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { logoutUser } from "../../lib/auth";

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

  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    const result = `${first}${last}`.toUpperCase();
    return result || '';
  }, [user]);
  const planData = {
    id: '1',
    espacioAcademico: 'Machine Learning',
    motivo: 'Evaluación Cualitativa (comentarios)',
    estado: 'aceptado_docente', // Solo puede subir evidencias si aceptó el plan
    progreso: 45,
    fechaLimite: '15 de Marzo, 2025'
  };
  if (planData.estado !== 'aceptado_docente' && planData.estado !== 'en_progreso') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Cargar Evidencias</h1>
          <p className="text-slate-800 font-medium drop-shadow">Sube los archivos relacionados con tu plan de mejoramiento</p>
        </div>

        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-8 text-center">
          <div className="w-16 h-16 bg-(--santoto-accent)/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-(--santoto-accent)" />
          </div>
          <h3 className="text-lg font-medium text-(--santoto-primary) mb-2">
            Plan Pendiente de Aceptación
          </h3>
          <p className="text-slate-800 font-medium">
            Debes aceptar el plan de mejoramiento antes de poder subir evidencias.
          </p>
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
    <div className="h-screen flex flex-col items-center ">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo-Usta.png" alt="Logo Usta" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">SGPM</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sistema de Gestión de Planes</p>
            </div>
          </div>

          {navItems.length > 0 ? (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((label) => (
                <a
                  key={label}
                  href={label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-sm font-medium cursor-pointer ${label === 'Dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  {label}
                </a>
              ))}
            </nav>
          ) : null}

          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl text-end font-bold text-slate-900 dark:text-white">{user?.nombre} {user?.apellido}</h1>
              <p className="text-xs text-end text-slate-500 dark:text-slate-400">{user?.role} - {user?.facultad}</p>
            </div>

            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>

            <button
              onClick={() => {
                setUser(null);
                logoutUser(true);
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="size-10 bg-(--santoto-primary)/30 rounded-lg align-center justify-center text-white hover:bg-red-700 p-2 cursor-pointer"
            >
              <LogOut />
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Cargar Evidencias</h1>
          <p className="text-slate-800 font-medium drop-shadow">Sube los archivos relacionados con tu plan de mejoramiento</p>
        </div>

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

            {/* Upload Button */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button className="flex items-center space-x-2 px-6 py-3 bg-(--santoto-primary) text-white font-medium rounded-xl hover:bg-(--santoto-primary)/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <CheckCircle className="w-5 h-5" />
                  <span>Subir Evidencias</span>
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
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 flex-shrink-0"></span>
              <span>Los archivos deben estar relacionados directamente con el plan de mejoramiento</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 flex-shrink-0"></span>
              <span>Tamaño máximo por archivo: 50MB</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-(--santoto-primary) rounded-full mt-2 flex-shrink-0"></span>
              <span>Formatos aceptados: PDF, DOC, DOCX, JPG, PNG, MP4, entre otros</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}