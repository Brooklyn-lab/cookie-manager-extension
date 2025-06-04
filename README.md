# Cookie Manager Browser Extension

A simple browser extension that allows you to manage cookies across different websites.

## Features

- Create and save cookie presets for quick access
- Set cookies globally (for any domain) or for specific domains
- Easily toggle cookies on/off for the current site
- Check if a cookie exists on the current site
- Delete cookies from your saved list

## How to Use

1. **Adding a Cookie**:

   - Click on "Add new cookie" to expand the form
   - Fill in the cookie details (name, value, etc.)
   - Choose whether it should be a global cookie (works on any domain) or domain-specific
   - Click "Add cookie" to save it to your list

2. **Managing Cookies**:

   - Your saved cookies appear in the list below
   - Use the "Toggle" button to add/remove a cookie on the current site
   - Use the "Check" button to see if the cookie exists on the current site
   - Use the "✕" button to remove a cookie from your saved list

3. **Global vs. Domain-specific Cookies**:
   - Global cookies will work on any domain
   - Domain-specific cookies will only be applied to matching domains

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
