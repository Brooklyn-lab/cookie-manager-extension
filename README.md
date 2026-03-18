# Cookie Manager Browser Extension

A powerful Chrome extension for managing cookies and site data with automatic synchronization, smart domain validation, drag & drop reordering, and import/export functionality.

## Key Features

### 🍪 Saved Cookies Management

- **Add new cookies** with customizable name, value, domain, path and expiration settings
- **Edit cookie names and values** with modal dialog interface
- **SameSite, Secure, HttpOnly** attributes — full control over cookie security flags
- **Cross-domain operations** — set/remove cookies for any domain, not just the current tab
- **Cookie groups** — organize cookies into groups and enable/disable them in batch
- **Global cookies** that work across all domains
- **Save cookies** for future reuse across sessions
- **Copy cookie names and values** with one click (click on cookie name/value text)
- **Drag & drop reordering** — intuitive cookie organization by dragging items
- **Smart toggle buttons** that automatically sync with browser state (including cross-domain cookies)
- **Auto-sync on startup** — button states automatically update when extension opens
- **Real-time updates** — buttons sync when cookies are deleted from other parts of the extension
- **Auto-focus on Name field** — cursor automatically positioned for quick input when form opens
- **Delete cookies** from your saved list
- **Import/Export functionality** — backup and restore your saved cookies

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

- **Cross-domain search** — search cookies on any domain, not just the current tab
- **Domain selector** — pick from domains loaded on the page (iframes included) via `webNavigation`
- **Edit all cookie attributes** from search results (name, value, domain, path, SameSite, Secure, HttpOnly)
- **Input validation** — visual feedback for empty search attempts
- **Automatic search** across domain variants (.domain.com, domain.com)
- **Interactive results** with copyable values
- **Timeout protection** against search hanging
- **Clean error handling** with toast notifications
- **Auto-close accordions** — saved cookies accordion closes when searching

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

### From source (development)

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right corner
6. Click "Load unpacked" and select the `dist/` folder
7. Cookie Manager is now installed and ready to use

### Development mode

Run `npm run dev` to start watching for changes. Vite will rebuild automatically on file changes. Reload the extension in Chrome to see updates.

## Usage

### Basic Operations

1. **Click the extension icon** in your browser toolbar
2. **Adding new cookies**: use the "Add new cookie" form (cursor auto-focuses on Name field)
3. **View saved cookies**: expand the "Saved cookies" section
4. **Smart buttons**:
   - Blue "Add" button (outline) = cookie missing, can be added
   - Red "Remove" button (outline) = cookie exists, can be removed
   - Cross-domain cookies show Add/Remove based on their own domain state

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

- **Chrome Storage API** — saving cookie presets, groups, drag & drop order, and import/export data
- **Chrome Cookies API** — managing cookies on any domain with optimized batch operations
- **Chrome Tabs API** — identifying current site
- **Chrome WebNavigation API** — discovering iframe domains for cross-domain search
- **Chrome BrowsingData API** — clearing site data
- **Chrome Scripting API** — script injection for storage clearing
- **HTML5 Drag and Drop API** — cookie reordering functionality
- **File API** — reading and writing JSON files for import/export

### Architecture

- **Vanilla JavaScript** - no external dependencies
- **Modular structure** - separated functions for different operations
- **Event-driven** - using event delegation for dynamic content and drag & drop
- **Responsive UI** - adaptive interface with animations
- **Performance optimized** - batch API calls and efficient data structures
- **Focus management** - intelligent cursor positioning for optimal user experience

### Security

- **Local storage** - all data stored only in browser
- **Sanitized HTML** — XSS protection through proper escaping
- **CSP compliance** — no inline styles, strict `style-src 'self'`
- **User permissions** — using only necessary permissions
- **SameSite validation** — enforces Secure flag when SameSite=None
- **File validation** — comprehensive checks for imported data integrity

## Permissions Required

The extension requires the following permissions:

- `cookies` — reading and managing cookies on any domain
- `storage` — saving settings, groups, cookie order, and import/export data
- `tabs` — identifying current tab
- `activeTab` — working with current tab
- `scripting` — script injection for storage clearing
- `browsingData` — complete site data clearing
- `webNavigation` — discovering iframe domains for cross-domain search
- `host_permissions: <all_urls>` — cross-domain cookie operations

## Development

### Project Structure

```
BrowserExtension/
├── src/
│   ├── popup.html          # Interface HTML
│   ├── popup.js            # Main logic (ES module entry point)
│   ├── popup.css           # Interface styles
│   ├── utils.js            # Validation, encryption, UI helpers
│   ├── background.js       # Service worker for auto-apply
│   └── modules/
│       ├── cookies.js      # Cookie CRUD, toggle, sync, edit
│       ├── search.js       # Cross-domain search & edit
│       ├── groups.js       # Cookie groups management
│       ├── site-cookies.js # Site cookies display
│       ├── import-export.js# Import/export functionality
│       ├── drag-drop.js    # Drag & drop reordering
│       ├── ui.js           # UI helpers (toast, scroll, format)
│       └── state.js        # Shared state management
├── tests/                  # Vitest unit tests (213 tests)
├── public/
│   ├── manifest.json       # Extension configuration (MV3)
│   └── icon*.png           # Extension icons
├── dist/                   # Built extension (load this in Chrome)
├── vite.config.js          # Vite build configuration
└── package.json            # Dependencies and scripts
```

### Key Functions

- `autoSyncCookieStates()` — syncs saved cookie button states (same-domain + cross-domain)
- `checkCrossDomainCookieState()` — checks cookie existence on its own domain
- `checkCookieInMap()` — efficient O(1) cookie existence check using Map lookup
- `enableGroupCookies()` / `disableGroupCookies()` — batch group operations
- `searchCookieOnCurrentSite()` — search with optional cross-domain target
- `exportSavedCookies()` / `importSavedCookies()` — JSON backup and restore
- `initializeDragAndDrop()` — drag & drop with persistent order

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
