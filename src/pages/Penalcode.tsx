// Penalcode.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Text, DollarSign } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

type PenalRow = {
  charge: string;
  description: string;
  time: number;
  fine: number;
};

export default function Penalcode() {
  const [data, setData] = useState<PenalRow[]>([]);

  const columns = useMemo<ColumnDef<PenalRow, any>[]>(() => [
    {
      id: "charge",
      accessorKey: "charge",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Charge" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Charge",
        placeholder: "Search charges...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Description",
        placeholder: "Search descriptions...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "time",
      accessorKey: "time",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="w-[5rem]">{String(getValue() ?? "")}m</div>
      ),
      size: 80,
      minSize: 64,
      meta: {
        label: "Time",
        variant: "number" as const, // 👈 literal
        icon: Text,
      },
    },
    {
      id: "fine",
      accessorKey: "fine",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Fine" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="w-[6rem]">${String(getValue() ?? "")}</div>
      ),
      size: 96,
      minSize: 80,
      meta: {
        label: "Fine",
        variant: "number" as const, // 👈 literal
        icon: DollarSign,
      },
    },
  ], []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL ?? '/'}data/penalcode.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((json: PenalRow[]) => setData(Array.isArray(json) ? json : []))
      .catch((e) => console.error("Error loading JSON:", e));
  }, []);

  const { table } = useDataTable<PenalRow>({
    data,
    columns,
    // no pageCount -> client-side filtering/sorting/pagination
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Penalcode</PageHeaderHeading>
      </PageHeader>

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </>
  );
}
