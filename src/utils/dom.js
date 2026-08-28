// Minimal, dependency-free DOM builder. Never uses innerHTML with dynamic
// content — user notes, dataset strings, and observations are always placed
// via textContent or explicit DOM creation.
const BOOLEAN_ATTRS = new Set(["disabled", "checked", "selected", "required", "readonly"]);

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  applyProps(node, props);
  appendChildren(node, children);
  return node;
}

function applyProps(node, props) {
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;

    if (key === "class" || key === "className") {
      node.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(node.style, value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.assign(node.dataset, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (BOOLEAN_ATTRS.has(key)) {
      if (value) node.setAttribute(key, "");
    } else if (key === "text") {
      node.textContent = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }
}

function appendChildren(node, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) {
      appendChildren(node, child);
    } else if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String(child)));
    }
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";

// SVG elements need document.createElementNS — document.createElement (used
// by el() above) creates them in the wrong namespace and the browser won't
// render them.
export function svgEl(tag, props = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    node.setAttribute(key, String(value));
  }
  appendChildren(node, children);
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function mount(root, node) {
  clear(root);
  root.appendChild(node);
}

export function text(value) {
  return document.createTextNode(String(value ?? ""));
}
