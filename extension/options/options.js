const BT = globalThis.BrowserTools;

const form = document.getElementById("settings-form");
const baseInput = document.getElementById("api-base-url");
const keyInput = document.getElementById("api-key");
const modelInput = document.getElementById("model");
const statusNode = document.getElementById("status");
const saveButton = document.getElementById("save");
const testButton = document.getElementById("test");
const toggleKey = document.getElementById("toggle-key");

function setStatus(text, kind) {
  statusNode.textContent = text || "";
  statusNode.className = "status" + (kind ? " " + kind : "");
}

function formSettings() {
  return BT.readSettings({
    apiBaseUrl: baseInput.value,
    apiKey: keyInput.value,
    model: modelInput.value,
  });
}

function validate(settings) {
  if (!BT.settingsReady(settings)) return BT.messages.NO_CONFIG;
  try {
    BT.apiOriginPattern(settings.apiBaseUrl);
  } catch (error) {
    return error.message;
  }
  return "";
}

async function persist(settings) {
  const pattern = BT.apiOriginPattern(settings.apiBaseUrl);
  const granted = await chrome.permissions.request({ origins: [pattern] });
  await chrome.storage.local.set({ browserToolsSettings: settings });
  return { granted: granted, pattern: pattern };
}

async function load() {
  const data = await chrome.storage.local.get("browserToolsSettings");
  const settings = BT.readSettings(data && data.browserToolsSettings);
  baseInput.value = settings.apiBaseUrl;
  keyInput.value = settings.apiKey;
  modelInput.value = settings.model;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = formSettings();
  const problem = validate(settings);
  if (problem) {
    setStatus(problem, "error");
    return;
  }
  saveButton.disabled = true;
  testButton.disabled = true;
  try {
    const saved = await persist(settings);
    if (!saved.granted) {
      setStatus("设置已保存在本机，但没有授予访问 " + saved.pattern + " 的权限。调用 API 前需要允许。", "error");
      return;
    }
    setStatus("已保存，并允许访问该 API 地址。", "ok");
  } catch (error) {
    setStatus(error.message || "保存失败。", "error");
  } finally {
    saveButton.disabled = false;
    testButton.disabled = false;
  }
});

testButton.addEventListener("click", async () => {
  const settings = formSettings();
  const problem = validate(settings);
  if (problem) {
    setStatus(problem, "error");
    return;
  }

  saveButton.disabled = true;
  testButton.disabled = true;
  setStatus("正在保存并测试连接…", "pending");
  try {
    const saved = await persist(settings);
    if (!saved.granted) {
      setStatus("未授予访问该 API 地址的权限，无法测试连接。", "error");
      return;
    }
    const result = await chrome.runtime.sendMessage({
      type: "llm:chat",
      messages: [{ role: "user", content: "请只回复 OK" }],
    });
    if (!result || !result.ok) {
      const message = (result && result.message) || "API 报错。";
      const hint = message.includes("Failed to fetch") ? " 如果刚刚才授予权限，请再点一次测试连接。" : "";
      setStatus(message + hint, "error");
      return;
    }
    setStatus("连接成功，模型有响应。", "ok");
  } catch (error) {
    setStatus("API 请求失败：" + ((error && error.message) || "未知错误"), "error");
  } finally {
    saveButton.disabled = false;
    testButton.disabled = false;
  }
});

toggleKey.addEventListener("click", () => {
  const hidden = keyInput.type === "password";
  keyInput.type = hidden ? "text" : "password";
  toggleKey.textContent = hidden ? "隐藏" : "显示";
});

load().catch(() => {
  setStatus("读取已保存的设置失败。", "error");
});
