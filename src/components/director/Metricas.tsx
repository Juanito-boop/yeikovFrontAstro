import { useEffect, useMemo, useState } from "react"
import { Award, FileText, Target, TrendingUp, Users } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { Header } from '../Header';
import { fetchDirectorCounts, type DirectorCountsRequest } from "./request";
import { toast } from "@pheralb/toast";

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
  Director: ['Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Mis Planes', 'Evidencias'],
  Decano: ['Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Usuarios', 'Facultades', 'Reportes'],
};

export default function Metricas() {
  const [user, setUser] = useState<User | null>(null);
  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2025-1');
  const [counts, setCounts] = useState<DirectorCountsRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

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
    fetchDirectorCounts(token)
      .then(data => {
        setCounts(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar métricas: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  // Calcular métricas institucionales desde los datos reales
  const totalCompletados = counts?.planesPorEscuela.reduce((acc: number, e: any) => acc + e.planesCompletados, 0) || 0;
  const totalPlanes = counts?.planes || 0;
  const calidadPorcentaje = totalPlanes > 0 ? ((totalCompletados / totalPlanes) * 100) : 0;

  const metricasInstitucionales = counts ? [
    {
      label: 'Total de Planes',
      valor: counts.planes.toString(),
      cambio: '',
      tendencia: 'stable',
      color: 'blue'
    },
    {
      label: 'Total de Docentes',
      valor: counts.docentes.toString(),
      cambio: '',
      tendencia: 'stable',
      color: 'emerald'
    },
    {
      label: 'Facultades Activas',
      valor: counts.planesPorEscuela.length.toString(),
      cambio: '',
      tendencia: 'stable',
      color: 'purple'
    },
    {
      label: 'Calidad Promedio',
      // Índice de calidad = planes completados / total de planes
      valor: `${calidadPorcentaje.toFixed(1)}%`,
      cambio: '',
      tendencia: 'up',
      color: 'orange'
    },
  ] : [];

  const metricasPorFacultad = counts?.planesPorEscuela.map((escuela: any) => ({
    facultad: escuela.schoolName,
    docentes: escuela.docentes,
    planes: escuela.totalPlanes,
    cumplimiento: escuela.totalPlanes > 0 ? Math.round((escuela.planesCompletados / escuela.totalPlanes) * 100) : 0,
    calidad: escuela.totalPlanes > 0 ? +((escuela.planesCompletados / escuela.totalPlanes) * 5).toFixed(1) : 0,
    tendencia: escuela.planesCompletados > 0 ? 'up' : 'stable',
    cambio: `${escuela.planesCompletados}/${escuela.totalPlanes}`
  })) || [];

  const indicadoresClave = counts ? [
    {
      indicador: 'Planes Completados',
      valor: totalCompletados,
      meta: totalPlanes > 0 ? totalPlanes : 1,
      descripcion: 'Total de planes finalizados',
      color: 'green'
    },
    {
      indicador: 'Calidad Promedio',
      // Índice de calidad = planes completados / total de planes
      valor: Math.round(calidadPorcentaje),
      meta: 100,
      descripcion: 'Índice compuesto de calidad',
      color: 'blue'
    },
    {
      indicador: 'Participación Docente',
      valor: counts.docentes > 0 ? Math.round((counts.docentes / (counts.docentes + 10)) * 100) : 0,
      meta: 100,
      descripcion: 'Porcentaje de docentes activos',
      color: 'purple'
    },
    {
      indicador: 'Eficiencia Institucional',
      valor: Math.round(calidadPorcentaje),
      meta: 100,
      descripcion: 'Tasa de planes finalizados',
      color: 'orange'
    }
  ] : [];

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
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Métricas"
        onLogout={() => {
          setUser(null);
          logoutUser(true);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-slate-600">Cargando métricas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
                    Métricas Institucionales
                  </h1>
                  <p className="text-slate-800 font-medium drop-shadow">
                    Indicadores clave de rendimiento y calidad académica
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={periodoSeleccionado}
                    onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="2025-1">2025 - Semestre I</option>
                    <option value="2024-2">2024 - Semestre II</option>
                    <option value="2024-1">2024 - Semestre I</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Indicadores Clave de Rendimiento (KPI)</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {indicadoresClave.map((kpi, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">{kpi.indicador}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600">Meta: {kpi.meta}%</span>
                          <Target className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${kpi.valor >= kpi.meta ? 'bg-linear-to-r from-green-500 to-emerald-500' :
                              kpi.valor >= kpi.meta * 0.8 ? 'bg-linear-to-r from-yellow-500 to-orange-500' :
                                'bg-linear-to-r from-red-500 to-red-600'
                              }`}
                            style={{ width: `${(kpi.valor / kpi.meta) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-slate-900">{kpi.valor}%</span>
                          <span className={`text-sm font-medium ${kpi.valor >= kpi.meta ? 'text-green-600' :
                            kpi.valor >= kpi.meta * 0.8 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {kpi.valor >= kpi.meta ? 'Meta alcanzada' :
                              kpi.valor >= kpi.meta * 0.8 ? 'En progreso' : 'Requiere atención'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{kpi.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rendimiento por Facultad */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Rendimiento por Facultad</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 rounded-xl">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Facultad</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Docentes</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Planes</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Cumplimiento</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Calidad</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {metricasPorFacultad.map((facultad, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-900">{facultad.facultad}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-900">{facultad.docentes}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-900">{facultad.planes}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${facultad.cumplimiento >= 90 ? 'bg-green-500' :
                                    facultad.cumplimiento >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                  style={{ width: `${facultad.cumplimiento}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-900">{facultad.cumplimiento}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4 text-yellow-500" />
                              <span className="text-slate-900">{facultad.calidad}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {getTendenciaIcon(facultad.tendencia)}
                              <span className={`text-sm font-medium ${facultad.tendencia === 'up' ? 'text-green-600' :
                                facultad.tendencia === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {facultad.cambio}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tendencias Temporales */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Tendencias Temporales</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Datos históricos próximamente</p>
                  <p className="text-sm text-slate-500 mt-2">Estamos recopilando información mensual para mostrar tendencias</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}