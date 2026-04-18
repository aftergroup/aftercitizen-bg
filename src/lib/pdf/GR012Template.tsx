/**
 * Printable PDF for GR-012 — Издаване на удостоверение за раждане (дубликат).
 *
 * Layout mirrors the official GRAO бланка on R2: top-right addressee block,
 * centered ЗАЯВЛЕНИЕ title with service subtitle, applicant info block,
 * request body, numbered attachments, service-speed / format / delivery
 * checkboxes, date & signature footer.
 *
 * Labels come from the Baserow schema so Bulgarian wording stays in sync
 * with the DB. Values come from the submission; blank fields fall back to
 * defaultValue (the DB-configured prefill) — so the request subject reads
 * "Издаване на удостоверение за раждане — дубликат" even if the citizen
 * left it empty on screen.
 */
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { RenderedForm, RenderedField } from "@/lib/types";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.45,
    color: "#111",
  },
  addresseeBlock: {
    alignSelf: "flex-end",
    width: 280,
    marginBottom: 18,
  },
  addresseeLine: {
    fontWeight: 700,
    fontSize: 11,
  },
  addresseeFill: {
    borderBottom: "1pt dotted #555",
    marginTop: 2,
    marginBottom: 2,
    height: 13,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  caption: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    marginTop: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-end",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
  },
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
  salutation: {
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 2,
  },
  paragraph: {
    marginBottom: 4,
  },
  requestBody: {
    minHeight: 72,
    borderBottom: "1pt dotted #333",
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 10,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 4,
  },
  numberedItem: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  numberedIndex: {
    width: 12,
    fontSize: 10,
  },
  checkRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  checkItem: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#333",
    textAlign: "center",
    fontSize: 8,
    lineHeight: 1,
    paddingTop: 0.5,
  },
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
  helper: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
    marginTop: -2,
    marginBottom: 4,
  },
  gdprFooter: {
    marginTop: 24,
    fontSize: 8,
    color: "#444",
    lineHeight: 1.35,
  },
});

function getValue(
  values: Record<string, string>,
  field: RenderedField | undefined,
): string {
  if (!field) return "";
  const raw = values[field.code];
  if (raw !== undefined && raw !== "" && raw !== "false") {
    if (field.dictionary) {
      const entry = field.dictionary.entries.find((e) => e.key === raw);
      return entry?.labelBg ?? String(raw);
    }
    return String(raw);
  }
  return field.defaultValue ?? "";
}

function findField(schema: RenderedForm, code: string): RenderedField | undefined {
  for (const s of schema.sections) {
    const f = s.fields.find((x) => x.code === code);
    if (f) return f;
  }
  return undefined;
}

function firstFieldMatching(
  schema: RenderedForm,
  predicate: (f: RenderedField) => boolean,
): RenderedField | undefined {
  for (const s of schema.sections) {
    const f = s.fields.find(predicate);
    if (f) return f;
  }
  return undefined;
}

function formatBgDate(value: string): string {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}.${m}.${y}`;
  }
  return value;
}

function Checkbox({ checked }: { checked: boolean }) {
  return <Text style={styles.checkbox}>{checked ? "✕" : " "}</Text>;
}

export default function GR012Template({ schema, values }: Props) {
  const { form, service } = schema;

  const firstName = findField(schema, "applicant_first_name");
  const fatherName = findField(schema, "applicant_father_name");
  const familyName = findField(schema, "applicant_family_name");
  const birthDate =
    findField(schema, "applicant_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("birth_date"));
  const egn =
    findField(schema, "applicant_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("egn"));
  const address =
    findField(schema, "applicant_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("address"));
  const phone =
    findField(schema, "applicant_phone") ??
    firstFieldMatching(schema, (f) => f.code.includes("phone"));
  const email =
    findField(schema, "applicant_email") ??
    firstFieldMatching(schema, (f) => f.code.includes("email"));

  const requestSubject =
    findField(schema, "request_subject_description") ??
    firstFieldMatching(
      schema,
      (f) =>
        f.code.includes("request") ||
        f.code.includes("subject") ||
        (f.code.includes("description") && !f.code.includes("attachment"))
    );

  const attachmentFee =
    findField(schema, "attachment_fee_document") ??
    firstFieldMatching(schema, (f) => f.code.includes("fee"));
  const attachmentLegal =
    findField(schema, "attachment_legal_basis") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("legal") || f.code.includes("ground")
    );
  const attachmentOther =
    findField(schema, "attachment_other_documents") ??
    firstFieldMatching(schema, (f) => f.code.includes("other"));

  const serviceSpeed =
    findField(schema, "service_speed") ??
    firstFieldMatching(schema, (f) => f.code.includes("speed"));
  const documentFormat =
    findField(schema, "document_format") ??
    firstFieldMatching(schema, (f) => f.code.includes("format"));
  const deliveryChannel =
    findField(schema, "delivery_channel") ??
    firstFieldMatching(schema, (f) => f.code.includes("delivery"));

  const deliveryAddress =
    findField(schema, "delivery_address") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("delivery") && f.code.includes("address")
    );

  const signaturePlace =
    findField(schema, "signature_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("place"));
  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("date") && !f.code.includes("birth"));

  const fullName = [
    getValue(values, firstName),
    getValue(values, fatherName),
    getValue(values, familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const birthDateValue = formatBgDate(getValue(values, birthDate));

  const speedValue = serviceSpeed ? getValue(values, serviceSpeed).toLowerCase() : "";
  const formatValue = documentFormat ? getValue(values, documentFormat).toLowerCase() : "";
  const deliveryValue = deliveryChannel ? getValue(values, deliveryChannel).toLowerCase() : "";

  const speedMatches = (...keys: string[]) =>
    keys.some((k) => speedValue.includes(k));
  const formatMatches = (...keys: string[]) =>
    keys.some((k) => formatValue.includes(k));
  const deliveryMatches = (...keys: string[]) =>
    keys.some((k) => deliveryValue.includes(k));

  const serviceTitle =
    service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.addresseeBlock}>
          <Text style={styles.addresseeLine}>До кмета</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={styles.addresseeFill}>Район Триадица</Text>
          <Text style={styles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={styles.title}>ЗАЯВЛЕНИЕ</Text>
        <Text style={styles.subtitle}>
          {serviceTitle || "за административна услуга гражданска регистрация"}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>От :</Text>
          <Text style={[styles.fillLine, { flex: 2.75 }]}>{fullName}</Text>
          <Text style={styles.label}>
            {birthDate ? birthDate.labelBg : "Дата на раждане"}:
          </Text>
          <Text style={[styles.fillLine, { flex: 1 }]}>
            {birthDateValue}
          </Text>
        </View>
        <Text style={styles.helper}>(име, презиме, фамилия)</Text>

        {egn && (
          <View style={styles.row}>
            <Text style={styles.label}>{egn.labelBg}:</Text>
            <Text style={styles.fillLine}>{getValue(values, egn)}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>
            {address ? address.labelBg : "Адрес"}:
          </Text>
          <Text style={styles.fillLine}>{getValue(values, address)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            {phone ? phone.labelBg : "Телефон"}:
          </Text>
          <Text style={[styles.fillLine, { flex: 1 }]}>
            {getValue(values, phone)}
          </Text>
          <Text style={styles.label}>
            {email ? email.labelBg : "E-mail"}:
          </Text>
          <Text style={[styles.fillLine, { flex: 1.6 }]}>
            {getValue(values, email)}
          </Text>
        </View>

        <Text style={styles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={styles.paragraph}>
          Моля, да ми бъде извършена следната услуга:
        </Text>
        <View style={styles.requestBody}>
          <Text>{getValue(values, requestSubject) || serviceTitle}</Text>
        </View>

        <Text style={[styles.label, styles.sectionHeader]}>
          Прилагам следните документи:
        </Text>

        <View style={styles.numberedItem}>
          <Text style={styles.numberedIndex}>1.</Text>
          <Text style={{ fontSize: 10 }}>
            {attachmentFee ? attachmentFee.labelBg : "Документ за платена такса за услугата"}
          </Text>
          <Text style={styles.fillLine}>
            {getValue(values, attachmentFee)}
          </Text>
        </View>
        <Text style={[styles.helper, { textAlign: "left", marginLeft: 16 }]}>
          (стойността се определя от вида на документа и вида на услугата)
        </Text>

        <View style={styles.numberedItem}>
          <Text style={styles.numberedIndex}>2.</Text>
          <Text style={{ fontSize: 10 }}>
            {attachmentLegal ? attachmentLegal.labelBg : "Документ доказващ правно основание"}:
          </Text>
          <Text style={styles.fillLine}>
            {getValue(values, attachmentLegal)}
          </Text>
        </View>

        <View style={styles.numberedItem}>
          <Text style={styles.numberedIndex}>3.</Text>
          <Text style={{ fontSize: 10 }}>
            {attachmentOther ? attachmentOther.labelBg : "Други документи"}:
          </Text>
          <Text style={styles.fillLine}>
            {getValue(values, attachmentOther)}
          </Text>
        </View>

        <Text style={[styles.label, styles.sectionHeader]}>
          {serviceSpeed ? serviceSpeed.labelBg : "Желая да получа"} (отбелязва се в квадратчето):
        </Text>
        <View style={styles.checkRow}>
          <View style={styles.checkItem}>
            <Checkbox checked={speedMatches("обикнов", "regular", "standard")} />
            <Text>обикновена услуга</Text>
          </View>
          <View style={styles.checkItem}>
            <Checkbox checked={speedMatches("бърз", "fast")} />
            <Text>бърза услуга</Text>
          </View>
          <View style={styles.checkItem}>
            <Checkbox checked={speedMatches("експрес", "express")} />
            <Text>експресна услуга</Text>
          </View>
        </View>

        <View style={[styles.checkRow, { marginTop: 6 }]}>
          <Text style={{ fontSize: 10 }}>
            {documentFormat ? documentFormat.labelBg : "Вид на предоставения документ"}:
          </Text>
          <View style={styles.checkItem}>
            <Checkbox checked={formatMatches("харт", "paper")} />
            <Text>хартиен</Text>
          </View>
          <View style={styles.checkItem}>
            <Checkbox checked={formatMatches("електрон", "digital", "electronic")} />
            <Text>електронен</Text>
          </View>
        </View>

        <Text style={[styles.label, styles.sectionHeader]}>
          {deliveryChannel ? deliveryChannel.labelBg : "Начин на получаване"} (отбелязва се в квадратчето):
        </Text>
        <View style={styles.checkRow}>
          <View style={styles.checkItem}>
            <Checkbox checked={deliveryMatches("гише", "office", "counter")} />
            <Text>на гише</Text>
          </View>
          <View style={styles.checkItem}>
            <Checkbox checked={deliveryMatches("адрес", "address", "post")} />
            <Text>на адрес</Text>
          </View>
          <View style={styles.checkItem}>
            <Checkbox checked={deliveryMatches("поща", "email", "e-mail")} />
            <Text>по е-поща</Text>
          </View>
        </View>

        {deliveryAddress && (
          <>
            <Text style={styles.fillBoxLarge}>
              {getValue(values, deliveryAddress)}
            </Text>
            <Text style={styles.helper}>
              (посочва се общинска администрация или адрес, според избрания начина на получаване)
            </Text>
          </>
        )}

        <View style={styles.footer}>
          <View>
            <View style={styles.footerField}>
              <Text style={styles.label}>гр./с.</Text>
              <Text style={[styles.fillLine, { width: 120, flex: 0 }]}>
                {getValue(values, signaturePlace) || "София"}
              </Text>
            </View>
            <View style={[styles.footerField, { marginTop: 6 }]}>
              <Text style={styles.label}>Дата :</Text>
              <Text style={[styles.fillLine, { width: 120, flex: 0 }]}>
                {getValue(values, signatureDate) ||
                  new Date().toLocaleDateString("bg-BG")}
              </Text>
            </View>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.label}>Подпис :</Text>
            <Text style={[styles.fillLine, { width: 160, flex: 0 }]}> </Text>
          </View>
        </View>

        <Text style={styles.gdprFooter}>
          Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни, посочени в
          настоящото заявление, се обработват от Район Триадица за целите на
          предоставяне на заявената административна услуга. Данните се подават
          към deloviodstvo@triaditza.bg и се съхраняват съгласно сроковете в
          нормативната уредба.
        </Text>
      </Page>
    </Document>
  );
}
