/**
 * Application-wide settings (singleton row in table 2663). Access is
 * restricted to Administrator / Super Administrator roles — citizens and
 * lower-tier staff don't see the tab in the sidebar and hit an
 * access-denied screen if they navigate here directly.
 *
 * Fields group into tabs: General, Localization, Communication, Legal,
 * Payments, and Maintenance. Payments is forward-looking — only Postbank
 * is available as a provider today, but the picker is UI-ready so new
 * providers slot in without restructuring the tab.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { baserow } from "@/lib/baserow";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button, Input } from "@/components/ui";
import {
  Card,
  CheckboxField,
  FieldRow,
  SelectField,
  TextField,
  selectValue,
} from "@/pages/profile/shared";
import type { Settings } from "@/lib/types";

type Tab =
  | "general"
  | "localization"
  | "communication"
  | "legal"
  | "payments"
  | "maintenance";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Общи" },
  { id: "localization", label: "Локализация" },
  { id: "communication", label: "Комуникация" },
  { id: "legal", label: "Правни" },
  { id: "payments", label: "Плащания" },
  { id: "maintenance", label: "Поддръжка" },
];

export default function AdminSettings() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  if (isAdminLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md bg-white border rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          <div className="font-semibold">Нямате достъп</div>
        </div>
        <p className="text-sm text-muted-foreground">
          Системните настройки могат да се редактират само от роли{" "}
          <b>Administrator</b> и <b>Super Administrator</b>.
        </p>
      </div>
    );
  }

  return <SettingsEditor />;
}

function SettingsEditor() {
  const [tab, setTab] = useState<Tab>("general");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => baserow.getSettings(),
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  if (!data) {
    return (
      <div className="max-w-md bg-white border rounded-lg p-6 text-sm space-y-1">
        <div className="font-semibold">Няма инициализирани настройки</div>
        <p className="text-muted-foreground">
          Създайте ред в таблица <code>Settings</code> (2663), за да
          активирате тази страница.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Приложни настройки за цялата платформа.
        </p>
      </div>

      <div className="border-b flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab settings={data} />}
      {tab === "localization" && <LocalizationTab settings={data} />}
      {tab === "communication" && <CommunicationTab settings={data} />}
      {tab === "legal" && <LegalTab settings={data} />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "maintenance" && <MaintenanceTab settings={data} />}
    </div>
  );
}

// ================== Tabs ==================

function GeneralTab({ settings }: { settings: Settings }) {
  const save = useSettingsMutation(settings.id);
  const [title, setTitle] = useState(settings["Settings Application Title"] ?? "");
  const [tagline, setTagline] = useState(settings["Settings Application Tagline"] ?? "");
  const [logoUrl, setLogoUrl] = useState(settings["Settings Logo URL"] ?? "");
  const [siteUrl, setSiteUrl] = useState(settings["Settings Site URL"] ?? "");
  const [apiUrl, setApiUrl] = useState(settings["Settings API URL"] ?? "");
  const [formsUrl, setFormsUrl] = useState(settings["Settings Public Forms URL"] ?? "");

  useEffect(() => {
    setTitle(settings["Settings Application Title"] ?? "");
    setTagline(settings["Settings Application Tagline"] ?? "");
    setLogoUrl(settings["Settings Logo URL"] ?? "");
    setSiteUrl(settings["Settings Site URL"] ?? "");
    setApiUrl(settings["Settings API URL"] ?? "");
    setFormsUrl(settings["Settings Public Forms URL"] ?? "");
  }, [settings]);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card title="Идентичност" description="Заглавие, подзаглавие и лого на платформата.">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Заглавие">
            <TextField value={title} onChange={setTitle} />
          </FieldRow>
          <FieldRow label="Подзаглавие">
            <TextField value={tagline} onChange={setTagline} />
          </FieldRow>
          <FieldRow label="URL на лого" hint="Публично достъпен URL към SVG/PNG.">
            <TextField value={logoUrl} onChange={setLogoUrl} />
          </FieldRow>
        </div>
        {logoUrl && (
          <div className="mt-2 flex items-center gap-3 p-3 border rounded-md bg-muted/30">
            <img src={logoUrl} alt="Logo preview" className="h-10 w-auto" />
            <span className="text-xs text-muted-foreground">Визуализация</span>
          </div>
        )}
      </Card>

      <Card title="URL адреси">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Site URL">
            <TextField value={siteUrl} onChange={setSiteUrl} />
          </FieldRow>
          <FieldRow label="API URL">
            <TextField value={apiUrl} onChange={setApiUrl} />
          </FieldRow>
          <FieldRow label="Public Forms URL">
            <TextField value={formsUrl} onChange={setFormsUrl} />
          </FieldRow>
        </div>
      </Card>

      <SaveButton
        isPending={save.isPending}
        onClick={() =>
          save.mutate({
            "Settings Application Title": title,
            "Settings Application Tagline": tagline,
            "Settings Logo URL": logoUrl || undefined,
            "Settings Site URL": siteUrl || undefined,
            "Settings API URL": apiUrl || undefined,
            "Settings Public Forms URL": formsUrl || undefined,
          })
        }
      />
    </div>
  );
}

function LocalizationTab({ settings }: { settings: Settings }) {
  const save = useSettingsMutation(settings.id);
  const { data: currencies } = useQuery({
    queryKey: ["admin", "currencies"],
    queryFn: () => baserow.listCurrencies(),
    staleTime: 60 * 60 * 1000,
  });
  const { data: countries } = useQuery({
    queryKey: ["profile", "countries"],
    queryFn: () => baserow.listCountries(),
    staleTime: 60 * 60 * 1000,
  });

  const [language, setLanguage] = useState<string | null>(
    selectValue(settings["Settings Default Language"]) ?? null,
  );
  const [dateFormat, setDateFormat] = useState<string | null>(
    selectValue(settings["Settings Date Format"]) ?? null,
  );
  const [timeFormat, setTimeFormat] = useState<string | null>(
    selectValue(settings["Settings Time Format"]) ?? null,
  );
  const [firstDay, setFirstDay] = useState<string | null>(
    selectValue(settings["Settings First Day Of Week"]) ?? null,
  );
  const [timezone, setTimezone] = useState(settings["Settings Timezone"] ?? "");
  const [currencyId, setCurrencyId] = useState<number | null>(
    settings["Settings Linked Default Currency"]?.[0]?.id ?? null,
  );
  const [countryId, setCountryId] = useState<number | null>(
    settings["Settings Linked Default Country"]?.[0]?.id ?? null,
  );

  useEffect(() => {
    setLanguage(selectValue(settings["Settings Default Language"]) ?? null);
    setDateFormat(selectValue(settings["Settings Date Format"]) ?? null);
    setTimeFormat(selectValue(settings["Settings Time Format"]) ?? null);
    setFirstDay(selectValue(settings["Settings First Day Of Week"]) ?? null);
    setTimezone(settings["Settings Timezone"] ?? "");
    setCurrencyId(settings["Settings Linked Default Currency"]?.[0]?.id ?? null);
    setCountryId(settings["Settings Linked Default Country"]?.[0]?.id ?? null);
  }, [settings]);

  const currencyOptions = (currencies ?? []).map((c) => ({
    value: c.id,
    label: `${c["Currency ISO Code"]} — ${c["Currency Name (BG)"] || c["Currency Name (EN)"] || ""}`,
  }));
  const countryOptions = (countries ?? []).map((c) => ({
    value: c.id,
    label: c["Country Name BG"] || c["Country Name EN"] || c["Country Code"] || `#${c.id}`,
  }));

  return (
    <div className="space-y-4 max-w-4xl">
      <Card title="Език и регион">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Език по подразбиране">
            <SelectField<string>
              value={language}
              onChange={setLanguage}
              options={[
                { value: "bg", label: "Български" },
                { value: "en", label: "English" },
              ]}
            />
          </FieldRow>
          <FieldRow label="Часови пояс">
            <TextField
              value={timezone}
              onChange={setTimezone}
              placeholder="Europe/Sofia"
            />
          </FieldRow>
          <FieldRow label="Държава по подразбиране">
            <SelectField<number>
              value={countryId}
              onChange={setCountryId}
              options={countryOptions}
            />
          </FieldRow>
          <FieldRow label="Валута по подразбиране">
            <SelectField<number>
              value={currencyId}
              onChange={setCurrencyId}
              options={currencyOptions}
            />
          </FieldRow>
        </div>
      </Card>

      <Card title="Формати за дата и час">
        <div className="grid md:grid-cols-3 gap-4">
          <FieldRow label="Формат на дата">
            <SelectField<string>
              value={dateFormat}
              onChange={setDateFormat}
              options={[
                { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              ]}
            />
          </FieldRow>
          <FieldRow label="Формат на час">
            <SelectField<string>
              value={timeFormat}
              onChange={setTimeFormat}
              options={[
                { value: "24h", label: "24-часов" },
                { value: "12h", label: "12-часов" },
              ]}
            />
          </FieldRow>
          <FieldRow label="Първи ден от седмицата">
            <SelectField<string>
              value={firstDay}
              onChange={setFirstDay}
              options={[
                { value: "monday", label: "Понеделник" },
                { value: "sunday", label: "Неделя" },
                { value: "saturday", label: "Събота" },
              ]}
            />
          </FieldRow>
        </div>
      </Card>

      <SaveButton
        isPending={save.isPending}
        onClick={() =>
          save.mutate({
            "Settings Default Language": language ? { value: language } : undefined,
            "Settings Date Format": dateFormat ? { value: dateFormat } : undefined,
            "Settings Time Format": timeFormat ? { value: timeFormat } : undefined,
            "Settings First Day Of Week": firstDay ? { value: firstDay } : undefined,
            "Settings Timezone": timezone || undefined,
            "Settings Linked Default Currency": currencyId
              ? [{ id: currencyId, value: "" }]
              : [],
            "Settings Linked Default Country": countryId
              ? [{ id: countryId, value: "" }]
              : [],
          })
        }
      />
    </div>
  );
}

function CommunicationTab({ settings }: { settings: Settings }) {
  const save = useSettingsMutation(settings.id);
  const [supportEmail, setSupportEmail] = useState(settings["Settings Support Email"] ?? "");
  const [supportPhone, setSupportPhone] = useState(settings["Settings Support Phone"] ?? "");
  const [fromEmail, setFromEmail] = useState(settings["Settings Email From Address"] ?? "");
  const [fromName, setFromName] = useState(settings["Settings Email From Name"] ?? "");

  useEffect(() => {
    setSupportEmail(settings["Settings Support Email"] ?? "");
    setSupportPhone(settings["Settings Support Phone"] ?? "");
    setFromEmail(settings["Settings Email From Address"] ?? "");
    setFromName(settings["Settings Email From Name"] ?? "");
  }, [settings]);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card title="Поддръжка" description="Канали за контакт, които се показват на гражданите.">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Имейл за поддръжка">
            <Input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              type="email"
            />
          </FieldRow>
          <FieldRow label="Телефон за поддръжка">
            <TextField value={supportPhone} onChange={setSupportPhone} />
          </FieldRow>
        </div>
      </Card>

      <Card title="Изпращане на имейли" description="Данни за заглавка From: в системните имейли.">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="From адрес">
            <Input
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              type="email"
            />
          </FieldRow>
          <FieldRow label="From име">
            <TextField value={fromName} onChange={setFromName} />
          </FieldRow>
        </div>
      </Card>

      <SaveButton
        isPending={save.isPending}
        onClick={() =>
          save.mutate({
            "Settings Support Email": supportEmail || undefined,
            "Settings Support Phone": supportPhone || undefined,
            "Settings Email From Address": fromEmail || undefined,
            "Settings Email From Name": fromName || undefined,
          })
        }
      />
    </div>
  );
}

function LegalTab({ settings }: { settings: Settings }) {
  const save = useSettingsMutation(settings.id);
  const [privacy, setPrivacy] = useState(settings["Settings Privacy Policy URL"] ?? "");
  const [terms, setTerms] = useState(settings["Settings Terms URL"] ?? "");
  const [cookies, setCookies] = useState(settings["Settings Cookie Policy URL"] ?? "");

  useEffect(() => {
    setPrivacy(settings["Settings Privacy Policy URL"] ?? "");
    setTerms(settings["Settings Terms URL"] ?? "");
    setCookies(settings["Settings Cookie Policy URL"] ?? "");
  }, [settings]);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card
        title="Правни документи"
        description="URL адреси към политиките, показвани във футъра на сайта."
      >
        <FieldRow label="Политика за поверителност">
          <TextField value={privacy} onChange={setPrivacy} />
        </FieldRow>
        <FieldRow label="Условия за ползване">
          <TextField value={terms} onChange={setTerms} />
        </FieldRow>
        <FieldRow label="Политика за бисквитки">
          <TextField value={cookies} onChange={setCookies} />
        </FieldRow>
      </Card>

      <SaveButton
        isPending={save.isPending}
        onClick={() =>
          save.mutate({
            "Settings Privacy Policy URL": privacy || undefined,
            "Settings Terms URL": terms || undefined,
            "Settings Cookie Policy URL": cookies || undefined,
          })
        }
      />
    </div>
  );
}

function PaymentsTab() {
  // Payment providers are not persisted in the Settings table yet; this
  // tab is UI-ready so a future schema addition plugs in without
  // restructuring the layout. Today Postbank is the only option.
  const [postbankEnabled, setPostbankEnabled] = useState(true);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card
        title="Платежни оператори"
        description="Оператори, чрез които гражданите могат да заплащат таксите към администрацията."
      >
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border rounded-md cursor-pointer hover:bg-accent/40">
            <input
              type="checkbox"
              checked={postbankEnabled}
              onChange={(e) => setPostbankEnabled(e.target.checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">Пощенска банка (Postbank)</div>
                <span className="inline-flex items-center bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  активен
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Интеграция с платежния портал на Пощенска банка. Използва
                се като основен оператор за всички такси към района.
              </div>
            </div>
          </label>

          <div className="p-4 border border-dashed rounded-md text-sm text-muted-foreground bg-muted/20">
            Допълнителни оператори (ePay, eBG, карти) ще бъдат добавени при
            наличност на договор и сертификация.
          </div>
        </div>
      </Card>

      <Card title="Такси" description="Настройки за изчисляване и показване на такси към гражданите.">
        <div className="text-sm text-muted-foreground">
          Таксите се дефинират в таблица <code>Service Fees</code> (2641) на ниво услуга.
        </div>
      </Card>
    </div>
  );
}

function MaintenanceTab({ settings }: { settings: Settings }) {
  const save = useSettingsMutation(settings.id);
  const [enabled, setEnabled] = useState(settings["Settings Maintenance Mode"] ?? false);
  const [message, setMessage] = useState(settings["Settings Maintenance Message"] ?? "");

  useEffect(() => {
    setEnabled(settings["Settings Maintenance Mode"] ?? false);
    setMessage(settings["Settings Maintenance Message"] ?? "");
  }, [settings]);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card
        title="Режим на поддръжка"
        description="Когато е активен, гражданите виждат съобщение вместо формулярите."
      >
        <CheckboxField
          checked={enabled}
          onChange={setEnabled}
          label="Активирай режим на поддръжка"
        />
        <FieldRow label="Съобщение">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Системата е временно в режим на поддръжка…"
          />
        </FieldRow>
      </Card>

      <SaveButton
        isPending={save.isPending}
        onClick={() =>
          save.mutate({
            "Settings Maintenance Mode": enabled,
            "Settings Maintenance Message": message,
          })
        }
      />
    </div>
  );
}

// ================== Shared ==================

function useSettingsMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => baserow.updateSettings(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Настройките са запазени");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });
}

function SaveButton({
  isPending,
  onClick,
}: {
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Button disabled={isPending} onClick={onClick}>
        {isPending ? "Запазване…" : "Запази"}
      </Button>
    </div>
  );
}
