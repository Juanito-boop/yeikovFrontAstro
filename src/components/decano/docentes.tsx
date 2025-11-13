import { useState, useEffect, useMemo } from 'react';
import { Users, Search, Mail, Phone, Calendar, FileText, TrendingUp, Award, LogOut } from 'lucide-react';
import { fetchDocentesFacultad, type Docente as DocenteType } from './request';
import { toast } from '@pheralb/toast';
import { logoutUser } from '../../lib/auth';

interface Docente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  school?: {
    id: string;
    nombre: string;
  };
}

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

export function DocentesFacultad() {
  const [user, setUser] = useState<User | null>(null);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];

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

  const initials = useMemo(() => {
      if (!user) return '';
      const n = (user.nombre || '').trim();
      const a = (user.apellido || '').trim();
      const first = n ? n[0] : '';
      const last = a ? a[0] : '';
      const result = `${first}${last}`.toUpperCase();
      return result || '';
    }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchDocentesFacultad(token)
      .then(data => {
        setDocentes(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar docentes: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  const docentesFiltrados = docentes.filter(docente => {
    const coincideBusqueda = docente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.email.toLowerCase().includes(busqueda.toLowerCase());

    return coincideBusqueda;
  });

  // Estadísticas generales
  const totalDocentes = docentes.length;

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
                        className={`text-sm font-medium cursor-pointer ${label === 'Docentes' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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
            Docentes de la Facultad
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Gestión y seguimiento del cuerpo docente de Ingeniería
          </p>
        </div>

        {/* Estadísticas Generales */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12 mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{totalDocentes}</p>
                <p className="text-sm text-slate-600">Total Docentes</p>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{docentesFiltrados.length}</p>
                <p className="text-sm text-slate-600">Resultados de búsqueda</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar docentes por nombre, apellido o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Docentes */}
        {docentesFiltrados.length === 0 ? (
          <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              No se encontraron docentes
            </h3>
            <p className="text-slate-500">
              {busqueda ? 'Intenta con otro término de búsqueda' : 'No hay docentes registrados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {docentesFiltrados.map((docente) => (
              <div key={docente.id} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{docente.nombre} {docente.apellido}</h3>
                      {docente.school && (
                        <p className="text-sm text-slate-600">{docente.school.nombre}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{docente.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
