chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'textSelected') {
      chrome.storage.local.set({ selectedText: message.text }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving selected text:', chrome.runtime.lastError);
        }
      });
    }
});

console.log('Background script loaded');