/**
 * Printable PDF for Удостоверение за административен адрес (AA-001, AA-002).
 *
 * AA-001 — Удостоверение за административен адрес на поземлен имот.
 *   The citizen supplies the property description by УПИ / кв. / местност
 *   plus the two alternative addresses (Адрес 1 / Адрес 2) that they
 *   believe to be identical; the administration certifies the authoritative
 *   one. Applicant can be natural or legal (applicant_type dictates).
 *
 * AA-002 — Удостоверение за идентичност на административен адрес.
 *   Same applicant block, same property description, but the request body
 *   additionally carries a free-text subject (request_subject_description)
 *   and property details (cadastral id, street / number / region).
 *
 * Layout mirrors the Триадица blank:
 *   Addressee top-right, centered ЗАЯВЛЕНИЕ title with service subtitle,
 *   applicant block (natural / legal), property block, request body (AA-002),
 *   attachments, signature footer with wrap={false} so the signature box
 *   never splits across pages.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedField, RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { findField, pdfStyles, resolveApplicantFields } from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

function cell(label: string, field: RenderedField | undefined, value: string, width?: number) {
  if (!field) return null;
  return (
    <View
      key={label}
      style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, width: width ?? 140 }}
    >
      <Text style={pdfStyles.label}>{label}:</Text>
      <Text style={pdfStyles.fillLine}>{value}</Text>
    </View>
  );
}

export default function AAAddressTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const r = resolveApplicantFields(schema);

  // Applicant type (natural vs legal entity)
  const applicantType = findField(schema, "applicant_type");
  const legalName = findField(schema, "applicant_legal_name");
  const legalEik = findField(schema, "applicant_legal_eik");
  const applicantTypeLabel = getFieldValue(values, applicantType).toLowerCase();
  const isLegalEntity =
    applicantTypeLabel.includes("юридическ") || applicantTypeLabel.includes("legal");

  // Property
  const propertyUpi = findField(schema, "property_upi");
  const propertyKvartal = findField(schema, "property_kvartal");
  const propertyMestnost = findField(schema, "property_mestnost");
  const propertyAddress1 = findField(schema, "property_address_1");
  const propertyAddress2 = findField(schema, "property_address_2");
  // AA-002 extras
  const propertyCadastralId = findField(schema, "property_cadastral_id");
  const propertyStreet = findField(schema, "property_street");
  const propertyNumber = findField(schema, "property_number");
  const propertyRegion = findField(schema, "property_region");

  const requestSubject = findField(schema, "request_subject_description");
  const additionalExplanations =
    findField(schema, "additional_explanations") ?? findField(schema, "free_text_request");

  // Attachments
  const ownership =
    findField(schema, "ownership_actual_document") ?? findField(schema, "ownership_document");
  const proxy = findField(schema, "power_of_attorney_notarized");
  const payment = findField(schema, "payment_order_document");
  const otherDocs = findField(schema, "other_documents");

  const signaturePlace = findField(schema, "signature_place");
  const signatureDate = findField(schema, "signature_date");
  const signatureField = findField(schema, "signature");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  const fullName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const isAA002 = serviceCode === "AA-002";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.addresseeBlock}>
          <Text style={pdfStyles.addresseeLine}>До</Text>
          <Text style={pdfStyles.addresseeFill}>Главния архитект</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={pdfStyles.addresseeFill}>Район Триадица</Text>
          <Text style={pdfStyles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={pdfStyles.title}>ЗАЯВЛЕНИЕ</Text>
        <Text style={pdfStyles.subtitle}>
          {serviceTitle ||
            (isAA002
              ? "за издаване на удостоверение за идентичност на административен адрес"
              : "за издаване на удостоверение за административен адрес на поземлен имот")}
        </Text>

        {/* Applicant block — natural / legal entity */}
        {isLegalEntity ? (
          <>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>
                {legalName ? legalName.labelBg : "Наименование на ЮЛ"}:
              </Text>
              <Text style={[pdfStyles.fillLine, { flex: 2 }]}>
                {getFieldValue(values, legalName)}
              </Text>
              {legalEik && (
                <>
                  <Text style={pdfStyles.label}>{legalEik.labelBg}:</Text>
                  <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, legalEik)}
                  </Text>
                </>
              )}
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>представлявано от:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{fullName}</Text>
              {r.egn && (
                <>
                  <Text style={pdfStyles.label}>ЕГН:</Text>
                  <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, r.egn)}
                  </Text>
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>От:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 2.5 }]}>{fullName}</Text>
              {r.egn && (
                <>
                  <Text style={pdfStyles.label}>{r.egn.labelBg}:</Text>
                  <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, r.egn)}
                  </Text>
                </>
              )}
            </View>
            <Text style={pdfStyles.helper}>(име, презиме, фамилия)</Text>
          </>
        )}

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>
            {r.address ? r.address.labelBg : "Адрес за кореспонденция"}:
          </Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>

        {(r.phone || r.email) && (
          <View style={pdfStyles.row}>
            {r.phone && (
              <>
                <Text style={pdfStyles.label}>{r.phone.labelBg}:</Text>
                <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                  {getFieldValue(values, r.phone)}
                </Text>
              </>
            )}
            {r.email && (
              <>
                <Text style={pdfStyles.label}>{r.email.labelBg}:</Text>
                <Text style={[pdfStyles.fillLine, { flex: 1.6 }]}>
                  {getFieldValue(values, r.email)}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Request body */}
        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо Главен архитект,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издадено{" "}
          {isAA002
            ? "удостоверение за идентичност на административен адрес"
            : "удостоверение за административен адрес"}{" "}
          за следния поземлен имот:
        </Text>

        {/* Property description */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          {cell("УПИ", propertyUpi, getFieldValue(values, propertyUpi), 140)}
          {cell("кв.", propertyKvartal, getFieldValue(values, propertyKvartal), 90)}
          {cell("м-ст", propertyMestnost, getFieldValue(values, propertyMestnost), 160)}
        </View>

        {isAA002 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
            {cell(
              "Кад. ид.",
              propertyCadastralId,
              getFieldValue(values, propertyCadastralId),
              200,
            )}
            {cell("Район", propertyRegion, getFieldValue(values, propertyRegion), 140)}
            {cell("ул.", propertyStreet, getFieldValue(values, propertyStreet), 180)}
            {cell("№", propertyNumber, getFieldValue(values, propertyNumber), 60)}
          </View>
        )}

        {/* Alternative addresses for AA-001 */}
        {!isAA002 && (propertyAddress1 || propertyAddress2) && (
          <View
            style={{
              marginTop: 4,
              padding: 6,
              borderWidth: 1,
              borderColor: "#888",
              borderStyle: "solid",
            }}
          >
            <Text style={{ fontSize: 9.5, marginBottom: 4, fontStyle: "italic" }}>
              Два алтернативни административни адреса, за чиято идентичност се иска удостоверение:
            </Text>
            {propertyAddress1 && (
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Адрес 1:</Text>
                <Text style={pdfStyles.fillLine}>{getFieldValue(values, propertyAddress1)}</Text>
              </View>
            )}
            {propertyAddress2 && (
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Адрес 2:</Text>
                <Text style={pdfStyles.fillLine}>{getFieldValue(values, propertyAddress2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* AA-002 free-text subject */}
        {isAA002 && requestSubject && (
          <>
            <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
              {requestSubject.labelBg}:
            </Text>
            <View style={pdfStyles.requestBody}>
              <Text>{getFieldValue(values, requestSubject)}</Text>
            </View>
          </>
        )}

        {additionalExplanations && (
          <>
            <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
              {additionalExplanations.labelBg}:
            </Text>
            <Text style={pdfStyles.fillBoxLarge}>
              {getFieldValue(values, additionalExplanations)}
            </Text>
          </>
        )}

        {/* Attachments */}
        <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>Прилагам:</Text>
        {(() => {
          const items: { label: string; value: string }[] = [];
          if (ownership)
            items.push({
              label: ownership.labelBg,
              value: getFieldValue(values, ownership),
            });
          if (proxy) items.push({ label: proxy.labelBg, value: getFieldValue(values, proxy) });
          if (payment)
            items.push({ label: payment.labelBg, value: getFieldValue(values, payment) });
          if (otherDocs)
            items.push({
              label: otherDocs.labelBg,
              value: getFieldValue(values, otherDocs),
            });
          if (items.length === 0) {
            items.push(
              { label: "Документ за собственост / вещно право (копие)", value: "" },
              { label: "Платежно нареждане за платена такса", value: "" },
              { label: "Пълномощно (при подаване от пълномощник)", value: "" },
            );
          }
          return items.map((it, i) => (
            <View key={i} style={pdfStyles.numberedItem}>
              <Text style={pdfStyles.numberedIndex}>{i + 1}.</Text>
              <Text style={{ fontSize: 10, flex: 1 }}>{it.label}</Text>
              <Text style={[pdfStyles.fillLine, { width: 90, flex: 0 }]}>{it.value}</Text>
            </View>
          ));
        })()}

        {/* Footer — wrap={false} prevents the signature block from splitting
            across pages. Keeps GDPR paragraph inline with the signature so
            the whole closing block flows together. */}
        <View wrap={false}>
          <View style={pdfStyles.footer}>
            <View>
              <View style={pdfStyles.footerField}>
                <Text style={pdfStyles.label}>гр./с.</Text>
                <Text style={[pdfStyles.fillLine, { width: 120, flex: 0 }]}>
                  {getFieldValue(values, signaturePlace) || "София"}
                </Text>
              </View>
              <View style={[pdfStyles.footerField, { marginTop: 6 }]}>
                <Text style={pdfStyles.label}>Дата:</Text>
                <Text style={[pdfStyles.fillLine, { width: 120, flex: 0 }]}>
                  {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
                </Text>
              </View>
            </View>
            <View style={pdfStyles.footerField}>
              <Text style={pdfStyles.label}>Подпис:</Text>
              {signatureIsImage ? (
                <View style={pdfStyles.signatureBox}>
                  <Image src={signatureValue} style={pdfStyles.signatureImage} />
                </View>
              ) : (
                <View style={pdfStyles.signatureBox} />
              )}
            </View>
          </View>

          <Text style={pdfStyles.gdprFooter}>
            Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни, посочени в настоящото
            заявление, се обработват от Район Триадица за целите на предоставяне на заявената
            административна услуга. Данните се подават към deloviodstvo@triaditza.bg и се
            съхраняват съгласно сроковете в нормативната уредба.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
