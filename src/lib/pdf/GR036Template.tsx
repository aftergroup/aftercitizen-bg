/**
 * GR-036 — Издаване на удостоверение за родителски права.
 *
 * Certificate confirming who holds parental rights over a child —
 * typically used abroad or in proceedings where the parent must
 * prove the rights haven't been restricted or transferred.
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
  AddresseeBlock,
  ApplicantBlock,
  AttachmentsBlock,
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

export default function GR036Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const childName =
    findField(schema, "child_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("name"));
  const childEgn =
    findField(schema, "child_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("egn"));
  const childBirthDate =
    findField(schema, "child_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("birth"));
  const otherParent =
    findField(schema, "other_parent_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("other_parent") || (f.code.includes("parent") && f.code.includes("name")));
  const purpose =
    findField(schema, "purpose") ??
    findField(schema, "reason") ??
    firstFieldMatching(schema, (f) => f.code.includes("purpose") || f.code.includes("reason"));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock schema={schema} />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на удостоверение за родителски права"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издадено удостоверение относно родителските права
          върху следното дете:
        </Text>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Дете</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, childName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, childEgn)}</Text>
            <Text style={pdfStyles.kvLabel}>Дата на раждане:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, childBirthDate))}
            </Text>
          </View>
          {otherParent && (
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Друг родител:</Text>
              <Text style={pdfStyles.fillLine}>{getFieldValue(values, otherParent)}</Text>
            </View>
          )}
        </View>

        {purpose && (
          <>
            <Text style={pdfStyles.paragraph}>Необходимо ми е за:</Text>
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
