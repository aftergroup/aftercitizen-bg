/**
 * GR-017 — Издаване на удостоверение за наследници.
 *
 * Distinct blank (not the universal Приложение № 1). Structure:
 *
 *   Header: Вх. №, Дата (left) + До Кмета на ... (right)
 *   Applicant (От): name, ЕГН, ЛНЧ / ЕИК по БУЛСТАТ / ЕИК по ЗТР,
 *     address, phone, fax, e-mail.
 *   Deceased block: name, birth date, marital status, date of death,
 *     death act number + date + place (settlement/country/region).
 *   Heirs table: № | name | ЕГН/birth date | съпруг/родство |
 *     date of death, with a sub-row for the heir's permanent address.
 *   Attachments + preferred delivery checklist (postal operator,
 *   internal registered mail, internal courier, international
 *   registered mail, in person, by email).
 *   Дата + Подпис footer.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { fieldValueMatches, formatBgDate, getFieldValue } from "./helpers";
import {
  Checkbox,
  findField,
  firstFieldMatching,
  getMunicipality,
  pdfStyles,
  resolveApplicantFields,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

const HEIR_ROW_COUNT = 10;

export default function GR017Template({ schema, values }: Props) {
  const r = resolveApplicantFields(schema);

  const lnc = findField(schema, "applicant_lnc");
  const bulstat = findField(schema, "applicant_bulstat");
  const ztr = findField(schema, "applicant_ztr");
  const fax = findField(schema, "applicant_fax");

  const deceasedFirst = findField(schema, "deceased_first_name");
  const deceasedFather = findField(schema, "deceased_father_name");
  const deceasedFamily = findField(schema, "deceased_family_name");
  const deceasedFullName =
    findField(schema, "deceased_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("deceased") && f.code.includes("name"));
  const deceasedBirthDate =
    findField(schema, "deceased_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("deceased") && f.code.includes("birth"));
  const deceasedMaritalStatus =
    findField(schema, "deceased_marital_status") ??
    firstFieldMatching(schema, (f) => f.code.includes("marital") || f.code.includes("family_status"));
  const deathDate =
    findField(schema, "death_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("death") && f.code.includes("date"));
  const deathActNumber =
    findField(schema, "death_act_number") ??
    findField(schema, "act_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_number"));
  const deathActDate =
    findField(schema, "death_act_date") ??
    findField(schema, "act_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_date"));
  const deathActPlace =
    findField(schema, "death_act_place") ??
    findField(schema, "act_municipality") ??
    firstFieldMatching(schema, (f) => f.code.includes("act") && (f.code.includes("place") || f.code.includes("municipality")));

  const deliveryChannel =
    findField(schema, "delivery_method") ??
    firstFieldMatching(schema, (f) => f.code.includes("delivery") && !f.code.includes("address"));
  const deliveryAddress =
    findField(schema, "delivery_address") ??
    firstFieldMatching(schema, (f) => f.code.includes("delivery") && f.code.includes("address"));
  const attachments =
    findField(schema, "attachments_text") ??
    firstFieldMatching(schema, (f) => f.code.includes("attach"));

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue") && !f.code.includes("death"),
    );
  const signatureField =
    findField(schema, "signature") ??
    firstFieldMatching(schema, (f) => f.typeCode === "signature" || f.htmlInput === "canvas");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  const heirs = Array.from({ length: HEIR_ROW_COUNT }, (_, i) => {
    const n = i + 1;
    const name = findField(schema, `heir_${n}_name`);
    const egn = findField(schema, `heir_${n}_egn`);
    const relation = findField(schema, `heir_${n}_relation`);
    const deathDateF = findField(schema, `heir_${n}_death_date`);
    const address = findField(schema, `heir_${n}_address`);
    const hasData =
      !!(name && values[name.code]) ||
      !!(egn && values[egn.code]) ||
      !!(relation && values[relation.code]);
    return { n, name, egn, relation, deathDate: deathDateF, address, hasData };
  });
  const rowsToRender = heirs.some((h) => h.hasData) ? heirs.filter((h) => h.hasData) : heirs.slice(0, 5);

  const deceasedName =
    getFieldValue(values, deceasedFullName) ||
    [
      getFieldValue(values, deceasedFirst),
      getFieldValue(values, deceasedFather),
      getFieldValue(values, deceasedFamily),
    ]
      .filter(Boolean)
      .join(" ");

  const deliveryMatches = (...tokens: string[]) =>
    fieldValueMatches(values, deliveryChannel, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Top: Вх. № / Дата (left) + До Кмета на ... (right) */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text>Вх. № ................................</Text>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text>Дата:</Text>
              <Text style={{ borderBottom: "1pt dotted #555", minWidth: 120, paddingHorizontal: 4 }}>
                {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
              </Text>
              <Text>г.</Text>
            </View>
            <Text style={pdfStyles.caption}>ден, месец, година</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>До Кмета</Text>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text style={{ fontWeight: 700 }}>на:</Text>
              <Text style={{ borderBottom: "1pt dotted #555", flex: 1, paddingHorizontal: 4 }}>
                {getMunicipality(schema).nameBg}
              </Text>
            </View>
            <Text style={pdfStyles.caption}>община/ район/ кметство</Text>
          </View>
        </View>

        <Text style={pdfStyles.title}>ИСКАНЕ</Text>
        <Text style={pdfStyles.subtitle}>ЗА ИЗДАВАНЕ НА УДОСТОВЕРЕНИЕ ЗА НАСЛЕДНИЦИ</Text>

        {/* От: name columns */}
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>От:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.firstName)}</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.fatherName)}</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.familyName)}</Text>
        </View>
        <Text style={pdfStyles.caption}>име: собствено     бащино     фамилно</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.egn)}</Text>
        </View>
        <Text style={pdfStyles.caption}>когато лицето няма ЕГН се посочва дата на раждане</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>ЛНЧ:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.9 }]}>{getFieldValue(values, lnc)}</Text>
          <Text style={pdfStyles.label}>ЕИК по БУЛСТАТ:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.9 }]}>{getFieldValue(values, bulstat)}</Text>
          <Text style={pdfStyles.label}>ЕИК по ЗТР:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.9 }]}>{getFieldValue(values, ztr)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
        </View>
        <Text style={pdfStyles.caption}>посочва се адрес за кореспонденция</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Телефон:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.phone)}</Text>
          <Text style={pdfStyles.label}>Факс:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, fax)}</Text>
          <Text style={pdfStyles.label}>Адрес на електронна поща:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1.4 }]}>{getFieldValue(values, r.email)}</Text>
        </View>

        {/* Deceased */}
        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Желая да ми бъде издадено удостоверение за наследниците на:
        </Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Име:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 3 }]}>{deceasedName}</Text>
        </View>
        <Text style={pdfStyles.caption}>собствено   бащино   фамилно</Text>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Дата на раждане:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, deceasedBirthDate))}
          </Text>
          <Text style={pdfStyles.label}>г.</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Семейно положение:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {getFieldValue(values, deceasedMaritalStatus)}
          </Text>
          <Text style={pdfStyles.label}>Починал/а на:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
            {formatBgDate(getFieldValue(values, deathDate))}
          </Text>
          <Text style={pdfStyles.label}>г.</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>Акт за смърт №</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>{getFieldValue(values, deathActNumber)}</Text>
          <Text style={pdfStyles.label}>/</Text>
          <Text style={[pdfStyles.fillLine, { flex: 0.8 }]}>
            {formatBgDate(getFieldValue(values, deathActDate))}
          </Text>
          <Text style={pdfStyles.label}>г., съставен в:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, deathActPlace)}</Text>
        </View>
        <Text style={pdfStyles.caption}>населено място (държава), област</Text>

        {/* Heirs table */}
        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Същият/ата е оставил/а следните известни ми наследници по закон:
        </Text>
        <View style={{ borderTop: "1pt solid #333", borderLeft: "1pt solid #333", borderRight: "1pt solid #333" }}>
          <View style={{ flexDirection: "row", borderBottom: "1pt solid #333", backgroundColor: "#f2f2f2" }}>
            <Text style={{ width: 28, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>№ по ред</Text>
            <Text style={{ flex: 2.2, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>
              Име: собствено, бащино, фамилно
            </Text>
            <Text style={{ flex: 1.1, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>
              ЕГН / Дата на раждане
            </Text>
            <Text style={{ flex: 1.1, padding: 3, fontSize: 8.5, fontWeight: 700, borderRight: "1pt solid #333" }}>
              Съпруг/а Родство
            </Text>
            <Text style={{ flex: 0.9, padding: 3, fontSize: 8.5, fontWeight: 700 }}>Дата на смърт</Text>
          </View>
          {rowsToRender.map((h) => (
            <View key={h.n}>
              <View style={{ flexDirection: "row", borderBottom: "1pt solid #333", minHeight: 16 }}>
                <Text style={{ width: 28, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>{h.n}.</Text>
                <Text style={{ flex: 2.2, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>
                  {getFieldValue(values, h.name)}
                </Text>
                <Text style={{ flex: 1.1, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>
                  {getFieldValue(values, h.egn)}
                </Text>
                <Text style={{ flex: 1.1, padding: 3, fontSize: 9, borderRight: "1pt solid #333" }}>
                  {getFieldValue(values, h.relation)}
                </Text>
                <Text style={{ flex: 0.9, padding: 3, fontSize: 9 }}>
                  {formatBgDate(getFieldValue(values, h.deathDate))}
                </Text>
              </View>
              <View style={{ flexDirection: "row", borderBottom: "1pt solid #333", minHeight: 14 }}>
                <Text style={{ padding: 3, fontSize: 8.5, fontStyle: "italic", paddingLeft: 34 }}>
                  Постоянен адрес: {getFieldValue(values, h.address)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>
          (Постоянен адрес: област, община, населено място)
        </Text>

        {/* Attachments + delivery choice */}
        <View style={[pdfStyles.row, { marginTop: 6 }]}>
          <Text style={pdfStyles.label}>Прилагам следните документи:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, attachments)}</Text>
        </View>

        <Text style={[pdfStyles.sectionHeader, { fontWeight: 700 }]}>
          Заявявам желанието си издаденото удостоверение да бъде получено:
        </Text>
        <View style={{ marginBottom: 3 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-start" }}>
            <Checkbox checked={deliveryMatches("пощ", "post", "postal_operator")} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 9.5 }}>чрез лицензиран пощенски оператор на адрес:</Text>
                <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, deliveryAddress)}</Text>
              </View>
              <Text style={{ fontSize: 8.5, color: "#555", marginTop: 2 }}>
                като декларирам, че пощенските разходи са за моя сметка, платими при получаването му за
                вътрешни пощенски пратки, и съм съгласен документите да бъдат пренасяни за служебни цели
              </Text>
            </View>
          </View>
          <View style={{ marginLeft: 18 }}>
            <View style={pdfStyles.checkItem}>
              <Checkbox checked={deliveryMatches("вътрешна препоръчана", "domestic_registered")} />
              <Text style={{ fontSize: 9.5 }}>като вътрешна препоръчана пощенска пратка</Text>
            </View>
            <View style={pdfStyles.checkItem}>
              <Checkbox checked={deliveryMatches("куриер", "courier")} />
              <Text style={{ fontSize: 9.5 }}>като вътрешна куриерска пратка</Text>
            </View>
            <View style={pdfStyles.checkItem}>
              <Checkbox checked={deliveryMatches("международна", "international")} />
              <Text style={{ fontSize: 9.5 }}>като международна препоръчана пощенска пратка</Text>
            </View>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={deliveryMatches("гише", "office", "counter", "лично")} />
            <Text style={{ fontSize: 9.5 }}>лично от звеното за административно обслужване</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={deliveryMatches("поща", "email", "e-mail", "електронен")} />
            <Text style={{ fontSize: 9.5 }}>по електронен път на електронна поща</Text>
          </View>
        </View>

        {/* Footer */}
        <View wrap={false} style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Дата:</Text>
            <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", minWidth: 200 }}>
            <Text>Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", flex: 1, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
        <Text style={[pdfStyles.caption, { textAlign: "left" }]}>ден, месец, година</Text>
      </Page>
    </Document>
  );
}
