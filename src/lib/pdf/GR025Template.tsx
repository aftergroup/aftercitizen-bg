/**
 * GR-025 — Издаване на справки по искане на съдебни изпълнители.
 *
 * ДСИ/ЧСИ (state / private enforcement agent) requests data on a
 * debtor. Applicant block names the agent; subject block names the
 * debtor + the case reference (изп. дело №).
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { getFieldValue } from "./helpers";
import {
  AddresseeBlock,
  ApplicantBlock,
  AttachmentsBlock,
  findField,
  firstFieldMatching,
  HeaderTitle,
  pdfStyles,
  SignatureFooter,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR025Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const debtorName =
    findField(schema, "debtor_full_name") ??
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => (f.code.includes("debtor") || f.code.includes("subject")) && f.code.includes("name"));
  const debtorEgn =
    findField(schema, "debtor_egn") ??
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => (f.code.includes("debtor") || f.code.includes("subject")) && f.code.includes("egn"));
  const caseNumber =
    findField(schema, "case_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("case") || f.code.includes("delo"));
  const caseYear =
    findField(schema, "case_year") ??
    firstFieldMatching(schema, (f) => f.code.includes("case_year"));
  const legalBasis =
    findField(schema, "legal_basis") ??
    firstFieldMatching(schema, (f) => f.code.includes("legal"));
  const requestedInfo =
    findField(schema, "requested_information") ??
    findField(schema, "request_subject_description") ??
    firstFieldMatching(schema, (f) => f.code.includes("requested") || f.code.includes("description"));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock schema={schema} />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на справки по искане на съдебни изпълнители"} />

        <Text style={pdfStyles.paragraph}>От съдебен изпълнител:</Text>
        <ApplicantBlock schema={schema} values={values} compact />

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Реквизити на изпълнителното дело</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Изп. дело №:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, caseNumber)}</Text>
            <Text style={pdfStyles.kvLabel}>Година:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, caseYear)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Правно основание:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, legalBasis)}</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Длъжник</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, debtorName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, debtorEgn)}</Text>
          </View>
        </View>

        <Text style={pdfStyles.paragraph}>Моля, да ми бъде предоставена следната информация:</Text>
        <View style={pdfStyles.requestBody}>
          <Text>{getFieldValue(values, requestedInfo)}</Text>
        </View>

        <AttachmentsBlock schema={schema} values={values} items={2} />
        <SignatureFooter schema={schema} values={values} gdprSubject="искане" />
      </Page>
    </Document>
  );
}
