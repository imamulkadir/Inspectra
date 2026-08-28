export const ROUTES = Object.freeze({
  home: "/",
  explore: "/explore",
  model: (id) => `/models/${id}`,
  identify: "/identify",
  disclaimer: "/disclaimer",
  inspectionNew: "/inspection/new",
  inspection: (id) => `/inspection/${id}`,
  inspectionReset: (id) => `/inspection/${id}/reset`,
  diagnostic: (id, diagnosticId) => `/inspection/${id}/diagnostic/${diagnosticId}`,
  report: (id) => `/report/${id}`,
  saved: "/saved",
  privacy: "/privacy",
  terms: "/terms",
});

// Each entry is [pattern, dynamic page-module loader, exported mount fn name].
// Pages are code-split so the initial bundle stays light (section 29).
export const ROUTE_TABLE = [
  ["/", () => import("../pages/homePage.js")],
  ["/explore", () => import("../pages/explorePage.js")],
  ["/models/:modelId", () => import("../pages/modelPage.js")],
  ["/identify", () => import("../pages/identifyPage.js")],
  ["/disclaimer", () => import("../pages/disclaimerPage.js")],
  ["/inspection/new", () => import("../pages/inspectionSetupPage.js")],
  ["/inspection/:id/reset", () => import("../pages/resetVerificationPage.js")],
  ["/inspection/:id/diagnostic/:diagnosticId", () => import("../pages/diagnosticPage.js")],
  ["/inspection/:id", () => import("../pages/inspectionPage.js")],
  ["/report/:id", () => import("../pages/reportPage.js")],
  ["/saved", () => import("../pages/savedInspectionsPage.js")],
  ["/privacy", () => import("../pages/privacyPage.js")],
  ["/terms", () => import("../pages/termsPage.js")],
];
