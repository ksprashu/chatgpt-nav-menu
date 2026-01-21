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
    // When openPanelOnActionClick is true, chrome.action.onClicked fires if the side panel is already open.
    // In this case, calling sidePanel.open() throws an error, which we can safely ignore.
    if (String(error).includes("The side panel is already open")) {
      return;
    }
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
