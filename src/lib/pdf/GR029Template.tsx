/**
 * GR-029 — Съставяне на актове за гражданско състояние на български
 * граждани, които имат актове, съставени в чужбина.
 *
 * Citizen requests transcription of a foreign-issued civil-status act
 * into the Bulgarian registry. Captures the foreign act reference +
 * subject + type, and a note about the foreign document attached.
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

export default function GR029Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const actType = findField(schema, "act_type") ?? firstFieldMatching(schema, (f) => f.code.includes("act_type"));
  const foreignCountry =
    findField(schema, "foreign_country") ??
    firstFieldMatching(schema, (f) => f.code.includes("country") || f.code.includes("state"));
  const foreignAuthority =
    findField(schema, "foreign_authority") ??
    firstFieldMatching(schema, (f) => f.code.includes("authority"));
  const foreignActDate =
    findField(schema, "foreign_act_date") ??
    findField(schema, "act_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_date") || f.code.includes("event_date"));
  const foreignActNumber =
    findField(schema, "foreign_act_number") ??
    findField(schema, "act_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("act_number"));
  const subjectName =
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("name"));
  const subjectEgn =
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("egn"));

  const typeMatches = (...tokens: string[]) => fieldValueMatches(values, actType, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock schema={schema} />
        <HeaderTitle title="ЗАЯВЛЕНИЕ" subtitle={serviceTitle || "за съставяне на акт за гражданско състояние въз основа на чуждестранен документ"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да бъде съставен български акт за гражданско състояние въз основа
          на приложен чуждестранен документ (отбелязва се в квадратчето):
        </Text>

        <View style={pdfStyles.checkRow}>
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
          <Text style={pdfStyles.boxHeader}>Лице по акта</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectEgn)}</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Чуждестранен документ</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Държава:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, foreignCountry)}</Text>
            <Text style={pdfStyles.kvLabel}>Издал орган:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1.5 }]}>{getFieldValue(values, foreignAuthority)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Акт №:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, foreignActNumber)}</Text>
            <Text style={pdfStyles.kvLabel}>от дата:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, foreignActDate))}
            </Text>
          </View>
        </View>

        <AttachmentsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} />
      </Page>
    </Document>
  );
}
