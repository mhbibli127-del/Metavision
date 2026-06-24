"use client";

import { useEffect, useMemo, useState } from "react";

export function useTableFilter<T>(
  items: T[],
  filterFn: (item: T, query: string, filters: Record<string, string>) => boolean,
  pageSize = 10,
) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => items.filter((item) => filterFn(item, query, filters)),
    [items, query, filters, filterFn],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return { query, setQuery, filters, setFilter, page, setPage, totalPages, filtered, paged };
}
