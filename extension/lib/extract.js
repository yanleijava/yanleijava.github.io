(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  const DEFAULT_SUMMARY_LIMIT = 12000;
  const MIN_SUMMARY_CHARS = 20;
  const SKIP_TAGS = new Set([
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "canvas",
    "iframe",
    "nav",
    "footer",
    "header",
    "aside",
    "form",
  ]);
  const BLOCK_TAGS = new Set([
    "address",
    "article",
    "blockquote",
    "br",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "p",
    "pre",
    "section",
    "tr",
  ]);

  function normalizeWhitespace(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isSkippedElement(node) {
    const tag = node.tagName ? node.tagName.toLowerCase() : "";
    if (SKIP_TAGS.has(tag)) return true;
    if (typeof node.hasAttribute === "function" && node.hasAttribute("hidden")) return true;
    const role = typeof node.getAttribute === "function" ? node.getAttribute("role") : "";
    if (role === "navigation" || role === "banner" || role === "contentinfo") return true;
    if (typeof node.getAttribute === "function" && node.getAttribute("aria-hidden") === "true") {
      return true;
    }
    return false;
  }

  function collectText(node) {
    if (!node) return "";
    if (node.nodeType === 3) return node.textContent || "";
    if (node.nodeType !== 1) return "";
    if (isSkippedElement(node)) return "";

    const tag = node.tagName.toLowerCase();
    if (tag === "br") return "\n";

    let out = "";
    const children = node.childNodes || [];
    for (let i = 0; i < children.length; i += 1) {
      out += collectText(children[i]);
    }
    if (BLOCK_TAGS.has(tag)) out += "\n";
    return out;
  }

  function truncateText(text, maxChars) {
    const limit =
      Number.isFinite(maxChars) && maxChars > 0 ? Math.floor(maxChars) : DEFAULT_SUMMARY_LIMIT;
    const input = String(text || "");
    if (input.length <= limit) return { text: input, truncated: false };
    return { text: input.slice(0, limit), truncated: true };
  }

  function candidateElements(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") return [];
    return Array.from(doc.querySelectorAll("article, main, [role='main']"));
  }

  function extractFromDocument(doc) {
    const title = doc && doc.title ? String(doc.title).trim() : "";
    if (!doc || !doc.body) return { title, text: "" };

    let best = "";
    const candidates = candidateElements(doc);
    for (let i = 0; i < candidates.length; i += 1) {
      const text = normalizeWhitespace(collectText(candidates[i]));
      if (text.length > best.length) best = text;
    }

    const bodyText = normalizeWhitespace(collectText(doc.body));
    if (best.length < 40 && bodyText.length > best.length) best = bodyText;
    return { title, text: best };
  }

  function extractPageForSummary(doc, maxChars) {
    const extracted = extractFromDocument(doc);
    const clipped = truncateText(extracted.text, maxChars || DEFAULT_SUMMARY_LIMIT);
    return {
      title: extracted.title,
      text: clipped.text,
      truncated: clipped.truncated,
      enough: clipped.text.trim().length >= MIN_SUMMARY_CHARS,
    };
  }

  BT.DEFAULT_SUMMARY_LIMIT = DEFAULT_SUMMARY_LIMIT;
  BT.MIN_SUMMARY_CHARS = MIN_SUMMARY_CHARS;
  BT.normalizeWhitespace = normalizeWhitespace;
  BT.collectText = collectText;
  BT.truncateText = truncateText;
  BT.extractFromDocument = extractFromDocument;
  BT.extractPageForSummary = extractPageForSummary;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
