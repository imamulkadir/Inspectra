# Inspectra — Complete Website Build Instructions

> **Product tagline:** Know what you're buying.
>
> **Application type:** Mobile-first static web application / Progressive Web App
>
> **Frontend:** HTML5, Tailwind CSS, modular vanilla JavaScript, ES modules, JSON datasets, Google Fonts
>
> **Primary scenario:** A buyer uses one phone to inspect another used iPhone while meeting a seller.
>
> **Dataset location supplied by the project owner:** `<project-root>/data/iphone/`

---

## 0. Master instruction for the implementation agent

Build the complete production-quality Inspectra website described in this document.

The project owner will manually create and populate:

```text
data/iphone/
```

Assume the extracted dataset contents are placed directly inside that folder, so these paths exist:

```text
data/iphone/manifest.json
data/iphone/devices/device-index.json
data/iphone/devices/device-catalog.json
data/iphone/variants/regional-variants.json
...
```

### Non-negotiable dataset rules

1. **Do not create, regenerate, edit, normalize, enrich, repair, or overwrite anything inside `data/iphone/`.**
2. **Do not silently add fallback/mock iPhone specifications.** If the folder is missing or invalid, show a clear blocking data-error screen.
3. **Do not browse Apple or another website at runtime to replace missing dataset facts.** The website consumes the supplied dataset.
4. Treat `null`, omitted values, and explicitly unavailable values as **unknown/not verified**, never as `false`, `0`, unsupported, or absent.
5. Do not infer an exact country from an Apple `Axxxx` number when the dataset provides a multi-country market group.
6. Do not infer official physical finish colors from finish names. The dataset intentionally does not provide official CSS swatches.
7. Do not infer eSIM support, SIM-slot count, cellular bands, service-program eligibility, historical iOS paths, repair history, ownership, or blacklist status unless the supplied dataset explicitly supports the claim.
8. Do not produce a numeric condition score, weighted inspection-coverage score, or High/Medium/Low confidence rating while the corresponding policy files state that calibration is required.
9. Do not implement an automated IMEI blacklist, lost/stolen, financing, carrier-balance, or “clean IMEI” lookup in V1.
10. Manual IMEI/serial presence or box-matching questions already present in the inspection dataset may be shown, but they must never be presented as a clean-status or ownership verification.
11. Keep **official facts**, **user observations**, **browser observations**, **external verification**, and **analytical inferences** separate in state, UI, and reports.
12. The result must never tell the user to buy, guarantee that a phone is genuine, or guarantee future performance.

Build real, maintainable modules. Do not create a single oversized `script.js`. Do not leave placeholder pages, fake scores, fake charts, invented data, or non-functional controls.

---

# 1. Product objective

Inspectra helps a buyer:

```text
Identify → Verify → Inspect → Analyze
```

a used iPhone through a guided, model-aware, regional-variant-aware, and iOS-aware workflow.

The application must:

- browse every iPhone contained in the supplied device dataset;
- show official specification data stored in the dataset;
- identify the hardware model using an `Axxxx` number when provided;
- show Apple’s published market group rather than falsely naming one country;
- compare the observed storage, finish, connector, camera layout, controls, dimensions, weight, SIM-tray expectation, and other supported fields against official data;
- ask only inspection questions applicable to the selected model, capabilities, iOS version, and resolved regional variant;
- resolve version-aware Settings guidance from the navigation dataset;
- perform browser-assisted diagnostic tools only where browser APIs make them possible;
- guide manual checks for hardware or iOS features that browsers cannot access;
- trigger additional checks when an inconsistency or failure is reported;
- record positive, adverse, unresolved, skipped, unavailable, and not-applicable outcomes distinctly;
- autosave the inspection locally;
- support interrupted/resumed inspections;
- provide a transparent analytical report;
- remain usable as a PWA after the required resources have been cached;
- explain its limitations before, during, and after the inspection.

---

# 2. Scope and explicit non-goals

## 2.1 V1 must include

- Mobile-first responsive design.
- iPhone model explorer driven entirely by `device-index.json` and `device-catalog.json`.
- Detailed model specification pages.
- Official storage and finish options.
- Regional `Axxxx` hardware mapping.
- Shared market-group display.
- iOS-version input and validation.
- Capability-aware inspection filtering.
- iOS-aware Settings-path resolution.
- Guided inspection across all supplied categories and applicable rules.
- Product-configured Quick, Standard, and Deep inspection profiles as defined later in this document.
- Conditional follow-up checks.
- Deterministic identity-consistency checks.
- Browser-assisted display, touch, audio, microphone, camera, and motion tools where supported.
- Pre-reset inspection and final post-reset/activation verification.
- Local persistence with IndexedDB.
- Offline/PWA functionality.
- Source provenance.
- Print-friendly analytical report.
- Draft legal/disclaimer content from the dataset.
- Accessible, polished, Apple-inspired—not Apple-copied—UI.

## 2.2 V1 must not include

- Automated IMEI blacklist checking.
- Claims that an IMEI is “clean.”
- Seller identity verification.
- Carrier financing or unpaid-balance verification.
- Cloud user accounts.
- Cloud inspection history.
- Marketplace scraping.
- Automatic used-market price valuation.
- AI-generated device decisions.
- Apple website scraping from the browser.
- Numeric condition scoring while dataset policies remain uncalibrated.
- Fabricated color swatches.
- Fabricated service-program results.
- A statement that a phone is authentic, never repaired, liquid-damage-free, not stolen, safe to buy, or guaranteed original.

---

# 3. Evidence and reasoning model

Every finding must have one of these provenance types:

```text
OFFICIAL_FACT
USER_OBSERVATION
BROWSER_OBSERVATION
EXTERNAL_VERIFICATION
ANALYTICAL_INFERENCE
```

## 3.1 Official fact

A normalized fact supplied by `data/iphone/`, such as an official storage option, finish name, dimension, feature, model number, or market group.

## 3.2 User observation

Something the user reports or manually checks, such as battery capacity, physical damage, a Settings message, or whether Face ID works.

## 3.3 Browser observation

Something the website directly records through a browser API, such as touch-grid coverage, a permission result, microphone-recording availability, or motion events.

Browser observation does **not** mean laboratory certification or automatic hardware approval.

## 3.4 External verification

Reserved for a future authorized external data source. No IMEI external verification is included in V1.

## 3.5 Analytical inference

A transparent conclusion based on one or more facts and observations.

Example:

> The observed exterior finish is not in the official finish list for the selected model. Recheck the selected model and investigate possible housing replacement or modification.

Never convert an inference into an absolute factual claim.

---

# 4. Result and liability philosophy

The application must never output:

```text
BUY
SAFE TO BUY
DEVICE IS AUTHENTIC
GUARANTEED CLEAN
NO WATER DAMAGE
NEVER REPAIRED
NOT STOLEN
```

Use wording from:

```text
data/iphone/policy/report-language.json
data/iphone/legal/disclaimers.json
```

Examples of acceptable wording:

- “No identity inconsistency was detected in the completed checks.”
- “No repair indication was reported or identified through the completed checks.”
- “No visible liquid-exposure indication was identified during the completed checks.”
- “No critical issue was identified in the completed checks.”
- “The exact original sales country cannot be determined from this shared hardware model number alone.”
- “Blacklist status was not checked by this version.”

## 4.1 Required disclaimer placement

### Before inspection

Require an explicit acknowledgement using `preInspectionAcknowledgement` from `legal/disclaimers.json`.

Store only:

```js
{
  accepted: true,
  acceptedAt: "ISO_TIMESTAMP",
  disclaimerVersion: "DATASET_DISCLAIMER_VERSION"
}
```

### During inspection

Show the persistent label from the dataset:

```text
Analytical assessment — not a guarantee
```

### Final report

Show the dataset `reportDisclaimer`, scope limitations, and policy/dataset versions.

### Legal review

The UI must clearly treat legal text as production copy, but the project owner must obtain qualified legal review before public commercial launch because the dataset itself marks the wording as draft.

---

# 5. Technology stack and project setup

Use:

- HTML5.
- Vanilla JavaScript with ES modules.
- Vite for local development and production bundling.
- Tailwind CSS through the official Vite plugin.
- Google Font: **Inter**.
- IndexedDB for inspection state and optional local evidence.
- Native Service Worker and Cache Storage for PWA/offline support.
- Vitest and jsdom for unit/integration tests.
- Playwright for mobile-viewport and end-to-end tests.
- ESLint and Prettier for code quality.
- No React, Vue, Angular, Svelte, jQuery, Bootstrap, or DaisyUI.

Use the current stable versions accepted by the installed Vite release rather than pinning obsolete examples.

Official tooling references:

- Vite: `https://vite.dev/guide/`
- Tailwind CSS with Vite: `https://tailwindcss.com/docs/installation/using-vite`
- Service Workers: `https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers`
- IndexedDB: `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API`

## 5.1 Initial commands

```bash
npm create vite@latest . -- --template vanilla
npm install
npm install tailwindcss @tailwindcss/vite
npm install -D vitest jsdom @playwright/test eslint @eslint/js globals prettier
npx playwright install
```

Do not use Tailwind’s browser CDN in production.

## 5.2 Required package scripts

Configure at least:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run validate:data && vite build && node scripts/copy-data.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "validate:data": "node scripts/validate-datasets.mjs"
  }
}
```

## 5.3 Vite and Tailwind configuration

Use a JavaScript Vite configuration:

```js
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
```

In `src/styles.css`:

```css
@import "tailwindcss";
```

The dataset remains at root-level `data/iphone/`. Vite can serve it during development, but production builds must copy it into:

```text
dist/data/iphone/
```

Implement `scripts/copy-data.mjs` using Node’s `fs/promises.cp()` and fail clearly when `data/iphone/manifest.json` is missing.

---

# 6. Required project structure

```text
inspectra/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── .prettierrc
├── playwright.config.js
├── README.md
│
├── data/
│   └── iphone/                       # Supplied manually; never modify
│       ├── manifest.json
│       ├── devices/
│       ├── variants/
│       ├── finishes/
│       ├── capabilities/
│       ├── ios/
│       ├── navigation/
│       ├── inspections/
│       ├── policy/
│       ├── legal/
│       ├── sources/
│       ├── service-programs/
│       ├── localization/
│       ├── validation/
│       └── schemas/
│
├── public/
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── icons/
│   └── diagnostic-assets/
│       └── audio/
│
├── scripts/
│   ├── copy-data.mjs
│   └── validate-datasets.mjs
│
├── src/
│   ├── app.js
│   ├── styles.css
│   │
│   ├── config/
│   │   ├── appConfig.js
│   │   ├── inspectionProfiles.js
│   │   └── routes.js
│   │
│   ├── core/
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── events.js
│   │   ├── errorBoundary.js
│   │   └── constants.js
│   │
│   ├── data/
│   │   ├── paths.js
│   │   ├── repository.js
│   │   ├── indexes.js
│   │   ├── datasetGuard.js
│   │   └── sourceResolver.js
│   │
│   ├── engines/
│   │   ├── deviceResolver.js
│   │   ├── contextResolver.js
│   │   ├── capabilityResolver.js
│   │   ├── iosResolver.js
│   │   ├── navigationResolver.js
│   │   ├── ruleResolver.js
│   │   ├── answerInterpreter.js
│   │   ├── expectedValueResolver.js
│   │   ├── followUpResolver.js
│   │   ├── anomalyEngine.js
│   │   ├── riskEngine.js
│   │   ├── completionEngine.js
│   │   ├── scoringGate.js
│   │   └── reportEngine.js
│   │
│   ├── diagnostics/
│   │   ├── capabilityDetector.js
│   │   ├── displayTest.js
│   │   ├── touchTest.js
│   │   ├── audioTest.js
│   │   ├── microphoneTest.js
│   │   ├── cameraTest.js
│   │   └── motionTest.js
│   │
│   ├── storage/
│   │   ├── database.js
│   │   ├── inspectionRepository.js
│   │   ├── evidenceRepository.js
│   │   └── migrations.js
│   │
│   ├── components/
│   │   ├── appHeader.js
│   │   ├── bottomNavigation.js
│   │   ├── bottomActionBar.js
│   │   ├── button.js
│   │   ├── deviceCard.js
│   │   ├── finishList.js
│   │   ├── specificationSection.js
│   │   ├── variantCard.js
│   │   ├── progressBar.js
│   │   ├── questionCard.js
│   │   ├── answerControl.js
│   │   ├── expectedValueCard.js
│   │   ├── sourceLink.js
│   │   ├── statusBadge.js
│   │   ├── findingCard.js
│   │   ├── dialog.js
│   │   ├── bottomSheet.js
│   │   ├── toast.js
│   │   ├── skeleton.js
│   │   ├── emptyState.js
│   │   └── dataError.js
│   │
│   ├── pages/
│   │   ├── homePage.js
│   │   ├── explorePage.js
│   │   ├── modelPage.js
│   │   ├── identifyPage.js
│   │   ├── disclaimerPage.js
│   │   ├── inspectionSetupPage.js
│   │   ├── inspectionPage.js
│   │   ├── diagnosticPage.js
│   │   ├── resetVerificationPage.js
│   │   ├── reportPage.js
│   │   ├── savedInspectionsPage.js
│   │   ├── privacyPage.js
│   │   ├── termsPage.js
│   │   └── notFoundPage.js
│   │
│   └── utils/
│       ├── version.js
│       ├── objectPath.js
│       ├── formatting.js
│       ├── validators.js
│       ├── dom.js
│       ├── accessibility.js
│       ├── dates.js
│       └── ids.js
│
└── tests/
    ├── data/
    ├── engines/
    ├── storage/
    ├── diagnostics/
    ├── e2e/
    └── fixtures/
```

---

# 7. Dataset contract

The app must discover the dataset through:

```text
/data/iphone/manifest.json
```

Do not hardcode the number of devices, latest generation, rule count, finish count, or dataset version into the application UI.

## 7.1 Required dataset files used by the app

### Boot and dataset health

```text
manifest.json
validation/validation-report.json
validation/data-quality.json
localization/en.json
```

### Model browsing and specifications

```text
devices/device-index.json
devices/device-catalog.json
devices/specification-field-catalog.json
finishes/finish-catalog.json
sources/sources.json
```

### Model/variant identification

```text
variants/regional-variants.json
capabilities/capability-definitions.json
capabilities/model-capabilities.json
```

### iOS and Settings guidance

```text
ios/releases.json
ios/model-compatibility.json
navigation/settings-paths.json
```

### Inspection

```text
inspections/categories.json
inspections/answer-options.json
inspections/rules.json
inspections/follow-up-rules.json
inspections/parts-service-history.json
inspections/browser-diagnostics.json
```

### Policy and reporting

```text
policy/scoring-policy.json
policy/risk-policy.json
policy/coverage-confidence-policy.json
policy/report-language.json
legal/disclaimers.json
service-programs/service-programs.json
```

## 7.2 Runtime loading strategy

Load only what the current screen needs.

### Initial app boot

Load:

- `manifest.json`
- `validation/validation-report.json`
- `devices/device-index.json`
- `localization/en.json`

### Explore page

Additionally load:

- `devices/device-catalog.json`
- `finishes/finish-catalog.json`
- `sources/sources.json`

### Identification setup

Additionally load:

- `variants/regional-variants.json`
- `capabilities/model-capabilities.json`
- `ios/releases.json`
- `ios/model-compatibility.json`

### Inspection start

Additionally load:

- categories;
- answer sets;
- rules;
- navigation paths;
- follow-up rules;
- Parts & Service History;
- report/risk/completion policies;
- disclaimers.

### Diagnostic launch

Load browser diagnostics and the related local assets only when requested.

Cache all `fetch()` promises so navigation does not repeatedly download or parse the same JSON.

## 7.3 Dataset health gate

Before enabling model browsing or inspection:

1. Fetch `manifest.json`.
2. Confirm the response is valid JSON.
3. Confirm `validationStatus === "PASS"`.
4. Confirm the expected primary files can be loaded.
5. Confirm all top-level collections needed by the current feature are arrays/objects of the expected shape.
6. Do not fail because counts differ from an older release; counts are allowed to change.
7. Store the loaded manifest version in app state.

If the dataset is missing or invalid, render a blocking screen such as:

```text
Device data is unavailable

Inspectra could not load /data/iphone/manifest.json.
Place the validated dataset inside data/iphone/ and reload the application.

[Retry]
```

Do not switch to mock data.

## 7.4 Production copy step

Implement `scripts/copy-data.mjs` so `npm run build` copies the supplied folder without editing it:

```text
data/iphone/ → dist/data/iphone/
```

The script must:

- fail if `data/iphone/manifest.json` is absent;
- delete only the previous `dist/data/iphone/` copy;
- recursively copy the source folder;
- never alter the source folder;
- print the copied dataset version after reading the manifest.

## 7.5 Build-time validation script

Implement `scripts/validate-datasets.mjs` as a read-only validator. At minimum verify:

- all required files exist;
- all required files parse as JSON;
- manifest validation status is `PASS`;
- device IDs are unique;
- variant IDs and `Axxxx` numbers are normalized;
- every variant references a valid device;
- every capability record references a valid device;
- every rule references a valid category and answer set;
- every rule navigation ID resolves when present;
- every follow-up target rule exists;
- every source ID referenced by loaded production records resolves;
- policy files parse;
- `null` calibration values are preserved rather than replaced.

Fail the production build on structural/reference errors. Print warnings for intentional gaps recorded by the dataset.

---

# 8. Data repository and indexes

Create a central repository. No page should call arbitrary JSON URLs directly.

## 8.1 Dataset root

Resolve the root from Vite's configured base path so the website also works when deployed under a subdirectory:

```js
const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const DATA_ROOT = `${basePath}data/iphone/`;
```

Do not derive the dataset path relative to a generated JavaScript chunk. Do not repeat literal dataset paths across page modules.

## 8.2 Repository requirements

The repository must:

- use `fetch()` with `Accept: application/json`;
- cache in-flight and resolved promises;
- remove a failed request from cache so Retry can work;
- expose feature-level loaders;
- provide structured errors with file path and HTTP status;
- never return fake empty collections after a load failure.

Use loaders such as:

```js
loadManifest();
loadModelIndex();
loadModelBrowserData();
loadIdentificationData();
loadInspectionData();
loadDiagnosticData();
loadReportPolicies();
```

## 8.3 Required indexes

Build in-memory Maps after data loads:

```text
deviceById
variantById
variantByANumber
variantsByDeviceId
finishById
capabilitiesByDeviceId
categoryById
answerSetById
ruleById
rulesByCategoryId
navigationById
sourceById
diagnosticById
```

Normalize A-number input using:

```text
trim → uppercase → remove whitespace
```

Accept only the basic format:

```regex
^A\d{4}$
```

Do not reject an unknown A-number as fake. Mark it unresolved against the current dataset.

---

# 9. Application state model

Use one central state store with explicit immutable updates or controlled reducers/events.

Suggested shape:

```js
{
  app: {
    status: "BOOTING | READY | ERROR",
    route: {},
    online: true,
    updateAvailable: false,
  },

  dataset: {
    manifest: null,
    validation: null,
    loadedFeatures: [],
    loadErrors: [],
  },

  inspection: {
    id: null,
    profileId: null,
    datasetVersion: null,
    ruleSetVersion: null,
    policyVersions: {},
    disclaimerAcceptance: null,
    context: null,
    baseRuleIds: [],
    followUpRuleIds: [],
    orderedRuleIds: [],
    currentRuleId: null,
    answers: {},
    findings: [],
    identityFindings: [],
    resetVerification: {},
    startedAt: null,
    updatedAt: null,
    completedAt: null,
  },
}
```

Do not store full raw IMEI or serial values in the shareable report. Prefer:

- local comparison only;
- masked display;
- last four digits when a reference is needed;
- explicit user action before retaining an evidence screenshot that contains identifiers.

---

# 10. Device and regional-variant identification

## 10.1 Identification methods

Support both:

### Method A — A-number first

The user enters an `Axxxx` value. If found:

- resolve the variant;
- resolve the associated device;
- preselect the device;
- show the complete Apple-published market-group label;
- show physical SIM-tray expectation only when the dataset value is non-null;
- show a disclaimer when the group includes multiple countries.

### Method B — Model first

The user chooses a model and may enter the A-number afterward.

If the A-number resolves to a different device:

- do not silently replace the selected model;
- present both values;
- create a high-visibility identity inconsistency;
- ask the user to recheck the number and model;
- never label the device counterfeit solely from this mismatch.

## 10.2 Exact-country wording

If `marketCoverageType` or the list indicates multiple markets, show:

```text
Apple hardware market group
Japan, Canada, United Arab Emirates, ...

This A-number is shared by multiple markets. It does not establish one exact original sales country by itself.
```

Use official country labels from the dataset. Do not convert “United Arab Emirates” to “Dubai.”

## 10.3 Storage

Populate the storage control from the selected device’s `storageGB` array.

Include:

```text
Other / does not match
Unable to verify
```

If “Other” is selected, create an identity inconsistency and preserve the reported value as a user observation.

## 10.4 Finish/color

Populate official finish choices from `officialFinishNames` or `finishIds` resolved through `finish-catalog.json`.

Include:

```text
Other / not listed
Unable to verify
```

Do not assign physical-looking CSS swatches where `uiColorHex` is null. Use:

- text-first finish pills;
- neutral outline icons;
- approved custom device artwork only if provided separately by the project owner.

Do not copy Apple product photography without appropriate rights.

## 10.5 Part number

The inspection dataset may ask the user to record the Apple part number. Treat it as an observation only.

Do not infer country, model, authenticity, or sales channel from the part number because the supplied dataset does not include a complete authoritative mapping.

## 10.6 IMEI and serial information

V1 may guide the user to verify that identifiers are visible or match an original box because these questions exist in the supplied rules.

However:

- do not call an external API;
- do not claim clean/blacklist status;
- do not prove ownership;
- do not send the value to analytics;
- do not place the full value in report URLs;
- mask the value in UI after entry;
- show the explicit dataset limitation acknowledgement.

---

# 11. iOS-version handling

The guided inspection depends on:

```text
Model + installed iOS + regional variant + capabilities + language
```

## 11.1 Version parser

Parse versions numerically into:

```js
{
  major,
  minor,
  patch,
  channel: "stable | public_beta | developer_beta | rc | unknown"
}
```

Never compare iOS versions as strings.

Implement and unit-test:

```js
parseVersion(value);
compareVersions(left, right);
isVersionInRange(version, min, max);
```

## 11.2 Release-dataset behavior

- Use `ios/releases.json` for verified represented release families.
- Use `ios/model-compatibility.json` only for the compatibility assertions it actually contains.
- Do not reconstruct historical compatibility matrices from model dates.
- If the entered exact version is newer than the latest exact verified release in the dataset, show:

> This iOS version is newer than the currently verified exact release data. Some navigation instructions may differ.

- If the user chooses a beta/RC channel, show a persistent software-guidance warning.
- Do not reduce a numeric confidence score because confidence calibration is not active. Instead list the beta/newer-version condition as a confidence limitation.

## 11.3 Navigation resolver

Resolve Settings paths from `navigation/settings-paths.json` using:

- navigation ID;
- iOS min/max;
- device-family requirement;
- selected device;
- verified route scope.

If no route matches:

- show the dataset fallback text;
- mark guidance as “Exact path not verified for this configuration”;
- do not mark the device test as failed;
- optionally recommend Settings search if the dataset fallback says so.

No settings path may be embedded independently inside page components when a navigation ID exists.

---

# 12. Capability resolver

Use `capabilities/model-capabilities.json` as the primary per-device capability map and compare it against the duplicate capability summary in the device record during validation.

Capabilities determine whether a rule appears.

Examples include:

```text
faceId
touchId
dynamicIsland
proMotion
alwaysOnDisplay
actionButton
cameraControl
ringSilentSwitch
homeButton
liDAR
macroPhotography
physicalTelephotoCamera
opticalQuality2xCrop
frontCameraAutofocus
centerStageFrontCamera
usbC
lightning
usb3Data
magSafe
qi2
wirelessCharging
appleIntelligence
partsHistoryFull
partsHistoryBatteryOnly
batteryCycleCountInSettings
```

A missing capability key is **unknown**, not false.

The rule resolver must support:

```text
capabilityAll
capabilityAny
capabilityNone
modelIds
iosMin
iosMax when later present
variantCondition
```

Return one of:

```text
APPLICABLE
NOT_APPLICABLE
DEFERRED
```

Use `DEFERRED` when required context is missing or a referenced capability is unknown. Never silently discard deferred rules.

---

# 13. Inspection profiles

The supplied dataset contains priorities but does not contain a dedicated inspection-profile dataset. The following profile mapping is an **application product configuration**, not an Apple fact and not a dataset modification.

Create `src/config/inspectionProfiles.js`:

```js
export const INSPECTION_PROFILES = {
  quick: {
    id: "quick",
    label: "Quick check",
    includedPriorities: ["critical"],
  },

  standard: {
    id: "standard",
    label: "Standard inspection",
    includedPriorities: ["critical", "high", "medium"],
  },

  deep: {
    id: "deep",
    label: "Deep inspection",
    includedPriorities: ["critical", "high", "medium", "low"],
  },
};
```

Rules:

- Do not display estimated minutes until timed user testing has been completed.
- A triggered conditional follow-up is added even when its priority is outside the original profile.
- Final-reset verification remains prominently available for all profiles.
- Reports must name the selected profile and show skipped/not-in-profile counts.
- A Quick result must never visually appear as equally comprehensive as a Deep result.
- If an unknown priority appears in a future dataset, include it only in Deep and log a non-blocking developer warning.

---

# 14. Rule resolver and inspection queue

## 14.1 Rule applicability

For every rule:

1. Resolve model restrictions.
2. Resolve iOS minimum/maximum.
3. Resolve required/all capabilities.
4. Resolve any-of capabilities.
5. Resolve excluded capabilities.
6. Resolve regional variant conditions.
7. Apply the selected inspection profile.
8. Record the reason for exclusion/deferment for diagnostics and reporting.

Do not mutate the original rule object.

## 14.2 Rule ordering

Order rules by:

1. category order from `categories.json`;
2. priority rank (`critical`, `high`, `medium`, `low`);
3. original dataset order as a stable tie-breaker.

Do not alphabetically reorder questions if that destroys the intended workflow.

## 14.3 Answer statuses

Keep these distinct:

```text
PASS
FAIL
WARNING
UNKNOWN
NOT_TESTED
NOT_APPLICABLE
UNAVAILABLE
```

A missing answer starts as `NOT_TESTED`.

Never convert:

```text
NOT_TESTED → PASS
UNKNOWN → PASS
UNAVAILABLE → PASS
NOT_APPLICABLE → PASS
```

## 14.4 Rule-level answer interpretation

The generic status attached to an answer option is only a UI default.

Final interpretation must use each rule’s `answerInterpretation` because “Yes” can be positive for one rule and adverse for another.

For example:

> Does the phone show “iPhone Locked to Owner”?

“Yes” is adverse and may trigger the official stop condition.

Implement:

```js
interpretAnswer(rule, selectedOptionId, value);
```

Return at least:

```js
{
  outcome: "POSITIVE | ADVERSE | UNKNOWN | OBSERVATION | UNCLASSIFIED",
  status: "PASS | FAIL | WARNING | UNKNOWN | NOT_TESTED | ...",
  adverse: false,
  positive: false,
  unresolved: false,
}
```

## 14.5 Numeric/text observations

For numeric or text answer sets:

- preserve the raw user-entered observation;
- validate format/range where technically obvious;
- do not invent a pass/fail threshold unless a dataset rule explicitly supplies one;
- allow “Unable to verify” separately from blank;
- show expected official values when the rule supplies an `expected` resolver.

---

# 15. Expected-value and deterministic comparison engine

Support expected values resolved from:

- device field paths;
- variant field paths;
- approved resolvers described in the rule;
- official values already present in the dataset.

Implement safe object-path access without `eval()`.

Examples:

```text
marketingName
storageGB
officialFinishNames
connector.type
physicalIdentification.rearCameraLayout
dimensionsMm
weightGrams
variant.marketGroupLabel
variant.physicalSimTray
```

## 15.1 Comparison outcomes

Return:

```text
MATCH
MISMATCH
UNRESOLVED
NOT_COMPARABLE
```

Do not compare free-text values using loose substring rules that can create false matches.

## 15.2 Weight measurement

If the user chooses to measure physical weight:

- ask whether case and accessories were removed;
- store measured grams;
- show official weight;
- show absolute difference;
- do not automatically declare the device fake;
- do not assign a failure threshold until calibrated policy exists.

---

# 16. Conditional follow-up engine

Consume `inspections/follow-up-rules.json`.

When a trigger matches:

- add each `addRuleIds` target once;
- preserve original category ordering;
- show the follow-up message;
- record why the rule was added;
- never remove a user’s previously answered rule;
- rerun follow-up resolution after each answer;
- prevent loops and duplicate insertion.

Examples already covered by the dataset include:

- finish mismatch;
- model/A-number inconsistency;
- SIM-tray inconsistency;
- Face ID failure;
- missing True Tone;
- swelling/lift signs;
- unknown parts;
- repeated panic logs;
- Activation Lock;
- Remote Management;
- camera condensation;
- charging/port issues.

A follow-up message must preserve the cautious wording from the dataset. Do not upgrade it into a fraud accusation.

---

# 17. Anomaly engine

The anomaly engine validates relationships between fields rather than simply checking each value independently.

Minimum deterministic relations:

```text
selected model ↔ A-number device
selected model ↔ storage
selected model ↔ official finish
selected model ↔ connector
selected model ↔ rear physical camera count/layout
selected model ↔ controls
selected model ↔ display cutout
selected model ↔ home button
A-number ↔ market group
A-number ↔ physical SIM-tray expectation
model ↔ measured dimensions when supplied
model ↔ measured weight when supplied
```

Each anomaly must include:

```js
{
  id,
  type,
  severityLabel,          // only if grounded by policy; otherwise "NEEDS_REVIEW"
  expected,
  observed,
  provenance,
  message,
  sourceIds,
  triggeredRuleIds,
}
```

Do not use one inconsistency to conclude counterfeit status.

---

# 18. Risk, scoring, completion, and confidence gating

This section is mandatory because the current policy files intentionally contain uncalibrated values.

## 18.1 Numeric condition score

Read:

```text
policy/scoring-policy.json
```

Enable a numeric score only when all of these are true:

```text
requiresCalibration === false
status indicates approved/active policy
all required category weights are finite numbers
required thresholds are populated
```

While calibration is required:

- hide the numeric score ring;
- do not show `0/100`;
- do not invent weights;
- show “Analytical condition score: Not calibrated” only in methodology/details, not as a frightening error;
- summarize findings by category and outcome instead.

## 18.2 Risk

Read `policy/risk-policy.json`.

Automatically assign policy risk levels only for active/grounded rules present in that file.

The current official stop condition for Activation Lock must be honored exactly when its configured rule/answer combination occurs.

For entries listed as candidates requiring approval:

- show a prominent safety or transaction concern;
- do not silently assign a policy level that the dataset has not approved;
- use wording such as “Immediate review required” or the dataset message;
- preserve the policy-review limitation in methodology.

## 18.3 Completion

Because priority weights are currently null, show a transparent raw completion metric rather than pretending it is calibrated weighted coverage.

Calculate:

```text
completed applicable rules
÷
applicable rules excluding NOT_APPLICABLE and UNAVAILABLE
```

Treat only recorded completed outcomes as completed. `NOT_TESTED` and `UNKNOWN` remain incomplete.

Label this:

```text
Checklist completion
```

Do not label it “weighted inspection coverage” until weights are active.

Also show counts:

```text
Completed
Needs attention
Unresolved
Not tested
Unavailable
Not applicable
```

## 18.4 Confidence

Read `policy/coverage-confidence-policy.json`.

Because confidence thresholds are currently null:

- do not assign High/Medium/Low confidence;
- show `Result confidence: Not calibrated` in methodology;
- show explicit confidence limitations instead;
- enforce hard rules, such as warning that confidence cannot be considered high when a critical check is unknown/not tested or final reset verification is incomplete.

Example UI:

```text
Result limitations
• 2 applicable critical checks were not completed.
• Final reset verification was skipped.
• The device is running a beta/newer unverified iOS version.
```

When future policy data becomes calibrated, the engine may enable weighted coverage and confidence without changing page components.

## 18.5 Final result during uncalibrated V1

The primary result must use:

- official stop conditions;
- critical/important findings;
- category summaries;
- identity inconsistencies;
- raw checklist completion;
- unresolved checks;
- final reset status;
- evidence provenance;
- transparent limitations.

Do not create a fake overall score merely to make the report look complete.

---

# 19. Parts & Service History handling

Use `inspections/parts-service-history.json`.

Rules:

- enforce the minimum iOS requirement from the dataset;
- use the model-specific supported part list;
- show Apple labels and dataset meanings for Genuine, Used, Unknown, Unverified, and Finish Repair;
- do not treat a genuine replacement as automatically bad;
- do not treat absence of the section as proof of no repair;
- do not ask unsupported models about unsupported parts;
- record each visible part status independently;
- trigger follow-ups defined by the inspection dataset.

---

# 20. Browser diagnostics

Read `inspections/browser-diagnostics.json`.

Every diagnostic must have runtime capability states:

```text
AVAILABLE
PERMISSION_REQUIRED
DENIED
UNSUPPORTED
RUNNING
COMPLETED_BY_USER
CANCELLED
ERROR
```

Opening a diagnostic is not completion.

No browser diagnostic in V1 should automatically certify hardware quality.

## 20.1 Display patterns

Create a fullscreen, safe-area-aware pattern viewer using the supplied pattern definitions:

- solid white;
- black;
- red;
- green;
- blue;
- gray levels;
- grayscale gradient;
- checkerboard;
- small text chart.

Requirements:

- disable accidental page scrolling;
- provide visible Previous, Next, and Exit controls;
- keep controls hidden only temporarily and make them recoverable with a tap;
- restore original screen state on exit;
- ask the user what they observed afterward;
- show the dataset disclaimer that patterns cannot certify calibration, brightness, PWM, refresh rate, or panel authenticity.

The diagnostic color values are test patterns, not official iPhone finish swatches.

## 20.2 Touch grid

- Generate a responsive grid at runtime.
- Do not hardcode pass thresholds because the dataset marks grid dimensions/calibration unresolved.
- Track touched cells, untouched cells, and pointer interruptions.
- Let the user repeat the test.
- Show raw touch coverage as an observation.
- Ask the user whether any area consistently failed after repeated attempts.
- Never automatically declare the digitizer defective based on one incomplete swipe.

## 20.3 Audio cues

- Use locally owned/generated spoken left, right, and center cues.
- Do not use copyrighted music.
- Ask the user to report distortion, imbalance, rattling, or low output.
- Treat it as a listening aid, not frequency calibration.

## 20.4 Microphone

- Request permission only after a user gesture.
- Record a short sample to memory by default.
- Show recording status and a simple level meter.
- Allow playback and immediate deletion.
- Do not persist the audio unless the user explicitly chooses to attach it as evidence.
- Explain that Safari cannot isolate/certify every physical microphone.

## 20.5 Camera

- Request camera permission only after a user gesture.
- Enumerate available camera constraints where allowed.
- Allow front/rear switching when the browser exposes it.
- Do not claim access to every physical lens or Apple Camera feature.
- Do not save captures by default.

## 20.6 Motion/orientation

- Detect API support.
- Request iOS permission only after a user gesture when required.
- Display raw orientation/motion response.
- Do not call it sensor calibration.

## 20.7 Companion phone versus inspected iPhone

The normal scenario uses two physical devices:

```text
Buyer/companion phone → runs the checklist and stores the inspection
Used iPhone           → is the target that must run hardware diagnostics
```

A browser diagnostic only tests the physical device on which that diagnostic page is open. The application must never run a display, touch, microphone, camera, audio, or motion test on the buyer's companion phone and attribute the observation to the used iPhone.

Before every browser diagnostic, ask:

```text
Is this page open on the iPhone being inspected?
```

If the answer is No, provide:

- a QR code that opens the target diagnostic route;
- a copyable short URL;
- concise instructions to open the route on the used iPhone;
- a manual result-entry fallback.

Minimum V1 handoff:

1. Companion phone prepares the required diagnostic route.
2. User opens it on the used iPhone.
3. Used iPhone runs the diagnostic locally.
4. Used iPhone displays a clear result summary.
5. Buyer records the observation in the companion inspection.
6. Manually transferred results use provenance `USER_OBSERVATION`, because the companion app did not directly receive the browser result.

Preferred backend-free enhancement:

1. Generate a random one-time nonce on the companion phone.
2. Include only test IDs, application version, dataset version, and nonce in the request QR.
3. Run tests locally on the used iPhone.
4. Generate a compact result QR containing the nonce, timestamp, test outcomes, and relevant versions.
5. Scan the result QR on the companion phone.
6. Validate the nonce and payload schema before import.
7. Imported validated diagnostic results may use provenance `BROWSER_OBSERVATION`.

Never place any of the following in a diagnostic URL or QR payload:

- full IMEI;
- serial number;
- seller information;
- receipt data;
- screenshots or photos;
- audio recordings;
- user notes.

The report must retain which physical-device workflow produced each diagnostic observation.

---

# 21. Pre-reset and final-reset workflow

Separate the inspection into:

## 21.1 Phase A — Before reset

Complete checks that require the current configured device:

- About/model information;
- battery information;
- Parts & Service History;
- display settings;
- cameras;
- Face ID/Touch ID;
- speakers/microphones;
- cellular/Wi-Fi/Bluetooth;
- charging;
- software/analytics observations;
- physical condition;
- seller/transaction questions.

## 21.2 Phase B — Final verification before payment

Guide the seller/buyer through the supplied reset/activation rules. The workflow must explain that destructive actions should occur only with the seller’s consent and after the seller preserves their data.

The result must separately record:

- seller signed out where applicable;
- Find My/account removal observations;
- erase initiated;
- setup restarted;
- activation flow reached;
- “iPhone Locked to Owner” result;
- Remote Management screen result;
- normal setup flow result;
- whether final verification was completed or skipped.

If Activation Lock is observed, show the official stop-condition message configured in risk policy.

If final verification is skipped:

```text
Final reset verification was not completed.
```

This warning must appear near the top of the report, not only in details.

---

# 22. Local persistence and privacy

## 22.1 IndexedDB database

Use a database such as:

```text
inspectra-db
```

Object stores:

```text
inspections
evidence
reports
settings
```

Suggested versions:

```js
inspections: keyPath "id"
evidence: keyPath "id", index "inspectionId"
reports: keyPath "id", index "inspectionId"
settings: keyPath "key"
```

## 22.2 Autosave

Autosave after:

- device/context change;
- profile selection;
- every answer;
- note/evidence change;
- category completion;
- reset-verification step;
- diagnostic completion.

Show a subtle status:

```text
Saved on this device
```

Do not interrupt the inspection with save confirmations.

## 22.3 Evidence

Evidence may include:

- photo;
- screenshot;
- note;
- numeric observation;
- optional locally retained audio.

Requirements:

- keep evidence local in V1;
- show approximate storage usage;
- allow evidence deletion;
- provide “Delete inspection and all evidence”;
- do not upload anything;
- do not embed full identifiers into publicly shareable output;
- warn users that screenshots may contain sensitive identifiers/account information.

## 22.4 Historical report integrity

When finalizing a report, store a snapshot of:

- device display name;
- selected official values;
- variant market-group label;
- question titles and selected labels;
- findings and wording;
- source titles/URLs used;
- dataset and policy versions;
- timestamps.

Do not silently recalculate old reports when `data/iphone/` is later replaced with a newer dataset.

A future “Reanalyze using current dataset” action must create a new report/version rather than overwrite the original.

---

# 23. PWA and offline behavior

## 23.1 Manifest

Create `public/manifest.webmanifest` with:

- name: `Inspectra`;
- short name: `Inspectra`;
- standalone display;
- portrait-primary orientation preference without blocking landscape;
- white/near-white theme and background colors;
- proper icons supplied/generated for the app;
- start URL compatible with the selected router.

## 23.2 Service Worker caching

Use cache names containing:

```text
app version + dataset manifest version
```

Strategies:

### Precache

- app shell;
- compiled CSS/JS;
- icons;
- manifest;
- dataset manifest;
- device index;
- English localization;
- offline fallback page.

### Runtime cache

- device catalog;
- variants;
- rules;
- navigation;
- policies;
- diagnostic assets.

Use cache-first for immutable build assets and stale-while-revalidate or network-first-with-cache-fallback for versioned JSON, while ensuring a report records the actual dataset version used.

## 23.3 Update behavior

When a new Service Worker is waiting:

```text
An Inspectra update is available.
[Update now]
```

Do not force-reload in the middle of an active unsaved inspection.

## 23.4 Offline limitations

- The core inspection and supplied dataset should work offline after caching.
- Google Fonts may require a first successful online load; provide a strong system-font fallback.
- Any future external lookup must explicitly show that internet is required.
- Never make offline failure look like a device failure.

Service Workers require HTTPS in production, except localhost development.

---

# 24. Routing and pages

Use a lightweight SPA router. Hash routing is acceptable for maximum static-host compatibility:

```text
/#/
/#/explore
/#/models/iphone-16-pro
/#/identify
/#/inspection/new
/#/inspection/:id
/#/inspection/:id/reset
/#/report/:id
/#/saved
/#/privacy
/#/terms
```

If History API routing is used instead, include deployment rewrites to `index.html` for every route.

## 24.1 Home page

Hero:

```text
Know the iPhone before you buy it.
```

Supporting line:

```text
Identify. Inspect. Analyze.
```

Primary actions:

- Inspect a used iPhone.
- Explore iPhone models.

Additional sections:

- how it works;
- what Inspectra can and cannot verify;
- privacy/local-first note;
- analytical-not-guaranteed note;
- supported dataset version and last verified date.

## 24.2 Explore page

Driven by `device-index.json` and `device-catalog.json`.

Features:

- generation/family filter;
- year filter;
- segment filter;
- search by marketing name;
- sort newest-first by dataset fields;
- no hardcoded latest generation;
- cards with model name, year, storage summary, exact finish names, and major capabilities.

Use graceful text/device silhouettes when no approved model imagery exists.

## 24.3 Model specification page

Editorial, progressive layout—not one giant table.

Sections sourced from the device record:

- overview;
- exact finishes;
- storage;
- dimensions and weight;
- construction;
- display;
- chip;
- rear cameras;
- front camera;
- battery reference;
- biometrics;
- controls;
- connector/data standard;
- charging;
- water resistance;
- physical identification;
- capabilities;
- regional variants;
- sources and verification metadata.

When a value is null, show:

```text
Not verified in the current dataset
```

Do not omit null values in a way that misleadingly implies “No.”

## 24.4 Identify page

Mobile-first sequence:

1. Enter A-number or select a model.
2. Confirm resolved model.
3. Select/confirm storage.
4. Select/confirm observed finish.
5. Enter installed iOS version and channel.
6. Show identity-consistency preview.
7. Continue to disclaimer/profile selection.

Include version-aware instructions for finding model information using the dataset navigation routes.

## 24.5 Disclaimer page

- Display dataset acknowledgement.
- Require explicit consent.
- Link Privacy and Terms.
- Do not use a pre-checked checkbox.

## 24.6 Inspection setup page

Show:

- selected device;
- market group;
- storage/finish;
- installed iOS;
- known identity inconsistencies;
- Quick/Standard/Deep profile choices;
- explanation that profiles affect breadth, not certainty;
- resume existing matching inspection when appropriate.

## 24.7 Inspection page

Show one question at a time.

Header:

- back;
- category;
- overall raw progress;
- save status.

Body:

- title;
- concise question;
- optional expected official value;
- large answer controls;
- “How to check” bottom sheet;
- optional evidence/note;
- source link in secondary details;
- persistent analytical qualifier.

Bottom action:

- Previous;
- Continue;
- Skip/Unable to verify only when supported by the answer set.

Do not show an entire 300-rule form.

## 24.8 Diagnostic page

Use distraction-free fullscreen tools, explicit permissions, cancel/retry, and post-test user confirmation.

The page must prominently identify whether it is running in:

```text
Companion mode
Target-device diagnostic mode
```

Before a hardware diagnostic starts, require confirmation that the page is open on the iPhone being inspected. When it is not, show the QR/URL handoff flow described in section 20.7.

## 24.9 Reset verification page

Visually separate this from ordinary inspection because it may involve destructive device actions. Use clear warnings and seller-consent language.

## 24.10 Report page

Primary hierarchy while scoring is uncalibrated:

1. Device identity.
2. Official stop conditions.
3. Final-reset completion warning.
4. Critical/high-priority findings.
5. Identity inconsistencies.
6. Checklist completion.
7. Category summary.
8. Positive findings.
9. Unresolved/not-tested checks.
10. Evidence/provenance.
11. Sources/methodology.
12. Dataset and policy versions.
13. Disclaimer.

Add print CSS so the browser’s Print → Save as PDF produces a clean report. Do not add a PDF library in V1 unless needed later.

## 24.11 Saved inspections

- list local inspections;
- show device, profile, progress, updated date;
- continue;
- view completed report;
- delete with confirmation;
- clearly state “Stored only on this device.”

---

# 25. Apple-inspired visual system

The design should feel premium, calm, clear, and editorial, but it must not clone Apple’s pages, copyrighted imagery, or trademark presentation pixel-for-pixel.

## 25.1 Mobile-first target

Design first for:

```text
360px–430px viewport width
```

Then enhance for tablet and desktop.

Primary real-world condition:

> The user is holding another device, possibly standing in a shop, and needs one-handed, high-clarity interaction.

## 25.2 Typography

Google Font:

```text
Inter
```

Fallback:

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Suggested scale:

```text
Hero:       clamp(2.5rem, 10vw, 4.5rem), line-height 1.02
Page H1:    clamp(2rem, 8vw, 3.5rem), line-height 1.08
Section H2: clamp(1.65rem, 6vw, 2.5rem), line-height 1.15
Card H3:    1.25rem–1.5rem
Body:       1rem–1.0625rem, line-height 1.55
Small:      0.875rem
Caption:    0.75rem–0.8125rem
```

Use weights 400, 500, 600, and 700. Avoid overly bold dense screens.

## 25.3 Color tokens

Define CSS variables:

```css
:root {
  --bg: #ffffff;
  --surface: #f5f5f7;
  --surface-elevated: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --border: #d2d2d7;
  --accent: #0071e3;
  --accent-pressed: #0062c4;
  --success: #16883f;
  --warning: #a15c00;
  --danger: #c5221f;
  --info: #2463eb;
  --unknown: #6b7280;
}
```

Semantic colors must not be the only status indicator. Pair every status color with icon/text.

## 25.4 Spacing

Use an 8-point rhythm:

```text
4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96
```

- mobile page horizontal padding: 20px;
- large mobile card padding: 20–24px;
- major section separation: 48–80px;
- desktop content max width: 1200–1280px;
- reading/report width: approximately 720–820px.

Whitespace is required. Do not compress the app into an admin dashboard.

## 25.5 Cards and surfaces

Use:

- `rounded-2xl` and `rounded-3xl`;
- subtle neutral surfaces;
- minimal borders;
- extremely soft shadows only where elevation helps;
- no excessive glassmorphism;
- no decorative gradients behind every card;
- no noisy icon collections.

## 25.6 Buttons and targets

- minimum target: 44×44px;
- preferred target: 48px high or larger;
- primary mobile buttons usually full width;
- sticky bottom action bars must include `env(safe-area-inset-bottom)`;
- destructive actions require confirmation;
- disabled states must remain legible.

## 25.7 Motion

- 150–250ms for normal transitions;
- opacity/translation preferred;
- no large parallax or distracting auto-animation during inspection;
- obey `prefers-reduced-motion`;
- do not animate score rings when scores are not available.

## 25.8 Finish presentation

Because official CSS swatches are not supplied:

- display exact names prominently;
- use neutral circular outline markers or approved separate artwork;
- never create approximate swatches and call them official;
- do not merge distinct Apple finish names.

---

# 26. Accessibility requirements

Meet WCAG 2.2 AA targets where applicable.

Required:

- semantic landmarks;
- one H1 per page;
- logical heading order;
- proper labels/descriptions;
- visible keyboard focus;
- full keyboard operation on desktop;
- screen-reader announcements for progress, answer saves, dynamic follow-ups, errors, and diagnostic state;
- focus trapping/restoration for dialogs and bottom sheets;
- touch targets of at least 44×44px;
- no status communicated only by color;
- sufficient contrast;
- zoom/reflow support;
- reduced-motion support;
- accessible progress indicators;
- skip link;
- no auto-advancing question without confirmation;
- permission-denied states that are understandable without technical jargon.

Use `aria-live="polite"` for save/progress updates and assertive announcements only for critical errors/official stop conditions.

---

# 27. Security and privacy requirements

- HTTPS in production.
- Strict Content Security Policy through host headers where possible.
- Avoid inline scripts to simplify CSP.
- Never render user notes with unsanitized `innerHTML`.
- Prefer `textContent` and explicit DOM creation.
- Validate uploaded evidence type and size before local storage.
- Revoke generated object URLs.
- Do not transmit identifiers/evidence to analytics.
- Do not include raw inspection state in URL parameters.
- Do not use third-party ad trackers.
- Do not request camera/microphone/motion permission until the user starts that diagnostic.
- Provide a one-tap local data deletion flow.
- Explain that browser/local-device deletion policies can remove saved data.

If analytics is added, restrict it to events such as:

```text
inspection_started
inspection_completed
inspection_abandoned
model_selected
profile_selected
category_completed
diagnostic_started
diagnostic_completed
report_viewed
```

Never include serial, IMEI, notes, evidence, seller data, or exact report findings in analytics properties.

---

# 28. Error handling

Every asynchronous feature needs loading, empty, error, and retry states.

Required errors:

- dataset missing;
- invalid manifest;
- primary JSON parse failure;
- unresolved source/reference;
- unsupported iOS route;
- browser API unsupported;
- permission denied;
- IndexedDB unavailable/quota exceeded;
- Service Worker registration failure;
- offline resource missing;
- report snapshot failure.

Device problems and website errors must never look the same.

Example:

```text
Camera test unavailable in this browser
```

must not be rendered as:

```text
Camera failed
```

---

# 29. Performance requirements

- Keep the initial page lightweight.
- Lazy-load the 300+ inspection rules only when inspection begins.
- Lazy-load diagnostics.
- Cache parsed data and indexes.
- Avoid repeated full-array scans inside question rendering.
- Use responsive, owned SVG/AVIF/WebP assets.
- Avoid layout shifts.
- Preconnect to Google Fonts and use `display=swap`.
- Maintain system-font fallback.
- Do not ship unnecessary libraries.
- Virtualization is optional because one question is rendered at a time; do not over-engineer.
- Run Lighthouse on production preview and address major accessibility/performance issues.

---

# 30. Testing requirements

## 30.1 Unit tests

Cover:

- version parsing and comparison;
- A-number normalization;
- device/variant resolution;
- model/A-number mismatch;
- unknown A-number;
- shared market-group output;
- null value handling;
- capability all/any/none;
- iOS min/max applicability;
- deferred rules;
- profile filtering;
- rule ordering;
- answer interpretation;
- expected device/variant value resolution;
- follow-up insertion/deduplication;
- anomaly generation;
- Activation Lock stop condition;
- score gate when calibration is required;
- raw completion counts;
- confidence limitation hard rules;
- prohibited report phrase detection;
- report snapshot stability.

## 30.2 Dataset integration tests

Use the supplied data, not copied mock facts, to verify:

- every indexed device resolves to a catalog device;
- every device has at least one regional variant when expected by the dataset;
- every variant references a valid device;
- finish IDs resolve;
- capability device IDs resolve;
- every inspection rule’s category and answer set resolve;
- navigation IDs resolve;
- follow-up target IDs resolve;
- sources resolve;
- all JSON files used in production parse.

## 30.3 UI tests

At minimum manually/test with automation where practical:

- 360px, 390px, 430px widths;
- tablet;
- desktop;
- keyboard-only;
- reduced motion;
- large text/zoom;
- offline after caching;
- refresh halfway through inspection;
- denied permissions;
- new/unknown iOS version;
- missing exact navigation route;
- report print layout.
- complete Playwright flows for identify, inspect, resume, reset warning, and report.

## 30.4 Real-device QA

Test representative physical phones across:

- older non-Pro;
- older Pro;
- current base model;
- current Pro;
- Touch ID model;
- Face ID model;
- Lightning;
- USB-C;
- physical-SIM-tray market group;
- no-physical-SIM-tray market group;
- older supported iOS;
- current stable iOS;
- beta only if available and clearly marked.

Observe users holding one phone while testing another.

---

# 31. Exact implementation order

Follow this sequence. Do not begin with ornamental UI before data/context engines work.

## Phase 1 — Foundation

1. Scaffold Vite vanilla project.
2. Add Tailwind Vite plugin.
3. Add Inter Google Font and system fallback.
4. Add linting, formatting, and tests.
5. Create the modular folder structure.
6. Create design tokens, base typography, focus styles, safe-area utilities, and reusable buttons/cards.
7. Create the basic router and global error boundary.

## Phase 2 — Dataset integration

8. Implement `DATA_ROOT` and central repository.
9. Implement manifest/data health gate.
10. Implement read-only build validation script.
11. Implement production copy script.
12. Implement dataset indexes.
13. Implement source resolver.
14. Add tests for all loaders and references.

## Phase 3 — Model explorer

15. Build Home page.
16. Build Explore page using device index/catalog.
17. Build Model specification page.
18. Build exact finish-name presentation without fake swatches.
19. Build regional variant section.
20. Add source and verification metadata.

## Phase 4 — Identification/context

21. Implement A-number normalization/resolution.
22. Implement manual model selection.
23. Implement model/A-number inconsistency handling.
24. Implement storage and finish comparison.
25. Implement iOS version parser/channel handling.
26. Implement capability resolver.
27. Build Identify page and confirmation summary.

## Phase 5 — Inspection engine

28. Implement disclaimer acknowledgement.
29. Implement application inspection profiles.
30. Implement rule applicability resolver.
31. Implement rule ordering and queue.
32. Implement answer-set renderer.
33. Implement rule-level answer interpretation.
34. Implement expected-value resolver.
35. Implement Settings navigation resolver.
36. Build one-question-at-a-time Inspection page.
37. Add notes/evidence entry.
38. Add category/progress navigation.

## Phase 6 — Analysis logic

39. Implement follow-up resolver.
40. Implement anomaly engine.
41. Implement official risk-policy resolver.
42. Implement scoring gate.
43. Implement raw completion summary.
44. Implement confidence-limitations logic without invented bands.
45. Add prohibited-phrase checks to report tests.

## Phase 7 — Browser diagnostics

46. Implement runtime capability detector.
47. Implement companion-versus-target mode state.
48. Implement target-device confirmation.
49. Implement QR/copy-link diagnostic opening, with manual transfer as the required baseline.
50. Implement display patterns.
51. Implement touch-grid observation.
52. Implement local audio cues.
53. Implement microphone memory-only record/playback.
54. Implement camera preview.
55. Implement motion/orientation observation.
56. Add denied/unsupported/error fallbacks.
57. Add tests proving a companion-device result cannot be attributed automatically to the inspected iPhone.

## Phase 8 — Reset verification and report

58. Build final-reset workflow.
59. Implement Activation Lock official stop condition.
60. Implement reset-skipped warning.
61. Build report engine and report page.
62. Add source/methodology/policy versions.
63. Add print stylesheet.
64. Add disclaimer and legal links.

## Phase 9 — Persistence/PWA

65. Implement IndexedDB stores and migrations.
66. Autosave after every meaningful change.
67. Build Saved Inspections page.
68. Implement report snapshots.
69. Create PWA manifest and icons.
70. Implement Service Worker caching.
71. Add update prompt and offline indicators.
72. Test mid-inspection refresh and offline continuation.

## Phase 10 — Production QA

73. Complete unit/integration tests.
74. Complete Playwright end-to-end tests.
75. Run dataset validation.
76. Run accessibility audit.
77. Test on real iPhones/Safari.
78. Test all permission states.
79. Test report language against prohibited phrases.
80. Review privacy flows.
81. Obtain legal review of draft disclaimer/terms before commercial launch.
82. Optimize Core Web Vitals.
83. Build and preview production output.
84. Confirm `dist/data/iphone/` contains the copied dataset.
85. Deploy over HTTPS.

---

# 32. Reporting contract

Each final report must contain:

```js
{
  reportId,
  inspectionId,
  generatedAt,
  appVersion,
  datasetVersion,
  datasetVerifiedAt,
  policyVersions,
  disclaimerVersion,

  inspectionProfile,
  deviceSnapshot,
  variantSnapshot,
  iosSnapshot,

  officialStopConditions,
  identityFindings,
  adverseFindings,
  positiveFindings,
  unresolvedFindings,
  notTestedFindings,
  unavailableFindings,

  checklistCompletion,
  scoringAvailability,
  confidenceAvailability,
  confidenceLimitations,
  resetVerification,

  categorySummaries,
  provenanceSummary,
  sourceSnapshots,
  methodologyNotes,
  disclaimer,
}
```

## 32.1 Category summaries

When scoring is unavailable, a category summary should show:

```text
Display & Touch
12 completed · 2 need attention · 1 unresolved · 3 not tested
```

Do not convert those counts into a percentage quality score.

## 32.2 Sources

Every official fact/finding with source IDs should provide:

- publisher;
- title;
- URL;
- retrieved/verified date where available.

Use external-link indicators and `rel="noopener noreferrer"`.

## 32.3 Service-program wording

If `service-programs.json` is empty/unpopulated, display:

```text
Apple service-program eligibility was not checked by this dataset version.
```

Never display:

```text
No service program applies.
```

---

# 33. Definition of done

V1 is complete only when all of these are true:

- [ ] The app never requires editing `data/iphone/`.
- [ ] Missing/invalid data produces a clear blocking error rather than mock content.
- [ ] All models are discovered dynamically from the dataset.
- [ ] The latest model is not hardcoded.
- [ ] Model specifications render from device records.
- [ ] Exact official finish names are preserved.
- [ ] No fake official finish swatches are displayed.
- [ ] A-number resolution works.
- [ ] Shared A-number groups are not presented as one exact country.
- [ ] Storage, finish, connector, layout, controls, and supported physical facts can be compared.
- [ ] iOS versions are parsed numerically.
- [ ] Beta/newer-unverified iOS versions show limitations.
- [ ] Settings paths resolve from the navigation dataset.
- [ ] Unsupported or unresolved paths do not become phone failures.
- [ ] Capability-inapplicable questions never appear.
- [ ] Deferred questions remain distinguishable.
- [ ] Answer interpretation uses rule-level policy.
- [ ] `NOT_TESTED` and `UNKNOWN` never count as passes.
- [ ] Conditional follow-ups work and do not duplicate.
- [ ] Browser diagnostics clearly distinguish browser support from device results.
- [ ] Companion mode and target-device diagnostic mode are visibly distinct.
- [ ] The app cannot automatically attribute a diagnostic run on the companion phone to the inspected iPhone.
- [ ] Manual diagnostic transfer is labeled as a user observation; validated local import is labeled as a browser observation.
- [ ] Diagnostic opening is not counted as completion.
- [ ] Final-reset verification has a dedicated flow.
- [ ] Activation Lock applies the configured official stop condition.
- [ ] Skipped final reset is prominent in the report.
- [ ] Numeric scoring is hidden while calibration is required.
- [ ] Weighted coverage is not invented.
- [ ] Confidence bands are not invented.
- [ ] Raw checklist completion is transparent.
- [ ] Reports separate official facts, observations, and inferences.
- [ ] Prohibited absolute phrases are absent.
- [ ] Full identifiers are not exposed in URLs/reports/analytics.
- [ ] Inspections autosave locally.
- [ ] Saved inspections can be resumed/deleted.
- [ ] Old reports remain stable after dataset updates.
- [ ] Core workflow works offline after caching.
- [ ] Service Worker updates do not destroy active progress.
- [ ] The UI is mobile-first, polished, spacious, accessible, and one-handed.
- [ ] Real-device Safari testing is complete.
- [ ] Build-time dataset validation passes.
- [ ] Production build copies `data/iphone/` to `dist/data/iphone/`.
- [ ] Legal wording is visibly present and queued for qualified review.

---

# 34. Final product principle

Inspectra’s credibility must come from:

```text
accurate supplied data
+ exhaustive guided inspection
+ model/iOS/region-aware logic
+ transparent provenance
+ cautious language
+ explicit uncertainty
```

The internal system can be detailed and extensive. The visible experience must remain calm, simple, mobile-first, and easy to use while the buyer is standing beside a seller.

Never make the interface appear more certain than the underlying data and completed checks justify.

---

# Appendix A — Exhaustive inspection coverage

The rule dataset is authoritative. The application must render every applicable supplied rule, even when a topic below is not named explicitly. This appendix defines the expected user-facing coverage and prevents accidental omission of an entire inspection area.

## A.1 Identity and configuration

Cover applicable checks for:

- marketing model shown in Settings;
- Apple `Axxxx` hardware number;
- selected model versus resolved model;
- storage capacity;
- official finish name;
- exterior finish consistency;
- optional part number as an unparsed user observation;
- connector type;
- rear physical camera count;
- camera arrangement;
- side-button layout;
- volume controls;
- Ring/Silent switch, Action button, Camera Control, and Home button where applicable;
- notch, Dynamic Island, or other display-cutout configuration;
- published dimensions;
- published weight;
- frame/back/front construction where present;
- obvious model-conversion or housing inconsistency indicators.

Do not conclude counterfeit status from one inconsistency.

## A.2 Regional hardware variant

Cover applicable checks for:

- `Axxxx` market group;
- the complete country/region list published in the dataset;
- whether the market group is enumerated or broad;
- physical SIM-tray expectation;
- SIM-tray side;
- external Liquid Contact Indicator expectation;
- regional hardware differences explicitly stored in the dataset;
- unresolved eSIM, SIM-slot-count, or cellular-band information.

Do not rewrite `United Arab Emirates` as `Dubai`. Do not reduce a shared market group to `USA`, `Japan`, `India`, `Australia`, or another single-country label without a supporting data field.

## A.3 Ownership, activation, and management

Cover applicable checks for:

- Apple Account still signed in;
- Find My transfer preparation;
- seller's ability to remove the account;
- Activation Lock during final setup;
- `iPhone Locked to Owner`;
- unexpected previous-owner credentials;
- Remote Management;
- device supervision;
- VPN and Device Management profiles;
- configuration profiles and certificates;
- carrier-lock field where the navigation/rule dataset supports it;
- seller willingness to complete the final reset.

Activation Lock must apply the configured official stop condition exactly.

## A.4 Parts and repair history

Cover applicable checks for:

- visibility of Parts & Service History;
- minimum supported iOS requirement;
- Battery;
- Display;
- Logic Board where supported;
- Front Camera where supported;
- Rear Cameras where supported;
- Genuine;
- Used;
- Unknown;
- Unverified;
- Finish Repair;
- housing replacement indicators;
- frame, screw, camera-ring, back-panel, and panel-gap evidence;
- repair disclosure from the seller.

Absence of the Parts & Service History section is unknown, not proof of no repair.

## A.5 Battery and power behavior

Cover applicable checks for:

- Maximum Capacity;
- Cycle Count where exposed;
- manufacture date where exposed;
- first-use date where exposed;
- peak-performance capability message;
- battery warning messages;
- unexpected shutdowns;
- restart under load;
- abnormal idle drain as an observation;
- charging consistency;
- abnormal heat;
- screen lift;
- back lift;
- swelling signs;
- battery-related repair status.

Do not introduce automatic buying thresholds for capacity or cycle count until calibrated policy data exists.

## A.6 Display and touch

Cover applicable checks for:

- dead pixels;
- stuck pixels;
- OLED burn-in;
- image retention;
- gray uniformity;
- tint;
- brightness behavior;
- outdoor/low-brightness observation where guided;
- touch dead zones;
- edge touch;
- ghost touch;
- multi-touch;
- Haptic Touch;
- True Tone;
- auto-brightness behavior;
- ProMotion where supported;
- Always-On Display where supported;
- display repair status;
- browser display patterns;
- target-device touch grid.

Browser patterns are observation aids and cannot certify panel authenticity, calibration, PWM, peak brightness, or refresh rate.

## A.7 Cameras

Cover applicable checks for:

- front camera;
- main camera;
- ultrawide camera;
- physical telephoto camera where supported;
- optical-quality crop versus physical-lens distinction;
- autofocus;
- close-focus behavior;
- lens switching;
- flash;
- Portrait mode;
- Night mode;
- Macro;
- ProRAW;
- ProRes;
- Cinematic mode;
- spatial video where supported;
- optical/image stabilization as a guided observation;
- video stabilization while walking;
- zoom controls;
- LiDAR where supported;
- Camera Control where supported;
- camera-lens glass;
- camera-ring alignment;
- dust, haze, spots, focus hunting, or condensation;
- front/rear camera repair status.

Do not assume browser camera enumeration exposes every physical Apple lens.

## A.8 Biometrics and sensors

Cover applicable checks for:

- Face ID setup;
- Face ID unlock;
- Attention Awareness;
- Touch ID where applicable;
- TrueDepth-related portrait/depth behavior;
- proximity sensor;
- ambient-light behavior;
- accelerometer;
- gyroscope;
- orientation changes;
- compass;
- GPS;
- barometer where applicable;
- LiDAR and UWB only where a practical supplied rule exists;
- motion/orientation browser aid.

A browser observation is not sensor calibration.

## A.9 Audio and microphones

Cover applicable checks for:

- earpiece;
- bottom/loudspeaker;
- stereo balance;
- distortion;
- rattling;
- maximum-volume observation;
- Voice Memos;
- normal-call microphone;
- speakerphone;
- front-camera video audio;
- rear-camera video audio;
- browser microphone record/playback;
- target-device left/right/center audio cues.

Use locally owned audio assets. Do not use copyrighted music.

## A.10 Controls and haptics

Cover applicable checks for:

- side/power button;
- volume up;
- volume down;
- Ring/Silent switch;
- Action button;
- Camera Control;
- Home button;
- click feel;
- sticking or looseness;
- vibration;
- system haptics;
- Haptic Touch behavior.

Only show controls the selected model supports.

## A.11 Charging and ports

Cover applicable checks for:

- Lightning or USB-C consistency;
- visible debris;
- corrosion;
- bent/damaged contacts;
- cable fit;
- charging in supported cable orientation;
- charging interruption when moved;
- wired charging;
- abnormal port heat;
- computer/data connection;
- MagSafe where supported;
- Qi/Qi2 where supported;
- liquid-detection warning when observed;
- connector alignment with the housing.

## A.12 Cellular and wireless

Cover applicable checks for:

- physical SIM detection;
- eSIM observation only where supported by verified data/rules;
- calls;
- SMS;
- mobile data;
- 4G/5G observation;
- signal stability;
- hotspot;
- Wi-Fi;
- Bluetooth;
- AirDrop;
- GPS/location;
- carrier-lock field;
- NFC/UWB only where a supplied practical rule exists.

Do not advertise universal carrier compatibility without normalized band/carrier data.

## A.13 Physical condition

Cover applicable checks for:

- front glass;
- rear glass;
- display/frame seating;
- frame scratches;
- dents;
- bends;
- chassis deformation;
- camera lenses;
- camera rings;
- button alignment;
- antenna bands;
- connector;
- speaker/microphone grilles;
- SIM tray;
- screws;
- panel gaps;
- back-glass fit;
- finish uniformity;
- housing consistency;
- screen protector/case interference;
- optional measured weight/dimensions as raw comparisons.

Do not apply an unapproved pass/fail weight tolerance.

## A.14 Liquid-exposure indicators

Cover applicable checks for:

- externally visible LCI when expected for the resolved variant;
- LCI color observation;
- port corrosion;
- SIM-tray corrosion;
- screw oxidation;
- camera condensation;
- display staining;
- speaker irregularities;
- charging irregularities;
- Face ID/TrueDepth irregularities that justify further checking.

Use wording such as:

```text
No visible liquid-exposure indicator was identified during the completed checks.
```

Never claim the phone has never been exposed to liquid or retains its original water resistance.

## A.15 Software health

Cover applicable checks for:

- installed iOS version;
- software channel;
- represented/unrepresented version warning;
- available storage;
- abnormal lag;
- app/system crashes;
- camera crashes;
- repeated restarts;
- thermal warnings;
- analytics-data path;
- repeated `panic-full` observations;
- baseband/modem symptoms;
- update availability only when a verified source supports it.

Do not infer the latest historical minor release.

## A.16 Seller and transaction

Cover applicable checks for:

- original receipt availability;
- box availability;
- manually observed identifier matching;
- seller's repair disclosure;
- seller's ownership claim as an unverified observation;
- seller permits full inspection;
- seller permits final reset;
- seller can remove the Apple Account;
- carrier/financing disclosure;
- unusual urgency;
- suspiciously low price only as a user-entered transaction concern unless a verified market dataset exists;
- payment timing after reset/activation checks.

Do not claim financing, ownership, or blacklist clearance.

## A.17 Final reset and activation

Cover applicable checks for:

- seller data backed up with seller consent;
- Apple Account sign-out;
- Find My disabled as required;
- erase process completed;
- setup starts normally;
- network activation attempted;
- previous-owner credentials not requested;
- no `iPhone Locked to Owner` state;
- no unexpected Remote Management;
- normal setup flow reached;
- final-reset status stored in the report.

If skipped, the report must prominently state that ownership transfer and management status remain incompletely checked.

---

# Appendix B — Required build-script reference implementations

These snippets are implementation references. Preserve their read-only treatment of `data/iphone/` and adapt only when the project structure genuinely requires it.

## B.1 Production dataset copy

```js
// scripts/copy-data.mjs
import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sourceRoot = path.resolve("data/iphone");
const destinationRoot = path.resolve("dist/data/iphone");
const manifestPath = path.join(sourceRoot, "manifest.json");

async function main() {
  try {
    await access(manifestPath);
  } catch {
    throw new Error(
      "Dataset not found. Place the supplied files so data/iphone/manifest.json exists.",
    );
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(path.dirname(destinationRoot), { recursive: true });
  await cp(sourceRoot, destinationRoot, {
    recursive: true,
    force: true,
    errorOnExist: false,
  });

  console.log(
    `Copied iPhone dataset ${manifest.version ?? "unknown"} to ${destinationRoot}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
```

## B.2 Read-only checksum and structure validation

```js
// scripts/validate-datasets.mjs
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";

const root = path.resolve("data/iphone");

function safePath(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe dataset path: ${relativePath}`);
  }

  return absolutePath;
}

async function parseJson(relativePath) {
  const raw = await readFile(safePath(relativePath), "utf8");

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function sha256(relativePath) {
  const buffer = await readFile(safePath(relativePath));
  return createHash("sha256").update(buffer).digest("hex");
}

async function validateChecksums() {
  const checksumFile = await readFile(safePath("checksums.sha256"), "utf8");
  const lines = checksumFile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/i);

    if (!match) {
      throw new Error(`Invalid checksum line: ${line}`);
    }

    const expected = match[1].toLowerCase();
    const relativePath = match[2].replace(/^\.\//, "");
    const actual = await sha256(relativePath);

    if (actual !== expected) {
      throw new Error(`Checksum mismatch: ${relativePath}`);
    }
  }
}

function assertUnique(items, selector, label) {
  const seen = new Set();

  for (const item of items) {
    const value = selector(item);

    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`);
    }

    seen.add(value);
  }
}

async function main() {
  await access(safePath("manifest.json"));
  const manifest = await parseJson("manifest.json");

  if (!manifest.version) {
    throw new Error("Dataset manifest version is missing.");
  }

  if (manifest.validationStatus !== "PASS") {
    throw new Error(
      `Dataset manifest validation status is ${manifest.validationStatus ?? "missing"}.`,
    );
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("Dataset manifest file list is missing.");
  }

  for (const relativePath of manifest.files) {
    await access(safePath(relativePath));

    if (relativePath.endsWith(".json")) {
      await parseJson(relativePath);
    }
  }

  const validationReport = await parseJson("validation/validation-report.json");

  if (validationReport.status !== "PASS") {
    throw new Error(
      `Dataset validation report status is ${validationReport.status ?? "missing"}.`,
    );
  }

  const [
    devicesFile,
    finishesFile,
    variantsFile,
    capabilitiesFile,
    categoriesFile,
    answersFile,
    rulesFile,
    navigationFile,
    followUpsFile,
    sourcesFile,
  ] = await Promise.all([
    parseJson("devices/device-catalog.json"),
    parseJson("finishes/finish-catalog.json"),
    parseJson("variants/regional-variants.json"),
    parseJson("capabilities/model-capabilities.json"),
    parseJson("inspections/categories.json"),
    parseJson("inspections/answer-options.json"),
    parseJson("inspections/rules.json"),
    parseJson("navigation/settings-paths.json"),
    parseJson("inspections/follow-up-rules.json"),
    parseJson("sources/sources.json"),
  ]);

  const devices = devicesFile.devices ?? [];
  const finishes = finishesFile.finishes ?? [];
  const variants = variantsFile.variants ?? [];
  const modelCapabilities = capabilitiesFile.models ?? [];
  const categories = categoriesFile.categories ?? [];
  const answerSets = answersFile.answerSets ?? [];
  const rules = rulesFile.rules ?? [];
  const navigationPaths = navigationFile.paths ?? [];
  const followUps = followUpsFile.followUps ?? [];
  const sources = sourcesFile.sources ?? [];

  assertUnique(devices, (item) => item.id, "device ID");
  assertUnique(finishes, (item) => item.id, "finish ID");
  assertUnique(variants, (item) => item.id, "variant ID");
  assertUnique(variants, (item) => item.aNumber, "A-number");
  assertUnique(categories, (item) => item.id, "category ID");
  assertUnique(answerSets, (item) => item.id, "answer-set ID");
  assertUnique(rules, (item) => item.id, "rule ID");
  assertUnique(navigationPaths, (item) => item.id, "navigation ID");
  assertUnique(sources, (item) => item.id, "source ID");

  const deviceIds = new Set(devices.map((item) => item.id));
  const finishIds = new Set(finishes.map((item) => item.id));
  const categoryIds = new Set(categories.map((item) => item.id));
  const answerSetIds = new Set(answerSets.map((item) => item.id));
  const ruleIds = new Set(rules.map((item) => item.id));
  const navigationIds = new Set(navigationPaths.map((item) => item.id));
  const sourceIds = new Set(sources.map((item) => item.id));

  for (const device of devices) {
    for (const finishId of device.finishIds ?? []) {
      if (!finishIds.has(finishId)) {
        throw new Error(`${device.id} references missing finish ${finishId}.`);
      }
    }
  }

  for (const variant of variants) {
    if (!deviceIds.has(variant.deviceId)) {
      throw new Error(
        `${variant.id} references missing device ${variant.deviceId}.`,
      );
    }

    if (!/^A\d{4}$/.test(variant.aNumber)) {
      throw new Error(`${variant.id} has invalid A-number ${variant.aNumber}.`);
    }
  }

  for (const entry of modelCapabilities) {
    if (!deviceIds.has(entry.deviceId)) {
      throw new Error(
        `Capability record references missing device ${entry.deviceId}.`,
      );
    }
  }

  for (const rule of rules) {
    if (!categoryIds.has(rule.categoryId)) {
      throw new Error(
        `${rule.id} references missing category ${rule.categoryId}.`,
      );
    }

    if (!answerSetIds.has(rule.answerSetId)) {
      throw new Error(
        `${rule.id} references missing answer set ${rule.answerSetId}.`,
      );
    }

    if (rule.navigationId && !navigationIds.has(rule.navigationId)) {
      throw new Error(
        `${rule.id} references missing navigation path ${rule.navigationId}.`,
      );
    }

    for (const sourceId of rule.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`${rule.id} references missing source ${sourceId}.`);
      }
    }
  }

  for (const followUp of followUps) {
    for (const ruleId of followUp.addRuleIds ?? []) {
      if (!ruleIds.has(ruleId)) {
        throw new Error(
          `${followUp.id} references missing follow-up rule ${ruleId}.`,
        );
      }
    }
  }

  await validateChecksums();

  console.log(`Dataset ${manifest.version} passed validation.`);
  console.log(JSON.stringify(manifest.counts ?? {}, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
```

The existing dataset's own schemas and validation report remain authoritative. This project validator is an additional deployment guard, not a replacement.

---

# Appendix C — Runtime reference contracts

## C.1 Central JSON repository

```js
// src/data/repository.js
import { DATA_ROOT } from "./paths.js";

const cache = new Map();

async function loadJson(relativePath) {
  const url = `${DATA_ROOT}${relativePath}`;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const pending = fetch(url, {
    cache: "force-cache",
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(
        `Unable to load ${relativePath} (${response.status} ${response.statusText})`,
      );
    }

    return response.json();
  });

  cache.set(url, pending);

  try {
    return await pending;
  } catch (error) {
    cache.delete(url);
    throw error;
  }
}

export const loadManifest = () => loadJson("manifest.json");

export async function loadModelBrowserData() {
  const [manifest, index, catalog, finishes, sources] = await Promise.all([
    loadJson("manifest.json"),
    loadJson("devices/device-index.json"),
    loadJson("devices/device-catalog.json"),
    loadJson("finishes/finish-catalog.json"),
    loadJson("sources/sources.json"),
  ]);

  return {
    manifest,
    deviceIndex: index.devices,
    devices: catalog.devices,
    finishes: finishes.finishes,
    sources: sources.sources,
  };
}

export async function loadIdentificationData() {
  const [devices, finishes, variants, capabilities, releases, compatibility] =
    await Promise.all([
      loadJson("devices/device-catalog.json"),
      loadJson("finishes/finish-catalog.json"),
      loadJson("variants/regional-variants.json"),
      loadJson("capabilities/model-capabilities.json"),
      loadJson("ios/releases.json"),
      loadJson("ios/model-compatibility.json"),
    ]);

  return {
    devices: devices.devices,
    finishes: finishes.finishes,
    variants: variants.variants,
    modelCapabilities: capabilities.models,
    releases,
    compatibility,
  };
}

export async function loadInspectionData() {
  const [
    manifest,
    devices,
    variants,
    capabilities,
    categories,
    answers,
    rules,
    followUps,
    navigation,
    partsHistory,
    diagnostics,
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    reportLanguage,
    disclaimers,
    sources,
  ] = await Promise.all([
    loadJson("manifest.json"),
    loadJson("devices/device-catalog.json"),
    loadJson("variants/regional-variants.json"),
    loadJson("capabilities/model-capabilities.json"),
    loadJson("inspections/categories.json"),
    loadJson("inspections/answer-options.json"),
    loadJson("inspections/rules.json"),
    loadJson("inspections/follow-up-rules.json"),
    loadJson("navigation/settings-paths.json"),
    loadJson("inspections/parts-service-history.json"),
    loadJson("inspections/browser-diagnostics.json"),
    loadJson("policy/scoring-policy.json"),
    loadJson("policy/risk-policy.json"),
    loadJson("policy/coverage-confidence-policy.json"),
    loadJson("policy/report-language.json"),
    loadJson("legal/disclaimers.json"),
    loadJson("sources/sources.json"),
  ]);

  return {
    manifest,
    devices: devices.devices,
    variants: variants.variants,
    modelCapabilities: capabilities.models,
    categories: categories.categories,
    answerSets: answers.answerSets,
    statuses: answers.statuses,
    rules: rules.rules,
    followUps: followUps.followUps,
    settingsPaths: navigation.paths,
    partsHistory,
    diagnostics: diagnostics.diagnostics,
    diagnosticRuntimePolicy: diagnostics.runtimePolicy,
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    reportLanguage,
    disclaimers,
    sources: sources.sources,
  };
}
```

## C.2 iOS version comparison

```js
// src/utils/version.js
export function parseVersion(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);

  if (!match) return null;

  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);

  if (!a || !b) return null;

  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }

  return 0;
}
```

## C.3 Rule-specific answer interpretation

```js
// src/engines/answerInterpreter.js
export function interpretAnswer(rule, answerOptionId) {
  const policy = rule.answerInterpretation;

  if (!policy || policy.mode === "observation_only") {
    return {
      outcome: "OBSERVATION",
      positive: false,
      adverse: false,
      unresolved: false,
    };
  }

  if (policy.adverseOptionIds?.includes(answerOptionId)) {
    return {
      outcome: "ADVERSE",
      positive: false,
      adverse: true,
      unresolved: false,
    };
  }

  if (policy.positiveOptionIds?.includes(answerOptionId)) {
    return {
      outcome: "POSITIVE",
      positive: true,
      adverse: false,
      unresolved: false,
    };
  }

  if (policy.unknownOptionIds?.includes(answerOptionId)) {
    return {
      outcome: "UNKNOWN",
      positive: false,
      adverse: false,
      unresolved: true,
    };
  }

  return {
    outcome: "UNCLASSIFIED",
    positive: false,
    adverse: false,
    unresolved: true,
  };
}
```

## C.4 Numeric scoring gate

```js
// src/engines/scoringGate.js
export function isNumericScoringAvailable(scoringPolicy) {
  if (scoringPolicy?.requiresCalibration !== false) return false;

  const weights = Object.values(scoringPolicy.categoryWeights ?? {});

  if (weights.length === 0 || !weights.every(Number.isFinite)) {
    return false;
  }

  const total = weights.reduce((sum, value) => sum + value, 0);
  return Math.abs(total - 1) < 0.000001;
}
```

## C.5 Official stop-condition evaluator

```js
// src/engines/riskEngine.js
export function evaluateOfficialStopConditions(riskPolicy, answers) {
  return (riskPolicy.officialStopConditions ?? [])
    .filter((condition) => {
      const answer = answers[condition.ruleId];
      return condition.triggerAnswerOptionIds.includes(answer?.optionId);
    })
    .map((condition) => ({
      ruleId: condition.ruleId,
      level: condition.level,
      message: condition.message,
      sourceIds: condition.sourceIds ?? [],
    }));
}
```

These references must be covered by unit tests and may be refactored only without changing their stated behavior.

---

# Appendix D — Final delivery command

Before presenting the implementation as complete, run:

```bash
npm run validate:data
npm run lint
npm run test
npm run test:e2e
npm run build
npm run preview
```

Then verify manually that:

```text
http://localhost:<preview-port>/data/iphone/manifest.json
```

returns the copied production dataset and that a full inspection can be started, saved, resumed, completed, and reported on a real mobile viewport.
