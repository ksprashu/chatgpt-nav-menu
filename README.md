# ChatGPT Prompt Navigator

A Chrome extension that provides a sidebar list of your prompts in a ChatGPT conversation so you can jump back to any point in the thread.

## Features
- Lists every prompt you sent in the current ChatGPT conversation.
- Click a prompt to scroll directly to that point in the chat.
- Highlights the selected prompt for quick visual context.

## Install (developer mode)
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder (`chatgpt-nav-menu`).
4. Open a ChatGPT conversation and click the side panel icon in Chrome.

## How it works
- The content script reads all messages authored by you (`data-message-author-role="user"`).
- The side panel polls for the latest prompt list and renders it as a clickable timeline.

## Notes
- Works on `https://chat.openai.com/*` and `https://chatgpt.com/*`.
- If the ChatGPT DOM changes, selectors may need to be updated in `content.js`.
