# 📡 Funciones de API Implementadas

## ✅ Estado: COMPLETAS

Todas las funciones de API del backend han sido implementadas en `src/components/director/request.ts`

---

## 📋 Lista Completa de Funciones

### 🎯 DIRECTOR (1 función)
- ✅ `fetchDirectorCounts(token)` - Obtener conteos generales del director

### 📚 PLANES (5 funciones)
- ✅ `createPlan(token, body)` - Crear nuevo plan
- ✅ `fetchAllPlans(token)` - Listar todos los planes
- ✅ `fetchPlanById(token, planId)` - Obtener plan específico
- ✅ `aprobarPlan(token, planId, aprobado, comentarios?)` - Aprobar/rechazar plan
- ✅ `cerrarPlan(token, planId)` - Cerrar plan

### 👨‍🏫 DOCENTES (1 función)
- ✅ `fetchDocentes(token, schoolId?)` - Listar docentes (opcional: filtrar por facultad)

### 🏫 SCHOOLS (1 función)
- ✅ `fetchSchools(token)` - Listar todas las facultades

### ⚠️ INCIDENCIAS (3 funciones)
- ✅ `createIncidencia(token, data)` - Crear incidencia
- ✅ `fetchIncidencias(token)` - Listar incidencias
- ✅ `updateIncidenciaEstado(token, incidenciaId, estado)` - Actualizar estado

### ⚡ ACCIONES (3 funciones)
- ✅ `createAccion(token, data)` - Crear acción
- ✅ `fetchAccionesByPlan(token, planId)` - Listar acciones por plan
- ✅ `updateAccionEstado(token, accionId, estado)` - Actualizar estado

### 📎 EVIDENCIAS (2 funciones)
- ✅ `uploadEvidencia(token, accionId, file, descripcion?)` - Subir evidencia (archivo)
- ✅ `fetchEvidenciasByAccion(token, accionId)` - Listar evidencias por acción

### 🔔 NOTIFICACIONES (3 funciones)
- ✅ `fetchNotifications(token)` - Obtener notificaciones del usuario
- ✅ `markNotificationAsRead(token, notificationId)` - Marcar como leída
- ✅ `markAllNotificationsAsRead(token)` - Marcar todas como leídas

### ✔️ APROBACIONES (2 funciones)
- ✅ `fetchAprobacionesByPlan(token, planId)` - Listar aprobaciones de un plan
- ✅ `deleteAprobacion(token, aprobacionId)` - Eliminar aprobación

---

## 📊 TOTAL: 21 funciones implementadas

---

## 🔍 Detalles de Uso

### Ejemplo 1: Crear un plan
```typescript
import { createPlan } from './request';

const token = localStorage.getItem('token') || '';
const newPlan = await createPlan(token, {
  titulo: "Plan de mejoramiento Cálculo I",
  descripcion: "Mejorar índice de aprobación",
  docenteId: "docente-uuid",
  incidenciaId: "incidencia-uuid" // opcional
});
```

### Ejemplo 2: Subir evidencia
```typescript
import { uploadEvidencia } from './request';

const token = localStorage.getItem('token') || '';
const file = document.querySelector('input[type="file"]').files[0];

const evidencia = await uploadEvidencia(
  token,
  "accion-uuid",
  file,
  "Evidencia de la actividad realizada"
);
```

### Ejemplo 3: Aprobar un plan
```typescript
import { aprobarPlan } from './request';

const token = localStorage.getItem('token') || '';
await aprobarPlan(
  token,
  "plan-uuid",
  true, // aprobado
  "Plan aprobado con observaciones menores"
);
```

### Ejemplo 4: Gestionar notificaciones
```typescript
import { 
  fetchNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from './request';

const token = localStorage.getItem('token') || '';

// Obtener todas las notificaciones
const notifications = await fetchNotifications(token);

// Marcar una como leída
await markNotificationAsRead(token, "notification-uuid");

// Marcar todas como leídas
await markAllNotificationsAsRead(token);
```

---

## 🔗 Mapeo Backend → Frontend

| Backend Route | Frontend Function | Método |
|--------------|-------------------|--------|
| `GET /api/director/counts` | `fetchDirectorCounts()` | GET |
| `POST /api/plans` | `createPlan()` | POST |
| `GET /api/plans/all` | `fetchAllPlans()` | GET |
| `GET /api/plans/:id` | `fetchPlanById()` | GET |
| `POST /api/plans/:id/aprobar` | `aprobarPlan()` | POST |
| `POST /api/plans/:id/cerrar` | `cerrarPlan()` | POST |
| `GET /api/docentes` | `fetchDocentes()` | GET |
| `GET /api/schools` | `fetchSchools()` | GET |
| `POST /api/incidencias` | `createIncidencia()` | POST |
| `GET /api/incidencias` | `fetchIncidencias()` | GET |
| `PATCH /api/incidencias/:id/estado` | `updateIncidenciaEstado()` | PATCH |
| `POST /api/acciones` | `createAccion()` | POST |
| `GET /api/acciones/plan/:planId` | `fetchAccionesByPlan()` | GET |
| `PATCH /api/acciones/:id/estado` | `updateAccionEstado()` | PATCH |
| `POST /api/evidencias` | `uploadEvidencia()` | POST |
| `GET /api/evidencias/accion/:accionId` | `fetchEvidenciasByAccion()` | GET |
| `GET /api/notifications` | `fetchNotifications()` | GET |
| `PUT /api/notifications/:id/read` | `markNotificationAsRead()` | PUT |
| `PUT /api/notifications/read-all` | `markAllNotificationsAsRead()` | PUT |
| `GET /api/aprobaciones/plan/:planId` | `fetchAprobacionesByPlan()` | GET |
| `DELETE /api/aprobaciones/:id` | `deleteAprobacion()` | DELETE |

---

## 📝 Interfaces TypeScript Disponibles

```typescript
// Disponibles en request.ts
interface DirectorCountsRequest { ... }
interface PlanesPorEscuela { ... }
interface CreatePlan { ... }
interface Docente { ... }
interface Plan { ... }
interface School { ... }
interface Incidencia { ... }
interface Accion { ... }
interface Evidencia { ... }
interface Notification { ... }
interface Aprobacion { ... }
```

---

## ⚡ Características

- ✅ Todas las funciones son async/await
- ✅ Manejo de errores con try/catch
- ✅ TypeScript con tipos completos
- ✅ Headers de autenticación incluidos
- ✅ Soporte para FormData (evidencias)
- ✅ Parámetros opcionales documentados

---

## 🚀 Próximos Pasos

1. **Usar las funciones en los componentes:**
   - Dashboard.tsx ✅ (ya usa `fetchDirectorCounts`)
   - Planes.tsx ✅ (ya usa `createPlan`, `fetchAllPlans`, `fetchDocentes`)
   - Seguimiento.tsx → usar `fetchAccionesByPlan`, `updateAccionEstado`
   - Métricas.tsx → usar `fetchDirectorCounts`, `fetchAllPlans`
   - Estrategia.tsx → usar `fetchIncidencias`, `createIncidencia`

2. **Implementar componentes de docente:**
   - Usar `fetchEvidenciasByAccion`, `uploadEvidencia`

3. **Sistema de notificaciones:**
   - Crear componente de notificaciones
   - Usar `fetchNotifications`, `markNotificationAsRead`

---

## 📌 Notas Importantes

- Todas las funciones requieren un token JWT válido
- El token se obtiene de `localStorage.getItem('token')`
- Las funciones lanzan errores que deben ser capturados con try/catch
- Para evidencias, usar FormData (no JSON)
- Las fechas vienen en formato ISO 8601 desde el backend

---

✅ **TODAS LAS FUNCIONES DEL BACKEND ESTÁN IMPLEMENTADAS**
