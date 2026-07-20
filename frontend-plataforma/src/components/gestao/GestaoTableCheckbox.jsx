export function GestaoSelectHeaderCell({ checked, indeterminate, onChange, disabled }) {
  return (
    <th className="gestao-table-col-check">
      <input
        type="checkbox"
        className="gestao-table-checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={onChange}
        disabled={disabled}
        aria-label="Selecionar todos da página"
      />
    </th>
  );
}

export function GestaoSelectCell({ checked, onChange, disabled }) {
  return (
    <td className="gestao-table-col-check">
      <input
        type="checkbox"
        className="gestao-table-checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label="Selecionar linha"
      />
    </td>
  );
}
