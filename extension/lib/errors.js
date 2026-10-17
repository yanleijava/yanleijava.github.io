(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  BT.messages = {
    NOT_STATUS:
      "请先打开 X（x.com 或 twitter.com）的单条帖子详情页，地址中需要包含 /status/。",
    NO_COMPOSER: "找不到回复框。请在帖子详情页打开回复输入框后再试。",
    NO_POST_TEXT: "没有读到这条帖子的正文，无法生成回复。",
    NO_CONFIG:
      "尚未配置大模型 API。请打开设置，填写 API Base URL、API Key 和模型名。",
    NO_PERMISSION:
      "浏览器还没有允许扩展访问该 API 地址。请到设置页重新保存，并在提示中授予权限。",
    UNREADABLE_PAGE:
      "当前页面无法读取（浏览器内部页、扩展页或空白页）。请打开一个普通网页后再总结。",
    NO_PAGE_TEXT: "没有从当前页面抽取到足够的正文。",
    INSERT_FAILED: "没能把回复写进输入框。请确认回复框已打开后再试。",
    PAGE_CONNECT_FAILED: "无法连接当前页面。请刷新后再试。",
    API_EMPTY: "API 报错：模型没有返回文本。",
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
