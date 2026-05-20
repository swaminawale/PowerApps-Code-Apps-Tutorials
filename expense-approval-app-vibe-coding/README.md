# Expense Approval System

A Power Apps Code App (React + TypeScript + Vite) for managing expense reimbursement approvals via SharePoint and Outlook.

---

## ⚠️ Important :Read Before Using

### Source Code Only :No Dependencies Included

**This repository contains only the source code.** Node modules, build artifacts, and Power Apps package files are intentionally excluded to avoid environment conflicts.

To use this project, you must:

1. **Create a new Power Apps Code App project from scratch** using the PAC CLI:
   ```
   pac code init --language TypeScript
   ```
2. **Add the required data sources** :see [Data Sources & Connectors](#data-sources--connectors) below.
3. **Copy the source files and folder structure** from this repository into your newly created project.

> This ensures your local environment settings and connection IDs do not conflict with the original developer's setup.

---

### 🤖 Developed Using GitHub Copilot and Vibe Coding

This project was built with the assistance of **GitHub Copilot** and **Vibe Coding** techniques.

> **Warning:** Always review and fully understand every line of code before deploying to production.
> Do **not** rely solely on AI-generated or vibe-coded output, cross-check the logic, validate behaviour, and ensure the code meets your requirements.

---

## SharePoint List Structure

**List:** `Expense Reimbursement`
**Site:** `https://<YOUR_TENANT>.sharepoint.com/sites/<YOUR_SITE>/Lists/Expense%20Reimbursement/AllItems.aspx`

| Column           | Type                | Options / Notes                                                                                                                                        |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title            | Single line of text |                                                                                                                                                        |
| Detail           | Single line of text |                                                                                                                                                        |
| Expense Date     | Date and Time       |                                                                                                                                                        |
| Amount           | Number              |                                                                                                                                                        |
| Approval Status  | Choice              | `Auto approved`, `Approved`, `Pending`, `Rejected`                                                                                                     |
| Approver Comment | Single line of text |                                                                                                                                                        |
| Approver         | Person or Group     |                                                                                                                                                        |
| Category         | Choice              | `Travel`, `Meals & Entertainment`, `Office & Supplies`, `Technology & Software`, `Client & Business Development`, `Health & Wellness`, `Miscellaneous` |

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

### Vite Plugins

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) :uses Babel (or oxc via rolldown-vite) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) :uses SWC for Fast Refresh

### React Compiler

The React Compiler is not enabled by default due to its impact on dev & build performance. To enable it, see the [React Compiler installation docs](https://react.dev/learn/react-compiler/installation).
