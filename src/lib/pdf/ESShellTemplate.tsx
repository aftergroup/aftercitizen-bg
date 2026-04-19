/**
 * Shell ЗАЯВЛЕНИЕ for Етажна собственост services (ES-001, ES-002).
 *
 * Mirrors Приложение № 2 към чл. 3 (Наредба № РД-02-20-8 от 11.05.2012)
 * — used to register or update a сдружение на собствениците. Structure:
 *
 *   До Кмета на община (left-aligned block)
 *   Title: ЗАЯВЛЕНИЕ
 *   Subtitle: service title (e.g. "за регистрация на сдружение на
 *   собствениците по чл. 29, ал. 1 ЗУЕС")
 *   Declarant block: name, role (usually председател of УС), наименование
 *   на сдружението, сграда (address).
 *   УВАЖАЕМА/И ГОСПОЖО/ГОСПОДИН КМЕТ paragraph.
 *   Board composition tables: председател УС / членове / председател КС /
 *   членове КС — each row pulls from board_member_N_* fields in the schema.
 *   Attachments list + Декларация по чл. 313 НК + GDPR + signature.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
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

const BOARD_ROW_COUNT = 5;

function BoardTable({
  heading,
  rows,
  values,
}: {
  heading: string;
  rows: { name?: string; address?: string; phone?: string; email?: string }[];
  values: Record<string, string>;
}) {
  void values;
  return (
    <View style={{ borderTop: "1pt solid #333", borderLeft: "1pt solid #333", borderRight: "1pt solid #333", marginBottom: 6 }}>
      <View style={{ flexDirection: "row", borderBottom: "1pt solid #333", backgroundColor: "#e7edf7" }}>
        <Text style={{ flex: 1, padding: 3, fontSize: 9, fontWeight: 700 }}>{heading}</Text>
      </View>
      <View style={{ flexDirection: "row", borderBottom: "1pt solid #333", backgroundColor: "#f2f2f2" }}>
        <Text style={{ flex: 2, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>Трите имена</Text>
        <Text style={{ flex: 2, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>Адрес</Text>
        <Text style={{ flex: 1, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>Телефон</Text>
        <Text style={{ flex: 1.3, padding: 3, fontSize: 8.5, fontWeight: 700 }}>Електронна поща</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", borderBottom: "1pt solid #333", minHeight: 16 }}>
          <Text style={{ flex: 2, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>{r.name ?? ""}</Text>
          <Text style={{ flex: 2, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>{r.address ?? ""}</Text>
          <Text style={{ flex: 1, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>{r.phone ?? ""}</Text>
          <Text style={{ flex: 1.3, padding: 3, fontSize: 9 }}>{r.email ?? ""}</Text>
        </View>
      ))}
    </View>
  );
}

function boardRows(
  schema: RenderedForm,
  values: Record<string, string>,
  role: string,
): { name?: string; address?: string; phone?: string; email?: string }[] {
  const rows: { name?: string; address?: string; phone?: string; email?: string }[] = [];
  for (let i = 1; i <= BOARD_ROW_COUNT; i++) {
    const name = findField(schema, `${role}_${i}_name`);
    const address = findField(schema, `${role}_${i}_address`);
    const phone = findField(schema, `${role}_${i}_phone`);
    const email = findField(schema, `${role}_${i}_email`);
    const r = {
      name: getFieldValue(values, name),
      address: getFieldValue(values, address),
      phone: getFieldValue(values, phone),
      email: getFieldValue(values, email),
    };
    if (r.name || r.address || r.phone) rows.push(r);
  }
  // Render at least 1 empty row so the table renders with data slots.
  return rows.length > 0 ? rows : [{}];
}

export default function ESShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";
  const r = resolveApplicantFields(schema);

  const associationName =
    findField(schema, "association_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("association") && f.code.includes("name"));
  const buildingAddress =
    findField(schema, "building_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("building") || (f.code.includes("address") && !f.code.includes("applicant")));
  const foundingDate =
    findField(schema, "founding_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("founding") || f.code.includes("учредително"));

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue") && !f.code.includes("founding"),
    );
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

  const chairmanRows = boardRows(schema, values, "chairman_us");
  const memberRows = boardRows(schema, values, "member_us");
  const chairmanCsRows = boardRows(schema, values, "chairman_cs");
  const memberCsRows = boardRows(schema, values, "member_cs");

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={{ textAlign: "right", fontSize: 9, marginBottom: 2 }}>Приложение № 2</Text>
        <Text style={{ textAlign: "right", fontSize: 9, marginBottom: 8 }}>към чл. 3</Text>

        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: 700 }}>ДО</Text>
          <Text style={{ fontWeight: 700 }}>КМЕТА НА СТОЛИЧНА ОБЩИНА</Text>
        </View>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 4, marginTop: 6 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, marginBottom: 14 }}>
          {serviceTitle || "за регистрация на сдружение на собствениците по чл. 29, ал. 1 ЗУЕС"}
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>от</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>
        <Text style={pdfStyles.caption}>(име, презиме, фамилия)</Text>

        <Text style={{ marginTop: 4 }}>
          председател на управителен съвет (управител) на сдружението на собствениците
        </Text>
        <Text style={pdfStyles.fillBoxLarge}>{getFieldValue(values, associationName)}</Text>
        <Text style={pdfStyles.caption}>(наименование на сдружението)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>в сграда, намираща се на адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, buildingAddress)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 10 }}>УВАЖАЕМА/И ГОСПОЖО/ГОСПОДИН КМЕТ,</Text>
        <Text style={{ marginTop: 4 }}>
          В изпълнение на чл. 29 ЗУЕС предоставям необходимите данни за регистрация на
          сдружението на собствениците в публичен регистър.
        </Text>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text>Сдружението на собствениците е създадено на учредително събрание, проведено на:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, foundingDate))}
          </Text>
          <Text>г.</Text>
        </View>

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>Председател на управителния съвет (управител):</Text>
        <BoardTable heading="Председател на управителния съвет (управител) е:" rows={chairmanRows} values={values} />

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>Членове на управителния съвет:</Text>
        <BoardTable heading="Членове на управителния съвет са:" rows={memberRows} values={values} />

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>Председател на контролния съвет (контрольор):</Text>
        <BoardTable heading="Председател на контролния съвет (контрольор) е:" rows={chairmanCsRows} values={values} />

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>Членове на контролния съвет:</Text>
        <BoardTable heading="Членове на контролния съвет са:" rows={memberCsRows} values={values} />

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Към заявлението прилагам следните документи:
        </Text>
        <Text style={{ marginLeft: 16, fontSize: 9.5 }}>
          1. Списък на собствениците, участващи в сдружението, с трите им имена и адреса в етажната собственост.{"\n"}
          2. Копие от протокола на учредителното събрание, заверено от председателя на УС.{"\n"}
          3. Копие от приетото споразумение, заверено от председателя на УС.{"\n"}
          4. Нотариално заверени образци от подписите на лицата, представляващи сдружението.
        </Text>

        <Text style={{ marginTop: 8 }}>
          Декларирам, че заявеното отговаря на фактическото положение към момента на подаване на заявлението.
        </Text>
        <Text>
          Известно ми е, че за декларирани от мен неверни данни нося отговорност по чл. 313 от
          Наказателния кодекс.
        </Text>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при условията
          на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната услуга,
          поискана от Вас и могат да бъдат коригирани по Ваше искане."
        </Text>

        <View wrap={false} style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text style={{ fontWeight: 700 }}>ДАТА:</Text>
            <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", minWidth: 220 }}>
            <Text style={{ fontWeight: 700 }}>ПОДПИС НА ЗАЯВИТЕЛЯ:</Text>
            {signatureIsImage ? (
              <View style={{ width: 120, height: 28, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", flex: 1, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left", marginTop: 6, fontStyle: "italic" }]}>
          Забележка. Представя се документ за самоличност на заявителя.
        </Text>
      </Page>
    </Document>
  );
}
