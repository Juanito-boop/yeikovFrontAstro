import { useEffect, useState } from "react"
import { fetchMyPlans, type Plan } from "./request";
import { Award, Building2, Calendar, CheckCircle, Clock, FileText, Upload, Users } from "lucide-react";
import { toast } from "@pheralb/toast";

export default function DashboardDocente() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    fetchMyPlans(token)
      .then(data => {
        setPlanes(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar planes: ' + err.message });
        setIsLoading(false);
      });

  }, []);

  // Calcular estadísticas desde los planes reales
  const planesAsignados = planes.length;
  
  const planesCompletados = planes.filter(p => {
    const estado = p.estado.toLowerCase().replace(/\s+/g, '');
    return estado.includes('completado') || estado.includes('cerrado');
  }).length;

  const planesEnProgreso = planes.filter(p => {
    const estado = p.estado.toLowerCase().replace(/\s+/g, '');
    return estado === 'enprogreso' || estado.includes('progreso') || estado === 'abierto';
  }).length;

  const planesPendientes = planes.filter(p => {
    const estado = p.estado.toLowerCase().replace(/\s+/g, '');
    return estado === 'pendiente' || estado === 'activo' || estado === 'borrador';
  }).length;

  // Debug logs
  console.log('Planes totales:', planes);
  console.log('Planes Completados:', planesCompletados, 'En Progreso:', planesEnProgreso, 'Pendientes:', planesPendientes);

  const evidenciasSubidas = 0; // Esto requeriría otro endpoint

  const stats = [
    { label: 'Completados', value: planesCompletados, icon: CheckCircle, color: 'green' },
    { label: 'En Progreso', value: planesEnProgreso, icon: Clock, color: 'blue' },
    { label: 'Pendientes', value: planesPendientes, icon: FileText, color: 'yellow' },
    { label: 'Planes Asignados', value: planesAsignados, icon: Award, color: 'santoto' },
  ];

  console.log('Stats antes de renderizar:', stats);

  const upcomingDeadlines = planes
    .filter(p => p.estado.toLowerCase().includes('abierto') || p.estado.toLowerCase().includes('progreso'))
    .slice(0, 3)
    .map(plan => ({
      subject: plan.titulo,
      deadline: new Date(plan.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric'
      }),
      status: 'normal' as 'normal' | 'urgent'
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
        <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
          Panel del Docente
        </h1>
        <p className="text-slate-800 font-medium drop-shadow">
          Visión estratégica y supervisión  institucional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'from-blue-600 to-blue-700',
            green: 'from-emerald-600 to-emerald-700',
            purple: 'from-purple-600 to-purple-700',
            yellow: 'from-amber-600 to-amber-700',
            santoto: 'from-indigo-600 to-indigo-700',
            emerald: 'from-emerald-600 to-emerald-700',
          };

          return (
            <div key={index} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {stat.value}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-(--santoto-primary) mb-1">{stat.value}</p>
                <p className="text-sm text-slate-700 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Upcoming Deadlines */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
          <div className="p-6 border-b border-white/30">
            <h3 className="text-lg font-semibold text-(--santoto-primary)">Próximas Fechas Límite</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay planes pendientes</p>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-white/40">
                    <Calendar className={`w-5 h-5 ${deadline.status === 'urgent' ? 'text-rose-600' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{deadline.subject}</p>
                      <p className={`text-xs ${deadline.status === 'urgent' ? 'text-red-600' : 'text-slate-600'}`}>
                        Creado: {deadline.deadline}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="backdrop-blur-md bg-linear-to-br from-indigo-600/30 to-indigo-700/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 drop-shadow">Consejos Rápidos</h3>
          <ul className="text-sm text-slate-800 font-medium space-y-2">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full mt-2 shrink-0"></span>
              <span>Revisa regularmente tus planes asignados</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full mt-2 shrink-0"></span>
              <span>Sube evidencias antes de las fechas límite</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full mt-2 shrink-0"></span>
              <span>Mantén comunicación con tu coordinador</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}