/**
 * Domain types mirroring Baserow DB 265 (AfterCitizen | Triaditza).
 *
 * Keep field names aligned with Baserow "Table Column Title Case" convention
 * so raw API responses can be consumed directly when user_field_names=true.
 */

export type LinkedRecord = { id: number; value: string; order?: string };

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
  "Service Status"?: { value: string } | string;
}

// The printable PDF form backing a service (the бланка)
export interface Form {
  id: number;
  "Form Code": string; // e.g. "GR-012"
  "Form Title BG": string;
  "Form Blank PDF R2 URL"?: string;
  "Form Linked Template": LinkedRecord[];
  "Form Status"?: { value: string } | string;
  "Form Notes"?: string;
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
  sections: { code: string; nameBg: string; fields: RenderedField[] }[];
}
