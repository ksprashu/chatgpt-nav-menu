const statusEl = document.getElementById("status");
const listEl = document.getElementById("prompt-list");

let lastPromptHash = "";

const hashPrompts = (prompts) =>
  prompts.map((prompt) => `${prompt.id}:${prompt.text}`).join("|");

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
};

const requestPrompts = async () => {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    statusEl.textContent = "Open ChatGPT to see prompts.";
    return [];
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "getPrompts",
    });
    return response?.prompts ?? [];
  } catch (error) {
    console.error("Failed to request prompts:", error);
    statusEl.textContent = "Unable to read prompts. Open a ChatGPT tab.";
    return [];
  }
};

const renderPrompts = (prompts) => {
  listEl.innerHTML = "";

  if (!prompts.length) {
    statusEl.textContent = "No prompts found in this conversation yet.";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Ask a question in ChatGPT to populate this list.";
    listEl.appendChild(empty);
    return;
  }

  statusEl.textContent = `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`;

  prompts.forEach((prompt, index) => {
    const item = document.createElement("li");
    item.className = "prompt-item";
    item.tabIndex = 0;
    item.dataset.promptId = prompt.id;

    const indexEl = document.createElement("div");
    indexEl.className = "prompt-item__index";
    indexEl.textContent = `#${index + 1}`;

    const textEl = document.createElement("div");
    textEl.className = "prompt-item__text";
    textEl.textContent = prompt.text;

    item.append(indexEl, textEl);
    item.addEventListener("click", () => jumpToPrompt(prompt.id));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jumpToPrompt(prompt.id);
      }
    });
    listEl.appendChild(item);
  });
};

const handlePromptUpdate = async (prompts) => {
  const currentHash = hashPrompts(prompts);
  if (currentHash !== lastPromptHash) {
    lastPromptHash = currentHash;
    renderPrompts(prompts);
  }
};

const jumpToPrompt = async (promptId) => {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    return;
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: "scrollToPrompt",
    promptId,
  });
};

const refreshPrompts = async () => {
  const prompts = await requestPrompts();
  await handlePromptUpdate(prompts);
};

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "promptsUpdated") {
    return;
  }

  getActiveTab().then((tab) => {
    if (tab?.id && sender.tab?.id === tab.id) {
      handlePromptUpdate(message.prompts ?? []);
    }
  });
});

refreshPrompts();
