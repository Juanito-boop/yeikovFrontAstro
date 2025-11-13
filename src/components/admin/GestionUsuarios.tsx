import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit3, Trash2, Shield, Crown, Building2, User, Search, LogOut } from 'lucide-react';
import { logoutUser } from '../../lib/auth';
import { fetchUsuarios, crearUsuario, fetchFacultades, type Usuario as UsuarioType, type Facultad } from './request';
import { toast } from '@pheralb/toast';

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

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  facultad?: string;
  departamento?: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  ultimoAcceso: string;
}

export function GestionUsuarios() {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
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
      fetchUsuarios(token),
      fetchFacultades(token)
    ])
      .then(([usuariosData, facultadesData]) => {
        const mappedUsuarios = usuariosData.map((u: UsuarioType) => ({
          id: u.id,
          nombre: `${u.nombre} ${u.apellido}`,
          email: u.email,
          rol: u.role || 'docente',
          facultad: u.school?.nombre,
          departamento: '',
          estado: 'activo' as 'activo' | 'inactivo',
          fechaCreacion: 'N/A',
          ultimoAcceso: 'N/A'
        }));
        setUsuarios(mappedUsuarios);
        setFacultades(facultadesData);
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

  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'docente' as Usuario['rol'],
    facultad: '',
    departamento: '',
    estado: 'activo' as Usuario['estado']
  });

  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideBusqueda = usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'todos' || usuario.rol === filtroRol;
    const coincideEstado = filtroEstado === 'todos' || usuario.estado === filtroEstado;

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return <Shield className="w-5 h-5 text-red-600" />;
      case 'decano': return <Crown className="w-5 h-5 text-purple-600" />;
      case 'director_academico': return <Building2 className="w-5 h-5 text-(--santoto-primary)" />;
      default: return <User className="w-5 h-5 text-(--santoto-primary)" />;
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'decano': return 'Decano';
      case 'director_academico': return 'Director Académico';
      default: return 'Docente';
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'decano': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'director_academico': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-(--santoto-primary)/10 text-(--santoto-primary) border-(--santoto-primary)/20';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error({ text: 'No hay sesión activa' });
      return;
    }

    if (usuarioEditando) {
      // TODO: Implementar endpoint de edición en el backend
      toast.info({ text: 'La edición de usuarios aún no está implementada' });
      return;
    }

    // Validaciones
    if (!formData.nombre || !formData.email) {
      toast.error({ text: 'Nombre y email son obligatorios' });
      return;
    }

    // Solo validar facultad para roles que la requieren
    if (['docente', 'decano', 'director_academico'].includes(formData.rol) && !formData.facultad) {
      toast.error({ text: 'Debe seleccionar una facultad para este rol' });
      return;
    }

    try {
      // Separar nombre y apellido
      const nombreParts = formData.nombre.trim().split(' ');
      const nombre = nombreParts[0];
      const apellido = nombreParts.slice(1).join(' ') || nombreParts[0];

      await crearUsuario(token, {
        nombre,
        apellido,
        email: formData.email,
        password: 'temporal123', // Password temporal que el usuario debe cambiar
        schoolId: formData.facultad,
        role: formData.rol
      });

      // Recargar usuarios
      const usuariosActualizados = await fetchUsuarios(token);
      const mappedUsuarios = usuariosActualizados.map((u: UsuarioType) => ({
        id: u.id,
        nombre: `${u.nombre} ${u.apellido}`,
        email: u.email,
        rol: u.role || 'docente',
        facultad: u.school?.nombre,
        departamento: '',
        estado: 'activo' as 'activo' | 'inactivo',
        fechaCreacion: 'N/A',
        ultimoAcceso: 'N/A'
      }));
      setUsuarios(mappedUsuarios);

      toast.success({ text: 'Usuario creado exitosamente' });
      resetForm();
    } catch (error: any) {
      toast.error({ text: 'Error al crear usuario: ' + error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      rol: 'docente',
      facultad: '',
      departamento: '',
      estado: 'activo'
    });
    setUsuarioEditando(null);
    setMostrarModal(false);
  };

  const editarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      facultad: usuario.facultad || '',
      departamento: usuario.departamento || '',
      estado: usuario.estado
    });
    setMostrarModal(true);
  };

  const eliminarUsuario = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
    }
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
                  className={`text-sm font-medium cursor-pointer ${label === 'Usuarios' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
                Gestión de Usuarios
              </h1>
              <p className="text-slate-800 font-medium drop-shadow">
                Administra usuarios, roles y permisos del sistema
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
              />
            </div>

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
            >
              <option value="todos">Todos los roles</option>
              <option value="docente">Docentes</option>
              <option value="decano">Decanos</option>
              <option value="director_academico">Directores</option>
              <option value="admin">Administradores</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 border-b border-white/30">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Usuario</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Rol</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Facultad/Depto</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Estado</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Último Acceso</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-(--santoto-primary) rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {usuario.nombre.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{usuario.nombre}</p>
                          <p className="text-sm text-slate-600">{usuario.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getRolIcon(usuario.rol)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRolColor(usuario.rol)}`}>
                          {getRolLabel(usuario.rol)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {usuario.facultad && (
                          <p className="text-slate-900">{usuario.facultad}</p>
                        )}
                        {usuario.departamento && (
                          <p className="text-slate-600">{usuario.departamento}</p>
                        )}
                        {!usuario.facultad && !usuario.departamento && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${usuario.estado === 'activo'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {usuario.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">hace {usuario.ultimoAcceso}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editarUsuario(usuario)}
                          className="p-2 text-(--santoto-primary) hover:bg-(--santoto-primary)/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarUsuario(usuario.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Crear/Editar Usuario */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="backdrop-blur-md bg-white/90 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-white/40">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as Usuario['rol'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="docente">Docente</option>
                    <option value="decano">Decano</option>
                    <option value="director_academico">Director Académico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Facultad {['docente', 'decano', 'director_academico'].includes(formData.rol) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={formData.facultad}
                    onChange={(e) => setFormData({ ...formData, facultad: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--santoto-primary) focus:border-transparent"
                    required={['docente', 'decano', 'director_academico'].includes(formData.rol)}
                  >
                    <option value="">Seleccione una facultad</option>
                    {facultades.map((facultad) => (
                      <option key={facultad.id} value={facultad.id}>
                        {facultad.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.rol === 'docente' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as Usuario['estado'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-(--santoto-primary) text-white rounded-xl hover:bg-(--santoto-primary)/90 transition-colors"
                  >
                    {usuarioEditando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}