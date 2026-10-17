(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  function isStatusPage(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
      const allowed =
        host === "x.com" ||
        host === "twitter.com" ||
        host === "mobile.x.com" ||
        host === "mobile.twitter.com";
      if (!allowed) return false;
      return /\/status\/\d+(?:\/|$)/.test(parsed.pathname);
    } catch (error) {
      return false;
    }
  }

  function classifyTabUrl(url) {
    if (!url || url === "about:blank") return "empty";
    const lower = String(url).toLowerCase();
    if (
      lower.startsWith("about:") ||
      lower.startsWith("chrome:") ||
      lower.startsWith("chrome-extension:") ||
      lower.startsWith("edge:") ||
      lower.startsWith("brave:") ||
      lower.startsWith("devtools:") ||
      lower.startsWith("view-source:") ||
      lower.startsWith("moz-extension:") ||
      lower.startsWith("chrome-error:")
    ) {
      return "unreadable";
    }
    if (!/^https?:\/\//i.test(url)) return "unreadable";
    return "ok";
  }

  BT.isStatusPage = isStatusPage;
  BT.classifyTabUrl = classifyTabUrl;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
