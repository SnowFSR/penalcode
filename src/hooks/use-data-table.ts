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
const SORT_KEY = "sort";
const ARRAY_SEPARATOR = ",";

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_THROTTLE_MS = 50;

type ExtendedColumnSort<TData> = { id: string; desc?: boolean } & Partial<TData>;

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      // Omit these because we control them or redefine them
      | "state"
      | "pageCount"
      | "initialState"      // <-- IMPORTANT: omit this so we can redefine its type
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Partial<Pick<TableOptions<TData>, "pageCount">> {
  // Our own initialState shape (we'll normalize before passing to TanStack)
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount,
    initialState,
    history = "replace",
    debounceMs = DEFAULT_DEBOUNCE_MS,
    throttleMs = DEFAULT_THROTTLE_MS,
    enableAdvancedFilter = false,
    shallow = true,
    ...tableProps
  } = props;

  // ---------- Local state ----------
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [] as any[];
    return (columns as any[]).filter((col) => (col as any).enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const columnIds = React.useMemo(() => {
    return new Set(
      (columns as any[]).map((c) => (c as any).id).filter(Boolean) as string[]
    );
  }, [columns]);

  // Normalize initial sorting to TanStack's SortingState (desc must be boolean)
  const normalizedInitialSorting = React.useMemo<SortingState>(
    () =>
      (initialState?.sorting ?? []).map((s) => ({
        id: String((s as any).id),
        desc: !!(s as any).desc,
      })),
    [initialState]
  );

  // ---------- URL state ----------
  const initialUrlKeys = React.useMemo(() => {
    const keys: Record<string, string | undefined> = {
      [PAGE_KEY]: "1",
      [PER_PAGE_KEY]: String(initialState?.pagination?.pageSize ?? 10),
      [SORT_KEY]:
        normalizedInitialSorting[0]
          ? `${normalizedInitialSorting[0].id}.${
              normalizedInitialSorting[0].desc ? "desc" : "asc"
            }`
          : "",
    };
    for (const col of filterableColumns) {
      keys[(col as any).id ?? ""] = undefined;
    }
    return keys;
  }, [filterableColumns, initialState, normalizedInitialSorting]);

  const [url, setUrl] = useUrlState(initialUrlKeys, {
    replace: history === "replace",
  });

  // ---------- Derive table state from URL ----------
  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: Math.max(0, (parseInt(url[PAGE_KEY] ?? "1", 10) || 1) - 1),
      pageSize: Math.max(1, parseInt(url[PER_PAGE_KEY] ?? "10", 10) || 10),
    }),
    [url]
  );

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const s = url[SORT_KEY];
    if (!s) return normalizedInitialSorting;
    const [id, dir] = s.split(".");
    if (!id || !columnIds.has(id)) return normalizedInitialSorting;
    return [{ id, desc: dir === "desc" }];
  });

  // Sync sorting on back/forward
  React.useEffect(() => {
    const s = url[SORT_KEY];
    if (!s) {
      setSorting((prev) =>
        JSON.stringify(prev) === JSON.stringify(normalizedInitialSorting)
          ? prev
          : normalizedInitialSorting
      );
      return;
    }
    const [id, dir] = s.split(".");
    if (!id || !columnIds.has(id)) return;
    const next: SortingState = [{ id, desc: dir === "desc" }];
    setSorting((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next
    );
  }, [url, columnIds, normalizedInitialSorting]);

  // Build initial column filters from URL (text -> string, multiselect -> string[])
  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    const filters: ColumnFiltersState = [];
    for (const col of filterableColumns) {
      const key = (col as any).id ?? "";
      const raw = key ? url[key] : undefined;
      if (!raw) continue;

      if ((col as any).meta?.options) {
        const arr = raw.split(ARRAY_SEPARATOR).map((v) => v.trim()).filter(Boolean);
        if (arr.length) filters.push({ id: key, value: arr });
      } else {
        filters.push({ id: key, value: raw });
      }
    }
    return filters;
  }, [filterableColumns, url, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  // Sync filters when URL changes
  React.useEffect(() => {
    setColumnFilters((prev) => {
      const same =
        JSON.stringify(prev.map(({ id, value }) => ({ id, value }))) ===
        JSON.stringify(initialColumnFilters.map(({ id, value }) => ({ id, value })));
      return same ? prev : initialColumnFilters;
    });
  }, [initialColumnFilters]);

  // ---------- Write-backs: table -> URL ----------
  const debouncedWriteFilters = useDebouncedCallback(
    (filters: ColumnFiltersState) => {
      const updates: Record<string, string | undefined> = {};
      for (const col of filterableColumns) {
        const id = (col as any).id;
        if (id) updates[id] = undefined;
      }
      for (const f of filters) {
        const key = f.id;
        const val = f.value as string | string[];
        if (Array.isArray(val)) updates[key] = val.join(ARRAY_SEPARATOR);
        else if (typeof val === "string") updates[key] = val;
      }
      updates[PAGE_KEY] = "1";
      setUrl(updates);
    },
    debounceMs
  );

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

        const filtered = next.filter((f) =>
          (filterableColumns as any[]).find((c: any) => c.id === f.id)
        );

        debouncedWriteFilters(filtered);
        return next;
      });
    },
    [debouncedWriteFilters, filterableColumns, enableAdvancedFilter]
  );

  // ---------- TanStack-compliant initialState ----------
  const tableInitialState = React.useMemo(
    () =>
      initialState
        ? ({ ...initialState, sorting: normalizedInitialSorting } as any)
        : undefined,
    [initialState, normalizedInitialSorting]
  );

  // ---------- React Table ----------
  const table = useReactTable({
    ...tableProps,
    columns,
    initialState: tableInitialState,
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
    enableRowSelection: false,
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
    manualSorting: !!pageCount,
    manualFiltering: !!pageCount,
  });

  return { table, shallow, debounceMs, throttleMs };
}
