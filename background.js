chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ windowId: null }, () => {
    console.log("Initialized extension with no selected window.");
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];
        chrome.tabs.captureVisibleTab(
          tab.windowId,
          { format: "png" },
          (dataUrl) => {
            sendScreenshotToAPI(dataUrl);
          }
        );
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });

    // Open the results window
    chrome.windows.create({
      url: chrome.runtime.getURL("window.html"),
      type: "popup",
      width: 800,
      height: 600,
    });

    // Return true to indicate asynchronous response
    return true;
  }
});

// Send the screenshot to the API
function sendScreenshotToAPI(imageData) {
  const imageMediaType = "image/png"; // Adjust if your image type is different

  // Strip the data URL prefix
  const base64Data = imageData.replace(/^data:image\/(png|jpg);base64,/, "");

  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true", // Add this header
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageMediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "You are a professional poker coach. Your player has sent you this situation for your review. Analyze the image of the game shown, and recommend the next move. End your response with 'FINAL RECOMMENDATION: FOLD/RAISE/etc'",
            },
          ],
        },
      ],
    }),
  })
    .then((response) => response.text()) // Get the response as text
    .then((text) => {
      try {
        const data = JSON.parse(text); // Try to parse the text as JSON
        const content = data.content[0].text; // Extract the content from the first message
        chrome.storage.local.set({ apiResponse: content }, () => {
          console.log("API Response stored.");
        });
      } catch (error) {
        console.error("Failed to parse JSON:", text); // Log the response text
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("window.html"),
    type: "popup",
    width: 400,
    height: 600,
  });
});
