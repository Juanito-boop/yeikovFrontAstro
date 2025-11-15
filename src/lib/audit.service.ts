import { API_CONFIG } from './api.config';

export interface AuditLog {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  descripcion: string;
  entidadAfectada: string | null;
  datosPrevios: any | null;
  datosNuevos: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    role: {
      nombre: string;
    };
  };
}

export interface AuditStats {
  total: number;
  porEntidad: Array<{ entidad: string; count: string }>;
  porAccion: Array<{ accion: string; count: string }>;
  usuariosMasActivos: Array<{
    id: string;
    nombre: string;
    apellido: string;
    count: string;
  }>;
}

export interface ActividadReciente {
  id: string;
  descripcion: string;
  usuario: string;
  entidad: string;
  accion: string;
  fecha: string;
  entidadAfectada: string | null;
}

export const fetchAuditLogs = async (
  token: string,
  filtros?: {
    entidad?: string;
    accion?: string;
    usuarioId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    busqueda?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> => {
  const params = new URLSearchParams();

  if (filtros?.entidad) params.append('entidad', filtros.entidad);
  if (filtros?.accion) params.append('accion', filtros.accion);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
  if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
  if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const response = await fetch(
    `${API_CONFIG.baseURL}/auditoria/logs?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener logs de auditoría');
  }

  return response.json();
};

export const fetchAuditStats = async (
  token: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<AuditStats> => {
  const params = new URLSearchParams();

  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);

  const response = await fetch(
    `${API_CONFIG.baseURL}/auditoria/estadisticas?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener estadísticas de auditoría');
  }

  return response.json();
};

export const fetchActividadReciente = async (
  token: string,
  limit: number = 10
): Promise<{ actividades: ActividadReciente[] }> => {
  const response = await fetch(
    `${API_CONFIG.baseURL}/auditoria/actividad-reciente?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener actividad reciente');
  }

  return response.json();
};
