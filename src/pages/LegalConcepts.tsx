// LegalConcepts.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Text, DollarSign } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

type ConceptRow = {
  charge: string;
  description: string;
  time: number;
  fine: number;
};

export default function LegalConcepts() {
  const [data, setData] = useState<ConceptRow[]>([]);

  const columns = useMemo<ColumnDef<ConceptRow, any>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Concept" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Concept",
        placeholder: "Search concepts...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "definition",
      accessorKey: "definition",
      header: ({ column }: { column: any }) => (
        <DataTableColumnHeader column={column} title="Definition" />
      ),
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <div className="whitespace-normal break-words w-[50rem]">{String(getValue() ?? "")}</div>
      ),
      meta: {
        label: "Definition",
        placeholder: "Search definitions...",
        variant: "text" as const,   // 👈 literal
        icon: Text,
      },
      enableColumnFilter: true,
    },
  ], []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL ?? '/'}data/legal_concepts.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((json: ConceptRow[]) => setData(Array.isArray(json) ? json : []))
      .catch((e) => console.error("Error loading JSON:", e));
  }, []);

  const { table } = useDataTable<ConceptRow>({
    data,
    columns,
    initialStat: {
        pagination: { pageSize: 10 },
    }
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Legal Concepts</PageHeaderHeading>
      </PageHeader>

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </>
  );
}
