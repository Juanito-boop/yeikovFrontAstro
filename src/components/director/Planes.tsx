import { useEffect, useMemo, useState } from "react"
import { FileText, LogOut, Plus, Save, X, ListTodo } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchDocentes, createPlan, fetchAllPlans, type Docente, type Plan } from "./request";
import { toast } from "@pheralb/toast";

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: 'Director' | 'Docente' | 'Decano' | 'Administrador'
}

const NAV_ITEMS = {
  Director: ['Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Mis Planes', 'Evidencias'],
  Decano: ['Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Usuarios', 'Facultades', 'Reportes'],
};

interface AccionTemp {
  id: string;
  descripcion: string;
  fechaObjetivo: string;
}

export default function Planes() {
  const [user, setUser] = useState<User | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    docenteId: '',
    titulo: '',
    descripcion: '',
    incidenciaId: ''
  });
  const [acciones, setAcciones] = useState<AccionTemp[]>([]);
  const [nuevaAccion, setNuevaAccion] = useState({
    descripcion: '',
    fechaObjetivo: ''
  });

  const navItems = user ? NAV_ITEMS[user.role] || [] : [];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to parse user', e)
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    Promise.all([
      fetchDocentes(token),
      fetchAllPlans(token)
    ])
      .then(([docentesData, planesData]) => {
        setDocentes(docentesData);
        setPlanes(planesData);
      })
      .catch(err => toast.error({ text: 'Error al cargar datos: ' + err.message }));
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    return `${user.nombre[0] || ''}${user.apellido[0] || ''}`.toUpperCase();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No autenticado' });
      return;
    }

    // Validar que se haya seleccionado un docente
    if (!formData.docenteId) {
      toast.error({ text: 'Debe seleccionar un docente' });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creando plan con datos:', {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        docenteId: formData.docenteId,
        incidenciaId: formData.incidenciaId || undefined
      });

      const planCreado = await createPlan(token, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        docenteId: formData.docenteId,
        incidenciaId: formData.incidenciaId || undefined
      });

      console.log('Plan creado:', planCreado);

      // Si hay acciones, crearlas después de crear el plan
      if (acciones.length > 0 && planCreado.id) {
        console.log(`Creando ${acciones.length} acciones para el plan ${planCreado.id}`);
        let accionesCreadas = 0;

        for (const accion of acciones) {
          try {
            // Convertir la fecha a formato ISO datetime si existe
            const fechaObjetivoISO = accion.fechaObjetivo
              ? new Date(accion.fechaObjetivo).toISOString()
              : undefined;

            console.log('Creando acción:', {
              planId: planCreado.id,
              descripcion: accion.descripcion,
              fechaObjetivo: fechaObjetivoISO
            });

            const response = await fetch('http://localhost:3000/api/acciones', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                planId: planCreado.id,
                descripcion: accion.descripcion,
                fechaObjetivo: fechaObjetivoISO
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error al crear acción:', errorData);
              throw new Error(errorData.error || 'Error al crear acción');
            }

            const accionCreada = await response.json();
            console.log('Acción creada:', accionCreada);
            accionesCreadas++;
          } catch (err: any) {
            console.error('Error al crear acción:', err);
            toast.error({ text: 'Error al crear acción: ' + (err.message || 'Error desconocido') });
          }
        }

        console.log(`${accionesCreadas}/${acciones.length} acciones creadas exitosamente`);
        toast.success({
          text: `Plan creado con ${accionesCreadas} ${accionesCreadas === 1 ? 'acción' : 'acciones'}`
        });
      } else {
        toast.success({ text: 'Plan creado exitosamente' });
      }

      const updated = await fetchAllPlans(token);
      setPlanes(updated);
      resetForm();
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      toast.error({ text: 'Error: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ docenteId: '', titulo: '', descripcion: '', incidenciaId: '' });
    setAcciones([]);
    setNuevaAccion({ descripcion: '', fechaObjetivo: '' });
    setMostrarModal(false);
  };

  const agregarAccion = () => {
    if (nuevaAccion.descripcion.trim()) {
      setAcciones([...acciones, {
        id: Date.now().toString(),
        descripcion: nuevaAccion.descripcion,
        fechaObjetivo: nuevaAccion.fechaObjetivo
      }]);
      setNuevaAccion({ descripcion: '', fechaObjetivo: '' });
    }
  };

  const eliminarAccion = (id: string) => {
    setAcciones(acciones.filter(a => a.id !== id));
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'Abierto': 'bg-blue-100 text-blue-700 border-blue-200',
      'En Progreso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Cerrado': 'bg-green-100 text-green-700 border-green-200',
      'Completado': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-screen flex flex-col">
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
              <a
                href="/dashboard"
                className="text-sm font-medium cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Dashboard
              </a>
              {navItems.map((label) => (
                <a
                  key={label}
                  href={`/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-sm font-medium cursor-pointer ${label === 'Métricas' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Asignación de Planes de Mejoramiento</h1>
              <p className="text-slate-600">Crear y asignar planes de mejoramiento a los docentes</p>
            </div>
            <button onClick={() => setMostrarModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              <Plus className="w-5 h-5" />
              <span>Nuevo Plan</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!Array.isArray(planes) || planes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-md border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay planes asignados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {planes.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{plan.titulo}</h3>
                      <p className="text-sm text-slate-600">{plan.docente.nombre} {plan.docente.apellido}</p>
                      <p className="text-xs text-slate-500">{plan.descripcion.substring(0, 60)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(plan.estado)}`}>{plan.estado}</span>
                    <span className="text-xs text-slate-500">{formatDate(plan.createdAt || plan.fechaCreacion)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && resetForm()}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Nuevo Plan de Mejoramiento</h2>
                <button onClick={resetForm} disabled={isLoading} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Docente *</label>
                  <select
                    value={formData.docenteId}
                    onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar docente...</option>
                    {docentes.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.apellido} - {d.school?.nombre || 'Sin facultad'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Título del Plan *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Plan de mejoramiento para Cálculo I"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descripción *</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                    placeholder="Describe los objetivos..."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ID de Incidencia (Opcional)</label>
                  <input
                    type="text"
                    value={formData.incidenciaId}
                    onChange={(e) => setFormData({ ...formData, incidenciaId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="ID de incidencia"
                    disabled={isLoading}
                  />
                </div>

                {/* Sección de Acciones */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Acciones del Plan</h3>
                    <ListTodo className="w-5 h-5 text-indigo-600" />
                  </div>

                  {/* Lista de acciones agregadas */}
                  {acciones.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {acciones.map(accion => (
                        <div key={accion.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{accion.descripcion}</p>
                            {accion.fechaObjetivo && (
                              <p className="text-xs text-slate-500">
                                Fecha objetivo: {new Date(accion.fechaObjetivo).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarAccion(accion.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario para agregar nueva acción */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                    <input
                      type="text"
                      value={nuevaAccion.descripcion}
                      onChange={(e) => setNuevaAccion({ ...nuevaAccion, descripcion: e.target.value })}
                      placeholder="Descripción de la acción..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      disabled={isLoading}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={nuevaAccion.fechaObjetivo}
                        onChange={(e) => setNuevaAccion({ ...nuevaAccion, fechaObjetivo: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={agregarAccion}
                        disabled={!nuevaAccion.descripcion.trim() || isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={resetForm} disabled={isLoading} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center space-x-2 disabled:opacity-50">
                    <Save className="w-5 h-5" />
                    <span>{isLoading ? 'Creando...' : 'Asignar Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
