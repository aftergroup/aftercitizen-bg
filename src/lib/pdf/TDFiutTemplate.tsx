/**
 * TD-007 — Издаване на разрешение за ползване на място чрез поставяне
 * на фирмени информационно-указателни табели (ФИУТ) върху имоти —
 * общинска собственост.
 *
 * Two-page form:
 *   Page 1: ЗАЯВЛЕНИЕ — applicant + role, legal entity + БУЛСТАТ,
 *           address of management, request for N (max 6) ФИУТ on
 *           street-light poles, object/address, period (max 1 year),
 *           sizes + одностранни/двустранни counts, 7 attachments.
 *   Page 2: ДЕКЛАРАЦИЯ — declarant acknowledges chl. 52 obligation
 *           to install ФИУТ in conformance with the общински типов
 *           проект.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { findField, firstFieldMatching, getMunicipality, pdfStyles, resolveApplicantFields } from "./shared";
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

export default function TDFiutTemplate({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);
  const role = findField(schema, "applicant_role");
  const legalName = findField(schema, "legal_name");
  const eik = findField(schema, "legal_eik");
  const fiutCount = findField(schema, "fiut_count");
  const objectType = findField(schema, "object_type");
  const objectAddress = findField(schema, "object_address");
  const periodFrom = findField(schema, "period_from");
  const periodTo = findField(schema, "period_to");
  const fiutSizeWidth = findField(schema, "fiut_size_width");
  const fiutSizeHeight = findField(schema, "fiut_size_height");
  const fiutOneSidedCount = findField(schema, "fiut_one_sided_count");
  const fiutTwoSidedCount = findField(schema, "fiut_two_sided_count");
  const contactPerson = findField(schema, "contact_person");
  const contactPhone = findField(schema, "contact_phone");
  const contactEmail = findField(schema, "contact_email") ?? r.email;
  const correspondenceAddress = findField(schema, "correspondence_address") ?? r.address;

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
        <TriadicaHeader schema={schema} />

        <View style={{ marginBottom: 10 }}>
          <Text>ДО</Text>
          <Text style={{ fontWeight: 700 }}>КМЕТА НА {getMunicipality(schema).type.toUpperCase()} „{getMunicipality(schema).nameShort.toUpperCase()}"</Text>
        </View>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 4, marginTop: 6 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, marginBottom: 14 }}>
          за издаване на разрешение за ползване на място чрез поставяне на фирмени
          информационно-указателни табели (ФИУТ)
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{declarantName}</Text>
          <Text style={pdfStyles.label}>, в качеството на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, role)}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "left" }]}>(трите имена)</Text>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "right" }]}>(управител, изп. директор, пълномощник)</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, legalName)}</Text>
          <Text style={pdfStyles.label}>, с БУЛСТАТ/ЕИК</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, eik)}</Text>
        </View>
        <Text style={pdfStyles.caption}>(име на юридическото лице/ ЕТ)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>адрес на управление:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, correspondenceAddress)}</Text>
        </View>

        <Text style={{ marginTop: 10 }}>Уважаема/и г-жо/ г-н Кмет,</Text>
        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text>Желая да ми бъде издадено разрешение за ползване на място чрез поставяне на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.5 }]}>{getFieldValue(values, fiutCount)}</Text>
          <Text>бр. ФИУТ по</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "right" }]}>(максимален брой – 6 бр.)</Text>

        <Text style={{ marginTop: 4 }}>
          общински типов проект, поставена/и върху стълб/ове за улично осветление — общинска
          собственост, свързана/и със стопанисвания от мен обект:
        </Text>
        <Text style={pdfStyles.fillBoxLarge}>{getFieldValue(values, objectType)}</Text>
        <Text style={pdfStyles.caption}>(описва се вида на обекта)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, objectAddress)}</Text>
        </View>
        <Text style={pdfStyles.caption}>(описва се адреса на обекта)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>за времето от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>
            {formatBgDate(getFieldValue(values, periodFrom))}
          </Text>
          <Text>г. до</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>
            {formatBgDate(getFieldValue(values, periodTo))}
          </Text>
          <Text>г.</Text>
          <Text style={pdfStyles.caption}>(максимален срок 1/една/ година)</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 6, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, fiutSizeWidth)}</Text>
              <Text>мм. /</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, fiutSizeHeight)}</Text>
              <Text>мм.</Text>
            </View>
            <Text style={pdfStyles.caption}>Размери на ФИУТ</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, fiutOneSidedCount)}</Text>
              <Text>бр.</Text>
            </View>
            <Text style={pdfStyles.caption}>едностранни ФИУТ</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, fiutTwoSidedCount)}</Text>
              <Text>бр.</Text>
            </View>
            <Text style={pdfStyles.caption}>двустранни ФИУТ</Text>
          </View>
        </View>

        <Text style={{ marginTop: 6 }}>
          Елементите ще бъдат поставени съгласно нормативните изисквания на Столична община.
        </Text>

        <Text style={{ fontWeight: 700, marginTop: 6 }}>Прилагам:</Text>
        <Text style={{ fontSize: 9.5 }}>
          1. Номериран списък на местата за поставяне на ФИУТ и указване дали ФИУТ е едностранна или двустранна.
        </Text>
        <Text style={{ fontSize: 9.5 }}>
          2. Местоположение/я (копие/я от карта на гр. София с отбелязано местоположение, номерирано съгласно списъка).
        </Text>
        <Text style={{ fontSize: 9.5 }}>
          3. Визуализация (снимка отделно за всяко място, номерирана съгласно списъка).
        </Text>
        <Text style={{ fontSize: 9.5 }}>
          4. Текстово и графично съдържание на всяка ФИУТ — 2 бр.
        </Text>
        <Text style={{ fontSize: 9.5 }}>5. Декларация по чл.33б, ал.3.</Text>
        <Text style={{ fontSize: 9.5 }}>
          6. Карта за идентификация по регистър БУЛСТАТ (за физически и юридически лица без регистрация в търговския регистър).
        </Text>
        <Text style={{ fontSize: 9.5 }}>
          7. Нотариално заверено пълномощно (при подаване на заявлението от пълномощник).
        </Text>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>Лице за връзка:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, contactPerson)}</Text>
          <Text style={pdfStyles.label}>тел.:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, contactPhone)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>e-mail за получаване на кореспонденция:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, contactEmail)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>адрес за кореспонденция:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, correspondenceAddress)}</Text>
        </View>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е Администратор на лични данни с идентификационен номер 52258 и
          представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл.19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга."
        </Text>

        <View wrap={false} style={{ marginTop: 14, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>ПОДПИС:</Text>
            {signatureIsImage ? (
              <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
      </Page>

      {/* Page 2: Declaration (TD-007-2) */}
      <Page size="A4" style={pdfStyles.page}>
        <TriadicaHeader schema={schema} />

        <Text style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: 6, marginTop: 6, marginBottom: 18 }}>
          Д Е К Л А Р А Ц И Я
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Долуподписаният/та,</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>
        <Text style={pdfStyles.caption}>(трите имена)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>в качеството си на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, role)}</Text>
          <Text style={pdfStyles.label}>на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.5 }]}>{getFieldValue(values, legalName)}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "left" }]}>(управител, изп. директор)</Text>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "right" }]}>(име на юридическото лице/ ЕТ)</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с БУЛСТАТ/ЕИК</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, eik)}</Text>
          <Text style={pdfStyles.label}>, адрес на управление:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, correspondenceAddress)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 12 }}>ДЕКЛАРИРАМ:</Text>

        <Text style={{ marginTop: 6 }}>
          1. Запознат съм с пълното съдържанието на общинския типов проект на фирмена
          информационно — указателна табела по чл.52 от Наредбата за преместваемите обекти, за
          рекламните, информационните и монументално — декоративните елементи и за рекламната
          дейност на територията на Столична община /приета с Решение № 717 по Протокол № 71
          от 06.11.2014г. на Столичен общински съвет/.
        </Text>

        <Text style={{ marginTop: 6 }}>
          2. Задължавам се да изработя и поставя всички фирмени информационно — указателни
          табели в съответствие с общинския типов проект и издаденото Разрешение за ползване
          на място.
        </Text>

        <Text style={{ marginTop: 8, fontStyle: "italic" }}>
          Известно ми е, че нося отговорност за деклариране на неверни данни.
        </Text>

        <View wrap={false} style={{ marginTop: 26, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Дата</Text>
            <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", minWidth: 220 }}>
            <Text style={{ fontWeight: 700 }}>ДЕКЛАРАТОР:</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", flex: 1, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
