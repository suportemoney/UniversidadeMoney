/** Estado vazio com ícone e mensagem */
export default function EmptyState({ icon = "📭", titulo, descricao, acao }) {
  return (
    <div className="dash-empty">
      <span className="dash-empty-icon" aria-hidden="true">{icon}</span>
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}
