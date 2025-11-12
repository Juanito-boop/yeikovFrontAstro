// ...existing code...
import { Users, FileText, AlertTriangle, CheckCircle, Clock, Settings, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { logoutUser } from '../../lib/auth';
import { fetchAdminStats, type AdminStats } from './request';
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

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchAdminStats(token)
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar estadísticas: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    return `${first}${last}`.toUpperCase() || '';
  }, [user]);

  const statsData = stats ? [
    { label: 'Total Docentes', value: stats.totalDocentes.toString(), icon: Users, color: 'blue', change: '+0%' },
    { label: 'Planes Activos', value: stats.planesActivos.toString(), icon: FileText, color: 'green', change: '+0%' },
    { label: 'Pendientes', value: stats.planesPendientes.toString(), icon: Clock, color: 'yellow', change: '0%' },
    { label: 'Completados', value: stats.planesCompletados.toString(), icon: CheckCircle, color: 'emerald', change: '+0%' },
  ] : [];

  const recentActions = [
    { action: 'Plan asignado a Diego Vela', subject: 'Machine Learning', time: '30 min', type: 'assignment' },
    { action: 'Evidencia aprobada', subject: 'Base de Datos', time: '1 hora', type: 'approval' },
    { action: 'Nuevo docente registrado', subject: 'Ana García', time: '2 horas', type: 'user' },
    { action: 'Plan completado', subject: 'Algoritmos', time: '3 horas', type: 'completion' },
  ];

  const departmentStats = [
    { name: 'Ingeniería de Sistemas', plans: 12, completed: 8, pending: 4 },
    { name: 'Matemáticas', plans: 8, completed: 6, pending: 2 },
    { name: 'Física', plans: 6, completed: 4, pending: 2 },
  ];

  return (
    <div
      className="min-h-screen py-8"
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
            Panel de Administración
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Gestión completa del sistema de planes de mejoramiento
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            statsData.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'from-blue-600 to-blue-700',
                green: 'from-emerald-600 to-emerald-700',
                yellow: 'from-amber-600 to-amber-700',
                emerald: 'from-teal-600 to-teal-700',
              };

              return (
                <div key={index} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
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
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions & Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Gestionar Docentes
                    </h3>
                    <p className="text-slate-600 text-sm">Administrar usuarios del sistema</p>
                  </div>
                </div>
              </div>

              <div className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Configuración
                    </h3>
                    <p className="text-slate-600 text-sm">Ajustes del sistema</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
              <div className="p-6 border-b border-white/30">
                <h2 className="text-lg font-semibold text-(--santoto-primary)">Actividad Reciente del Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/40 transition-colors duration-200">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.type === 'assignment' ? 'bg-(--santoto-primary)/20 text-(--santoto-primary)' :
                        action.type === 'approval' ? 'bg-green-500/20 text-green-700' :
                          action.type === 'user' ? 'bg-purple-500/20 text-purple-700' :
                            'bg-emerald-500/20 text-emerald-700'
                        }`}>
                        {action.type === 'assignment' ? <FileText className="w-5 h-5" /> :
                          action.type === 'approval' ? <CheckCircle className="w-5 h-5" /> :
                            action.type === 'user' ? <Users className="w-5 h-5" /> :
                              <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{action.action}</p>
                        <p className="text-sm text-slate-700">{action.subject}</p>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">hace {action.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Department Overview */}
            <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
              <div className="p-6 border-b border-white/30">
                <h3 className="text-lg font-semibold text-(--santoto-primary)">Resumen por Departamento</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {departmentStats.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{dept.name}</p>
                        <span className="text-xs text-slate-500">{dept.plans} planes</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(dept.completed / dept.plans) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{dept.completed} completados</span>
                        <span>{dept.pending} pendientes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="backdrop-blur-md bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-700" />
                <h3 className="text-lg font-semibold text-orange-900 drop-shadow">Alertas del Sistema</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white/60 rounded-xl">
                  <p className="text-sm font-medium text-orange-900">3 planes próximos a vencer</p>
                  <p className="text-xs text-orange-700">Requieren atención inmediata</p>
                </div>
                <div className="p-3 bg-white/60 rounded-xl">
                  <p className="text-sm font-medium text-orange-900">2 evidencias sin revisar</p>
                  <p className="text-xs text-orange-700">Pendientes de aprobación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}