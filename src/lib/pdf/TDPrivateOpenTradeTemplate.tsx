/**
 * TD-004 — Вписване в регистър на заявление за работно време на
 * търговски обект на открито в имот частна собственост.
 *
 * Branded Триадица header. Captures фирма/ЕИК, отговорно лице, вид/площ
 * на съоръжението, адрес, вид на стоките, работно време + почивен ден.
 * Ends with admin section "Попълва се от районната администрация" and
 * a second-page attachments list (per чл.31, ал.5 firms / ал.6 farmers).
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { findField, firstFieldMatching, getMunicipality, pdfStyles } from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

function TriadicaHeader({ schema }: { schema: RenderedForm }) {
  const m = getMunicipality(schema);
  return (
    <>
      <View style={{ alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1f3a7b" }}>СТОЛИЧНА ОБЩИНА</Text>
        <Text style={{ fontSize: 18, fontWeight: 700, color: "#1f3a7b" }}>{m.nameBg.toUpperCase()}</Text>
      </View>
      <View style={{ borderTop: "1pt solid #1f3a7b", borderBottom: "1pt solid #1f3a7b", padding: 3, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", fontSize: 8.5, color: "#1f3a7b" }}>
          {m.address}     тел.: {m.phone}     {m.websiteUrl}     {m.contactEmail}
        </Text>
      </View>
    </>
  );
}

export default function TDPrivateOpenTradeTemplate({ schema, values }: Props) {
  const firmName =
    findField(schema, "firm_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("firm") || f.code.includes("legal_name") || f.code.includes("applicant_name"));
  const firmEik = findField(schema, "firm_eik");
  const tradePersonName =
    findField(schema, "trade_person_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("responsible") || f.code.includes("trade_person"));
  const equipmentTypeArea = findField(schema, "equipment_type_area");
  const objectAddress = findField(schema, "object_address");
  const goodsType = findField(schema, "goods_type");
  const workHours = findField(schema, "work_hours");
  const restDay = findField(schema, "rest_day");
  const otherDocsFirm = findField(schema, "other_documents_firm");
  const otherDocsFarmer = findField(schema, "other_documents_farmer");
  const regIndex = findField(schema, "registration_index");

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

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <TriadicaHeader schema={schema} />

        <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginBottom: 2 }}>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, regIndex)}</Text>
          <Text>/</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.5 }]}>
            {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
          </Text>
        </View>
        <Text style={pdfStyles.caption}>Регистрационен индекс, дата</Text>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 4, marginTop: 10 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, marginBottom: 14 }}>
          ЗА РАБОТНО ВРЕМЕ ЗА ИЗВЪРШВАНЕ НА ТЪРГОВСКА ДЕЙНОСТ НА ОТКРИТО В ИМОТ ЧАСТНА СОБСТВЕНОСТ
        </Text>

        <Text style={pdfStyles.fillBoxLarge}>
          {[getFieldValue(values, firmName), getFieldValue(values, firmEik)]
            .filter(Boolean)
            .join(", ЕИК/БУЛСТАТ ")}
        </Text>
        <Text style={pdfStyles.caption}>/ фирма, ЕИК /БУЛСТАТ/ или трите имена на физическото лице-производител /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, tradePersonName)}</Text>
        <Text style={pdfStyles.caption}>/ трите имена и телефон на лицето, което извършва търговска дейност от името на търговеца / производителя /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, equipmentTypeArea)}</Text>
        <Text style={pdfStyles.caption}>/ вид и площ на съоръжението /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, objectAddress)}</Text>
        <Text style={pdfStyles.caption}>/ точен адрес /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, goodsType)}</Text>
        <Text style={pdfStyles.caption}>/ вид на стоките с които се търгува /</Text>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 6, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, workHours)}</Text>
            <Text style={pdfStyles.caption}>/ работно време /</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, restDay)}</Text>
            <Text style={pdfStyles.caption}>/ почивен ден /</Text>
          </View>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 12 }}>
          При промяна в обстоятелствата вписани в настоящото заявление се задължавам да уведомя
          районната администрация в 14 (четиринадесет) дневен срок.
        </Text>

        <View wrap={false} style={{ marginTop: 16, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20 }}> </Text>
            )}
          </View>
          <Text style={[pdfStyles.caption, { textAlign: "right" }]}>/ име, фамилия на управителя, печат /</Text>
        </View>

        <Text style={{ textAlign: "center", marginTop: 18, fontWeight: 700, textDecoration: "underline" }}>
          Попълва се от районната администрация!
        </Text>
        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>Съгласувано работно време:</Text>
          <Text style={pdfStyles.fillLine}> </Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Заявлението е вписано под №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}> </Text>
          <Text>/</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}> </Text>
          <Text style={pdfStyles.label}>в информационен масив</Text>
        </View>
        <Text style={{ fontSize: 9.5 }}>
          „Обекти за търговия на открито в имоти частна собственост" на {getMunicipality(schema).type} „{getMunicipality(schema).nameShort}"
        </Text>
        <Text style={{ marginTop: 8, fontWeight: 700, textAlign: "center" }}>
          КМЕТ НА {getMunicipality(schema).type.toUpperCase()} „{getMunicipality(schema).nameShort.toUpperCase()}"
        </Text>
      </Page>

      <Page size="A4" style={pdfStyles.page}>
        <Text style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 6 }}>
          Прилагам копия от следните документи съгл. чл.31, ал.5 /за фирми/:
        </Text>
        <Text style={{ fontSize: 9.5, marginBottom: 4 }}>
          1. Актуално Удостоверение за вписване в търговския регистър към Агенцията по вписванията.
        </Text>
        <View style={pdfStyles.row}>
          <Text style={[pdfStyles.label, { fontSize: 9.5 }]}>2. Други документи, на които лицето се позовава:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, otherDocsFirm)}</Text>
        </View>

        <Text style={{ fontWeight: 700, textDecoration: "underline", marginTop: 10 }}>
          Прилагам копия от следните документи съгл. чл.31, ал.6 /за земеделски производители/:
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 4 }}>
          1. Анкетна карта за регистрация на земеделски производител, заверена от компетентния
          орган за съответната година.
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>
          2. Регистрационна карта на земеделски производител, заверена за съответната година.
        </Text>
        <View style={pdfStyles.row}>
          <Text style={[pdfStyles.label, { fontSize: 9.5 }]}>3. Други документи, на които лицето се позовава:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, otherDocsFarmer)}</Text>
        </View>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга.
        </Text>

        <View wrap={false} style={{ marginTop: 16, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20 }}> </Text>
            )}
          </View>
          <Text style={[pdfStyles.caption, { textAlign: "right" }]}>/ име, фамилия на управителя, печат /</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 14 }]}>
          <Text style={pdfStyles.label}>Осигурени служебно документи:</Text>
          <Text style={pdfStyles.fillLine}> </Text>
        </View>
      </Page>
    </Document>
  );
}
