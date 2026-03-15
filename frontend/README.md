# MERN Education Platform - Frontend

React frontend application for the MERN Education Platform built with TypeScript and Vite.

## Tech Stack

- **React 18.3.1** - UI library
- **TypeScript 5.5.3** - Type safety
- **Vite 5.4.1** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Prerequisites

- Node.js 18+ and npm

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm test
```

### Code Quality

Lint code:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx          # Application entry point
│   ├── App.tsx           # Root component
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Node
├── eslint.config.mjs     # ESLint configuration
└── package.json          # Dependencies and scripts
```

## TypeScript Configuration

The project uses TypeScript in strict mode with the following key settings:

- **Target**: ES2020
- **Module**: ESNext
- **JSX**: react-jsx
- **Strict mode**: Enabled
- **No unused locals/parameters**: Enabled
- **No fallthrough cases**: Enabled

## Vite Configuration

- **Dev server port**: 3000
- **API proxy**: `/api` → `http://localhost:5000`
- **Build output**: `dist/`
- **Source maps**: Enabled

## Next Steps

The following features will be added in subsequent tasks:

- Redux Toolkit for state management
- React Router for routing
- Material-UI component library
- Authentication components
- Course management UI
- Student and instructor dashboards
