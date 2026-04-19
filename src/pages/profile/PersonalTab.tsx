import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import type { AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField, selectValue } from "./shared";

const GENDER_OPTIONS = [
  { value: "Мъж", label: "Мъж" },
  { value: "Жена", label: "Жена" },
  { value: "Друг", label: "Друг" },
  { value: "Не желая да посоча", label: "Не желая да посоча" },
];

export default function PersonalTab({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();

  const { data: countries } = useQuery({
    queryKey: ["profile", "countries"],
    queryFn: () => baserow.listCountries(),
    staleTime: 60 * 60 * 1000,
  });

  const [firstName, setFirstName] = useState(user["User First Name"] ?? "");
  const [lastName, setLastName] = useState(user["User Last Name"] ?? "");
  const [egn, setEgn] = useState(user["User EGN"] ?? "");
  const [dob, setDob] = useState(user["User Date Of Birth"] ?? "");
  const [gender, setGender] = useState<string | null>(
    selectValue(user["User Gender"]) ?? null,
  );
  const [nationalityId, setNationalityId] = useState<number | null>(
    user["User Nationality"]?.[0]?.id ?? null,
  );
  const [placeOfBirth, setPlaceOfBirth] = useState(user["User Place Of Birth"] ?? "");

  useEffect(() => {
    setFirstName(user["User First Name"] ?? "");
    setLastName(user["User Last Name"] ?? "");
    setEgn(user["User EGN"] ?? "");
    setDob(user["User Date Of Birth"] ?? "");
    setGender(selectValue(user["User Gender"]) ?? null);
    setNationalityId(user["User Nationality"]?.[0]?.id ?? null);
    setPlaceOfBirth(user["User Place Of Birth"] ?? "");
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateAdminUser(user.id, {
        "User First Name": firstName || undefined,
        "User Last Name": lastName || undefined,
        "User EGN": egn || undefined,
        "User Date Of Birth": dob || undefined,
        "User Gender": gender ? { value: gender } : undefined,
        "User Nationality": nationalityId ? [{ id: nationalityId, value: "" }] : [],
        "User Place Of Birth": placeOfBirth || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "user"] });
      toast.success("Личните данни са обновени");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  const countryOptions = (countries ?? []).map((c) => ({
    value: c.id,
    label: c["Country Name BG"] || c["Country Name EN"] || c["Country Code"] || `#${c.id}`,
  }));

  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Лични данни"
        description="Данни за идентификация, използвани при попълване на заявления."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Име">
            <TextField value={firstName} onChange={setFirstName} />
          </FieldRow>
          <FieldRow label="Фамилия">
            <TextField value={lastName} onChange={setLastName} />
          </FieldRow>
          <FieldRow label="ЕГН" hint="Запазва се криптирано в базата данни.">
            <TextField value={egn} onChange={setEgn} />
          </FieldRow>
          <FieldRow label="Дата на раждане">
            <TextField value={dob} onChange={setDob} type="date" />
          </FieldRow>
          <FieldRow label="Пол">
            <SelectField<string>
              value={gender}
              onChange={setGender}
              options={GENDER_OPTIONS}
            />
          </FieldRow>
          <FieldRow label="Националност">
            <SelectField<number>
              value={nationalityId}
              onChange={setNationalityId}
              options={countryOptions}
            />
          </FieldRow>
          <FieldRow label="Месторождение">
            <TextField value={placeOfBirth} onChange={setPlaceOfBirth} />
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
