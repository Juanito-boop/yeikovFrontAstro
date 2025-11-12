import { useEffect, useMemo, useState } from "react"
import { BarChart3, CheckCircle, Clock, Download, Filter, LogOut, TrendingUp } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchAllPlans, type Plan } from "./request";
import { toast } from "@pheralb/toast";

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: Role
}

// Using Plan interface from request.ts

type Role = 'Director' | 'Docente' | 'Decano' | 'Administrador';

const NAV_ITEMS: Record<Role, string[]> = {
  Director: ['Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Mis Planes', 'Evidencias'],
  Decano: ['Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Usuarios', 'Facultades', 'Reportes'],
};

const estados = ['todos', 'Abierto', 'En Progreso', 'Cerrado', 'Completado', 'Aprobado'];

export default function SeguimientoDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [filtroFacultad, setFiltroFacultad] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];

  // Calcular estadísticas desde los planes reales
  // Asegurar que 'planes' siempre sea un array antes de usar .filter/.map
  const planesSafe = Array.isArray(planes) ? planes : [];
  const totalPlanes = planesSafe.length;
  const planesAprobados = planesSafe.filter(p => p.estado === 'Aprobado' || p.estado === 'Completado' || p.estado === 'Cerrado').length;
  const planesPendientes = planesSafe.filter(p => p.estado === 'Abierto').length;

  // Obtener facultades únicas desde los planes
  const facultadesFromPlanes = Array.from(new Set(planesSafe.map(p => p.docente.school?.nombre).filter(Boolean)));
  const facultades = ['todas', ...facultadesFromPlanes];
  // Filtrar planes según los filtros seleccionados
  const planesFiltrados = planesSafe.filter(plan => {
    const matchFacultad = filtroFacultad === 'todas' || plan.docente.school?.nombre === filtroFacultad;
    const matchEstado = filtroEstado === 'todos' || plan.estado === filtroEstado;
    return matchFacultad && matchEstado;
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
      // Optionally: console.warn('Failed to parse stored user', e)
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchAllPlans(token)
      .then(data => {
        // Normalizar la respuesta: si la API devuelve un objeto { data: [...] } lo extraemos,
        // si devuelve directamente el array lo usamos, en cualquier otro caso asignamos []
        const safe = Array.isArray(data)
          ? data
          : (data && typeof data === 'object' && Array.isArray((data as any).data))
            ? (data as any).data
            : [];
        setPlanes(safe);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar planes: ' + err.message });
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
                  className={`text-sm font-medium cursor-pointer ${label === 'Seguimiento' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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
                Seguimiento Institucional de Planes
              </h1>
              <p className="text-slate-800 font-medium drop-shadow">
                Monitoreo y supervisión de todos los planes de mejoramiento
              </p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors">
              <Download className="w-5 h-5" />
              <span>Exportar Reporte</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{totalPlanes}</span>
            </div>
            <p className="text-sm text-slate-600">Total de Planes</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{planesAprobados}</span>
            </div>
            <p className="text-sm text-slate-600">Planes Aprobados</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{planesPendientes}</span>
            </div>
            <p className="text-sm text-slate-600">Pendientes</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{totalPlanes}</span>
            </div>
            <p className="text-sm text-slate-600">Total Monitoreados</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Facultad</label>
              <select
                value={filtroFacultad}
                onChange={(e) => setFiltroFacultad(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {facultades.map(facultad => (
                  <option key={facultad || 'todas'} value={facultad || 'todas'}>
                    {(facultad || 'Todas').charAt(0).toUpperCase() + (facultad || 'Todas').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {estados.map(estado => (
                  <option key={estado} value={estado}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de planes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Planes Institucionales ({planesFiltrados.length})</h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 mt-2">Cargando planes...</p>
              </div>
            ) : planesFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No hay planes que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Docente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Título</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Facultad</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planesFiltrados.map(plan => {
                      const getEstadoColor = (estado: string) => {
                        const colors: Record<string, string> = {
                          'Abierto': 'bg-blue-100 text-blue-700 border-blue-200',
                          'En Progreso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                          'Cerrado': 'bg-green-100 text-green-700 border-green-200',
                          'Completado': 'bg-green-100 text-green-700 border-green-200',
                          'Aprobado': 'bg-green-100 text-green-700 border-green-200',
                        };
                        return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
                      };

                      return (
                        <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-900">
                            {plan.docente.nombre} {plan.docente.apellido}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-900">{plan.titulo}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {plan.docente.school?.nombre || 'Sin asignar'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(plan.estado)}`}>
                              {plan.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(plan.fechaCreacion).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}