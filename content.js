const PROMPT_SELECTOR = '[data-message-author-role="user"]';
const PROMPT_ID_PREFIX = "chatgpt-prompt-";

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
const notifyPromptUpdate = () => {
  if (notifyTimeout) {
    window.clearTimeout(notifyTimeout);
  }

  notifyTimeout = window.setTimeout(() => {
    chrome.runtime.sendMessage({
      type: "promptsUpdated",
      prompts: collectPrompts(),
    });
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
      setTimeout(() => target.classList.remove("chatgpt-prompt-highlight"), 1500);
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
