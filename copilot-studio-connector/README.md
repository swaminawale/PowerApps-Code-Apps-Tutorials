# Copilot Studio Connector

A React application that integrates Microsoft Copilot Studio to enable conversational interactions with AI agents.

## Overview

This project provides a chat interface that connects to a Microsoft Copilot Studio agent, allowing users to send messages and receive AI-powered responses.

## Key Features

- Chat-based interface with message history
- Integration with Microsoft Copilot Studio service
- Real-time message loading state
- Error handling and conversation management
- Built with React and TypeScript

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
