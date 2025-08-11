// hooks/use-data-table.ts
"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useUrlState } from "./use-url-state";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort"; // e.g. "charge.asc"
const ARRAY_SEPARATOR = ","; // for multiselect filters (options)

const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50; // kept for parity; not used here but returned

type ExtendedColumnSort<TData> = { id: string; desc?: boolean } & Partial<TData>;

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Partial<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  /** parity with nuqs version; we treat "replace" as default */
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean; // not needed with RR, kept for API compatibility
  enableAdvancedFilter?: boolean;
  scroll?: boolean; // not needed with RR, kept for API compatibility
  shallow?: boolean; // not needed with RR, kept for API compatibility
  startTransition?: React.TransitionStartFunction; // parity only
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false, // unused
    enableAdvancedFilter = false,
    scroll = false, // unused
    shallow = true, // unused
    startTransition, // unused
    ...tableProps
  } = props;

  // --- Local (non-URL) state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  // Build a set of filterable column ids (match original logic)
  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const columnIds = React.useMemo(() => {
    return new Set(columns.map((c) => c.id).filter(Boolean) as string[]);
  }, [columns]);

  // --- URL state: page, perPage, sort, and one key per filterable column
  const initialUrlKeys = React.useMemo(() => {
    const keys: Record<string, string | undefined> = {
      [PAGE_KEY]: "1",
      [PER_PAGE_KEY]: String(initialState?.pagination?.pageSize ?? 10),
      [SORT_KEY]: (initialState?.sorting?.[0]
        ? `${initialState.sorting[0].id}.${initialState.sorting[0].desc ? "desc" : "asc"}`
        : "") as string,
    };
    for (const col of filterableColumns) {
      // empty by default; we’ll interpret missing/empty as no filter
      keys[col.id ?? ""] = undefined;
    }
    return keys;
  }, [filterableColumns, initialState]);

  const [url, setUrl] = useUrlState(initialUrlKeys, {
    replace: history === "replace",
  });

  // --- Derive React Table state from URL
  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: Math.max(0, (parseInt(url[PAGE_KEY] ?? "1", 10) || 1) - 1),
      pageSize: Math.max(1, parseInt(url[PER_PAGE_KEY] ?? "10", 10) || 10),
    }),
    [url]
  );

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const s = url[SORT_KEY];
    if (!s) return initialState?.sorting ?? [];
    const [id, dir] = s.split(".");
    if (!id || !columnIds.has(id)) return [];
    return [{ id, desc: dir === "desc" }];
  });

  // Read filters from URL (simple: if column has .meta.options, treat as list; else string)
  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    const filters: ColumnFiltersState = [];
    for (const col of filterableColumns) {
      const key = col.id ?? "";
      const raw = key ? url[key] : undefined;
      if (!raw) continue;

      if (col.meta?.options) {
        // multiselect options: "a,b,c"
        const arr = raw.split(ARRAY_SEPARATOR).map((v) => v.trim()).filter(Boolean);
        if (arr.length) filters.push({ id: key, value: arr });
      } else {
        // text: split on non-alphanumerics (keep parity with your original)
        const value =
          /[^a-zA-Z0-9]/.test(raw)
            ? raw.split(/[^a-zA-Z0-9]+/).filter(Boolean)
            : [raw];
        if (value.length) filters.push({ id: key, value });
      }
    }
    return filters;
  }, [filterableColumns, url, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  // --- Write-backs: table → URL (debounced for filters)
  const debouncedWriteFilters = useDebouncedCallback((filters: ColumnFiltersState) => {
    const updates: Record<string, string | undefined> = {};
    // Clear all filterable column keys first
    for (const col of filterableColumns) {
      if (col.id) updates[col.id] = undefined;
    }
    // Set current filters
    for (const f of filters) {
      const key = f.id;
      const val = f.value as string | string[];
      if (Array.isArray(val)) {
        updates[key] = val.join(ARRAY_SEPARATOR);
      } else if (typeof val === "string") {
        updates[key] = val;
      }
    }
    // Reset to page 1 on filter change (parity with your nuqs version)
    updates[PAGE_KEY] = "1";
    setUrl(updates);
  }, debounceMs);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;
      setUrl({
        [PAGE_KEY]: String(next.pageIndex + 1),
        [PER_PAGE_KEY]: String(next.pageSize),
      });
    },
    [pagination, setUrl]
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      setSorting(next);

      const first = next[0];
      const sortString =
        first && first.id ? `${first.id}.${first.desc ? "desc" : "asc"}` : "";
      setUrl({ [SORT_KEY]: sortString || undefined });
    },
    [sorting, setUrl]
  );

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;

        // Only persist filters for columns that are actually filterable
        const filtered = next.filter((f) =>
          filterableColumns.find((c) => c.id === f.id)
        );

        debouncedWriteFilters(filtered);
        return next;
      });
    },
    [debouncedWriteFilters, filterableColumns, enableAdvancedFilter]
  );

  // --- React Table
  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: !!pageCount,
    manualSorting: true,
    manualFiltering: true,
  });

  // parity return fields
  return { table, shallow, debounceMs, throttleMs };
}
