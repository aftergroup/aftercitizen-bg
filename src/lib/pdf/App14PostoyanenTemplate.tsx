/**
 * Printable PDF for GR-005 — ЗАЯВЛЕНИЕ за постоянен адрес (Приложение № 14).
 *
 * Layout follows the official blank: addressee top-right, centered title,
 * applicant block with ID document, the declared permanent-address breakdown
 * (населено място / община / област / ж.к. / № / вх. / ет. / ап.), legal
 * representatives and optional proxy, then signature footer.
 */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { RenderedForm, RenderedField } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
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
  addresseeBlock: { alignSelf: "flex-end", width: 280, marginBottom: 18 },
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
    fontSize: 11,
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
  addressGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  addressCell: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  footer: {
    marginTop: 24,
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

export default function App14PostoyanenTemplate({ schema, values }: Props) {
  const { form, service } = schema;

  const firstName = findField(schema, "applicant_first_name");
  const fatherName = findField(schema, "applicant_father_name");
  const familyName = findField(schema, "applicant_family_name");
  const egn = findField(schema, "applicant_egn");

  const idDocType = findField(schema, "id_doc_type");
  const idDocNumber = findField(schema, "id_doc_number");
  const idDocIssueDate = findField(schema, "id_doc_issue_date");
  const idDocIssuer = findField(schema, "id_doc_issuer");

  const declaredSettlement = findField(schema, "declared_settlement");
  const declaredMunicipality = findField(schema, "declared_municipality");
  const declaredRegion = findField(schema, "declared_region");
  const declaredLocalization = findField(schema, "declared_localization");
  const declaredNumber = findField(schema, "declared_number");
  const declaredEntrance = findField(schema, "declared_entrance");
  const declaredFloor = findField(schema, "declared_floor");
  const declaredApartment = findField(schema, "declared_apartment");

  const legalRep1Name = findField(schema, "legal_rep_1_name");
  const legalRep1Egn = findField(schema, "legal_rep_1_egn");
  const legalRep2Name = findField(schema, "legal_rep_2_name");
  const legalRep2Egn = findField(schema, "legal_rep_2_egn");
  const proxyName = findField(schema, "proxy_full_name");
  const proxyEgn = findField(schema, "proxy_egn");
  const powerOfAttorneyDate = findField(schema, "power_of_attorney_date");
  const powerOfAttorneyIssuer = findField(schema, "power_of_attorney_issuer");

  const signatureDate = findField(schema, "signature_date");
  const signatureField = findField(schema, "signature");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");

  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  const fullName = [
    getFieldValue(values, firstName),
    getFieldValue(values, fatherName),
    getFieldValue(values, familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const serviceTitle =
    service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const addressCells: { label: string; field: RenderedField | undefined; width?: number }[] = [
    { label: "гр./с.", field: declaredSettlement, width: 120 },
    { label: "общ.", field: declaredMunicipality, width: 110 },
    { label: "обл.", field: declaredRegion, width: 100 },
    { label: "ж.к./ул./бул.", field: declaredLocalization, width: 180 },
    { label: "№", field: declaredNumber, width: 60 },
    { label: "вх.", field: declaredEntrance, width: 50 },
    { label: "ет.", field: declaredFloor, width: 50 },
    { label: "ап.", field: declaredApartment, width: 50 },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.addresseeBlock}>
          <Text style={styles.addresseeLine}>До кмета</Text>
          <Text style={{ fontWeight: 700 }}>на</Text>
          <Text style={styles.addresseeFill}>Район Триадица</Text>
          <Text style={styles.caption}>(район/ кметство)</Text>
        </View>

        <Text style={styles.title}>ЗАЯВЛЕНИЕ</Text>
        <Text style={styles.subtitle}>
          {serviceTitle || "за постоянен адрес (Приложение № 14)"}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>От:</Text>
          <Text style={[styles.fillLine, { flex: 2.5 }]}>{fullName}</Text>
          {egn && (
            <>
              <Text style={styles.label}>{egn.labelBg}:</Text>
              <Text style={[styles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, egn)}
              </Text>
            </>
          )}
        </View>
        <Text style={styles.helper}>(име, презиме, фамилия)</Text>

        {(idDocType || idDocNumber || idDocIssueDate || idDocIssuer) && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Документ за самоличност
            </Text>
            <View style={styles.row}>
              {idDocType && (
                <>
                  <Text style={styles.label}>{idDocType.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, idDocType)}
                  </Text>
                </>
              )}
              {idDocNumber && (
                <>
                  <Text style={styles.label}>{idDocNumber.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, idDocNumber)}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.row}>
              {idDocIssueDate && (
                <>
                  <Text style={styles.label}>{idDocIssueDate.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {formatBgDate(getFieldValue(values, idDocIssueDate))}
                  </Text>
                </>
              )}
              {idDocIssuer && (
                <>
                  <Text style={styles.label}>{idDocIssuer.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 1.5 }]}>
                    {getFieldValue(values, idDocIssuer)}
                  </Text>
                </>
              )}
            </View>
          </>
        )}

        <Text style={[styles.label, styles.sectionHeader]}>
          Декларирам следния постоянен адрес:
        </Text>
        <View style={styles.addressGrid}>
          {addressCells
            .filter((c) => c.field)
            .map((c) => (
              <View
                key={c.label}
                style={[styles.addressCell, { width: c.width ?? 110 }]}
              >
                <Text style={styles.label}>{c.label}</Text>
                <Text style={styles.fillLine}>
                  {getFieldValue(values, c.field)}
                </Text>
              </View>
            ))}
        </View>

        {(legalRep1Name || legalRep2Name) && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Законни представители
            </Text>
            {legalRep1Name && (
              <View style={styles.row}>
                <Text style={styles.label}>1.</Text>
                <Text style={[styles.fillLine, { flex: 2 }]}>
                  {getFieldValue(values, legalRep1Name)}
                </Text>
                {legalRep1Egn && (
                  <>
                    <Text style={styles.label}>ЕГН:</Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {getFieldValue(values, legalRep1Egn)}
                    </Text>
                  </>
                )}
              </View>
            )}
            {legalRep2Name && (
              <View style={styles.row}>
                <Text style={styles.label}>2.</Text>
                <Text style={[styles.fillLine, { flex: 2 }]}>
                  {getFieldValue(values, legalRep2Name)}
                </Text>
                {legalRep2Egn && (
                  <>
                    <Text style={styles.label}>ЕГН:</Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {getFieldValue(values, legalRep2Egn)}
                    </Text>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {(proxyName || powerOfAttorneyDate) && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              Упълномощено лице
            </Text>
            <View style={styles.row}>
              {proxyName && (
                <>
                  <Text style={styles.label}>{proxyName.labelBg}:</Text>
                  <Text style={[styles.fillLine, { flex: 2 }]}>
                    {getFieldValue(values, proxyName)}
                  </Text>
                </>
              )}
              {proxyEgn && (
                <>
                  <Text style={styles.label}>ЕГН:</Text>
                  <Text style={[styles.fillLine, { flex: 1 }]}>
                    {getFieldValue(values, proxyEgn)}
                  </Text>
                </>
              )}
            </View>
            {(powerOfAttorneyDate || powerOfAttorneyIssuer) && (
              <View style={styles.row}>
                {powerOfAttorneyDate && (
                  <>
                    <Text style={styles.label}>
                      {powerOfAttorneyDate.labelBg}:
                    </Text>
                    <Text style={[styles.fillLine, { flex: 1 }]}>
                      {formatBgDate(getFieldValue(values, powerOfAttorneyDate))}
                    </Text>
                  </>
                )}
                {powerOfAttorneyIssuer && (
                  <>
                    <Text style={styles.label}>
                      {powerOfAttorneyIssuer.labelBg}:
                    </Text>
                    <Text style={[styles.fillLine, { flex: 1.5 }]}>
                      {getFieldValue(values, powerOfAttorneyIssuer)}
                    </Text>
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.footerField}>
            <Text style={styles.label}>Дата:</Text>
            <Text style={[styles.fillLine, { width: 140, flex: 0 }]}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
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
          настоящото заявление, се обработват от Район Триадица за целите на
          предоставяне на заявената административна услуга.
        </Text>
      </Page>
    </Document>
  );
}
