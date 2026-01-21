const configurePanelBehavior = async () => {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }

  try {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  } catch (error) {
    console.warn("Unable to set side panel behavior", error);
  }
};

const openSidePanel = async (tab) => {
  if (!tab?.id || !chrome.sidePanel?.open) {
    return;
  }

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.warn("Unable to open side panel", error);
  }
};

chrome.runtime.onInstalled.addListener(() => {
  configurePanelBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  configurePanelBehavior();
});

chrome.action.onClicked.addListener((tab) => {
  openSidePanel(tab);
});
