import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { ArrowLeft, FileDown, Mail, Phone } from "lucide-react";

export default function AdminSubmissionDetail() {
  const { id } = useParams();
  const submissionId = Number(id);

  const { data: submission, isLoading } = useQuery({
    queryKey: ["admin", "submission", submissionId],
    queryFn: () => baserow.getSubmission(submissionId),
    enabled: Number.isFinite(submissionId),
  });

  if (isLoading) {
    return <div className="h-32 rounded-lg bg-muted/30 animate-pulse" />;
  }

  if (!submission) {
    return (
      <div className="space-y-4">
        <Link to="/admin/submissions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Обратно към списъка
        </Link>
        <div className="p-8 text-center text-muted-foreground text-sm border rounded-lg bg-white">
          Заявлението не е намерено.
        </div>
      </div>
    );
  }

  const service = submission["Submission Linked Service"]?.[0]?.value;
  const pdfUrl = submission["Submission Filled PDF R2 URL"];

  return (
    <div className="space-y-6">
      <Link
        to="/admin/submissions"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Обратно към списъка
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">
            ВХ № {submission["Submission VH Number"] || `#${submission.id}`}
          </div>
          <h1 className="text-2xl font-semibold">{service ?? "Заявление"}</h1>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            <FileDown className="h-4 w-4" /> Изтегли PDF
          </a>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel title="Гражданин">
          <Field label="Име" value={submission["Submission Citizen Name"]} />
          <Field
            label="Имейл"
            value={submission["Submission Citizen Email"]}
            icon={<Mail className="h-3.5 w-3.5" />}
            href={
              submission["Submission Citizen Email"]
                ? `mailto:${submission["Submission Citizen Email"]}`
                : undefined
            }
          />
          <Field
            label="Телефон"
            value={submission["Submission Citizen Phone"]}
            icon={<Phone className="h-3.5 w-3.5" />}
            href={
              submission["Submission Citizen Phone"]
                ? `tel:${submission["Submission Citizen Phone"]}`
                : undefined
            }
          />
        </Panel>

        <Panel title="Статус и срокове">
          <Field
            label="Статус"
            value={getStatusLabel(submission)}
          />
          <Field label="Подадено на" value={formatDateTime(submission["Submission Submitted At"])} />
          <Field
            label="Потвърдено на"
            value={formatDateTime(submission["Submission Acknowledged At"])}
          />
          <Field
            label="Приключено на"
            value={formatDateTime(submission["Submission Completed At"])}
          />
          {submission["Submission Rejection Reason"] && (
            <div>
              <div className="text-xs text-muted-foreground mt-2 mb-1">Причина за отказ</div>
              <div className="text-sm whitespace-pre-wrap">
                {submission["Submission Rejection Reason"]}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg bg-white p-4 space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value?: string;
  href?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 truncate">
        {value ? (
          href ? (
            <a href={href} className="inline-flex items-center gap-1 text-primary hover:underline">
              {icon}
              {value}
            </a>
          ) : (
            <span>{value}</span>
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function getStatusLabel(s: { "Submission Status"?: { value: string } | string }): string | undefined {
  const raw = s["Submission Status"];
  if (!raw) return undefined;
  return typeof raw === "string" ? raw : raw.value;
}

function formatDateTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
