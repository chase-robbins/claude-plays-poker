document.addEventListener("DOMContentLoaded", () => {
  const targetTabSelect = document.getElementById("targetTab");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultDiv = document.getElementById("result");

  // Populate the select dropdown with open tabs across all windows
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      const option = document.createElement("option");
      option.value = `${tab.id},${tab.windowId}`;
      option.text = `${tab.title} (Window ${tab.windowId})`;
      targetTabSelect.appendChild(option);
    });
  });

  // Handle the analyze button click
  analyzeBtn.addEventListener("click", () => {
    const [tabId, windowId] = targetTabSelect.value.split(",").map(Number);
    if (isNaN(tabId) || isNaN(windowId)) {
      resultDiv.innerText = "Please select a tab.";
      return;
    }

    resultDiv.innerHTML = '<div class="spinner"></div>Analyzing...';

    // Switch to the tab's window
    chrome.windows.update(windowId, { focused: true }, () => {
      chrome.tabs.update(tabId, { active: true }, () => {
        chrome.tabs.captureVisibleTab(
          windowId,
          { format: "png" },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              resultDiv.innerText = `Error: ${chrome.runtime.lastError.message}`;
              return;
            }

            sendScreenshotToAPI(dataUrl);
          }
        );
      });
    });
  });

  // Send the screenshot to the API
  function sendScreenshotToAPI(imageData) {
    const apiKey = API_KEY;
    const imageMediaType = "image/png"; // Adjust if your image type is different

    // Strip the data URL prefix
    const base64Data = imageData.replace(/^data:image\/(png|jpg);base64,/, "");

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
          resultDiv.innerText = `API Response: ${content}`;
        } catch (error) {
          console.error("Failed to parse JSON:", text); // Log the response text
          resultDiv.innerText = `Error: ${error}`;
        }
      })
      .catch((error) => {
        resultDiv.innerText = `Error: ${error}`;
      });
  }
});
