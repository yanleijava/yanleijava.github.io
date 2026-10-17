(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  const LANGUAGE_NAMES = {
    zh: "中文",
    en: "English",
    ja: "日本語",
    ko: "한국어",
    ru: "русский",
    ar: "العربية",
  };

  function detectPrimaryLanguage(text) {
    const input = String(text || "").replace(/\s+/g, " ").trim();
    if (!input) return "unknown";

    const han = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const kana = (input.match(/[\u3040-\u30ff]/g) || []).length;
    const hangul = (input.match(/[\uac00-\ud7af]/g) || []).length;
    const enWords = (input.match(/[A-Za-z]+/g) || []).length;
    const ruWords = (input.match(/[\u0400-\u04ff]+/g) || []).length;
    const arWords = (input.match(/[\u0600-\u06ff]+/g) || []).length;

    if (kana >= 2) return "ja";

    const scores = [
      ["zh", han],
      ["ko", hangul],
      ["en", enWords],
      ["ru", ruWords],
      ["ar", arWords],
    ].filter(([, score]) => score > 0);

    if (scores.length === 0) return "unknown";
    scores.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (scores.length > 1 && scores[0][1] === scores[1][1]) return "unknown";
    return scores[0][0];
  }

function resolveLanguage(text, fallback) {
  const detected = detectPrimaryLanguage(text);
  if (detected === "unknown") return fallback;
  return detected;
}

function languageForReply(text) {
  return resolveLanguage(text, "en");
}

function languageForSummary(text) {
  return resolveLanguage(text, "zh");
}

  function languageName(code) {
    return LANGUAGE_NAMES[code] || LANGUAGE_NAMES.en;
  }

BT.detectPrimaryLanguage = detectPrimaryLanguage;
BT.resolveLanguage = resolveLanguage;
BT.languageForReply = languageForReply;
BT.languageForSummary = languageForSummary;
BT.languageName = languageName;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
