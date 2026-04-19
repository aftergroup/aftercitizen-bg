/**
 * TD-008 — Издаване на разрешение за ползване на място за поставяне на
 * фирмени тотеми върху общински терен.
 *
 * Two-page form mirroring TD-007's structure but for fixed totems
 * instead of street-pole табели:
 *   Page 1: ЗАЯВЛЕНИЕ — applicant + role, legal entity, address of
 *           management, request for тотем over N кв.м., 3-year max
 *           period, fixed approved-project number, 4 attachments,
 *           contact person + e-mail.
 *   Page 2: ДЕКЛАРАЦИЯ — declarant acknowledges типов проект.
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

export default function TDTotemTemplate({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);
  const role = findField(schema, "applicant_role");
  const legalName = findField(schema, "legal_name");
  const eik = findField(schema, "legal_eik");
  const totemArea = findField(schema, "totem_area");
  const totemPeriodFrom = findField(schema, "period_from");
  const installFromDate = findField(schema, "install_from_date");
  const objectType = findField(schema, "object_type");
  const objectAddress = findField(schema, "object_address");
  const approvedProjectNumber = findField(schema, "approved_project_number");
  const approvedProjectIssuer = findField(schema, "approved_project_issuer");
  const contactPerson = findField(schema, "contact_person");
  const contactPhone = findField(schema, "contact_phone");
  const contactMobile = findField(schema, "contact_mobile");
  const contactEmail = findField(schema, "contact_email") ?? r.email;
  const correspondenceAddress = findField(schema, "correspondence_address") ?? r.address;
  const propertyLocation = findField(schema, "property_location");

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue") && !f.code.includes("install") && !f.code.includes("period"),
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
          за издаване на разрешение за ползване на място за поставяне на фирмен тотем
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
          <Text>Желая да ми бъде издадено разрешение за ползване на място за поставяне на</Text>
          <Text style={{ fontWeight: 700 }}> ФИРМЕН ТОТЕМ </Text>
          <Text>върху общински терен от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.5 }]}>{getFieldValue(values, totemArea)}</Text>
          <Text>кв.м.,</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>находящ се:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, propertyLocation)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>за срок от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, totemPeriodFrom))}
          </Text>
          <Text>, считано от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, installFromDate))}
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "left" }]}>/максимален срок 3 (три) години/</Text>
          <Text style={[pdfStyles.caption, { flex: 1, textAlign: "right" }]}>/дата на поставяне на фирмения тотем/</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text>Фирменият тотем обозначава местонахождението на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, objectType)}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "right" }]}>/Вид на обекта/</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, objectAddress)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text>За фирмения тотем има одобрен проект и разрешение за поставяне №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, approvedProjectNumber)}</Text>
        </View>
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text>, издадено от</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, approvedProjectIssuer)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 8 }}>Прилагам:</Text>
        <Text style={{ fontSize: 9.5 }}>1. Одобрена проектна документация.</Text>
        <Text style={{ fontSize: 9.5 }}>2. Разрешение за поставяне.</Text>
        <Text style={{ fontSize: 9.5 }}>
          3. Карта за идентификация по регистър БУЛСТАТ (за юридически лица без регистрация в търговския регистър).
        </Text>
        <Text style={{ fontSize: 9.5 }}>
          4. Нотариално заверено пълномощно (при подаване на заявлението от пълномощник).
        </Text>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>Лице за връзка:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, contactPerson)}</Text>
          <Text style={pdfStyles.label}>тел.:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, contactPhone)}</Text>
          <Text style={pdfStyles.label}>мобилен:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, contactMobile)}</Text>
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
          представител кмета на Столична община."
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

      {/* Page 2: declaration (TD-008-2) */}
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
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с БУЛСТАТ/ЕИК</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, eik)}</Text>
          <Text style={pdfStyles.label}>, адрес на управление:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, correspondenceAddress)}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 12 }}>ДЕКЛАРИРАМ:</Text>

        <Text style={{ marginTop: 6 }}>
          1. Запознат съм с пълното съдържание на одобрения проект на фирмения тотем по
          Наредбата за преместваемите обекти, за рекламните, информационните и
          монументално-декоративните елементи и за рекламната дейност на територията на
          Столична община.
        </Text>

        <Text style={{ marginTop: 6 }}>
          2. Задължавам се да изработя и поставя фирмения тотем в съответствие с одобрения
          проект и издаденото Разрешение за ползване на място.
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
