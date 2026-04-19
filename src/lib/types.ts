/**
 * Domain types mirroring Baserow DB 265 (AfterCitizen | Triaditza).
 *
 * Keep field names aligned with Baserow "Table Column Title Case" convention
 * so raw API responses can be consumed directly when user_field_names=true.
 */

export type LinkedRecord = { id: number; value: string; order?: string };

// Municipalities — Sofia districts (Триадица, Младост, Слатина, …) and other
// municipalities that may onboard later. The PDF templates pull headers,
// addressee labels, and the GDPR contact email from this row.
export interface Municipality {
  id: number;
  "Municipality Code": string;
  "Municipality Name BG": string;
  "Municipality Name EN"?: string;
  "Municipality Slug"?: string;
  "Municipality Type"?: { value: string } | string;
  "Municipality Deloviodstvo Email"?: string;
  "Municipality Contact Email"?: string;
  "Municipality Website URL"?: string;
  "Municipality Phone"?: string;
  "Municipality Address"?: string;
  "Municipality EIK"?: string;
  "Municipality Status"?: { value: string } | string;
}

// Categories — e.g. "Гражданска регистрация" (GR), "Устройство на територията" (UT)
export interface Category {
  id: number;
  "Category Code": string; // e.g. "GR"
  "Category Name BG": string;
  "Category Name EN"?: string;
  "Category Description"?: string;
  "Category Order"?: number;
  "Category Icon"?: string;
}

// A service the citizen can apply for — e.g. "Издаване на удостоверение за раждане — дубликат"
export interface Service {
  id: number;
  "Service Code": string; // e.g. "GR-012"
  "Service Title BG": string;
  "Service Title EN"?: string;
  "Service Description BG"?: string;
  "Service Legal Basis"?: string;
  "Service Processing Time"?: string;
  "Service Delivery Channel"?: string;
  "Service Linked Category": LinkedRecord[];
  "Service Linked Municipality"?: LinkedRecord[];
  "Service Status"?: { value: string } | string;
}

// The printable PDF form backing a service (the бланка)
export interface Form {
  id: number;
  "Form Code": string; // e.g. "GR-012"
  "Form Title BG": string;
  "Form Title EN"?: string;
  "Form Blank PDF R2 URL"?: string;
  "Form Linked Template": LinkedRecord[];
  "Form Linked Municipality"?: LinkedRecord[];
  "Form Is Visible"?: boolean;
  "Form Status"?: { value: string } | string;
  "Form Notes"?: string;
  "Form Last Modified On"?: string;
}

// Reusable form field definitions (the vocabulary)
export interface FieldDef {
  id: number;
  "Field Code": string; // e.g. "applicant_first_name"
  "Field Label BG": string;
  "Field Label EN"?: string;
  "Field Help BG"?: string;
  "Field Linked Type": LinkedRecord[];
  "Field Linked Dictionary"?: LinkedRecord[];
  "Field Status"?: { value: string } | string;
}

// Field types — text, long_text, date, number, select, boolean, file_upload, …
export interface FieldType {
  id: number;
  "Field Type Code": string;
  "Field Type HTML Input": string;
  "Field Type Description"?: string;
}

// Sections group fields within a form — applicant, subject, request, attachments, signature, consent
export interface Section {
  id: number;
  "Section Code": string;
  "Section Name BG": string;
  "Section Name EN"?: string;
  "Section Order"?: number;
}

// Dictionaries + entries power select fields
export interface Dictionary {
  id: number;
  "Dictionary Code": string;
  "Dictionary Name BG": string;
  "Dictionary Description"?: string;
}
export interface DictionaryEntry {
  id: number;
  "Entry Key": string;
  "Entry Label BG": string;
  "Entry Label EN"?: string;
  "Entry Order"?: number;
  "Entry Status"?: { value: string } | string;
  "Entry Linked Dictionary": LinkedRecord[];
}

// The binding that says "form X uses field Y in section Z at order N" with optional overrides
export interface FormField {
  id: number;
  "Form Field Order": string | number;
  "Form Field Required": boolean;
  "Form Field Default Value"?: string | null;
  "Form Field Label Override BG"?: string | null;
  "Form Field Help Override BG"?: string | null;
  "Form Field Linked Form": LinkedRecord[];
  "Form Field Linked Field": LinkedRecord[];
  "Form Field Linked Section": LinkedRecord[];
}

// The denormalized, rendering-ready schema the UI consumes
export interface RenderedField {
  formFieldId: number;
  order: number;
  code: string;              // field.Field Code
  labelBg: string;           // override or default
  helpBg?: string;
  typeCode: string;          // text / long_text / date / select / ...
  htmlInput: string;         // text / textarea / date / select / ...
  required: boolean;
  defaultValue?: string;
  dictionary?: { code: string; entries: { key: string; labelBg: string }[] };
  sectionCode: string;
  sectionNameBg: string;
}

export interface RenderedForm {
  form: Form;
  service?: Service;
  municipality?: Municipality;
  sections: { code: string; nameBg: string; fields: RenderedField[] }[];
}

// ---------------- Admin-side entities ----------------

// Universal user (table 2657 "Users"). Used for both staff (admin panel
// gated by `User Is Active` + role) and citizens (anyone signed in via
// Auth0 gets a row here, can manage their own profile/personal data).
export interface AdminUser {
  id: number;
  "User Email": string;
  "User First Name"?: string;
  "User Last Name"?: string;
  "User Full Name"?: string;
  "User Appear As"?: string;
  "User Username"?: string;
  "User Phone"?: string;
  "User Is Active"?: boolean;
  "User Linked User Role"?: LinkedRecord[];
  auth0_user_id?: string;
  "User Default Language"?: string;
  // Personal data
  "User EGN"?: string;
  "User Date Of Birth"?: string;
  "User Gender"?: { value: string } | string;
  "User Nationality"?: LinkedRecord[];
  "User Place Of Birth"?: string;
  // Legal representation
  "User Is Legal Representative"?: boolean;
  "User Represented Person EGN"?: string;
  "User Represented Person Full Name"?: string;
  "User Represented Person Relation"?: { value: string } | string;
  // Preferences
  "User Preferred Delivery Method"?: { value: string } | string;
  "User Marketing Opt In"?: boolean;
  "User Notification Opt In"?: boolean;
  "User Created On"?: string;
  "User Last Modified On"?: string;
}

export interface Country {
  id: number;
  "Country Code"?: string;
  "Country Name BG"?: string;
  "Country Name EN"?: string;
}

export interface Currency {
  id: number;
  "Currency ISO Code": string;
  "Currency Name (EN)"?: string;
  "Currency Name (BG)"?: string;
  "Currency Symbol"?: string;
}

// Singleton settings row driving application-wide configuration. Only
// admins and super admins should edit these via the admin settings page.
export interface Settings {
  id: number;
  "Settings Application Title"?: string;
  "Settings Application Tagline"?: string;
  "Settings Logo URL"?: string;
  "Settings Default Language"?: { value: string } | string;
  "Settings Date Format"?: { value: string } | string;
  "Settings Time Format"?: { value: string } | string;
  "Settings First Day Of Week"?: { value: string } | string;
  "Settings Timezone"?: string;
  "Settings Linked Default Currency"?: LinkedRecord[];
  "Settings Linked Default Country"?: LinkedRecord[];
  "Settings Site URL"?: string;
  "Settings API URL"?: string;
  "Settings Public Forms URL"?: string;
  "Settings Support Email"?: string;
  "Settings Support Phone"?: string;
  "Settings Privacy Policy URL"?: string;
  "Settings Terms URL"?: string;
  "Settings Cookie Policy URL"?: string;
  "Settings Email From Address"?: string;
  "Settings Email From Name"?: string;
  "Settings Maintenance Mode"?: boolean;
  "Settings Maintenance Message"?: string;
  "Settings Created On"?: string;
  "Settings Last Modified On"?: string;
}

export interface IdentityDocument {
  id: number;
  "Identity Document Linked User"?: LinkedRecord[];
  "Identity Document Type"?: { value: string } | string;
  "Identity Document Number"?: string;
  "Identity Document Issued By"?: string;
  "Identity Document Issued On"?: string;
  "Identity Document Valid Until"?: string;
  "Identity Document Is Primary"?: boolean;
  "Identity Document Created On"?: string;
  "Identity Document Last Modified On"?: string;
}

export interface Address {
  id: number;
  "Address Linked User"?: LinkedRecord[];
  "Address Type"?: { value: string } | string;
  "Address Linked Country"?: LinkedRecord[];
  "Address City"?: string;
  "Address Postal Code"?: string;
  "Address District"?: string;
  "Address Residential Area"?: string;
  "Address Street"?: string;
  "Address Street Number"?: string;
  "Address Block"?: string;
  "Address Entrance"?: string;
  "Address Floor"?: string;
  "Address Apartment"?: string;
  "Address Is Primary"?: boolean;
  "Address Created On"?: string;
  "Address Last Modified On"?: string;
}

export interface UserRole {
  id: number;
  "User Role Name": string;
  "User Role Is Active"?: boolean;
}

// A submitted form (table 2647). `Submission Linked Municipality` is
// the scoping key for the admin panel — staff only see rows whose
// linked municipality matches theirs.
export interface Submission {
  id: number;
  "Submission UUID"?: string;
  "Submission Linked Form"?: LinkedRecord[];
  "Submission Linked Service"?: LinkedRecord[];
  "Submission Linked Municipality"?: LinkedRecord[];
  "Submission Linked User"?: LinkedRecord[];
  "Submission Status"?: { value: SubmissionStatus } | string;
  "Submission Citizen Name"?: string;
  "Submission Citizen Email"?: string;
  "Submission Citizen Phone"?: string;
  "Submission Filled PDF R2 URL"?: string;
  "Submission VH Number"?: string;
  "Submission Language"?: { value: string } | string;
  "Submission Submitted At"?: string;
  "Submission Acknowledged At"?: string;
  "Submission Completed At"?: string;
  "Submission Rejection Reason"?: string;
  "Submission Created On"?: string;
  "Submission Last Modified On"?: string;
}

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "emailed"
  | "acknowledged"
  | "completed"
  | "rejected"
  | "cancelled";

export interface MunicipalDepartment {
  id: number;
  "Municipal Department Name BG": string;
  "Municipal Department Name EN"?: string;
  "Municipal Department Linked Municipality"?: LinkedRecord[];
  "Municipal Department Linked Unit Type"?: LinkedRecord[];
  "Municipal Department Linked Manager"?: LinkedRecord[];
  "Municipal Department Email"?: string;
  "Municipal Department Phone"?: string;
  "Municipal Department Created On"?: string;
  "Municipal Department Last Modified On"?: string;
}
