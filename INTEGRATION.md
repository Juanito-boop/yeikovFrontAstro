# Integración Backend-Frontend Astro

## Estado Actual

✅ **Backend configurado:**
- Rutas de director funcionando en `/api/director/counts`
- Rutas de planes en `/api/plans`
- Rutas de docentes en `/api/docentes`
- Puerto: 3000

✅ **Frontend Astro configurado:**
- API requests en `src/components/director/request.ts`
- Componentes de director creados
- Configuración de API en `src/lib/api.config.ts`

## Estructura de Archivos

### Backend (yeikovBackend)
```
src/
├── controllers/
│   ├── director.controller.ts  ✅
│   ├── plan.controller.ts
│   └── ...
├── routes/
│   ├── director.routes.ts  ✅ (ruta: /api/director/counts)
│   ├── plan.routes.ts
│   └── docente.routes.ts
├── services/
│   ├── director.service.ts  ✅
│   └── ...
└── app.ts  ✅
```

### Frontend (FrontAstro)
```
src/
├── components/
│   └── director/
│       ├── Dashboard.tsx  ✅
│       ├── Planes.tsx  ⚠️ (necesita ser recreado)
│       └── request.ts  ✅
├── lib/
│   ├── api.config.ts  ✅ (nuevo)
│   └── auth.ts
└── pages/
    └── dashboard/
        └── asignar-planes.astro
```

## Pasos para Completar la Integración

### 1. Verificar que el Backend esté corriendo

```bash
cd yeikovBackend
pnpm install
pnpm run dev
```

El backend debería estar corriendo en `http://localhost:3000`

### 2. Instalar dependencias del Frontend

```bash
cd FrontAstro
pnpm install
```

### 3. Crear el componente Planes.tsx

El componente `Planes.tsx` fue eliminado y necesita ser recreado. Aquí está el código:

```tsx
import { useEffect, useMemo, useState, useRef } from "react"
import { FileText, LogOut, Plus, Save, X } from 'lucide-react';
import { logoutUser } from "../../lib/auth";
import { fetchDocentes, createPlan, fetchAllPlans, type Docente, type Plan } from "./request";
import { toast } from "@pheralb/toast";

// ... (ver código completo en el mensaje)
```

### 4. Verificar las rutas del backend

Las siguientes rutas deben estar disponibles:

- `GET /api/director/counts` ✅ - Obtiene conteos de director
- `GET /api/docentes` ✅ - Lista todos los docentes
- `GET /api/docentes?schoolId=<id>` - Lista docentes por facultad
- `POST /api/plans` - Crear un nuevo plan
- `GET /api/plans/all` - Listar todos los planes

### 5. Probar la integración

1. Inicia el backend:
```bash
cd yeikovBackend
pnpm run dev
```

2. Inicia el frontend:
```bash
cd FrontAstro
pnpm run dev
```

3. Abre el navegador en `http://localhost:4321` (o el puerto de Astro)

4. Navega a la sección de "Asignar Planes" del dashboard de director

### 6. Debugging

Si hay problemas de CORS, verifica que el backend tenga:

```typescript
// En app.ts
app.use(cors({
  origin: 'http://localhost:4321', // Puerto del frontend Astro
  credentials: true
}));
```

## Endpoints disponibles del Backend

### Director
- `GET /api/director/counts` - Conteos generales

### Docentes
- `GET /api/docentes` - Lista todos los docentes
- `GET /api/docentes?schoolId=<id>` - Docentes por facultad

### Planes
- `POST /api/plans` - Crear plan
- `GET /api/plans/all` - Listar planes
- `GET /api/plans/:id` - Obtener plan específico
- `POST /api/plans/:id/aprobar` - Aprobar plan
- `POST /api/plans/:id/cerrar` - Cerrar plan

### Schools (Facultades)
- `GET /api/schools` - Listar facultades

## Variables de Entorno

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DB_HOST=...
JWT_SECRET=...
```

### Frontend (.env)
```
PUBLIC_API_URL=http://localhost:3000/api
```

## Próximos pasos

1. ✅ Corregir ruta `/count` a `/counts` en backend
2. ⚠️ Recrear componente `Planes.tsx`
3. 🔄 Implementar manejo de errores más robusto
4. 🔄 Agregar validación de formularios
5. 🔄 Implementar estados de carga
6. 🔄 Agregar paginación en lista de planes
7. 🔄 Implementar filtros y búsqueda

## Notas

- El token JWT se almacena en `localStorage` con la clave `'token'`
- El usuario se almacena en `localStorage` con la clave `'user'`
- Todas las rutas de API requieren autenticación con Bearer token
- Los errores se muestran usando la librería `@pheralb/toast`
