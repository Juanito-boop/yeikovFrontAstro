import { useEffect, useMemo, useState } from "react"
import { LogOut, Target, Plus, CheckCircle, Clock, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchIncidencias, createIncidencia, fetchDocentes, type Incidencia, type Docente } from "./request";
import { toast } from "@pheralb/toast";

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: Role
}

// Using Incidencia interface from request.ts

type Role = 'Director' | 'Docente' | 'Decano' | 'Administrador';

const NAV_ITEMS: Record<Role, string[]> = {
  Director: ['Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Mis Planes', 'Evidencias'],
  Decano: ['Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Usuarios', 'Facultades', 'Reportes'],
};

export default function EstrategiaDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];
  const [mostrarModal, setMostrarModal] = useState(false);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    docenteId: '',
    descripcion: ''
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      // If parsing fails, silently ignore and keep user null
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    fetchIncidencias(token)
      .then(data => {
        setIncidencias(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar incidencias: ' + err.message });
        setIsLoading(false);
      });
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    Promise.all([
      fetchIncidencias(token),
      fetchDocentes(token)
    ])
      .then(([incidenciasData, docentesData]) => {
        setIncidencias(incidenciasData);
        setDocentes(docentesData);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar datos: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  const incidenciasFiltradas = incidencias.filter(incidencia =>
    filtroEstado === 'todas' || incidencia.estado === filtroEstado
  );

  const estrategiasFiltradas = incidenciasFiltradas;

  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (estadoLower.includes('revisado')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (estadoLower.includes('archivado')) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Retorna el ícono según el estado de la incidencia
  const getEstadoIcon = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return <Clock className="w-5 h-5" />;
    if (estadoLower.includes('revisado')) return <CheckCircle className="w-5 h-5" />;
    if (estadoLower.includes('archivado')) return <Award className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };

  const getPrioridadColor = (prioridad: string) => {
    return 'bg-blue-100 text-blue-700 border-blue-200'; // No usamos prioridad
  };

  // Calculamos las estadísticas generales
  const totalEstrategias = incidencias.length;
  const estrategiasActivas = incidencias.filter(i => i.estado.toLowerCase().includes('pendiente')).length;
  const progresoPromedio = 0; // No tenemos progreso en incidencias
  const estrategiasCompletadas = incidencias.filter(i => i.estado.toLowerCase().includes('revisado') || i.estado.toLowerCase().includes('archivado')).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No autenticado' });
      return;
    }

    setIsLoading(true);
    try {
      await createIncidencia(token, formData);
      toast.success({ text: 'Incidencia creada exitosamente' });
      const updated = await fetchIncidencias(token);
      setIncidencias(updated);
      setFormData({ docenteId: '', descripcion: '' });
      setMostrarModal(false);
    } catch (error: any) {
      toast.error({ text: 'Error: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center">
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
                  className={`text-sm font-medium cursor-pointer ${label === 'Estrategia' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
                Estrategias Institucionales
              </h1>
              <p className="text-slate-800 font-medium drop-shadow">
                Planificación y seguimiento de iniciativas estratégicas
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Estrategia</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-(--santoto-primary) to-(--santoto-secondary) rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{totalEstrategias}</p>
              <p className="text-sm text-slate-600">Total Estrategias</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{estrategiasActivas}</p>
              <p className="text-sm text-slate-600">En Progreso</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{progresoPromedio}%</p>
              <p className="text-sm text-slate-600">Progreso Promedio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{estrategiasCompletadas}</p>
              <p className="text-sm text-slate-600">Completadas</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['todas', 'Pendiente', 'Revisado', 'Archivado'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${filtroEstado === estado
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {estado === 'todas' ? 'Todas' : estado}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Incidencias Estratégicas */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-600">Cargando incidencias...</p>
              </div>
            </div>
          ) : estrategiasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No hay incidencias estratégicas</p>
              <p className="text-sm text-slate-500 mt-2">Crea una nueva para comenzar</p>
            </div>
          ) : (
            estrategiasFiltradas.map((incidencia) => (
              <div key={incidencia.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header de la Incidencia */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        {getEstadoIcon(incidencia.estado)}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-600 mb-3">{incidencia.descripcion}</p>
                        <div className="flex items-center flex-wrap gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(incidencia.estado)}`}>
                            {incidencia.estado}
                          </span>
                          {incidencia.docente && (
                            <span className="text-sm text-slate-500">
                              Docente: {incidencia.docente.nombre} {incidencia.docente.apellido}
                            </span>
                          )}
                          <span className="text-sm text-slate-500">
                            {new Date(incidencia.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido de la Incidencia */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información General */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">Estado</span>
                        <span className="text-sm text-slate-900">{incidencia.estado}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">Fecha de Creación</span>
                        <span className="text-sm text-slate-900">
                          {new Date(incidencia.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {incidencia.docente && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">Docente Asignado</span>
                          <span className="text-sm text-slate-900">
                            {incidencia.docente.nombre} {incidencia.docente.apellido}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Descripción Completa */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900">Descripción Detallada</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{incidencia.descripcion}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal para Nueva Incidencia */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setMostrarModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Nueva Incidencia Estratégica
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Docente *
                  </label>
                  <select
                    value={formData.docenteId}
                    onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar docente...</option>
                    {docentes.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.apellido} {d.school?.nombre ? `- ${d.school.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                    placeholder="Describa la incidencia estratégica..."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Creando...' : 'Crear Incidencia'}
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