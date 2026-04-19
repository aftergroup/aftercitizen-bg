import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { LogOut, ShieldCheck } from "lucide-react";
import { Card, FieldRow } from "./shared";

/**
 * Security tab — Auth0-only, no Baserow touchpoints. Password change goes
 * through Auth0's `/dbconnections/change_password` endpoint (sends a reset
 * email). Session / MFA management is intentionally delegated to Auth0's
 * Universal Login rather than built here.
 */
export default function SecurityTab() {
  const { user, logout } = useAuth0();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const connection =
    import.meta.env.VITE_AUTH0_DB_CONNECTION ?? "Username-Password-Authentication";

  const sendPasswordReset = async () => {
    if (!user?.email) {
      toast.error("Имейлът не е достъпен от Auth0");
      return;
    }
    setIsSendingReset(true);
    try {
      const res = await fetch(`https://${domain}/dbconnections/change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          email: user.email,
          connection,
        }),
      });
      if (!res.ok) throw new Error(`Auth0 ${res.status}`);
      toast.success(`Изпратен е имейл за смяна на парола до ${user.email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Идентификация"
        description="Данни от Auth0, управлението им става през платформата за идентификация."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <FieldRow label="Имейл">
            <div className="text-sm">{user?.email ?? "—"}</div>
          </FieldRow>
          <FieldRow label="Auth0 ID">
            <div className="text-sm font-mono text-xs break-all">{user?.sub ?? "—"}</div>
          </FieldRow>
          <FieldRow label="Последно обновяване">
            <div className="text-sm">
              {user?.updated_at
                ? new Date(user.updated_at).toLocaleString("bg-BG")
                : "—"}
            </div>
          </FieldRow>
          <FieldRow label="Имейлът е потвърден">
            <div className="text-sm">
              {user?.email_verified ? (
                <span className="inline-flex items-center gap-1 text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                  <ShieldCheck className="h-3 w-3" /> да
                </span>
              ) : (
                <span className="text-muted-foreground">не</span>
              )}
            </div>
          </FieldRow>
        </div>
      </Card>

      <Card
        title="Парола"
        description="Ще получите имейл с връзка за задаване на нова парола."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Имейл за смяна на парола до <b>{user?.email}</b>
          </div>
          <Button onClick={sendPasswordReset} disabled={isSendingReset}>
            {isSendingReset ? "Изпращане…" : "Изпрати"}
          </Button>
        </div>
      </Card>

      <Card
        title="Сесии"
        description="Излизане от всички устройства се прави чрез изход тук и повторен вход."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Текущата сесия ще бъде прекратена и ще бъдете пренасочени към началната страница.
          </div>
          <Button
            variant="outline"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            <LogOut className="h-4 w-4" /> Излизане
          </Button>
        </div>
      </Card>
    </div>
  );
}
