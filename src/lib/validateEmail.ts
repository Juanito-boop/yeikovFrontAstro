const ALLOWED_DOMAINS = ["usantoto.edu.co", "ustatunja.edu.co"];

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) return "El campo de correo es obligatorio.";
  if (!/\S+@\S+\.\S+$/.test(trimmed)) return "El formato del correo es inválido.";

  const domain = trimmed.split("@")[1];
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return `Solo se permiten correos institucionales (${ALLOWED_DOMAINS.join(", ")})`;
  }

  return null;
}
