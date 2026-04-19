/**
 * GR-010 — Припознаване на дете.
 *
 * Two-page declaration under чл. 64, 65, 66 СК. Structure follows the
 * official Триадица blank exactly:
 *
 *   Page 1: declarant (присъзнаваш — usually father) block, Уважаеми
 *           г-н кмет + декларация за припознаване, child data (name,
 *           EGN, birth date, birth place, act number, mother name),
 *           father signature + date.
 *
 *   Page 2: mother block (name, EGN, birth date, citizenship, address,
 *           ID doc, phone/email), consent paragraph referencing чл. 66
 *           СК with the chosen child name after recognition, mother
 *           signature + date, optional child-≥14 acknowledgement, and
 *           official's witness signature block + GDPR footer.
 *
 * Field codes referenced (fall back to defaults if not in schema):
 *   applicant_* for the declarant; child_* for the child; mother_*
 *   for the other parent; child_name_after_recognition for the name
 *   chosen under чл. 12-14 ЗГР.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
  findField,
  firstFieldMatching,
  pdfStyles,
  resolveApplicantFields,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR010Template({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);

  const childName =
    findField(schema, "child_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("name") && !f.code.includes("after"));
  const childEgn =
    findField(schema, "child_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("egn"));
  const childBirthDate =
    findField(schema, "child_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("birth"));
  const childBirthPlace =
    findField(schema, "child_birth_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("place"));
  const actNumber =
    findField(schema, "act_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_number"));
  const childNameAfter =
    findField(schema, "child_name_after_recognition") ??
    firstFieldMatching(schema, (f) => f.code.includes("after"));

  const motherName =
    findField(schema, "mother_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("name"));
  const motherEgn =
    findField(schema, "mother_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("egn"));
  const motherBirthDate =
    findField(schema, "mother_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("birth"));
  const motherCitizenship =
    findField(schema, "mother_citizenship") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("citizenship"));
  const motherAddress =
    findField(schema, "mother_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("address"));
  const motherIdDoc =
    findField(schema, "mother_id_doc_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("id_doc"));
  const motherIdDocDate =
    findField(schema, "mother_id_doc_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("issue"));
  const motherIdDocIssuer =
    findField(schema, "mother_id_doc_issuer") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("issuer"));
  const motherPhone =
    findField(schema, "mother_phone") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("phone"));
  const motherEmail =
    findField(schema, "mother_email") ??
    firstFieldMatching(schema, (f) => f.code.includes("mother") && f.code.includes("email"));

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

  const declarantName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");
  const declarantEgn = getFieldValue(values, r.egn);
  const declarantBirthDate = formatBgDate(getFieldValue(values, r.birthDate));
  const declarantCitizenship = getFieldValue(values, r.citizenship);
  const declarantAddress = getFieldValue(values, r.address);
  const declarantIdDoc = getFieldValue(values, r.idDocNumber);
  const declarantIdDocDate = formatBgDate(getFieldValue(values, r.idDocIssueDate));
  const declarantIdDocIssuer = getFieldValue(values, r.idDocIssuer);
  const declarantPhone = getFieldValue(values, r.phone);
  const declarantEmail = getFieldValue(values, r.email);
  const dateBg = formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Title */}
        <Text style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: 6, marginTop: 6 }}>
          З А Я В Л Е Н И Е
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, marginTop: 2 }}>
          за припознаване при съставен акт за раждане,
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, marginBottom: 14 }}>
          съгласно чл. 64, чл. 65 и чл. 66 от Семейния кодекс (СК)
        </Text>

        {/* Declarant (father) block */}
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>От:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 3 }]}>{declarantName}</Text>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantEgn}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на припознаващия)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Дата на раждане:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantBirthDate}</Text>
          <Text style={pdfStyles.label}>гражданство:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantCitizenship}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с постоянен адрес:</Text>
          <Text style={pdfStyles.fillLine}>{declarantAddress}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>и документ за самоличност №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantIdDoc}</Text>
          <Text style={pdfStyles.label}>, издаден на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{declarantIdDocDate}</Text>
          <Text style={pdfStyles.label}>от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantIdDocIssuer}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Телефон за контакти:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{declarantPhone}</Text>
          <Text style={pdfStyles.label}>е-адрес:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.4 }]}>{declarantEmail}</Text>
        </View>

        <Text style={{ fontWeight: 700, marginTop: 14, marginBottom: 6 }}>УВАЖАЕМИ ГОСПОДИН КМЕТ,</Text>
        <Text style={{ marginBottom: 8 }}>
          На основание чл. 64 и чл. 65 от Семейния кодекс припознавам за свое дете
        </Text>

        <View style={pdfStyles.row}>
          <Text style={[pdfStyles.fillLine, { flex: 3 }]}>{getFieldValue(values, childName)}</Text>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, childEgn)}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на детето по акт за раждане)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Дата на раждане:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, childBirthDate))}
          </Text>
          <Text style={pdfStyles.label}>Месторождение:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, childBirthPlace)}</Text>
          <Text style={pdfStyles.label}>акт за раждане №:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, actNumber)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Родено от майка:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, motherName)}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на майката)</Text>

        <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text>Дата: {dateBg} г.</Text>
            <Text>град София</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text>С уважение,</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 30 }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, minHeight: 20 }}> </Text>
            )}
            <Text style={pdfStyles.caption}>(подпис на бащата)</Text>
          </View>
        </View>
      </Page>

      {/* Page 2: mother's consent + witness */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Подписаната:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 3 }]}>{getFieldValue(values, motherName)}</Text>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, motherEgn)}</Text>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на майката)</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Дата на раждане:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, motherBirthDate))}
          </Text>
          <Text style={pdfStyles.label}>гражданство:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, motherCitizenship)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с постоянен адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, motherAddress)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>и документ за самоличност №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, motherIdDoc)}</Text>
          <Text style={pdfStyles.label}>, издаден на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>
            {formatBgDate(getFieldValue(values, motherIdDocDate))}
          </Text>
          <Text style={pdfStyles.label}>от</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, motherIdDocIssuer)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Телефон за контакти:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, motherPhone)}</Text>
          <Text style={pdfStyles.label}>е-адрес:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.4 }]}>{getFieldValue(values, motherEmail)}</Text>
        </View>

        <Text style={{ marginTop: 14, marginBottom: 4 }}>
          Потвърждавам, че съгласно чл. 66 от СК съм уведомена за извършеното от
        </Text>
        <Text style={pdfStyles.fillBoxLarge}>{declarantName}</Text>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на припознаващия)</Text>

        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>припознаване на роденото от мен на</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, childBirthDate))}
          </Text>
          <Text style={pdfStyles.label}>дете, съгласна съм с избраните</Text>
        </View>
        <Text style={{ marginTop: 2, marginBottom: 2 }}>
          (на основание чл. 12, чл. 13 и чл. 14 от Закона за гражданската регистрация) имена на детето
        </Text>
        <Text style={pdfStyles.fillBoxLarge}>{getFieldValue(values, childNameAfter)}</Text>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена на детето след припознаването)</Text>

        <View style={{ marginTop: 18, alignItems: "flex-end" }}>
          <Text>С уважение,</Text>
          <Text style={{ borderBottom: "1pt dotted #333", minWidth: 180, minHeight: 20 }}> </Text>
          <Text style={pdfStyles.caption}>(подпис на майката)</Text>
          <Text style={{ marginTop: 4 }}>Дата: {dateBg} г.</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text>Известен/а съм за извършеното припознаване:</Text>
          <Text style={pdfStyles.fillBoxLarge}> </Text>
          <Text style={pdfStyles.caption}>(подпис и имена на детето, ако е навършило четиринадесет години)</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text>Подписите са положени в мое присъствие:</Text>
          <Text style={pdfStyles.fillBoxLarge}> </Text>
          <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(подпис на длъжностното лице)</Text>

          <View style={[pdfStyles.row, { marginTop: 6 }]}>
            <Text style={pdfStyles.label}>Длъжностно лице:</Text>
            <Text style={pdfStyles.fillLine}> </Text>
          </View>
          <Text style={[pdfStyles.caption, { textAlign: "left" }]}>(имена)</Text>

          <View style={[pdfStyles.row, { marginTop: 6 }]}>
            <Text style={pdfStyles.label}>Дата:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}> </Text>
          </View>
        </View>

        <Text style={[pdfStyles.gdprFooter, { fontStyle: "italic" }]}>
          „Столична община е Администратор на лични данни с идентификационен номер 52258
          и представител кмета на Столична община. Предоставените от Вас лични данни, при
          условията на чл. 19 от ЗЗЛД, се събират и обработват за нуждите на административната
          услуга, поискана от Вас и могат да бъдат коригирани по Ваше искане. Достъп до
          информация за личните Ви данни е гарантиран в хода на цялата процедура. Трети лица
          могат да получат информация само по реда и при условия на закона. Непредставянето
          на личните данни, които се изискват от закон, може да доведе до прекратяване на
          производството."
        </Text>
      </Page>
    </Document>
  );
}
