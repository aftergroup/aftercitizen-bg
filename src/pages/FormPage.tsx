import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import DynamicFormRenderer from "@/components/DynamicFormRenderer";
import { Button } from "@/components/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FormPage() {
  const { formCode } = useParams<{ formCode: string }>();

  const { data: schema, isLoading, error } = useQuery({
    queryKey: ["renderedForm", formCode],
    queryFn: () => baserow.getRenderedForm(formCode!),
    enabled: !!formCode,
  });

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div className="text-sm">Зареждане на заявлението…</div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="container py-20 max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-semibold">Услугата не е намерена</h1>
        <p className="text-muted-foreground">
          Не намерихме услуга с код <code className="text-foreground">{formCode}</code>.
        </p>
        <Button asChild variant="outline">
          <Link to="/services">
            <ArrowLeft className="h-4 w-4" />
            Към всички услуги
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/services">
          <ArrowLeft className="h-4 w-4" />
          Всички услуги
        </Link>
      </Button>
      <DynamicFormRenderer schema={schema} />
    </div>
  );
}
