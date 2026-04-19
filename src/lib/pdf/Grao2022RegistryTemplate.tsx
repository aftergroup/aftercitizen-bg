/**
 * Universal ИСКАНЕ (Приложение № 1 към чл. 6, ал. 1) for GRAO
 * certificates issued from the population register.
 *
 * The real blank lists 14 fixed-text checkbox options; the citizen
 * (or administrative staff) ticks the row that matches the certificate
 * being requested. One form-code → one option number — the mapping is
 * fixed by the service and lives in SERVICE_CODE_TO_OPTION below.
 *
 * Shared by GR-001, GR-002, GR-003, GR-004, GR-006, GR-007, GR-008,
 * GR-009, GR-019, GR-020, GR-021, GR-022, GR-027, GR-032 — all of
 * which use this exact blank in the Триадица services catalog.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
  Checkbox,
  findField,
  firstFieldMatching,
  getMunicipality,
  pdfStyles,
  resolveApplicantFields,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

/**
 * Which of the 14 blank-options is ticked for each service code.
 * Anything outside this map falls back to option 14 ("Друго"), with
 * the service title written into the free-text line.
 */
const SERVICE_CODE_TO_OPTION: Record<string, number> = {
  "GR-001": 2,
  "GR-002": 1,
  "GR-003": 4,
  "GR-004": 10,
  "GR-006": 12,
  "GR-007": 11,
  "GR-008": 13,
  "GR-009": 11,
  "GR-019": 3,
  "GR-020": 6,
  "GR-021": 8,
  "GR-022": 9,
  "GR-027": 7,
  "GR-032": 5,
};

const OPTIONS: { n: number; label: string; hint?: string }[] = [
  { n: 1, label: "Удостоверение за семейно положение" },
  { n: 2, label: "Удостоверение за семейно положение, съпруг/а и деца" },
  { n: 3, label: "Удостоверение за съпруг/а и родствени връзки" },
  { n: 4, label: "Удостоверение за родените от майката деца" },
  { n: 5, label: "Удостоверение за правно ограничение" },
  {
    n: 6,
    label: "Удостоверение за идентичност на лице с различни имена",
    hint: "(вписват се различните имена)",
  },
  { n: 7, label: "Удостоверение за вписване в регистъра на населението" },
  {
    n: 8,
    label: "Удостоверение за сключване на брак от български гражданин в чужбина",
    hint: "(вписва се името на лицето, с което българският гражданин ще сключва брак)",
  },
  {
    n: 9,
    label:
      "Удостоверение за снабдяване на чужд гражданин с документ за сключване на граждански брак в Република България",
    hint: "(вписва се името на лицето, с което чуждият гражданин ще сключва брак)",
  },
  { n: 10, label: "Удостоверение за постоянен адрес" },
  { n: 11, label: "Удостоверение за настоящ адрес" },
  { n: 12, label: "Удостоверение за промени на постоянен адрес" },
  { n: 13, label: "Удостоверение за промени на настоящ адрес" },
  { n: 14, label: "Друго:" },
];

export default function Grao2022RegistryTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const selectedOption = SERVICE_CODE_TO_OPTION[serviceCode] ?? 14;

  const r = resolveApplicantFields(schema);

  // Subject-of-request block: by default "за мен"; if subject_* fields
  // carry values the form switches to "за лицето".
  const subjectFirst = findField(schema, "subject_first_name");
  const subjectFather = findField(schema, "subject_father_name");
  const subjectFamily = findField(schema, "subject_family_name");
  const subjectEgn =
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("egn"));

  const subjectName = [
    getFieldValue(values, subjectFirst),
    getFieldValue(values, subjectFather),
    getFieldValue(values, subjectFamily),
  ]
    .filter(Boolean)
    .join(" ");
  const subjectEgnValue = getFieldValue(values, subjectEgn);
  const hasSubject = !!(subjectName || subjectEgnValue);

  const otherText =
    findField(schema, "request_other_text") ??
    findField(schema, "request_subject_description") ??
    firstFieldMatching(schema, (f) => f.code.includes("other"));
  const differentNames =
    findField(schema, "different_names") ??
    firstFieldMatching(schema, (f) => f.code.includes("different_names"));
  const marriagePartner =
    findField(schema, "marriage_partner_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("partner") || f.code.includes("spouse_foreign"));

  const attachments =
    findField(schema, "attachments_text") ??
    findField(schema, "attached_documents") ??
    firstFieldMatching(schema, (f) => f.code.includes("attach"));

  const idDocNumberValue = getFieldValue(values, r.idDocNumber);
  const idDocIssueDateValue = formatBgDate(getFieldValue(values, r.idDocIssueDate));
  const idDocIssuerValue = getFieldValue(values, r.idDocIssuer);

  const fullApplicantName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const signaturePlace = findField(schema, "signature_place");
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

  // GR-020 / option 6 / option 8 / option 9 need inline free-text on
  // the option line (different names, partner names). Prepare a
  // lookup so the matching option row renders its specific suffix.
  const optionSuffix: Record<number, string> = {
    6: getFieldValue(values, differentNames),
    8: getFieldValue(values, marriagePartner),
    9: getFieldValue(values, marriagePartner),
    14: getFieldValue(values, otherText),
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Top: Вх. № (left) + До Кмета на ... (right) */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text>Вх. № ................................</Text>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text>Дата:</Text>
              <Text style={{ borderBottom: "1pt dotted #555", minWidth: 120, paddingHorizontal: 4 }}>
                {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
              </Text>
              <Text>г.</Text>
            </View>
            <Text style={pdfStyles.caption}>ден, месец, година</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>До Кмета</Text>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text style={{ fontWeight: 700 }}>на:</Text>
              <Text style={{ borderBottom: "1pt dotted #555", flex: 1, paddingHorizontal: 4 }}>
                {getMunicipality(schema).nameBg}
              </Text>
            </View>
            <Text style={pdfStyles.caption}>община/ район/ кметство</Text>
          </View>
        </View>

        <Text style={pdfStyles.title}>ИСКАНЕ</Text>
        <Text style={pdfStyles.subtitle}>
          ЗА ИЗДАВАНЕ НА УДОСТОВЕРЕНИЕ ВЪЗ ОСНОВА НА РЕГИСТЪРА НА НАСЕЛЕНИЕТО
        </Text>

        {/* От: name (3 columns) */}
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>От:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, r.firstName) || fullApplicantName}
          </Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, r.fatherName)}
          </Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, r.familyName)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginTop: -2, marginBottom: 4 }}>
          <Text style={pdfStyles.caption}>име: собствено                     бащино                         фамилно</Text>
        </View>

        {/* ЕГН */}
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.egn)}</Text>
        </View>
        <Text style={pdfStyles.caption}>когато лицето няма ЕГН се посочва дата на раждане</Text>

        {/* Док. за самоличност */}
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Док. за самоличност: №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{idDocNumberValue}</Text>
          <Text style={pdfStyles.label}>, издаден на:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{idDocIssueDateValue}</Text>
          <Text style={pdfStyles.label}>г. от:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{idDocIssuerValue}</Text>
        </View>

        {/* Адрес */}
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>
        <Text style={pdfStyles.caption}>посочва се адрес за кореспонденция</Text>

        {/* Телефон / e-mail */}
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Телефон, факс или адрес на електронна поща:</Text>
          <Text style={pdfStyles.fillLine}>
            {[getFieldValue(values, r.phone), getFieldValue(values, r.email)]
              .filter(Boolean)
              .join(" / ")}
          </Text>
        </View>

        {/* Желая да ми бъде издадено посоченото удостоверение, което се отнася */}
        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Желая да ми бъде издадено посоченото удостоверение, което се отнася:
        </Text>
        <View style={[pdfStyles.checkItem, { marginBottom: 3 }]}>
          <Checkbox checked={!hasSubject} />
          <Text>за мен</Text>
        </View>
        <View style={pdfStyles.checkItem}>
          <Checkbox checked={hasSubject} />
          <View style={{ flexDirection: "row", flex: 1, gap: 4, alignItems: "flex-end" }}>
            <Text>за лицето:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{subjectName}</Text>
          </View>
        </View>
        <Text style={[pdfStyles.caption, { marginLeft: 18 }]}>
          име: собствено · бащино · фамилно
        </Text>
        <View style={[pdfStyles.row, { marginLeft: 14 }]}>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{subjectEgnValue}</Text>
        </View>
        <Text style={[pdfStyles.caption, { marginLeft: 18 }]}>
          когато лицето няма ЕГН се посочва дата на раждане
        </Text>

        {/* 14-option grid */}
        <View style={{ marginTop: 8 }}>
          {OPTIONS.map((opt) => {
            const checked = opt.n === selectedOption;
            const suffix = optionSuffix[opt.n] ?? "";
            return (
              <View key={opt.n} style={{ flexDirection: "row", gap: 4, alignItems: "flex-start", marginBottom: 3 }}>
                <Checkbox checked={checked} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Text style={{ fontSize: 9.5 }}>
                      {opt.n}. {opt.label}
                    </Text>
                    {(opt.n === 6 || opt.n === 8 || opt.n === 9 || opt.n === 14) && (
                      <Text style={[pdfStyles.fillLine, { flex: 1, fontSize: 9.5 }]}>{suffix}</Text>
                    )}
                  </View>
                  {opt.hint && (
                    <Text style={[pdfStyles.caption, { textAlign: "left", marginTop: 0 }]}>
                      {opt.hint}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Прилагам */}
        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>Прилагам следните документи:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, attachments)}</Text>
        </View>

        {/* GDPR paragraph (wording from the blank) */}
        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е администратор на лични данни с идентификационен номер 52258
          и представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга, поискана от Вас и могат да бъдат коригирани по Ваше искане. Достъп до
          информация за личните Ви данни е гарантиран в хода на цялата процедура. Трети
          лица могат да получат информация само по реда и при условия на закона.
          Непредставянето на личните данни, които се изискват от закон, може да доведе до
          прекратяване на производството."
        </Text>

        <View wrap={false} style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Дата:</Text>
            <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
            {signaturePlace && (
              <>
                <Text style={pdfStyles.label}>, гр./с.:</Text>
                <Text style={{ borderBottom: "1pt dotted #333", minWidth: 80, paddingHorizontal: 4 }}>
                  {getFieldValue(values, signaturePlace) || "София"}
                </Text>
              </>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", minWidth: 200 }}>
            <Text>Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", flex: 1, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>ден, месец, година</Text>
      </Page>
    </Document>
  );
}
