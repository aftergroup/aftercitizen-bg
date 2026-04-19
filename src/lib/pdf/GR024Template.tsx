/**
 * GR-024 — Промяна в актовете за гражданско състояние.
 *
 * Citizen requests a correction/change to an existing act (birth,
 * marriage, or death). Captures the act reference + the exact field
 * to be changed along with old and new values.
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
  SignatureFooter,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR024Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const actType =
    findField(schema, "act_type") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_type") || f.code.includes("act_kind"));
  const actNumber = findField(schema, "act_number");
  const actDate = findField(schema, "act_date");
  const actMunicipality = findField(schema, "act_municipality");
  const subjectName =
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("name"));
  const subjectEgn =
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("egn"));

  const fieldOld =
    findField(schema, "change_old_value") ??
    firstFieldMatching(schema, (f) => f.code.includes("old"));
  const fieldNew =
    findField(schema, "change_new_value") ??
    firstFieldMatching(schema, (f) => f.code.includes("new"));
  const reason =
    findField(schema, "change_reason") ??
    findField(schema, "reason") ??
    firstFieldMatching(schema, (f) => f.code.includes("reason") || f.code.includes("justification"));

  const typeMatches = (...tokens: string[]) => fieldValueMatches(values, actType, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ЗАЯВЛЕНИЕ" subtitle={serviceTitle || "за промяна в актовете за гражданско състояние"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да бъде извършена промяна в следния акт за гражданско състояние:
        </Text>

        <View style={pdfStyles.checkRow}>
          <Text style={{ fontSize: 10 }}>Вид на акта:</Text>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("раждане", "birth")} />
            <Text>акт за раждане</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("брак", "marriage")} />
            <Text>акт за брак</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("смърт", "death")} />
            <Text>акт за смърт</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Реквизити на акта</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Акт №:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>{getFieldValue(values, actNumber)}</Text>
            <Text style={pdfStyles.kvLabel}>от дата:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 0.7 }]}>
              {formatBgDate(getFieldValue(values, actDate))}
            </Text>
            <Text style={pdfStyles.kvLabel}>съставен в:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, actMunicipality)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Лице по акта:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 2 }]}>{getFieldValue(values, subjectName)}</Text>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, subjectEgn)}</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Поискана промяна</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>От (старо):</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, fieldOld)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>На (ново):</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, fieldNew)}</Text>
          </View>
        </View>

        {reason && (
          <>
            <Text style={pdfStyles.paragraph}>Основание / мотив за промяната:</Text>
            <View style={pdfStyles.requestBody}>
              <Text>{getFieldValue(values, reason)}</Text>
            </View>
          </>
        )}

        <AttachmentsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} />
      </Page>
    </Document>
  );
}
