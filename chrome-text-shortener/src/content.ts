let debounceTimer: number | null = null;

document.addEventListener('selectionchange', () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      try {
        chrome.runtime.sendMessage({ action: 'textSelected', text: selectedText });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, 300); // 300ms delay
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clearSelection") {
    window.getSelection()?.removeAllRanges();
  }
});

console.log('Content script loaded');