import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { baserow } from "@/lib/baserow";
import DynamicFormRenderer from "@/components/DynamicFormRenderer";
import { Button } from "@/components/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

// Reference tables (Fields, FieldTypes, Sections, Dictionaries, DictionaryEntries)
// change on the order of weeks, not minutes. Cache them long enough that
// navigating between forms hits the cache.
const REFERENCE_STALE_MS = 60 * 60 * 1000; // 1 hour

export default function FormPage() {
  const { formCode } = useParams<{ formCode: string }>();

  const formQuery = useQuery({
    queryKey: ["form", formCode],
    queryFn: () => baserow.getFormByCode(formCode!),
    enabled: !!formCode,
  });

  const serviceQuery = useQuery({
    queryKey: ["service", formCode],
    queryFn: () => baserow.getServiceByCode(formCode!),
    enabled: !!formCode,
  });

  const referenceQuery = useQuery({
    queryKey: ["schema", "reference"],
    queryFn: () => baserow.getReferenceData(),
    staleTime: REFERENCE_STALE_MS,
    gcTime: REFERENCE_STALE_MS,
  });

  const form = formQuery.data;
  const formFieldsQuery = useQuery({
    queryKey: ["formFields", form?.id],
    queryFn: () => baserow.listFormFieldsForForm(form!.id),
    enabled: !!form,
  });

  const schema = useMemo(() => {
    if (!form || !referenceQuery.data || !formFieldsQuery.data) return undefined;
    return baserow.buildRenderedForm(
      form,
      formFieldsQuery.data,
      referenceQuery.data,
      serviceQuery.data ?? undefined,
    );
  }, [form, referenceQuery.data, formFieldsQuery.data, serviceQuery.data]);

  const isLoading =
    formQuery.isLoading ||
    referenceQuery.isLoading ||
    formFieldsQuery.isLoading ||
    (!!form && !schema);

  const error =
    formQuery.error || referenceQuery.error || formFieldsQuery.error;
  const notFound = !formQuery.isLoading && !form;

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div className="text-sm">Зареждане на заявлението…</div>
      </div>
    );
  }

  if (error || notFound || !schema) {
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
