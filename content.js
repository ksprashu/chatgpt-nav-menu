const PROMPT_SELECTOR = '[data-message-author-role="user"]';
const PROMPT_ID_PREFIX = "chatgpt-prompt-";
const SIDEBAR_ID = "chatgpt-prompt-nav-sidebar";

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

const ensureSidebar = () => {
  let sidebar = document.getElementById(SIDEBAR_ID);
  if (sidebar) {
    return sidebar;
  }

  sidebar = document.createElement("aside");
  sidebar.id = SIDEBAR_ID;
  sidebar.setAttribute("aria-hidden", "true");
  sidebar.innerHTML = `
    <header class="prompt-nav__header">
      <div>
        <h2 class="prompt-nav__title">Prompt Navigator</h2>
        <p class="prompt-nav__subtitle">Jump to any of your prompts.</p>
      </div>
      <button class="prompt-nav__close" type="button" aria-label="Close sidebar">×</button>
    </header>
    <div class="prompt-nav__status" id="prompt-nav-status">Loading prompts…</div>
    <ol class="prompt-nav__list" id="prompt-nav-list"></ol>
  `;

  document.body.appendChild(sidebar);

  const closeButton = sidebar.querySelector(".prompt-nav__close");
  closeButton?.addEventListener("click", () => toggleSidebar(false));

  return sidebar;
};

const renderPrompts = (prompts) => {
  const sidebar = ensureSidebar();
  const statusEl = sidebar.querySelector("#prompt-nav-status");
  const listEl = sidebar.querySelector("#prompt-nav-list");

  if (!statusEl || !listEl) {
    return;
  }

  listEl.innerHTML = "";

  if (!prompts.length) {
    statusEl.textContent = "No prompts found in this conversation yet.";
    const empty = document.createElement("div");
    empty.className = "prompt-nav__empty";
    empty.textContent = "Ask a question in ChatGPT to populate this list.";
    listEl.appendChild(empty);
    return;
  }

  statusEl.textContent = `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`;

  prompts.forEach((prompt, index) => {
    const item = document.createElement("li");
    item.className = "prompt-nav__item";
    item.tabIndex = 0;

    const indexEl = document.createElement("div");
    indexEl.className = "prompt-nav__index";
    indexEl.textContent = `#${index + 1}`;

    const textEl = document.createElement("div");
    textEl.className = "prompt-nav__text";
    textEl.textContent = prompt.text;

    item.append(indexEl, textEl);
    item.addEventListener("click", () => scrollToPrompt(prompt.id));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollToPrompt(prompt.id);
      }
    });
    listEl.appendChild(item);
  });
};

let notifyTimeout;
const notifyPromptUpdate = () => {
  if (notifyTimeout) {
    window.clearTimeout(notifyTimeout);
  }

  notifyTimeout = window.setTimeout(() => {
    renderPrompts(collectPrompts());
    notifyTimeout = null;
  }, 150);
};

const toggleSidebar = (forceOpen) => {
  const sidebar = ensureSidebar();
  const isOpen = sidebar.getAttribute("aria-hidden") === "false";
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;

  sidebar.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  sidebar.classList.toggle("prompt-nav--open", shouldOpen);

  if (shouldOpen) {
    notifyPromptUpdate();
  }
};

const scrollToPrompt = (promptId) => {
  const target = document.getElementById(promptId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("chatgpt-prompt-highlight");
    setTimeout(() => target.classList.remove("chatgpt-prompt-highlight"), 1500);
  }
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "toggleSidebar") {
    toggleSidebar();
    return false;
  }

  return false;
});

const highlightStyle = document.createElement("style");
highlightStyle.textContent = `
  #${SIDEBAR_ID} {
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100vh;
    background: #0f1117;
    color: #f7f7f7;
    border-left: 1px solid #1f2430;
    box-shadow: -6px 0 18px rgba(0, 0, 0, 0.35);
    padding: 16px;
    box-sizing: border-box;
    z-index: 9999;
    transform: translateX(100%);
    transition: transform 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  #${SIDEBAR_ID}[aria-hidden="false"] {
    transform: translateX(0);
  }

  #${SIDEBAR_ID} .prompt-nav__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  #${SIDEBAR_ID} .prompt-nav__title {
    margin: 0;
    font-size: 16px;
  }

  #${SIDEBAR_ID} .prompt-nav__subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    color: #b8bbc2;
  }

  #${SIDEBAR_ID} .prompt-nav__close {
    border: none;
    background: transparent;
    color: #f7f7f7;
    font-size: 18px;
    cursor: pointer;
  }

  #${SIDEBAR_ID} .prompt-nav__status {
    font-size: 12px;
    color: #8f93a1;
  }

  #${SIDEBAR_ID} .prompt-nav__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }

  #${SIDEBAR_ID} .prompt-nav__item {
    border-radius: 10px;
    background: #1a1e27;
    padding: 10px 12px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: border 0.2s ease, background 0.2s ease;
  }

  #${SIDEBAR_ID} .prompt-nav__item:hover,
  #${SIDEBAR_ID} .prompt-nav__item:focus-visible {
    border-color: #4a7dff;
    background: #22293a;
  }

  #${SIDEBAR_ID} .prompt-nav__index {
    font-size: 11px;
    color: #9ea3af;
    margin-bottom: 6px;
  }

  #${SIDEBAR_ID} .prompt-nav__text {
    font-size: 13px;
    line-height: 1.35;
    color: #f7f7f7;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  #${SIDEBAR_ID} .prompt-nav__empty {
    font-size: 12px;
    color: #8f93a1;
  }

  @media (prefers-color-scheme: light) {
    #${SIDEBAR_ID} {
      background: #f6f7fb;
      color: #111318;
      border-left-color: #e6e9f2;
    }

    #${SIDEBAR_ID} .prompt-nav__subtitle,
    #${SIDEBAR_ID} .prompt-nav__status,
    #${SIDEBAR_ID} .prompt-nav__index,
    #${SIDEBAR_ID} .prompt-nav__empty {
      color: #606571;
    }

    #${SIDEBAR_ID} .prompt-nav__item {
      background: #ffffff;
      border-color: #e6e9f2;
    }

    #${SIDEBAR_ID} .prompt-nav__item:hover,
    #${SIDEBAR_ID} .prompt-nav__item:focus-visible {
      border-color: #3758f9;
      background: #f4f6ff;
    }

    #${SIDEBAR_ID} .prompt-nav__text {
      color: #111318;
    }
  }

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
