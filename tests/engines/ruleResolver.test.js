import { describe, it, expect } from "vitest";
import { resolveRuleApplicability, buildRuleQueue } from "../../src/engines/ruleResolver.js";
import { buildInspectionContext } from "../../src/engines/contextResolver.js";
import { parseVersion } from "../../src/utils/version.js";
import { RULE_APPLICABILITY } from "../../src/core/constants.js";
import { ruleIncludedInProfile, INSPECTION_PROFILES } from "../../src/config/inspectionProfiles.js";
import { devices, capabilitiesByDeviceIdFixture, rules, categoryById } from "../fixtures/sampleDataset.js";

const proDevice = devices.find((d) => d.id === "iphone-17-pro");
const seDevice = devices.find((d) => d.id === "iphone-se-2");

function contextFor(device) {
  return buildInspectionContext({
    device,
    variant: null,
    iosVersionInput: "18.0",
    iosParsed: parseVersion("18.0"),
    capabilitiesRecord: capabilitiesByDeviceIdFixture[device.id],
  });
}

describe("resolveRuleApplicability", () => {
  it("is APPLICABLE when required capability is present", () => {
    const rule = rules.find((r) => r.id === "identity.face-id-setup");
    const result = resolveRuleApplicability(rule, contextFor(proDevice));
    expect(result.status).toBe(RULE_APPLICABILITY.APPLICABLE);
  });

  it("is NOT_APPLICABLE when required capability is false, never silently skipped without a reason", () => {
    const rule = rules.find((r) => r.id === "identity.face-id-setup");
    const result = resolveRuleApplicability(rule, contextFor(seDevice));
    expect(result.status).toBe(RULE_APPLICABILITY.NOT_APPLICABLE);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is DEFERRED, not NOT_APPLICABLE, when required context is missing", () => {
    const rule = rules.find((r) => r.id === "identity.face-id-setup");
    const context = buildInspectionContext({ device: proDevice, capabilitiesRecord: null });
    const result = resolveRuleApplicability(rule, context);
    expect(result.status).toBe(RULE_APPLICABILITY.DEFERRED);
  });

  it("respects iosMin as NOT_APPLICABLE when the entered version is lower", () => {
    const rule = rules.find((r) => r.id === "biometrics.face-id-unlock");
    const context = buildInspectionContext({ device: proDevice, iosParsed: parseVersion("15.0"), capabilitiesRecord: capabilitiesByDeviceIdFixture[proDevice.id] });
    const result = resolveRuleApplicability(rule, context);
    expect(result.status).toBe(RULE_APPLICABILITY.NOT_APPLICABLE);
  });

  it("does not mutate the original rule object", () => {
    const rule = rules.find((r) => r.id === "identity.face-id-setup");
    const snapshot = JSON.stringify(rule);
    resolveRuleApplicability(rule, contextFor(proDevice));
    expect(JSON.stringify(rule)).toBe(snapshot);
  });
});

describe("buildRuleQueue", () => {
  it("orders by category order then priority rank then dataset order", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(proDevice),
      profileId: "deep",
      categoryById,
    });

    const criticalIndex = orderedRuleIds.indexOf("identity.face-id-setup");
    const lowIndex = orderedRuleIds.indexOf("identity.low-priority-note");
    expect(criticalIndex).toBeGreaterThanOrEqual(0);
    expect(lowIndex).toBeGreaterThan(criticalIndex);
  });

  it("filters out rules outside the selected profile", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(proDevice),
      profileId: "quick",
      categoryById,
    });
    expect(orderedRuleIds).not.toContain("identity.low-priority-note");
  });

  it("standard excludes a critical rule not on its curated allowlist (physical condition)", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(proDevice),
      profileId: "standard",
      categoryById,
    });
    // Confirms Standard is narrower than "every critical rule regardless of
    // category" — physical_condition (cosmetic, not functional) stays Deep-only.
    expect(orderedRuleIds).not.toContain("physical.chassis-deformation");
  });

  it("standard is a curated allowlist — membership ignores priority and category entirely", () => {
    // Standard no longer filters by priority/category (see
    // inspectionProfiles.js); explicitRuleIds alone decides membership, so a
    // listed id is included even at a priority/category Standard would
    // otherwise never touch, and an unlisted id is excluded even at
    // "critical" priority in a category Standard used to cover.
    const onAllowlist = INSPECTION_PROFILES.standard.explicitRuleIds[0];
    expect(ruleIncludedInProfile({ id: onAllowlist, categoryId: "physical_condition", priority: "low" }, "standard")).toBe(true);
    expect(ruleIncludedInProfile({ id: "not-on-the-allowlist", categoryId: "ownership_security", priority: "critical" }, "standard")).toBe(false);
  });

  it("deep includes rules from every category regardless of the standard/quick curation", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(proDevice),
      profileId: "deep",
      categoryById,
    });
    expect(orderedRuleIds).toContain("physical.chassis-deformation");
    expect(orderedRuleIds).toContain("identity.face-id-setup");
  });

  it("includes an out-of-profile rule when explicitly added via extraRuleIds (follow-up)", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(proDevice),
      profileId: "quick",
      categoryById,
      extraRuleIds: new Set(["identity.low-priority-note"]),
    });
    expect(orderedRuleIds).toContain("identity.low-priority-note");
  });

  it("never coerces NOT_APPLICABLE rules for the wrong device into the queue", () => {
    const { orderedRuleIds } = buildRuleQueue({
      rules,
      context: contextFor(seDevice),
      profileId: "deep",
      categoryById,
    });
    expect(orderedRuleIds).not.toContain("identity.face-id-setup");
    expect(orderedRuleIds).toContain("identity.touch-id-setup");
  });
});
