// src/lib/auth.ts
export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    facultad: string;
    role: string;
  };
  token: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al iniciar sesión");
  }

  // Guardamos sesión local
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export function logoutUser(redirect = false) {
  // Protegemos el acceso a `window` para entornos SSR
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Si se solicita, redirigimos al inicio (o página de login)
  if (redirect) {
    window.location.href = "/";
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
