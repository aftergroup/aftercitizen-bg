import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import type { AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField } from "./shared";

const LANGUAGE_OPTIONS = [
  { value: "bg", label: "Български" },
  { value: "en", label: "English" },
];

export default function AccountTab({ user }: { user: AdminUser }) {
  const { user: auth0User } = useAuth0();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(user["User Email"] ?? "");
  const [appearAs, setAppearAs] = useState(user["User Appear As"] ?? "");
  const [username, setUsername] = useState(user["User Username"] ?? "");
  const [language, setLanguage] = useState<string | null>(
    user["User Default Language"] ?? null,
  );

  useEffect(() => {
    setEmail(user["User Email"] ?? "");
    setAppearAs(user["User Appear As"] ?? "");
    setUsername(user["User Username"] ?? "");
    setLanguage(user["User Default Language"] ?? null);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateAdminUser(user.id, {
        "User Email": email,
        "User Appear As": appearAs || undefined,
        "User Username": username || undefined,
        "User Default Language": language ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "user"] });
      toast.success("Профилът е обновен");
      if (email !== user["User Email"]) {
        toast.info(
          "Имейлът в Auth0 се променя отделно — свържете се с администратор.",
        );
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  const picture = auth0User?.picture;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="Акаунт" description="Основни данни за профила и вход в системата.">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
            {picture ? (
              <img src={picture} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">
                {(appearAs || email).slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Снимката идва от Auth0 профила. Промяната се прави от съответната
            платформа за идентификация.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow
            label="Имейл"
            hint="Промяната на имейл в Auth0 изисква отделна процедура."
          >
            <TextField value={email} onChange={setEmail} type="email" />
          </FieldRow>
          <FieldRow label="Потребителско име">
            <TextField value={username} onChange={setUsername} />
          </FieldRow>
          <FieldRow label="Показвано име" hint="Видимо на други потребители в системата.">
            <TextField value={appearAs} onChange={setAppearAs} />
          </FieldRow>
          <FieldRow label="Език">
            <SelectField<string>
              value={language}
              onChange={setLanguage}
              options={LANGUAGE_OPTIONS}
            />
          </FieldRow>
        </div>

        <div className="flex justify-end">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Запазване…" : "Запази"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
