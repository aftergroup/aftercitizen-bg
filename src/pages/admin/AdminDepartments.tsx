import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";
import {
  Pagination,
  SearchBar,
  SortableHeader,
  useTableControls,
} from "@/components/admin/tableControls";
import type { MunicipalDepartment } from "@/lib/types";

type DeptSortKey = "name" | "type" | "manager" | "email";

export default function AdminDepartments() {
  const { municipalityId } = useCurrentMunicipality();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => baserow.listMunicipalDepartments(),
  });

  const scoped = (data ?? []).filter(
    (d) => d["Municipal Department Linked Municipality"]?.[0]?.id === municipalityId,
  );

  const table = useTableControls<MunicipalDepartment, DeptSortKey>({
    rows: scoped,
    searchFields: (d) => [
      d["Municipal Department Name BG"],
      d["Municipal Department Name EN"],
      d["Municipal Department Linked Manager"]?.[0]?.value,
      d["Municipal Department Email"],
      d["Municipal Department Phone"],
    ],
    sorters: {
      name: (d) => d["Municipal Department Name BG"] ?? "",
      type: (d) => d["Municipal Department Linked Unit Type"]?.[0]?.value ?? "",
      manager: (d) => d["Municipal Department Linked Manager"]?.[0]?.value ?? "",
      email: (d) => d["Municipal Department Email"] ?? "",
    },
    defaultSort: { key: "name" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Отдели</h1>
        <p className="text-sm text-muted-foreground">
          Отделите на районната администрация.
        </p>
      </div>

      <SearchBar
        value={table.query}
        onChange={table.setQuery}
        placeholder="Търси по наименование, ръководител, имейл…"
      />

      {isLoading ? (
        <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <SortableHeader label="Наименование" sortKey="name" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Тип" sortKey="type" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Ръководител" sortKey="manager" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Имейл" sortKey="email" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <th className="px-4 py-2 font-medium">Телефон</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {table.pageRows.map((d) => (
                <tr key={d.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium">
                    {d["Municipal Department Name BG"] || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d["Municipal Department Linked Unit Type"]?.[0]?.value || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d["Municipal Department Linked Manager"]?.[0]?.value || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d["Municipal Department Email"] ? (
                      <a
                        href={`mailto:${d["Municipal Department Email"]}`}
                        className="text-primary hover:underline"
                      >
                        {d["Municipal Department Email"]}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d["Municipal Department Phone"] || "—"}
                  </td>
                </tr>
              ))}
              {table.totalFiltered === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Няма регистрирани отдели в района.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            page={table.page}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        </div>
      )}
    </div>
  );
}
