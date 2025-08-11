// Amendment.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Text } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

type AmendmentRow = {
  charge: string;
  description: string;
  time: number;
  fine: number;
};

export default function Amendments() {
  const [data, setData] = useState<AmendmentRow[]>([]);

  const columns = useMemo<ColumnDef<AmendmentRow, any>[]>(() => [
    {
      id: "number",
      accessorKey: "number",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Amendment" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Amendment",
        placeholder: "Search amendments...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "right",
      accessorKey: "right",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Right" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words w-[60rem]">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Right",
        placeholder: "Search rights...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
  ], []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL ?? '/'}data/amendments.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((json: AmendmentRow[]) => setData(Array.isArray(json) ? json : []))
      .catch((e) => console.error("Error loading JSON:", e));
  }, []);

  const { table } = useDataTable<AmendmentRow>({
    data,
    columns
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Constitutional Amendments</PageHeaderHeading>
      </PageHeader>

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </>
  );
}
