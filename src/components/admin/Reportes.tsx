import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, FileText, Eye, Filter, LogOut, X } from 'lucide-react';
import { logoutUser } from '../../lib/auth';
import { fetchAdminStats, generarReporte, fetchReportes, fetchFacultades, type ReporteData as ReporteDataType } from './request';
import { toast } from '@pheralb/toast';

interface ReporteData {
  id: string;
  titulo: string;
  tipo: 'general' | 'facultad' | 'docente' | 'planes';
  fechaGeneracion: string;
  estado: 'generado' | 'procesando' | 'error';
  descripcion: string;
  registros: number;
  datos?: any;
}

interface UserAuth {
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

export function Reportes() {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [generandoReporte, setGenerandoReporte] = useState<string | null>(null);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [reportesDisponibles, setReportesDisponibles] = useState<ReporteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState([
    { label: 'Total Usuarios', value: '0', icon: Users, color: 'blue' },
    { label: 'Planes Activos', value: '0', icon: FileText, color: 'green' },
    { label: 'Reportes Generados', value: '0', icon: BarChart3, color: 'purple' },
    { label: 'Tasa de Cumplimiento', value: '0%', icon: TrendingUp, color: 'emerald' },
  ]);
  const [reporteViendose, setReporteViendose] = useState<ReporteData | null>(null);
  const [facultades, setFacultades] = useState<Array<{ id: string; nombre: string }>>([]);
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('todas');

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Fetch stats
    fetchAdminStats(token)
      .then(stats => {
        const tasaCumplimiento = stats.planesCompletados > 0
          ? Math.round((stats.planesCompletados / (stats.planesActivos + stats.planesCompletados)) * 100)
          : 0;

        setMetricsData([
          { label: 'Total Usuarios', value: stats.totalDocentes.toString(), icon: Users, color: 'blue' },
          { label: 'Planes Activos', value: stats.planesActivos.toString(), icon: FileText, color: 'green' },
          { label: 'Reportes Generados', value: '4', icon: BarChart3, color: 'purple' },
          { label: 'Tasa de Cumplimiento', value: `${tasaCumplimiento}%`, icon: TrendingUp, color: 'emerald' },
        ]);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar estadísticas: ' + err.message });
      });

    // Fetch reportes
    fetchReportes(token)
      .then(reportes => {
        setReportesDisponibles(reportes);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar reportes: ' + err.message });
        setIsLoading(false);
      });

    // Fetch facultades para filtro
    fetchFacultades(token)
      .then((data: any) => {
        setFacultades(data);
      })
      .catch((err: any) => {
        console.error('Error al cargar facultades:', err);
      });
  }, []);

  // User data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      // If parsing fails, silently ignore
    }
  }, []);

  const reportesFiltrados = reportesDisponibles.filter(reporte =>
    filtroTipo === 'todos' || reporte.tipo === filtroTipo
  );

  const handleGenerarReporte = async (tipo: 'general' | 'facultad' | 'docente' | 'planes') => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay token de autenticación' });
      return;
    }

    setGenerandoReporte(tipo);

    try {
      const nuevoReporte = await generarReporte(token, tipo, fechaInicio, fechaFin);
      setReportesDisponibles(prev => [nuevoReporte, ...prev]);
      toast.success({ text: `Reporte ${tipo} generado exitosamente` });
    } catch (error: any) {
      toast.error({ text: 'Error al generar reporte: ' + error.message });
    } finally {
      setGenerandoReporte(null);
    }
  };

  const descargarReportePDF = (reporte: ReporteData) => {
    try {
      // Crear contenido del PDF
      let contenido = `REPORTE: ${reporte.titulo.toUpperCase()}\n\n`;
      contenido += `Tipo: ${reporte.tipo}\n`;
      contenido += `Fecha de Generación: ${new Date(reporte.fechaGeneracion).toLocaleDateString('es-ES')}\n`;
      contenido += `Total de Registros: ${reporte.registros}\n`;
      contenido += `\n${'='.repeat(60)}\n\n`;

      // Agregar datos según el tipo
      if (reporte.datos) {
        if (Array.isArray(reporte.datos)) {
          reporte.datos.forEach((item: any, index: number) => {
            contenido += `${index + 1}. `;
            if (item.nombre) contenido += `${item.nombre} `;
            if (item.apellido) contenido += `${item.apellido}`;
            if (item.email) contenido += ` - ${item.email}`;
            if (item.titulo) contenido += `${item.titulo}`;
            if (item.estado) contenido += ` [${item.estado}]`;
            contenido += '\n';
          });
        } else if (typeof reporte.datos === 'object') {
          Object.entries(reporte.datos).forEach(([key, value]) => {
            contenido += `${key}: ${value}\n`;
          });
        }
      }

      // Crear blob y descargar
      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reporte.tipo}_${reporte.fechaGeneracion}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success({ text: 'Reporte descargado exitosamente' });
    } catch (error: any) {
      toast.error({ text: 'Error al descargar reporte: ' + error.message });
    }
  };

  const verReporte = (reporte: ReporteData) => {
    setReporteViendose(reporte);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'generado': return 'bg-green-100 text-green-700 border-green-200';
      case 'procesando': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'general': return 'bg-blue-100 text-blue-700';
      case 'facultad': return 'bg-purple-100 text-purple-700';
      case 'docente': return 'bg-green-100 text-green-700';
      case 'planes': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      // If parsing fails, silently ignore
    }
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    return `${first}${last}`.toUpperCase() || '';
  }, [user]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://gestion.santototunja.edu.co/wp-content/uploads/2021/06/Santoto_Tunja_Produccion_fotografica_21.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50 w-full mb-8">
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
                  className={`text-sm font-medium cursor-pointer ${label === 'Reportes Administrador' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
            Reportes del Sistema
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Genera y descarga reportes detallados del sistema SGPM
          </p>
        </div>

        {/* Métricas Generales */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12 mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricsData.map((metric, index) => {
              const Icon = metric.icon;
              const colorClasses = {
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
                emerald: 'from-emerald-500 to-emerald-600',
              };

              return (
                <div key={index} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
                    <p className="text-sm text-slate-600">{metric.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Generación de Reportes */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 mb-8">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-lg font-semibold text-slate-900">Generar Nuevo Reporte</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facultad
                </label>
                <select
                  value={facultadSeleccionada}
                  onChange={(e) => setFacultadSeleccionada(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todas">Todas las facultades</option>
                  {facultades.map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Reporte
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="general">General</option>
                  <option value="facultad">Por Facultad</option>
                  <option value="docente">Docentes</option>
                  <option value="planes">Planes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['general', 'facultad', 'docente', 'planes'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => handleGenerarReporte(tipo as 'general' | 'facultad' | 'docente' | 'planes')}
                  disabled={generandoReporte === tipo}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {generandoReporte === tipo ? 'Generando...' : `Reporte ${tipo}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Reportes */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reportes Disponibles</h2>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="general">General</option>
                  <option value="facultad">Facultad</option>
                  <option value="docente">Docente</option>
                  <option value="planes">Planes</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportesFiltrados.map((reporte) => (
                <div key={reporte.id} className="flex items-center justify-between p-4 bg-white/40 border-2 border-white/30 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{reporte.titulo}</h3>
                      <p className="text-sm text-slate-600">{reporte.descripcion}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(reporte.tipo)}`}>
                          {reporte.tipo}
                        </span>
                        <span className="text-xs text-slate-500">
                          {reporte.registros} registros
                        </span>
                        <span className="text-xs text-slate-500">
                          {reporte.fechaGeneracion}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => verReporte(reporte)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => descargarReportePDF(reporte)}
                        disabled={reporte.estado !== 'generado'}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de Visualización de Reporte */}
        {reporteViendose && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header del Modal */}
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{reporteViendose.titulo}</h2>
                  <p className="text-blue-100 text-sm">
                    Generado: {new Date(reporteViendose.fechaGeneracion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setReporteViendose(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Información del Reporte */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">Tipo</p>
                    <p className="text-lg font-semibold text-blue-900 capitalize">{reporteViendose.tipo}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-600 mb-1">Total Registros</p>
                    <p className="text-lg font-semibold text-green-900">{reporteViendose.registros}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm text-purple-600 mb-1">Estado</p>
                    <p className="text-lg font-semibold text-purple-900 capitalize">{reporteViendose.estado}</p>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Descripción</h3>
                  <p className="text-slate-600">{reporteViendose.descripcion}</p>
                </div>

                {/* Datos del Reporte */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Datos del Reporte</h3>
                  {reporteViendose.datos ? (
                    Array.isArray(reporteViendose.datos) ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {reporteViendose.datos.slice(0, 50).map((item: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  {item.nombre && item.apellido ? `${item.nombre} ${item.apellido}` :
                                    item.titulo || item.nombre || `Registro ${index + 1}`}
                                </p>
                                {item.email && (
                                  <p className="text-sm text-slate-600 mt-1">{item.email}</p>
                                )}
                                {item.descripcion && (
                                  <p className="text-sm text-slate-600 mt-1">{item.descripcion}</p>
                                )}
                              </div>
                              {item.estado && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.estado === 'completado' ? 'bg-green-100 text-green-700' :
                                  item.estado === 'en_progreso' ? 'bg-blue-100 text-blue-700' :
                                    item.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-slate-100 text-slate-700'
                                  }`}>
                                  {item.estado}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {reporteViendose.datos.length > 50 && (
                          <p className="text-center text-sm text-slate-500 py-2">
                            Mostrando 50 de {reporteViendose.datos.length} registros
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(reporteViendose.datos).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-200">
                            <span className="font-medium text-slate-700">{key}:</span>
                            <span className="text-slate-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-slate-500 text-center py-8">No hay datos disponibles</p>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="border-t border-slate-200 p-4 flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setReporteViendose(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => descargarReportePDF(reporteViendose)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}