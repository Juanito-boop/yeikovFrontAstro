import { useEffect, useState } from "react"
import { fetchDirectorCounts, type DirectorCountsRequest } from "./request";
import { Award, BarChart3, Building2, Calendar, FileText, Target, Users } from "lucide-react";
import { toast } from "@pheralb/toast";

export default function Dashboard() {
  const [counts, setCounts] = useState<DirectorCountsRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calcular índice de calidad: planes completados / total de planes
  const totalCompletados = counts?.planesPorEscuela.reduce((acc, esc) => acc + esc.planesCompletados, 0) || 0;
  const totalPlanes = counts?.planes || 0;
  const calidadPorcentaje = totalPlanes > 0 ? (totalCompletados / totalPlanes) * 100 : 0;
  const averageQuality = ((calidadPorcentaje / 100) * 5).toFixed(1); // Escala 0-5

  const institutionalStats = [
    { label: 'Total Facultades', value: counts ? String(counts.schools) : '0', icon: Building2, color: 'blue', change: '+0%' },
    { label: 'Docentes Universidad', value: counts ? String(counts.docentes) : '0', icon: Users, color: 'green', change: '+0%' },
    { label: 'Planes Institucionales', value: counts ? String(counts.planes) : '0', icon: FileText, color: 'purple', change: '+0%' },
    { label: 'Índice de Calidad', value: averageQuality + '/5.0', icon: Award, color: 'yellow', change: '+0.2' },
  ];

  // Usar datos reales de planesPorEscuela
  const facultyOverview = counts?.planesPorEscuela.map(escuela => ({
    name: escuela.schoolName,
    docentes: escuela.docentes,
    planes: escuela.totalPlanes,
    cumplimiento: escuela.totalPlanes > 0 ? Math.round((escuela.planesCompletados / escuela.totalPlanes) * 100) : 0,
    calidad: escuela.totalPlanes > 0 ? ((escuela.planesCompletados / escuela.totalPlanes) * 5).toFixed(1) : '0.0'
  })) || [];

  const strategicGoals = [
    {
      goal: 'Mejorar índice de calidad institucional',
      progress: counts ? Math.round(parseFloat(averageQuality) * 20) : 0,
      target: '4.5/5.0'
    },
    {
      goal: 'Incrementar participación docente',
      progress: counts ? Math.round((counts.docentes / (counts.docentes + 10)) * 100) : 0,
      target: '95%'
    },
    {
      goal: 'Reducir tiempo de respuesta',
      progress: 65,
      target: '< 5 días'
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay token de autenticación' });
      setIsLoading(false);
      return;
    }

    fetchDirectorCounts(token)
      .then(data => {
        setCounts(data);
        setIsLoading(false);
      })
      .catch(err => {
        toast.error({ text: 'Error al cargar datos: ' + err.message });
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 backdrop-blur-md bg-white/30 rounded-2xl p-6 shadow-lg border-2 border-white/40">
        <h1 className="text-3xl font-bold text-(--santoto-primary) mb-2 drop-shadow-md">
          Panel del Director Académico
        </h1>
        <p className="text-slate-800 font-medium drop-shadow">
          Visión estratégica y supervisión institucional
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {institutionalStats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'from-blue-600 to-blue-700',
                green: 'from-emerald-600 to-emerald-700',
                purple: 'from-purple-600 to-purple-700',
                yellow: 'from-amber-600 to-amber-700',
              };

              return (
                <div key={index} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {stat.change}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Faculty Performance */}
            <div className="lg:col-span-2 space-y-8">
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
                <div className="p-6 border-b border-white/30">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-(--santoto-primary)" />
                    <h2 className="text-lg font-semibold text-(--santoto-primary)">Rendimiento por Facultad</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {facultyOverview.map((faculty, index) => (
                      <div key={index} className="p-4 bg-white/40 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">{faculty.name}</h3>
                            <p className="text-xs text-slate-600">
                              {faculty.docentes} docentes • {faculty.planes} planes • Calidad: {faculty.calidad}/5.0
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">{faculty.cumplimiento}%</p>
                            <p className="text-xs text-slate-600">cumplimiento</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${faculty.cumplimiento >= 90 ? 'bg-linear-to-r from-green-500 to-emerald-500' :
                              faculty.cumplimiento >= 80 ? 'bg-linear-to-r from-yellow-500 to-orange-500' :
                                'bg-linear-to-r from-red-500 to-red-600'
                              }`}
                            style={{ width: `${faculty.cumplimiento}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 text-left">
                  <div className="w-12 h-12 bg-linear-to-br from-rose-600 to-rose-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Reportes Ejecutivos</h3>
                  <p className="text-sm text-slate-600">Análisis institucional completo</p>
                </button>

                <button className="group backdrop-blur-md bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-white/40 hover:shadow-xl hover:bg-white/70 transition-all duration-300 text-left">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Metas Estratégicas</h3>
                  <p className="text-sm text-slate-600">Definir objetivos institucionales</p>
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Strategic Goals */}
              <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-lg border-2 border-white/40">
                <div className="p-6 border-b border-white/30">
                  <h3 className="text-lg font-semibold text-(--santoto-primary)">Metas Estratégicas 2025</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {strategicGoals.map((goal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-slate-900 leading-tight">{goal.goal}</p>
                          <span className="text-xs text-slate-500 ml-2">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-linear-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-600">Meta: {goal.target}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="backdrop-blur-md bg-linear-to-br from-indigo-500/30 to-purple-500/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-6 h-6 text-indigo-700" />
                  <h3 className="text-lg font-semibold text-indigo-900 drop-shadow">Próximos Eventos</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/60 rounded-xl">
                    <p className="text-sm font-medium text-indigo-900">Consejo Académico</p>
                    <p className="text-xs text-indigo-700">Mañana, 10:00 AM</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-xl">
                    <p className="text-sm font-medium text-indigo-900">Revisión Trimestral</p>
                    <p className="text-xs text-indigo-700">Viernes, 2:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="backdrop-blur-md bg-linear-to-br from-green-500/30 to-emerald-500/30 rounded-2xl p-6 border-2 border-white/40 shadow-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4 drop-shadow">Indicadores Clave</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-800 font-medium">Satisfacción Docente</span>
                    <span className="text-sm font-semibold text-green-900">4.1/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-800 font-medium">Tiempo Promedio</span>
                    <span className="text-sm font-semibold text-green-900">6.2 días</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-800 font-medium">Eficiencia Global</span>
                    <span className="text-sm font-semibold text-green-900">89%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}