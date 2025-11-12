// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 10000,
};

export function getAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}
