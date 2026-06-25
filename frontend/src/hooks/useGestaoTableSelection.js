import { useCallback, useMemo, useState } from "react";

export default function useGestaoTableSelection() {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((pageIds) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const todosMarcados = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (todosMarcados) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useCallback(
    (pageIds) => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  const isIndeterminate = useCallback(
    (pageIds) => {
      const marcados = pageIds.filter((id) => selectedIds.has(id)).length;
      return marcados > 0 && marcados < pageIds.length;
    },
    [selectedIds]
  );

  const count = selectedIds.size;

  const getSelectedArray = useCallback(() => [...selectedIds], [selectedIds]);

  return useMemo(
    () => ({
      selectedIds,
      toggle,
      toggleAll,
      clear,
      isSelected,
      isAllSelected,
      isIndeterminate,
      count,
      getSelectedArray,
    }),
    [selectedIds, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate, count, getSelectedArray]
  );
}
