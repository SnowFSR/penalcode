import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";

const { table } = useDataTable({
    data,
    columns,
    pageCount,
  });
  

export default function Penalcode() {

    

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
    )
}
