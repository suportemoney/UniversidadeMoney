import GestaoFilterTabs from "./GestaoFilterTabs";
import GestaoSearchInput from "./GestaoSearchInput";

export default function GestaoToolbar({ filterOptions, filterValue, onFilterChange, searchValue, onSearchChange, searchPlaceholder }) {
  return (
    <div className="gestao-toolbar gestao-animate-in gestao-animate-in--delay-1">
      {filterOptions && (
        <GestaoFilterTabs options={filterOptions} value={filterValue} onChange={onFilterChange} />
      )}
      {onSearchChange && (
        <GestaoSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder || "Buscar..."}
        />
      )}
    </div>
  );
}
