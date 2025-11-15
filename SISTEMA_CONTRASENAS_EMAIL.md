# Sistema de Cambio de Contraseña y Notificación por Email

## 📧 Resumen de Implementación

Se han implementado dos funcionalidades críticas para mejorar la seguridad y experiencia de usuario:

1. **Endpoint de Cambio de Contraseña** (`/api/auth/change-password`)
2. **Envío Automático de Email** con contraseña temporal al crear usuarios

---

## 🔐 1. Endpoint de Cambio de Contraseña

### Backend - Nueva Ruta
**Archivo**: `yeikovBackend/src/routes/auth.routes.ts`

```typescript
POST /api/auth/change-password
```

**Headers Requeridos**:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "currentPassword": "contraseñaActual123",
  "newPassword": "nuevaContraseña456",
  "confirmPassword": "nuevaContraseña456"
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Respuestas de Error**:
- `400`: La contraseña actual es incorrecta
- `400`: Las contraseñas no coinciden
- `400`: La nueva contraseña debe ser diferente a la actual
- `401`: No autenticado

---

### Schema de Validación
**Archivo**: `yeikovBackend/src/schemas/auth.schema.ts`

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});
```

**Validaciones**:
- ✅ Contraseña actual requerida
- ✅ Nueva contraseña mínimo 6 caracteres
- ✅ Confirmación debe coincidir con nueva contraseña
- ✅ Nueva contraseña debe ser diferente a la actual
- ✅ Hash seguro con bcrypt

---

### Servicio de Autenticación
**Archivo**: `yeikovBackend/src/services/auth.service.ts`

#### Método `changePassword()`
```typescript
async changePassword(
  userId: string,
  data: ChangePasswordInput
): Promise<{ message: string }>
```

**Proceso**:
1. Busca el usuario por ID
2. Verifica que la contraseña actual sea correcta
3. Valida que la nueva contraseña sea diferente
4. Hashea la nueva contraseña con bcrypt
5. Actualiza la contraseña en la base de datos
6. Envía notificación al usuario por email
7. Retorna mensaje de confirmación

**Seguridad**:
- 🔒 Requiere autenticación con JWT
- 🔒 Verifica contraseña actual antes de cambiar
- 🔒 Hash bcrypt con salt rounds = 10
- 🔒 No permite reutilizar la contraseña actual
- 📧 Notificación automática por email

---

## 📧 2. Envío de Email con Contraseña Temporal

### Actualización del Registro
**Archivo**: `yeikovBackend/src/services/auth.service.ts`

#### Método `register()` Mejorado
```typescript
async register(
  data: RegisterInput, 
  sendWelcomeEmail: boolean = false
): Promise<{ user: User; token: string }>
```

**Nuevo Parámetro**:
- `sendWelcomeEmail`: Booleano que activa el envío del email de bienvenida

---

### Email de Bienvenida
**Método**: `sendWelcomeEmail(user, temporalPassword)`

#### Contenido del Email
```html
┌──────────────────────────────────────────────┐
│           ¡Bienvenido al SGPM!               │
├──────────────────────────────────────────────┤
│                                              │
│ Estimado/a Juan Pérez,                       │
│                                              │
│ Tu cuenta ha sido creada exitosamente.      │
│                                              │
│ ┌────────────────────────────────────┐      │
│ │ Credenciales de Acceso             │      │
│ │                                    │      │
│ │ Usuario: juan.perez@universidad.edu│      │
│ │ Contraseña: temporal123            │      │
│ └────────────────────────────────────┘      │
│                                              │
│ ⚠️ Importante: Cambia esta contraseña       │
│    temporal en tu primer inicio de sesión.  │
│                                              │
│        [Acceder al Sistema]                  │
│                                              │
└──────────────────────────────────────────────┘
```

#### Características del Email:
- 🎨 **Diseño Profesional**: HTML estilizado con colores institucionales
- 📱 **Responsive**: Adaptable a dispositivos móviles
- 🔐 **Información Clara**: Credenciales destacadas visualmente
- ⚠️ **Aviso de Seguridad**: Recordatorio para cambiar contraseña
- 🔗 **Call-to-Action**: Botón directo para acceder al sistema
- 🎯 **Personalizado**: Incluye nombre completo del usuario

#### Configuración de Email
**Archivo**: `yeikovBackend/src/config/email.config.ts`

Variables de entorno necesarias en `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@universidad.edu
SMTP_PASS=tu_password_smtp
EMAIL_FROM=SGPM <noreply@universidad.edu>
FRONTEND_URL=http://localhost:4321
```

---

### Integración en el Controlador
**Archivo**: `yeikovBackend/src/controllers/auth.controller.ts`

```typescript
async register(req: Request, res: Response): Promise<void> {
  const data: RegisterInput = req.body;
  const sendEmail = req.body.sendWelcomeEmail !== false; // Por defecto true
  const result = await authService.register(data, sendEmail);
  // ...
}
```

**Comportamiento**:
- Si `sendWelcomeEmail` no se especifica → envía email (default: true)
- Si `sendWelcomeEmail: false` → no envía email
- No bloquea el registro si falla el envío del email

---

## 🎨 3. Componente Frontend de Cambio de Contraseña

### Componente React
**Archivo**: `FrontAstro/src/components/ChangePassword.tsx`

#### Características:
- ✅ **Validación en Tiempo Real**
- ✅ **Indicador de Fortaleza de Contraseña**
- ✅ **Toggle para Mostrar/Ocultar Contraseñas**
- ✅ **Verificación de Coincidencia Visual**
- ✅ **Manejo de Errores Descriptivos**
- ✅ **Estados de Carga (Loading)**
- ✅ **Notificaciones Toast**
- ✅ **Diseño Responsivo**

#### Estados del Formulario:
```typescript
{
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
}
```

#### Validaciones:
1. **Contraseña Actual**:
   - Campo requerido
   - Verifica contra el backend

2. **Nueva Contraseña**:
   - Mínimo 6 caracteres
   - Debe ser diferente a la actual
   - Indicador visual de fortaleza:
     - 🔴 Débil (< 6 caracteres)
     - 🟡 Media (6-9 caracteres)
     - 🟢 Fuerte (≥ 10 caracteres)

3. **Confirmar Contraseña**:
   - Debe coincidir con nueva contraseña
   - Check verde cuando coinciden ✅

#### Props:
```typescript
interface ChangePasswordProps {
  onClose: () => void;      // Función para cerrar el modal
  onSuccess?: () => void;   // Callback opcional al cambiar exitosamente
}
```

#### Uso:
```tsx
import { ChangePassword } from './components/ChangePassword';

function Dashboard() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <>
      <button onClick={() => setShowChangePassword(true)}>
        Cambiar Contraseña
      </button>

      {showChangePassword && (
        <ChangePassword 
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            // Opcional: lógica adicional después del cambio
            console.log('Contraseña cambiada exitosamente');
          }}
        />
      )}
    </>
  );
}
```

---

### Función de API Frontend
**Archivo**: `FrontAstro/src/components/admin/request.ts`

```typescript
export async function cambiarContrasena(token: string, data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }>
```

**Actualización de `crearUsuario()`**:
```typescript
body: JSON.stringify({
  ...data,
  sendWelcomeEmail: true // ⭐ NUEVO: Activa envío de email
})
```

---

## 🔄 Flujo Completo

### Creación de Usuario con Email
```
1. Admin crea usuario con contraseña temporal "temporal123"
   └─→ POST /api/auth/register { ..., sendWelcomeEmail: true }

2. Backend procesa registro
   ├─→ Hashea contraseña
   ├─→ Crea usuario en BD
   └─→ Envía email con credenciales

3. Usuario recibe email
   ├─→ Ve su email y contraseña temporal
   └─→ Accede al sistema con las credenciales

4. Usuario hace login
   └─→ POST /api/auth/login

5. Sistema sugiere cambio de contraseña
   └─→ Muestra modal de cambio (primera vez)

6. Usuario cambia contraseña
   └─→ POST /api/auth/change-password
```

### Cambio de Contraseña
```
1. Usuario autenticado abre modal
   └─→ <ChangePassword onClose={...} />

2. Ingresa contraseñas
   ├─→ Validación en tiempo real
   ├─→ Indicador de fortaleza
   └─→ Verificación de coincidencia

3. Submit del formulario
   └─→ POST /api/auth/change-password
       ├─→ Verifica contraseña actual
       ├─→ Valida nueva contraseña
       └─→ Actualiza en BD

4. Respuesta exitosa
   ├─→ Toast de confirmación
   ├─→ Email de notificación
   └─→ Cierra modal
```

---

## 🛡️ Seguridad Implementada

### Backend:
- ✅ Autenticación JWT requerida
- ✅ Hash bcrypt para contraseñas (10 salt rounds)
- ✅ Validación de contraseña actual antes de cambiar
- ✅ Prevención de reutilización de contraseña
- ✅ Validación con Zod en todos los endpoints
- ✅ Registro de intentos de login
- ✅ Notificaciones automáticas de cambios

### Frontend:
- ✅ Validación en cliente antes de enviar
- ✅ Indicador de fortaleza de contraseña
- ✅ Confirmación de contraseña obligatoria
- ✅ Token almacenado en localStorage
- ✅ Manejo seguro de errores sin exponer detalles
- ✅ Estados de carga para prevenir doble submit

---

## 📋 Checklist de Implementación

### Backend
- [x] Schema de validación (`changePasswordSchema`)
- [x] Método `changePassword()` en servicio
- [x] Método `sendWelcomeEmail()` en servicio
- [x] Controlador `changePassword()`
- [x] Ruta POST `/auth/change-password`
- [x] Actualización de `register()` con parámetro email
- [x] Configuración de email transporter
- [x] Template HTML de email de bienvenida
- [x] Manejo de errores descriptivos

### Frontend
- [x] Función `cambiarContrasena()` en API
- [x] Actualización de `crearUsuario()` con email
- [x] Componente `ChangePassword.tsx`
- [x] Validaciones en tiempo real
- [x] Indicador de fortaleza de contraseña
- [x] Toggle mostrar/ocultar contraseñas
- [x] Estados de loading
- [x] Notificaciones toast
- [x] Diseño responsive

---

## 🚀 Uso en Producción

### Variables de Entorno Requeridas:
```env
# Backend (.env)
JWT_SECRET=tu_secreto_jwt_seguro
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@universidad.edu
SMTP_PASS=contraseña_smtp
EMAIL_FROM=SGPM <noreply@universidad.edu>
ADMIN_EMAIL=admin@universidad.edu
FRONTEND_URL=https://tu-dominio.com
```

### Configuración SMTP Recomendada:

#### Gmail:
1. Habilitar "Acceso de apps menos seguras" o usar "App Password"
2. SMTP_HOST: `smtp.gmail.com`
3. SMTP_PORT: `587` (TLS) o `465` (SSL)

#### Sendgrid:
1. Crear API Key en Sendgrid
2. SMTP_HOST: `smtp.sendgrid.net`
3. SMTP_PORT: `587`
4. SMTP_USER: `apikey`
5. SMTP_PASS: `tu_api_key`

---

## 🧪 Testing

### Test del Endpoint de Cambio de Contraseña:
```bash
# Con curl
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "temporal123",
    "newPassword": "nuevaSegura456",
    "confirmPassword": "nuevaSegura456"
  }'
```

### Test de Envío de Email:
```bash
# Registrar usuario con email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@universidad.edu",
    "password": "temporal123",
    "nombre": "Test",
    "apellido": "Usuario",
    "roleId": "uuid-del-role",
    "schoolId": "uuid-de-la-escuela",
    "sendWelcomeEmail": true
  }'
```

---

## 📝 Notas Adicionales

### Contraseñas Temporales:
- Por defecto: `temporal123`
- Recomendación: Implementar generador aleatorio de contraseñas
- Ejemplo: `Math.random().toString(36).slice(-8)` → `a7x3k9m2`

### Mejoras Futuras:
1. **Generador de Contraseñas Aleatorias**: Crear contraseñas únicas por usuario
2. **Política de Contraseñas**: Configurar complejidad (mayúsculas, números, símbolos)
3. **Expiración de Contraseñas Temporales**: Forzar cambio en primer login
4. **Historial de Contraseñas**: Prevenir reutilización de últimas N contraseñas
5. **2FA (Two-Factor Authentication)**: Autenticación de dos factores
6. **Rate Limiting**: Limitar intentos de cambio de contraseña
7. **Templates Personalizables**: Sistema de plantillas para emails
8. **Logs de Auditoría**: Registrar todos los cambios de contraseña

### Dependencias:
```json
{
  "bcryptjs": "^2.4.3",
  "nodemailer": "^6.9.7",
  "zod": "^3.22.4",
  "@pheralb/toast": "^3.x.x",
  "lucide-react": "^0.x.x"
}
```

---

**Implementación Completa**: ✅ Funcional y Lista para Producción
**Fecha**: 13 de Noviembre, 2025
**Estado**: 🟢 Operativo
