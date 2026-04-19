/**
 * GR-011 — Издаване на удостоверение за раждане (оригинал).
 *
 * Parallel to GR-012 (duplicate) but tailored for the first issue
 * off a newly composed акт за раждане. Subject block names the child
 * whose birth certificate is being issued; the акт-reference block
 * captures act number / date / municipality.
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

export default function GR011Template({ schema, values }: Props) {
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
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("birth_date"));
  const childBirthPlace =
    findField(schema, "child_birth_place") ??
    firstFieldMatching(schema, (f) => f.code.includes("child") && f.code.includes("place"));
  const actNumber = findField(schema, "act_number");
  const actDate = findField(schema, "act_date");
  const actMunicipality = findField(schema, "act_municipality");

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock schema={schema} />
        <HeaderTitle
          title="ЗАЯВЛЕНИЕ"
          subtitle={serviceTitle || "за издаване на удостоверение за раждане — оригинал"}
        />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издадено удостоверение за раждане (оригинал) на следното лице:
        </Text>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Данни за лицето, за което се иска удостоверението</Text>
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
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Място на раждане:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, childBirthPlace)}</Text>
          </View>
          {(actNumber || actDate || actMunicipality) && (
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Акт за раждане №:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>
                {getFieldValue(values, actNumber)}
              </Text>
              <Text style={pdfStyles.kvLabel}>от дата:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>
                {formatBgDate(getFieldValue(values, actDate))}
              </Text>
              <Text style={pdfStyles.kvLabel}>съставен в:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, actMunicipality)}
              </Text>
            </View>
          )}
        </View>

        <AttachmentsBlock schema={schema} values={values} />
        <ServiceOptionsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} />
      </Page>
    </Document>
  );
}
