# Cookie Manager Browser Extension

A powerful Chrome extension for managing cookies and site data.

## Key Features

### 🍪 Saved Cookies Management

- **Add new cookies** with customizable name, value, domain, path and expiration settings
- **Global cookies** that work across all domains
- **Save cookies** for future reuse across sessions
- **Copy cookie names** with one click (click on cookie name)
- **Toggle cookies** on/off with a single click
- **Delete cookies** from your saved list
- **Check cookie status** whether it's set on current site

### 🌐 Site Information

- **View current site cookies** with detailed information
- **Copy cookie names and values** from site cookies with one click
- **Search for specific cookies** on the current site
- **Copy found cookies** from search results

### 🧹 Data Clearing

- **Delete all cookies** from current site
- **Complete site data clearing** (cookies + localStorage + sessionStorage + IndexedDB + cache)
- **Automatic page refresh** after clearing

### 🔍 Advanced Search

- **Search cookies by name** on current domain
- **Automatic search** across domain variants (.domain.com, domain.com)
- **Interactive results** with copyable values
- **Timeout protection** against search hanging

### 💬 Convenient Messaging

- **Local messages** under each cookie block
- **Animated notifications** for successful copying
- **Status indicators** for all operations

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. Cookie Manager is now installed and ready to use

## Usage

### Basic Operations

1. **Click the extension icon** in your browser toolbar
2. **Adding new cookies**: use the "Add new cookie" form
3. **View saved cookies**: expand the "Saved cookies" section
4. **Manage cookies**: use Toggle/Check/Delete buttons for each cookie

### Working with Sites

1. **View site cookies**: click "Site cookies" for detailed information
2. **Search cookies**: use the search field under saved cookies
3. **Copy data**: click on cookie names and values to copy them
4. **Clear data**: use "Clear all cookies" or "Clear all data"

### Copying Data

- **Saved cookie names**: click on cookie name → automatic copying
- **Site cookies**: click on name or value → copy to clipboard
- **Search results**: click on found cookie value → copying

## Technical Details

### APIs Used

- **Chrome Storage API** - saving cookie presets
- **Chrome Cookies API** - managing cookies on websites
- **Chrome Tabs API** - identifying current site
- **Chrome BrowsingData API** - clearing site data
- **Chrome Scripting API** - script injection for storage clearing

### Architecture

- **Vanilla JavaScript** - no external dependencies
- **Modular structure** - separated functions for different operations
- **Event-driven** - using event delegation for dynamic content
- **Responsive UI** - adaptive interface with animations

### Security

- **Local storage** - all data stored only in browser
- **Sanitized HTML** - XSS protection through proper escaping
- **User permissions** - using only necessary permissions

## Permissions Required

The extension requires the following permissions:

- `cookies` - for reading and managing cookies
- `storage` - for saving settings
- `activeTab` - for working with current tab
- `scripting` - for clearing script injection
- `browsingData` - for complete site data clearing
- `host_permissions` - for access to all sites

## Development

### Project Structure

```
BrowserExtension/
├── manifest.json      # Extension configuration
├── popup.html        # Interface HTML
├── popup.css         # Interface styles
├── popup.js          # Main logic
└── README.md         # Documentation
```

### Debugging

1. Open Developer Tools in extension popup
2. Check console for errors
3. Use `debugLog()` function for logging
4. Check Chrome Extension DevTools

## Privacy

- **No external connections** - extension works only locally
- **No data collection** - no information sent to third parties
- **Local storage** - all data remains in your browser
- **Transparent code** - all code is open for review

## Feedback and Contributions

If you find bugs or have feature suggestions, please create an issue or pull request in the repository.

## License

This project is open source and available under the MIT License.
