export default function GestaoFilterTabs({ options, value, onChange }) {
  return (
    <div className="gestao-filter-tabs" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`gestao-filter-tab${value === opt.value ? " gestao-filter-tab--active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
