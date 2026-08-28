import { describe, it, expect } from "vitest";
import { resolveNavigationRoute } from "../../src/engines/navigationResolver.js";
import { parseVersion } from "../../src/utils/version.js";

const devices = [
  { id: "iphone-15", family: "iPhone 15", introducedYear: 2023 },
  { id: "iphone-13", family: "iPhone 13", introducedYear: 2021 },
];

const navigationById = new Map([
  [
    "battery.health",
    {
      id: "battery.health",
      concept: "Battery health",
      routes: [
        {
          iosMin: "17.4",
          iosMax: null,
          deviceRequirement: { introducedFamilyAtLeast: "iPhone 15" },
          steps: ["Settings", "Battery", "Battery Health"],
        },
        {
          iosMin: null,
          iosMax: null,
          deviceRequirement: { deviceFamilies: ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14"] },
          steps: ["Settings", "Battery", "Battery Health & Charging"],
        },
      ],
      fallback: "Open Settings > Battery.",
    },
  ],
]);

describe("resolveNavigationRoute", () => {
  it("picks the newer route for a newer-family device on a supporting iOS version", () => {
    const { route } = resolveNavigationRoute("battery.health", {
      navigationById,
      device: devices[0],
      iosParsed: parseVersion("17.5"),
      devices,
    });
    expect(route.steps).toContain("Battery Health");
  });

  it("picks the older route for an older-family device", () => {
    const { route } = resolveNavigationRoute("battery.health", {
      navigationById,
      device: devices[1],
      iosParsed: parseVersion("17.5"),
      devices,
    });
    expect(route.steps).toContain("Battery Health & Charging");
  });

  it("returns route:null when no configured route matches, not a device failure", () => {
    const { route } = resolveNavigationRoute("battery.health", {
      navigationById,
      device: devices[0],
      iosParsed: parseVersion("10.0"),
      devices,
    });
    expect(route).toBeNull();
  });

  it("returns entry:null for an unknown navigation id", () => {
    const { entry } = resolveNavigationRoute("does.not.exist", { navigationById, device: devices[0], iosParsed: parseVersion("17.5"), devices });
    expect(entry).toBeNull();
  });
});
