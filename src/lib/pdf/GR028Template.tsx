/**
 * GR-028 — Издаване на препис от семеен регистър, воден до 1978 г.
 *
 * Historical record copy request. Captures the family/head-of-household
 * identity plus the register volume/page references when known.
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
  ServiceOptionsBlock,
  SignatureFooter,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

export default function GR028Template({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";

  const householdHead =
    findField(schema, "household_head_name") ??
    findField(schema, "subject_full_name") ??
    firstFieldMatching(schema, (f) => (f.code.includes("head") || f.code.includes("subject")) && f.code.includes("name"));
  const registerVolume =
    findField(schema, "register_volume") ??
    firstFieldMatching(schema, (f) => f.code.includes("volume") || f.code.includes("tom"));
  const registerPage =
    findField(schema, "register_page") ??
    firstFieldMatching(schema, (f) => f.code.includes("page"));
  const settlement =
    findField(schema, "settlement") ??
    firstFieldMatching(schema, (f) => f.code.includes("settlement") || f.code.includes("village"));
  const purpose =
    findField(schema, "purpose") ??
    findField(schema, "reason") ??
    firstFieldMatching(schema, (f) => f.code.includes("purpose") || f.code.includes("reason"));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <AddresseeBlock />
        <HeaderTitle title="ИСКАНЕ" subtitle={serviceTitle || "за издаване на препис от семеен регистър, воден до 1978 г."} />
        <ApplicantBlock schema={schema} values={values} />

        <Text style={pdfStyles.salutation}>Уважаеми г-н/г-жо кмет,</Text>
        <Text style={pdfStyles.paragraph}>
          Моля, да ми бъде издаден препис от семейния регистър на населението
          (воден до 1978 г.) за следното семейство:
        </Text>

        <View style={pdfStyles.box}>
          <Text style={pdfStyles.boxHeader}>Данни за издирването</Text>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Глава на семейството:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, householdHead)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Населено място:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, settlement)}</Text>
          </View>
          <View style={pdfStyles.kvRow}>
            <Text style={pdfStyles.kvLabel}>Том:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, registerVolume)}</Text>
            <Text style={pdfStyles.kvLabel}>Страница:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, registerPage)}</Text>
          </View>
        </View>

        {purpose && (
          <>
            <Text style={pdfStyles.paragraph}>Цел:</Text>
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
