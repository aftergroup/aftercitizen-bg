/**
 * OS-005 — Справки по актовите книги и издаване на заверени копия от
 * документи относно общинска собственост.
 *
 * Same chrome as the OS-Certificate blank but with:
 *   - Different request opener: "Моля да ми бъдат предоставени копие
 *     от следните документи, съхранявани в архива:"
 *   - Two fixed attachments instead of three: Допълнителни указания от
 *     отдела при необходимост; Документ за платена такса.
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

export default function OSArchiveCopyTemplate({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);

  const documentsList =
    findField(schema, "documents_list") ??
    findField(schema, "request_subject_description") ??
    firstFieldMatching(schema, (f) => f.code.includes("document") || f.code.includes("request"));

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
          <Text style={pdfStyles.label}>От</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>
        <Text style={pdfStyles.caption}>(име, презиме, фамилия)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>адрес</Text>
          <Text style={[pdfStyles.fillLine, { flex: 3 }]}>{getFieldValue(values, r.address)}</Text>
          <Text style={pdfStyles.label}>тел.:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.phone)}</Text>
        </View>
        <Text style={pdfStyles.caption}>(гр./с., ул. №, ж.к., бл., вх., ет., ап. №)</Text>

        <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>УВАЖАЕМИ Г-Н КМЕТ,</Text>
        <Text style={{ marginBottom: 4 }}>
          Моля да ми бъдат предоставени копие от следните документи, съхранявани в архива:
        </Text>
        <View style={pdfStyles.requestBody}>
          <Text>{getFieldValue(values, documentsList)}</Text>
        </View>

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Прилагам следните документи:
        </Text>
        <View style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>1.</Text>
          <Text style={{ fontSize: 10, flex: 1 }}>Допълнителни указания от отдела при необходимост;</Text>
        </View>
        <View style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>2.</Text>
          <Text style={{ fontSize: 10, flex: 1 }}>Документ за платена такса.</Text>
        </View>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при условията
          на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната услуга,
          поискана от Вас и могат да бъдат коригирани по Ваше искане."
        </Text>

        <View wrap={false} style={{ marginTop: 22, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>С уважение:</Text>
            {signatureIsImage ? (
              <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 220, minHeight: 20 }}> </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 6 }}>
            <Text style={pdfStyles.caption}>Дата:</Text>
            <Text style={{ borderBottom: "1pt dotted #888", minWidth: 100, paddingHorizontal: 4, fontSize: 9 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
