// Base API URL
const API_BASE_URL = "http://localhost:3000/api";

// Types
export interface DecanoStats {
  totalDocentes: number;
  totalPlanes: number;
  planesCompletados: number;
  tasaCumplimiento: number;
}

export interface DecanoReportes {
  totalPlanes: number;
  totalDocentes: number;
  planesCompletados: number;
  tasaCumplimiento: number;
}

export interface Departamento {
  nombre: string;
  docentes: number;
  planes: number;
  cumplimiento: number;
}

export interface Plan {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  createdAt?: string;
  updatedAt?: string;
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

// Fetch decano statistics
export async function fetchDecanoStats(token: string): Promise<DecanoStats> {
  const response = await fetch(`${API_BASE_URL}/decano/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch reportes del decano
export async function fetchDecanoReportes(token: string): Promise<DecanoReportes> {
  const response = await fetch(`${API_BASE_URL}/decano/reportes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch departamentos de la facultad
export async function fetchDepartamentos(token: string): Promise<Departamento[]> {
  const response = await fetch(`${API_BASE_URL}/decano/departamentos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.departamentos || [];
}

// Fetch planes pendientes de aprobación
export async function fetchPlanesPendientes(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/decano/planes-pendientes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.planes || [];
}

// Fetch planes for decano review
export async function fetchPlanesDecano(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.planes || []);
}

// Fetch docentes de la facultad
export async function fetchDocentesFacultad(token: string): Promise<Docente[]> {
  const response = await fetch(`${API_BASE_URL}/docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.docentes || [];
}

// Aprobar plan por decano
export async function aprobarPlan(token: string, planId: string, comentarios?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/decano/planes/${planId}/aprobar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      aprobado: true,
      comentarios: comentarios || '',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}

// Rechazar plan por decano
export async function rechazarPlan(token: string, planId: string, comentarios: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/decano/planes/${planId}/aprobar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      aprobado: false,
      comentarios,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}
