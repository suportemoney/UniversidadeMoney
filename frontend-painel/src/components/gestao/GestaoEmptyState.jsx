import GestaoIcon from "./GestaoIcons";

export default function GestaoEmptyState({ icon = "pasta", title, message, action }) {
  return (
    <div className="gestao-empty-state">
      <div className="gestao-empty-state-icon">
        <GestaoIcon name={icon} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
