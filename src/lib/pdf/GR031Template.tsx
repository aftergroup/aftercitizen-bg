/**
 * GR-031 — Издаване на многоезично извлечение от акт за гражданско
 * състояние (EU Regulation 2016/1191 / Виенска конвенция 1976).
 *
 * The subject is the act referenced (birth / marriage / death) and
 * the act number/date/municipality; languages are pre-printed on the
 * EU form, so the Bulgarian blank only captures which act type.
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

export default function GR031Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const actType = findField(schema, "act_type");
  const subjectName =
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("name"));
  const subjectEgn =
    findField(schema, "subject_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("subject") && f.code.includes("egn"));
  const actNumber = findField(schema, "act_number");
  const actDate = findField(schema, "act_date");
  const actMunicipality = findField(schema, "act_municipality");

  const typeMatches = (...tokens: string[]) => fieldValueMatches(values, actType, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на многоезично извлечение от акт за гражданско състояние"} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издадено многоезично извлечение от (отбелязва се в квадратчето):
        </Text>

        <View style={pdfStyles.checkRow}>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("раждане", "birth")} />
            <Text>акт за раждане</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("брак", "marriage")} />
            <Text>акт за граждански брак</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={typeMatches("смърт", "death")} />
            <Text>акт за смърт</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Лице / акт</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectName)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, subjectEgn)}</Text>
          </View>
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
        </View>

        <Text style={pdfStyles.paragraph}>
          Извлечението се издава на основание Регламент (ЕС) 2016/1191 и Виенската
          конвенция за издаване на многоезични извлечения от актове за гражданско
          състояние от 08.09.1976 г.
        </Text>

        <AttachmentsBlock schema={schema} values={values} />
        <ServiceOptionsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} gdprSubject="искане" />
      </Page>
    </Document>
  );
}
