import { useOutletContext } from "react-router-dom";

export default function PlaceholderPage({ titulo, descricao }) {
  const { user } = useOutletContext() || {};

  return (
    <div className="dash-placeholder">
      <h1>{titulo}</h1>
      <p>{descricao}</p>
      {user && (
        <p className="dash-placeholder-user">
          Área de <strong>{user.first_name}</strong> — em breve com conteúdo completo.
        </p>
      )}
    </div>
  );
}
