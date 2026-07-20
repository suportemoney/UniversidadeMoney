const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function getLanding() {
  const res = await fetch(`${API_URL}/landing/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Erro HTTP ${res.status}`);
  }
  return data;
}
