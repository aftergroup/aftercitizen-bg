/**
 * OS-002 — Установяване на жилищни нужди (картотекиране).
 *
 * Specific blank: simple ЗАЯВЛЕНИЕ to Кмета на Район Триадица asking
 * to be added to the housing-need register. The applicant lists
 * настоящ + постоянен address; the only fixed attachment is the
 * Декларация по Наредбата за общинските жилища, with four extra
 * free-text slots (Документи по чл. 6, ал. 3 и ал. 4 от Наредбата).
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

export default function OSHousingTemplate({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);

  const currentAddress =
    findField(schema, "current_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("current_address"));
  const permanentAddress =
    findField(schema, "permanent_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("permanent_address"));
  const phones =
    findField(schema, "phones") ??
    findField(schema, "phone") ??
    firstFieldMatching(schema, (f) => f.code.includes("phone"));

  const attachment2 = findField(schema, "attachment_2");
  const attachment3 = findField(schema, "attachment_3");
  const attachment4 = findField(schema, "attachment_4");
  const attachment5 = findField(schema, "attachment_5");

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue"),
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

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 700 }}>ДО</Text>
          <Text style={{ fontWeight: 700 }}>КМЕТА НА РАЙОН „ТРИАДИЦА"</Text>
          <Text style={{ fontWeight: 700 }}>СТОЛИЧНА ОБЩИНА</Text>
        </View>

        <Text style={{ textAlign: "center", fontSize: 15, fontWeight: 700, marginTop: 6, marginBottom: 14 }}>
          ЗАЯВЛЕНИЕ
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>От 1.</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>
        <Text style={pdfStyles.caption}>(име, презиме, фамилия)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Настоящ адрес:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, currentAddress) || getFieldValue(values, r.address)}
          </Text>
        </View>
        <Text style={pdfStyles.caption}>(гр./с., ул. №, ж.к., бл., вх., ет., ап. №)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Постоянен адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, permanentAddress)}</Text>
        </View>
        <Text style={pdfStyles.caption}>(гр./с., ул. №, ж.к., бл., вх., ет., ап. №)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Телефони:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, phones)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>УВАЖАЕМИ Г-Н КМЕТ,</Text>
        <Text>
          Моля семейството/домакинството ми да бъде включено в картотеката на нуждаещите се
          от жилище граждани при район „Триадица".
        </Text>

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Прилагам следните документи:
        </Text>
        <View style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>1.</Text>
          <Text style={{ fontSize: 10, flex: 1 }}>
            Декларация по Наредбата за реда и условията за управление и разпореждане с общински
            жилища на територията на Столична община
          </Text>
        </View>
        {[attachment2, attachment3, attachment4, attachment5].map((a, idx) => (
          <View key={idx} style={pdfStyles.numberedItem}>
            <Text style={pdfStyles.numberedIndex}>{idx + 2}.</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, a)}</Text>
          </View>
        ))}
        <Text style={[pdfStyles.caption, { textAlign: "left", marginLeft: 14, fontStyle: "italic" }]}>
          (Документи по чл. 6, ал. 3 и ал. 4 от Наредбата и други)
        </Text>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при условията
          на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната услуга,
          поискана от Вас и могат да бъдат коригирани по Ваше искане."
        </Text>

        <View wrap={false} style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text>София,</Text>
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
                {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
              </Text>
            </View>
            <Text style={pdfStyles.caption}>(дата)</Text>
          </View>
          <View style={{ alignItems: "flex-end", minWidth: 220 }}>
            <Text>С уважение:</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 32, borderBottom: "1pt solid #333", marginTop: 2 }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20, marginTop: 2 }}> </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
