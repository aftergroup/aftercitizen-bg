/**
 * Shell for Човешки ресурси и правно обслужване services (HR-001 …
 * HR-005). The blanks differ widely but share a common spine:
 *
 *   До Кмета на район ____ (top)
 *   Title: МОЛБА | ЗАЯВЛЕНИЕ (per service)
 *   Subtitle: legal basis / service title
 *   Applicant block: Долуподписаната/-ият, ЕГН, Л.К. №, МВР,
 *     постоянен адрес
 *   МОЛЯ / ЗАЯВЯВАМ free-text body
 *   ПРИЛОЖЕНИЕ numbered list
 *   Подпис footer
 *
 * HR-001 adds a second-page ДЕКЛАРАЦИЯ по чл. 117 КМЧП; this template
 * renders it when the service code matches.
 */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { RenderedForm } from "@/lib/types";
import { formatBgDate, getFieldValue } from "./helpers";
import {
  findField,
  firstFieldMatching,
  getMunicipality,
  pdfStyles,
  resolveApplicantFields,
} from "./shared";
import "./setupFonts";

interface Props {
  schema: RenderedForm;
  values: Record<string, string>;
}

const TITLE: Record<string, { kind: string; subtitle: string; needsDeclaration?: boolean }> = {
  "HR-001": {
    kind: "МОЛБА",
    subtitle: "по чл. 118, ал. 1 от Кодекса на международното частно право",
    needsDeclaration: true,
  },
  "HR-002": {
    kind: "МОЛБА",
    subtitle: "за учредяване на настойничество и попечителство",
  },
  "HR-003": {
    kind: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на удостоверение за настойничество и попечителство",
  },
  "HR-004": {
    kind: "ЗАЯВЛЕНИЕ",
    subtitle: "за издаване на УП-2 / УП-3",
  },
  "HR-005": {
    kind: "ЗАЯВЛЕНИЕ",
    subtitle: "други формуляри",
  },
};

export default function HRShellTemplate({ schema, values }: Props) {
  const { form, service } = schema;
  const serviceCode = service?.["Service Code"] ?? form["Form Code"] ?? "";
  const serviceTitle = service?.["Service Title BG"] ?? form["Form Title BG"] ?? "";
  const variant = TITLE[serviceCode] ?? { kind: "ЗАЯВЛЕНИЕ", subtitle: serviceTitle };

  const r = resolveApplicantFields(schema);

  // --- HR-001 foreign court fields ---
  const court =
    findField(schema, "foreign_court_name") ??
    findField(schema, "foreign_court") ??
    firstFieldMatching(schema, (f) => f.code.includes("court") && !f.code.includes("country") && !f.code.includes("case"));
  const caseNumber =
    findField(schema, "foreign_court_case_number") ??
    findField(schema, "case_number") ??
    firstFieldMatching(schema, (f) => f.code.includes("case_number") || f.code.includes("delo"));
  const country =
    findField(schema, "foreign_court_country") ??
    findField(schema, "foreign_country") ??
    firstFieldMatching(schema, (f) => (f.code.includes("country") || f.code.includes("state")) && !f.code.includes("destination"));
  const grounds =
    findField(schema, "foreign_court_grounds") ??
    findField(schema, "legal_grounds") ??
    firstFieldMatching(schema, (f) => f.code.includes("ground") || f.code.includes("reason"));
  const parties =
    findField(schema, "foreign_court_parties") ??
    firstFieldMatching(schema, (f) => f.code.includes("parties"));
  const declNoBgDecision = findField(schema, "declaration_no_bg_decision");
  const declNoPendingCase = findField(schema, "declaration_no_pending_bg_case");

  // --- HR-002 / HR-003 / HR-005 ward fields (поднастойник/попечител) ---
  const wardFirstName = findField(schema, "ward_first_name");
  const wardFatherName = findField(schema, "ward_father_name");
  const wardFamilyName = findField(schema, "ward_family_name");
  const wardEgn = findField(schema, "ward_egn");
  const wardIdDocNumber = findField(schema, "ward_id_doc_number");
  const wardIdDocIssueDate = findField(schema, "ward_id_doc_issue_date");
  const wardIdDocIssuer = findField(schema, "ward_id_doc_issuer");
  const wardCurrentAddress = findField(schema, "ward_current_address");
  const wardPermanentAddress = findField(schema, "ward_permanent_address");
  const wardRelation = findField(schema, "ward_relation");

  // --- HR-004 employment fields (УП-2 / УП-3) ---
  const emplStart = findField(schema, "employment_start_date");
  const emplEnd = findField(schema, "employment_end_date");
  const emplEmployer = findField(schema, "employment_employer");
  const emplPosition = findField(schema, "employment_position");

  // Current / permanent address for the declarant
  const currentAddress = findField(schema, "applicant_current_address");
  const permanentAddress =
    findField(schema, "applicant_permanent_address") ??
    findField(schema, "correspondence_address") ??
    r.address;

  // Free-text fallback body (HR-005 "другo" or legacy overrides).
  const requestBody =
    findField(schema, "service_description") ??
    findField(schema, "request_body") ??
    findField(schema, "request_subject_description") ??
    firstFieldMatching(schema, (f) => f.code.includes("request") && !f.code.includes("date"));

  const signatureDate =
    findField(schema, "signature_date") ??
    firstFieldMatching(
      schema,
      (f) => f.code.includes("date") && !f.code.includes("birth") && !f.code.includes("issue"),
    );
  const signatureField =
    findField(schema, "signature") ??
    firstFieldMatching(schema, (f) => f.typeCode === "signature" || f.htmlInput === "canvas");
  const signatureValue = getFieldValue(values, signatureField);
  const signatureIsImage =
    typeof signatureValue === "string" && signatureValue.startsWith("data:image");
  const todaysDateBg = formatBgDate(new Date().toISOString().slice(0, 10));

  const declarantName = [
    getFieldValue(values, r.firstName),
    getFieldValue(values, r.fatherName),
    getFieldValue(values, r.familyName),
  ]
    .filter(Boolean)
    .join(" ");

  const idCardNumber = findField(schema, "id_card_number") ?? r.idDocNumber;
  const idCardIssuer = findField(schema, "id_card_issuer") ?? r.idDocIssuer;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ marginBottom: 12 }}>
          <Text>До</Text>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Кмета на район</Text>
            <Text style={{ borderBottom: "1pt dotted #555", flex: 1, paddingHorizontal: 4 }}>
              {getMunicipality(schema).nameShort}
            </Text>
          </View>
        </View>

        <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 6, marginTop: 6 }}>
          {variant.kind}
        </Text>
        <Text style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, marginBottom: 14 }}>
          {variant.subtitle}
        </Text>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Долуподписаната/-ият:</Text>
          <Text style={pdfStyles.fillLine}>{declarantName}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>ЕГН:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.egn)}</Text>
          <Text style={pdfStyles.label}>л.к. №:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, idCardNumber)}</Text>
          <Text style={pdfStyles.label}>издадена от МВР:</Text>
          <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, idCardIssuer)}</Text>
        </View>

        <View style={[pdfStyles.row, { marginTop: 4 }]}>
          <Text style={pdfStyles.label}>с постоянен адрес:</Text>
          <Text style={pdfStyles.fillLine}>{getFieldValue(values, permanentAddress)}</Text>
        </View>

        {currentAddress && (
          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            <Text style={pdfStyles.label}>и настоящ адрес:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, currentAddress)}</Text>
          </View>
        )}

        {(r.phone || r.email) && (
          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            {r.phone && (
              <>
                <Text style={pdfStyles.label}>тел.:</Text>
                <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.phone)}</Text>
              </>
            )}
            {r.email && (
              <>
                <Text style={pdfStyles.label}>е-поща:</Text>
                <Text style={[pdfStyles.fillLine, { flex: 1.6 }]}>{getFieldValue(values, r.email)}</Text>
              </>
            )}
          </View>
        )}

        <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
          {serviceCode === "HR-002" || serviceCode === "HR-001" ? "МОЛЯ," : "ЗАЯВЯВАМ,"}
        </Text>

        {serviceCode === "HR-001" ? (
          <>
            <View style={pdfStyles.numberedItem}>
              <Text style={pdfStyles.numberedIndex}>1.</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
                  <Text>Да бъде признато съдебно решение на</Text>
                  <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, court)}</Text>
                  <Text>съд, по дело №</Text>
                  <Text style={[pdfStyles.fillLine, { flex: 0.6 }]}>{getFieldValue(values, caseNumber)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 4 }}>
                  <Text>с основание и искане</Text>
                  <Text style={pdfStyles.fillLine}>{getFieldValue(values, grounds)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 4 }}>
                  <Text>държава</Text>
                  <Text style={pdfStyles.fillLine}>{getFieldValue(values, country)}</Text>
                  <Text>, тъй като са налице условията на чл. 117 от КМЧП.</Text>
                </View>
              </View>
            </View>
            <View style={[pdfStyles.numberedItem, { marginTop: 6 }]}>
              <Text style={pdfStyles.numberedIndex}>2.</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>
                Да бъдат направени съответните вписвания в регистрите по гражданско състояние и
                на населението въз основа на признатото чуждестранно съдебно решение.
              </Text>
            </View>

            <Text style={{ fontWeight: 700, marginTop: 10 }}>ПРИЛОЖЕНИЕ:</Text>
            <Text style={{ marginLeft: 16, fontSize: 10 }}>
              1. Препис от решението, заверен от съда, който го е постановил;{"\n"}
              2. Удостоверение от същия съд, че решението е влязло в сила.{"\n"}
              <Text style={{ fontStyle: "italic" }}>
                (Тези документи трябва да бъдат заверени от Министерството на външните работи на
                Република България.)
              </Text>{"\n"}
              3. Декларация по чл. 117, т. 3 и т. 4 от КМЧП.{"\n"}
              4. Пълномощно (когато молбата се подава от пълномощник).
            </Text>
          </>
        ) : serviceCode === "HR-002" ? (
          <HR002Body
            values={values}
            wardFirst={wardFirstName}
            wardFather={wardFatherName}
            wardFamily={wardFamilyName}
            wardEgn={wardEgn}
            wardIdDocNumber={wardIdDocNumber}
            wardIdDocIssueDate={wardIdDocIssueDate}
            wardIdDocIssuer={wardIdDocIssuer}
            wardCurrentAddress={wardCurrentAddress}
            wardPermanentAddress={wardPermanentAddress}
            wardRelation={wardRelation}
            requestBody={requestBody}
          />
        ) : serviceCode === "HR-003" ? (
          <HR003Body
            values={values}
            wardFirst={wardFirstName}
            wardFather={wardFatherName}
            wardFamily={wardFamilyName}
            wardEgn={wardEgn}
            wardIdDocNumber={wardIdDocNumber}
            wardIdDocIssuer={wardIdDocIssuer}
            wardCurrentAddress={wardCurrentAddress}
            wardPermanentAddress={wardPermanentAddress}
            wardRelation={wardRelation}
          />
        ) : serviceCode === "HR-004" ? (
          <HR004Body
            values={values}
            emplStart={emplStart}
            emplEnd={emplEnd}
            emplEmployer={emplEmployer}
            emplPosition={emplPosition}
          />
        ) : (
          <HR005Body
            values={values}
            serviceTitle={serviceTitle}
            wardFirst={wardFirstName}
            wardFather={wardFatherName}
            wardFamily={wardFamilyName}
            wardEgn={wardEgn}
            wardIdDocNumber={wardIdDocNumber}
            wardIdDocIssuer={wardIdDocIssuer}
            wardCurrentAddress={wardCurrentAddress}
            wardPermanentAddress={wardPermanentAddress}
            requestBody={requestBody}
          />
        )}

        <View wrap={false} style={{ marginTop: 26, flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
            <Text>Дата:</Text>
            <Text style={{ borderBottom: "1pt dotted #333", minWidth: 140, paddingHorizontal: 4 }}>
              {formatBgDate(getFieldValue(values, signatureDate)) || todaysDateBg}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", minWidth: 220 }}>
            <Text>Подпис:</Text>
            {signatureIsImage ? (
              <View style={{ width: 140, height: 32, borderBottom: "1pt solid #333" }}>
                <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : (
              <Text style={{ borderBottom: "1pt dotted #333", flex: 1, minHeight: 20 }}> </Text>
            )}
          </View>
        </View>
      </Page>

      {variant.needsDeclaration && (
        <Page size="A4" style={pdfStyles.page}>
          <Text style={{ textAlign: "center", fontSize: 16, fontWeight: 700, letterSpacing: 6, marginTop: 6 }}>
            Д Е К Л А Р А Ц И Я
          </Text>
          <Text style={{ textAlign: "center", fontSize: 10.5, fontStyle: "italic", marginBottom: 14 }}>
            по чл. 117, т. 3 и т. 4 от КМЧП
          </Text>

          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Долуподписаната/-ият:</Text>
            <Text style={pdfStyles.fillLine}>{declarantName}</Text>
          </View>

          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            <Text style={pdfStyles.label}>ЕГН:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, r.egn)}</Text>
            <Text style={pdfStyles.label}>л.к. №:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, idCardNumber)}</Text>
          </View>

          <View style={[pdfStyles.row, { marginTop: 4 }]}>
            <Text style={pdfStyles.label}>с постоянен адрес:</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, r.address)}</Text>
          </View>

          <Text style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>ДЕКЛАРИРАМ,</Text>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginBottom: 4 }}>
            <Text>че между</Text>
            <Text style={pdfStyles.fillLine}>{declarantName}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginBottom: 4 }}>
            <Text>и</Text>
            <Text style={pdfStyles.fillLine}> </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginBottom: 4 }}>
            <Text>страни по дело №</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, caseNumber)}</Text>
            <Text>, с основание и искане</Text>
          </View>
          <Text style={pdfStyles.fillBoxLarge}>{getFieldValue(values, grounds)}</Text>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 4 }}>
            <Text>държава</Text>
            <Text style={pdfStyles.fillLine}>{getFieldValue(values, country)}</Text>
          </View>

          <Text style={{ marginTop: 10, fontSize: 10 }}>
            1. На същото основание и за същото искане няма влязло в сила решение на български съд.
          </Text>
          <Text style={{ fontSize: 10 }}>
            2. На същото основание и за същото искане няма висящ процес пред български съд,
            образуван преди чуждото дело, по което е постановено решението, чието признаване и
            изпълнение се иска.
          </Text>
          <Text style={{ marginTop: 6, fontSize: 10 }}>
            Известна ми е отговорността по чл. 313 от Наказателния кодекс за посочване на неверни
            данни.
          </Text>

          {(declNoBgDecision || declNoPendingCase || parties) && (
            <View style={{ marginTop: 8 }}>
              {parties && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>Страни по делото:</Text>
                  <Text style={pdfStyles.fillLine}>{getFieldValue(values, parties)}</Text>
                </View>
              )}
            </View>
          )}

          <View wrap={false} style={{ marginTop: 40, alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "flex-end" }}>
              <Text style={{ fontWeight: 700 }}>ДЕКЛАРАТОР:</Text>
              {signatureIsImage ? (
                <View style={{ width: 160, height: 32, borderBottom: "1pt solid #333" }}>
                  <Image src={signatureValue} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </View>
              ) : (
                <Text style={{ borderBottom: "1pt dotted #333", minWidth: 200, minHeight: 20 }}> </Text>
              )}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Per-service body sub-components.                                   */
/* Each renders the request-specific block (the middle of the page)   */
/* between applicant identity and signature footer.                   */
/* ------------------------------------------------------------------ */

interface WardProps {
  values: Record<string, string>;
  wardFirst?: import("@/lib/types").RenderedField;
  wardFather?: import("@/lib/types").RenderedField;
  wardFamily?: import("@/lib/types").RenderedField;
  wardEgn?: import("@/lib/types").RenderedField;
  wardIdDocNumber?: import("@/lib/types").RenderedField;
  wardIdDocIssueDate?: import("@/lib/types").RenderedField;
  wardIdDocIssuer?: import("@/lib/types").RenderedField;
  wardCurrentAddress?: import("@/lib/types").RenderedField;
  wardPermanentAddress?: import("@/lib/types").RenderedField;
  wardRelation?: import("@/lib/types").RenderedField;
  requestBody?: import("@/lib/types").RenderedField;
  serviceTitle?: string;
}

function wardFullName(values: Record<string, string>, props: WardProps): string {
  return [
    getFieldValue(values, props.wardFirst),
    getFieldValue(values, props.wardFather),
    getFieldValue(values, props.wardFamily),
  ]
    .filter(Boolean)
    .join(" ");
}

function WardBlock(props: WardProps & { includeIdDocDate?: boolean }) {
  const { values, includeIdDocDate = true } = props;
  const name = wardFullName(values, props);
  return (
    <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 8, borderLeft: "1pt solid #999" }}>
      <View style={pdfStyles.row}>
        <Text style={pdfStyles.label}>за поднастойния / попечителствания:</Text>
        <Text style={pdfStyles.fillLine}>{name}</Text>
      </View>
      <Text style={[pdfStyles.helper, { textAlign: "left" }]}>(име, презиме, фамилия)</Text>

      <View style={[pdfStyles.row, { marginTop: 2 }]}>
        <Text style={pdfStyles.label}>ЕГН:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 1 }]}>{getFieldValue(values, props.wardEgn)}</Text>
        {props.wardRelation && (
          <>
            <Text style={pdfStyles.label}>Родствена връзка:</Text>
            <Text style={[pdfStyles.fillLine, { flex: 1.2 }]}>
              {getFieldValue(values, props.wardRelation)}
            </Text>
          </>
        )}
      </View>

      {(props.wardIdDocNumber || props.wardIdDocIssuer) && (
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          {props.wardIdDocNumber && (
            <>
              <Text style={pdfStyles.label}>л.к. №:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {getFieldValue(values, props.wardIdDocNumber)}
              </Text>
            </>
          )}
          {includeIdDocDate && props.wardIdDocIssueDate && (
            <>
              <Text style={pdfStyles.label}>от:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
                {formatBgDate(getFieldValue(values, props.wardIdDocIssueDate))}
              </Text>
            </>
          )}
          {props.wardIdDocIssuer && (
            <>
              <Text style={pdfStyles.label}>МВР:</Text>
              <Text style={[pdfStyles.fillLine, { flex: 1.2 }]}>
                {getFieldValue(values, props.wardIdDocIssuer)}
              </Text>
            </>
          )}
        </View>
      )}

      {props.wardPermanentAddress && (
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          <Text style={pdfStyles.label}>постоянен адрес:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, props.wardPermanentAddress)}
          </Text>
        </View>
      )}
      {props.wardCurrentAddress && (
        <View style={[pdfStyles.row, { marginTop: 2 }]}>
          <Text style={pdfStyles.label}>настоящ адрес:</Text>
          <Text style={pdfStyles.fillLine}>
            {getFieldValue(values, props.wardCurrentAddress)}
          </Text>
        </View>
      )}
    </View>
  );
}

function HR002Body(props: WardProps) {
  return (
    <>
      <Text style={{ marginBottom: 4, fontSize: 10 }}>
        да бъде учредено настойничество / попечителство
      </Text>
      <WardBlock {...props} />
      {props.requestBody && (
        <View style={pdfStyles.requestBody}>
          <Text>{getFieldValue(props.values, props.requestBody)}</Text>
        </View>
      )}
      <Text style={{ fontWeight: 700, marginTop: 10 }}>ПРИЛОЖЕНИЕ:</Text>
      <Text style={{ marginLeft: 16, fontSize: 10 }}>
        1. Удостоверение за смърт / решение на съд / други документи, доказващи основанието;{"\n"}
        2. Удостоверение за наследници;{"\n"}
        3. Документ за самоличност на заявителя (копие);{"\n"}
        4. Пълномощно (когато молбата се подава от пълномощник).
      </Text>
    </>
  );
}

function HR003Body(props: WardProps) {
  return (
    <>
      <Text style={{ marginBottom: 4, fontSize: 10 }}>
        да ми бъде издадено удостоверение за настойничество / попечителство
      </Text>
      <WardBlock {...props} includeIdDocDate={false} />
      <Text style={{ fontWeight: 700, marginTop: 10 }}>ПРИЛОЖЕНИЕ:</Text>
      <Text style={{ marginLeft: 16, fontSize: 10 }}>
        1. Документ за самоличност (копие);{"\n"}
        2. Пълномощно (когато заявлението се подава от пълномощник).
      </Text>
    </>
  );
}

interface HR004Props {
  values: Record<string, string>;
  emplStart?: import("@/lib/types").RenderedField;
  emplEnd?: import("@/lib/types").RenderedField;
  emplEmployer?: import("@/lib/types").RenderedField;
  emplPosition?: import("@/lib/types").RenderedField;
}

function HR004Body({ values, emplStart, emplEnd, emplEmployer, emplPosition }: HR004Props) {
  return (
    <>
      <Text style={{ marginBottom: 6, fontSize: 10 }}>
        да ми бъде издадено удостоверение УП-2 / УП-3 за следния период на трудов стаж:
      </Text>
      <View style={pdfStyles.row}>
        <Text style={pdfStyles.label}>от:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
          {formatBgDate(getFieldValue(values, emplStart))}
        </Text>
        <Text style={pdfStyles.label}>до:</Text>
        <Text style={[pdfStyles.fillLine, { flex: 1 }]}>
          {formatBgDate(getFieldValue(values, emplEnd))}
        </Text>
      </View>
      <View style={[pdfStyles.row, { marginTop: 4 }]}>
        <Text style={pdfStyles.label}>Месторабота / отдел:</Text>
        <Text style={pdfStyles.fillLine}>{getFieldValue(values, emplEmployer)}</Text>
      </View>
      <View style={[pdfStyles.row, { marginTop: 4 }]}>
        <Text style={pdfStyles.label}>Длъжност:</Text>
        <Text style={pdfStyles.fillLine}>{getFieldValue(values, emplPosition)}</Text>
      </View>
      <Text style={{ fontWeight: 700, marginTop: 10 }}>ПРИЛОЖЕНИЕ:</Text>
      <Text style={{ marginLeft: 16, fontSize: 10 }}>
        1. Документ за самоличност (копие);{"\n"}
        2. Трудова книжка / заповед за назначаване и освобождаване (копие);{"\n"}
        3. Пълномощно (когато заявлението се подава от пълномощник).
      </Text>
    </>
  );
}

function HR005Body(props: WardProps) {
  const { values, serviceTitle, requestBody } = props;
  const hasWard = !!(props.wardFirst || props.wardFamily || props.wardEgn);
  return (
    <>
      <View style={pdfStyles.requestBody}>
        <Text>{getFieldValue(values, requestBody) || serviceTitle}</Text>
      </View>
      {hasWard && <WardBlock {...props} includeIdDocDate={false} />}
      <Text style={{ fontWeight: 700, marginTop: 10 }}>ПРИЛОЖЕНИЕ:</Text>
      <Text style={{ marginLeft: 16, fontSize: 10 }}>
        1. Документ за самоличност (копие);{"\n"}
        2. Пълномощно (когато заявлението се подава от пълномощник).
      </Text>
    </>
  );
}
