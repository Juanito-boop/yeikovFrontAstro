import { BarChart3, Users, FileText, TrendingUp, Award, CheckCircle, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { logoutUser } from '../../lib/auth';
import { fetchDecanoStats, type DecanoStats } from './request';
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

export function DecanoDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DecanoStats | null>(null);
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

  // Fetch decano statistics
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchDecanoStats(token)
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar estadísticas: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  const facultyStats = stats ? [
    { label: 'Docentes en Facultad', value: stats.totalDocentes.toString(), icon: Users, color: 'blue', change: '+0' },
    { label: 'Planes Supervisados', value: stats.totalPlanes.toString(), icon: FileText, color: 'green', change: '+0' },
    { label: 'Tasa de Cumplimiento', value: `${stats.tasaCumplimiento}%`, icon: TrendingUp, color: 'emerald', change: '+0%' },
    { label: 'Planes Completados', value: stats.planesCompletados.toString(), icon: Award, color: 'purple', change: '+0' },
  ] : [];

  const departmentPerformance = [
    { name: 'Ingeniería de Sistemas', docentes: 12, planes: 8, cumplimiento: 95 },
    { name: 'Matemáticas', docentes: 8, planes: 4, cumplimiento: 85 },
    { name: 'Física', docentes: 8, planes: 3, cumplimiento: 78 },
  ];

  const criticalAlerts = [
    { message: 'Plan de Machine Learning requiere revisión', priority: 'high', time: '1 hora' },
    { message: '2 docentes sin planes asignados', priority: 'medium', time: '2 horas' },
    { message: 'Reunión de seguimiento programada', priority: 'low', time: '1 día' },
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
      className="min-h-screen py-8"
      style={{
        backgroundImage: 'url(https://cloudfront-us-east-1.images.arcpublishing.com/semana/PRDAWGU7ONHY5BQOLCXLVZZPIA.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
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
            Panel del Decano
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Supervisión y gestión académica de la facultad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            facultyStats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'from-blue-600 to-blue-700',
                green: 'from-emerald-600 to-emerald-700',
                emerald: 'from-teal-600 to-teal-700',
                purple: 'from-purple-600 to-purple-700',
              };

              return (
                <div key={index} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-(--santoto-primary) mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-700 font-medium">{stat.label}</p>
                  </div>
                </div>
              );
            }))}
        </div>        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Performance */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 mb-8">
              <div className="p-6 border-b border-white/30">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6 text-(--santoto-primary)" />
                  <h2 className="text-lg font-semibold text-(--santoto-primary)">Rendimiento por Departamento</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {departmentPerformance.map((dept, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{dept.name}</h3>
                          <p className="text-xs text-slate-600">{dept.docentes} docentes • {dept.planes} planes activos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{dept.cumplimiento}%</p>
                          <p className="text-xs text-slate-600">cumplimiento</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${dept.cumplimiento >= 90 ? 'bg-linear-to-r from-green-500 to-emerald-500' :
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 text-left">
                <div className="w-12 h-12 bg-linear-to-br from-(--santoto-primary) to-(--santoto-secondary) rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Asignar Planes</h3>
                <p className="text-sm text-slate-600">Crear nuevos planes de mejoramiento</p>
              </button>

              <button className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 text-left">
                <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Revisar Evidencias</h3>
                <p className="text-sm text-slate-600">Aprobar documentos subidos</p>
              </button>

              <button className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 text-left">
                <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Generar Reportes</h3>
                <p className="text-sm text-slate-600">Análisis y estadísticas</p>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Critical Alerts */}
            <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
              <div className="p-6 border-b border-white/30">
                <h3 className="text-lg font-semibold text-(--santoto-primary)">Alertas Críticas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {criticalAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-white/40">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${alert.priority === 'high' ? 'bg-red-500' :
                        alert.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                        <p className="text-xs text-slate-600">hace {alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Faculty Summary */}
            <div className="backdrop-blur-md bg-linear-to-br from-(--santoto-primary)/30 to-blue-500/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
              <h3 className="text-lg font-semibold text-(--santoto-primary) mb-4 drop-shadow">Resumen de Facultad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-800 font-medium">Docentes Activos</span>
                  <span className="text-sm font-semibold text-(--santoto-primary)">28/30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-800 font-medium">Planes en Tiempo</span>
                  <span className="text-sm font-semibold text-(--santoto-primary)">13/15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-800 font-medium">Calidad Promedio</span>
                  <span className="text-sm font-semibold text-(--santoto-primary)">4.2/5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}