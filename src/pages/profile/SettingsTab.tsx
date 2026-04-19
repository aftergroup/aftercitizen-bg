import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import type { AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, selectValue } from "./shared";

const DELIVERY_OPTIONS = [
  { value: "email", label: "Имейл" },
  { value: "електронна кутия", label: "Електронна кутия" },
  { value: "на място", label: "На място" },
  { value: "по пощата", label: "По пощата" },
];

const LANGUAGE_OPTIONS = [
  { value: "bg", label: "Български" },
  { value: "en", label: "English" },
];

export default function SettingsTab({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();

  const [delivery, setDelivery] = useState<string | null>(
    selectValue(user["User Preferred Delivery Method"]) ?? null,
  );
  const [marketing, setMarketing] = useState(user["User Marketing Opt In"] ?? false);
  const [notifications, setNotifications] = useState(
    user["User Notification Opt In"] ?? true,
  );
  const [language, setLanguage] = useState<string | null>(
    user["User Default Language"] ?? null,
  );

  useEffect(() => {
    setDelivery(selectValue(user["User Preferred Delivery Method"]) ?? null);
    setMarketing(user["User Marketing Opt In"] ?? false);
    setNotifications(user["User Notification Opt In"] ?? true);
    setLanguage(user["User Default Language"] ?? null);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateAdminUser(user.id, {
        "User Preferred Delivery Method": delivery ? { value: delivery } : undefined,
        "User Marketing Opt In": marketing,
        "User Notification Opt In": notifications,
        "User Default Language": language ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "user"] });
      toast.success("Настройките са запазени");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="Получаване на документи">
        <FieldRow
          label="Предпочитан начин"
          hint="Използва се по подразбиране при попълване на заявления."
        >
          <SelectField<string>
            value={delivery}
            onChange={setDelivery}
            options={DELIVERY_OPTIONS}
          />
        </FieldRow>
      </Card>

      <Card title="Език на интерфейса">
        <FieldRow label="Език">
          <SelectField<string>
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
          />
        </FieldRow>
      </Card>

      <Card title="Комуникация">
        <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent/40">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="font-medium text-sm">Известия по имейл</div>
            <div className="text-xs text-muted-foreground">
              Статус на заявления, напомняния за срокове и отговори от администрацията.
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent/40">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="font-medium text-sm">Маркетингова комуникация</div>
            <div className="text-xs text-muted-foreground">
              Новини, кампании и информация за нови услуги от района.
            </div>
          </div>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Запазване…" : "Запази"}
        </Button>
      </div>
    </div>
  );
}
