import React, { useEffect, useMemo, useState } from "react";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Text, DollarSign } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export default function Penalcode() {
  const [data, setData] = useState<any[]>([]);
  const [pageCount, setPageCount] = useState(1);

  const columns = useMemo(
    () => [
      {
        id: "charge",
        accessorKey: "charge",
        header: ({ column }: any) => (
          <DataTableColumnHeader column={column} title="Charge" />
        ),
        cell: ({ getValue }) => (
            <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
        ),
        meta: {
          label: "Charge",
          placeholder: "Search charges...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }: any) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ getValue }) => (
            <div className="whitespace-normal break-words">{String(getValue() ?? "")}</div>
        ),
        meta: {
          label: "Description",
          placeholder: "Search descriptions...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "time",
        accessorKey: "time",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Time" />
        ),
        cell: ({ getValue }) => (
          <div className="w-[5rem] text-center">{getValue()}</div>
        ),
        meta: { label: "Time", variant: "number", icon: Text, unit: 'm' },
      },
      {
        id: "fine",
        accessorKey: "fine",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fine" />
        ),
        meta: { label: "Fine", variant: "number", unit: '$', icon: DollarSign },
      },
    ],
    []
  );

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL ?? '/'}data/penalcode.json`; // <-- key fix
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(json => {
        console.log('rows:', Array.isArray(json) ? json.length : 'not array');
        console.log('first row keys:', json?.[0] && Object.keys(json[0]));
        setData(Array.isArray(json) ? json : []);
        setPageCount(Array.isArray(json) ? Math.max(1, Math.ceil(json.length / 10)) : 1);
      })
      .catch(e => console.error("Error loading JSON:", e));
  }, []);

  const { table } = useDataTable({
    data,
    columns
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
