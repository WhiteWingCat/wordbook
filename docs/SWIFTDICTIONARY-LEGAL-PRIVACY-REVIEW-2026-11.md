# SwiftDictionary — Legal and privacy planning review

**Review date:** 13 November 2026  
**Project context:** Individually operated, intended free, global audience, minimum age 16+, minimal tracking, English and Simplified Chinese learning, Google sign-in and Supabase persistence. A future premium learning tier is possible but undecided.

> This is a product-planning review, not a legal opinion. It identifies issues to take to a Malaysian privacy lawyer before public expansion or monetisation.

## 1. Malaysia — Personal Data Protection Act 2010 (Act 709)

The current Attorney General's Chambers reprint is dated 15 September 2026. Sections 2 and 4 tie the Act to personal data in respect of commercial transactions. The definition of commercial transactions includes matters relating to the supply or exchange of goods or services and is not limited to signed contracts. The Act applies to a person established in Malaysia, not only a company. A free, individually operated learning service is therefore not automatically outside the Act merely because it does not charge users; whether this particular project is a transaction of a commercial nature is a fact-specific legal question.

Relevant user-linked data includes Google account identifiers/email, saved words, learning preferences, progress, daily activity and session information. These are personal data when they relate to an identifiable user. The project should not collect sensitive personal data unless a separate legal and product review approves it.

### Core obligations if the Act applies

- **Lawful purpose, consent and minimisation:** use personal data for a lawful purpose directly related to the activity, necessary for that purpose and not excessive. The Act's General Principle generally requires consent for non-sensitive personal data unless a statutory alternative applies.
- **Privacy notice:** Section 7 requires a written notice before or when data is first collected, with the categories/descriptions of personal data, purposes, available source information, access/correction rights and contact route, disclosure classes, choices/limits, whether provision is obligatory or voluntary, and consequences of not providing obligatory data. Section 7(3) requires both Bahasa Malaysia and English.
- **Security:** Section 9 applies to controllers and processors. Processors have a direct Security Principle obligation following the 2024 amendment.
- **Retention:** Section 10 requires deletion/destruction when the data is no longer needed for its purpose.
- **Access and correction:** users must be able to request access to and correction of personal data. The Act also adds data portability under section 43A, subject to technical feasibility and format compatibility.
- **Cross-border transfers:** section 129 was amended with effect from 1 April 2025. Transfers outside Malaysia require a statutory transfer condition, such as a destination with substantially similar law or adequate protection, or an applicable statutory exception. JPDP's Cross Border Transfer Guideline calls for due diligence/transfer assessment, informing users through the privacy notice and keeping records.
- **Breach response:** section 12B and JPDP's Data Breach Notification Guideline require notification to the Commissioner within 72 hours where the breach causes or is likely to cause significant harm. Affected users must be notified without unnecessary delay where significant harm is involved. Establish an incident-response owner, escalation route and evidence log before public expansion.

### DPO and DPIA screening

A DPO is not automatically required for every small project. JPDP's published criteria require appointment if processing involves any of:
1. personal data of more than 20,000 data subjects;
2. sensitive personal data (including financial information) of more than 10,000 data subjects; or
3. processing that requires regular and systematic monitoring, with online user-behaviour tracking given as an example.

The third criterion is not a headcount threshold. SwiftDictionary's planned adaptive revision uses accumulated practice performance to identify weak topics and prioritise revision. This is not necessarily the same as behavioural advertising or web analytics, but it is systematic use of a learner's activity over time. A Malaysian privacy lawyer should assess whether the actual design meets the DPO criterion. Do not assume the project is exempt simply because analytics and advertising are not planned.

JPDP issued its Data Protection Impact Assessment, Data Protection by Design, and Automated Decision-Making and Profiling guidelines on 30 April 2026. Before release, perform a documented DPIA screening. If the intended processing is likely to create high risk, follow the current DPIA guideline. The current adaptive revision is rule-based, not generative AI; nevertheless, the profiling/automated-processing guidance should be reviewed if the system later makes consequential decisions about users.

### Registration of data controllers

Malaysia's registration requirement is limited to prescribed classes, not every website or software project. The education class includes registered private higher education institutions and private schools/private educational institutions under the relevant education statutes. SwiftDictionary is not automatically a registered education institution merely because it provides learning content. Confirm the legal entity and actual activity against the current Class of Data Users Order and the Commissioner's Circular No. 1/2026 (in force from 1 June 2026) before operating through an entity or institution that could fall within a listed class.

## 2. International users — EU GDPR

GDPR Article 3 can apply to a controller outside the EU where processing relates to offering goods or services to people in the EU, whether payment is required, or monitoring their behaviour in the EU. Mere website accessibility in the EU is not enough by itself; deliberate targeting or an intention to offer the service there matters.

Because SwiftDictionary's intended audience is global, decide whether EU residents are intentionally within the service audience. If yes, plan for GDPR rights and notices, controller/processor agreements, lawful bases, security and breach handling, retention, international-transfer mechanisms, and (where applicable) an EU representative and DPIA. A minimum age of 16 is not a blanket exemption from child-data protections; if consent is the GDPR basis for an information-society service offered directly to a child, Article 8 and Member State age rules must be considered. A 16+ threshold meets the maximum national consent age in Article 8, but other child-specific protections still apply. Under Malaysia's Act 709, a person below 18 has a parent/guardian as a “relevant person” for certain access and correction requests; this should be reflected in the support/request procedure, without assuming that the definition itself creates a blanket parental-consent rule.

Other countries may also have privacy, consumer and child-protection laws. A global launch should use a country-by-country applicability screen rather than assume Malaysian law is the only relevant regime.

## 3. Current technical/privacy observations

Read-only review of the connected production Supabase project found:

- The primary database project is hosted in Tokyo, Japan. This is a data-location fact, not proof that every backup, log, support workflow or subprocessor remains in Japan.
- Existing application tables have RLS enabled and user-scoped policies were observed. A full independent penetration test and external API/schema-exposure assessment have not been performed.
- The current production database does not yet contain the Update 2.3.0 Daily Learning session table or the new private content catalogue. The 2.3.0 migration drafts have not been applied to production.
- Existing `lesson_practice_results` permits authenticated users to insert their own rows under an owner-scoped policy. That is consistent with treating aggregate accuracy as self-reported, but users can potentially fabricate their own summaries. The 2.3.0 draft is designed to route writes through a server RPC and limit direct writes; it still does not prove that the learner selected each answer.
- The Supabase security advisor reports leaked-password protection disabled. The app's current sign-in flow is Google OAuth; verify whether password-based sign-in is enabled or intended before deciding whether this setting needs to be enabled.
- The private testing-exemption table is RLS-enabled without client policies. Its helper function is intended to expose only the caller's own exemption result; preserve that narrow behaviour and do not expose the private table through the Data API.

The privacy-policy draft still needs a real controller identity/contact, a complete list of processors/subprocessors and their processing locations, accurate purposes and data categories, retention periods (including backups/logs), user-rights procedures, deletion/export instructions, and a cross-border transfer explanation. Avoid generic statements that promise more than the actual system does.

## 4. Recommended actions before public release

1. Decide and document whether the project is within Malaysia PDPA's commercial-transaction scope; obtain Malaysian legal advice.
2. Decide whether the global audience includes active targeting of EU residents and complete a GDPR applicability screen.
3. Identify the data controller (individual or legal entity) and a privacy contact. Confirm any prescribed registration-class obligations.
4. Create a data-flow inventory covering GitHub Pages/CDN, Supabase Auth/database/backups/logs/support, Google OAuth and any future payment provider.
5. Complete a cross-border transfer assessment for every recipient/location, not just the primary database region; update the bilingual notice.
6. Complete DPO-threshold screening, specifically the regular/systematic-monitoring criterion for adaptive revision; document the result.
7. Complete DPIA screening for learning progress, adaptive revision and users aged 16–17.
8. Define retention periods and verify that history deletion, account deletion, backup expiry and log retention match the notice.
9. Add data export/access/correction request procedures and a breach-response process with the applicable 72-hour escalation.
10. Before a premium plan, repeat legal review for subscriptions, consumer disclosures/refunds/cancellation, payment processing, tax and any new tracking or marketing.

## 5. Release position

The privacy-first content catalogue is a positive data-minimisation measure: it stores approved IDs and topic metadata, not question text or learner answers. It does not by itself make the service PDPA/GDPR compliant or settle the project's commercial status, cross-border transfer basis, DPO threshold or child-data obligations.

**No production Supabase settings or data were changed during this review. No merge, deployment or production migration is authorised.**

## Primary sources

- Malaysia, Personal Data Protection Act 2010 [Act 709], reprint as at 15 September 2026: https://lom.agc.gov.my/ilims/upload/portal/akta/outputaktap/3301061_BI/Act%20709%20%28Reprint%202026%29.pdf
- JPDP, Personal Data Protection (Amendment) Act 2024 [Act A1727]: https://www.pdp.gov.my/en/akta/personal-data-protection-amendment-act-2024/
- JPDP, DPO appointment FAQ: https://www.pdp.gov.my/wp-content/uploads/2025/05/FAQ-Soalan-Mengenai-DPO-1.pdf
- JPDP, Cross Border Personal Data Transfer Guideline No. 3/2025: https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_CBPDT_EN.pdf
- JPDP, Data Breach Notification Guideline: https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_DBN_ENG.pdf
- JPDP, Data Protection by Design Guideline (30 April 2026): https://www.pdp.gov.my/wp-content/uploads/2026/04/Data-Protection-By-Design-Guideline-DPbD.pdf
- JPDP, Automated Decision-Making and Profiling Guideline (30 April 2026): https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2026/04/Automated-Decision-Making-And-Profiling-Guideline-ADMP.pdf
- EU GDPR, Article 3 territorial scope and Recital 23: https://eur-lex.europa.eu/eli/reg/2016/679
- JPDP, Circular No. 1/2026 (Registration of Data Controllers): https://www.pdp.gov.my/en/akta/personal-data-protection-commissioners-circular-no-1-2026-registration-of-data-controllers/
