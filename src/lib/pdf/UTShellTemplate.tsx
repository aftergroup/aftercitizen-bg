/**
 * Shell for Устройство на територията (UT-*) services — 43 blanks.
 *
 * Groups by distinctive middle-section content:
 *
 *   permit      — Разрешение за строеж / презаверка
 *                 UT-001, 007, 008, 009, 010, 011-1/2/3, 027
 *   visa        — Виза за проектиране
 *                 UT-002, 003
 *   pup         — Подробен устройствен план (approval / allowance / amendment)
 *                 UT-004, 013, 021
 *   delba       — Проект за делба по чл. 202–203 ЗУТ
 *                 UT-005-1, 005-2
 *   tech_passport — Технически паспорт
 *                 UT-014-1, 014-2
 *   order_book  — Заповедна книга
 *                 UT-015-1, 015-2
 *   ekzekutivi  — Екзекутивна документация
 *                 UT-016
 *   copy        — Заверен препис / копие
 *                 UT-017, 018, 022
 *   certificate — Удостоверение (various: ППЗСПЗЗ, градоустр. статут,
 *                 идентичност, груб строеж, премахната сграда, освидет.,
 *                 общ характер)
 *                 UT-019, 020, 023, 024, 028, 038, 039, 042, 043
 *   moveable    — Преместваеми обекти, реклами, съоръжения към ТО
 *                 UT-031, 032, 033, 035
 *   addendum    — Внасяне на допълнителни документи
 *                 UT-034
 *   notification — Уведомление по чл. 197 ЗУТ
 *                 UT-036
 *   consent     — Съгласие за анкетиране при изкопни работи
 *                 UT-037
 *   bypass      — Отклонения през чужд поземлен имот (чл. 190, 192, 193 ЗУТ)
 *                 UT-025, 026, 040, 041
 *   investment_redraw — Заснемане на изпълнен строеж (чл. 145, ал. 5 ЗУТ)
 *                 UT-044
 *
 * Applicant (natural vs legal), property grid, attachment block and
 * signature footer are shared. Signature is wrapped with wrap={false}
 * to prevent the A4 page-split bug.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedField, RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { findField, getMunicipality, pdfStyles, resolveApplicantFields } from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

type UTBodyKind =
  | "permit"
  | "visa"
  | "pup"
  | "delba"
  | "tech_passport"
  | "order_book"
  | "ekzekutivi"
  | "copy"
  | "certificate"
  | "moveable"
  | "addendum"
  | "notification"
  | "consent"
  | "bypass"
  | "condemn"
  | "investment_redraw";

type Addressee = "Главния архитект" | "Кмета";

interface Variant {
  title: string;
  subtitle?: string;
  addressee: Addressee;
  body: UTBodyKind;
}

const VARIANTS: Record<string, Variant> = {
  "UT-001": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за откриване на строителна площадка и определяне на строителна линия и ниво",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-002": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на виза за проектиране",
    addressee: "Главния архитект",
    body: "visa",
  },
  "UT-003": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на виза за проектиране по чл. 140, ал. 3 от ЗУТ",
    addressee: "Главния архитект",
    body: "visa",
  },
  "UT-004": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за одобряване на проект за подробен устройствен план",
    addressee: "Главния архитект",
    body: "pup",
  },
  "UT-005-1": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на проект за делба по чл. 202 и чл. 203 от ЗУТ",
    addressee: "Главния архитект",
    body: "delba",
  },
  "UT-005-2": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на проект за делба по чл. 202 и чл. 203 от ЗУТ (допълнителен документ)",
    addressee: "Главния архитект",
    body: "delba",
  },
  "UT-007": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на разрешение за строеж (чл. 147 и чл. 148 от ЗУТ)",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-008": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на разрешение за строеж за основно застрояване, пристрояване и надстрояване на жилищни и нежилищни сгради",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-009": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на разрешение за строеж за огради",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-010": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за съгласуване и/или одобряване на инвестиционен проект (чл. 141–145 от ЗУТ)",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-011-1": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за съгласуване и одобряване на проект за изменение на инвестиционен проект (чл. 154, ал. 5 ЗУТ)",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-011-2": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за съгласуване и одобряване на проект за изменение на инвестиционен проект (чл. 154, ал. 5 ЗУТ) — допълнителен документ",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-011-3": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за съгласуване и одобряване на проект за изменение на инвестиционен проект (чл. 154, ал. 5 ЗУТ) — допълнителен документ 3",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-013": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за даване на разрешение за изработването на проект за подробен устройствен план",
    addressee: "Главния архитект",
    body: "pup",
  },
  "UT-014-1": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за вписване в регистъра на технически паспорт на строеж",
    addressee: "Главния архитект",
    body: "tech_passport",
  },
  "UT-014-2": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за вписване в регистъра на технически паспорт на строеж (допълнителен документ)",
    addressee: "Главния архитект",
    body: "tech_passport",
  },
  "UT-015-1": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за заверка на заповедна книга (чл. 158, ал. 2 от ЗУТ)",
    addressee: "Главния архитект",
    body: "order_book",
  },
  "UT-015-2": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за заверка на заповедна книга (чл. 158, ал. 2 от ЗУТ) — допълнителен документ",
    addressee: "Главния архитект",
    body: "order_book",
  },
  "UT-016": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за заверка на екзекутивна документация",
    addressee: "Главния архитект",
    body: "ekzekutivi",
  },
  "UT-017": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за заверяване на преписи от документи и на копия от планове и документацията към тях",
    addressee: "Главния архитект",
    body: "copy",
  },
  "UT-018": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на заверен препис (копия) от документи",
    addressee: "Главния архитект",
    body: "copy",
  },
  "UT-019": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на удостоверение за възстановяване правото на собственост (чл. 13 ППЗСПЗЗ)",
    // Blank addresses Главния архитект на район „Триадица“ despite the
    // service being land-restitution (verified against pdf/UT-019.pdf).
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-020": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на удостоверение и скица по чл. 13, ал. 5 и 6 от ППЗСПЗЗ",
    addressee: "Кмета",
    body: "certificate",
  },
  "UT-021": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за допускане изменение на план за регулация и застрояване",
    addressee: "Главния архитект",
    body: "pup",
  },
  "UT-022": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на заверено копие от подробен устройствен план",
    addressee: "Главния архитект",
    body: "copy",
  },
  "UT-023": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на удостоверение за градоустройствен статут на УПИ",
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-024": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на удостоверение за идентичност на имоти по регулационни планове",
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-025": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за разрешение за прокарване на временен път",
    // Blank addresses Главния архитект (verified against pdf/UT-025.pdf);
    // UT-026 is the sibling form that goes to Кмета.
    addressee: "Главния архитект",
    body: "bypass",
  },
  "UT-026": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на заповед за прокарване на временен път за осигуряване на достъп до поземлен имот (чл. 190 от ЗУТ)",
    addressee: "Кмета",
    body: "bypass",
  },
  "UT-027": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за презаверяване на издадено разрешение за строеж (чл. 153, ал. 3 от ЗУТ)",
    addressee: "Главния архитект",
    body: "permit",
  },
  "UT-028": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за извършване на проверка за установяване на съответствие на строеж с издадените строителни книжа",
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-031": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за регистриране на преместваем обект или рекламен елемент и издаване на удостоверение за въвеждане в експлоатация",
    addressee: "Главния архитект",
    body: "moveable",
  },
  "UT-032": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на схема за поставяне на преместваеми обекти, реклами и елементи на градското обзавеждане",
    addressee: "Главния архитект",
    body: "moveable",
  },
  "UT-033": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на инвестиционни проекти и издаване на разрешение за поставяне на преместваеми обекти и реклами",
    addressee: "Главния архитект",
    body: "moveable",
  },
  "UT-034": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за внасяне на допълнителни документи",
    addressee: "Главния архитект",
    body: "addendum",
  },
  "UT-035": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на схема за разполагане на съоръжения към съществуващ търговски обект",
    addressee: "Главния архитект",
    body: "moveable",
  },
  "UT-036": {
    title: "УВЕДОМЛЕНИЕ",
    subtitle: "по чл. 197 от ЗУТ",
    addressee: "Кмета",
    body: "notification",
  },
  "UT-037": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за даване на съгласие за допускане на анкетиране при изкопни работи към общински имоти",
    addressee: "Кмета",
    body: "consent",
  },
  "UT-038": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на удостоверение от общ характер",
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-039": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на удостоверение за премахната сграда",
    addressee: "Кмета",
    body: "certificate",
  },
  "UT-040": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на заповед за отклонения от общи мрежи и съоръжения на техническата инфраструктура през чужд поземлен имот (чл. 193 от ЗУТ)",
    addressee: "Кмета",
    body: "bypass",
  },
  "UT-041": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на заповед за преминаване през чужд поземлен имот (чл. 192 от ЗУТ)",
    addressee: "Кмета",
    body: "bypass",
  },
  "UT-042": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle: "за освидетелстване на сграда",
    // Blank addresses Кмета and has a distinctive inspection-commission
    // body (verified against pdf/UT-042.pdf).
    addressee: "Кмета",
    body: "condemn",
  },
  "UT-043": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за издаване на удостоверение за „груб строеж“ (чл. 181 от ЗУТ) — констативен протокол",
    addressee: "Главния архитект",
    body: "certificate",
  },
  "UT-044": {
    title: "ЗАЯВЛЕНИЕ",
    subtitle:
      "за одобряване на проект — заснемане на изпълнен строеж за възстановяване на изгубен инвестиционен проект (чл. 145, ал. 5 ЗУТ)",
    addressee: "Главния архитект",
    body: "investment_redraw",
  },
};

const FALLBACK: Variant = {
  title: "ЗАЯВЛЕНИЕ",
  addressee: "Главния архитект",
  body: "certificate",
};

export default function UTShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const serviceTitle =
    service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";
  const variant = VARIANTS[serviceCode] ?? FALLBACK;

  // Applicant (natural + legal)
  const r = resolveApplicantFields(schema);
  const legalName = findField(schema, "legal_entity_name");
  const legalEik = findField(schema, "legal_entity_eik");
  const applicantType = findField(schema, "applicant_type");
  const applicantTypeValue = String(
    applicantType ? values[applicantType.code] ?? "" : "",
  ).toLowerCase();
  const isLegalEntity =
    (legalName && !!values[legalName.code]) ||
    applicantTypeValue.includes("юрид") ||
    applicantTypeValue.includes("legal");

  // Property location
  const propertyUpi = findField(schema, "property_upi");
  const propertyKvartal = findField(schema, "property_kvartal");
  const propertyMestnost = findField(schema, "property_mestnost");
  const propertyRegion = findField(schema, "property_region");
  const propertyStreet = findField(schema, "property_street");
  const propertyNumber = findField(schema, "property_number");
  const propertyCadastralId = findField(schema, "property_cadastral_identifier");

  // Generic request body + service specifics
  const requestSubject =
    findField(schema, "request_subject") ??
    findField(schema, "service_request_description") ??
    findField(schema, "request_description");

  // Permit extras
  const buildingPermitNumber =
    findField(schema, "building_permit_number") ??
    findField(schema, "existing_permit_number");
  const buildingPermitDate =
    findField(schema, "building_permit_date") ??
    findField(schema, "existing_permit_date");
  const buildingPermitIssuer = findField(schema, "building_permit_issuer");
  const constructionCategory = findField(schema, "construction_category");
  const preserveFlag = findField(schema, "preserve_existing_buildings");
  const investmentProjectDocs = findField(schema, "investment_project_documents");

  // PUP extras
  const pupScope =
    findField(schema, "pup_scope") ?? findField(schema, "pup_area_description");
  const pupPurpose = findField(schema, "pup_purpose");

  // Visa extras
  const visaPurpose =
    findField(schema, "design_visa_purpose") ??
    findField(schema, "visa_purpose");

  // Technical passport / order book / condemn
  const buildingDescription =
    findField(schema, "building_description") ??
    findField(schema, "building_name");
  const buildingOwner =
    findField(schema, "building_owner") ??
    findField(schema, "building_owners");

  // Copy extras
  const docToCopyDescription =
    findField(schema, "document_to_copy_description") ??
    findField(schema, "document_description");
  const legalInterestJustification = findField(
    schema,
    "legal_interest_justification",
  );

  // Certificate extras
  const certificatePurpose =
    findField(schema, "certificate_purpose") ??
    findField(schema, "purpose_of_use");

  // Moveable object extras
  const moveableObjectType =
    findField(schema, "moveable_object_type") ??
    findField(schema, "object_type");
  const moveableObjectLocation =
    findField(schema, "moveable_object_location") ??
    findField(schema, "placement_location");

  // Addendum
  const existingCaseNumber = findField(schema, "existing_case_number");
  const additionalExplanations = findField(schema, "additional_explanations");

  // Bypass / utility
  const bypassRoute =
    findField(schema, "bypass_route_description") ??
    findField(schema, "utility_route_description");
  const affectedPropertyOwner =
    findField(schema, "affected_property_owner") ??
    findField(schema, "adjacent_property_owner");

  // Notification (чл. 197)
  const demolitionDescription =
    findField(schema, "demolition_description") ??
    findField(schema, "notification_subject");

  // Consent (чл. 197 anketirane)
  const excavationDescription =
    findField(schema, "excavation_description") ??
    findField(schema, "works_description");

  // Shared attachments
  const attachmentsDescription = findField(schema, "attachments_description");
  const otherDocuments = findField(schema, "other_documents");
  const ownership =
    findField(schema, "ownership_actual_document") ??
    findField(schema, "ownership_document");
  const proxy = findField(schema, "power_of_attorney_notarized");
  const payment = findField(schema, "payment_order_document");

  // Signature
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

  // Property is not meaningful for addendum / notification without context
  const showProperty = variant.body !== "addendum";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.addresseeBlock}>
          <Text style={pdfStyles.addresseeLine}>До</Text>
          <Text style={pdfStyles.addresseeFill}>{variant.addressee}</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={pdfStyles.addresseeFill}>{getMunicipality(schema).nameBg}</Text>
          <Text style={pdfStyles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={pdfStyles.title}>{variant.title}</Text>
        {variant.subtitle && (
          <Text style={pdfStyles.subtitle}>{variant.subtitle}</Text>
        )}

        {/* Applicant */}
        {isLegalEntity ? (
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

        <Text style={pdfStyles.salutation}>
          {variant.addressee === "Кмета"
            ? "Уважаеми г-н/г-жо Кмет,"
            : "Уважаеми г-н/г-жо Главен архитект,"}
        </Text>

        {/* Per-service body */}
        {variant.body === "permit" && (
          <PermitBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
            category={constructionCategory}
            preserveFlag={preserveFlag}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            permitIssuer={buildingPermitIssuer}
            isPresaverka={serviceCode === "UT-027"}
          />
        )}

        {variant.body === "visa" && (
          <VisaBody
            values={values}
            visaPurpose={visaPurpose}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "pup" && (
          <PupBody
            values={values}
            pupScope={pupScope}
            pupPurpose={pupPurpose}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "delba" && (
          <DelbaBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "tech_passport" && (
          <TechPassportBody
            values={values}
            buildingDescription={buildingDescription}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "order_book" && (
          <OrderBookBody
            values={values}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            buildingDescription={buildingDescription}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "ekzekutivi" && (
          <EkzekutiviBody
            values={values}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "copy" && (
          <CopyBody
            values={values}
            docToCopyDescription={docToCopyDescription}
            legalInterestJustification={legalInterestJustification}
          />
        )}

        {variant.body === "certificate" && (
          <CertificateBody
            values={values}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
            certificatePurpose={certificatePurpose}
          />
        )}

        {variant.body === "moveable" && (
          <MoveableBody
            values={values}
            moveableObjectType={moveableObjectType}
            moveableObjectLocation={moveableObjectLocation}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "addendum" && (
          <AddendumBody
            values={values}
            caseNumber={existingCaseNumber}
            explanations={additionalExplanations}
          />
        )}

        {variant.body === "notification" && (
          <NotificationBody
            values={values}
            demolitionDescription={demolitionDescription}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "consent" && (
          <ConsentBody
            values={values}
            excavationDescription={excavationDescription}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "bypass" && (
          <BypassBody
            values={values}
            bypassRoute={bypassRoute}
            affectedPropertyOwner={affectedPropertyOwner}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {variant.body === "condemn" && (
          <CondemnBody
            values={values}
            buildingDescription={buildingDescription}
            buildingOwner={buildingOwner}
          />
        )}

        {variant.body === "investment_redraw" && (
          <InvestmentRedrawBody
            values={values}
            buildingDescription={buildingDescription}
            permitNumber={buildingPermitNumber}
            permitDate={buildingPermitDate}
            requestSubject={requestSubject}
            serviceTitle={serviceTitle}
          />
        )}

        {/* Shared attachments */}
        <AttachmentsBlock
          values={values}
          attachmentsDescription={attachmentsDescription}
          otherDocuments={otherDocuments}
          ownership={ownership}
          proxy={proxy}
          payment={payment}
          investmentProjectDocs={
            variant.body === "permit" ||
            variant.body === "pup" ||
            variant.body === "investment_redraw" ||
            variant.body === "moveable"
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
                  {formatBgDate(getFieldValue(values, signatureDate)) ||
                    todaysDateBg}
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
            Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни,
            посочени в настоящото заявление, се обработват от {getMunicipality(schema).nameBg}
            за целите на предоставяне на заявената административна услуга.
            Данните се подават към {getMunicipality(schema).email} и се съхраняват
            съгласно сроковете в нормативната уредба.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Applicant blocks                                                   */
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
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, r.address)}
          </Text>
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
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, r.address)}
          </Text>
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
/* Property block                                                     */
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
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 6,
        }}
      >
        {cells.map((c) => (
          <View
            key={c.label}
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 4,
              width: c.width,
            }}
          >
            <Text style={pdfStyles.label}>{c.label}:</Text>
            <Text style={pdfStyles.fillLine}>
              {getFieldValue(values, c.field)}
            </Text>
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

function RequestLine({
  values,
  requestSubject,
  serviceTitle,
  leadText,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  leadText: string;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>{leadText}</Text>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
      </View>
    </>
  );
}

function PermitBody({
  values,
  requestSubject,
  serviceTitle,
  category,
  preserveFlag,
  permitNumber,
  permitDate,
  permitIssuer,
  isPresaverka,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  category?: RenderedField;
  preserveFlag?: RenderedField;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  permitIssuer?: RenderedField;
  isPresaverka?: boolean;
}) {
  const preserveValue = String(values[preserveFlag?.code ?? ""] ?? "")
    .trim()
    .toLowerCase();
  const preserveChecked =
    preserveValue === "true" || preserveValue === "1" || preserveValue === "да";

  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText={
          isPresaverka
            ? "Моля, да бъде презаверено следното разрешение за строеж:"
            : "Моля, да ми бъде издадено разрешение за:"
        }
      />

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

      {permitIssuer && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{permitIssuer.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, permitIssuer)}
          </Text>
        </View>
      )}

      {preserveFlag && (
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            marginTop: 6,
            alignItems: "center",
          }}
        >
          <Checkbox checked={preserveChecked} />
          <Text style={{ fontSize: 10 }}>{preserveFlag.labelBg}</Text>
        </View>
      )}
    </>
  );
}

function VisaBody({
  values,
  visaPurpose,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  visaPurpose?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да ми бъде издадена виза за проектиране за:"
      />
      {visaPurpose && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{visaPurpose.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, visaPurpose)}
          </Text>
        </View>
      )}
    </>
  );
}

function PupBody({
  values,
  pupScope,
  pupPurpose,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  pupScope?: RenderedField;
  pupPurpose?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, за следния подробен устройствен план:"
      />
      {pupScope && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {pupScope.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, pupScope)}</Text>
          </View>
        </>
      )}
      {pupPurpose && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{pupPurpose.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, pupPurpose)}
          </Text>
        </View>
      )}
    </>
  );
}

function DelbaBody({
  values,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <RequestLine
      values={values}
      requestSubject={requestSubject}
      serviceTitle={serviceTitle}
      leadText="Моля, да бъде одобрен следният проект за делба по чл. 202 / чл. 203 от ЗУТ:"
    />
  );
}

function TechPassportBody({
  values,
  buildingDescription,
  permitNumber,
  permitDate,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  buildingDescription?: RenderedField;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да бъде вписан в регистъра следният технически паспорт:"
      />
      {buildingDescription && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{buildingDescription.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, buildingDescription)}
          </Text>
        </View>
      )}
      {(permitNumber || permitDate) && (
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
      )}
    </>
  );
}

function OrderBookBody({
  values,
  permitNumber,
  permitDate,
  buildingDescription,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  buildingDescription?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да бъде заверена заповедна книга за следния строеж:"
      />
      {buildingDescription && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{buildingDescription.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, buildingDescription)}
          </Text>
        </View>
      )}
      {(permitNumber || permitDate) && (
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
      )}
    </>
  );
}

function EkzekutiviBody({
  values,
  permitNumber,
  permitDate,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да бъде заверена екзекутивна документация на следния строеж:"
      />
      {(permitNumber || permitDate) && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
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
      <Text style={pdfStyles.paragraph}>
        Моля, да ми бъде издаден заверен препис (копие) от:
      </Text>
      {docToCopyDescription ? (
        <View style={pdfStyles.requestBody}>
          <Text>{getFieldValue(values, docToCopyDescription)}</Text>
        </View>
      ) : (
        <View style={pdfStyles.requestBody}>
          <Text> </Text>
        </View>
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

function CertificateBody({
  values,
  requestSubject,
  serviceTitle,
  certificatePurpose,
}: {
  values: Record<string, string>;
  requestSubject?: RenderedField;
  serviceTitle: string;
  certificatePurpose?: RenderedField;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да ми бъде издадено удостоверение за:"
      />
      {certificatePurpose && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{certificatePurpose.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, certificatePurpose)}
          </Text>
        </View>
      )}
    </>
  );
}

function MoveableBody({
  values,
  moveableObjectType,
  moveableObjectLocation,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  moveableObjectType?: RenderedField;
  moveableObjectLocation?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да бъде одобрено/издадено за следния преместваем обект:"
      />
      {moveableObjectType && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{moveableObjectType.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, moveableObjectType)}
          </Text>
        </View>
      )}
      {moveableObjectLocation && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{moveableObjectLocation.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, moveableObjectLocation)}
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
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, caseNumber)}
          </Text>
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

function NotificationBody({
  values,
  demolitionDescription,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  demolitionDescription?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>
        С настоящото уведомявам по реда на чл. 197 от ЗУТ за следното:
      </Text>
      <View style={pdfStyles.requestBody}>
        <Text>
          {getFieldValue(values, demolitionDescription) ||
            getFieldValue(values, requestSubject) ||
            serviceTitle}
        </Text>
      </View>
    </>
  );
}

function ConsentBody({
  values,
  excavationDescription,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  excavationDescription?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>
        Моля, за даване на съгласие за допускане на анкетиране при
        следните изкопни работи към общински имоти:
      </Text>
      <View style={pdfStyles.requestBody}>
        <Text>
          {getFieldValue(values, excavationDescription) ||
            getFieldValue(values, requestSubject) ||
            serviceTitle}
        </Text>
      </View>
    </>
  );
}

function BypassBody({
  values,
  bypassRoute,
  affectedPropertyOwner,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  bypassRoute?: RenderedField;
  affectedPropertyOwner?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да ми бъде издадена заповед за:"
      />
      {bypassRoute && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {bypassRoute.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, bypassRoute)}</Text>
          </View>
        </>
      )}
      {affectedPropertyOwner && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{affectedPropertyOwner.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, affectedPropertyOwner)}
          </Text>
        </View>
      )}
    </>
  );
}

function CondemnBody({
  values,
  buildingDescription,
  buildingOwner,
}: {
  values: Record<string, string>;
  buildingDescription?: RenderedField;
  buildingOwner?: RenderedField;
}) {
  return (
    <>
      <Text style={pdfStyles.paragraph}>
        Моля, да бъде извършен оглед на сграда (постройка) от комисия за
        освидетелствуването ѝ като самосрутваща се (вредна в
        санитарно-хигиенно отношение).
      </Text>
      {buildingDescription && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{buildingDescription.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, buildingDescription)}
          </Text>
        </View>
      )}
      {buildingOwner && (
        <>
          <Text style={[pdfStyles.label, pdfStyles.sectionHeader]}>
            {buildingOwner.labelBg}:
          </Text>
          <View style={pdfStyles.requestBody}>
            <Text>{getFieldValue(values, buildingOwner)}</Text>
          </View>
          <Text style={pdfStyles.helper}>
            (описват се всички собственици на сградата)
          </Text>
        </>
      )}
    </>
  );
}

function InvestmentRedrawBody({
  values,
  buildingDescription,
  permitNumber,
  permitDate,
  requestSubject,
  serviceTitle,
}: {
  values: Record<string, string>;
  buildingDescription?: RenderedField;
  permitNumber?: RenderedField;
  permitDate?: RenderedField;
  requestSubject?: RenderedField;
  serviceTitle: string;
}) {
  return (
    <>
      <RequestLine
        values={values}
        requestSubject={requestSubject}
        serviceTitle={serviceTitle}
        leadText="Моля, да бъде одобрен проект — заснемане на изпълнен строеж за възстановяване на изгубен инвестиционен проект (чл. 145, ал. 5 ЗУТ):"
      />
      {buildingDescription && (
        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>{buildingDescription.labelBg}:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, buildingDescription)}
          </Text>
        </View>
      )}
      {(permitNumber || permitDate) && (
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
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Attachments block                                                  */
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
    items.push({
      label: ownership.labelBg,
      value: getFieldValue(values, ownership),
    });
  if (investmentProjectDocs)
    items.push({
      label: investmentProjectDocs.labelBg,
      value: getFieldValue(values, investmentProjectDocs),
    });
  if (payment)
    items.push({
      label: payment.labelBg,
      value: getFieldValue(values, payment),
    });
  if (proxy)
    items.push({ label: proxy.labelBg, value: getFieldValue(values, proxy) });
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
          <Text style={[pdfStyles.fillLine, { width: 90, flex: 0 }]}>
            {it.value}
          </Text>
        </View>
      ))}
    </>
  );
}
