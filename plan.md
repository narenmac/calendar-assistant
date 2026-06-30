# Calendar Assistant — Implementation Plan

## Problem
Build a web app to schedule meetings on **Google Calendar** via natural-language input. The user signs in with a **Google account**, types "meet Sam Tuesday 3pm"; an LLM agent uses calendar **tools from a Google Calendar MCP server** to create the event and read the schedule.

## Approach
- **Frontend:** React (Vite) — Google sign-in + NL query box + schedule view
- **Backend:** Spring Boot (Java) — REST API + **LLM agent (MCP client)** calling Google Calendar tools
- **Calendar access:** an **existing open-source Google Calendar MCP server** (`nspady/google-calendar-mcp` or `@cocal/google-calendar-mcp`; an official Google Calendar MCP server also exists) — run via `npx`/Docker. **No custom MCP server needed.** (Fallback only if none fit: build a small Spring Boot MCP server — not required, since mature ones exist.)
- **LLM:** Free testing API (Gemini free tier or Groq) with tool/function calling
- **Conflict detection:** deferred (future enhancement)

## What is the Google Calendar MCP server? — and do we write our own?
**We do NOT write our own MCP server** — a mature one already exists.
- **Use an existing open-source Google Calendar MCP server** (`nspady/google-calendar-mcp`, `@cocal/google-calendar-mcp`) — run via `npx`/Docker. Supports list/create/update/delete events through Google OAuth. No custom MCP code.
- **What an MCP server is:** a server implementing the **Model Context Protocol** that exposes Google Calendar operations as standardized **tools** an AI agent calls via `tools/list` / `tools/call`. It holds the Google OAuth token and forwards to the Google Calendar API. A universal adapter: the LLM speaks "MCP tools," the server translates to real Calendar API calls.
- **Fallback (not needed):** if no existing server fit our needs, we'd build a second Spring Boot app acting as an MCP server. Since mature servers exist, we skip this.

## Google Cloud / login setup
1. Create a **Google Cloud project**; enable the **Google Calendar API**.
2. Configure the **OAuth consent screen** (External), add your email as a **test user**.
3. Scopes: `https://www.googleapis.com/auth/calendar.events` (and `.../calendar` if needed).
4. Create **OAuth 2.0 Client ID** — Web app type, redirect URI `http://localhost:5173`; download client credentials.

## Local login (how you sign in when testing locally / in Docker)
Google OAuth happens **in the browser**, even when containers run the app:
1. React uses **Google Identity Services / OAuth** with redirect URI `http://localhost:5173`.
2. User clicks "Sign in with Google" → consents at Google's screen → app receives an **access token** for the `calendar.events` scope.
3. React sends the token to Spring Boot → Google Calendar MCP server → Google Calendar API.

Containers never store your Google password — only short-lived tokens flow. A refresh token avoids repeated prompts.

## Docker setup (for local testing)
Each layer is containerized; `docker-compose` runs them together:
- **frontend** — React build served by nginx on `localhost:5173`
- **backend** — Spring Boot JAR on `localhost:8080`; env: LLM key + Google client id
- **gcal-mcp** — Google Calendar MCP server container (with mounted OAuth credentials)
- **.env** — `GEMINI_API_KEY` / `GROQ_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_OAUTH_CREDENTIALS`
- `docker compose up` brings up the whole stack for end-to-end testing.

## Architecture
```
 ┌──────────────────────────┐
 │        FRONTEND          │
 │  React + Vite            │
 │  • Sign in with Google   │
 │  • NL query box          │
 │  • schedule view         │
 └─────────────┬────────────┘
   (1) NL text │ ▲ (8) confirmation + schedule
       + token │ │
               ▼ │
 ┌──────────────────────────┐  (2) text + tool schemas  ┌──────────────────────────┐
 │        BACKEND           │ ─────────────────────────►│          LLM             │
 │  Spring Boot ORCHESTRATOR│                           │     Gemini / Groq        │
 │  (Spring AI MCP client)  │ ◄─────────────────────────│  • picks tool + args     │
 │  • holds Google token    │  (3) tool call: name+args │  • or asks clarification │
 │  • runs tool-call loop    │        ▲                  └──────────────────────────┘
 └───┬──────────────────▲───┘        │ (7) result → next step / final (loop, by backend only)
     │ (4) MCP          │ (5) tool result
     │ tools/call       │
     ▼                  │
 ┌──────────────────────────┐
 │      TOOL LAYER          │
 │  Google Calendar MCP     │
 │  • create-event          │
 │  • list-events           │
 └─────────────┬────────────┘
   (6) HTTPS   │ ▲ events JSON
               ▼ │
 ┌──────────────────────────┐
 │     CALENDAR / DATA      │
 │   Google Calendar API    │
 └──────────────────────────┘
```
**Only the Spring Boot orchestrator talks to the LLM** (arrows 2, 3, 7). The Google Calendar MCP server and Calendar API **never** call the LLM — they only return data back up to Spring Boot (5, 6).

## High-Level Flow
1. User signs in with Google (browser OAuth)
2. Types: "meet Sam Tuesday 3pm"
3. Frontend → backend (text + token)
4. Backend sends prompt + MCP tool schemas to LLM
5. LLM picks create-event with parsed args → backend invokes via Google Calendar MCP → event created
   - If a required arg is missing/ambiguous: backend asks the user (clarification loop) before creating
6. LLM picks list-events for schedule → returns results
7. Frontend confirms + renders schedule

## Why both LLM and MCP server?
- **LLM = the brain.** Converts free text into a decision: which tool + parsed args. Cannot access your calendar.
- **MCP server = the hands.** Exposes calendar tools and calls Google Calendar. Cannot understand natural language.
- LLM decides → MCP executes. Together = NL scheduling.

## Why does the Spring Boot agent call the LLM?
The backend is the **orchestrator**: frontend sends raw text → backend forwards it to the LLM for intent + args → LLM says "call create-event with X" → backend executes via the MCP server and loops back with results. Backend also serves the REST API, holds the token securely, and returns clean results.

## How does the LLM know the tools and emit a tool call?
1. **Discovery** — backend calls the MCP server's `tools/list` → gets each tool's name, description, input JSON Schema.
2. **Advertising** — backend passes schemas into every LLM request via the model's `tools`/function-calling param.
3. **Selection** — LLM replies with a structured tool call `{"name":"create-event","arguments":{...}}` matching the schema.
4. **Execution** — backend validates and forwards to `tools/call`; results loop back if needed.

## How does the LLM pick one tool when several could match?
Tool descriptions drive selection; intent verbs map to tools (meet/book → create; show/list → read); ties broken by confidence or the clarification loop; minimal non-overlapping tool set reduces ambiguity.

## What if an argument is missing?
Defaults for common gaps (no duration → 30 min); clarification loop asks the user for missing required fields; schema validation guard blocks calling the API with incomplete args.

## Todos
1. **gcloud-setup** — Google Cloud project, enable Calendar API, OAuth consent + client id, scopes
2. **gcal-mcp-setup** — Run existing Google Calendar MCP server (nspady/@cocal) via npx/Docker; auth; verify create/list tools
3. **springboot-init** — Scaffold Spring Boot + Spring AI (MCP client + LLM)
4. **mcp-client-agent** — Connect to Google Calendar MCP, list tools, wire LLM tool-calling loop
5. **schedule-controller** — POST /schedule (agent run), GET /events
6. **react-init** — Vite app, Google sign-in, query + schedule view
7. **wire-frontend-backend** — Token passthrough, render, errors
8. **dockerize** — Dockerfiles + docker-compose + .env; `docker compose up` for E2E testing
9. **docs-run** — README setup/run (local + Docker)

## Notes
- Existing Google Calendar MCP servers support create/update/delete + recurring events + token refresh.
- Free LLM: Gemini `1.5-flash` or Groq llama-3.x; must support function/tool calling.
- Future: free-busy conflict detection, recurring events, attendee invites.
