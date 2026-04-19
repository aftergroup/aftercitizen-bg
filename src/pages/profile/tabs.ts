/**
 * Profile tab definitions — shared between the citizen profile layout
 * (`ProfilePage`) and the admin layout's expandable "Моят профил" submenu
 * so both surfaces stay in sync when tabs are added or renamed.
 */
import {
  FileText,
  Files,
  Inbox,
  MapPin,
  Settings,
  Shield,
  User,
  Users2,
  type LucideIcon,
} from "lucide-react";

export interface ProfileTab {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const PROFILE_TABS: readonly ProfileTab[] = [
  { to: "account", label: "Профил", icon: User },
  { to: "personal", label: "Лични данни", icon: FileText },
  { to: "my-submissions", label: "Моите заявления", icon: Inbox },
  { to: "documents", label: "Документи", icon: Files },
  { to: "addresses", label: "Адреси", icon: MapPin },
  { to: "representation", label: "Представителство", icon: Users2 },
  { to: "settings", label: "Настройки", icon: Settings },
  { to: "security", label: "Сигурност", icon: Shield },
] as const;
