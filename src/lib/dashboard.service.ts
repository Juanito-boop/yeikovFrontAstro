import { API_CONFIG } from './api.config';

export interface Alerta {
  tipo: string;
  mensaje: string;
  detalle: string;
  cantidad: number;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface EstadisticasDashboard {
  planes: {
    total: number;
    activos: number;
    pendientes: number;
    rechazados: number;
  };
  incidencias: {
    total: number;
    pendientes: number;
  };
}

export interface DepartamentoStats {
  id: string;
  nombre: string;
  totalPlanes: number;
  planesActivos: number;
  planesCompletados: number;
  planesPendientes: number;
  totalDocentes: number;
}

export const fetchAlertas = async (): Promise<Alerta[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_CONFIG.baseURL}/dashboard/alertas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener alertas');
  }

  return response.json();
};

export const fetchEstadisticasDashboard = async (): Promise<EstadisticasDashboard> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_CONFIG.baseURL}/dashboard/estadisticas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas');
  }

  return response.json();
};

export const fetchDepartamentos = async (): Promise<DepartamentoStats[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_CONFIG.baseURL}/dashboard/departamentos`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener departamentos');
  }

  return response.json();
};
