import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";

export default function AdminDepartments() {
  const { municipalityId } = useCurrentMunicipality();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => baserow.listMunicipalDepartments(),
  });

  const departments = (data ?? []).filter(
    (d) => d["Municipal Department Linked Municipality"]?.[0]?.id === municipalityId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Отдели</h1>
        <p className="text-sm text-muted-foreground">
          Отделите на районната администрация.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Наименование</th>
                <th className="px-4 py-2 font-medium">Тип</th>
                <th className="px-4 py-2 font-medium">Ръководител</th>
                <th className="px-4 py-2 font-medium">Имейл</th>
                <th className="px-4 py-2 font-medium">Телефон</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map((d) => (
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
              {departments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Няма регистрирани отдели в района.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
