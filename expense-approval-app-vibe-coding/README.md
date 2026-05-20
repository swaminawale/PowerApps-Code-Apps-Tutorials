# PACA Approval System

A Power Apps Code App (React + TypeScript + Vite) for managing expense reimbursement approvals via SharePoint and Outlook.

---

## SharePoint List Structure

**List:** `Expense Reimbursement`
**Site:** `https://<YOUR_TENANT>.sharepoint.com/sites/<YOUR_SITE>/Lists/Expense%20Reimbursement/AllItems.aspx`

| Column | Type | Options / Notes |
|---|---|---|
| Title | Single line of text | |
| Detail | Single line of text | |
| Expense Date | Date and Time | |
| Amount | Number | |
| Approval Status | Choice | `Auto approved`, `Approved`, `Pending`, `Rejected` |
| Approver Comment | Single line of text | |
| Approver | Person or Group | |
| Category | Choice | `Travel`, `Meals & Entertainment`, `Office & Supplies`, `Technology & Software`, `Client & Business Development`, `Health & Wellness`, `Miscellaneous` |

---

## Data Sources & Connectors

Three connectors are required. Add them using the `pac code add-data-source` command after replacing the placeholders with your own environment and connection IDs.

You can find your connection IDs in the Power Apps maker portal under:
`https://make.powerapps.com/environments/<YOUR_ENVIRONMENT_ID>/connections`

### 1. SharePoint Online

```
pac code add-data-source -a shared_sharepointonline -c <YOUR_SHAREPOINT_CONNECTION_ID>
```

### 2. Office 365 Outlook

```
pac code add-data-source -a shared_office365 -c <YOUR_OUTLOOK_CONNECTION_ID>
```

### 3. Office 365 Users

```
pac code add-data-source -a shared_office365users -c <YOUR_OFFICE365_USERS_CONNECTION_ID>
```

---

## Project Setup

This project uses React + TypeScript + Vite, preconfigured for Power Apps Code Apps.

### Install dependencies

```
npm install
```

### Run locally

```
npm run dev
```

### Build

```
npm run build
```

---

## ESLint Configuration

For production apps, enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // or for stricter rules:
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also add [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom):

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### Vite Plugins

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) — uses Babel (or oxc via rolldown-vite) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) — uses SWC for Fast Refresh

### React Compiler

The React Compiler is not enabled by default due to its impact on dev & build performance. To enable it, see the [React Compiler installation docs](https://react.dev/learn/react-compiler/installation).
