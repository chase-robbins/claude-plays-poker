# Poker Screen Analyzer

## What the Project Does

https://github.com/user-attachments/assets/e4a74735-6c08-4d79-8017-eb25b2196a18

The Poker Screen Analyzer is a Chrome extension designed to capture screenshots of your active browser tab and analyze the content using an external API. The extension is particularly useful for poker players who want to get professional recommendations on their next move based on the current game situation displayed in the browser.

## How it works

1. **Initialization**: When the extension is installed, it initializes with no selected window.
2. **Capture Screenshot**: The extension listens for a message to capture a screenshot of the active tab in a specified window.
3. **Send to API**: The captured screenshot is sent to an external API (Claude) for analysis.
4. **Receive Recommendations**: The API analyzes the screenshot and provides professional poker recommendations.

## How to install this locally

1. Clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the cloned repository folder.
5. The extension should now be installed and visible in the Chrome toolbar.

## Configuring in the window

1. Open the extension popup by clicking the extension icon in the Chrome toolbar.
2. Enter your Claude API key and username in the respective fields.
3. Click "Save API Key" and "Save Username" to store these values locally.
4. Select the tab you want to analyze from the dropdown menu.
5. Click "Analyze..." to capture the screenshot and get recommendations.

## Usage

1. Open the extension popup.
2. Ensure your API key and username are saved. Note: Username is your in game username on the site you're playing on.
3. Select the target tab from the dropdown.
4. Click "Analyze..." to start the analysis.
5. View the recommendations in the result section of the popup.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.
