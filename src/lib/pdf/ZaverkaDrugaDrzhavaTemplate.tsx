/**
 * Printable PDF for GR-030 — Заверка на документи по гражданско състояние
 * за ползване в чужбина (услуга 2110).
 *
 * Layout: addressee top-right, ЗАЯВЛЕНИЕ title + service subtitle,
 * applicant block with contact info, a free-text description of the
 * documents to be certified and the destination country, fee/delivery
 * checkboxes, signature footer.
 */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { RenderedForm, RenderedField } from "@/lib/types";
import { formatBgDate, getFieldValue, fieldValueMatches } from "./helpers";
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
  salutation: { fontWeight: 700, marginTop: 10, marginBottom: 2 },
  paragraph: { marginBottom: 4 },
  longBox: {
    minHeight: 60,
    borderBottom: "1pt dotted #333",
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 10,
  },
  sectionHeader: { marginTop: 10, marginBottom: 4 },
  checkRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  checkItem: { flexDirection: "row", gap: 4, alignItems: "center" },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#333",
    padding: 1.2,
  },
  checkboxFill: { flex: 1, backgroundColor: "#111" },
  helper: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
    marginTop: -2,
    marginBottom: 4,
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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      {checked ? <View style={styles.checkboxFill} /> : null}
    </View>
  );
}

export default function ZaverkaDrugaDrzhavaTemplate({ schema, values }: Props) {
  const { form, service } = schema;

  const firstName = findField(schema, "applicant_first_name");
  const fatherName = findField(schema, "applicant_father_name");
  const familyName = findField(schema, "applicant_family_name");
  const egn = findField(schema, "applicant_egn");
  const address = findField(schema, "correspondence_address");
  const phone = findField(schema, "phone");
  const email = findField(schema, "email");

  const documentsForCertification = findField(schema, "documents_for_certification");
  const destinationCountry = findField(schema, "destination_country");
  const feePaidElectronically = findField(schema, "fee_paid_electronically");
  const feeReceipt = findField(schema, "fee_receipt");

  const deliveryChannel = findField(schema, "delivery_method");
  const deliveryAddress = findField(schema, "delivery_address");
  const deliveryEmail = findField(schema, "delivery_email");

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

  const deliveryMatches = (...tokens: string[]) =>
    fieldValueMatches(values, deliveryChannel, tokens);

  const feePaidFlag = String(values[feePaidElectronically?.code ?? ""] ?? "")
    .toLowerCase()
    .trim();
  const feePaidChecked = feePaidFlag === "true" || feePaidFlag === "1" || feePaidFlag === "да";

  const serviceTitle =
    service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

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
          {serviceTitle || "за заверка на документи по гражданско състояние за чужбина"}
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

        <View style={styles.row}>
          <Text style={styles.label}>
            {address ? address.labelBg : "Адрес за кореспонденция"}:
          </Text>
          <Text style={styles.fillLine}>{getFieldValue(values, address)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{phone ? phone.labelBg : "Телефон"}:</Text>
          <Text style={[styles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, phone)}
          </Text>
          <Text style={styles.label}>{email ? email.labelBg : "E-mail"}:</Text>
          <Text style={[styles.fillLine, { flex: 1.6 }]}>
            {getFieldValue(values, email)}
          </Text>
        </View>

        <Text style={styles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={styles.paragraph}>
          Моля да бъдат заверени следните документи по гражданско състояние за
          ползване в чужбина:
        </Text>
        <Text style={[styles.label, { marginBottom: 2 }]}>
          {documentsForCertification
            ? documentsForCertification.labelBg
            : "Документи за заверка"}
          :
        </Text>
        <View style={styles.longBox}>
          <Text>{getFieldValue(values, documentsForCertification)}</Text>
        </View>

        {destinationCountry && (
          <View style={styles.row}>
            <Text style={styles.label}>{destinationCountry.labelBg}:</Text>
            <Text style={styles.fillLine}>
              {getFieldValue(values, destinationCountry)}
            </Text>
          </View>
        )}

        <Text style={[styles.label, styles.sectionHeader]}>
          Такса и прикачени документи:
        </Text>
        {feePaidElectronically && (
          <View style={styles.checkRow}>
            <View style={styles.checkItem}>
              <Checkbox checked={feePaidChecked} />
              <Text>{feePaidElectronically.labelBg}</Text>
            </View>
          </View>
        )}
        {feeReceipt && (
          <View style={styles.row}>
            <Text style={styles.label}>{feeReceipt.labelBg}:</Text>
            <Text style={styles.fillLine}>
              {getFieldValue(values, feeReceipt)}
            </Text>
          </View>
        )}

        {deliveryChannel && (
          <>
            <Text style={[styles.label, styles.sectionHeader]}>
              {deliveryChannel.labelBg} (отбелязва се в квадратчето):
            </Text>
            <View style={styles.checkRow}>
              <View style={styles.checkItem}>
                <Checkbox checked={deliveryMatches("гише", "office", "counter")} />
                <Text>на гише</Text>
              </View>
              <View style={styles.checkItem}>
                <Checkbox checked={deliveryMatches("адрес", "address", "post")} />
                <Text>на адрес</Text>
              </View>
              <View style={styles.checkItem}>
                <Checkbox checked={deliveryMatches("поща", "email", "e-mail")} />
                <Text>по е-поща</Text>
              </View>
            </View>
          </>
        )}

        {deliveryAddress && (
          <View style={styles.row}>
            <Text style={styles.label}>{deliveryAddress.labelBg}:</Text>
            <Text style={styles.fillLine}>
              {getFieldValue(values, deliveryAddress)}
            </Text>
          </View>
        )}
        {deliveryEmail && (
          <View style={styles.row}>
            <Text style={styles.label}>{deliveryEmail.labelBg}:</Text>
            <Text style={styles.fillLine}>
              {getFieldValue(values, deliveryEmail)}
            </Text>
          </View>
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
