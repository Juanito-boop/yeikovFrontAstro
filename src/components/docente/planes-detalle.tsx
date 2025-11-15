import { useEffect, useState, useMemo } from "react";
import { FileText, ArrowLeft } from "lucide-react";
import { Header } from '../Header';
import type { Plan } from './request';

interface UserAuth {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  facultad: string;
  role: Role;
}

type Role = "Director" | "Docente" | "Decano" | "Administrador";

const NAV_ITEMS: Record<Role, string[]> = {
  Director: ["Dashboard", "Asignar Planes", "Seguimiento", "Métricas", "Estrategia"],
  Docente: ["Dashboard", "Mis Planes", "Evidencias"],
  Decano: ["Dashboard", "Revisar Planes", "Docentes", "Reportes"],
  Administrador: ["Dashboard", "Usuarios", "Facultades", "Reportes Administrador"],
};

interface PlanDetalleProps {
  plan: Plan;
}

export default function PlanDetalle({ plan }: PlanDetalleProps) {
  const [user, setUser] = useState<UserAuth | null>(null);
  const navItems = user ? NAV_ITEMS[user.role as Role] ?? [] : [];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch { }
  }, []);

  const initials = useMemo(() => {
    if (!user) return "";
    const n = (user.nombre || "").trim();
    const a = (user.apellido || "").trim();
    return `${n[0] || ""}${a[0] || ""}`.toUpperCase();
  }, [user]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "url(https://gestion.santototunja.edu.co/wp-content/uploads/2021/06/Santoto_Tunja_Produccion_fotografica_21.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Mis Planes"
        onLogout={() => window.history.back()}
      />

      {/* Plan Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-8 shadow-lg border-2 border-white/40">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-(--santoto-primary) rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-(--santoto-primary)">
                {plan.titulo}
              </h1>
              <p className="text-slate-600 font-medium">Plan ID: {plan.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/40 rounded-xl border border-white/30 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Descripción</h3>
              <p className="text-slate-900">{plan.descripcion}</p>
            </div>

            <div className="p-4 bg-white/40 rounded-xl border border-white/30">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Docente</h3>
              <p className="text-slate-900 font-medium">{plan.docente.nombre} {plan.docente.apellido}</p>
            </div>

            <div className="p-4 bg-white/40 rounded-xl border border-white/30">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Fecha de Creación</h3>
              <p className="text-slate-900">{new Date(plan.fechaCreacion).toLocaleDateString('es-ES')}</p>
            </div>

            <div className="p-4 bg-white/40 rounded-xl border border-white/30">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Estado</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${plan.estado === "pendiente"
                  ? "bg-amber-100 text-amber-700"
                  : plan.estado === "completado"
                    ? "bg-green-100 text-green-700"
                    : plan.estado === "en_progreso"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
              >
                {plan.estado.replace('_', ' ')}
              </span>
            </div>

            {plan.fechaAprobacion && (
              <div className="p-4 bg-white/40 rounded-xl border border-white/30">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Fecha de Aprobación</h3>
                <p className="text-slate-900">{new Date(plan.fechaAprobacion).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
