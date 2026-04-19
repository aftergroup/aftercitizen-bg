/**
 * Shared blank for TD-003 / TD-005 / TD-006 — three different services
 * but the same printable bланк (verified by reading the PDFs):
 *
 *   TD-003 — търговия на открито върху общинска собственост
 *   TD-005 — кампанийна търговия (Коледа, Нова година, Св.Валентин,
 *            Баба Марта…)
 *   TD-006 — мероприятия с търговска цел / филмови продукции и др.
 *
 * Body lists 5 numbered fields (точен адрес, вид/площ, вид на дейността,
 * имена на лицето, работно време) and 6 attachments + a "САМО ЗА
 * ЗЕМЕДЕЛСКИ ПРОИЗВОДИТЕЛ/ЗАНАЯТЧИЯ" sub-list.
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

export default function TDOpenTradeTemplate({ schema, values }: Props) {
  const applicantName =
    findField(schema, "applicant_name_or_firm") ??
    findField(schema, "firm_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("firm") || f.code.includes("applicant_name"));
  const eik = findField(schema, "firm_eik");
  const periodFrom = findField(schema, "period_from");
  const periodTo = findField(schema, "period_to");
  const objectAddress = findField(schema, "object_address");
  const equipmentTypeArea = findField(schema, "equipment_type_area");
  const activityType = findField(schema, "activity_type");
  const tradePersonName = findField(schema, "trade_person_name");
  const workHours = findField(schema, "work_hours");
  const otherDocuments = findField(schema, "other_documents");
  const farmerCardYear = findField(schema, "farmer_card_year");
  const farmerRegistrationYear = findField(schema, "farmer_registration_year");
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

  const fullApplicantHeader = [getFieldValue(values, applicantName), getFieldValue(values, eik)]
    .filter(Boolean)
    .join(", ЕИК (БУЛСТАТ) ");

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

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, marginTop: 10 }}>
          ЗАЯВЛЕНИЕ
        </Text>
        <Text style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, marginBottom: 14 }}>
          за издаване на разрешение за ползване на място за извършване на търговия на открито
          върху терен общинска собственост чрез съоръжения и елементи по чл. 36г от Наредбата
          за преместваемите обекти, за рекламните, информационните и монументално-декоративните
          елементи и за рекламната дейност на територията на Столична община
        </Text>

        <Text style={pdfStyles.fillBoxLarge}>{fullApplicantHeader}</Text>
        <Text style={pdfStyles.caption}>(три имена на лицето/наименование на фирма, ЕИК (БУЛСТАТ))</Text>

        <Text style={{ fontWeight: 700, marginTop: 8 }}>УВАЖАЕМИ Г-Н КМЕТ,</Text>
        <Text style={{ marginTop: 4 }}>
          Моля на основание чл.56а, ал.1-2 от ЗУТ и чл.36г, ал.1 от Наредбата за преместваемите
          обекти, за рекламните, информационните и монументално-декоративните елементи и за
          рекламната дейност на територията на Столична община да ми бъде издадено разрешение
          за ползване на място за извършване на търговска и/или друга дейност на открито върху
          терен — публична общинска собственост, за срок
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
          <Text>20___ г. (до 6 месеца)</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>1. Точен адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, objectAddress)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>2. Вид и площ на съоръжението/елемента, снимков материал, визуализация на съоръжението/елемента</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, equipmentTypeArea)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>3. Вид на дейността, която ще се извършва:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, activityType)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>4. Трите имена на лицето, което извършва търговската дейност от името на търговеца/производителя:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, tradePersonName)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>5. Работно време:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, workHours)}</Text>
        </View>

        <Text style={{ marginTop: 8 }}>
          Изпълнил съм специалните изисквания на закона и в уверение на това прилагам следните
          необходими документи:
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 4 }}>
          1. техническа и производствена документация за съоръжението или елемента (документи за
          произход и качество на оборудването на съоръжението или елемента и други подобни)
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>
          2. доказателства за съответствие на съоръженията и елементите с изискванията на Закона
          за техническите изисквания към продуктите;
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>
          3. снимков материал, визуализация на съоръжението;
        </Text>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>
          4. доказателства или сертификат, издадени от компетентен орган или оторизирано за това
          лице, за наличието и безопасността на оборудването за автономно захранване, както и
          декларация за периодичния му контрол.
        </Text>
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          <Text style={pdfStyles.label}>5. други документи, както следва:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, otherDocuments)}</Text>
        </View>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>
          6. пълномощно (в случай, че заявлението се подава от пълномощник).
        </Text>

        <Text style={{ marginTop: 8, fontWeight: 700 }}>САМО ЗА ЗЕМЕДЕЛСКИ ПРОИЗВОДИТЕЛ/ЗАНАЯТЧИЯ</Text>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(ненужното се зачертава)</Text>
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          <Text style={pdfStyles.label}>1. анкетна карта за регистрация на земеделски производител, заверена за 20</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.4 }]}>{getFieldValue(values, farmerCardYear)}</Text>
          <Text>г.;</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          <Text style={pdfStyles.label}>2. регистрационна карта на земеделски производител, заверена за 20</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.4 }]}>{getFieldValue(values, farmerRegistrationYear)}</Text>
          <Text>г.;</Text>
        </View>
        <Text style={{ fontSize: 9.5, marginTop: 2 }}>3. документ за регистрация (за занаятчия).</Text>

        <View wrap={false} style={{ marginTop: 14, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>С УВАЖЕНИЕ, Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20 }}> </Text>
            )}
          </View>
          <Text style={[pdfStyles.caption, { textAlign: "right" }]}>/ три имена на лицето/печат /</Text>
        </View>
      </Page>
    </Document>
  );
}
