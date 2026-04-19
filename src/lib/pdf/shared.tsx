/**
 * Shared building blocks for GRAO-family PDF templates.
 *
 * Every bespoke GR-* template shares the same chrome — A4 page styles,
 * addressee block (top-right), applicant identity block, service-speed /
 * format / delivery checkboxes, and date / signature footer. This module
 * extracts them so each form's .tsx file only has to describe the middle
 * (the form-specific body).
 */
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { RenderedField, RenderedForm } from "@/lib/types";
import { fieldValueMatches, formatBgDate, getFieldValue } from "./helpers";

export { fieldValueMatches } from "./helpers";

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.45,
    color: "#111",
  },
  addresseeBlock: { alignSelf: "flex-end", width: 280, marginBottom: 18 },
  addresseeLine: { fontWeight: 700, fontSize: 11 },
  addresseeFill: {
    borderBottom: "1pt dotted #555",
    marginTop: 2,
    marginBottom: 2,
    height: 13,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  caption: { fontSize: 8, color: "#555", textAlign: "center" },
  title: { textAlign: "center", fontSize: 16, fontWeight: 700, marginTop: 6 },
  subtitle: { textAlign: "center", fontSize: 11, fontWeight: 700, marginBottom: 14 },
  row: { flexDirection: "row", gap: 6, alignItems: "flex-end", marginBottom: 6 },
  label: { fontSize: 10 },
  fillLine: {
    flex: 1,
    borderBottom: "1pt dotted #333",
    minHeight: 13,
    paddingHorizontal: 4,
  },
  fillBoxLarge: {
    borderBottom: "1pt dotted #333",
    minHeight: 13,
    paddingHorizontal: 4,
  },
  salutation: { fontWeight: 700, marginTop: 10, marginBottom: 2 },
  paragraph: { marginBottom: 4 },
  requestBody: {
    minHeight: 64,
    borderBottom: "1pt dotted #333",
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 10,
  },
  sectionHeader: { marginTop: 10, marginBottom: 4 },
  numberedItem: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  numberedIndex: { width: 12, fontSize: 10 },
  checkRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  checkItem: { flexDirection: "row", gap: 4, alignItems: "center" },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#333",
    padding: 1.2,
  },
  checkboxFill: { flex: 1, backgroundColor: "#111" },
  footer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  footerField: {
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-end",
    minWidth: 160,
  },
  signatureBox: {
    width: 160,
    height: 48,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "solid",
    backgroundColor: "#fff",
    padding: 2,
  },
  signatureImage: { width: "100%", height: "100%", objectFit: "contain" },
  helper: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
    marginTop: -2,
    marginBottom: 4,
  },
  gdprFooter: { marginTop: 24, fontSize: 8, color: "#444", lineHeight: 1.35 },
  kvRow: { flexDirection: "row", gap: 6, alignItems: "flex-end", marginBottom: 5 },
  kvLabel: { fontSize: 10, minWidth: 90 },
  box: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 6,
    marginBottom: 8,
  },
  boxHeader: {
    fontWeight: 700,
    fontSize: 10.5,
    marginBottom: 4,
    textDecoration: "underline",
  },
});

export function findField(
  schema: RenderedForm,
  code: string,
): RenderedField | undefined {
  for (const s of schema.sections) {
    const f = s.fields.find((x) => x.code === code);
    if (f) return f;
  }
  return undefined;
}

export function firstFieldMatching(
  schema: RenderedForm,
  predicate: (f: RenderedField) => boolean,
): RenderedField | undefined {
  for (const s of schema.sections) {
    const f = s.fields.find(predicate);
    if (f) return f;
  }
  return undefined;
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={pdfStyles.checkbox}>
      {checked ? <View style={pdfStyles.checkboxFill} /> : null}
    </View>
  );
}

export function AddresseeBlock({ line = "До кмета на" }: { line?: string } = {}) {
  const parts = line.split(" на");
  const head = parts[0];
  return (
    <View style={pdfStyles.addresseeBlock}>
      <Text style={pdfStyles.addresseeLine}>{head}</Text>
      <Text style={{ fontWeight: 700 }}>на</Text>
      <Text style={pdfStyles.addresseeFill}>Район Триадица</Text>
      <Text style={pdfStyles.caption}>(район/ кметство)</Text>
    </View>
  );
}

export function HeaderTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <Text style={pdfStyles.title}>{title}</Text>
      {subtitle ? <Text style={pdfStyles.subtitle}>{subtitle}</Text> : null}
    </>
  );
}

export interface ApplicantFieldRefs {
  firstName?: RenderedField;
  fatherName?: RenderedField;
  familyName?: RenderedField;
  egn?: RenderedField;
  birthDate?: RenderedField;
  citizenship?: RenderedField;
  idDocNumber?: RenderedField;
  idDocIssueDate?: RenderedField;
  idDocIssuer?: RenderedField;
  address?: RenderedField;
  phone?: RenderedField;
  email?: RenderedField;
}

export function resolveApplicantFields(schema: RenderedForm): ApplicantFieldRefs {
  return {
    firstName: findField(schema, "applicant_first_name"),
    fatherName: findField(schema, "applicant_father_name"),
    familyName: findField(schema, "applicant_family_name"),
    egn:
      findField(schema, "applicant_egn") ??
      firstFieldMatching(
        schema,
        (f) => f.code.includes("egn") && !f.code.includes("subject") && !f.code.includes("deceased") && !f.code.includes("child"),
      ),
    birthDate:
      findField(schema, "applicant_birth_date") ??
      firstFieldMatching(
        schema,
        (f) => f.code.includes("birth_date") && !f.code.includes("subject") && !f.code.includes("deceased") && !f.code.includes("child"),
      ),
    citizenship: findField(schema, "applicant_citizenship"),
    idDocNumber: findField(schema, "id_doc_number"),
    idDocIssueDate: findField(schema, "id_doc_issue_date"),
    idDocIssuer: findField(schema, "id_doc_issuer"),
    address:
      findField(schema, "correspondence_address") ??
      findField(schema, "applicant_address") ??
      firstFieldMatching(
        schema,
        (f) => f.code.includes("address") && !f.code.includes("delivery"),
      ),
    phone:
      findField(schema, "phone") ??
      findField(schema, "applicant_phone") ??
      firstFieldMatching(schema, (f) => f.code.includes("phone")),
    email:
      findField(schema, "email") ??
      findField(schema, "applicant_email") ??
      firstFieldMatching(
        schema,
        (f) => f.code.includes("email") && !f.code.includes("delivery"),
      ),
  };
}

export function ApplicantBlock({
  schema,
  values,
  refs,
  compact = false,
}: {
  schema: RenderedForm;
  values: Record<string, string>;
  refs?: ApplicantFieldRefs;
  compact?: boolean;
}) {
  const r = refs ?? resolveApplicantFields(schema);

  const fullName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <View style={pdfStyles.row}>
        <Text style={pdfStyles.label}>От:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 2.75 }]}>{fullName}</Text>
        <Text style={pdfStyles.label}>
          {r.birthDate ? r.birthDate.labelBg : "Дата на раждане"}:
        </Text>
        <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
          {formatBgDate(getFieldValue(values, r.birthDate))}
        </Text>
      </View>
      <Text style={pdfStyles.helper}>(име, презиме, фамилия)</Text>

      {r.egn && (
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>{r.egn.labelBg}:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, r.egn)}
          </Text>
          {r.citizenship && (
            <>
              <Text style={pdfStyles.label}>{r.citizenship.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, r.citizenship)}
              </Text>
            </>
          )}
        </View>
      )}

      {!compact && (r.idDocNumber || r.idDocIssueDate || r.idDocIssuer) && (
        <View style={pdfStyles.row}>
          {r.idDocNumber && (
            <>
              <Text style={pdfStyles.label}>{r.idDocNumber.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, r.idDocNumber)}
              </Text>
            </>
          )}
          {r.idDocIssueDate && (
            <>
              <Text style={pdfStyles.label}>{r.idDocIssueDate.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {formatBgDate(getFieldValue(values, r.idDocIssueDate))}
              </Text>
            </>
          )}
          {r.idDocIssuer && (
            <>
              <Text style={pdfStyles.label}>{r.idDocIssuer.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1.2 }]}>
                {getFieldValue(values, r.idDocIssuer)}
              </Text>
            </>
          )}
        </View>
      )}

      <View style={pdfStyles.row}>
        <Text style={pdfStyles.label}>{r.address ? r.address.labelBg : "Адрес"}:</Text>
        <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
      </View>

      <View style={pdfStyles.row}>
        <Text style={pdfStyles.label}>{r.phone ? r.phone.labelBg : "Телефон"}:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
          {getFieldValue(values, r.phone)}
        </Text>
        <Text style={pdfStyles.label}>{r.email ? r.email.labelBg : "E-mail"}:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 1.6 }]}>
          {getFieldValue(values, r.email)}
        </Text>
      </View>
    </>
  );
}

export function ServiceOptionsBlock({
  schema,
  values,
}: {
  schema: RenderedForm;
  values: Record<string, string>;
}) {
  const serviceSpeed =
    findField(schema, "service_speed") ??
    firstFieldMatching(schema, (f) => f.code.includes("speed"));
  const documentFormat =
    findField(schema, "document_form") ??
    findField(schema, "document_format") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("document_form") || f.code.includes("format"),
    );
  const deliveryChannel =
    findField(schema, "delivery_method") ??
    findField(schema, "delivery_channel") ??
    firstFieldMatching(
      schema,
      (f) =>
        (f.code.includes("delivery") || f.code.includes("channel")) &&
        !f.code.includes("address") &&
        !f.code.includes("email"),
    );
  const deliveryAddress =
    findField(schema, "delivery_address") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("delivery") && f.code.includes("address"),
    );

  const speedMatches = (...tokens: string[]) =>
    fieldValueMatches(values, serviceSpeed, tokens);
  const formatMatches = (...tokens: string[]) =>
    fieldValueMatches(values, documentFormat, tokens);
  const deliveryMatches = (...tokens: string[]) =>
    fieldValueMatches(values, deliveryChannel, tokens);

  return (
    <>
      <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
        {serviceSpeed ? serviceSpeed.labelBg : "Желая да получа"} (отбелязва се в квадратчето):
      </Text>
      <View style={pdfStyles.checkRow}>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={speedMatches("обикнов", "regular", "standard")} />
          <Text>обикновена услуга</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={speedMatches("бърз", "fast")} />
          <Text>бърза услуга</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={speedMatches("експрес", "express")} />
          <Text>експресна услуга</Text>
        </View>
      </View>

      <View style={[pdfStyles.checkRow, { marginTop: 6 }]}>
        <Text style={{ fontSize: 10 }}>
          {documentFormat ? documentFormat.labelBg : "Вид на предоставения документ"}:
        </Text>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={formatMatches("харт", "paper")} />
          <Text>хартиен</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={formatMatches("електрон", "digital", "electronic")} />
          <Text>електронен</Text>
        </View>
      </View>

      <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
        {deliveryChannel ? deliveryChannel.labelBg : "Начин на получаване"} (отбелязва се в квадратчето):
      </Text>
      <View style={pdfStyles.checkRow}>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={deliveryMatches("гише", "office", "counter")} />
          <Text>на гише</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={deliveryMatches("адрес", "address", "post")} />
          <Text>на адрес</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={deliveryMatches("поща", "email", "e-mail")} />
          <Text>по е-поща</Text>
        </View>
      </View>

      {deliveryAddress && (
        <>
          <Text style={pdfStyles.fillBoxLarge}>
            {getFieldValue(values, deliveryAddress)}
          </Text>
          <Text style={pdfStyles.helper}>
            (посочва се общинска администрация или адрес, според избрания начина на получаване)
          </Text>
        </>
      )}
    </>
  );
}

export function AttachmentsBlock({
  schema,
  values,
  items = 3,
}: {
  schema: RenderedForm;
  values: Record<string, string>;
  items?: number;
}) {
  const attachmentFee =
    findField(schema, "fee_receipt") ??
    findField(schema, "attachment_fee_document") ??
    firstFieldMatching(schema, (f) => f.code.includes("fee"));
  const attachmentLegal =
    findField(schema, "legal_basis_document") ??
    findField(schema, "attachment_legal_basis") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("legal") || f.code.includes("ground"),
    );
  const attachmentOther =
    findField(schema, "other_documents") ??
    findField(schema, "attachment_other_documents") ??
    firstFieldMatching(schema, (f) => f.code.includes("other_document") || f.code.includes("attachment_other"));

  return (
    <>
      <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
        Прилагам следните документи:
      </Text>

      <View style={pdfStyles.numberedItem}>
        <Text style={pdfStyles.numberedIndex}>1.</Text>
        <Text style={{ fontSize: 10 }}>
          {attachmentFee ? attachmentFee.labelBg : "Документ за платена такса за услугата"}
        </Text>
        <Text style={pdfStyles.fillLine}>{getFieldValue(values, attachmentFee)}</Text>
      </View>
      <Text style={[pdfStyles.helper, { textAlign: "left", marginLeft: 16 }]}>
        (стойността се определя от вида на документа и вида на услугата)
      </Text>

      {items >= 2 && (
        <View style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>2.</Text>
          <Text style={{ fontSize: 10 }}>
            {attachmentLegal ? attachmentLegal.labelBg : "Документ доказващ правно основание"}:
          </Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, attachmentLegal)}</Text>
        </View>
      )}

      {items >= 3 && (
        <View style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>3.</Text>
          <Text style={{ fontSize: 10 }}>
            {attachmentOther ? attachmentOther.labelBg : "Други документи"}:
          </Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, attachmentOther)}</Text>
        </View>
      )}
    </>
  );
}

export function SignatureFooter({
  schema,
  values,
  gdprSubject = "заявление",
}: {
  schema: RenderedForm;
  values: Record<string, string>;
  gdprSubject?: string;
}) {
  const signaturePlace =
    findField(schema, "signature_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("place"));
  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue"),
    );
  const signatureField =
    findField(schema, "signature") ??
    firstFieldMatching(
      schema,
      (f) => f.typeCode === "signature" || f.htmlInput === "canvas",
    );
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  return (
    <View wrap={false}>
      <View style={pdfStyles.footer}>
        <View>
          <View style={pdfStyles.footerField}>
            <Text style={pdfStyles.label}>гр./с.</Text>
            <Text style={[pdfStyles.fillLine, { width: 120, flex: 0 }]}>
              {getFieldValue(values, signaturePlace) || "София"}
            </Text>
          </View>
          <View style={[pdfStyles.footerField, { marginTop: 6 }]}>
            <Text style={pdfStyles.label}>Дата:</Text>
            <Text style={[pdfStyles.fillLine, { width: 120, flex: 0 }]}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.footerField}>
          <Text style={pdfStyles.label}>Подпис:</Text>
          {signatureIsImage ? (
            <View style={pdfStyles.signatureBox}>
              <Image src={signatureValue} style={pdfStyles.signatureImage} />
            </View>
          ) : (
            <View style={pdfStyles.signatureBox} />
          )}
        </View>
      </View>

      <Text style={pdfStyles.gdprFooter}>
        Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни, посочени в
        настоящото {gdprSubject}, се обработват от Район Триадица за целите на
        предоставяне на заявената административна услуга. Данните се подават
        към deloviodstvo@triaditza.bg и се съхраняват съгласно сроковете в
        нормативната уредба.
      </Text>
    </View>
  );
}
