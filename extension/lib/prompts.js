(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  function countHashtags(text) {
    return (String(text || "").match(/#[\p{L}\p{N}_]+/gu) || []).length;
  }

  function buildReplyMessages(input) {
    const postText = String((input && input.postText) || "").trim();
    const author = String((input && input.author) || "").trim();
    const language = (input && input.language) || "en";
    const name = BT.languageName(language);
    const hashtagRule =
      countHashtags(postText) >= 3
        ? "原帖使用了很多话题标签，回复里可以保留少量相关标签。"
        : "不要添加话题标签。";

    const system = [
      "你正在替用户起草一条发在 X（Twitter）上的回复。",
      "只输出回复正文，不要加引号、标题、编号或解释。",
      "这是一条回复，不是摘要，不要复述帖子内容。",
      "语气自然、简短，像真人会发出去的话，不要广告腔，不要堆表情。",
      hashtagRule,
      "必须使用" + name + "撰写回复。",
      "长度控制在 200 个字符以内。",
    ].join("");

    const userParts = [];
    if (author) userParts.push("作者：" + author);
    userParts.push("帖子正文：", postText);

    return [
      { role: "system", content: system },
      { role: "user", content: userParts.join("\n") },
    ];
  }

  function buildSummaryMessages(input) {
    const pageText = String((input && input.pageText) || "").trim();
    const title = String((input && input.title) || "").trim();
    const language = (input && input.language) || "zh";
    const truncated = Boolean(input && input.truncated);
    const name = BT.languageName(language);

    const system = [
      "你是网页阅读助手。",
      "请给出简洁总结，使用 3 到 7 条要点，不要改写或粘贴全文。",
      "不要编造页面里没有的信息。",
      "必须使用" + name + "输出。",
      truncated ? "提供的正文是截断后的节选，只根据节选总结。" : "",
    ]
      .filter(Boolean)
      .join("");

    const userParts = [];
    if (title) userParts.push("页面标题：" + title);
    userParts.push("页面正文：", pageText);

    return [
      { role: "system", content: system },
      { role: "user", content: userParts.join("\n") },
    ];
  }

  BT.countHashtags = countHashtags;
  BT.buildReplyMessages = buildReplyMessages;
  BT.buildSummaryMessages = buildSummaryMessages;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
