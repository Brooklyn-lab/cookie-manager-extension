# Cookie Manager Browser Extension

A powerful Chrome extension for managing cookies and site data with automatic synchronization and smart domain validation.

## Key Features

### 🍪 Saved Cookies Management

- **Add new cookies** with customizable name, value, domain, path and expiration settings
- **Global cookies** that work across all domains
- **Save cookies** for future reuse across sessions
- **Copy cookie names** with one click (click on cookie name)
- **Smart toggle buttons** that automatically sync with browser state
- **Domain validation** - buttons show "Domain Mismatch" when cookies can't be applied to current site
- **Auto-sync on startup** - button states automatically update when extension opens
- **Real-time updates** - buttons sync when cookies are deleted from other parts of the extension
- **Delete cookies** from your saved list

### 🌐 Site Information

- **View current site cookies** with detailed information
- **Copy cookie names and values** from site cookies with one click
- **Delete individual cookies** directly from site cookies list
- **Search for specific cookies** on the current site
- **Copy found cookies** from search results
- **Delete cookies** from search results
- **Toast notifications** for search errors instead of persistent messages

### 🧹 Data Clearing

- **Delete all cookies** from current site
- **Complete site data clearing** (cookies + localStorage + sessionStorage + IndexedDB + cache)
- **Automatic page refresh** after clearing
- **Auto-sync after clearing** - saved cookie buttons update automatically

### 🔍 Advanced Search

- **Search cookies by name** on current domain
- **Automatic search** across domain variants (.domain.com, domain.com)
- **Interactive results** with copyable values
- **Timeout protection** against search hanging
- **Clean error handling** with toast notifications
- **Auto-clearing** of error messages

### 💬 Convenient Messaging

- **Toast notifications** at the bottom of extension for errors and confirmations
- **Color-coded messages** (green for success, red for errors, blue for info)
- **Animated notifications** for all operations
- **Status indicators** for cookie management actions
- **Clean UI** - search errors don't persist on screen

### 🎨 Modern UI

- **Outline button style** - buttons show colored border by default, fill on hover
- **Consistent design** - Add (blue) and Remove (red) buttons follow same interaction pattern
- **Visual feedback** - clear distinction between available, unavailable, and disabled states
- **Responsive interface** - adapts to different content sizes

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
4. **Smart buttons**:
   - Blue "Add" button (outline) = cookie missing, can be added
   - Red "Remove" button (outline) = cookie exists, can be removed
   - Gray "Domain Mismatch" button = cookie can't be applied to current domain

### Automatic Features

- **Auto-sync on open**: Button states automatically update when you open the extension
- **Real-time updates**: When you delete cookies from site cookies or search, saved cookie buttons automatically update
- **Domain validation**: Buttons automatically detect if cookies can be applied to current domain
- **Smart notifications**: Error messages use toast notifications that auto-dismiss

### Working with Sites

1. **View site cookies**: click "Site cookies" for detailed information
2. **Delete individual cookies**: use trash icon next to each cookie
3. **Search cookies**: use the search field under saved cookies
4. **Copy data**: click on cookie names and values to copy them
5. **Clear data**: use "Clear all cookies" or "Clear all data"

### Copying Data

- **Saved cookie names**: click on cookie name → automatic copying
- **Site cookies**: click on name or value → copy to clipboard
- **Search results**: click on found cookie value → copying

## Technical Details

### New Features

- **Optimized cookie checking**: Single API call instead of multiple individual checks
- **Map-based lookup**: O(1) performance for cookie existence checks
- **Automatic synchronization**: Buttons update when cookies are modified anywhere in the extension
- **Domain compatibility**: Smart detection of cookie-domain compatibility
- **Enhanced error handling**: Toast notifications replace persistent error messages

### APIs Used

- **Chrome Storage API** - saving cookie presets
- **Chrome Cookies API** - managing cookies on websites with optimized batch operations
- **Chrome Tabs API** - identifying current site
- **Chrome BrowsingData API** - clearing site data
- **Chrome Scripting API** - script injection for storage clearing

### Architecture

- **Vanilla JavaScript** - no external dependencies
- **Modular structure** - separated functions for different operations
- **Event-driven** - using event delegation for dynamic content
- **Responsive UI** - adaptive interface with animations
- **Performance optimized** - batch API calls and efficient data structures

### Security

- **Local storage** - all data stored only in browser
- **Sanitized HTML** - XSS protection through proper escaping
- **User permissions** - using only necessary permissions
- **Domain validation** - prevents inappropriate cookie application

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
├── popup.css         # Interface styles with modern button designs
├── popup.js          # Main logic with auto-sync and domain validation
└── README.md         # Documentation
```

### Key Functions

- `autoSyncCookieStates()` - Automatically syncs all saved cookie button states
- `canApplyCookieToCurrentDomain()` - Validates cookie-domain compatibility
- `updateToggleButtonState()` - Updates individual button appearance and state
- `checkCookieInMap()` - Efficient cookie existence checking using Map lookup

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
