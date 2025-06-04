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
2. Create a new branch from `dev`
3. Load the unpacked extension in Chrome from your development directory
4. Make your changes and test in the browser

## Testing

Test your changes in Chrome before submitting:

- Test with different domains
- Test with various cookie settings
- Verify the UI works as expected

## Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript best practices
- Use clear, descriptive variable and function names
- Add comments for complex logic
