# SwiftDictionary Privacy Policy — Draft for Review

**Draft only — not approved for publication. This is the English draft only; prepare a Bahasa Malaysia companion version before publication if the Malaysian PDPA applies.** This document is a proposed notice for the 2.3.0 design, not a description of every feature currently deployed. On 10 November 2026, the connected production database was still on the pre-2.3.0 schema; the proposed current-window allowance ledger and Daily Activity session table were not live. Update this notice to match the actual release deployed at publication time, and check the provider settings and applicable law.

**Effective date:** [Insert date]  
**Last updated:** [Insert date]  
**Service:** SwiftDictionary  
**Data controller:** [Insert the operator's legal name / business name]  
**Privacy contact:** [Insert a monitored privacy email address]  
**Controller contact address:** [Insert the required contact address]

## 1. About this notice

This notice explains how SwiftDictionary processes personal data when you use its vocabulary dictionary and language-learning features.

SwiftDictionary is intended for users aged 16 and above. The service may be accessed internationally. Privacy laws differ between countries, so additional rights or requirements may apply depending on where you live.

## 2. Information we process

Depending on the features you use, SwiftDictionary may process:

- **Account and sign-in information:** email address and account/identity information provided through Google sign-in and Supabase authentication.
- **Profile information:** a display name and selected profile icon.
- **Preferences:** learning language, translation language, selected IANA timezone, and enabled/disabled Daily Learning categories.
- **Saved dictionary items:** words or characters you choose to save and synchronise to your account.
- **Learning progress:** lesson difficulty, lesson identifier, progress/completion status and relevant timestamps.
- **Daily Learning history:** activity category, content/topic identifiers, session status and timestamps.
- **Aggregate practice results:** counts of correct answers and total questions, used to calculate learning insights and adaptive revision. The current design does not store individual selected answers, typed responses or keystrokes.
- **Allowance enforcement state:** a minimal current-window usage count by learning activity category, used to enforce the daily limits shown in the application. It is not a record of the answers you gave.
- **Technical and security information:** information processed by the hosting, authentication and database providers to operate and secure the service. The exact categories and retention periods must be confirmed from the deployed provider configuration before publication.

The timezone setting is an IANA timezone preference used to calculate daily learning resets. It is not GPS data and does not identify your precise physical location.

## 3. How we use information

We use information to:

- authenticate you and maintain your account;
- synchronise saved words, preferences and learning progress across your devices;
- display lesson and Daily Learning progress;
- calculate aggregate practice insights and select adaptive revision material;
- enforce daily learning allowances consistently across devices;
- protect the service, investigate misuse and maintain reliability; and
- respond to privacy requests and meet applicable legal obligations.

Dictionary word-grid search is intended to remain free and unlimited. It is not subject to the Lessons or Daily Learning completion allowance.

## 4. Service providers and international processing

SwiftDictionary uses:

- **Google** for the sign-in method you choose; and
- **Supabase** for authentication and database services.

At the time of the 10 November 2026 read-only review, the primary SwiftDictionary Supabase database was hosted in the Tokyo region (Japan, `ap-northeast-1`). This does not establish the locations used for Supabase Auth, backups, logs, support access or all subprocessors. [Before publication: verify and describe those processing locations, the relevant Google and Supabase entities, subprocessors, support/operations access, backup locations, and any other services used by the deployed site. Add links to the applicable provider privacy notices and contractual information.]

Information may be processed or stored outside Malaysia. Before publication, the operator must document the applicable cross-border transfer basis and safeguards, and update this section to describe the actual processing locations accurately. A database region alone may not describe every support, logging, backup or subprocessor transfer.

## 5. Sharing

We do not sell personal data. We share information only as needed with the service providers that operate sign-in, hosting, database and security functions, or where disclosure is required by law or necessary to protect the service and its users.

[Verify this statement against all analytics, advertising, error-reporting, CDN, email and other integrations before publication. Add any additional recipients and purposes.]

## 6. Retention

We keep account information and preferences while your account remains active and as needed to operate the service.

Learning progress, Daily Learning session history and aggregate practice results are retained until you request learning-history deletion or delete your account.

The proposed 2.3.0 design is to retain only a minimal current-window allowance count until the current allowance window ends. This is not implemented in the live database at the time of the 10 November 2026 review. The current pre-2.3.0 database uses the activity log itself for allowance checks. Before enabling history deletion, the implementation must separate the quota ledger from deletable learning history and verify that deletion cannot restore a daily allowance.

Security logs and backup copies may be retained for periods determined by provider configurations, security needs and applicable law. [Insert verified periods and explain backup expiry after checking provider terms. Do not promise immediate deletion from backups unless verified.]

## 7. Your choices and privacy requests

You may be able to:

- access or request a copy of personal data associated with your account;
- request correction of inaccurate account or profile information;
- request deletion of learning history while keeping your account and saved words; or
- request deletion of your SwiftDictionary account and associated data.

Learning-history deletion removes lesson progress, practice summaries, Daily Learning session history and activity history. It does not delete saved words or account preferences. A minimal allowance count for the current allowance window remains until the normal reset, so deleting history does not grant additional completions.

Account deletion is a separate, irreversible request. It does not delete your Google account.

To make a request, contact **[privacy contact email]**. We may need to verify that you control the account before acting. We will respond within the period required by applicable law.

## 8. Security

We use access controls and database permissions intended to limit access to account data. Authentication and database services are provided by our service providers. No internet service can guarantee absolute security.

[Before publication: document the actual security controls, incident process, access management, backup protection and breach-notification responsibilities.]

## 9. Children and age

SwiftDictionary is intended for people aged 16 and above. The service does not currently describe an age-verification process. If you believe a person below the intended age has provided personal data, contact us at [privacy contact email] so we can review the request and applicable requirements.

[Obtain jurisdiction-specific legal advice before making this statement final or marketing to younger users.]

## 10. Changes to this notice

We may update this notice when the service or applicable requirements change. The updated notice will show a revised effective date. Where required, we will provide additional notice or obtain consent.

## 11. Language

This is the English-language draft. If the Malaysian PDPA applies, provide the privacy notice in both Bahasa Malaysia (the national language) and English, with a clear and accessible way to exercise choices and make privacy requests in both languages. A Simplified Chinese translation may also be useful for learners but does not replace the Bahasa Malaysia and English versions.

## 12. Contact

**Data controller:** [Legal name]  
**Privacy contact:** [Monitored email]  
**Address:** [Required contact address]  
**Location:** Malaysia

This draft is not legal advice or a statement that SwiftDictionary is already compliant with every applicable privacy law.
