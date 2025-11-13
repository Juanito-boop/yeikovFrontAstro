import { API_CONFIG } from "./api.config";

export interface PlanMejora {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  espacioAcademico?: string;
  motivo?: string;
  fechaLimite?: string;
  progreso?: number;
  acciones?: PlanAccion[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanAccion {
  id: string;
  descripcion: string;
  estado: string;
  fechaObjetivo?: string;
  evidencias?: Evidencia[];
}

export interface Evidencia {
  id: string;
  filename: string;
  path: string;
  comentario?: string;
  createdAt: string;
}

export async function obtenerPlanesDocente(): Promise<PlanMejora[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autenticado");

  const response = await fetch(`${API_CONFIG.baseURL}/plans/mis-planes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Error al obtener planes");
  }

  const data = await response.json();
  return data.planes || [];
}

export async function subirEvidencia(
  accionId: string,
  file: File,
  comentario?: string
): Promise<Evidencia> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autenticado");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("accionId", accionId);
  if (comentario) {
    formData.append("comentario", comentario);
  }

  const response = await fetch(`${API_CONFIG.baseURL}/evidencias`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
      // NO incluir Content-Type, el browser lo hace automáticamente con FormData
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al subir evidencia");
  }

  const data = await response.json();
  return data.evidencia;
}

export async function obtenerEvidenciasPorAccion(accionId: string): Promise<Evidencia[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autenticado");

  const response = await fetch(`${API_CONFIG.baseURL}/evidencias/accion/${accionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Error al obtener evidencias");
  }

  const data = await response.json();
  return data.evidencias || [];
}
