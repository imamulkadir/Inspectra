# Used iPhone Inspection & Analysis Dataset v1.0.0

Verified: 2026-08-27

This is a dataset-only package for a mobile-first used-iPhone specification, guided-inspection, anomaly, risk, coverage, confidence, and report system. It contains no website UI and no automated IMEI blacklist lookup.

## Scope

- 28 iPhone models from the iPhone 12 generation through iPhone 17e, including iPhone SE (2nd and 3rd generation), iPhone 16e, and iPhone Air.
- Official model identity, storage, finish names, dimensions, weight, normalized inspection-relevant display/chip/camera/battery/controls/connector/charging/water-resistance fields.
- Apple A-number regional market groups and physical SIM-tray expectation.
- Capability flags, current verified iOS compatibility, settings navigation, guided inspection rules, conditional follow-ups, browser diagnostics, and policy structures.
- Source URLs and verification dates for official claims.

## No-guessing policy

- Unknown or unverified values are null, omitted, or explicitly marked unavailable.
- Shared A-number market groups are not mislabeled as one country.
- Finish swatch colors are null; no CSS color is presented as Apple’s physical finish.
- Cellular band lists and eSIM details are not inferred from the A-number or SIM tray.
- Historical settings paths are not reconstructed without an official versioned source.
- Scoring weights and thresholds are null until calibrated. Implementations must not produce a numeric score from this draft policy.
- An empty service-program file does not mean no service program applies.

## Directory map

- `sources/` — official Apple provenance
- `devices/` — model catalog and field coverage
- `variants/` — A-number market groups
- `finishes/` — exact Apple finish names
- `capabilities/` — feature definitions and per-model flags
- `ios/` — verified release/compatibility data
- `navigation/` — model/iOS-aware settings routes where officially verified
- `inspections/` — categories, answers, rules, follow-ups, Parts & Service History, browser diagnostics
- `policy/` — uncalibrated score/risk/coverage/confidence/report-language structures
- `legal/` — draft disclaimer content requiring legal review
- `service-programs/` — deliberately unpopulated live-data layer
- `localization/` — verified English tokens only
- `schemas/` — JSON Schema files
- `validation/` — machine validation and intentional-gap report

## Main dataset structure

```directory
iphone-inspector-datasets-v1/
├── manifest.json
├── README.md
├── CHANGELOG.md
├── checksums.sha256
│
├── sources/
│ └── sources.json
│
├── devices/
│ ├── device-catalog.json
│ ├── device-index.json
│ └── specification-field-catalog.json
│
├── variants/
│ └── regional-variants.json
│
├── finishes/
│ └── finish-catalog.json
│
├── capabilities/
│ ├── capability-definitions.json
│ └── model-capabilities.json
│
├── ios/
│ ├── releases.json
│ └── model-compatibility.json
│
├── navigation/
│ └── settings-paths.json
│
├── inspections/
│ ├── categories.json
│ ├── answer-options.json
│ ├── rules.json
│ ├── follow-up-rules.json
│ ├── parts-service-history.json
│ └── browser-diagnostics.json
│
├── policy/
│ ├── scoring-policy.json
│ ├── risk-policy.json
│ ├── coverage-confidence-policy.json
│ └── report-language.json
│
├── legal/
│ └── disclaimers.json
│
├── service-programs/
│ └── service-programs.json
│
├── localization/
│ └── en.json
│
├── schemas/
│ ├── source.schema.json
│ ├── device.schema.json
│ ├── variant.schema.json
│ ├── inspection-rule.schema.json
│ └── settings-path.schema.json
│
└── validation/
├── validation-report.json
└── data-quality.json

```

## Important implementation rule

Official fact, user observation, browser observation, external verification, and analytical inference must remain distinct. A result must never claim absolute authenticity, no repair history, no liquid exposure, future reliability, or a guaranteed purchase decision.

## Validation

Status: PASS

See `validation/validation-report.json` for counts, checks, errors, and warnings.
