import { useEffect, useState, useMemo } from "react";
import { FileText, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Header } from '../Header';
import type { Plan } from './request';
import { toast } from '@pheralb/toast';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [comentario, setComentario] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<'aceptar' | 'rechazar' | null>(null);
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

  const handleDecision = async () => {
    if (!decision) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error({ text: 'No hay sesión activa' });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:3000/api/plans/${plan.id}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          aprobado: decision === 'aceptar',
          comentarios: comentario.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar decisión');
      }

      toast.success({
        text: decision === 'aceptar'
          ? 'Plan aceptado exitosamente'
          : 'Plan rechazado'
      });

      // Redirect back to plans list
      setTimeout(() => {
        window.location.href = '/dashboard/mis-planes';
      }, 1500);
    } catch (error: any) {
      toast.error({ text: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const canMakeDecision =
    plan.estado === 'pendiente' ||
    plan.estado === 'asignado' ||
    plan.estado === 'Abierto' ||
    plan.estado === 'Borrador' ||
    plan.estado === 'borrador' ||
    plan.estado.toLowerCase() === 'pendiente' ||
    plan.estado.toLowerCase() === 'asignado';

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
              <p className="text-slate-900">{new Date(plan.createdAt).toLocaleDateString('es-ES')}</p>
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

          {/* Accept/Reject Buttons */}
          {canMakeDecision && (
            <div className="mt-6 border-t border-white/30 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Decisión sobre el Plan</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDecision('aceptar');
                    setShowDecisionModal(true);
                  }}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Aceptar Plan</span>
                </button>
                <button
                  onClick={() => {
                    setDecision('rechazar');
                    setShowDecisionModal(true);
                  }}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Rechazar Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="backdrop-blur-md bg-white/90 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {decision === 'aceptar' ? 'Aceptar Plan' : 'Rechazar Plan'}
            </h2>
            <p className="text-slate-600 mb-4">
              {decision === 'aceptar'
                ? 'Al aceptar este plan, te comprometes a trabajar en su ejecución.'
                : 'Por favor, explica el motivo del rechazo del plan.'}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comentario {decision === 'rechazar' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={decision === 'aceptar' ? 'Comentario opcional...' : 'Explica el motivo del rechazo...'}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDecisionModal(false);
                  setComentario('');
                  setDecision(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDecision}
                disabled={isProcessing || (decision === 'rechazar' && !comentario.trim())}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
