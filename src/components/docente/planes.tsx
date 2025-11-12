import { useEffect, useMemo, useState } from "react"
import { LogOut, FileText, Calendar, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchMyPlans, type Plan } from './request';
import { toast } from '@pheralb/toast';

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


export default function DashboardPlanes() {
  const [user, setUser] = useState<User | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];

  // Safely parse stored user
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

  // Fetch planes del docente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchMyPlans(token)
      .then(data => {
        setPlanes(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar planes: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  // Compute initials safely
  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    const result = `${first}${last}`.toUpperCase();
    return result || '';
  }, [user]);

  // Filtrar planes por estado
  const planesFiltrados = planes.filter(plan => {
    if (filtroEstado === 'todos') return true;
    return plan.estado.toLowerCase() === filtroEstado.toLowerCase();
  });

  // Estadísticas
  const planesCompletados = planes.filter(p => p.estado === 'completado').length;
  const planesEnProgreso = planes.filter(p => p.estado === 'en_progreso').length;
  const planesPendientes = planes.filter(p => p.estado === 'pendiente').length;

  // Función para obtener color según estado
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'en_progreso':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rechazado':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Función para obtener ícono según estado
  const getEstadoIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return <CheckCircle className="w-5 h-5" />;
      case 'en_progreso':
        return <Clock className="w-5 h-5" />;
      case 'pendiente':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
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
              {navItems.map((label) => (
                <a
                  key={label}
                  href={label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-sm font-medium cursor-pointer ${label === 'Mis Planes' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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
      <main className="w-full py-8">
        <div
          className="min-h-screen py-8"
          style={{
            backgroundImage: 'url(https://cloudfront-us-east-1.images.arcpublishing.com/semana/PRDAWGU7ONHY5BQOLCXLVZZPIA.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <h1 className="text-3xl font-bold text-[--santoto-primary] mb-2 drop-shadow-md">
                Mis Planes de Mejora
              </h1>
              <p className="text-slate-800 font-medium drop-shadow">
                Seguimiento de planes asignados y su progreso
              </p>
            </div>

            {/* Estadísticas */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12 mb-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{planesCompletados}</p>
                    <p className="text-sm text-slate-600">Completados</p>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{planesEnProgreso}</p>
                    <p className="text-sm text-slate-600">En Progreso</p>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{planesPendientes}</p>
                    <p className="text-sm text-slate-600">Pendientes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 mb-8">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Filtrar por estado:</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            {/* Lista de Planes */}
            {planesFiltrados.length === 0 ? (
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No se encontraron planes
                </h3>
                <p className="text-slate-500">
                  {filtroEstado !== 'todos' ? 'No hay planes con este estado' : 'No tienes planes asignados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {planesFiltrados.map((plan) => (
                  <div key={plan.id} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900">{plan.titulo}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(plan.estado)}`}>
                            {getEstadoIcon(plan.estado)}
                            {plan.estado.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">{plan.descripcion}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Creado: {new Date(plan.fechaCreacion).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/dashboard/plan/${plan.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}