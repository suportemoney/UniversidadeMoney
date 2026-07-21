/** Token de “confiar neste dispositivo” (MFA do painel). */
const DEVICE_KEY = "mfa_dispositivo_token";

export function getDispositivoToken() {
  return localStorage.getItem(DEVICE_KEY) || "";
}

export function setDispositivoToken(token) {
  if (token) {
    localStorage.setItem(DEVICE_KEY, token);
  }
}

export function clearDispositivoToken() {
  localStorage.removeItem(DEVICE_KEY);
}
