/**
 * GR-026 — Издаване на заверен препис или копие от личен регистрационен
 * картон (ЛРК) или страница от семейния регистър на населението.
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { getFieldValue } from "./helpers";
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

export default function GR026Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const documentKind =
    findField(schema, "document_kind") ??
    firstFieldMatching(schema, (f) => f.code.includes("kind") || f.code.includes("document_type"));
  const subjectName =
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("name"));
  const subjectEgn =
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("egn"));
  const purpose =
    findField(schema, "purpose") ??
    findField(schema, "reason") ??
    firstFieldMatching(schema, (f) => f.code.includes("purpose") || f.code.includes("reason"));

  const kindMatches = (...tokens: string[]) => fieldValueMatches(values, documentKind, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на заверен препис или копие"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издаден заверен препис или копие от (отбелязва се в квадратчето):
        </Text>

        <View style={pdfStyles.checkRow}>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={kindMatches("ЛРК", "lrk", "личен")} />
            <Text>личен регистрационен картон (ЛРК)</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={kindMatches("семеен", "family")} />
            <Text>страница от семейния регистър на населението</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Лице, за което се иска копието</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectEgn)}</Text>
          </View>
        </View>

        {purpose && (
          <>
            <Text style={pdfStyles.paragraph}>Цел на използване:</Text>
            <View style={pdfStyles.requestBody}>
              <Text>{getFieldValue(values, purpose)}</Text>
            </View>
          </>
        )}

        <AttachmentsBlock schema={schema} values={values} />
        <ServiceOptionsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} gdprSubject="искане" />
      </Page>
    </Document>
  );
}
