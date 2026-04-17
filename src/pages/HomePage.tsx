import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => baserow.listCategories(),
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => baserow.listServices(),
  });

  const countsByCategory = new Map<number, number>();
  if (services) {
    for (const s of services) {
      const catId = s["Service Linked Category"]?.[0]?.id;
      if (catId) countsByCategory.set(catId, (countsByCategory.get(catId) ?? 0) + 1);
    }
  }

  return (
    <>
      <section className="container py-16 md:py-24">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Пилотна версия • Район Триадица
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Електронни услуги за гражданите на Район Триадица
          </h1>
          <p className="text-lg text-muted-foreground">
            Подайте заявление онлайн за издаване на удостоверения, разрешителни и други
            административни услуги. Автоматично се подписва, формализира и препраща към
            районната администрация.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link to="/services">
                Всички услуги <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <h2 className="text-xl font-semibold mb-6">Категории услуги</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse bg-muted/30 h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories
              ?.sort((a, b) => (a["Category Order"] ?? 0) - (b["Category Order"] ?? 0))
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/services?category=${c["Category Code"]}`}
                  className="border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-primary mb-2">
                        {c["Category Code"]}
                      </div>
                      <div className="font-medium">{c["Category Name BG"]}</div>
                      {countsByCategory.get(c.id) !== undefined && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {countsByCategory.get(c.id)} услуги
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>
    </>
  );
}
