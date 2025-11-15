// ...existing code...
import { Users, FileText, AlertTriangle, CheckCircle, Clock, Settings, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { logoutUser } from '../../lib/auth';
import { fetchAdminStats, type AdminStats } from './request';
import { toast } from '@pheralb/toast';
import { ActividadRecienteWidget } from '../ActividadRecienteWidget';
import { fetchAlertas, fetchDepartamentos, type Alerta, type DepartamentoStats } from '../../lib/dashboard.service';

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
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoStats[]>([]);
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

    Promise.all([
      fetchAdminStats(token),
      fetchAlertas(),
      fetchDepartamentos()
    ])
      .then(([statsData, alertasData, departamentosData]) => {
        setStats(statsData);
        setAlertas(alertasData);
        setDepartamentos(departamentosData);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar datos: ' + err.message });
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
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
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
              <a href="/dashboard/usuarios" className="block group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Gestionar Usuarios
                    </h3>
                    <p className="text-slate-600 text-sm">Administrar usuarios del sistema</p>
                  </div>
                </div>
              </a>

              <a href="/dashboard/facultades" className="block group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Gestionar Facultades
                    </h3>
                    <p className="text-slate-600 text-sm">Configurar facultades y escuelas</p>
                  </div>
                </div>
              </a>
            </div>

            {/* Recent Activity - Logs de Auditoría */}
            <ActividadRecienteWidget limit={10} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Department Overview */}
            <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
              <div className="p-6 border-b border-white/30">
                <h3 className="text-lg font-semibold text-(--santoto-primary)">Resumen por Departamento</h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-600">Cargando departamentos...</p>
                  </div>
                ) : departamentos.length > 0 ? (
                  <div className="space-y-4">
                    {departamentos.map((dept) => {
                      const progreso = dept.totalPlanes > 0
                        ? (dept.planesCompletados / dept.totalPlanes) * 100
                        : 0;

                      return (
                        <div key={dept.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">{dept.nombre}</p>
                            <span className="text-xs text-slate-500">{dept.totalPlanes} planes</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-linear-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>{dept.planesCompletados} completados</span>
                            <span>{dept.planesActivos} activos</span>
                            <span>{dept.planesPendientes} pendientes</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {dept.totalDocentes} docentes
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-600">No hay departamentos registrados</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Alerts */}
            <div className="backdrop-blur-md bg-linear-to-br from-orange-500/30 to-red-500/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-700" />
                <h3 className="text-lg font-semibold text-orange-900 drop-shadow">Alertas del Sistema</h3>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="p-3 bg-white/60 rounded-xl">
                    <p className="text-sm text-orange-700">Cargando alertas...</p>
                  </div>
                ) : alertas.length > 0 ? (
                  alertas.map((alerta, index) => (
                    <div
                      key={index}
                      className={`p-3 bg-white/60 rounded-xl border-l-4 ${alerta.prioridad === 'alta' ? 'border-red-500' :
                        alerta.prioridad === 'media' ? 'border-orange-500' :
                          'border-green-500'
                        }`}
                    >
                      <p className="text-sm font-medium text-orange-900">{alerta.mensaje}</p>
                      <p className="text-xs text-orange-700">{alerta.detalle}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-white/60 rounded-xl border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-900">Sistema operando normalmente</p>
                    <p className="text-xs text-green-700">No hay alertas en este momento</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}