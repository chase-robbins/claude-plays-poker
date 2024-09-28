document.addEventListener("DOMContentLoaded", () => {
  const targetTabSelect = document.getElementById("targetTab");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultDiv = document.getElementById("result");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const usernameInput = document.getElementById("usernameInput");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");

  // Load the saved API key and username from Chrome storage
  chrome.storage.local.get(["CLAUDE_API_KEY", "USERNAME"], (result) => {
    if (result.CLAUDE_API_KEY) {
      apiKeyInput.value = result.CLAUDE_API_KEY;
    }
    if (result.USERNAME) {
      usernameInput.value = result.USERNAME;
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

  // Save the username to Chrome storage
  saveUsernameBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    if (username) {
      chrome.storage.local.set({ USERNAME: username }, () => {
        alert("Username saved successfully.");
      });
    } else {
      alert("Please enter a valid username.");
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
    const username = usernameInput.value.trim();
    if (isNaN(tabId) || isNaN(windowId)) {
      resultDiv.innerText = "Please select a tab.";
      return;
    }
    if (!username) {
      resultDiv.innerText = "Please enter a username.";
      return;
    }

    resultDiv.innerHTML = '<div class="spinner"></div>Analyzing...';

    // Send a message to the background script to capture the screenshot and analyze it
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        tabId: tabId,
        windowId: windowId,
        username: username,
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
