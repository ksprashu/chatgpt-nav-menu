const PROMPT_SELECTOR = '[data-message-author-role="user"]';
const PROMPT_ID_PREFIX = "chatgpt-prompt-";
const HIGHLIGHT_DURATION_MS = 1500;

const extractPromptText = (element) =>
  element.innerText.replace(/\s+/g, " ").trim();

const ensurePromptId = (element, index) => {
  if (!element.id) {
    element.id = `${PROMPT_ID_PREFIX}${index + 1}`;
  }
  return element.id;
};

const collectPrompts = () => {
  const promptElements = Array.from(document.querySelectorAll(PROMPT_SELECTOR));
  return promptElements
    .map((element, index) => ({
      id: ensurePromptId(element, index),
      text: extractPromptText(element) || "(empty prompt)",
    }))
    .filter((prompt) => prompt.text.length > 0);
};

let notifyTimeout;
const canSendRuntimeMessage = () =>
  typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

const sendPromptsUpdated = () => {
  if (!canSendRuntimeMessage()) {
    return;
  }

  try {
    chrome.runtime.sendMessage(
      {
        type: "promptsUpdated",
        prompts: collectPrompts(),
      },
      () => {
        void chrome.runtime.lastError;
      }
    );
  } catch (error) {
    // Ignore errors caused by extension reloads or invalidated contexts.
  }
};

const notifyPromptUpdate = () => {
  if (notifyTimeout) {
    window.clearTimeout(notifyTimeout);
  }

  notifyTimeout = window.setTimeout(() => {
    sendPromptsUpdated();
    notifyTimeout = null;
  }, 150);
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getPrompts") {
    sendResponse({ prompts: collectPrompts() });
    return true;
  }

  if (message.type === "scrollToPrompt") {
    const target = document.getElementById(message.promptId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("chatgpt-prompt-highlight");
      setTimeout(() => target.classList.remove("chatgpt-prompt-highlight"), HIGHLIGHT_DURATION_MS);
    }
  }

  return false;
});

const highlightStyle = document.createElement("style");
highlightStyle.textContent = `
  .chatgpt-prompt-highlight {
    outline: 2px solid #4a7dff;
    border-radius: 12px;
    transition: outline 0.3s ease;
  }
`;

document.head.appendChild(highlightStyle);

const observer = new MutationObserver(() => notifyPromptUpdate());
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

notifyPromptUpdate();
