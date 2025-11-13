const API_BASE_URL = "http://localhost:3000/api";

export interface Plan {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  fechaAprobacion?: string;
  docente: {
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
  descripcion: string;
  archivoUrl: string;
  fechaSubida: string;
}

// Obtener planes del docente autenticado
export async function fetchMyPlans(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
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
  return result.planes || [];
}

// Obtener un plan específico por ID
export async function fetchPlanById(token: string, planId: string): Promise<Plan> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Failed to fetch plan");
  const result = await response.json();
  return result.plan;
}

// Obtener acciones de un plan
export async function fetchAccionesByPlan(token: string, planId: string): Promise<Accion[]> {
  const response = await fetch(`${API_BASE_URL}/acciones/plan/${planId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Failed to fetch acciones");
  const result = await response.json();
  return result.acciones || [];
}

// Subir evidencia para una acción
export async function uploadEvidencia(
  token: string,
  data: { accionId: string; descripcion: string; archivo: File }
): Promise<Evidencia> {
  const formData = new FormData();
  formData.append('accionId', data.accionId);
  formData.append('descripcion', data.descripcion);
  formData.append('archivo', data.archivo);

  const response = await fetch(`${API_BASE_URL}/evidencias`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload evidencia");
  }
  const result = await response.json();
  return result.evidencia;
}

// Obtener evidencias de una acción
export async function fetchEvidenciasByAccion(token: string, accionId: string): Promise<Evidencia[]> {
  const response = await fetch(`${API_BASE_URL}/evidencias/accion/${accionId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Failed to fetch evidencias");
  const result = await response.json();
  return result.evidencias || [];
}