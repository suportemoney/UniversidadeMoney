import GestaoIcon from "./GestaoIcons";

export default function GestaoSearchInput({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="gestao-search-input">
      <GestaoIcon name="busca" className="gestao-search-input-icon" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
