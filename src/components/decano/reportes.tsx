import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, FileText, LogOut } from 'lucide-react';
import { logoutUser } from '../../lib/auth';

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

  const reportesFacultad = [
    {
      id: '1',
      titulo: 'Rendimiento Departamental',
      descripcion: 'Análisis comparativo entre departamentos de la facultad',
      fechaGeneracion: '2025-01-20',
      registros: 45,
      tipo: 'departamental'
    },
    {
      id: '2',
      titulo: 'Seguimiento Docente',
      descripcion: 'Actividad y cumplimiento del cuerpo docente',
      fechaGeneracion: '2025-01-19',
      registros: 28,
      tipo: 'docente'
    },
    {
      id: '3',
      titulo: 'Planes de Mejoramiento',
      descripcion: 'Estado y progreso de planes asignados',
      fechaGeneracion: '2025-01-18',
      registros: 15,
      tipo: 'planes'
    }
  ];

  const metricas = [
    { label: 'Docentes Facultad', value: '28', icon: Users, color: 'blue' },
    { label: 'Planes Supervisados', value: '15', icon: FileText, color: 'green' },
    { label: 'Tasa Cumplimiento', value: '87%', icon: TrendingUp, color: 'purple' },
    { label: 'Reportes Generados', value: '12', icon: BarChart3, color: 'orange' },
  ];

  const departamentosData = [
    { nombre: 'Ingeniería de Sistemas', docentes: 12, planes: 8, cumplimiento: 95 },
    { nombre: 'Ingeniería Industrial', docentes: 8, planes: 4, cumplimiento: 85 },
    { nombre: 'Ingeniería Civil', docentes: 8, planes: 3, cumplimiento: 78 },
  ];

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
            Reportes de Facultad
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Análisis y reportes específicos de la Facultad de Ingeniería
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricas.map((metric, index) => {
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
          })}
        </div>

        {/* Rendimiento por Departamento */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 mb-8">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-lg font-semibold text-slate-900">Rendimiento por Departamento</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {departamentosData.map((dept, index) => (
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
              ))}
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