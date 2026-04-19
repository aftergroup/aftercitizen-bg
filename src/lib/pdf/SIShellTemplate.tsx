/**
 * Shell for Строителство и инфраструктура (SI-*) services.
 *
 * Covers 17 SI blanks (SI-014 and SI-015 route to AAAddressTemplate
 * because they are the address-identity certificates that match
 * AA-001 / AA-002 one-to-one):
 *
 *   Group A — Construction permit         SI-001, 002, 003, 007
 *   Group B — Coordination (simple)       SI-004, 005, 010, 016, 022, 023
 *   Group C — Acceptance act (обр. 15)    SI-017
 *   Group D — Държавна приемателна        SI-018
 *   Group E — Case addendum               SI-019
 *   Group F — Project inventory           SI-020
 *   Group G — Заверен препис от документи SI-021
 *   Group H — Natural-person request      SI-012
 *
 * The applicant block (natural vs legal), property-location grid, and
 * signature footer are shared. Per-group bodies plug in the distinctive
 * middle section (category + project docs, period of temporary use,
 * building-permit references, document-to-copy description, …). The
 * signature block is wrapped with `wrap={false}` to prevent the A4
 * page-split bug that otherwise orphans the "Подпис" line on page 2.
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

/** Service-code metadata: title, addressee, which body renderer. */
const VARIANTS: Record<
  string,
  {
    title: string;
    addressee: "Главния архитект" | "Кмета";
    body: SIBodyKind;
    subtitle?: string;
  }
> = {
  "SI-001": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "construction",
    subtitle: "за издаване на разрешение за строеж на вътрешни инсталации",
  },
  "SI-002": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "construction",
    subtitle:
      "за издаване на разрешение за строеж на сградни инсталационни проекти (газови инсталации)",
  },
  "SI-003": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "construction",
    subtitle:
      "за издаване на разрешение за строеж за линейни инфраструктурни обекти",
  },
  "SI-004": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle: "за съгласуване на улични проводи (извън публична собственост)",
  },
  "SI-005": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle:
      "за съгласуване на проекти със съоръжения на техническата инфраструктура",
  },
  "SI-007": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "construction",
    subtitle:
      "за съгласуване и одобряване на проекти — преработка по чл. 154, ал. 5 от ЗУТ",
  },
  "SI-010": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Кмета",
    body: "coordination",
    subtitle:
      "за разрешение за временно ползване на части от тротоара, улични платна и свободни обществени площи",
  },
  "SI-012": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Кмета",
    body: "simple",
    subtitle: "за извършване на проверки по искане на етажна собственост",
  },
  "SI-016": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle:
      "за издаване на заповед за отклонения от общи мрежи и съоражения (чл. 193 от ЗУТ)",
  },
  "SI-017": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle:
      "за подписване на констативен акт обр. 15 за годност за приемане на строеж",
  },
  "SI-018": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "acceptance",
    subtitle: "за определяне на представител в държавна приемателна комисия",
  },
  "SI-019": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "addendum",
    subtitle: "за внасяне на допълнителни документи по преписка",
  },
  "SI-020": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "inventory",
    subtitle: "за опис на внесените проектни материали по преписка",
  },
  "SI-021": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "copy",
    subtitle: "за издаване на заверен препис (копие) от документи",
  },
  "SI-022": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle:
      "за констативен протокол за настилки и терени — след приключване на строеж",
  },
  "SI-023": {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект",
    body: "coordination",
    subtitle:
      "за констативен протокол за настилки и терени — преди издаване на разрешение за строеж",
  },
};

type SIBodyKind =
  | "construction"
  | "coordination"
  | "acceptance"
  | "addendum"
  | "inventory"
  | "copy"
  | "simple";

export default function SIShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";
  const variant = VARIANTS[serviceCode] ?? {
    title: "ЗАЯВЛЕНИЕ",
    addressee: "Главния архитект" as const,
    body: "coordination" as SIBodyKind,
    subtitle: serviceTitle,
  };

  const r = resolveApplicantFields(schema);

  // Applicant type — natural/legal entity switch
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
  const propertyCadastralId = findField(schema, "property_cadastral_id");
  const propertyStreet = findField(schema, "property_street");
  const propertyNumber = findField(schema, "property_number");
  const propertyRegion = findField(schema, "property_region");

  const requestSubject = findField(schema, "request_subject_description");

  // Construction-permit extras
  const constructionCategory = findField(schema, "construction_category");
  const preserveBuildingsFlag = findField(schema, "preserve_existing_buildings_flag");
  const investmentProjectDocs = findField(schema, "investment_project_documents");

  // Acceptance / комисия extras
  const buildingPermitNumber = findField(schema, "building_permit_number");
  const buildingPermitDate = findField(schema, "building_permit_date");
  const buildingPermitIssuer = findField(schema, "building_permit_issuer");

  // Addendum extras
  const existingCaseNumber = findField(schema, "existing_case_number");
  const additionalExplanations = findField(schema, "additional_explanations");

  // Document-copy extras
  const docToCopyDescription = findField(schema, "document_to_copy_description");
  const legalInterestJustification = findField(
    schema,
    "legal_interest_justification",
  );

  // Shared attachments (order matches the official blank)
  const attachmentsDescription = findField(schema, "attachments_description");
  const otherDocuments = findField(schema, "other_documents");
  const ownership =
    findField(schema, "ownership_actual_document") ??
    findField(schema, "ownership_document");
  const proxy = findField(schema, "power_of_attorney_notarized");
  const payment = findField(schema, "payment_order_document");

  // SI-012 is natural-person with current address only
  const currentAddress = findField(schema, "applicant_current_address");

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

  const showProperty =
    variant.body !== "addendum" && variant.body !== "simple" && variant.body !== "copy";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.addresseeBlock}>
          <Text style={pdfStyles.addresseeLine}>До</Text>
          <Text style={pdfStyles.addresseeFill}>{variant.addressee}</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={pdfStyles.addresseeFill}>Район Триадица</Text>
          <Text style={pdfStyles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={pdfStyles.title}>{variant.title}</Text>
        <Text style={pdfStyles.subtitle}>{variant.subtitle || serviceTitle}</Text>

        {/* Applicant */}
        {variant.body === "simple" ? (
          <SimpleApplicantBlock
            values={values}
            fullName={fullName}
            r={r}
            currentAddress={currentAddress}
          />
        ) : isLegalEntity ? (
          <LegalEntityApplicant
            values={values}
            fullName={fullName}
            legalName={legalName}
            legalEik={legalEik}
            r={r}
          />
        ) : (
          <NaturalPersonApplicant values={values} fullName={fullName} r={r} />
        )}

        {/* Property */}
        {showProperty && (
          <PropertyBlock
            values={values}
            upi={propertyUpi}
            kvartal={propertyKvartal}
            mestnost={propertyMestnost}
            region={propertyRegion}
            street={propertyStreet}
            number={propertyNumber}
            cadastralId={propertyCadastralId}
          />
        )}

        {/* Per-service body */}
        <Text style={pdfStyles.salutation}>
          {variant.addressee === "Кмета"
            ? "Уважаеми г-н/г-жо Кмет,"
            : "Уважаеми г-н/г-жо Главен архитект,"}
        </Text>

        {variant.body === "construction" && (
          <ConstructionBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
            category={constructionCategory}
            preserveFlag={preserveBuildingsFlag}
            permitNumber={serviceCode === "SI-007" ? buildingPermitNumber : undefined}
            permitDate={serviceCode === "SI-007" ? buildingPermitDate : undefined}
            investmentProjectDocs={investmentProjectDocs}
          />
        )}

        {variant.body === "coordination" && (
          <CoordinationBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "acceptance" && (
          <AcceptanceBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            permitIssuer={buildingPermitIssuer}
          />
        )}

        {variant.body === "addendum" && (
          <AddendumBody
            values={values}
            caseNumber={existingCaseNumber}
            explanations={additionalExplanations}
          />
        )}

        {variant.body === "inventory" && (
          <InventoryBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
            investmentProjectDocs={investmentProjectDocs}
          />
        )}

        {variant.body === "copy" && (
          <CopyBody
            values={values}
            docToCopyDescription={docToCopyDescription}
            legalInterestJustification={legalInterestJustification}
          />
        )}

        {variant.body === "simple" && (
          <SimpleBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {/* Attachments (shared across all bodies that carry attachment fields) */}
        <AttachmentsBlock
          values={values}
          attachmentsDescription={attachmentsDescription}
          otherDocuments={otherDocuments}
          ownership={ownership}
          proxy={proxy}
          payment={payment}
          investmentProjectDocs={
            variant.body === "construction" || variant.body === "inventory"
              ? investmentProjectDocs
              : undefined
          }
        />

        {/* Footer — wrap={false} prevents signature from splitting pages */}
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
            Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни, посочени в
            настоящото заявление, се обработват от Район Триадица за целите на
            предоставяне на заявената административна услуга. Данните се подават
            към deloviodstvo@triaditza.bg и се съхраняват съгласно сроковете в
            нормативната уредба.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Shared applicant blocks                                            */
/* ------------------------------------------------------------------ */

type ApplicantRefs = ReturnType<typeof resolveApplicantFields>;

function NaturalPersonApplicant({
  values,
  fullName,
  r,
}: {
  values: Record<string, string>;
  fullName: string;
  r: ApplicantRefs;
}) {
  return (
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
      {r.address && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{r.address.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>
      )}
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
    </>
  );
}

function LegalEntityApplicant({
  values,
  fullName,
  legalName,
  legalEik,
  r,
}: {
  values: Record<string, string>;
  fullName: string;
  legalName?: RenderedField;
  legalEik?: RenderedField;
  r: ApplicantRefs;
}) {
  return (
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
            <Text style={pdfStyles.label}>{r.egn.labelBg}:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {getFieldValue(values, r.egn)}
            </Text>
          </>
        )}
      </View>
      {r.address && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{r.address.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>
      )}
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
    </>
  );
}

function SimpleApplicantBlock({
  values,
  fullName,
  r,
  currentAddress,
}: {
  values: Record<string, string>;
  fullName: string;
  r: ApplicantRefs;
  currentAddress?: RenderedField;
}) {
  return (
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
      {currentAddress && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{currentAddress.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, currentAddress)}</Text>
        </View>
      )}
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared property block                                              */
/* ------------------------------------------------------------------ */

function PropertyBlock({
  values,
  upi,
  kvartal,
  mestnost,
  region,
  street,
  number,
  cadastralId,
}: {
  values: Record<string, string>;
  upi?: RenderedField;
  kvartal?: RenderedField;
  mestnost?: RenderedField;
  region?: RenderedField;
  street?: RenderedField;
  number?: RenderedField;
  cadastralId?: RenderedField;
}) {
  const cells: { label: string; field?: RenderedField; width?: number }[] = [
    { label: "УПИ", field: upi, width: 130 },
    { label: "кв.", field: kvartal, width: 80 },
    { label: "м-ст", field: mestnost, width: 150 },
    { label: "Район", field: region, width: 140 },
    { label: "ул.", field: street, width: 160 },
    { label: "№", field: number, width: 55 },
    { label: "Кад. ид.", field: cadastralId, width: 200 },
  ].filter((c) => c.field);
  if (cells.length === 0) return null;
  return (
    <>
      <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
        Местонахождение на обекта:
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
        {cells.map((c) => (
          <View
            key={c.label}
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, width: c.width }}
          >
            <Text style={pdfStyles.label}>{c.label}:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, c.field)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Per-service body subcomponents                                     */
/* ------------------------------------------------------------------ */

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={pdfStyles.checkbox}>
      {checked ? <View style={pdfStyles.checkboxFill} /> : null}
    </View>
  );
}

function ConstructionBody({
  values,
  requestSubject,
  serviceTitle,
  category,
  preserveFlag,
  permitNumber,
  permitDate,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  category?: RenderedField;
  preserveFlag?: RenderedField;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  investmentProjectDocs?: RenderedField;
}) {
  const preserveValue = String(values[preserveFlag?.code ?? ""] ?? "")
    .trim()
    .toLowerCase();
  const preserveChecked =
    preserveValue === "true" || preserveValue === "1" || preserveValue === "да";
  return (
    <>
      <Text style={pdfStyles.paragraph}>Моля, да ми бъде издадено разрешение за:</Text>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
      </View>

      {(category || permitNumber) && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          {category && (
            <>
              <Text style={pdfStyles.label}>{category.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, category)}
              </Text>
            </>
          )}
          {permitNumber && (
            <>
              <Text style={pdfStyles.label}>{permitNumber.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, permitNumber)}
              </Text>
            </>
          )}
          {permitDate && (
            <>
              <Text style={pdfStyles.label}>{permitDate.labelBg}:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {formatBgDate(getFieldValue(values, permitDate))}
              </Text>
            </>
          )}
        </View>
      )}

      {preserveFlag && (
        <View style={{ flexDirection: "row", gap: 4, marginTop: 6, alignItems: "center" }}>
          <Checkbox checked={preserveChecked} />
          <Text style={{ fontSize: 10 }}>{preserveFlag.labelBg}</Text>
        </View>
      )}
    </>
  );
}

function CoordinationBody({
  values,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>Моля, да бъде извършено:</Text>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
      </View>
    </>
  );
}

function AcceptanceBody({
  values,
  requestSubject,
  serviceTitle,
  permitNumber,
  permitDate,
  permitIssuer,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  permitIssuer?: RenderedField;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>
        Моля, да бъде определен представител в държавната приемателна комисия за обекта,
        за който е издадено следното разрешение за строеж:
      </Text>
      <View style={pdfStyles.row}>
        {permitNumber && (
          <>
            <Text style={pdfStyles.label}>{permitNumber.labelBg}:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {getFieldValue(values, permitNumber)}
            </Text>
          </>
        )}
        {permitDate && (
          <>
            <Text style={pdfStyles.label}>{permitDate.labelBg}:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, permitDate))}
            </Text>
          </>
        )}
      </View>
      {permitIssuer && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{permitIssuer.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, permitIssuer)}</Text>
        </View>
      )}
      {requestSubject && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{requestSubject.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, requestSubject) || serviceTitle}
          </Text>
        </View>
      )}
    </>
  );
}

function AddendumBody({
  values,
  caseNumber,
  explanations,
}: {
  values: Record<string, string>;
  caseNumber?: RenderedField;
  explanations?: RenderedField;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>
        Моля, да бъдат приобщени следните допълнителни документи към:
      </Text>
      {caseNumber && (
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>{caseNumber.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, caseNumber)}</Text>
        </View>
      )}
      {explanations && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {explanations.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, explanations)}</Text>
          </View>
        </>
      )}
    </>
  );
}

function InventoryBody({
  values,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  investmentProjectDocs?: RenderedField;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>Моля, да бъде изготвен опис на внесените проектни материали:</Text>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
      </View>
    </>
  );
}

function CopyBody({
  values,
  docToCopyDescription,
  legalInterestJustification,
}: {
  values: Record<string, string>;
  docToCopyDescription?: RenderedField;
  legalInterestJustification?: RenderedField;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>Моля, да ми бъде издаден заверен препис от:</Text>
      {docToCopyDescription && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {docToCopyDescription.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, docToCopyDescription)}</Text>
          </View>
        </>
      )}
      {legalInterestJustification && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {legalInterestJustification.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, legalInterestJustification)}</Text>
          </View>
        </>
      )}
    </>
  );
}

function SimpleBody({
  values,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>Моля, да бъде извършена следната проверка:</Text>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared attachments block                                           */
/* ------------------------------------------------------------------ */

function AttachmentsBlock({
  values,
  attachmentsDescription,
  otherDocuments,
  ownership,
  proxy,
  payment,
  investmentProjectDocs,
}: {
  values: Record<string, string>;
  attachmentsDescription?: RenderedField;
  otherDocuments?: RenderedField;
  ownership?: RenderedField;
  proxy?: RenderedField;
  payment?: RenderedField;
  investmentProjectDocs?: RenderedField;
}) {
  const items: { label: string; value: string }[] = [];
  if (ownership)
    items.push({ label: ownership.labelBg, value: getFieldValue(values, ownership) });
  if (investmentProjectDocs)
    items.push({
      label: investmentProjectDocs.labelBg,
      value: getFieldValue(values, investmentProjectDocs),
    });
  if (payment)
    items.push({ label: payment.labelBg, value: getFieldValue(values, payment) });
  if (proxy) items.push({ label: proxy.labelBg, value: getFieldValue(values, proxy) });
  if (otherDocuments)
    items.push({
      label: otherDocuments.labelBg,
      value: getFieldValue(values, otherDocuments),
    });

  if (items.length === 0 && !attachmentsDescription) return null;

  return (
    <>
      <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
        Прилагам следните документи:
      </Text>
      {attachmentsDescription && (
        <View style={[pdfStyles.row, { marginBottom: 4 }]}>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, attachmentsDescription)}
          </Text>
        </View>
      )}
      {items.map((it, i) => (
        <View key={i} style={pdfStyles.numberedItem}>
          <Text style={pdfStyles.numberedIndex}>{i + 1}.</Text>
          <Text style={{ fontSize: 10, flex: 1 }}>{it.label}</Text>
          <Text style={[pdfStyles.fillLine, { width: 90, flex: 0 }]}>{it.value}</Text>
        </View>
      ))}
    </>
  );
}
