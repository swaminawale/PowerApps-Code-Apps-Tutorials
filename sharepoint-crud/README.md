# SharePoint CRUD

A React application for managing SharePoint list items with create, read, update, and delete operations.

## Overview

This project provides a comprehensive interface for managing SharePoint invoices, including item creation, editing, deletion, user assignments, approval workflows, and file attachments.

## Key Features

- Create, read, update, and delete SharePoint list items
- User assignment and approval management
- Attachment handling for list items
- Status tracking and filtering
- Office 365 user integration
- Dialog-based item editing
- Real-time data synchronization

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Linting

```bash
npm lint
```

## Technology Stack

- React 19
- TypeScript 5.9
- Vite 7
- Fluent UI components
- SharePoint REST API
- Microsoft Graph API integration
- Power Apps integration
  // eslint.config.js
  import reactX from 'eslint-plugin-react-x'
  import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
