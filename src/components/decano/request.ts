// Base API URL
const API_BASE_URL = "http://localhost:3000/api";

// Types
export interface DecanoStats {
  totalDocentes: number;
  totalPlanes: number;
  planesCompletados: number;
  tasaCumplimiento: number;
}

export interface Plan {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
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
  const response = await fetch(`${API_BASE_URL}/director/counts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  // Calcular estadísticas para el decano
  const totalPlanes = result.planes || 0;
  const planesCompletados = result.planesPorEscuela?.reduce((acc: number, e: any) => acc + e.planesCompletados, 0) || 0;

  return {
    totalDocentes: result.docentes || 0,
    totalPlanes: totalPlanes,
    planesCompletados: planesCompletados,
    tasaCumplimiento: totalPlanes > 0 ? Math.round((planesCompletados / totalPlanes) * 100) : 0,
  };
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

// Aprobar plan
export async function aprobarPlan(token: string, planId: string, comentarios?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}/aprobar`, {
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
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
}

// Rechazar plan
export async function rechazarPlan(token: string, planId: string, comentarios: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}/aprobar`, {
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
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
}
