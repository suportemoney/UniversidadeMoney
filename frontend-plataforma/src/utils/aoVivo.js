/** Rótulo do botão de acesso conforme a plataforma do ao vivo. */
export function labelLinkAoVivo(tipo) {
  return tipo === "youtube" ? "Assistir no YouTube" : "Abrir no Google Meet";
}

/** Ícone sugerido para a plataforma. */
export function iconeAoVivo(tipo) {
  return tipo === "youtube" ? "▶️" : "📹";
}
