import { useEffect, useMemo, useState } from "react"
import { logoutUser } from "../lib/auth";
import Dashboard from "./director/Dashboard";
import DashboardDocente from "./docente/Dashboard";
import { DecanoDashboard } from "./decano/dashboard";
import { AdminDashboard } from "./admin/dashboard";
import { Header } from './Header';

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  facultad: string
  role: Role
}

type Role = 'Director' | 'Docente' | 'Decano' | 'Administrador';

const NAV_ITEMS: Record<Role, string[]> = {
  Director: ['Dashboard', 'Asignar Planes', 'Seguimiento', 'Métricas', 'Estrategia'],
  Docente: ['Dashboard', 'Mis Planes', 'Evidencias'],
  Decano: ['Dashboard', 'Revisar Planes', 'Docentes', 'Reportes'],
  Administrador: ['Dashboard', 'Usuarios', 'Facultades', 'Reportes Administrador'],
};

const DASHBOARD_COMPONENTS: Record<Role, React.FC> = {
  Director: Dashboard,
  Docente: DashboardDocente,
  Decano: DecanoDashboard,
  Administrador: AdminDashboard,
};

export default function DashboardReact() {
  const [user, setUser] = useState<User | null>(null);

  const navItems = user ? (NAV_ITEMS[user.role as Role] ?? []) : [];

  // Safely parse stored user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      // If parsing fails, silently ignore and keep user null
      // Optionally: console.warn('Failed to parse stored user', e)
    }
  }, []);
  const SelectedDashboard = user ? DASHBOARD_COMPONENTS[user.role] : null;

  // Compute initials safely
  const initials = useMemo(() => {
    if (!user) return '';
    const n = (user.nombre || '').trim();
    const a = (user.apellido || '').trim();
    const first = n ? n[0] : '';
    const last = a ? a[0] : '';
    const result = `${first}${last}`.toUpperCase();
    return result || '';
  }, [user]);

  return (
    <div className="h-screen flex flex-col items-center">
      <Header
        user={user}
        initials={initials}
        navItems={navItems.map((label) => ({
          label,
          href: label === 'Dashboard' ? '/dashboard' : `/dashboard/${label.toLowerCase().replace(/\s+/g, '-')}`
        }))}
        activeItem="Dashboard"
        onLogout={() => setUser(null)}
      />
      <main className="w-full py-8">
        {SelectedDashboard ? <SelectedDashboard /> : null}
      </main>
    </div>
  )
}