import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, FileText, LogOut } from 'lucide-react';
import { logoutUser } from '../../lib/auth';
import { fetchDecanoReportes, fetchDepartamentos, type DecanoReportes, type Departamento } from './request';
import { toast } from '@pheralb/toast';
import { Header } from '../Header';

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

export function ReportesDecano() {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [reportes, setReportes] = useState<DecanoReportes | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    }
  }, []);

  // Fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchDecanoReportes(token),
      fetchDepartamentos(token)
    ])
      .then(([reportesData, departamentosData]) => {
        setReportes(reportesData);
        setDepartamentos(departamentosData);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar datos: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  const reportesFacultad = [
    {
      id: '1',
      titulo: 'Rendimiento Departamental',
      descripcion: 'Análisis comparativo entre departamentos de la facultad',
      fechaGeneracion: new Date().toISOString().split('T')[0],
      registros: departamentos.reduce((acc, d) => acc + d.planes, 0),
      tipo: 'departamental'
    },
    {
      id: '2',
      titulo: 'Seguimiento Docente',
      descripcion: 'Actividad y cumplimiento del cuerpo docente',
      fechaGeneracion: new Date().toISOString().split('T')[0],
      registros: reportes?.totalDocentes || 0,
      tipo: 'docente'
    },
    {
      id: '3',
      titulo: 'Planes de Mejoramiento',
      descripcion: 'Estado y progreso de planes asignados',
      fechaGeneracion: new Date().toISOString().split('T')[0],
      registros: reportes?.totalPlanes || 0,
      tipo: 'planes'
    }
  ];

  const metricas = reportes ? [
    { label: 'Docentes Facultad', value: reportes.totalDocentes.toString(), icon: Users, color: 'blue' },
    { label: 'Planes Supervisados', value: reportes.totalPlanes.toString(), icon: FileText, color: 'green' },
    { label: 'Tasa Cumplimiento', value: `${reportes.tasaCumplimiento}%`, icon: TrendingUp, color: 'purple' },
    { label: 'Reportes Generados', value: '3', icon: BarChart3, color: 'orange' },
  ] : [];

  const departamentosData = departamentos.map(d => ({
    nombre: d.nombre,
    docentes: d.docentes,
    planes: d.planes,
    cumplimiento: d.cumplimiento
  }));

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
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://cloudfront-us-east-1.images.arcpublishing.com/semana/PRDAWGU7ONHY5BQOLCXLVZZPIA.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Reportes"
        onLogout={() => setUser(null)}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
            Reportes de Facultad
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Análisis y reportes específicos de la Facultad de Ingeniería
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            metricas.map((metric, index) => {
              const Icon = metric.icon;
              const colorClasses = {
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
                orange: 'from-orange-500 to-orange-600',
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
            })
          )}
        </div>

        {/* Rendimiento por Departamento */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 mb-8">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-lg font-semibold text-slate-900">Rendimiento por Departamento</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : departamentosData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No hay datos de departamentos disponibles</p>
                </div>
              ) : (
                departamentosData.map((dept, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{dept.nombre}</h3>
                        <p className="text-xs text-slate-600">
                          {dept.docentes} docentes • {dept.planes} planes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{dept.cumplimiento}%</p>
                        <p className="text-xs text-slate-600">cumplimiento</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${dept.cumplimiento >= 90 ? 'bg-linear-to-r from-green-500 to-emerald-500' :
                          dept.cumplimiento >= 80 ? 'bg-linear-to-r from-yellow-500 to-orange-500' :
                            'bg-linear-to-r from-red-500 to-red-600'
                          }`}
                        style={{ width: `${dept.cumplimiento}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Generación de Reportes */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 mb-8">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-lg font-semibold text-slate-900">Generar Reportes Personalizados</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                  <option value="todos">Todos</option>
                  <option value="departamental">Departamental</option>
                  <option value="docente">Docentes</option>
                  <option value="planes">Planes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Reporte Docentes</p>
                </div>
              </button>
              <button className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Reporte Planes</p>
                </div>
              </button>
              <button className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">Reporte Rendimiento</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Reportes Disponibles */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-lg font-semibold text-slate-900">Reportes Disponibles</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportesFacultad.map((reporte) => (
                <div key={reporte.id} className="flex items-center justify-between p-4 bg-white/40 border-2 border-white/30 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{reporte.titulo}</h3>
                      <p className="text-sm text-slate-600">{reporte.descripcion}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-slate-500">
                          {reporte.registros} registros
                        </span>
                        <span className="text-xs text-slate-500">
                          {reporte.fechaGeneracion}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}