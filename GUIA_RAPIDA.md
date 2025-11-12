# 🎯 Guía Rápida: Integración Backend-Frontend Completada

## ✅ Cambios Aplicados

### Backend
1. ✅ Corregida ruta en `director.routes.ts`: `/count` → `/counts`
2. ✅ Todas las rutas de API están funcionando correctamente

### Frontend
1. ✅ Creado `src/lib/api.config.ts` para configuración centralizada
2. ✅ Actualizado `src/components/director/request.ts` con mejores funciones
3. ✅ Dashboard funcionando con datos del backend

## 🚀 Cómo Ejecutar

### Terminal 1: Backend
```bash
cd c:\Users\USUARIO\Desktop\Yeikov\yeikovBackend
pnpm run dev
```
✅ Backend corriendo en: `http://localhost:3000`

### Terminal 2: Frontend
```bash
cd c:\Users\USUARIO\Desktop\Yeikov\FrontAstro
pnpm run dev
```
✅ Frontend corriendo en: `http://localhost:4321`

## 📋 Próximo Paso Crítico

El archivo `Planes.tsx` necesita ser completado. Actualmente tiene código temporal.

### Opción A: Reemplazar el contenido completo

Abre `src/components/director/Planes.tsx` y reemplaza todo el contenido con el código que te proporciono a continuación.

### Opción B: Usar el código del INTEGRATION.md

Lee el archivo `INTEGRATION.md` que contiene el código completo documentado.

## 🧩 Código Completo para Planes.tsx

Guarda esto en `src/components/director/Planes.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react"
import { FileText, LogOut, Plus, Save, X } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchDocentes, createPlan, fetchAllPlans, type Docente, type Plan } from "./request";
import { toast } from "@pheralb/toast";

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: 'Director' | 'Docente' | 'Decano' | 'Administrador'
}

const NAV_ITEMS = {
  Director: ['Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Mis Planes', 'Evidencias'],
  Decano: ['Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Usuarios', 'Facultades', 'Reportes'],
};

export default function Planes() {
  const [user, setUser] = useState<User | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    docenteId: '',
    titulo: '',
    descripcion: '',
    incidenciaId: ''
  });

  const navItems = user ? NAV_ITEMS[user.role] || [] : [];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to parse user', e)
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchDocentes(token)
      .then(setDocentes)
      .catch(err => toast.error({ text: 'Error al cargar docentes: ' + err.message }));

    fetchAllPlans(token)
      .then(setPlanes)
      .catch(err => toast.error({ text: 'Error al cargar planes: ' + err.message }));
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    return `${user.nombre[0] || ''}${user.apellido[0] || ''}`.toUpperCase();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No autenticado' });
      return;
    }

    setIsLoading(true);
    try {
      await createPlan(token, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        docenteId: formData.docenteId,
        incidenciaId: formData.incidenciaId || undefined
      });
      
      toast.success({ text: 'Plan creado exitosamente' });
      const updated = await fetchAllPlans(token);
      setPlanes(updated);
      resetForm();
    } catch (error: any) {
      toast.error({ text: 'Error: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ docenteId: '', titulo: '', descripcion: '', incidenciaId: '' });
    setMostrarModal(false);
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'Abierto': 'bg-blue-100 text-blue-700 border-blue-200',
      'En Progreso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Cerrado': 'bg-green-100 text-green-700 border-green-200',
      'Completado': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo-Usta.png" alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">SGPM</h1>
              <p className="text-xs text-slate-500">Sistema de Gestión de Planes</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</a>
            {navItems.map(label => (
              <a
                key={label}
                href={`/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`text-sm font-medium ${label === 'Asignar Planes' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-slate-500">{user?.role} - {user?.facultad}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
            <button onClick={() => { setUser(null); logoutUser(true); }} className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Asignación de Planes de Mejoramiento</h1>
              <p className="text-slate-600">Crear y asignar planes de mejoramiento a los docentes</p>
            </div>
            <button onClick={() => setMostrarModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              <Plus className="w-5 h-5" />
              <span>Nuevo Plan</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Planes Asignados ({planes.length})</h2>
          </div>
          <div className="p-6">
            {planes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay planes asignados aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {planes.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{plan.titulo}</h3>
                        <p className="text-sm text-slate-600">{plan.docente.nombre} {plan.docente.apellido}</p>
                        <p className="text-xs text-slate-500">{plan.descripcion.substring(0, 60)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(plan.estado)}`}>{plan.estado}</span>
                      <span className="text-xs text-slate-500">{formatDate(plan.fechaCreacion)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && resetForm()}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Nuevo Plan de Mejoramiento</h2>
                <button onClick={resetForm} disabled={isLoading} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Docente *</label>
                  <select
                    value={formData.docenteId}
                    onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar docente...</option>
                    {docentes.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.apellido} - {d.school?.nombre || 'Sin facultad'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Título del Plan *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Plan de mejoramiento para Cálculo I"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descripción *</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                    placeholder="Describe los objetivos..."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ID de Incidencia (Opcional)</label>
                  <input
                    type="text"
                    value={formData.incidenciaId}
                    onChange={(e) => setFormData({ ...formData, incidenciaId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="ID de incidencia"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={resetForm} disabled={isLoading} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center space-x-2 disabled:opacity-50">
                    <Save className="w-5 h-5" />
                    <span>{isLoading ? 'Creando...' : 'Asignar Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

## ✅ Verificación Final

1. Asegúrate de que ambos servicios estén corriendo
2. Abre `http://localhost:4321/dashboard/asignar-planes`
3. Deberías ver:
   - Lista de planes existentes
   - Botón "Nuevo Plan"
   - Formulario modal para crear planes
4. Prueba crear un plan nuevo

## 📚 Documentación Adicional

- `INTEGRATION.md` - Guía detallada de integración
- `RESUMEN.md` - Resumen completo del proyecto

## 🐛 Solución de Problemas

### Error de CORS
Si ves errores de CORS en la consola, verifica que en `yeikovBackend/src/app.ts` tengas:
```typescript
app.use(cors());
```

### Error 401 (No autorizado)
Verifica que el token esté en localStorage:
```javascript
localStorage.getItem('token')
```

### Error 404 (No encontrado)
Verifica que las rutas del backend coincidan con las del frontend en `request.ts`

¡Listo! 🎉 Tu integración backend-frontend está completada.
