/**
 * Icon-only row actions for admin tables. Kept on one file so every list
 * page renders them the same way (size, spacing, hover affordance) —
 * if the visual changes, it changes in one place.
 */
import { Pencil, Trash2 } from "lucide-react";

export function RowActions({
  onEdit,
  onDelete,
  editLabel = "Редактирай",
  deleteLabel = "Изтрий",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <IconButton onClick={onEdit} title={editLabel} aria-label={editLabel}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
      )}
      {onDelete && (
        <IconButton
          onClick={onDelete}
          title={deleteLabel}
          aria-label={deleteLabel}
          variant="destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      )}
    </div>
  );
}

function IconButton({
  onClick,
  children,
  title,
  variant = "default",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive";
}) {
  const variantClasses =
    variant === "destructive"
      ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      : "text-muted-foreground hover:text-primary hover:bg-primary/10";
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors ${variantClasses}`}
      {...rest}
    >
      {children}
    </button>
  );
}
