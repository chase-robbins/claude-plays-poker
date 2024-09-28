// Add event listener for when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements
  const targetTabSelect = document.getElementById("targetTab");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultDiv = document.getElementById("result");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const usernameInput = document.getElementById("usernameInput");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");

  // Retrieve saved API key and username from local storage
  chrome.storage.local.get(["CLAUDE_API_KEY", "USERNAME"], (result) => {
    if (result.CLAUDE_API_KEY) {
      apiKeyInput.value = result.CLAUDE_API_KEY;
    }
    if (result.USERNAME) {
      usernameInput.value = result.USERNAME;
    }
  });

  // Event listener for saving API key
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

  // Event listener for saving username
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

  // Populate the tab selection dropdown
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      const option = document.createElement("option");
      option.value = `${tab.id},${tab.windowId}`;
      option.text = `${tab.title} (Window ${tab.windowId})`;
      targetTabSelect.appendChild(option);
    });
  });

  // Event listener for the analyze button
  analyzeBtn.addEventListener("click", () => {
    // Extract tab and window IDs from the selected option
    const [tabId, windowId] = targetTabSelect.value.split(",").map(Number);
    const username = usernameInput.value.trim();

    // Validate tab selection and username
    if (isNaN(tabId) || isNaN(windowId)) {
      resultDiv.innerText = "Please select a tab.";
      return;
    }
    if (!username) {
      resultDiv.innerText = "Please enter a username.";
      return;
    }

    // Show loading spinner
    resultDiv.innerHTML = '<div class="spinner"></div>Analyzing...';

    // Send message to background script to capture and analyze screenshot
    chrome.runtime.sendMessage(
      {
        action: "captureScreenshot",
        tabId: tabId,
        windowId: windowId,
        username: username,
      },
      (response) => {
        // Handle the response from the background script
        if (response.error) {
          resultDiv.innerText = `Error: ${response.error}`;
        } else {
          resultDiv.innerText = `API Response: ${response.apiResponse}`;
        }
      }
    );
  });
});
