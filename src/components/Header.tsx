import { UserMenu } from "./UserMenu";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    role: string;
    facultad?: string;
  } | null;
  initials?: string;
  navItems?: Array<{ label: string; href: string }>;
  activeItem?: string;
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
  showUserMenu?: boolean;
  onLogout?: () => void;
}

export function Header({
  user = null,
  initials = "",
  navItems = [],
  activeItem = "",
  showLogo = true,
  title = "SGPM",
  subtitle = "Sistema de Gestión de Planes",
  showUserMenu = true,
  onLogout = () => { },
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50 w-full mb-8">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo y Título */}
        {showLogo && (
          <div className="flex items-center gap-3">
            <img src="/Logo-Usta.png" alt="Logo Usta" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Navegación */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm font-medium cursor-pointer transition-colors ${item.label === activeItem
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* User Menu */}
        {showUserMenu && user && (
          <UserMenu user={user} initials={initials} onLogout={onLogout} />
        )}
      </div>
    </header>
  );
}
