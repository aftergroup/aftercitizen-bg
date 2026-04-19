/**
 * Printable PDF for the RA-UT-SHELL universal construction-services form.
 *
 * Used by 33 forms (SI-001..022, UT-002..044) — all services of отдел
 * „Устройство на територията". The shell is intentionally generic:
 *
 *   - Addressee: "До Главния архитект на Район Триадица".
 *   - Title: "ЗАЯВЛЕНИЕ" with the per-form service title as subtitle.
 *   - Applicant block "От 1" with optional co-applicants "От 2", "От 3"
 *     (rendered only when applicant_2_x / applicant_3_x fields exist on the form).
 *   - Property location block (УПИ, кв., местност, район, улица, №,
 *     кадастрален идентификатор) — each cell rendered only when its field
 *     is part of the form schema.
 *   - Free-text request subject (request_subject_description) fed from the
 *     submission, falling back to the service title.
 *   - Attachments iterated dynamically from the "attachments" section of
 *     the schema, so per-form overrides in Baserow (each RA-UT form carries
 *     its own required attachment list) render automatically.
 *   - Signature footer + GDPR footer.
 */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { RenderedForm, RenderedField } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import { getMunicipality } from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.45,
    color: "#111",
  },
  addresseeBlock: { alignSelf: "flex-end", width: 300, marginBottom: 18 },
  addresseeLine: { fontWeight: 700, fontSize: 11 },
  addresseeFill: {
    borderBottom: "1pt dotted #555",
    marginTop: 2,
    marginBottom: 2,
    height: 13,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  caption: { fontSize: 8, color: "#555", textAlign: "center" },
  title: { textAlign: "center", fontSize: 16, fontWeight: 700, marginTop: 6 },
  subtitle: {
    textAlign: "center",
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 14,
  },
  row: { flexDirection: "row", gap: 6, alignItems: "flex-end", marginBottom: 6 },
  label: { fontSize: 10 },
  fillLine: {
    flex: 1,
    borderBottom: "1pt dotted #333",
    minHeight: 13,
    paddingHorizontal: 4,
  },
  sectionHeader: { marginTop: 10, marginBottom: 4, fontWeight: 700 },
  helper: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
    marginTop: -2,
    marginBottom: 4,
  },
  applicantHeader: {
    marginTop: 6,
    marginBottom: 2,
    fontWeight: 700,
    fontSize: 10.5,
  },
  cellGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  cell: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  salutation: { fontWeight: 700, marginTop: 10, marginBottom: 2 },
  paragraph: { marginBottom: 4 },
  requestBody: {
    minHeight: 60,
    borderBottom: "1pt dotted #333",
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 10,
  },
  numberedItem: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  numberedIndex: { width: 16, fontSize: 10 },
  attachmentLabel: { fontSize: 10, flex: 1 },
  attachmentValue: {
    width: 80,
    borderBottom: "1pt dotted #333",
    minHeight: 13,
    paddingHorizontal: 4,
    fontSize: 9.5,
  },
  footer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  footerField: {
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-end",
    minWidth: 160,
  },
  signatureBox: {
    width: 160,
    height: 48,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "solid",
    backgroundColor: "#fff",
    padding: 2,
  },
  signatureImage: { width: "100%", height: "100%", objectFit: "contain" },
  gdprFooter: { marginTop: 24, fontSize: 8, color: "#444", lineHeight: 1.35 },
});

function findField(schema: RenderedForm, code: string): RenderedField | undefined {
  for (const s of schema.sections) {
    const f = s.fields.find((x) => x.code === code);
    if (f) return f;
  }
  return undefined;
}

function findSection(schema: RenderedForm, code: string) {
  return schema.sections.find((s) => s.code === code);
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 9,
        height: 9,
        borderWidth: 1,
        borderColor: "#333",
        padding: 1.2,
      }}
    >
      {checked ? <View style={{ flex: 1, backgroundColor: "#111" }} /> : null}
    </View>
  );
}

function formatBoolean(raw: string | undefined): string {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "true" || v === "1" || v === "да" || v === "yes") return "да";
  if (v === "false" || v === "0" || v === "не" || v === "no") return "не";
  return raw ?? "";
}

function ApplicantBlock({
  label,
  helper,
  fullName,
  egn,
  egnLabel,
  address,
  addressLabel,
  phone,
  phoneLabel,
  email,
  emailLabel,
}: {
  label: string;
  helper?: string;
  fullName: string;
  egn?: string;
  egnLabel?: string;
  address?: string;
  addressLabel?: string;
  phone?: string;
  phoneLabel?: string;
  email?: string;
  emailLabel?: string;
}) {
  return (
    <View>
      <Text style={styles.applicantHeader}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Име:</Text>
        <Text style={[styles.fillLine, { flex: 2.5 }]}>{fullName}</Text>
        {egnLabel && (
          <>
            <Text style={styles.label}>{egnLabel}:</Text>
            <Text style={[styles.fillLine, { flex: 1 }]}>{egn ?? ""}</Text>
          </>
        )}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      {addressLabel && (
        <View style={styles.row}>
          <Text style={styles.label}>{addressLabel}:</Text>
          <Text style={styles.fillLine}>{address ?? ""}</Text>
        </View>
      )}
      {(phoneLabel || emailLabel) && (
        <View style={styles.row}>
          {phoneLabel && (
            <>
              <Text style={styles.label}>{phoneLabel}:</Text>
              <Text style={[styles.fillLine, { flex: 1 }]}>{phone ?? ""}</Text>
            </>
          )}
          {emailLabel && (
            <>
              <Text style={styles.label}>{emailLabel}:</Text>
              <Text style={[styles.fillLine, { flex: 1.6 }]}>{email ?? ""}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function RaUtShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;

  /* ----- Applicant 1 ----- */
  const firstName = findField(schema, "applicant_first_name");
  const fatherName = findField(schema, "applicant_father_name");
  const familyName = findField(schema, "applicant_family_name");
  const egn = findField(schema, "applicant_egn");
  const legalName = findField(schema, "applicant_legal_name");
  const legalEik = findField(schema, "applicant_legal_eik");
  const applicantType = findField(schema, "applicant_type");
  const address = findField(schema, "correspondence_address");
  const phone = findField(schema, "phone");
  const email = findField(schema, "email");

  /* ----- Applicant 2 / 3 (optional co-applicants) ----- */
  const a2First = findField(schema, "applicant_2_first_name");
  const a2Father = findField(schema, "applicant_2_father_name");
  const a2Family = findField(schema, "applicant_2_family_name");
  const a2Egn = findField(schema, "applicant_2_egn");
  const a2Address = findField(schema, "applicant_2_address");
  const a2Phone = findField(schema, "applicant_2_phone");

  const a3First = findField(schema, "applicant_3_first_name");
  const a3Father = findField(schema, "applicant_3_father_name");
  const a3Family = findField(schema, "applicant_3_family_name");
  const a3Egn = findField(schema, "applicant_3_egn");
  const a3Address = findField(schema, "applicant_3_address");
  const a3Phone = findField(schema, "applicant_3_phone");

  /* ----- Property location ----- */
  const propertyUpi = findField(schema, "property_upi");
  const propertyKvartal = findField(schema, "property_kvartal");
  const propertyMestnost = findField(schema, "property_mestnost");
  const propertyRegion = findField(schema, "property_region");
  const propertyStreet = findField(schema, "property_street");
  const propertyNumber = findField(schema, "property_number");
  const propertyCadastralId = findField(schema, "property_cadastral_id");
  const propertyAddressFull = findField(schema, "property_admin_address_full");

  /* ----- Request ----- */
  const requestSubject =
    findField(schema, "request_subject_description") ??
    findField(schema, "free_text_request");
  const constructionCategory = findField(schema, "construction_category");
  const preserveBuildingsFlag = findField(schema, "preserve_existing_buildings_flag");
  const buildingPermitNumber = findField(schema, "building_permit_number");
  const buildingPermitDate = findField(schema, "building_permit_date");

  /* ----- Signature ----- */
  const signaturePlace = findField(schema, "signature_place");
  const signatureDate = findField(schema, "signature_date");
  const signatureField = findField(schema, "signature");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  /* ----- Applicant-1 rendering ----- */
  const applicantTypeLabel = getFieldValue(values, applicantType);
  const isLegalEntity =
    applicantTypeLabel.toLowerCase().includes("юридическ") ||
    applicantTypeLabel.toLowerCase().includes("legal");

  const person1Name = [
    getFieldValue(values, firstName),
    getFieldValue(values, fatherName),
    getFieldValue(values, familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const legal1Name = getFieldValue(values, legalName);
  const applicant1FullName = isLegalEntity && legal1Name ? legal1Name : person1Name || legal1Name;

  const applicant2FullName = [
    getFieldValue(values, a2First),
    getFieldValue(values, a2Father),
    getFieldValue(values, a2Family),
  ]
    .filter(Boolean)
    .join(" ");
  const applicant3FullName = [
    getFieldValue(values, a3First),
    getFieldValue(values, a3Father),
    getFieldValue(values, a3Family),
  ]
    .filter(Boolean)
    .join(" ");

  const hasApplicant2 = !!(a2First || a2Family || a2Egn);
  const hasApplicant3 = !!(a3First || a3Family || a3Egn);

  const serviceTitle =
    service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  /* ----- Addressee: SI-* and most Главен-архитект UT-* go to
   * "Главния архитект"; the rest (AA-*, several UT-* for general
   * кмет decisions) go to "Кмета". Map codified from the official
   * Триадица РА-УТ blanks on R2. ----- */
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const KMET_CODES = new Set<string>([
    "UT-001", "UT-004", "UT-013", "UT-019", "UT-020", "UT-021", "UT-022",
    "UT-023", "UT-024", "UT-025", "UT-026", "UT-035", "UT-036", "UT-037",
    "UT-038", "UT-039", "UT-040", "UT-041", "UT-042",
    "AA-001", "AA-002",
    "SI-010", "SI-012", "SI-014", "SI-015", "SI-016",
  ]);
  const addressee = KMET_CODES.has(serviceCode) ? "Кмета" : "Главния архитект";

  /* ----- Property cells ----- */
  const propertyCells: { label: string; field: RenderedField | undefined; width?: number }[] = [
    { label: "УПИ", field: propertyUpi, width: 120 },
    { label: "кв.", field: propertyKvartal, width: 80 },
    { label: "м-ст", field: propertyMestnost, width: 140 },
    { label: "Район", field: propertyRegion, width: 140 },
    { label: "ул.", field: propertyStreet, width: 180 },
    { label: "№", field: propertyNumber, width: 60 },
    { label: "Кад. ид.", field: propertyCadastralId, width: 180 },
  ];
  const renderedPropertyCells = propertyCells.filter((c) => c.field);

  /* ----- Attachments: iterate over the entire "attachments" section so
   * per-form overrides in Baserow surface automatically. Fall back to a
   * heuristic (field codes mentioning "document"/"plan"/"project") if
   * the form doesn't use a named section. ----- */
  const attachmentsSection = findSection(schema, "attachments");
  const attachmentFields: RenderedField[] = attachmentsSection
    ? attachmentsSection.fields
    : schema.sections
        .flatMap((s) => s.fields)
        .filter(
          (f) =>
            f.typeCode === "file" ||
            f.htmlInput === "file" ||
            /document|project|plan|scheme|photo|permit|protocol|receipt/i.test(f.code),
        );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.addresseeBlock}>
          <Text style={styles.addresseeLine}>До</Text>
          <Text style={styles.addresseeFill}>{addressee}</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={styles.addresseeFill}>{getMunicipality(schema).nameBg}</Text>
          <Text style={styles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={styles.title}>ЗАЯВЛЕНИЕ</Text>
        <Text style={styles.subtitle}>
          {serviceTitle || `до ${addressee}`}
        </Text>

        {/* Applicant 1 */}
        {isLegalEntity ? (
          <View>
            <Text style={styles.applicantHeader}>От 1 (юридическо лице):</Text>
            <View style={styles.row}>
              <Text style={styles.label}>
                {legalName ? legalName.labelBg : "Наименование"}:
              </Text>
              <Text style={[styles.fillLine, { flex: 2 }]}>
                {legal1Name}
              </Text>
              {legalEik && (
                <>
                  <Text style={styles.label}>{legalEik.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, legalEik)}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>чрез:</Text>
              <Text style={[styles.fillLine, { flex: 2 }]}>{person1Name}</Text>
              {egn && (
                <>
                  <Text style={styles.label}>{egn.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, egn)}
                  </Text>
                </>
              )}
            </View>
            {address && (
              <View style={styles.row}>
                <Text style={styles.label}>{address.labelBg}:</Text>
                <Text style={styles.fillLine}>
                  {getFieldValue(values, address)}
                </Text>
              </View>
            )}
            {(phone || email) && (
              <View style={styles.row}>
                {phone && (
                  <>
                    <Text style={styles.label}>{phone.labelBg}:</Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {getFieldValue(values, phone)}
                    </Text>
                  </>
                )}
                {email && (
                  <>
                    <Text style={styles.label}>{email.labelBg}:</Text>
                    <Text style={[styles.fillLine, { flex: 1.6 }]}>
                      {getFieldValue(values, email)}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          <ApplicantBlock
            label="От 1:"
            helper="(име, презиме, фамилия)"
            fullName={applicant1FullName}
            egn={getFieldValue(values, egn)}
            egnLabel={egn?.labelBg}
            address={getFieldValue(values, address)}
            addressLabel={address?.labelBg}
            phone={getFieldValue(values, phone)}
            phoneLabel={phone?.labelBg}
            email={getFieldValue(values, email)}
            emailLabel={email?.labelBg}
          />
        )}

        {hasApplicant2 && (
          <ApplicantBlock
            label="От 2 (съзаявител):"
            fullName={applicant2FullName}
            egn={getFieldValue(values, a2Egn)}
            egnLabel={a2Egn?.labelBg}
            address={getFieldValue(values, a2Address)}
            addressLabel={a2Address?.labelBg}
            phone={getFieldValue(values, a2Phone)}
            phoneLabel={a2Phone?.labelBg}
          />
        )}

        {hasApplicant3 && (
          <ApplicantBlock
            label="От 3 (съзаявител):"
            fullName={applicant3FullName}
            egn={getFieldValue(values, a3Egn)}
            egnLabel={a3Egn?.labelBg}
            address={getFieldValue(values, a3Address)}
            addressLabel={a3Address?.labelBg}
            phone={getFieldValue(values, a3Phone)}
            phoneLabel={a3Phone?.labelBg}
          />
        )}

        {/* Property */}
        {(renderedPropertyCells.length > 0 || propertyAddressFull) && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Местонахождение на обекта
            </Text>
            {propertyAddressFull && (
              <View style={styles.row}>
                <Text style={styles.label}>{propertyAddressFull.labelBg}:</Text>
                <Text style={styles.fillLine}>
                  {getFieldValue(values, propertyAddressFull)}
                </Text>
              </View>
            )}
            {renderedPropertyCells.length > 0 && (
              <View style={styles.cellGrid}>
                {renderedPropertyCells.map((c) => (
                  <View
                    key={c.label}
                    style={[styles.cell, { width: c.width ?? 120 }]}
                  >
                    <Text style={styles.label}>{c.label}</Text>
                    <Text style={styles.fillLine}>
                      {getFieldValue(values, c.field)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Request */}
        <Text style={styles.salutation}>Уважаеми г-н/г-жо Главен архитект,</Text>
        <Text style={styles.paragraph}>
          Моля, да ми бъде извършена следната услуга:
        </Text>
        <View style={styles.requestBody}>
          <Text>{getFieldValue(values, requestSubject) || serviceTitle}</Text>
        </View>

        {(constructionCategory || buildingPermitNumber || preserveBuildingsFlag) && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Допълнителна информация
            </Text>
            {constructionCategory && (
              <View style={styles.row}>
                <Text style={styles.label}>{constructionCategory.labelBg}:</Text>
                <Text style={styles.fillLine}>
                  {getFieldValue(values, constructionCategory)}
                </Text>
              </View>
            )}
            {(buildingPermitNumber || buildingPermitDate) && (
              <View style={styles.row}>
                {buildingPermitNumber && (
                  <>
                    <Text style={styles.label}>
                      {buildingPermitNumber.labelBg}:
                    </Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {getFieldValue(values, buildingPermitNumber)}
                    </Text>
                  </>
                )}
                {buildingPermitDate && (
                  <>
                    <Text style={styles.label}>{buildingPermitDate.labelBg}:</Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {formatBgDate(getFieldValue(values, buildingPermitDate))}
                    </Text>
                  </>
                )}
              </View>
            )}
            {preserveBuildingsFlag && (
              <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
                <Checkbox
                  checked={formatBoolean(values[preserveBuildingsFlag.code]) === "да"}
                />
                <Text style={{ fontSize: 10 }}>
                  {preserveBuildingsFlag.labelBg}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Attachments — driven by the schema so per-form overrides work. */}
        {attachmentFields.length > 0 && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Прилагам следните документи:
            </Text>
            {attachmentFields.map((f, idx) => (
              <View key={f.code} style={styles.numberedItem}>
                <Text style={styles.numberedIndex}>{idx + 1}.</Text>
                <Text style={styles.attachmentLabel}>{f.labelBg}</Text>
                <Text style={styles.attachmentValue}>
                  {f.typeCode === "boolean" || f.htmlInput === "checkbox"
                    ? formatBoolean(values[f.code])
                    : getFieldValue(values, f)}
                </Text>
              </View>
            ))}
          </>
        )}

        <View wrap={false}>
          <View style={styles.footer}>
            <View>
              {signaturePlace && (
                <View style={styles.footerField}>
                  <Text style={styles.label}>гр./с.</Text>
                  <Text style={[styles.fillLine, { width: 120, flex: 0 }]}>
                    {getFieldValue(values, signaturePlace) || "София"}
                  </Text>
                </View>
              )}
              <View style={[styles.footerField, { marginTop: 6 }]}>
                <Text style={styles.label}>Дата:</Text>
                <Text style={[styles.fillLine, { width: 120, flex: 0 }]}>
                  {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
                </Text>
              </View>
            </View>
            <View style={styles.footerField}>
              <Text style={styles.label}>Подпис:</Text>
              {signatureIsImage ? (
                <View style={styles.signatureBox}>
                  <Image src={signatureValue} style={styles.signatureImage} />
                </View>
              ) : (
                <View style={styles.signatureBox} />
              )}
            </View>
          </View>

          <Text style={styles.gdprFooter}>
            Съгласно чл. 13 от Регламент (ЕС) 2016/679, личните данни, посочени в
            настоящото заявление, се обработват от {getMunicipality(schema).nameBg} за целите на
            предоставяне на заявената административна услуга. Данните се подават
            към {getMunicipality(schema).email} и се съхраняват съгласно сроковете в
            нормативната уредба.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
