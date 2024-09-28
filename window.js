document.addEventListener("DOMContentLoaded", () => {
  const targetTabSelect = document.getElementById("targetTab");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultDiv = document.getElementById("result");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");

  // Load the saved API key from Chrome storage
  chrome.storage.local.get("CLAUDE_API_KEY", (result) => {
    if (result.CLAUDE_API_KEY) {
      apiKeyInput.value = result.CLAUDE_API_KEY;
    }
  });

  // Save the API key to Chrome storage
  saveApiKeyBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ CLAUDE_API_KEY: apiKey }, () => {
        alert("API Key saved successfully.");
      });
    } else {
      alert("Please enter a valid API key.");
    }
  });

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

    // Send a message to the background script to capture the screenshot and analyze it
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        tabId: tabId,
        windowId: windowId,
      },
      (response) => {
        if (response.error) {
          resultDiv.innerText = `Error: ${response.error}`;
        } else {
          resultDiv.innerText = `API Response: ${response.apiResponse}`;
        }
      }
    );
  });
});
