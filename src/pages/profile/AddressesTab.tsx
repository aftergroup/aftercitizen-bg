import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import { Drawer } from "@/components/Drawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RowActions } from "@/components/admin/RowActions";
import { Plus, Star } from "lucide-react";
import type { Address, AdminUser } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField, selectValue } from "./shared";

const ADDRESS_TYPE_OPTIONS = [
  { value: "Постоянен", label: "Постоянен" },
  { value: "Настоящ", label: "Настоящ" },
  { value: "За кореспонденция", label: "За кореспонденция" },
];

export default function AddressesTab({ user }: { user: AdminUser }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", "addresses", user.id],
    queryFn: () => baserow.listAddressesForUser(user.id),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Адреси"
        description="Постоянен, настоящ и адрес за кореспонденция."
      >
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Нов адрес
          </Button>
        </div>

        {isLoading ? (
          <div className="h-24 bg-muted/30 rounded animate-pulse" />
        ) : (data ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Няма добавени адреси.
          </div>
        ) : (
          <div className="space-y-3">
            {(data ?? []).map((a) => (
              <div
                key={a.id}
                className="border rounded-md p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {selectValue(a["Address Type"]) || "—"}
                    </span>
                    {a["Address Is Primary"] && (
                      <span className="inline-flex items-center gap-1 text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                        <Star className="h-3 w-3" /> основен
                      </span>
                    )}
                  </div>
                  <div className="text-sm">{formatAddress(a)}</div>
                  {(a["Address Block"] ||
                    a["Address Entrance"] ||
                    a["Address Floor"] ||
                    a["Address Apartment"]) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[
                        a["Address Block"] && `бл. ${a["Address Block"]}`,
                        a["Address Entrance"] && `вх. ${a["Address Entrance"]}`,
                        a["Address Floor"] && `ет. ${a["Address Floor"]}`,
                        a["Address Apartment"] && `ап. ${a["Address Apartment"]}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <RowActions
                  onEdit={() => setEditing(a)}
                  onDelete={() => setDeleting(a)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddressDrawer
        open={!!editing || creating}
        address={editing}
        userId={user.id}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
      <DeleteAddressDialog
        address={deleting}
        userId={user.id}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function AddressDrawer({
  open,
  address,
  userId,
  onClose,
}: {
  open: boolean;
  address: Address | null;
  userId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCreate = !address;

  const { data: countries } = useQuery({
    queryKey: ["profile", "countries"],
    queryFn: () => baserow.listCountries(),
    staleTime: 60 * 60 * 1000,
  });

  const [type, setType] = useState<string | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [block, setBlock] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (open) {
      setType(selectValue(address?.["Address Type"]) ?? null);
      setCountryId(address?.["Address Linked Country"]?.[0]?.id ?? null);
      setCity(address?.["Address City"] ?? "");
      setPostalCode(address?.["Address Postal Code"] ?? "");
      setDistrict(address?.["Address District"] ?? "");
      setArea(address?.["Address Residential Area"] ?? "");
      setStreet(address?.["Address Street"] ?? "");
      setStreetNumber(address?.["Address Street Number"] ?? "");
      setBlock(address?.["Address Block"] ?? "");
      setEntrance(address?.["Address Entrance"] ?? "");
      setFloor(address?.["Address Floor"] ?? "");
      setApartment(address?.["Address Apartment"] ?? "");
      setIsPrimary(address?.["Address Is Primary"] ?? false);
    }
  }, [open, address]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Address> = {
        "Address Type": type ? { value: type } : undefined,
        "Address Linked Country": countryId ? [{ id: countryId, value: "" }] : [],
        "Address City": city || undefined,
        "Address Postal Code": postalCode || undefined,
        "Address District": district || undefined,
        "Address Residential Area": area || undefined,
        "Address Street": street || undefined,
        "Address Street Number": streetNumber || undefined,
        "Address Block": block || undefined,
        "Address Entrance": entrance || undefined,
        "Address Floor": floor || undefined,
        "Address Apartment": apartment || undefined,
        "Address Is Primary": isPrimary,
      };
      if (isCreate) {
        return baserow.createAddress({
          ...payload,
          "Address Linked User": [{ id: userId, value: "" }],
        });
      }
      return baserow.updateAddress(address!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "addresses"] });
      toast.success(isCreate ? "Адресът е добавен" : "Адресът е обновен");
      onClose();
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
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Нов адрес" : "Редактиране на адрес"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!type || !city.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Запазване…" : isCreate ? "Създай" : "Запази"}
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
        <FieldRow label="Тип *">
          <SelectField<string>
            value={type}
            onChange={setType}
            options={ADDRESS_TYPE_OPTIONS}
          />
        </FieldRow>
        <FieldRow label="Държава">
          <SelectField<number>
            value={countryId}
            onChange={setCountryId}
            options={countryOptions}
          />
        </FieldRow>
        <FieldRow label="Пощенски код">
          <TextField value={postalCode} onChange={setPostalCode} />
        </FieldRow>
        <FieldRow label="Град *">
          <TextField value={city} onChange={setCity} />
        </FieldRow>
        <FieldRow label="Район">
          <TextField value={district} onChange={setDistrict} />
        </FieldRow>
        <FieldRow label="Ж.к. / квартал">
          <TextField value={area} onChange={setArea} />
        </FieldRow>
        <FieldRow label="Улица">
          <TextField value={street} onChange={setStreet} />
        </FieldRow>
        <FieldRow label="Номер">
          <TextField value={streetNumber} onChange={setStreetNumber} />
        </FieldRow>
        <FieldRow label="Блок">
          <TextField value={block} onChange={setBlock} />
        </FieldRow>
        <FieldRow label="Вход">
          <TextField value={entrance} onChange={setEntrance} />
        </FieldRow>
        <FieldRow label="Етаж">
          <TextField value={floor} onChange={setFloor} />
        </FieldRow>
        <FieldRow label="Апартамент">
          <TextField value={apartment} onChange={setApartment} />
        </FieldRow>
        <FieldRow label="Основен">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Основен адрес от този тип
          </label>
        </FieldRow>
      </div>
    </Drawer>
  );
}

function DeleteAddressDialog({
  address,
  userId,
  onClose,
}: {
  address: Address | null;
  userId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteAddress(address!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "addresses", userId] });
      toast.success("Адресът е изтрит");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!address}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на адрес"
      description={
        address ? (
          <>
            Сигурни ли сте, че искате да изтриете{" "}
            <b>{selectValue(address["Address Type"])}</b> — {formatAddress(address)}?
          </>
        ) : null
      }
      destructive
      confirmLabel="Изтрий"
      isPending={mutation.isPending}
    />
  );
}

function formatAddress(a: Address): string {
  const parts = [
    a["Address City"],
    a["Address Residential Area"] && `ж.к. ${a["Address Residential Area"]}`,
    a["Address Street"] && `ул. ${a["Address Street"]}`,
    a["Address Street Number"] && `№ ${a["Address Street Number"]}`,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}
