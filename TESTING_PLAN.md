# Cookie Manager Extension - Testing Plan

## 🧪 Comprehensive Testing Plan

### 1. 🍪 Saved Cookies

#### 1.1 Adding New Cookies

- [ ] Open the "Add new cookie" form
- [ ] Verify auto-focus on the Name field
- [ ] Add a cookie with all fields (name, value, domain, path, expiration)
- [ ] Add a cookie with SameSite=None and Secure=true
- [ ] Verify Secure auto-checks when SameSite=None is selected
- [ ] Verify validation rejects SameSite=None without Secure
- [ ] Add a cookie with HttpOnly=true
- [ ] Add a global cookie (isGlobal = true)
- [ ] Verify empty field validation
- [ ] Verify invalid domain validation
- [ ] Verify invalid path validation
- [ ] Verify storage persistence (including sameSite, secure, httpOnly)
- [ ] Verify SameSite badge display in the saved cookies list

#### 1.2 Editing Saved Cookies

- [ ] Click the edit button (pencil icon) on a saved cookie
- [ ] Verify the edit modal opens
- [ ] Verify auto-focus on the Name field
- [ ] Change only the cookie name
- [ ] Change only the cookie value
- [ ] Change both name and value
- [ ] Change SameSite from Lax to None (verify Secure auto-checks)
- [ ] Change Secure and HttpOnly checkboxes
- [ ] Verify empty field validation
- [ ] Save changes via Ctrl+Enter
- [ ] Save changes via Save button
- [ ] Cancel changes via Cancel button
- [ ] Cancel changes by clicking outside the modal
- [ ] Verify the saved cookies list updates
- [ ] Verify changes persist in storage

#### 1.3 Deleting Saved Cookies

- [ ] Click the delete button (trash icon) on a saved cookie
- [ ] Verify removal from DOM
- [ ] Verify removal from storage
- [ ] Verify cookie numbering updates
- [ ] Verify drag handles update (hidden when only 1 cookie remains)

#### 1.4 Copying Saved Cookies

- [ ] Click on a cookie name
- [ ] Verify the name is copied to clipboard
- [ ] Click on a cookie value
- [ ] Verify the value is copied to clipboard
- [ ] Verify success toast notification

#### 1.5 Toggle Functionality

- [ ] Verify Add button state (blue) when cookie is absent in browser
- [ ] Click Add and verify the cookie is set in the browser
- [ ] Verify button changes to Remove (red)
- [ ] Click Remove and verify the cookie is deleted from browser
- [ ] Verify button changes back to Add
- [ ] Verify cross-domain toggle (save cookie for .example.com, navigate to a different site, toggle should work)
- [ ] Verify SameSite/Secure/HttpOnly are preserved during toggle
- [ ] Verify auto-sync on extension open (including cross-domain cookies)

### 2. 🔄 Drag & Drop

#### 2.1 Basic Functionality

- [ ] Create 3+ saved cookies
- [ ] Verify drag handles appear on hover
- [ ] Drag a cookie up in the list
- [ ] Drag a cookie down in the list
- [ ] Verify visual drop zone indicators
- [ ] Verify new order persists in storage
- [ ] Verify success toast notification

#### 2.2 Edge Cases

- [ ] Verify no drag handles with 1 cookie
- [ ] Verify no drag handles with 0 cookies
- [ ] Attempt to drag a cookie outside the container
- [ ] Verify drag cancellation (ESC or release outside drop zone)

### 3. 📁 Import/Export

#### 3.1 Export

- [ ] Create several saved cookies
- [ ] Click the Export button
- [ ] Verify JSON file downloads
- [ ] Verify JSON structure (version, timestamp, cookies)
- [ ] Verify cookie data correctness in the file

#### 3.2 Import

- [ ] Click the Import button
- [ ] Select a valid JSON file
- [ ] Verify new cookies are imported
- [ ] Verify duplicates are skipped (by name)
- [ ] Attempt to import invalid JSON
- [ ] Attempt to import a file with missing required fields
- [ ] Verify toast notification with import results

### 4. 🌐 Site Cookies

#### 4.1 Viewing Site Cookies

- [ ] Click the "Site cookies" button
- [ ] Verify all current site cookies are displayed
- [ ] Verify cookie details (name, value, domain, path, SameSite badge)
- [ ] Verify edit and delete buttons for each cookie

#### 4.2 Editing Site Cookies

- [ ] Click the edit button on a site cookie
- [ ] Verify the edit modal opens
- [ ] Change the cookie name
- [ ] Change the cookie value
- [ ] Save changes
- [ ] Verify update in Site cookies display
- [ ] Verify update in browser (DevTools)

#### 4.3 Deleting Site Cookies

- [ ] Click the delete button on a site cookie
- [ ] Verify removal from Site cookies display
- [ ] Verify removal from browser
- [ ] Delete all cookies one by one
- [ ] Verify Site cookies auto-closes after the last cookie is deleted
- [ ] Verify the 5-second auto-close timer

#### 4.4 Copying Site Cookies

- [ ] Click on a site cookie name
- [ ] Verify it is copied to clipboard
- [ ] Click on a site cookie value
- [ ] Verify it is copied to clipboard

#### 4.5 Site Cookies Toggle

- [ ] Click "Site cookies" while search results are open
- [ ] Verify search results close
- [ ] Click "Site cookies" again
- [ ] Verify Site cookies close (toggle behavior)

### 5. 🔍 Search

#### 5.1 Search on Current Site and Cross-Domain

- [ ] Enter an existing cookie name in the search field
- [ ] Click the Search button
- [ ] Verify search results are displayed
- [ ] Select a different domain in the domain selector
- [ ] Verify search runs against the selected domain
- [ ] Verify domain selector shows frames from the current page
- [ ] Search for a non-existing cookie
- [ ] Verify "Cookie not found" message

#### 5.2 Editing Found Cookies (All Attributes)

- [ ] Find a cookie via search
- [ ] Click the edit button on a search result
- [ ] Verify the modal shows all attributes (name, value, domain, path, SameSite, Secure, HttpOnly)
- [ ] Change SameSite from Lax to None (verify Secure auto-checks)
- [ ] Change the cookie value
- [ ] Save changes
- [ ] Verify update in browser (DevTools)

#### 5.3 Deleting Found Cookies

- [ ] Find a cookie via search
- [ ] Click the delete button on a search result
- [ ] Verify removal from search results
- [ ] Verify removal from browser

#### 5.4 Search Validation

- [ ] Attempt a search with an empty field
- [ ] Verify red border highlight on the input
- [ ] Verify shake animation
- [ ] Start typing and verify the error state clears

### 5.5 Cookie Groups

- [ ] Create a new group
- [ ] Rename a group
- [ ] Assign a cookie to a group (via badge)
- [ ] Verify the cookie appears in the group
- [ ] Enable group — verify all cookies are set in the browser with correct SameSite/Secure/HttpOnly
- [ ] Disable group — verify all cookies are removed
- [ ] Delete a group
- [ ] Verify cross-domain group enable (cookies for different domains in one group)

### 5.6 Cross-Domain Operations

- [ ] Save a cookie for domain A
- [ ] Navigate to a site on domain B
- [ ] Verify the toggle button shows Add/Remove (not Domain Mismatch)
- [ ] Click Add — verify the cookie appears on domain A (via DevTools)
- [ ] Click Remove — verify deletion
- [ ] Edit a cross-domain cookie — verify the browser cookie updates
- [ ] Verify export contains the updated value

### 6. 🧹 Data Clearing

#### 6.1 Clear All Site Cookies

- [ ] Click "Clear all cookies"
- [ ] Verify all current site cookies are removed
- [ ] Verify automatic page refresh
- [ ] Verify saved cookies auto-sync

#### 6.2 Clear All Site Data

- [ ] Click "Clear all data"
- [ ] Verify cookies, localStorage, sessionStorage, IndexedDB are cleared
- [ ] Verify automatic page refresh

### 7. 🎨 UI/UX

#### 7.1 Accordion Behavior

- [ ] Open the "Add new cookie" accordion
- [ ] Verify auto-focus on the Name field
- [ ] Open the "Saved cookies" accordion
- [ ] Verify the previous accordion closes
- [ ] Open Site cookies
- [ ] Verify all accordions close

#### 7.2 Modals

- [ ] Open an edit modal
- [ ] Verify focus on the Name field
- [ ] Click outside the modal
- [ ] Verify the modal closes
- [ ] Press ESC
- [ ] Verify the modal closes

#### 7.3 Toast Notifications

- [ ] Perform an action that triggers a toast
- [ ] Verify the toast appears at the bottom of the extension
- [ ] Verify auto-dismiss after 3 seconds
- [ ] Verify different toast types (success, error, info)

#### 7.4 Form Validation

- [ ] Attempt to add a cookie with empty fields
- [ ] Verify red border highlight on fields
- [ ] Verify shake animation
- [ ] Start typing in a field and verify the error clears

### 8. 🔒 Security

#### 8.1 XSS Protection

- [ ] Enter `<script>alert('xss')</script>` as a cookie name
- [ ] Enter HTML tags in a cookie value
- [ ] Verify scripts do not execute
- [ ] Verify proper HTML escaping

#### 8.2 Data Validation

- [ ] Enter a very long cookie name (>150 characters)
- [ ] Enter a very long cookie value (>4000 characters)
- [ ] Enter invalid characters in a cookie name
- [ ] Verify invalid data is rejected

### 9. 📱 Compatibility

#### 9.1 Different Sites

- [ ] Test on an HTTP site
- [ ] Test on an HTTPS site
- [ ] Test on localhost
- [ ] Test on a site with subdomains

#### 9.2 Different Cookie Types

- [ ] Test with HttpOnly cookies
- [ ] Test with Secure cookies
- [ ] Test with SameSite=None; Secure cookies (iframe use case)
- [ ] Test with SameSite=Strict cookies
- [ ] Test with SameSite=Lax cookies
- [ ] Test changing SameSite from Lax to None and vice versa
- [ ] Test with cookies that have empty values

#### 9.3 Backward Compatibility

- [ ] Verify old saved cookies (without sameSite/secure/httpOnly fields) still work
- [ ] Verify toggle for old cookies uses defaults (unspecified/false/false)
- [ ] Import an old-format JSON file — verify compatibility

### 10. ⚡ Performance

#### 10.1 Large Data Volumes

- [ ] Create 50+ saved cookies
- [ ] Verify load time is acceptable
- [ ] Verify drag & drop performance
- [ ] Verify search performance

#### 10.2 Memory

- [ ] Open/close the extension 20+ times
- [ ] Verify no memory leaks
- [ ] Verify event listeners are cleaned up

### 11. 🔄 Synchronization

#### 11.1 Auto-Sync

- [ ] Open the extension
- [ ] Verify toggle buttons auto-sync
- [ ] Delete a cookie via DevTools
- [ ] Reopen the extension
- [ ] Verify button states update

#### 11.2 Real-Time Updates

- [ ] Open Site cookies
- [ ] Delete a cookie via search
- [ ] Verify Site cookies display updates
- [ ] Edit a cookie via Site cookies
- [ ] Verify search results update

### 12. 🐛 Edge Cases

#### 12.1 Empty States

- [ ] Test the extension with no saved cookies
- [ ] Test on a site with no cookies
- [ ] Test search on a site with no cookies

#### 12.2 API Errors

- [ ] Test when chrome.cookies API is unavailable
- [ ] Test when chrome.storage API errors occur
- [ ] Verify graceful degradation

#### 12.3 Invalid Data

- [ ] Import a file with invalid JSON
- [ ] Import a file with missing fields
- [ ] Attempt to edit a non-existing cookie

## ✅ Pass Criteria

- All core features work without errors
- UI responds to all user actions
- Data is correctly saved and loaded
- Validation works properly
- Security is ensured (no XSS, data validation)
- Performance is acceptable even with large data volumes
- Synchronization works in real time
- Edge cases are handled gracefully

## 🚨 Critical Issues (Fix Immediately)

- Loss of saved cookies
- XSS vulnerabilities
- Inability to add/remove cookies
- Extension crash on invalid data
- Memory leaks
- Incorrect state synchronization
