import { toast } from "@pheralb/toast";
import { Eye, EyeClosed, GraduationCap, Lock, Mail } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { getCurrentUser, loginUser } from "../lib/auth";
import { validateEmail } from "../lib/validateEmail";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) window.location.href = "/dashboard";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error({ text: emailError });
      return;
    }

    if (!password.trim()) {
      toast.error({ text: "La contraseña es obligatoria." });
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email.trim(), password.trim());
      console.log("✅ Sesión iniciada:", data.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("❌ Error al iniciar sesión:", err);
      toast.error(err.message || "Error al iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900/70 to-(--santoto-primary)/80 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/40 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            {logoOk ? (
              <img
                src="/santoto-logo.png"
                alt="Santoto Tunja"
                className="h-32 object-contain"
                style={{ width: 'auto' }}
                onError={() => setLogoOk(false)}
                onLoad={() => setLogoOk(true)}
              />
            ) : (
              <GraduationCap className="w-16 h-16 text-(--santoto-primary)" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2 text-(--santoto-primary)">
            SGPM
          </h1>
          <p className="text-md text-slate-600">Sistema de Gestión de Planes de Mejoramiento</p>
          <p className="text-sm text-slate-500 mt-1">Universidad Santo Tomás</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail width={20} height={20} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="tu.email@ustatunja.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-400 rounded-xl focus:border-(--santoto-primary) focus:bg-white focus:outline-none transition duration-200 text-gray-900 placeholder-gray-400"
                autoFocus
                autoComplete="email"
                aria-label="Correo Electrónico"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock width={20} height={20} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-400 rounded-xl focus:border-(--santoto-primary) focus:bg-white focus:outline-none transition duration-200 text-gray-900 placeholder-gray-400"
                autoComplete="current-password"
                aria-label="Contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' ? setShowPassword(!showPassword) : null)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-(--santoto-primary) transition"
              >
                {showPassword ? (
                  <Eye width={20} height={20} />
                ) : (
                  <EyeClosed width={20} height={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-(--santoto-primary) text-white font-semibold rounded-xl hover:bg-(--santoto-primary) transition duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </div>
      </form>
      <div className="text-center mt-6">
        <p className="text-xs text-white font-medium drop-shadow-lg">
          Universidad Santo Tomás - Seccional Tunja © 2025
        </p>
      </div>
    </main>
  );
};
