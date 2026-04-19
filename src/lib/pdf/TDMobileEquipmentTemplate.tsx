/**
 * TD-002 — Издаване на разрешение за ползване на място за разполагане
 * на подвижни съоръжения пред стационарен търговски обект върху терен
 * — общинска собственост.
 *
 * 7-numbered fields (точен адрес, вид на стационарния обект, вид на
 * съоръжението, заемана площ, площ за ограждащи декоративни елементи,
 * стокова специализация, работно време + почивен ден). Two attachments
 * referencing чл.28в от НРУИТДТСО individual schemes.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { findField, firstFieldMatching, pdfStyles } from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

function TriadicaHeader() {
  return (
    <>
      <View style={{ alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1f3a7b" }}>СТОЛИЧНА ОБЩИНА</Text>
        <Text style={{ fontSize: 18, fontWeight: 700, color: "#1f3a7b" }}>РАЙОН ТРИАДИЦА</Text>
      </View>
      <View style={{ borderTop: "1pt solid #1f3a7b", borderBottom: "1pt solid #1f3a7b", padding: 3, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", fontSize: 8.5, color: "#1f3a7b" }}>
          София, ул. „Алабин" № 54     тел.: 02 8054 101     www.triaditza.org     triaditsa@sofia.bg
        </Text>
      </View>
    </>
  );
}

export default function TDMobileEquipmentTemplate({ schema, values }: Props) {
  const firmName =
    findField(schema, "firm_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("firm") || f.code.includes("legal_name"));
  const firmEik =
    findField(schema, "firm_eik") ??
    firstFieldMatching(schema, (f) => f.code.includes("eik") || f.code.includes("bulstat"));
  const phone =
    findField(schema, "phone") ??
    firstFieldMatching(schema, (f) => f.code.includes("phone"));
  const periodFrom = findField(schema, "period_from");
  const periodTo = findField(schema, "period_to");
  const objectAddress = findField(schema, "object_address");
  const stationaryObjectType = findField(schema, "stationary_object_type");
  const article4Number = findField(schema, "article_4_request_number");
  const equipmentType = findField(schema, "equipment_type");
  const totalArea = findField(schema, "total_area");
  const decorativeArea = findField(schema, "decorative_area");
  const productSpecialization = findField(schema, "product_specialization");
  const workHours = findField(schema, "work_hours");
  const restDay = findField(schema, "rest_day");
  const regIndex = findField(schema, "registration_index");

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue") && !f.code.includes("period"),
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
        <TriadicaHeader />

        <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginBottom: 2 }}>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, regIndex)}</Text>
          <Text>/</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.5 }]}>
            {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
          </Text>
        </View>
        <Text style={pdfStyles.caption}>(Регистрационен индекс, дата)</Text>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 4, marginTop: 10 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, marginBottom: 14 }}>
          за издаване на разрешение за ползване на място за разполагане на подвижни съоръжения
          пред стационарен търговски обект върху терен общинска собственост
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>от</Text>
          <Text style={pdfStyles.fillLine}>
            {[getFieldValue(values, firmName), getFieldValue(values, firmEik)]
              .filter(Boolean)
              .join(", ЕИК/БУЛСТАТ ")}
          </Text>
        </View>
        <Text style={pdfStyles.caption}>/ фирма, ЕИК/БУЛСТАТ /</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>тел.:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, phone)}</Text>
        </View>
        <Text style={pdfStyles.caption}>/ телефон /</Text>

        <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 4, textAlign: "center" }}>
          Уважаеми Господин Кмет,
        </Text>
        <Text>
          Желая да ми бъде издадено разрешение за ползване на място за разполагане на подвижни
          съоръжения върху терен общинска собственост пред стопанисвания от мен стационарен
          търговски обект за срок
        </Text>

        <View style={[pdfStyles.row, { marginTop: 4, justifyContent: "center" }]}>
          <Text>от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>
            {formatBgDate(getFieldValue(values, periodFrom))}
          </Text>
          <Text>до</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>
            {formatBgDate(getFieldValue(values, periodTo))}
          </Text>
          <Text>20___ г. / до 6 месеца /</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 8 }]}>
          <Text style={pdfStyles.label}>1. Точен адрес на обекта:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, objectAddress)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>2. Вид на стационарния обект</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.2 }]}>{getFieldValue(values, stationaryObjectType)}</Text>
          <Text style={pdfStyles.label}>, номер на заявлението по чл.4</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>{getFieldValue(values, article4Number)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>3. Вид на съоръжението:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, equipmentType)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>4. Заемана площ – общо</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, totalArea)}</Text>
          <Text>кв.м.</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>5. Площ за поставяне на ограждащи декоративни елементи –</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, decorativeArea)}</Text>
          <Text>кв.м.</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left", marginLeft: 12 }]}>
          (при разполагане маси и столове за консумация на открито)
        </Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>6. Стокова специализация:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, productSpecialization)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>7. Работно време на съоръженията:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, workHours)}</Text>
          <Text style={pdfStyles.label}>почивен ден:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, restDay)}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left", marginLeft: 12 }]}>
          / в рамките от 07.00 ч. до 22.00 ч. /
        </Text>

        <Text style={{ marginTop: 8, fontWeight: 700, textDecoration: "underline" }}>
          Прилагам заверени копия от следните документи:
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 4 }}>
          1. Индивидуална схема по чл.28 в от НРУИТДТСО, съгласувана с Дирекция „Транспорт" на
          СО и одобрена от Гл. Архитект на района.
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 4 }}>
          2. Индивидуална схема по чл.28 в от НРУИТДТСО, съгласувана с Дирекция „Транспорт" на
          СО и отдел „Пътна полиция" при СДП, одобрена от Гл. Архитект на района
        </Text>
        <Text style={[pdfStyles.caption, { textAlign: "left", marginLeft: 12 }]}>
          / за разполагане на маси и столове за консумация на открито /
        </Text>

        <Text style={{ marginTop: 6, fontStyle: "italic", textDecoration: "underline" }}>Забележка:</Text>
        <Text style={{ fontStyle: "italic", fontSize: 9.5 }}>
          Посочената в т.5 площ е част от площта по т.4. Точка 5 се попълва при искане за
          разполагане на маси и столове за консумация на открито.
        </Text>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга.
        </Text>

        <View wrap={false} style={{ marginTop: 14, alignItems: "flex-end" }}>
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
      </Page>
    </Document>
  );
}
