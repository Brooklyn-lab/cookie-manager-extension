# Contributing to Cookie Manager Extension

Thank you for your interest in contributing to the Cookie Manager Extension! This document provides guidelines and workflows to ensure smooth collaboration.

## Development Workflow

We follow a simple Git workflow:

1. All development work happens in the `dev` branch
2. Feature branches should be created from `dev` for new functionality
3. Pull requests should target the `dev` branch
4. Stable releases are merged from `dev` to `main`

## Branch Naming Conventions

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Documentation updates: `docs/description`
- Performance improvements: `perf/description`

## Commit Message Guidelines

Write clear, concise commit messages that explain the "what" and "why" of your changes:

```
[type]: Short summary of changes (max 50 chars)

More detailed explanation if necessary.
- Bullet points for specific changes
- Another change detail
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc; no code change
- `refactor`: Refactoring production code
- `test`: Adding tests, refactoring tests; no production code change
- `chore`: Updating build tasks, package manager configs, etc

## Pull Request Process

1. Ensure your code follows the existing style and conventions
2. Update documentation as needed
3. Test your changes thoroughly
4. Submit a pull request to the `dev` branch
5. Wait for code review and address any feedback

## Setting Up the Development Environment

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a new branch from `dev`
4. Run `npm run dev` for watch mode (auto-rebuilds on change)
5. Open `chrome://extensions/`, enable Developer mode
6. Click "Load unpacked" and select the `dist/` folder
7. After code changes, click the reload icon on the extension card

## Testing

Run the test suite before submitting:

```bash
npm test          # run all tests (213 tests across 6 files)
npm run test:watch # watch mode for development
npm run build     # verify production build succeeds
```

Manual testing checklist:
- Test with different domains (HTTP, HTTPS, localhost)
- Test cross-domain cookie operations (e.g., modify cookies from an iframe domain)
- Test SameSite/Secure/HttpOnly attribute changes
- Test cookie groups enable/disable
- Verify the UI works as expected and has no CSP violations

## Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript best practices
- Use clear, descriptive variable and function names
- No inline `style=` attributes in JS (CSP requires `style-src 'self'`)
- Add comments for complex logic only — avoid obvious comments
