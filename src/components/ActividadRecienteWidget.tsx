import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { fetchActividadReciente, type ActividadReciente } from '../lib/audit.service';

interface ActividadRecienteWidgetProps {
  limit?: number;
}

export function ActividadRecienteWidget({ limit = 10 }: ActividadRecienteWidgetProps) {
  const [actividades, setActividades] = useState<ActividadReciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarActividades();
  }, [limit]);

  const cargarActividades = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchActividadReciente(token, limit);
      setActividades(data.actividades);
    } catch (error) {
      console.error('Error al cargar actividad reciente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'ASIGNAR': return '📋';
      case 'APROBAR': return '✅';
      case 'RECHAZAR': return '❌';
      case 'LOGIN': return '🔐';
      default: return '📌';
    }
  };

  const getTiempoTranscurrido = (fecha: string) => {
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diff = ahora.getTime() - fechaActividad.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    if (horas < 24) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
      <div className="p-6 border-b border-white/30">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-(--santoto-primary)" />
          <h3 className="text-lg font-semibold text-(--santoto-primary)">Actividad Reciente del Sistema</h3>
        </div>
      </div>
      <div className="p-6">
        {actividades.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No hay actividad reciente</p>
        ) : (
          <div className="space-y-4">
            {actividades.map((actividad) => (
              <div
                key={actividad.id}
                className="flex items-start space-x-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors"
              >
                <div className="text-2xl">{getAccionIcon(actividad.accion)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 font-medium">
                    {actividad.descripcion}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-600">{actividad.usuario}</p>
                    <span className="text-xs text-slate-400">•</span>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTiempoTranscurrido(actividad.fecha)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
