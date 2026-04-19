import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import type { AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField, selectValue } from "./shared";

const RELATION_OPTIONS = [
  { value: "Родител", label: "Родител" },
  { value: "Настойник", label: "Настойник" },
  { value: "Попечител", label: "Попечител" },
  { value: "Пълномощник", label: "Пълномощник" },
];

export default function RepresentationTab({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();

  const [isRep, setIsRep] = useState(user["User Is Legal Representative"] ?? false);
  const [egn, setEgn] = useState(user["User Represented Person EGN"] ?? "");
  const [fullName, setFullName] = useState(
    user["User Represented Person Full Name"] ?? "",
  );
  const [relation, setRelation] = useState<string | null>(
    selectValue(user["User Represented Person Relation"]) ?? null,
  );

  useEffect(() => {
    setIsRep(user["User Is Legal Representative"] ?? false);
    setEgn(user["User Represented Person EGN"] ?? "");
    setFullName(user["User Represented Person Full Name"] ?? "");
    setRelation(selectValue(user["User Represented Person Relation"]) ?? null);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateAdminUser(user.id, {
        "User Is Legal Representative": isRep,
        "User Represented Person EGN": isRep ? egn || undefined : undefined,
        "User Represented Person Full Name": isRep ? fullName || undefined : undefined,
        "User Represented Person Relation":
          isRep && relation ? { value: relation } : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "user"] });
      toast.success("Данните за представителство са обновени");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Представителство"
        description="Ако подавате заявления от името на друго лице — дете, подопечно или упълномощител."
      >
        <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent/40">
          <input
            type="checkbox"
            checked={isRep}
            onChange={(e) => setIsRep(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="font-medium text-sm">
              Аз съм законен представител на друго лице
            </div>
            <div className="text-xs text-muted-foreground">
              Ще можете да подавате заявления от името на посоченото лице.
            </div>
          </div>
        </label>

        {isRep && (
          <div className="grid md:grid-cols-2 gap-4">
            <FieldRow label="Представлявано лице — Име">
              <TextField value={fullName} onChange={setFullName} />
            </FieldRow>
            <FieldRow label="ЕГН">
              <TextField value={egn} onChange={setEgn} />
            </FieldRow>
            <FieldRow label="Връзка">
              <SelectField<string>
                value={relation}
                onChange={setRelation}
                options={RELATION_OPTIONS}
              />
            </FieldRow>
          </div>
        )}

        <div className="flex justify-end">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Запазване…" : "Запази"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
