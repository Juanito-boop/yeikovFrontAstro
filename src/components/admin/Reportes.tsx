import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, FileText, Eye, Filter, LogOut, X } from 'lucide-react';
import { logoutUser } from '../../lib/auth';
import { fetchAdminStats, generarReporte, fetchReportes, fetchFacultades, type ReporteData as ReporteDataType, type Facultad } from './request';
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
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('');
  const [reporteViendose, setReporteViendose] = useState<ReporteData | null>(null);
  const [metricsData, setMetricsData] = useState([
    { label: 'Total Usuarios', value: '0', icon: Users, color: 'blue' },
    { label: 'Planes Activos', value: '0', icon: FileText, color: 'green' },
    { label: 'Reportes Generados', value: '0', icon: BarChart3, color: 'purple' },
    { label: 'Tasa de Cumplimiento', value: '0%', icon: TrendingUp, color: 'emerald' },
  ]);

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchAdminStats(token),
      fetchReportes(token),
      fetchFacultades(token)
    ])
      .then(([stats, reportes, facultadesData]) => {
        const tasaCumplimiento = stats.planesCompletados > 0
          ? Math.round((stats.planesCompletados / (stats.planesActivos + stats.planesCompletados)) * 100)
          : 0;

        setMetricsData([
          { label: 'Total Usuarios', value: stats.totalDocentes.toString(), icon: Users, color: 'blue' },
          { label: 'Planes Activos', value: stats.planesActivos.toString(), icon: FileText, color: 'green' },
          { label: 'Reportes Generados', value: reportes.length.toString(), icon: BarChart3, color: 'purple' },
          { label: 'Tasa de Cumplimiento', value: `${tasaCumplimiento}%`, icon: TrendingUp, color: 'emerald' },
        ]);

        setReportesDisponibles(reportes);
        setFacultades(facultadesData);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar datos: ' + err.message });
        setIsLoading(false);
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

  const descargarReporte = (reporteId: string) => {
    const reporte = reportesDisponibles.find(r => r.id === reporteId);
    if (!reporte) return;
    
    // Create a simple text representation of the report
    const reporteTexto = generarTextoReporte(reporte);
    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${reporte.tipo}-${reporte.fechaGeneracion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success({ text: 'Reporte descargado exitosamente' });
  };

  const verReporte = (reporteId: string) => {
    const reporte = reportesDisponibles.find(r => r.id === reporteId);
    if (reporte) {
      setReporteViendose(reporte);
    }
  };

  const generarTextoReporte = (reporte: ReporteData): string => {
    let texto = `========================================\n`;
    texto += `${reporte.titulo}\n`;
    texto += `========================================\n\n`;
    texto += `Tipo: ${reporte.tipo}\n`;
    texto += `Fecha de Generación: ${reporte.fechaGeneracion}\n`;
    texto += `Estado: ${reporte.estado}\n`;
    texto += `Registros: ${reporte.registros}\n`;
    texto += `Descripción: ${reporte.descripcion}\n\n`;
    texto += `----------------------------------------\n`;
    texto += `DATOS DEL REPORTE\n`;
    texto += `----------------------------------------\n\n`;
    
    if (reporte.datos) {
      texto += JSON.stringify(reporte.datos, null, 2);
    }
    
    return texto;
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
                  Facultad/Escuela
                </label>
                <select
                  value={facultadSeleccionada}
                  onChange={(e) => setFacultadSeleccionada(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las facultades</option>
                  {facultades.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
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
                        onClick={() => verReporte(reporte.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => descargarReporte(reporte.id)}
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

        {/* Modal Visor de Reporte */}
        {reporteViendose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-md bg-white/95 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-white/40">
              {/* Header del Modal */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{reporteViendose.titulo}</h2>
                    <p className="text-sm text-slate-600">
                      Generado el {reporteViendose.fechaGeneracion}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReporteViendose(null)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Cuerpo del Modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Información del Reporte */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">Tipo</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{reporteViendose.tipo}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium mb-1">Estado</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{reporteViendose.estado}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-xs text-purple-600 font-medium mb-1">Registros</p>
                    <p className="text-sm font-semibold text-slate-900">{reporteViendose.registros}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">Fecha</p>
                    <p className="text-sm font-semibold text-slate-900">{reporteViendose.fechaGeneracion}</p>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Descripción</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
                    {reporteViendose.descripcion}
                  </p>
                </div>

                {/* Datos del Reporte */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Datos del Reporte</h3>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(reporteViendose.datos, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Generado:</span> {reporteViendose.fechaGeneracion}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setReporteViendose(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-white transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => descargarReporte(reporteViendose.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}