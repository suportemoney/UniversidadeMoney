import GestaoFilterTabs from "./GestaoFilterTabs";
import GestaoSearchInput from "./GestaoSearchInput";

export default function GestaoToolbar({
  filterOptions,
  filterValue,
  onFilterChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  bulkActions,
}) {
  return (
    <div className="gestao-toolbar-wrap gestao-animate-in gestao-animate-in--delay-1">
      {bulkActions}
      <div className="gestao-toolbar">
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
    </div>
  );
}
