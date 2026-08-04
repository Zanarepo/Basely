# Enterprise ERP & Accounting Integration Setup & Architecture Guide

This comprehensive document explains how our **Enterprise Cost & Accounting Connectors** work in practice—bridging accounting financial ledgers with project controls Work Breakdown Structures (WBS).

---

## 🏛️ Architecture & Location: Inline Integration Module

As part of our unified project controls architecture, **all integrations reside natively within the Project Integrations Module** rather than being isolated in general settings. When a Project Manager or Controller clicks **"Integrations"** from any project dashboard, they access an interactive integration cockpit containing:
- **Slack, Microsoft Teams & Google Chat**: Automated notification pipelines.
- **Google Calendar**: Milestone and scheduling synchronization.
- **ERP & Accounting (QuickBooks, NetSuite, SAP S/4HANA, Xero)**: Financial ledger synchronization and WBS mapping.

When clicking **Configure** under ERP & Accounting, the modal widens into an interactive enterprise integration cockpit directly inside the existing project window—allowing seamless navigation between connectors, mapping tables, and diagnostic telemetry without leaving your workflow.

---

## ⚙️ Dual-Mode Connectivity: Live REST API vs. Simulated Test Mode

To accommodate both production financial deployments and rapid evaluation/auditing without external API keys, all four accounting adapters implement a **Dual-Mode Connectivity Pattern**:

### 1. 🟢 Live OAuth / REST API Mode (Production)
For live corporate accounting environments, each adapter executes real HTTP requests against external vendor developer APIs:
* **QuickBooks Online (QBO)**: Uses Intuit OAuth 2.0 Bearer tokens and Realm IDs to run live `SELECT * FROM Account` and `SELECT * FROM Purchase` queries against `https://quickbooks.api.intuit.com/v3/company/[RealmID]/query`.
* **NetSuite Cloud ERP**: Communicates via SuiteTalk REST Record API (`https://[AccountID].suitetalk.api.netsuite.com/services/rest/record/v1/vendorbill`) using Token-Based Authentication.
* **SAP S/4HANA Financials**: Ingests actual cost orders via enterprise OData REST Gateway (`/sap/opu/odata/sap/API_FINANCIAL_TRANSACTION_SRV/ActualCosts`).
* **Xero Accounting Suite**: Connects to `https://api.xero.com/api.xro/2.0/Invoices` using OAuth 2.0 and `Xero-Tenant-Id` headers.

In the UI, clicking **Settings (⚙️)** on any connector card reveals an interactive configuration drawer where controllers can enter live Client IDs, OAuth access tokens, tenant UUIDs, or custom OData gateway host URLs.

#### 🔑 How to Acquire Free Sandbox Credentials for Live API Testing
If you want to test sending **real HTTP requests over the internet** to live accounting cloud servers without spending money on business subscriptions or touching real company bookkeeping, you can easily claim free vendor developer sandboxes:

1. **QuickBooks Online (Intuit Developer Sandbox)**:
   * Visit [developer.intuit.com](https://developer.intuit.com/) and register a free developer profile.
   * Under your Dashboard, click **Create an App** (choose *QuickBooks Online and Accounting*).
   * Intuit instantly generates a realistic **QBO Sandbox Company** pre-populated with sample vendor invoices and general ledgers!
   * Go to **OAuth 2.0 Playground** (under your App's Development menu) and select your Sandbox Company. This generates an active **OAuth Access Token (Bearer)** and displays your sandbox **Realm ID (Company ID)**.
   * Paste these credentials directly into our UI's **Settings (⚙️)** drawer under *Live Integration Mode*!

2. **Xero Accounting Suite (Demo Tenant Explorer)**:
   * Sign up for free at [developer.xero.com](https://developer.xero.com/).
   * Use Xero's built-in **API Explorer** or create an app to connect to Xero's universal **"Demo Company"**.
   * Copy the temporary **Bearer Access Token** and **Xero-Tenant-Id**, then paste them into the Xero connector settings in our dashboard to perform live OData/REST testing.

3. **NetSuite & SAP S/4HANA (Developer Trials & Hubs)**:
   * Access free sandbox environments via the **SAP Business Technology Platform (BTP) Developer Trial** or **Oracle SuiteCloud Sandbox** to retrieve OData endpoint URLs and Token-Based Authentication credentials.

### 2. 🧪 Simulated Test Mode (Evaluation & Audit Testing)
To ensure accountants and auditors can verify mapping behaviors and audit log immutability without needing external corporate credentials:
* Every connector comes pre-loaded with realistic simulated general ledgers and project expense transactions (e.g., subcontractor engineering milestones, AWS cloud compute reservations, industrial hardware leases).
* Evaluators can immediately toggle to **"Simulated Test Mode"**, execute instantaneous synchronizations, test WBS assignments, and verify automated deduplication telemetry out-of-the-box!

---

## 👔 Part 2: The Human Workflow (Accountant + Project Manager)

In real enterprises, Accountants understand financial ledgers and tax codes, while Project Managers manage engineering deliverables and WBS packages. The connector serves as the automated bridge:

```
[Accountant in QuickBooks/SAP]             [PM / Controller in Baseline]
  Pays bills & codes invoices                Creates WBS work packages
  to GL Account #5200 (Electrical)           (WBS 2.1: Electrical Grid Setup)
         │                                            │
         └─────────────┬──────────────────────────────┘
                       ▼
         [Joint Mapping in Baseline UI]
       Account 5200  ◄───────────►  WBS Element 2.1
                       │
                       ▼
        [Automated Daily / Hourly Sync]
       Invoices instantly post as Actual Costs!
```

1. **Initial Account Mapping:** Once an accounting suite is connected (live or simulated), the PM opens the **Account to WBS Mapping Tab** inside the Integrations module. Every imported general ledger account is paired with a specific project WBS node via an interactive dropdown.
2. **Automated Synchronization & Ingestion:** Nightly cron jobs or manual **"Sync Now"** triggers invoke the automated sync engine. Each transaction is converted into an idempotent record and posted directly into project financial actuals via our **Secure Ingestion Pipeline**, guaranteeing zero duplication via verified external record IDs.

---

## 🛡️ Part 3: Audit Trails & Exception Telemetry

Financial mismatches occur when accounting charges expenses to unmapped accounts. Our diagnostic security layer handles these exceptions automatically:
1. **Partial Ingestion Protection:** If an emergency invoice (e.g., $4,500 on unmapped Account 6900 - Expedited Logistics) is encountered during a sync run of 50 routine bills, the engine isolates the exception and completes the remaining 49 records successfully as a **Partial Failure**.
2. **Automated Alerting:** An instant `erp_sync_failure` notification fires directly to Organization Admins and Controllers: *"ERP Sync Partial Failure: 1 unmapped transaction ($4,500 USD) requires attention."*
3. **Audit Resolution:** The user opens the **Sync Telemetry & Diagnostics Inspector** inside the Integrations cockpit, reviews the explicit exception rationale, assigns Account 6900 to a WBS contingency package in the mapping tab, and re-syncs to achieve complete audit alignment!



2. Why We Didn't Enable Interactive Login Screens on localhost
To build a button that triggers the standard Intuit "Sign In" window (known in software architecture as an OAuth 2.0 Authorization Code Flow), three rigorous enterprise requirements must be met:

A Registered Public Internet Domain (SSL/TLS): For bank-grade security, Intuit restricts production login redirects to local developer setups (like http://localhost:3000). To host an interactive login screen, you must deploy your app to an encrypted public domain (e.g., https://app.yourdomain.com) and register that domain inside your Intuit Developer App settings.
An OAuth Callback Endpoint: A backend server route (e.g., /api/auth/callback/quickbooks) designed solely to catch Intuit's response after a user logs in and swap it for the permanent database token.
Intuit App Security Assessment: Before Intuit permits commercial accounting customers to sign into a real-world third-party application via their sign-in portal, Intuit mandates an extensive technical and data privacy review of your published web application.
3. Why Our Current Architecture is Ideal Right Now
During development, feature demonstration, and local evaluation:

Requiring test users to open popup windows and repeatedly type username/password combinations on localhost slows down testing and often triggers browser security restrictions.
Our Dual Mode Architecture gives you the absolute best of both worlds:
Test Option (Demo Mode): Zero API keys needed; instantaneous simulated data for mapping and workflow demonstrations.
Live REST API Mode: Allows developers and evaluators to drop in a direct token and prove 100% genuine Intuit cloud communication right now from localhost without waiting for Intuit's commercial app review!
When you eventually deploy this platform to a production domain for paying enterprise customers, upgrading the card to open Intuit's visual login popup simply requires linking that button to Intuit's authorization URL using your existing QBO_CLIENT_ID!

