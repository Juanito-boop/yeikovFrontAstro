import { useState, useEffect, useRef } from 'react';
import { LogOut, Key, ChevronDown, User as UserIcon } from 'lucide-react';
import { logoutUser } from '../lib/auth';
import { ChangePassword } from './ChangePassword';

interface UserMenuProps {
  user: {
    nombre: string;
    apellido: string;
    role: string;
    facultad?: string;
  };
  initials: string;
  onLogout?: () => void;
}

export function UserMenu({ user, initials, onLogout }: UserMenuProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
    logoutUser(true);
  };

  const handleOpenChangePassword = () => {
    setIsDropdownOpen(false);
    setShowChangePassword(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">
            {user.nombre} {user.apellido}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user.role} - {user.facultad}
          </p>
        </div>

        {/* Avatar con Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 group"
            aria-label="Menú de usuario"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold group-hover:bg-blue-700 transition-colors">
              {initials}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              {/* User Info Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleOpenChangePassword}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>Cambiar Contraseña</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            // Opcional: puedes agregar lógica adicional después de cambiar la contraseña
          }}
        />
      )}
    </>
  );
}
