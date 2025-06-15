# Cookie Manager Browser Extension

A powerful Chrome extension for managing cookies and site data with automatic synchronization, smart domain validation, drag & drop reordering, and import/export functionality.

## Key Features

### 🍪 Saved Cookies Management

- **Add new cookies** with customizable name, value, domain, path and expiration settings
- **Edit cookie names and values** with modal dialog interface
- **Global cookies** that work across all domains
- **Save cookies** for future reuse across sessions
- **Copy cookie names and values** with one click (click on cookie name/value text)
- **Drag & drop reordering** - intuitive cookie organization by dragging items
- **Smart toggle buttons** that automatically sync with browser state
- **Domain validation** - buttons show "Domain Mismatch" when cookies can't be applied to current site
- **Auto-sync on startup** - button states automatically update when extension opens
- **Real-time updates** - buttons sync when cookies are deleted from other parts of the extension
- **Auto-focus on Name field** - cursor automatically positioned for quick input when form opens
- **Delete cookies** from your saved list
- **Import/Export functionality** - backup and restore your saved cookies

### 🎯 Drag & Drop Features

- **Visual drag handles** - appear on hover for easy identification
- **Real-time reordering** - see changes as you drag
- **Smart drop zones** - clear visual indicators where items can be dropped
- **Persistent order** - reordered cookies saved automatically to storage
- **Smooth animations** - polished drag experience with rotation and shadow effects
- **Touch-friendly** - works on touch devices and trackpads
- **Non-intrusive** - only activates when you have 2+ cookies to organize
- **Automatic disable** - drag functionality disabled when only 1 cookie present

### 📁 Import/Export System

- **Export saved cookies** to JSON file with metadata (version, timestamp, count)
- **Import cookies** from JSON with smart merge (no duplicates by name)
- **Validation system** - checks file format and required fields
- **Conflict handling** - adds only new cookies, preserves existing ones
- **Automatic ID generation** - prevents ID conflicts during import
- **Toast notifications** for all import/export operations
- **Error handling** - comprehensive validation and user feedback

### 🌐 Site Information

- **View current site cookies** with detailed information
- **Edit cookie names and values** directly from site cookies display
- **Copy cookie names and values** from site cookies with one click
- **Delete individual cookies** directly from site cookies list
- **Auto-close functionality** - site cookies window closes after deleting last cookie
- **Search for specific cookies** on the current site
- **Edit found cookies** from search results with real-time updates
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
- **Input validation** - visual feedback for empty search attempts
- **Automatic search** across domain variants (.domain.com, domain.com)
- **Interactive results** with copyable values
- **Timeout protection** against search hanging
- **Clean error handling** with toast notifications
- **Auto-clearing** of error messages
- **Auto-close accordions** - saved cookies accordion closes when searching

### 💬 Enhanced User Experience

- **Toast notifications** at the bottom of extension for errors and confirmations
- **Color-coded messages** (green for success, red for errors, blue for info)
- **Animated notifications** for all operations
- **Consistent validation** - unified error styling across forms (red border + shake animation)
- **Input focus management** - automatic cursor positioning for optimal workflow
- **Status indicators** for cookie management actions
- **Clean UI** - search errors don't persist on screen

### 🎨 Modern UI

- **Outline button style** - buttons show colored border by default, fill on hover
- **Consistent design** - Add (blue) and Remove (red) buttons follow same interaction pattern
- **Visual feedback** - clear distinction between available, unavailable, and disabled states
- **Responsive interface** - adapts to different content sizes
- **Optimized click zones** - copy functionality only activates on text, not entire blocks
- **Unified validation styling** - consistent error feedback across all input fields

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. Cookie Manager is now installed and ready to use

## Usage

### Basic Operations

1. **Click the extension icon** in your browser toolbar
2. **Adding new cookies**: use the "Add new cookie" form (cursor auto-focuses on Name field)
3. **View saved cookies**: expand the "Saved cookies" section
4. **Smart buttons**:
   - Blue "Add" button (outline) = cookie missing, can be added
   - Red "Remove" button (outline) = cookie exists, can be removed
   - Gray "Domain Mismatch" button = cookie can't be applied to current domain

### Import/Export Cookies

1. **Export**: Click "Export" button in saved cookies section → JSON file downloads automatically
2. **Import**: Click "Import" button → select JSON file → smart merge (only new cookies added)
3. **File format**: JSON with version, timestamp, and cookie array
4. **Validation**: Automatic checks for file format and required fields
5. **Conflict resolution**: Duplicate names (by name) are skipped, only new cookies added

### Drag & Drop Cookie Reordering

1. **Hover over any cookie** to see the drag handle (⋮⋮) appear on the left
2. **Drag any cookie item** to reorder - grab anywhere on the cookie block
3. **Visual feedback** shows where you can drop the item with blue borders
4. **Automatic saving** - new order is saved to storage immediately
5. **Success notification** confirms when reordering is complete
6. **Smart disable** - drag handles hidden when only 1 cookie present

### Enhanced Search Features

1. **Empty input validation** - red border highlight with shake animation when searching with empty input
2. **Auto-focus** - error state clears automatically after 3 seconds or when typing
3. **Auto-close accordions** - saved cookies section closes when initiating search
4. **Toast notifications** - clean error handling without persistent UI clutter

### Automatic Features

- **Auto-sync on open**: Button states automatically update when you open the extension
- **Real-time updates**: When you delete cookies from site cookies or search, saved cookie buttons automatically update
- **Domain validation**: Buttons automatically detect if cookies can be applied to current domain
- **Smart notifications**: Error messages use toast notifications that auto-dismiss
- **Auto-focus management**: Cursor automatically positioned in Name field when form opens

### Working with Sites

1. **View site cookies**: click "Site cookies" for detailed information
2. **Delete individual cookies**: use trash icon next to each cookie
3. **Search cookies**: use the search field under saved cookies
4. **Copy data**: click on cookie names and values to copy them
5. **Clear data**: use "Clear all cookies" or "Clear all data"

### Copying Data

- **Saved cookie names**: click on cookie name text → automatic copying
- **Saved cookie values**: click on value text → copy to clipboard
- **Site cookies**: click on name or value → copy to clipboard
- **Search results**: click on found cookie value → copying

## Technical Details

### New Features

- **Cookie editing functionality**: Edit both names and values across all contexts (saved, search, site cookies)
- **Modal dialog interface**: Clean editing experience with name and value fields
- **Real-time updates**: All displays update immediately after editing
- **Auto-focus functionality**: Automatic cursor positioning in Name field when form opens
- **Import/Export system**: Complete cookie backup and restore with JSON format
- **Enhanced validation**: Unified error styling with red borders and shake animations
- **Smart UI management**: Auto-closing accordions and optimal focus handling
- **Drag & Drop functionality**: HTML5 Drag and Drop API with visual feedback
- **Optimized cookie checking**: Single API call instead of multiple individual checks
- **Map-based lookup**: O(1) performance for cookie existence checks
- **Automatic synchronization**: Buttons update when cookies are modified anywhere in the extension
- **Domain compatibility**: Smart detection of cookie-domain compatibility
- **Enhanced error handling**: Toast notifications replace persistent error messages
- **Click zone optimization**: Precise click areas for copy functionality
- **Duplicate prevention**: Smart cookie handling prevents duplicates during editing

### APIs Used

- **Chrome Storage API** - saving cookie presets, drag & drop order, and import/export data
- **Chrome Cookies API** - managing cookies on websites with optimized batch operations
- **Chrome Tabs API** - identifying current site
- **Chrome BrowsingData API** - clearing site data
- **Chrome Scripting API** - script injection for storage clearing
- **HTML5 Drag and Drop API** - cookie reordering functionality
- **File API** - reading and writing JSON files for import/export

### Architecture

- **Vanilla JavaScript** - no external dependencies
- **Modular structure** - separated functions for different operations
- **Event-driven** - using event delegation for dynamic content and drag & drop
- **Responsive UI** - adaptive interface with animations
- **Performance optimized** - batch API calls and efficient data structures
- **Focus management** - intelligent cursor positioning for optimal user experience

### Security

- **Local storage** - all data stored only in browser
- **Sanitized HTML** - XSS protection through proper escaping
- **User permissions** - using only necessary permissions
- **Domain validation** - prevents inappropriate cookie application
- **File validation** - comprehensive checks for imported data integrity

## Permissions Required

The extension requires the following permissions:

- `cookies` - for reading and managing cookies
- `storage` - for saving settings, cookie order, and import/export data
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
├── popup.css         # Interface styles with modern button designs, drag & drop, and validation
├── popup.js          # Main logic with auto-sync, domain validation, drag & drop, and import/export
└── README.md         # Documentation
```

### Key Functions

- `autoSyncCookieStates()` - Automatically syncs all saved cookie button states
- `canApplyCookieToCurrentDomain()` - Validates cookie-domain compatibility
- `updateToggleButtonState()` - Updates individual button appearance and state
- `checkCookieInMap()` - Efficient cookie existence checking using Map lookup
- `initializeDragAndDrop()` - Sets up drag & drop functionality with event handlers
- `updateCookieOrder()` - Saves new cookie order to storage after drag & drop
- `handleDragStart/Over/Enter/Leave/Drop/End()` - Complete drag & drop event handling
- `exportSavedCookies()` - Creates and downloads JSON backup of saved cookies
- `importSavedCookies()` - Reads and validates JSON file, merges new cookies
- `updateDraggableState()` - Controls drag functionality based on cookie count

### Debugging

1. Open Developer Tools in extension popup
2. Check console for errors
3. Use `debugLog()` function for logging
4. Check Chrome Extension DevTools
5. Monitor drag & drop events in console
6. Test import/export with various JSON formats

## Privacy

- **No external connections** - extension works only locally
- **No data collection** - no information sent to third parties
- **Local storage** - all data remains in your browser
- **Transparent code** - all code is open for review
- **Secure file handling** - import/export uses local file system only

## Feedback and Contributions

If you find bugs or have feature suggestions, please create an issue or pull request in the repository.

## License

This project is open source and available under the MIT License.
