/**
 * Template for the three GDPR-data-subject ЗАЯВЛЕНИЯ used by Район
 * Триадица — corrections (GDPR-001), erasure (GDPR-002), restriction
 * of processing (GDPR-003). Each is a separate appendix to the
 * district's internal GDPR rules and renders a different ground-of-
 * request checklist:
 *
 *   GDPR-001 (ПРИЛОЖЕНИЕ № 6) — 3 grounds: непълнота / неточност / грешка
 *   GDPR-002 (ПРИЛОЖЕНИЕ № 7) — 6 grounds (Регламент 2016/679 чл. 17)
 *   GDPR-003 (ПРИЛОЖЕНИЕ № 8) — 4 grounds (Регламент 2016/679 чл. 18)
 *
 * The applicant header, identity block, and signature footer are the
 * same across all three blanks; only the title, ground list and the
 * closing-paragraph verb differ.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { fieldValueMatches, formatBgDate, getFieldValue } from "./helpers";
import {
  Checkbox,
  findField,
  firstFieldMatching,
  pdfStyles,
  resolveApplicantFields,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

interface Variant {
  appendix: string;
  title: string;
  closingVerb: string;
  describeIssue: boolean;
  grounds?: { label: string; tokens: string[] }[];
}

const VARIANT: Record<string, Variant> = {
  "GDPR-001": {
    appendix: "ПРИЛОЖЕНИЕ № 6",
    title: "ЗА КОРИГИРАНЕ НА ЛИЧНИ ДАННИ",
    closingVerb: "коригиране/допълване",
    describeIssue: true,
    grounds: [
      { label: "непълнота;", tokens: ["непълнота", "incomplete"] },
      { label: "неточност;", tokens: ["неточност", "inaccurate"] },
      { label: "грешка", tokens: ["грешка", "error"] },
    ],
  },
  "GDPR-002": {
    appendix: "ПРИЛОЖЕНИЕ № 7",
    title: "ЗА ЗАЛИЧАВАНЕ НА ЛИЧНИ ДАННИ",
    closingVerb: "изтриване/заличаване",
    describeIssue: false,
    grounds: [
      {
        label:
          "личните данни повече не са необходими за целите, за които са били събрани или обработвани;",
        tokens: ["не са необходими", "no_longer_needed"],
      },
      {
        label:
          "оттеглям своето съгласие, върху което се основава обработването на данните и смятам, че няма друго правно основание за обработването;",
        tokens: ["оттеглям", "consent_withdrawn"],
      },
      {
        label: "възразявам срещу обработването;",
        tokens: ["възразявам", "objection"],
      },
      {
        label: "личните данни са били обработвани незаконосъобразно;",
        tokens: ["незаконосъобразно", "unlawful"],
      },
      {
        label:
          "личните данни трябва да бъдат изтрити с цел спазването на правно задължение по правото на Европейския съюз или правото на Република България;",
        tokens: ["правно задължение", "legal_obligation"],
      },
      {
        label:
          "личните данни са били събрани във връзка с предлагането на услуги на информационното общество.",
        tokens: ["информационното общество", "information_society"],
      },
    ],
  },
  "GDPR-003": {
    appendix: "ПРИЛОЖЕНИЕ № 8",
    title: "ЗА ОГРАНИЧАВАНЕ НА ОБРАБОТВАНЕТО НА ЛИЧНИ ДАННИ",
    closingVerb: "ограничаване на обработването",
    describeIssue: false,
    grounds: [
      {
        label: "оспорвам точността на личните данни;",
        tokens: ["оспорвам", "contest_accuracy"],
      },
      {
        label:
          "считам, че обработването е неправомерно, но не желая личните данни да бъдат изтрити, а изисквам ограничаване на използването им;",
        tokens: ["неправомерно", "unlawful"],
      },
      {
        label:
          "считам, че Вие не се нуждаете повече от личните данни за целите на обработването;",
        tokens: ["не се нуждаете", "not_needed"],
      },
      {
        label: "възразявам срещу обработването.",
        tokens: ["възразявам", "objection"],
      },
    ],
  },
};

export default function GDPRShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const variant = VARIANT[serviceCode] ?? VARIANT["GDPR-001"];

  const r = resolveApplicantFields(schema);

  const idCardNumber = findField(schema, "id_card_number") ?? r.idDocNumber;
  const idCardDate = findField(schema, "id_card_date") ?? r.idDocIssueDate;
  const idCardIssuer = findField(schema, "id_card_issuer") ?? r.idDocIssuer;
  const foreignId = findField(schema, "foreigner_id_number");
  const passport = findField(schema, "passport_number");
  const passportDate = findField(schema, "passport_date");
  const passportIssuer = findField(schema, "passport_issuer");
  const checkDate = findField(schema, "records_check_date");
  const checkPlace =
    findField(schema, "records_check_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("check_place"));
  const processingPurpose =
    findField(schema, "processing_purpose") ??
    firstFieldMatching(schema, (f) => f.code.includes("purpose") || f.code.includes("reason"));
  const groundField =
    findField(schema, "request_ground") ??
    firstFieldMatching(schema, (f) => f.code.includes("ground") || f.code.includes("issue") || f.code.includes("reason_code"));

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue") && !f.code.includes("check"),
    );
  const signaturePlace = findField(schema, "signature_place");
  const signatureField =
    findField(schema, "signature") ??
    firstFieldMatching(schema, (f) => f.typeCode === "signature" || f.htmlInput === "canvas");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  const declarantName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const groundMatches = (...tokens: string[]) =>
    fieldValueMatches(values, groundField, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ alignSelf: "flex-end", width: 260, marginBottom: 14 }}>
          <Text style={{ fontSize: 9, fontWeight: 700, fontStyle: "italic" }}>{variant.appendix} към</Text>
          <Text style={{ fontSize: 9, fontWeight: 700 }}>Вътрешни правила на СО-Район</Text>
          <Text style={{ fontSize: 9, fontWeight: 700 }}>„ТРИАДИЦА" за мерките за защита на</Text>
          <Text style={{ fontSize: 9, fontWeight: 700 }}>личните данни съгласно Регламент 2016/679</Text>
        </View>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 6, marginTop: 6 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
          {variant.title}
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Долуподписаният/ата:</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.egn)}</Text>
          <Text style={pdfStyles.label}>Л.К. №:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, idCardNumber)}</Text>
          <Text style={pdfStyles.label}>издадена на:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>
            {formatBgDate(getFieldValue(values, idCardDate))}
          </Text>
          <Text>г.</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>от МВР гр.:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, idCardIssuer)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>или гражданин на:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.citizenship)}</Text>
        </View>

        {(foreignId || passport) && (
          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            <Text style={pdfStyles.label}>ЕНЧ:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, foreignId)}</Text>
            <Text style={pdfStyles.label}>паспорт:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, passport)}</Text>
            <Text style={pdfStyles.label}>издаден на:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>
              {formatBgDate(getFieldValue(values, passportDate))}
            </Text>
            <Text>г.</Text>
          </View>
        )}

        {passportIssuer && (
          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            <Text style={pdfStyles.label}>от:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, passportIssuer)}</Text>
          </View>
        )}

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>адрес за кореспонденция:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Заявявам, че:</Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>На</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, checkDate))}
          </Text>
          <Text>г., след извършена справка в</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.5 }]}>{getFieldValue(values, checkPlace)}</Text>
        </View>

        <Text style={{ marginTop: 4 }}>
          установих, че личните ми данни са обработвани от Вас като администратор на лични
          данни с цел:
        </Text>
        <Text style={pdfStyles.fillBoxLarge}>{getFieldValue(values, processingPurpose)}</Text>

        {variant.describeIssue ? (
          <>
            <Text style={{ marginTop: 10 }}>
              поради което бих желал/а да упражня правата си по Регламент (ЕС) 2016/679, Закона
              за защита на лични данни и вътрешните Ви правила за {variant.closingVerb} без
              ненужно забавяне на личните данни, свързани с мен във Вашите системи и бази.
            </Text>
            <Text style={{ marginTop: 8 }}>Считам, че така представените мои лични данни има:</Text>
          </>
        ) : (
          <Text style={{ marginTop: 10 }}>
            Бих желал/а да упражня правата си по Регламент (ЕС) 2016/679, Закона за защита на
            лични данни и вътрешните Ви правила {variant.title.toLowerCase().includes("ограничаване") ? "като администратор на лични данни, за ограничаване на обработването на личните данни" : "за изтриване/заличаване на свързаните с мен лични данни без ненужно забавяне във Вашите системи и бази"} на следните основания:
          </Text>
        )}

        <View style={{ marginTop: 6 }}>
          {variant.grounds?.map((g, i) => (
            <View key={i} style={[pdfStyles.checkItem, { alignItems: "flex-start", marginBottom: 4 }]}>
              <Checkbox checked={groundMatches(...g.tokens)} />
              <Text style={{ flex: 1, fontSize: 9.5 }}>{g.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ marginTop: 10 }}>
          При депозиране на настоящото, представих собствен документ за самоличност, който
          ми бе върнат след справка за идентичност на данните.
        </Text>

        <View wrap={false} style={{ marginTop: 22, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text>Дата:</Text>
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
                {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 6 }}>
              <Text>гр./с.</Text>
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 120, paddingHorizontal: 4 }}>
                {getFieldValue(values, signaturePlace) || "София"}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", minWidth: 220 }}>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text style={{ fontWeight: 700 }}>ЗАЯВИТЕЛ:</Text>
              {signatureIsImage ? (
                <View style={{ width: 140, height: 28, borderBottom: "1pt solid #333" }}>
                  <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </View>
              ) : (
                <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, minHeight: 20 }}> </Text>
              )}
            </View>
            <Text style={pdfStyles.caption}>(подпис и три имена)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
