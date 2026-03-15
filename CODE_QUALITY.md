# Code Quality Configuration

This document describes the ESLint and Prettier configuration for the MERN Education Platform.

## Overview

The project uses ESLint for code linting and Prettier for code formatting across both backend and frontend workspaces. The configuration ensures consistent code style and catches potential issues early.

## Tools

- **ESLint v10.x**: JavaScript/TypeScript linter with flat config format
- **Prettier v3.x**: Opinionated code formatter
- **TypeScript ESLint**: TypeScript-specific linting rules
- **React ESLint Plugins**: React and React Hooks linting (frontend only)

## Configuration Files

### Backend (`backend/`)

- `eslint.config.mjs`: ESLint configuration using flat config format
- `.prettierrc.json`: Prettier formatting rules
- `.prettierignore`: Files to exclude from formatting

### Frontend (`frontend/`)

- `eslint.config.mjs`: ESLint configuration with React support
- `.prettierrc.json`: Prettier formatting rules
- `.prettierignore`: Files to exclude from formatting

## Available Scripts

### Root Level (runs on all workspaces)

```bash
npm run lint              # Run ESLint on all workspaces
npm run lint:fix          # Run ESLint with auto-fix on all workspaces
npm run format            # Format code with Prettier on all workspaces
npm run format:check      # Check code formatting on all workspaces
```

### Backend Workspace

```bash
npm run lint -w backend              # Run ESLint on backend
npm run lint:fix -w backend          # Run ESLint with auto-fix on backend
npm run format -w backend            # Format backend code
npm run format:check -w backend      # Check backend formatting
```

### Frontend Workspace

```bash
npm run lint -w frontend             # Run ESLint on frontend
npm run lint:fix -w frontend         # Run ESLint with auto-fix on frontend
npm run format -w frontend           # Format frontend code
npm run format:check -w frontend     # Check frontend formatting
```

## ESLint Rules

### Common Rules (Backend & Frontend)

- **TypeScript**: Recommended TypeScript rules enabled
- **Prettier Integration**: Prettier errors shown as ESLint errors
- **No Unused Variables**: Error on unused variables (except those prefixed with `_`)
- **Console Statements**: Warning for console.log (only console.warn and console.error allowed)
- **Prefer Const**: Error when let is used but variable is never reassigned
- **No Var**: Error when var is used instead of let/const

### Frontend-Specific Rules

- **React**: Recommended React rules enabled
- **React Hooks**: Rules of Hooks enforced
- **JSX**: React import not required in JSX files (React 17+ automatic runtime)
- **Prop Types**: Disabled (using TypeScript instead)

## Prettier Configuration

Both backend and frontend use consistent Prettier settings:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## IDE Integration

### VS Code

Install the following extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## CI/CD Integration

The linting and formatting checks should be integrated into the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Lint Code
  run: npm run lint

- name: Check Formatting
  run: npm run format:check
```

## Troubleshooting

### ESLint not finding config

Make sure you're using ESLint v9+ which supports the flat config format (`eslint.config.mjs`).

### Prettier conflicts with ESLint

The `eslint-config-prettier` package is included to disable ESLint rules that conflict with Prettier.

### Line ending issues (CRLF vs LF)

Prettier is configured to use LF line endings. On Windows, Git may convert line endings. Configure Git:

```bash
git config --global core.autocrlf false
```

## Maintenance

- Keep ESLint and Prettier dependencies up to date
- Review and adjust rules as the project evolves
- Ensure all team members use the same configuration
- Run linting and formatting checks before committing code

## References

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Plugin React](https://github.com/jsx-eslint/eslint-plugin-react)
