import { useState, useEffect, useMemo } from 'react';
import { FileText, CheckCircle, XCircle, MessageSquare, Calendar, Eye, Edit3 } from 'lucide-react';
import { fetchPlanesDecano, aprobarPlan, rechazarPlan, type Plan as PlanType } from './request';
import { toast } from '@pheralb/toast';
import { logoutUser } from '../../lib/auth';
import { Header } from '../Header';

interface Plan {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  docente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    school?: {
      id: string;
      nombre: string;
    };
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

export function PlanesRevision() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [decision, setDecision] = useState<'aprobar' | 'rechazar' | 'modificar' | null>(null);
  const [sugerencias, setSugerencias] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
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
  // Load planes from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchPlanesDecano(token)
      .then(data => {
        setPlanes(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar planes: ' + err.message });
        setIsLoading(false);
      });
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

  const planesFiltrados = planes.filter(plan =>
    filtroEstado === 'todos' || plan.estado === filtroEstado
  );

  const handleDecision = async () => {
    if (!selectedPlan || !decision) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay sesión activa' });
      return;
    }

    setProcessingPlan(selectedPlan.id);

    try {
      if (decision === 'aprobar') {
        await aprobarPlan(token, selectedPlan.id, sugerencias);
        toast.success({ text: 'Plan aprobado exitosamente' });
      } else if (decision === 'rechazar') {
        await rechazarPlan(token, selectedPlan.id, sugerencias);
        toast.success({ text: 'Plan rechazado' });
      }

      // Reload planes
      const updatedPlanes = await fetchPlanesDecano(token);
      setPlanes(updatedPlanes);

      setSelectedPlan(null);
      setDecision(null);
      setSugerencias('');
    } catch (err: any) {
      toast.error({ text: 'Error: ' + err.message });
    } finally {
      setProcessingPlan(null);
    }
  };


  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente_decano': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'aprobado_decano': return 'bg-green-100 text-green-700 border-green-200';
      case 'rechazado_decano': return 'bg-red-100 text-red-700 border-red-200';
      case 'modificado_decano': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
        activeItem="Revisar Planes"
        onLogout={() => setUser(null)}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
          <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
            Revisión de Planes de Mejoramiento
          </h1>
          <p className="text-slate-800 font-medium drop-shadow">
            Revisa, aprueba o rechaza los planes de mejoramiento de tu facultad
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['todos', 'pendiente_decano', 'aprobado_decano', 'rechazado_decano', 'modificado_decano'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${filtroEstado === estado
                  ? 'bg-(--santoto-primary) text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {estado === 'todos' ? 'Todos' : estado.replace('_', ' ').replace('decano', '').trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Planes */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : planesFiltrados.length === 0 ? (
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No hay planes {filtroEstado !== 'todos' && `con estado "${filtroEstado}"`}
                </h3>
                <p className="text-slate-500">
                  {filtroEstado !== 'todos' ? 'Intenta seleccionar otro filtro' : 'No hay planes para revisar en este momento'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {planesFiltrados.map((plan) => (
                  <div
                    key={plan.id}
                    className={`backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${selectedPlan?.id === plan.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-white/40'
                      }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {plan.titulo}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Docente: {plan.docente.nombre} {plan.docente.apellido}
                          </p>
                          {plan.docente.school && (
                            <p className="text-xs text-slate-500">
                              Facultad: {plan.docente.school.nombre}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(plan.estado)}`}>
                          {plan.estado.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {plan.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Creado: {new Date(plan.fechaCreacion).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Ver detalles</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel de Revisión */}
          <div className="lg:col-span-1">
            {selectedPlan ? (
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 sticky top-8">
                <div className="p-6 border-b border-white/30">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Revisar Plan
                  </h3>
                  <p className="text-sm text-slate-600">
                    {selectedPlan.titulo}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Docente: {selectedPlan.docente.nombre} {selectedPlan.docente.apellido}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Información del Plan */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descripción
                      </label>
                      <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                        {selectedPlan.descripcion}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Fecha Creación
                        </label>
                        <p className="text-sm text-slate-600">{new Date(selectedPlan.fechaCreacion).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Estado Actual
                        </label>
                        <p className="text-sm text-slate-600">{selectedPlan.estado}</p>
                      </div>
                    </div>

                    {selectedPlan.docente.school && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Facultad
                        </label>
                        <p className="text-sm text-slate-600">{selectedPlan.docente.school.nombre}</p>
                      </div>
                    )}
                  </div>

                  {/* Decisión */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Decisión
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDecision('aprobar')}
                        disabled={processingPlan !== null}
                        className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${decision === 'aprobar'
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-green-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Aprobar</span>
                      </button>

                      <button
                        onClick={() => setDecision('rechazar')}
                        disabled={processingPlan !== null}
                        className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${decision === 'rechazar'
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-red-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>

                  {/* Comentarios */}
                  {decision && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {decision === 'aprobar' ? 'Comentarios (opcional)' : 'Razón del rechazo (requerido)'}
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute top-3 left-3 w-5 h-5 text-slate-400" />
                        <textarea
                          value={sugerencias}
                          onChange={(e) => setSugerencias(e.target.value)}
                          placeholder={decision === 'aprobar' ? 'Agrega comentarios adicionales...' : 'Explica la razón del rechazo...'}
                          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 transition-all duration-200"
                          required={decision === 'rechazar'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botón de Envío */}
                  <button
                    onClick={handleDecision}
                    disabled={!decision || (decision === 'rechazar' && !sugerencias.trim()) || processingPlan !== null}
                    className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {processingPlan ? 'Procesando...' : (decision === 'aprobar' ? 'Aprobar Plan' : decision === 'rechazar' ? 'Rechazar Plan' : 'Enviar Decisión')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-8 text-center">
                <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Selecciona un Plan
                </h3>
                <p className="text-slate-600">
                  Haz clic en un plan de la lista para revisarlo y tomar una decisión
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}