// Base API URL
const API_BASE_URL = "http://localhost:3000/api";

// Types
export interface DirectorCountsRequest {
  schools: number;
  docentes: number;
  planes: number;
  planesPorEscuela: PlanesPorEscuela[];
}

export interface PlanesPorEscuela {
  schoolName: string;
  totalPlanes: number;
  docentes: number;
  planesCompletados: number;
  calidad: number;
}

export interface CreatePlan {
  titulo: string;
  descripcion: string;
  docenteId: string;
  incidenciaId?: string;
}

export interface Docente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  school?: {
    id: string;
    nombre: string;
  };
}

export interface Plan {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  fechaAprobacion?: string;
  incidencia?: {
    id: string;
    descripcion: string;
    estado: string;
    createdAt: string;
  };
  acciones: Array<{
    id: string;
    descripcion: string;
    fecha: string;
  }>;
  aprobaciones: Array<{
    id: string;
    nivel: string;
    aprobado: boolean;
    comentarios?: string | null;
    fecha: string;
  }>;
  docente?: {
    id: string;
    email: string;
    nombre: string;
    password: string;
    roleId: string;
    schoolId: string;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
    school: {
      id: string;
      nombre: string;
      direccion: string;
      decano?: string | null;
      emailDecano?: string | null;
      departamentos?: string | null;
    };
    apellido: string;
  };
}

export interface School {
  id: string;
  nombre: string;
}

export interface Incidencia {
  id: string;
  descripcion: string;
  estado: string;
  createdAt: string;
  docente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface Accion {
  id: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  responsable: string;
}

export interface Evidencia {
  id: string;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
  fechaSubida: string;
}

export interface Notification {
  id: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  tipo: string;
}

export interface Aprobacion {
  id: string;
  aprobado: boolean;
  comentarios: string;
  fechaAprobacion: string;
  aprobador: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

// API Functions

// ========== DIRECTOR ==========
export async function fetchDirectorCounts(token: string): Promise<DirectorCountsRequest> {
  const response = await fetch(`${API_BASE_URL}/director/counts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch director counts");
  }
  const data: DirectorCountsRequest = await response.json();
  return data;
}

export async function createPlan(token: string, body: CreatePlan): Promise<Plan> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const error = await response.json();
    console.error('Error creating plan:', error);
    throw new Error(error.error || error.message || "Failed to create plan");
  }
  const result = await response.json();
  console.log('Plan created successfully:', result);
  // El backend devuelve { message: '...', plan: {...} }
  return result.plan || result;
}

export async function fetchAllPlans(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }
  const result = await response.json();
  // El backend devuelve { planes: [...] }
  return result.planes || [];
}

export async function fetchPlanesRechazados(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans/rechazados`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch rejected plans");
  }
  const result = await response.json();
  return result.planes || [];
}

export async function reenviarPlanADecano(token: string, planId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}/reenviar-decano`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resend plan to dean");
  }
}

export async function fetchDocentes(token: string, schoolId?: string): Promise<Docente[]> {
  const url = schoolId
    ? `${API_BASE_URL}/docentes?schoolId=${schoolId}`
    : `${API_BASE_URL}/docentes`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch docentes");
  }
  const data = await response.json();
  return data.docentes || [];
}

export async function fetchSchools(token: string): Promise<School[]> {
  const response = await fetch(`${API_BASE_URL}/schools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch schools");
  }
  const data: School[] = await response.json();
  return data;
}

// ========== PLANES ==========
export async function fetchPlanById(token: string, planId: string): Promise<Plan> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch plan");
  }
  const data: Plan = await response.json();
  return data;
}

export async function aprobarPlan(token: string, planId: string, aprobado: boolean, comentarios?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}/aprobar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ aprobado, comentarios })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to approve plan");
  }
}

export async function cerrarPlan(token: string, planId: string): Promise<Plan> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}/cerrar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to close plan");
  }
  const data: Plan = await response.json();
  return data;
}

// ========== INCIDENCIAS ==========
export async function createIncidencia(
  token: string,
  data: { docenteId: string; descripcion: string }
): Promise<Incidencia> {
  const response = await fetch(`${API_BASE_URL}/incidencias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create incidencia");
  }
  const result = await response.json();
  return result.incidencia;
}

export async function fetchIncidencias(token: string): Promise<Incidencia[]> {
  const response = await fetch(`${API_BASE_URL}/incidencias`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch incidencias");
  }
  const result = await response.json();
  return result.incidencias || [];
}

export async function updateIncidenciaEstado(
  token: string,
  incidenciaId: string,
  estado: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/incidencias/${incidenciaId}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update incidencia estado");
  }
}

// ========== ACCIONES ==========
export async function createAccion(
  token: string,
  data: {
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    planId: string;
    responsable?: string;
  }
): Promise<Accion> {
  const response = await fetch(`${API_BASE_URL}/acciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create accion");
  }
  return await response.json();
}

export async function fetchAccionesByPlan(token: string, planId: string): Promise<Accion[]> {
  const response = await fetch(`${API_BASE_URL}/acciones/plan/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch acciones");
  }
  return await response.json();
}

export async function updateAccionEstado(
  token: string,
  accionId: string,
  estado: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/acciones/${accionId}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update accion estado");
  }
}

// ========== EVIDENCIAS ==========
export async function uploadEvidencia(
  token: string,
  accionId: string,
  file: File,
  descripcion?: string
): Promise<Evidencia> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accionId', accionId);
  if (descripcion) {
    formData.append('descripcion', descripcion);
  }

  const response = await fetch(`${API_BASE_URL}/evidencias`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
      // No incluir Content-Type, el navegador lo establece automáticamente con boundary
    },
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload evidencia");
  }
  return await response.json();
}

export async function fetchEvidenciasByAccion(token: string, accionId: string): Promise<Evidencia[]> {
  const response = await fetch(`${API_BASE_URL}/evidencias/accion/${accionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch evidencias");
  }
  return await response.json();
}

// ========== NOTIFICACIONES ==========
export async function fetchNotifications(token: string): Promise<Notification[]> {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return await response.json();
}

export async function markNotificationAsRead(token: string, notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark all notifications as read");
  }
}

// ========== APROBACIONES ==========
export async function fetchAprobacionesByPlan(token: string, planId: string): Promise<Aprobacion[]> {
  const response = await fetch(`${API_BASE_URL}/aprobaciones/plan/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch aprobaciones");
  }
  return await response.json();
}

export async function deleteAprobacion(token: string, aprobacionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/aprobaciones/${aprobacionId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete aprobacion");
  }
}