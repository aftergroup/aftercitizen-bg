/**
 * GR-034 — Издаване на удостоверения за настойничество и попечителство
 * (учредено по реда на чл. 155 от СК и по право — по чл. 173 от СК).
 *
 * Certificate of guardianship/custody. Captures the ward (малолетния /
 * непълнолетния / поставеното под запрещение лице) and the guardian's
 * appointment basis.
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
  AddresseeBlock,
  ApplicantBlock,
  AttachmentsBlock,
  Checkbox,
  fieldValueMatches,
  findField,
  firstFieldMatching,
  HeaderTitle,
  pdfStyles,
  ServiceOptionsBlock,
  SignatureFooter,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR034Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const role =
    findField(schema, "guardian_role") ??
    firstFieldMatching(schema, (f) => f.code.includes("role") || f.code.includes("type"));
  const basis =
    findField(schema, "appointment_basis") ??
    firstFieldMatching(schema, (f) => f.code.includes("basis") || f.code.includes("article"));
  const wardName =
    findField(schema, "ward_full_name") ??
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => (f.code.includes("ward") || f.code.includes("subject")) && f.code.includes("name"));
  const wardEgn =
    findField(schema, "ward_egn") ??
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => (f.code.includes("ward") || f.code.includes("subject")) && f.code.includes("egn"));
  const wardBirthDate =
    findField(schema, "ward_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("ward") && f.code.includes("birth"));
  const actNumber = findField(schema, "act_number") ?? firstFieldMatching(schema, (f) => f.code.includes("decision_number"));
  const actDate = findField(schema, "act_date") ?? firstFieldMatching(schema, (f) => f.code.includes("decision_date"));

  const roleMatches = (...tokens: string[]) => fieldValueMatches(values, role, tokens);
  const basisMatches = (...tokens: string[]) => fieldValueMatches(values, basis, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на удостоверение за настойничество и попечителство"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издадено удостоверение, че съм определен за (отбелязва се в квадратчето):
        </Text>

        <View style={pdfStyles.checkRow}>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={roleMatches("настойник", "guardian")} />
            <Text>настойник</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={roleMatches("попечител", "custodian")} />
            <Text>попечител</Text>
          </View>
        </View>

        <View style={[pdfStyles.checkRow, { marginTop: 6 }]}>
          <Text style={{ fontSize: 10 }}>Основание:</Text>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={basisMatches("155", "appointed", "назначен")} />
            <Text>чл. 155 от СК (назначено)</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={basisMatches("173", "by law", "по право")} />
            <Text>чл. 173 от СК (по право)</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Лице под настойничество / попечителство</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, wardName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, wardEgn)}</Text>
            <Text style={pdfStyles.kvLabel}>Дата на раждане:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, wardBirthDate))}
            </Text>
          </View>
          {(actNumber || actDate) && (
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Акт / решение №:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, actNumber)}</Text>
              <Text style={pdfStyles.kvLabel}>от дата:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {formatBgDate(getFieldValue(values, actDate))}
              </Text>
            </View>
          )}
        </View>

        <AttachmentsBlock schema={schema} values={values} />
        <ServiceOptionsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} gdprSubject="искане" />
      </Page>
    </Document>
  );
}
