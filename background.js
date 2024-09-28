// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  // Set initial window ID to null in local storage
  chrome.storage.local.set({ windowId: null }, () => {
    console.log("Initialized extension with no selected window.");
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    const { tabId, windowId, username } = message;

    // Focus the specified window
    chrome.windows.update(windowId, { focused: true }, () => {
      // Activate the specified tab
      chrome.tabs.update(tabId, { active: true }, () => {
        // Capture the visible tab content as a PNG image
        chrome.tabs.captureVisibleTab(
          windowId,
          { format: "png" },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }

            // Send the captured screenshot to the API for analysis
            sendScreenshotToAPI(dataUrl, username, sendResponse);
          }
        );
      });
    });

    // Keep the message channel open for asynchronous response
    return true;
  }
});

// Function to send the screenshot to the API for analysis
function sendScreenshotToAPI(imageData, username, sendResponse) {
  const imageMediaType = "image/png";

  // Remove the data URL prefix from the base64 image data
  const base64Data = imageData.replace(/^data:image\/(png|jpg);base64,/, "");

  // Retrieve the API key from local storage
  chrome.storage.local.get("CLAUDE_API_KEY", (result) => {
    const apiKey = result.CLAUDE_API_KEY;
    if (!apiKey) {
      sendResponse({ error: "API key not found. Please save your API key." });
      return;
    }

    // Send a POST request to the Claude API
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
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
                text: `You are a professional poker coach. Your player (${username}) has sent you this situation for review. Analyze the image of the game shown, assessing both the strength of the player's hand and the potential threats on the board. In your analysis, carefully weigh the balance between maximizing value from weaker hands and minimizing risk from stronger hands or draws. Consider opponent tendencies, betting patterns, and possible hand ranges. Make sure your final recommendation accounts for both the current board and potential future action. Keep your response concise and to the point. End your response with 'FINAL RECOMMENDATION: FOLD/RAISE/etc.'`,
              },
            ],
          },
        ],
      }),
    })
      .then((response) => response.text())
      .then((text) => {
        try {
          // Parse the API response
          const data = JSON.parse(text);
          const content = data.content[0].text;
          sendResponse({ apiResponse: content });
        } catch (error) {
          console.error("Failed to parse JSON:", text);
          sendResponse({ error: `Failed to parse JSON: ${error.message}` });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ error: `Error: ${error.message}` });
      });
  });
}

// Open the extension popup when the browser action icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("window.html"),
    type: "popup",
    width: 400,
    height: 600,
  });
});
