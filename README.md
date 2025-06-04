# Cookie Manager Browser Extension

A Chrome browser extension for managing cookies across websites.

## Features

- Add new cookies with custom name, value, domain, path and expiration
- Global cookies that work across all domains
- Save cookies for reuse across sessions
- View and inspect cookies on the current site
- Toggle cookies on/off with a single click
- Delete cookies from your saved list

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Cookie Manager extension is now installed and ready to use

## Usage

1. Click on the extension icon in your browser toolbar
2. Use the "Add new cookie" form to create new cookies
3. View and manage your saved cookies in the "Saved cookies" section
4. Click the "Site cookies" button to view cookies on the current site

## Development

This extension uses vanilla JavaScript, HTML and CSS. No build steps or dependencies required.

## Technical Details

The extension uses:

- Chrome Storage API to save your cookie presets
- Chrome Cookies API to manage cookies on websites
- Chrome Tabs API to identify the current website

## Privacy

This extension only manages cookies that you explicitly create and does not collect any personal data. All cookie data is stored locally in your browser.

## Feedback and Contributions

If you find bugs or have feature suggestions, please submit an issue or pull request to the repository.

## License

This project is open source and available under the MIT License.
