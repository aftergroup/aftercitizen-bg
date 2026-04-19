/**
 * GR-035 — Отразяване на избор или промяна на режим на имуществените
 * отношения между съпрузи.
 *
 * Spouses file together to record (or change) the property regime of
 * their marriage: legal community, legal separateness, or matrimonial
 * contract (with notary reference when applicable).
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

export default function GR035Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const regime =
    findField(schema, "property_regime") ??
    firstFieldMatching(schema, (f) => f.code.includes("regime") || f.code.includes("property"));
  const spouse2Name =
    findField(schema, "spouse2_full_name") ??
    firstFieldMatching(schema, (f) => f.code.includes("spouse") && f.code.includes("name"));
  const spouse2Egn =
    findField(schema, "spouse2_egn") ??
    firstFieldMatching(schema, (f) => f.code.includes("spouse") && f.code.includes("egn"));
  const marriageActNumber = findField(schema, "marriage_act_number") ?? findField(schema, "act_number");
  const marriageActDate = findField(schema, "marriage_act_date") ?? findField(schema, "act_date");
  const contractNumber =
    findField(schema, "contract_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("contract") && f.code.includes("number"));
  const contractDate =
    findField(schema, "contract_date") ??
    firstFieldMatching(schema, (f) => f.code.includes("contract") && f.code.includes("date"));
  const notary =
    findField(schema, "notary") ??
    firstFieldMatching(schema, (f) => f.code.includes("notary"));

  const regimeMatches = (...tokens: string[]) => fieldValueMatches(values, regime, tokens);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock schema={schema} />
        <HeaderTitle title="ЗАЯВЛЕНИЕ" subtitle={serviceTitle || "за отразяване на избор или промяна на режим на имуществените отношения между съпрузи"} />

        <Text style={pdfStyles.paragraph}>Долуподписани съпрузи:</Text>
        <ApplicantBlock schema={schema} values={values} />

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Другият съпруг</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Име, презиме, фамилия:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, spouse2Name)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>ЕГН:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, spouse2Egn)}</Text>
          </View>
        </View>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Акт за сключен граждански брак</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Акт №:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, marriageActNumber)}</Text>
            <Text style={pdfStyles.kvLabel}>от дата:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
              {formatBgDate(getFieldValue(values, marriageActDate))}
            </Text>
          </View>
        </View>

        <Text style={pdfStyles.paragraph}>
          Избираме / променяме режима на имуществените отношения по чл. 18 от СК
          (отбелязва се в квадратчето):
        </Text>
        <View style={pdfStyles.checkRow}>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={regimeMatches("общност", "community")} />
            <Text>законов режим на общност</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={regimeMatches("разделност", "separateness")} />
            <Text>законов режим на разделност</Text>
          </View>
          <View style={pdfStyles.checkItem}>
            <Checkbox checked={regimeMatches("договор", "contract")} />
            <Text>брачен договор</Text>
          </View>
        </View>

        {regimeMatches("договор", "contract") && (
          <View style={pdfStyles.box}>
            <Text style={pdfStyles.boxHeader}>Реквизити на брачния договор</Text>
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Нотариус:</Text>
              <Text style={pdfStyles.fillLine}>{getFieldValue(values, notary)}</Text>
            </View>
            <View style={pdfStyles.kvRow}>
              <Text style={pdfStyles.kvLabel}>Договор №:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, contractNumber)}</Text>
              <Text style={pdfStyles.kvLabel}>от дата:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {formatBgDate(getFieldValue(values, contractDate))}
              </Text>
            </View>
          </View>
        )}

        <Text style={pdfStyles.paragraph}>
          Известна ни е отговорността по чл. 313 от Наказателния кодекс за
          деклариране на неверни обстоятелства.
        </Text>

        <AttachmentsBlock schema={schema} values={values} />
        <SignatureFooter schema={schema} values={values} />
      </Page>
    </Document>
  );
}
