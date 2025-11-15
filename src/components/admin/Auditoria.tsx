import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Calendar, Users, Activity, Download, Eye, X } from 'lucide-react';
import { fetchAuditLogs, fetchAuditStats, type AuditLog, type AuditStats } from '../../lib/audit.service';
import { toast } from '@pheralb/toast';
import { Header } from '../Header';

interface UserAuth {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  facultad: string;
  role: 'Director' | 'Docente' | 'Decano' | 'Administrador';
}

const NAV_ITEMS: Record<string, string[]> = {
  Director: ['Dashboard', 'Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Dashboard', 'Mis Planes', 'Evidencias'],
  Decano: ['Dashboard', 'Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Dashboard', 'Usuarios', 'Facultades', 'Reportes Administrador', 'Auditoría'],
};

export function Auditoria() {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('todas');
  const [filtroAccion, setFiltroAccion] = useState('todas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 20;

  const navItems = user ? (NAV_ITEMS[user.role] ?? []) : [];
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : '';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [currentPage, filtroEntidad, filtroAccion, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [logsData, statsData] = await Promise.all([
        fetchAuditLogs(token, {
          entidad: filtroEntidad !== 'todas' ? filtroEntidad : undefined,
          accion: filtroAccion !== 'todas' ? filtroAccion : undefined,
          fechaInicio: fechaInicio || undefined,
          fechaFin: fechaFin || undefined,
          busqueda: busqueda || undefined,
          limit: logsPerPage,
          offset: (currentPage - 1) * logsPerPage,
        }),
        fetchAuditStats(token, fechaInicio || undefined, fechaFin || undefined),
      ]);

      setLogs(logsData.logs);
      setTotalLogs(logsData.total);
      setStats(statsData);
    } catch (error: any) {
      toast.error({ text: 'Error al cargar datos de auditoría: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscar = () => {
    setCurrentPage(1);
    cargarDatos();
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEntidad('todas');
    setFiltroAccion('todas');
    setFechaInicio('');
    setFechaFin('');
    setCurrentPage(1);
  };

  const exportarCSV = () => {
    const csv = [
      ['Fecha', 'Usuario', 'Entidad', 'Acción', 'Descripción', 'IP'].join(','),
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toLocaleString(),
          `${log.usuario.nombre} ${log.usuario.apellido}`,
          log.entidad,
          log.accion,
          `"${log.descripcion}"`,
          log.ipAddress || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'ASIGNAR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'APROBAR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'RECHAZAR': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'LOGIN': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'DEACTIVATE': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://gestion.santototunja.edu.co/wp-content/uploads/2021/06/Santoto_Tunja_Produccion_fotografica_21.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`,
        }))}
        activeItem="Auditoría"
        onLogout={() => setUser(null)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
                Auditoría del Sistema
              </h1>
              <p className="text-slate-800 font-medium drop-shadow">
                Registro completo de todas las actividades del sistema
              </p>
            </div>
            <button
              onClick={exportarCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
              </div>
              <p className="text-sm text-slate-600">Total de Registros</p>
            </div>

            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.usuariosMasActivos.length}
                </span>
              </div>
              <p className="text-sm text-slate-600">Usuarios Activos</p>
            </div>

            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.porEntidad.length}
                </span>
              </div>
              <p className="text-sm text-slate-600">Entidades Monitoreadas</p>
            </div>

            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-orange-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.porAccion.length}
                </span>
              </div>
              <p className="text-sm text-slate-600">Tipos de Acciones</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros avanzados
            </button>
          </div>

          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en descripciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
                />
              </div>
              <button
                onClick={handleBuscar}
                className="px-6 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors"
              >
                Buscar
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Filtros avanzados */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Entidad</label>
                  <select
                    value={filtroEntidad}
                    onChange={(e) => setFiltroEntidad(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary)"
                  >
                    <option value="todas">Todas</option>
                    <option value="Plan">Planes</option>
                    <option value="Usuario">Usuarios</option>
                    <option value="Evidencia">Evidencias</option>
                    <option value="Autenticación">Autenticación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Acción</label>
                  <select
                    value={filtroAccion}
                    onChange={(e) => setFiltroAccion(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary)"
                  >
                    <option value="todas">Todas</option>
                    <option value="CREATE">Crear</option>
                    <option value="UPDATE">Actualizar</option>
                    <option value="DELETE">Eliminar</option>
                    <option value="ASIGNAR">Asignar</option>
                    <option value="APROBAR">Aprobar</option>
                    <option value="RECHAZAR">Rechazar</option>
                    <option value="LOGIN">Login</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Logs */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 overflow-hidden mb-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--santoto-primary)"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No hay registros</h3>
              <p className="text-slate-500">No se encontraron logs con los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Entidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(log.createdAt).toLocaleString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div>
                          <p className="font-medium">{`${log.usuario.nombre} ${log.usuario.apellido}`}</p>
                          <p className="text-xs text-slate-500">{log.usuario.role.nombre}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {log.entidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getAccionColor(
                            log.accion
                          )}`}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 max-w-md truncate">
                        {log.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Mostrando {(currentPage - 1) * logsPerPage + 1} a{' '}
                {Math.min(currentPage * logsPerPage, totalLogs)} de {totalLogs} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Detalle del Registro</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Fecha y Hora</label>
                <p className="text-slate-900">
                  {new Date(selectedLog.createdAt).toLocaleString('es-CO')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Usuario</label>
                <p className="text-slate-900">
                  {`${selectedLog.usuario.nombre} ${selectedLog.usuario.apellido}`}
                  <span className="text-sm text-slate-500 ml-2">
                    ({selectedLog.usuario.role.nombre})
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Entidad</label>
                <p className="text-slate-900">{selectedLog.entidad}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Acción</label>
                <p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getAccionColor(
                      selectedLog.accion
                    )}`}
                  >
                    {selectedLog.accion}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Descripción</label>
                <p className="text-slate-900">{selectedLog.descripcion}</p>
              </div>

              {selectedLog.entidadAfectada && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Entidad Afectada</label>
                  <p className="text-slate-900">{selectedLog.entidadAfectada}</p>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Dirección IP</label>
                  <p className="text-slate-900">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Navegador/Dispositivo</label>
                  <p className="text-slate-900 text-sm break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.datosPrevios && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Datos Previos</label>
                  <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.datosPrevios, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.datosNuevos && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Datos Nuevos</label>
                  <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.datosNuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
