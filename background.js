chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ windowId: null }, () => {
    console.log("Initialized extension with no selected window.");
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    const { tabId, windowId, username } = message;

    chrome.windows.update(windowId, { focused: true }, () => {
      chrome.tabs.update(tabId, { active: true }, () => {
        chrome.tabs.captureVisibleTab(
          windowId,
          { format: "png" },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }

            sendScreenshotToAPI(dataUrl, username, sendResponse);
          }
        );
      });
    });

    // Return true to indicate asynchronous response
    return true;
  }
});

// Send the screenshot to the API
function sendScreenshotToAPI(imageData, username, sendResponse) {
  const imageMediaType = "image/png"; // Adjust if your image type is different

  // Strip the data URL prefix
  const base64Data = imageData.replace(/^data:image\/(png|jpg);base64,/, "");

  chrome.storage.local.get("CLAUDE_API_KEY", (result) => {
    const apiKey = result.CLAUDE_API_KEY;
    if (!apiKey) {
      sendResponse({ error: "API key not found. Please save your API key." });
      return;
    }

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
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
                text: `You are a professional poker coach. Your player (${username}) has sent you this situation for your review. Analyze the image of the game shown, and recommend the next move. End your response with 'FINAL RECOMMENDATION: FOLD/RAISE/etc'`,
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
          sendResponse({ apiResponse: content });
        } catch (error) {
          console.error("Failed to parse JSON:", text); // Log the response text
          sendResponse({ error: `Failed to parse JSON: ${error.message}` });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ error: `Error: ${error.message}` });
      });
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
