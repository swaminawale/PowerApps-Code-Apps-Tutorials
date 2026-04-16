# Office 365 Users Connector

A React application that displays Office 365 user profiles and directory information using Microsoft Graph API.

## Overview

This project provides a user interface to search for and display Office 365 user profiles, including details like job title, department, contact information, and organizational hierarchy.

## Key Features

- Search Office 365 users
- Display user profile cards with Fluent UI components
- Show user details including job title, department, and contact info
- Support for manager and direct reports information
- Real-time user data retrieval

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
