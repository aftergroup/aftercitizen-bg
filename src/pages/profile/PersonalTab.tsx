import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Facebook, Linkedin } from "lucide-react";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import type { AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField, selectValue } from "./shared";
import { CountrySelect, findBulgariaId } from "@/components/CountrySelect";

const GENDER_OPTIONS = [
  { value: "Мъж", label: "Мъж" },
  { value: "Жена", label: "Жена" },
];

export default function PersonalTab({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();

  const { data: countries } = useQuery({
    queryKey: ["profile", "countries"],
    queryFn: () => baserow.listCountries(),
    staleTime: 60 * 60 * 1000,
  });

  const [firstName, setFirstName] = useState(user["User First Name"] ?? "");
  const [middleName, setMiddleName] = useState(user["User Middle Name"] ?? "");
  const [lastName, setLastName] = useState(user["User Last Name"] ?? "");
  const [egn, setEgn] = useState(user["User EGN"] ?? "");
  const [dob, setDob] = useState(user["User Date Of Birth"] ?? "");
  const [gender, setGender] = useState<string | null>(
    selectValue(user["User Gender"]) ?? null,
  );
  const [nationalityId, setNationalityId] = useState<number | null>(
    user["User Nationality"]?.[0]?.id ?? null,
  );
  // Default new (unsaved) nationality to Bulgaria once the countries list
  // has loaded; existing values win.
  useEffect(() => {
    if (nationalityId == null && countries) {
      const bg = findBulgariaId(countries);
      if (bg != null) setNationalityId(bg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);
  const [placeOfBirth, setPlaceOfBirth] = useState(user["User Place Of Birth"] ?? "");
  const [company, setCompany] = useState(user["User Company"] ?? "");
  const [jobRole, setJobRole] = useState(user["User Job Role"] ?? "");
  const [facebookUrl, setFacebookUrl] = useState(user["User Facebook URL"] ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user["User LinkedIn URL"] ?? "");

  useEffect(() => {
    setFirstName(user["User First Name"] ?? "");
    setMiddleName(user["User Middle Name"] ?? "");
    setLastName(user["User Last Name"] ?? "");
    setEgn(user["User EGN"] ?? "");
    setDob(user["User Date Of Birth"] ?? "");
    setGender(selectValue(user["User Gender"]) ?? null);
    setNationalityId(user["User Nationality"]?.[0]?.id ?? null);
    setPlaceOfBirth(user["User Place Of Birth"] ?? "");
    setCompany(user["User Company"] ?? "");
    setJobRole(user["User Job Role"] ?? "");
    setFacebookUrl(user["User Facebook URL"] ?? "");
    setLinkedinUrl(user["User LinkedIn URL"] ?? "");
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateAdminUser(user.id, {
        "User First Name": firstName || undefined,
        "User Middle Name": middleName || undefined,
        "User Last Name": lastName || undefined,
        "User EGN": egn || undefined,
        "User Date Of Birth": dob || undefined,
        "User Gender": gender ? { value: gender } : undefined,
        "User Nationality": nationalityId ? [{ id: nationalityId, value: "" }] : [],
        "User Place Of Birth": placeOfBirth || undefined,
        "User Company": company || undefined,
        "User Job Role": jobRole || undefined,
        "User Facebook URL": facebookUrl || undefined,
        "User LinkedIn URL": linkedinUrl || undefined,
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


  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Лични данни"
        description="Данни за идентификация, използвани при попълване на заявления."
      >
        <div className="grid md:grid-cols-3 gap-4">
          <FieldRow label="Име">
            <TextField value={firstName} onChange={setFirstName} />
          </FieldRow>
          <FieldRow label="Презиме">
            <TextField value={middleName} onChange={setMiddleName} />
          </FieldRow>
          <FieldRow label="Фамилия">
            <TextField value={lastName} onChange={setLastName} />
          </FieldRow>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
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
            <CountrySelect
              value={nationalityId}
              onChange={setNationalityId}
              countries={countries ?? []}
            />
          </FieldRow>
          <FieldRow label="Месторождение">
            <TextField value={placeOfBirth} onChange={setPlaceOfBirth} />
          </FieldRow>
        </div>
      </Card>

      <Card
        title="Работа и социални мрежи"
        description="Незадължителни данни за професионална идентичност."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Компания">
            <TextField value={company} onChange={setCompany} />
          </FieldRow>
          <FieldRow label="Длъжност">
            <TextField value={jobRole} onChange={setJobRole} />
          </FieldRow>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Facebook className="h-3.5 w-3.5" /> Facebook
            </div>
            <TextField
              value={facebookUrl}
              onChange={setFacebookUrl}
              placeholder="https://facebook.com/…"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </div>
            <TextField
              value={linkedinUrl}
              onChange={setLinkedinUrl}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
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
