// Caselaw.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Text } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

type CaseRow = {
  charge: string;
  description: string;
  time: number;
  fine: number;
};

export default function Caselaw() {
  const [data, setData] = useState<CaseRow[]>([]);

  const columns = useMemo<ColumnDef<CaseRow, any>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Case Law" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Case Law",
        placeholder: "Search case laws...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "principle",
      accessorKey: "principle",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Principle" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words w-[50rem]">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Principle",
        placeholder: "Search principles...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
  ], []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL ?? '/'}data/caselaw.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((json: CaseRow[]) => setData(Array.isArray(json) ? json : []))
      .catch((e) => console.error("Error loading JSON:", e));
  }, []);

  const { table } = useDataTable<CaseRow>({
    data,
    columns
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Case Law</PageHeaderHeading>
      </PageHeader>

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </>
  );
}
