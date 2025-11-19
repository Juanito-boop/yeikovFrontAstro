import { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Edit3, Trash2, Users, FileText } from 'lucide-react';
import { logoutUser } from '../../lib/auth';
import { fetchFacultades, crearFacultad, actualizarFacultad, eliminarFacultad as deleteFacultad, type Facultad as FacultadType } from './request';
import { toast } from '@pheralb/toast';
import { validateEmail } from '../../lib/validateEmail';
import { Header } from '../Header';

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

interface Facultad {
  id: string;
  nombre: string;
  decano?: string;
  emailDecano?: string;
  departamentos: string[];
  totalDocentes?: number;
  planesActivos?: number;
  fechaCreacion: string;
  estado: 'activa' | 'inactiva';
}

export function GestionFacultades() {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [facultadEditando, setFacultadEditando] = useState<string | null>(null);
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

    fetchFacultades(token)
      .then(data => {
        const mappedFacultades = data.map((f: FacultadType) => ({
          id: f.id,
          nombre: f.nombre,
          decano: f.decano || 'No asignado',
          emailDecano: f.emailDecano || 'No asignado',
          departamentos: f.departamentos || [],
          totalDocentes: f.cantidadDocentes || 0,
          planesActivos: 0,
          fechaCreacion: new Date().toLocaleDateString('es-ES'),
          estado: 'activa' as 'activa' | 'inactiva'
        }));
        setFacultades(mappedFacultades);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar facultades: ' + err.message });
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

  const [mostrarModal, setMostrarModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    decano: '',
    emailDecano: '',
    departamentos: [''],
    estado: 'activa' as Facultad['estado']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const departamentosFiltrados = formData.departamentos.filter(d => d.trim() !== '');

    // Validar email institucional
    if (formData.emailDecano) {
      const emailError = validateEmail(formData.emailDecano);
      if (emailError) {
        toast.error({ text: emailError });
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay sesión activa' });
      return;
    }

    try {
      if (facultadEditando) {
        // Actualizar facultad existente
        const facultadActualizada = await actualizarFacultad(token, facultadEditando, {
          nombre: formData.nombre,
          decano: formData.decano || undefined,
          emailDecano: formData.emailDecano || undefined,
          departamentos: departamentosFiltrados
        });

        setFacultades(facultades.map(f => f.id === facultadEditando ? {
          ...f,
          nombre: facultadActualizada.nombre,
          decano: facultadActualizada.decano || 'No asignado',
          emailDecano: facultadActualizada.emailDecano || 'No asignado',
          departamentos: facultadActualizada.departamentos || departamentosFiltrados,
          estado: formData.estado
        } : f));
        toast.success({ text: 'Facultad actualizada exitosamente' });
      } else {
        // Crear nueva facultad
        const nuevaFacultad = await crearFacultad(token, {
          nombre: formData.nombre,
          decano: formData.decano || undefined,
          emailDecano: formData.emailDecano || undefined,
          departamentos: departamentosFiltrados
        });

        const mapped: Facultad = {
          id: nuevaFacultad.id,
          nombre: nuevaFacultad.nombre,
          decano: nuevaFacultad.decano || 'No asignado',
          emailDecano: nuevaFacultad.emailDecano || 'No asignado',
          departamentos: nuevaFacultad.departamentos || departamentosFiltrados,
          totalDocentes: nuevaFacultad.cantidadDocentes || 0,
          planesActivos: 0,
          fechaCreacion: new Date().toLocaleDateString('es-ES'),
          estado: formData.estado
        };
        setFacultades([...facultades, mapped]);
        toast.success({ text: 'Facultad creada exitosamente' });
      }
      resetForm();
    } catch (err: any) {
      toast.error({ text: `Error: ${err.message}` });
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', decano: '', emailDecano: '', departamentos: [''], estado: 'activa' });
    setFacultadEditando(null);
    setMostrarModal(false);
  };

  const editarFacultad = (facultad: Facultad) => {
    setFacultadEditando(facultad.id);
    setFormData({ nombre: facultad.nombre, decano: facultad.decano || '', emailDecano: facultad.emailDecano || '', departamentos: [...facultad.departamentos, ''], estado: facultad.estado });
    setMostrarModal(true);
  };

  const eliminarFacultad = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta facultad?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay sesión activa' });
      return;
    }

    try {
      await deleteFacultad(token, id);
      setFacultades(facultades.filter(f => f.id !== id));
      toast.success({ text: 'Facultad eliminada exitosamente' });
    } catch (err: any) {
      toast.error({ text: `Error al eliminar: ${err.message}` });
    }
  };

  const agregarDepartamento = () => setFormData({ ...formData, departamentos: [...formData.departamentos, ''] });
  const actualizarDepartamento = (index: number, valor: string) => {
    const nuevos = [...formData.departamentos];
    nuevos[index] = valor;
    setFormData({ ...formData, departamentos: nuevos });
  };
  const eliminarDepartamento = (index: number) => {
    const nuevos = formData.departamentos.filter((_, i) => i !== index);
    setFormData({ ...formData, departamentos: nuevos.length > 0 ? nuevos : [''] });
  };

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
      {/* Header */}
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Facultades"
        onLogout={() => setUser(null)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--santoto-primary)"></div>
          </div>
        ) : (
          <>
            <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">Gestión de Facultades</h1>
                  <p className="text-slate-800 font-medium drop-shadow">Administra las facultades y sus departamentos</p>
                </div>
                <button onClick={() => setMostrarModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Nueva Facultad</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {facultades.map((facultad) => (
                <div key={facultad.id} className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 overflow-hidden">
                  <div className="bg-linear-to-r from-(--santoto-primary)/10 to-(--santoto-primary)/6 p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-(--santoto-primary) rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{facultad.nombre}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${facultad.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {facultad.estado}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => editarFacultad(facultad)} className="p-2 text-(--santoto-primary) hover:bg-(--santoto-primary)/10 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarFacultad(facultad.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Decano</h4>
                      <p className="text-slate-900 font-medium">{facultad.decano}</p>
                      <p className="text-sm text-slate-600">{facultad.emailDecano}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/40 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="w-5 h-5 text-(--santoto-primary)" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{facultad.totalDocentes}</p>
                        <p className="text-xs text-slate-600">Docentes</p>
                      </div>
                      <div className="text-center p-3 bg-white/40 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{facultad.planesActivos}</p>
                        <p className="text-xs text-slate-600">Planes</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Departamentos ({facultad.departamentos.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {facultad.departamentos.map((depto, index) => (
                          <span key={index} className="px-3 py-1 bg-(--santoto-primary)/10 text-(--santoto-primary) text-xs font-medium rounded-full">{depto}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">Creada el {facultad.fechaCreacion}</div>
                  </div>
                </div>
              ))}
            </div>

            {mostrarModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="backdrop-blur-md bg-white/90 rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-white/40">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">{facultadEditando ? 'Editar Facultad' : 'Nueva Facultad'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de la Facultad</label>
                      <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Decano</label>
                      <input type="text" value={formData.decano} onChange={(e) => setFormData({ ...formData, decano: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email del Decano (Institucional)</label>
                      <input
                        type="email"
                        value={formData.emailDecano}
                        onChange={(e) => setFormData({ ...formData, emailDecano: e.target.value })}
                        placeholder="ejemplo@usantoto.edu.co"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Solo dominios: @usantoto.edu.co, @ustatunja.edu.co</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Departamentos</label>
                      <div className="space-y-2">
                        {formData.departamentos.map((depto, index) => (
                          <div key={index} className="flex space-x-2">
                            <input type="text" value={depto} onChange={(e) => actualizarDepartamento(index, e.target.value)} placeholder={`Departamento ${index + 1}`} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent" />
                            {formData.departamentos.length > 1 && (
                              <button type="button" onClick={() => eliminarDepartamento(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={agregarDepartamento} className="w-full py-2 px-4 border border-dashed border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">+ Agregar Departamento</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                      <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as Facultad['estado'] })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent">
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
                    </div>
                    <div className="flex space-x-4 pt-4">
                      <button type="button" onClick={resetForm} className="flex-1 py-2 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                      <button type="submit" className="flex-1 py-2 px-4 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors">{facultadEditando ? 'Actualizar' : 'Crear'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}