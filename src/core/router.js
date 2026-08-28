// Lightweight hash router. Hash routing (section 24) avoids server rewrite
// rules on static hosts such as GitHub Pages.
function compilePattern(pattern) {
  const paramNames = [];
  const regexSource = pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return { regex: new RegExp(`^${regexSource}$`), paramNames };
}

export function createRouter() {
  const routes = [];
  let currentUnmount = null;
  let notFoundHandler = null;

  function register(pattern, handler) {
    routes.push({ pattern, ...compilePattern(pattern), handler });
  }

  function setNotFound(handler) {
    notFoundHandler = handler;
  }

  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [pathPart, queryPart] = raw.split("?");
    const path = pathPart || "/";
    const query = Object.fromEntries(new URLSearchParams(queryPart ?? ""));
    return { path, query };
  }

  async function resolve() {
    const { path, query } = parseHash();

    for (const route of routes) {
      const match = path.match(route.regex);
      if (!match) continue;

      const params = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });

      if (typeof currentUnmount === "function") {
        currentUnmount();
        currentUnmount = null;
      }

      currentUnmount = await route.handler({ params, query, path });
      window.scrollTo(0, 0);
      return;
    }

    if (typeof currentUnmount === "function") {
      currentUnmount();
      currentUnmount = null;
    }

    if (notFoundHandler) {
      currentUnmount = await notFoundHandler({ params: {}, query, path });
    }
    window.scrollTo(0, 0);
  }

  function navigate(path) {
    if (location.hash.replace(/^#/, "") === path) {
      resolve();
    } else {
      location.hash = path;
    }
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  return { register, setNotFound, navigate, start, resolve };
}

export const router = createRouter();
