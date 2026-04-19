/**
 * GR-033 — Комплектоване и проверка на документи към искане за
 * установяване на българско гражданство.
 *
 * Applicant (usually the person seeking recognition of Bulgarian
 * citizenship, or their authorized representative) submits the
 * supporting-document packet that will be forwarded to the Ministry
 * of Justice for checking.
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
  SignatureFooter,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR033Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const subjectName =
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("name"));
  const subjectBirthDate =
    findField(schema, "subject_birth_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("birth"));
  const subjectBirthPlace =
    findField(schema, "subject_birth_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("place"));
  const parentName =
    findField(schema, "parent_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("parent") && f.code.includes("name"));
  const notes =
    findField(schema, "request_note") ??
    findField(schema, "notes") ??
    firstFieldMatching(schema, (f) => f.code.includes("note") || f.code.includes("description"));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ЗАЯВЛЕНИЕ" subtitle={serviceTitle || "за комплектоване и проверка на документи към искане за установяване на българско гражданство"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да бъдат комплектовани и проверени документите ми, необходими за
          разглеждане на искане за установяване на българско гражданство от
          Министерство на правосъдието. Данните за лицето, за което се установява
          гражданството, са както следва:
        </Text>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Лице, за което се установява гражданството</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Дата на раждане:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, subjectBirthDate))}
            </Text>
            <Text style={pdfStyles.kvLabel}>Място на раждане:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1.2 }]}>{getFieldValue(values, subjectBirthPlace)}</Text>
          </View>
          {parentName && (
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Родител (български гражданин):</Text>
              <Text style={pdfStyles.fillLine}>{getFieldValue(values, parentName)}</Text>
            </View>
          )}
        </View>

        {notes && (
          <>
            <Text style={pdfStyles.paragraph}>Бележки:</Text>
            <View style={pdfStyles.requestBody}>
              <Text>{getFieldValue(values, notes)}</Text>
            </View>
          </>
        )}

        <AttachmentsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} />
      </Page>
    </Document>
  );
}
