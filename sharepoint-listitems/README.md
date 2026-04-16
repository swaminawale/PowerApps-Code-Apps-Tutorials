# SharePoint List Items

A React application for fetching and displaying SharePoint list items.

## Overview

This project provides a simple interface to view and interact with SharePoint list items, demonstrating basic read operations and data display.

## Key Features

- Fetch SharePoint list items
- Display list items in a user-friendly interface
- SharePoint data integration
- Real-time data retrieval

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
- SharePoint REST API
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
