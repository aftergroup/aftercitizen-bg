/**
 * TD-001 — Вписване в регистър „Търговски обекти" на заявления за
 * работно време на стационарен обект.
 *
 * Branded Район Триадица header + ЗАЯВЛЕНИЕ; field set covers фирма,
 * вид на обекта, адрес, работно време + почивен ден, часове за
 * зареждане, отговорно лице, удостоверения по Закона за храните /
 * Закона за занаятите. Two flagged options ("Обектът се намира /
 * не се намира в жилищна сграда" and "Обектът отстои / не отстои на
 * повече от 30 метра от жилищна сграда") plus an admin section for
 * the district to fill in.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { fieldValueMatches, formatBgDate, getFieldValue } from "./helpers";
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

export default function TDStationaryHoursTemplate({ schema, values }: Props) {
  const firmName =
    findField(schema, "firm_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("firm") || f.code.includes("legal_name"));
  const firmEik =
    findField(schema, "firm_eik") ??
    firstFieldMatching(schema, (f) => f.code.includes("eik") || f.code.includes("bulstat"));
  const objectType =
    findField(schema, "object_type") ??
    firstFieldMatching(schema, (f) => f.code.includes("object_type") || f.code.includes("вид"));
  const objectAddress =
    findField(schema, "object_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("object_address"));
  const workHours = findField(schema, "work_hours");
  const restDay = findField(schema, "rest_day");
  const reloadingHours = findField(schema, "reloading_hours");
  const responsiblePerson =
    findField(schema, "responsible_person") ??
    firstFieldMatching(schema, (f) => f.code.includes("responsible"));
  const foodRegistration = findField(schema, "food_law_registration");
  const craftRegistration = findField(schema, "craft_law_registration");
  const inResidentialBuilding = findField(schema, "in_residential_building");
  const distanceFromResidential = findField(schema, "distance_from_residential");
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

  const inBuildingRaw = String(values[inResidentialBuilding?.code ?? ""] ?? "").toLowerCase();
  const isInBuilding = inBuildingRaw === "true" || inBuildingRaw.includes("се намира") && !inBuildingRaw.includes("не");

  const distanceRaw = String(values[distanceFromResidential?.code ?? ""] ?? "").toLowerCase();
  const isMore30 = distanceRaw === "true" || distanceRaw.includes("отстои") && !distanceRaw.includes("не");

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
        <Text style={pdfStyles.caption}>Регистрационен индекс, дата</Text>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 4, marginTop: 10 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, marginBottom: 14 }}>
          за работно време на стационарен търговски обект
        </Text>

        <Text style={pdfStyles.fillBoxLarge}>
          {[getFieldValue(values, firmName), getFieldValue(values, firmEik)]
            .filter(Boolean)
            .join(", ЕИК/БУЛСТАТ ")}
        </Text>
        <Text style={pdfStyles.caption}>/ фирма, ЕИК/БУЛСТАТ /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 4 }]}>{getFieldValue(values, objectType)}</Text>
        <Text style={pdfStyles.caption}>/ вид на търговския обект /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 4 }]}>{getFieldValue(values, objectAddress)}</Text>
        <Text style={pdfStyles.caption}>/ адрес на търговския обект /</Text>

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

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 4 }]}>{getFieldValue(values, reloadingHours)}</Text>
        <Text style={pdfStyles.caption}>/ часове за зареждане /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 4 }]}>{getFieldValue(values, responsiblePerson)}</Text>
        <Text style={pdfStyles.caption}>/ трите имена и телефон на лицето, отговорно за търговския обект /</Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, foodRegistration)}</Text>
        <Text style={pdfStyles.caption}>
          / номер на удостоверението за регистрация, съгласно чл. 12, ал. 9 от Закона за храните — за обектите по чл. 3, ал. 1, т. 1 и т. 3 от наредбата /
        </Text>

        <Text style={[pdfStyles.fillBoxLarge, { marginTop: 6 }]}>{getFieldValue(values, craftRegistration)}</Text>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>
          / номер на удостоверението за вписване в регистъра по Закона за занаятите и номер на майсторско свидетелство — за обекти в които се упражняват занаяти /
        </Text>

        <Text style={{ marginTop: 6 }}>
          – Обектът{" "}
          <Text style={{ fontWeight: isInBuilding ? 700 : 400, textDecoration: isInBuilding ? "underline" : "none" }}>се намира</Text>
          {" / "}
          <Text style={{ fontWeight: !isInBuilding ? 700 : 400, textDecoration: !isInBuilding ? "underline" : "none" }}>не се намира</Text>
          {" в жилищна сграда. "}
          <Text style={{ fontStyle: "italic", fontSize: 9 }}>Вярното се подчертава</Text>
        </Text>
        <Text style={{ marginTop: 4 }}>
          – Обектът{" "}
          <Text style={{ fontWeight: isMore30 ? 700 : 400, textDecoration: isMore30 ? "underline" : "none" }}>отстои</Text>
          {" / "}
          <Text style={{ fontWeight: !isMore30 ? 700 : 400, textDecoration: !isMore30 ? "underline" : "none" }}>не отстои</Text>
          {" на повече от 30 метра от жилищна сграда. "}
          <Text style={{ fontStyle: "italic", fontSize: 9 }}>Вярното се подчертава</Text>
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

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700, textDecoration: "underline" }]}>
          Попълва се от районната администрация:
        </Text>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Съгласувано работно време:</Text>
          <Text style={pdfStyles.fillLine}> </Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Заявлението е вписано под №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}> </Text>
          <Text>/</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}> </Text>
        </View>
        <Text style={{ fontSize: 9 }}>в информационен масив „Търговски обекти" на район „Триадица".</Text>
        <Text style={{ marginTop: 6, fontSize: 9 }}>
          При промяна в обстоятелствата вписани в настоящото заявление се задължавам да уведомя
          районната администрация в 14 (четиринадесет) дневен срок.
        </Text>
        <Text style={{ marginTop: 8, fontWeight: 700, textAlign: "right" }}>
          КМЕТ НА РАЙОН „ТРИАДИЦА":
        </Text>
      </Page>

      <Page size="A4" style={pdfStyles.page}>
        <Text style={{ fontWeight: 700, textAlign: "center", marginBottom: 12 }}>
          ПРИЛАГАМ КОПИЯ ОТ СЛЕДНИТЕ ДОКУМЕНТИ:
        </Text>
        <Text style={{ fontSize: 9.5, marginBottom: 4 }}>
          1. Актуално удостоверение за вписване в търговския регистър към Агенция по вписванията.
        </Text>
        <Text style={{ fontSize: 9.5, marginBottom: 4 }}>
          2. Удостоверение за регистрация, съгласно чл. 12, ал. 9 от Закона за храните – за обекти по чл. 3, ал. 1, т. 1 и т. 3.
        </Text>
        <Text style={{ fontSize: 9.5, marginBottom: 4 }}>
          3. Протокол от Столична РЗИ или лицензирана лаборатория за съответствие с допустимите нива на шум в и около обекта /за обекти с работно време извън рамките на часовете: от 06.00 ч. до 23.00 ч. за урбанизирани територии и от 06.00 ч. до 22.00 ч. за обекти които с дейността си предизвикват шум и са на отстояние по малко от 30м. от жилищна сграда/.
        </Text>
        <Text style={{ fontSize: 9.5, marginBottom: 4 }}>
          4. Протокол от Столична РЗИ или лицензирана лаборатория за съответствие с допустимите нива на шум в и около обекта и съгласие на 50% + 1 от собствениците, включително съгласието на всички непосредствени съседи /за обекти с работно време извън рамките на часовете от 06.00 ч. до 22.00 ч. в жилищни сгради с режим на етажна собственост/.
        </Text>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          Столична община е Администратор на лични данни с индентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга, поискана от Вас и могат да бъдат коригирани по Ваше искане.
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

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700, textDecoration: "underline" }]}>
          Попълва се от районната администрация:
        </Text>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Осигурени служебно документи:</Text>
          <Text style={pdfStyles.fillLine}> </Text>
        </View>
      </Page>
    </Document>
  );
}
