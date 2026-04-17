import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { Input } from "@/components/ui";
import { ArrowRight, Search } from "lucide-react";

export default function ServicesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => baserow.listCategories(),
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => baserow.listServices(),
  });

  const filtered = (services ?? []).filter((s) => {
    const catCode = s["Service Linked Category"]?.[0]?.value ?? "";
    const matchCat =
      categoryFilter === "all" ||
      catCode === categoryFilter ||
      s["Service Code"].startsWith(categoryFilter + "-");
    const q = query.toLowerCase().trim();
    const matchQuery =
      !q ||
      s["Service Title BG"].toLowerCase().includes(q) ||
      s["Service Code"].toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  function onCategoryClick(code: string) {
    setCategoryFilter(code);
    if (code === "all") setSearchParams({});
    else setSearchParams({ category: code });
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Всички услуги</h1>
        <p className="text-muted-foreground">
          {services?.length ?? 0} услуги в Район Триадица
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Търси услуга…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onCategoryClick("all")}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-accent"
          }`}
        >
          Всички
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategoryClick(c["Category Code"])}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              categoryFilter === c["Category Code"]
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            }`}
          >
            {c["Category Code"]} · {c["Category Name BG"]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="divide-y border rounded-lg overflow-hidden">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                to={`/forms/${s["Service Code"]}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-primary mb-1">
                    {s["Service Code"]}
                  </div>
                  <div className="font-medium leading-snug">{s["Service Title BG"]}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            </li>
          ))}
          {filtered.length === 0 && !isLoading && (
            <li className="p-8 text-center text-muted-foreground text-sm">
              Няма намерени услуги по критериите.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
