# WorkFlow AI

An AI-powered productivity workbench that helps users draft emails, summarise meetings, plan their day, research topics and chat with an assistant, all from one dashboard.

**Live demo:** https://workflow-ai-roan.vercel.app
**Source code:** https://github.com/Pablo-S19/workflow-ai-productivity

---

## 1. Project Overview

Knowledge workers spend a lot of time on repetitive written work: replying to emails, turning messy meeting notes into action items, deciding what to do first, and digesting long documents. WorkFlow AI brings these tasks together in one web application and uses Google's Gemini model to speed them up.

The app is designed around three principles:

- **One workspace, many tools.** Every tool shares the same dashboard, history and command palette.
- **Human in control.** Every AI output is labelled *"Human review required"*. The app never sends emails or changes files on the user's behalf; it only produces drafts.
- **Private by default.** Tasks, history and chat are stored in the user's own browser (localStorage). No user accounts or external database are used.

The Gemini API key is kept on the server in a small serverless function, so it is never exposed in the browser code.

---

## 2. Features Implemented

### AI tools

| Feature | What it does |
|---|---|
| **AI Command Center** | The user describes a task in plain language. The AI decides which tool fits best and opens it with the fields pre-filled. |
| **Smart Email Generator** | Produces a draft email from a purpose, audience, tone and optional key talking points. |
| **Meeting Notes Summariser** | Turns raw notes or a transcript into a structured brief: summary, decisions, action items (task, owner, deadline) and open questions. |
| **Task Planner and Eisenhower Matrix** | Users add tasks with a duration, urgency and importance. Tasks are sorted into the four quadrants (Do First, Schedule, Delegate, Eliminate/Defer), and the AI can generate a **daily or weekly time-blocked schedule**. |
| **Research Workspace** | Two modes: *Analyse Text* (paste a document and get an overview, key findings, important concepts and recommendations) and *Research Topic* (explore a topic from a question). |
| **Assistant Copilot (Chat)** | A conversational assistant with quick-ask prompts and shortcuts to turn replies into tasks or email drafts. |

### Workspace features

- **Dashboard overview** with estimated time saved, active tasks, saved artifacts, copilot exchanges, suggested next steps and a priority task queue.
- **Unified History:** every saved email, meeting brief, schedule and research report in one searchable, filterable list, with view, copy and delete options.
- **Prompt Library:** ready-made prompts grouped by category that can be copied or sent straight to the matching tool.
- **Productivity Insights:** usage statistics, tool usage breakdown and total focus time.
- **Command Palette:** quick navigation to any tool with `Ctrl/Cmd + K`.
- **Focus Mode:** a full-screen 25-minute Pomodoro timer linked to a task from the user's board; completed focus time feeds the insights page.
- **Settings and Governance:** shows application details, a Responsible AI charter, and a control to erase all local data.

### Engineering features

- **Secure API handling:** Gemini requests go through a serverless function (`api/gemini.js`), and the key is stored as an environment variable.
- **Automatic retries:** failed AI requests are retried up to three times with exponential back-off before an error is shown.
- **Local persistence:** tasks, history, chat and focus statistics survive page refreshes using `localStorage`.
- **Responsive design:** the layout adapts to phones, tablets and desktops (collapsible navigation drawer on smaller screens).
- **Type safety:** the whole application is written in TypeScript with strict type checking.
- **User feedback:** toast notifications, loading states and clear error messages.

---

## 3. Technologies and Tools Used

| Category | Technology |
|---|---|
| Front-end framework | [React](https://react.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Build tool | [Vite](https://vite.dev) |
| Styling | [Tailwind CSS](https://tailwindcss.com) (v4) |
| Icons | [Lucide React](https://lucide.dev) |
| AI model | [Google Gemini API](https://ai.google.dev) (`gemini-3.6-flash`) |
| Back-end | Vercel Serverless Function (Node.js), used as a secure proxy for the Gemini API |
| Data storage | Browser `localStorage` (no database) |
| Version control | Git and GitHub |
| Hosting and deployment | [Vercel](https://vercel.com) (automatic deploys from the `main` branch) |
| Development tools | Node.js, npm, Visual Studio Code |

### Project structure

```
WorkflowAi/
├── api/
│   └── gemini.js        # Serverless function that calls the Gemini API
├── src/
│   ├── App.tsx          # Application: all views, components and state
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS import
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 4. Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org) (current LTS version, 20 or newer) and npm
- [Git](https://git-scm.com)
- A free **Gemini API key** from [Google AI Studio](https://aistudio.google.com) (needed for the AI features)

### Option A: Use the live version

Open **https://workflow-ai-roan.vercel.app**. No installation is needed, and the AI features are already configured.

### Option B: Run locally with all AI features

1. **Clone the repository**

   ```bash
   git clone https://github.com/Pablo-S19/workflow-ai-productivity.git
   cd workflow-ai-productivity
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Add your API key.** Create a file named `.env` in the project root containing:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

   The key must not have quotes or spaces, and the `.env` file is excluded from Git so it is never uploaded.

4. **Install the Vercel CLI and log in** (one-time setup). The AI requests use the `/api/gemini` serverless function, which the Vercel CLI runs locally:

   ```bash
   npm install -g vercel
   vercel login
   ```

5. **Start the app**

   ```bash
   vercel dev
   ```

   Accept the default answers if prompted, then open the local address shown in the terminal (usually `http://localhost:3000`).

### Option C: Run the interface only

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`. All tools, the dashboard, task planner, history and focus mode work, but **AI generation will not**, because the `/api/gemini` function is not available with the plain Vite server. Use Option B for the full app.

### Build for production

```bash
npm run build
```

The build runs the TypeScript type check and then creates an optimised bundle in the `dist/` folder.

### Deploy to Vercel

1. Push the project to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import the repository. Vercel detects Vite automatically.
3. Before deploying, add an environment variable under **Settings → Environment Variables**:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Gemini API key
4. Click **Deploy**. Every later `git push` to `main` redeploys the site automatically.

If the variable is added after a deployment, redeploy from the **Deployments** tab so it takes effect.

---

## Notes

- AI-generated content can contain mistakes. Always review outputs before sending or sharing them.
- Data is saved only in the current browser. Clearing browser data, or using **Settings → Clear All Local Data**, removes it permanently.
- Gemini model names change over time. If AI requests start failing with a "model not found" error, update the model name in `api/gemini.js`.
