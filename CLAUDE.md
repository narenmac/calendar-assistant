# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app where users sign in with Google and schedule calendar meetings via natural-language chat. The user types "meet Sam Tuesday 3pm" and the system creates the Google Calendar event automatically.

## Architecture

```
Browser (React + Vite :5173)
  │  Google Sign-In → access_token (memory only, never localStorage)
  │  POST /schedule { text, access_token }
  │  GET  /events   [X-Google-Access-Token header]
  ▼
backend/ (Spring Boot :8080) — Orchestrator
  │  Spring AI ChatClient → Groq LLM (tool-calling loop)
  │  Spring AI MCP client (SSE) → discovers tools from gcal-mcp
  ▼
gcal-mcp/ (Spring Boot :8090) — Custom MCP Server
  │  Exposes: create-event, list-events (JSON schema via SSE)
  │  Accepts access_token per tool call — no stored credentials
  ▼
Google Calendar API
```

**Only the backend calls the LLM.** The gcal-mcp server never calls the LLM — it only executes tool calls using the user's per-request access token.

## Repository Structure

```
calendar-assistant/
├── backend/                  # Spring Boot orchestrator (MCP client + LLM)
│   ├── pom.xml               # Spring AI 1.0, spring-ai-mcp-client-spring-boot-starter
│   └── src/main/
│       ├── java/com/calendarassistant/backend/
│       │   ├── BackendApplication.java
│       │   ├── config/
│       │   │   ├── ChatConfig.java       # ChatClient bean
│       │   │   └── WebConfig.java        # CORS for localhost:5173
│       │   ├── controller/
│       │   │   └── ScheduleController.java  # POST /schedule, GET /events
│       │   ├── model/
│       │   │   ├── ScheduleRequest.java  # { text, access_token }
│       │   │   └── ScheduleResponse.java # { message }
│       │   └── service/
│       │       └── ScheduleService.java  # ChatClient + MCP tool loop
│       └── resources/application.yml
│
├── gcal-mcp/                 # Custom Spring Boot MCP server
│   ├── pom.xml               # spring-ai-mcp-server-webmvc-spring-boot-starter, Google Calendar SDK
│   └── src/main/
│       ├── java/com/calendarassistant/gcalmcp/
│       │   ├── GcalMcpApplication.java
│       │   ├── tools/
│       │   │   └── CalendarTools.java    # Google Calendar Java SDK calls
│       │   └── config/
│       │       └── McpToolConfig.java    # MCP tool registration via McpSyncServerCustomizer
│       └── resources/application.yml
│
├── frontend/                 # React + Vite + TypeScript
│   ├── index.html            # loads GIS <script> tag
│   ├── nginx.conf            # for Docker serve
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx           # auth gate + layout
│       ├── types.ts          # Message, UserInfo
│       ├── google.d.ts       # types for window.google GIS API
│       ├── api/client.ts     # scheduleRequest(), fetchEvents()
│       ├── hooks/
│       │   └── useGoogleAuth.ts    # token in React state only
│       └── components/
│           ├── SignIn.tsx          # landing screen with Google button
│           ├── Header.tsx          # username + sign out
│           ├── EventsPanel.tsx     # auto-refreshes after assistant replies
│           └── ChatPanel.tsx       # message list + input bar
│
├── docker-compose.yml        # runs all 3 services together
├── .env.example              # GROQ_API_KEY, GOOGLE_CLIENT_ID
└── .claude/
    ├── settings.json         # PostToolUse hook: nudges /review after edits
    ├── agents/
    │   ├── code-reviewer.md  # opus, read-only, auto-delegated on review requests
    │   ├── backend-dev.md    # sonnet, Spring Boot + Spring AI specialist
    │   └── frontend-dev.md   # haiku, React + GIS OAuth specialist
    └── skills/
        ├── code-review/SKILL.md        # /review — forks to code-reviewer agent
        └── summarize-changes/SKILL.md  # /changes — forks to Explore agent
```

## Key Design Decisions

**Custom MCP server instead of nspady/google-calendar-mcp:** Existing open-source MCP servers store one user's credentials in a file. A web app needs per-user tokens per request. `gcal-mcp` accepts `access_token` as a tool parameter and builds a fresh Google Calendar SDK client per call — no stored credentials.

**access_token flow:** Browser → React state (never localStorage) → POST body/header → Spring Boot → injected into system prompt → LLM includes it in tool call args → gcal-mcp uses it for that request only.

**Per-request MCP client (no singleton SSE):** `ScheduleService` creates a fresh `McpSyncClient` + `HttpClientSseClientTransport` for each `/schedule` and `/events` call, then closes it via try-with-resources. This avoids Azure load balancer idle timeouts (~4 min) that would drop a persistent SSE connection and cause `TimeoutException`. Spring Boot MCP autoconfiguration is disabled (`spring.ai.mcp.client.enabled: false`) — the client is managed entirely in `ScheduleService.createMcpClient()`.

**LLM tool-calling loop:** Spring AI `ChatClient` with `.toolCallbacks(new SyncMcpToolCallbackProvider(...))` handles the loop automatically — no manual loop implementation needed.

**Events panel refresh:** `App.tsx` increments `eventsRefreshKey` after every assistant reply, causing `EventsPanel` to re-fetch from `GET /events`.

## Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # dev server on :5173
npm run build        # production build
```

### Backend
```bash
# GROQ_API_KEY must be exported in the same terminal session
export GROQ_API_KEY=gsk_...
cd backend
./mvnw spring-boot:run    # dev run on :8080
./mvnw package            # build JAR
./mvnw test
```

### gcal-mcp
```bash
cd gcal-mcp
./mvnw spring-boot:run    # dev run on :8090
./mvnw package
./mvnw test
```

### Docker (full stack)
```bash
cp .env.example .env      # fill in GROQ_API_KEY and GOOGLE_CLIENT_ID
docker compose up --build
# frontend: http://localhost:5173
# backend:  http://localhost:8080
# gcal-mcp: http://localhost:8090
```

### Local dev startup order
1. Start gcal-mcp first (`./mvnw spring-boot:run` in `gcal-mcp/`)
2. Start backend (`./mvnw spring-boot:run` in `backend/`)
3. Start frontend (`npm run dev` in `frontend/`)

**Restarting gcal-mcp is safe** — the backend creates a fresh MCP client per request, so there is no stale connection to worry about.

## Environment Variables

| Variable | Where used | Description |
|---|---|---|
| `GROQ_API_KEY` | backend (shell env) | Groq API key (free tier, llama-3.3-70b-versatile) — must be exported before running backend |
| `GOOGLE_CLIENT_ID` | backend + frontend | OAuth 2.0 client ID from Google Cloud Console |
| `GCAL_MCP_URL` | backend | URL of the gcal-mcp service (default: `http://localhost:8090`) |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env` | Same client ID, exposed to Vite — app sign-in button does nothing without this |
| `VITE_BACKEND_URL` | `frontend/.env` | Backend URL (default: `http://localhost:8080`) |

Frontend `.env` example (`frontend/.env`):
```
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_BACKEND_URL=http://localhost:8080
```

## Backend API

| Endpoint | Body / Headers | Description |
|---|---|---|
| `POST /schedule` | `{ "text": "...", "access_token": "ya29..." }` | NL text → LLM agent loop → `{ "message": "..." }` |
| `GET /events` | Header: `X-Google-Access-Token: ya29...` | List upcoming events → `{ "message": "..." }` |

## MCP Tools (gcal-mcp)

SSE endpoint: `GET http://gcal-mcp:8090/sse`
Message endpoint: `POST http://gcal-mcp:8090/mcp/message`

| Tool | Required params | Optional params |
|---|---|---|
| `create-event` | `summary`, `start` (ISO-8601), `end` (ISO-8601), `access_token` | `description` |
| `list-events` | `access_token` | `max_results` (default 10), `time_min` (ISO-8601, default now) |

**Important:** `maxResults` in `CalendarTools.java` is typed as `String` (not `Integer`) because Groq's llama model passes integer arguments as JSON strings. The value is parsed internally.

## LLM Configuration

Default: **Groq** (`llama-3.3-70b-versatile`) via OpenAI-compatible endpoint in `backend/src/main/resources/application.yml`.

To switch to Gemini, replace `spring-ai-openai-spring-boot-starter` in `backend/pom.xml` with `spring-ai-vertex-ai-gemini-spring-boot-starter` and update `application.yml` accordingly.

## Claude Code Agents

| Agent | Model | Use for |
|---|---|---|
| `code-reviewer` | opus | Code review — invoke via `/review` or ask "review my code" |
| `backend-dev` | sonnet | Spring Boot, Spring AI MCP client, Groq/Gemini tool-calling |
| `frontend-dev` | haiku | React, Vite, Google Identity Services OAuth |

Use the built-in `Explore` agent for all codebase searches to keep the main context clean.

## Azure Deployment

Resources are provisioned via Terraform in `terraform/` and images are hosted on Docker Hub under `naren433/`.

| Container App | Image | Ingress |
|---|---|---|
| `gcal-mcp` | `naren433/cal-gcal-mcp` | Internal only (`:8090`) |
| `backend` | `naren433/cal-backend` | External (`:8080`) |
| `frontend` | `naren433/cal-frontend` | External (`:80`) |

**One-time infra setup:**
```bash
cd terraform
terraform init
terraform apply          # provisions RG, Log Analytics, Container Apps environment, 3 apps
```

**Manual redeploy (without CI/CD):**
```bash
docker build --platform linux/amd64 -t naren433/cal-backend:latest ./backend
docker push naren433/cal-backend:latest
az containerapp update --name backend --resource-group calendar-assistant-rg \
  --image naren433/cal-backend:latest --revision-suffix v<N>
```

`GCAL_MCP_URL=http://gcal-mcp` inside Azure — Container Apps environment DNS resolves service names automatically.

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci-cd.yml` — triggers on every push to `main`.

**Jobs:**
1. `build-and-push` — builds all 3 images for `linux/amd64`, pushes to Docker Hub with `:latest` + short SHA tag
2. `deploy` — logs into Azure, runs `az containerapp update` for each service with the SHA-tagged image

**Required GitHub Secrets:**

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `naren433` |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AZURE_CREDENTIALS` | Service principal JSON (`az ad sp create-for-rbac --role contributor`) |
| `GOOGLE_CLIENT_ID` | GCP OAuth client ID (baked into frontend image at build time) |
| `BACKEND_URL` | Full Azure URL of the backend Container App (baked into frontend image) |

## Google Cloud Setup (prerequisite)

1. Create a Google Cloud project → enable **Google Calendar API**
2. OAuth consent screen → External → add your email as test user
3. Scope: `https://www.googleapis.com/auth/calendar.events`
4. Create **OAuth 2.0 Client ID** → Web app type
   - Authorised JavaScript origins: `http://localhost:5173`
   - Authorised redirect URIs: `http://localhost:5173`
5. Copy the Client ID → set as `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`

