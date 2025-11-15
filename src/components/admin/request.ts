// Base API URL
const API_BASE_URL = "http://localhost:3000/api";

// Types
export interface AdminStats {
  totalDocentes: number;
  planesActivos: number;
  planesPendientes: number;
  planesCompletados: number;
  totalFacultades: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  school?: {
    id: string;
    nombre: string;
  };
}

export interface Facultad {
  id: string;
  nombre: string;
  decano?: string | null;
  emailDecano?: string | null;
  cantidadDocentes?: number;
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
  };
}

export interface ReporteData {
  id: string;
  titulo: string;
  tipo: 'general' | 'facultad' | 'docente' | 'planes';
  fechaGeneracion: string;
  estado: 'generado';
  descripcion: string;
  registros: number;
  datos?: any;
}

// Fetch admin statistics
export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const response = await fetch(`${API_BASE_URL}/director/counts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  const totalPlanes = result.planes || 0;
  const planesCompletados = result.planesPorEscuela?.reduce((acc: number, e: any) => acc + e.planesCompletados, 0) || 0;
  const planesActivos = totalPlanes - planesCompletados;

  return {
    totalDocentes: result.docentes || 0,
    planesActivos: planesActivos,
    planesPendientes: planesActivos, // Por ahora usamos el mismo valor
    planesCompletados: planesCompletados,
    totalFacultades: result.schools || 0,
  };
}

// Fetch all users (docentes)
export async function fetchUsuarios(token: string): Promise<Usuario[]> {
  const response = await fetch(`${API_BASE_URL}/docentes?includeInactive=true`, {
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

// Fetch all facultades
export async function fetchFacultades(token: string): Promise<Facultad[]> {
  const response = await fetch(`${API_BASE_URL}/schools`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.schools || [];
}

// Create new user (docente)
export async function crearUsuario(token: string, data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  schoolId: string;
  role?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      sendWelcomeEmail: true // Enviar email con contraseña temporal
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}

// Update user
export async function actualizarUsuario(token: string, id: string, data: {
  nombre?: string;
  apellido?: string;
  email?: string;
  role?: string;
  schoolId?: string;
}): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.user;
}

// Deactivate user
export async function desactivarUsuario(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/users/${id}/deactivate`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}

// Activate user
export async function activarUsuario(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/users/${id}/activate`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}

// Change password
export async function cambiarContrasena(token: string, data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Create new facultad
export async function crearFacultad(token: string, data: {
  nombre: string;
  decano?: string;
  emailDecano?: string;
}): Promise<Facultad> {
  const response = await fetch(`${API_BASE_URL}/schools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Update facultad
export async function actualizarFacultad(token: string, id: string, data: {
  nombre: string;
  decano?: string;
  emailDecano?: string;
}): Promise<Facultad> {
  const response = await fetch(`${API_BASE_URL}/schools/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.school || result;
}

// Delete facultad
export async function eliminarFacultad(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/schools/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }
}

// Fetch all plans
export async function fetchPlanes(token: string): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans/all`, {
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

// Generate report based on type
export async function generarReporte(
  token: string,
  tipo: 'general' | 'facultad' | 'docente' | 'planes',
  fechaInicio?: string,
  fechaFin?: string
): Promise<ReporteData> {
  // Obtener datos según el tipo de reporte
  let datos: any;
  let titulo: string;
  let descripcion: string;
  let registros: number;

  switch (tipo) {
    case 'general':
      const stats = await fetchAdminStats(token);
      datos = stats;
      titulo = 'Reporte General del Sistema';
      descripcion = 'Estadísticas completas del sistema SGPM';
      registros = stats.totalDocentes + stats.totalFacultades;
      break;

    case 'facultad':
      const facultades = await fetchFacultades(token);
      datos = facultades;
      titulo = 'Rendimiento por Facultades';
      descripcion = 'Análisis comparativo entre facultades';
      registros = facultades.length;
      break;

    case 'docente':
      const docentes = await fetchUsuarios(token);
      datos = docentes;
      titulo = 'Actividad Docente';
      descripcion = 'Participación y cumplimiento docente';
      registros = docentes.length;
      break;

    case 'planes':
      const planes = await fetchPlanes(token);
      datos = planes;
      titulo = 'Estado de Planes de Mejoramiento';
      descripcion = 'Seguimiento detallado de todos los planes';
      registros = planes.length;
      break;

    default:
      throw new Error('Tipo de reporte no válido');
  }

  return {
    id: `${tipo}-${Date.now()}`,
    titulo,
    tipo,
    fechaGeneracion: new Date().toISOString().split('T')[0],
    estado: 'generado',
    descripcion,
    registros,
    datos
  };
}

// Fetch historical reports (simulated - returns generated reports)
export async function fetchReportes(token: string): Promise<ReporteData[]> {
  // Como no hay endpoint de reportes guardados, devolvemos reportes generados en tiempo real
  try {
    const [general, facultades, docentes, planes] = await Promise.all([
      generarReporte(token, 'general'),
      generarReporte(token, 'facultad'),
      generarReporte(token, 'docente'),
      generarReporte(token, 'planes')
    ]);

    return [general, facultades, docentes, planes];
  } catch (error) {
    console.error('Error fetching reportes:', error);
    return [];
  }
}

