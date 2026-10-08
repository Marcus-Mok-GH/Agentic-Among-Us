> **☕ Support my work**
>
> If this project has helped you, consider supporting my work on [**Buy Me a Coffee**](https://buymeacoffee.com/j6oiubzfnh).

# Agentic Among Us

⭐ **If you find this project interesting, please leave a star!** It keeps me motivated to continue developing this AI simulation. ⭐

An AI-powered simulation of **Among Us** where autonomous LLM-driven agents play as Crewmates and Impostors. Watch AI agents navigate The Skeld, complete tasks, form alliances, spread rumors, and eliminate each other—all powered by large language models.

## Screenshots

![Simulation Overview](images/img1.png)

![Agent Interactions](images/img21.png)

![Ghost Mode](images/img32.png)

## What Is This?

This project creates a fully autonomous Among Us simulation where:
- **8 AI agents** (6 Crewmates, 2 Impostors) make real-time decisions using LLM reasoning
- Agents have **memory systems** tracking observations, suspicions, and conversations
- Natural **speech and social interactions** between agents
- Full **pathfinding and collision avoidance** on The Skeld map
- Real-time **visualization** via React + PixiJS client

## Currently Implemented

| Feature | Status | Details |
|---------|--------|---------|
| **Movement & Pathfinding** | ✅ Complete | A* on visibility graph, steering behaviors, collision avoidance |
| **Navigation Mesh** | ✅ Complete | Full Skeld map with walkable zones, rooms, and hallways |
| **Task System** | ✅ Complete | Task assignment, navigation, execution with realistic durations |
| **Task Progress Bar** | ✅ Complete | Smooth animated progress bar while performing tasks |
| **Vision System** | ✅ Complete | Agents see only within configurable vision radius |
| **AI Decision Making** | ✅ Complete | LLM-powered goals: tasks, wandering, following, avoiding, confronting |
| **Agent Memory** | ✅ Complete | Timestamped observations, suspicion tracking, conversation history |
| **Speech System** | ✅ Complete | Agents speak to nearby players (rectangular bubble, toggleable) |
| **Hearing System** | ✅ Complete | Visual ear icon with directional sound waves when agents hear speech |
| **Social Actions** | ✅ Complete | Buddy up, follow, avoid, confront, spread rumors, defend self |
| **Thought System** | ✅ Complete | Internal reasoning shown as cloud bubbles (toggleable) |
| **Thinking Indicator** | ✅ Complete | Animated "..." dots shown during LLM calls (toggleable) |
| **Kill System** | ✅ Complete | Impostors can kill crewmates with cooldowns, range checks, witnesses |
| **Body Discovery** | ✅ Complete | Agents witness bodies, choose to report/flee, phase transitions |
| **Vent System** | ✅ Complete | Full vent mechanics: entry/exit, travel, cooldowns, witness detection |
| **Sabotage System** | ✅ Complete | Lights, Reactor, O2, Comms sabotages with fix mechanics |
| **Ghost Mode** | ✅ Complete | Dead players become ghosts (wall-pass, unlimited vision, can finish tasks) |
| **Win Conditions** | ✅ Complete | Task completion, impostor parity, time limit (10 min) |
| **Game Timer** | ✅ Complete | Real-time countdown with color-coded warnings |
| **Player Count** | ✅ Complete | Live "👥 X/8 alive" display |
| **Pause/Resume** | ✅ Complete | Pause simulation from UI with server-side support |
| **God Mode** | ✅ Complete | Divine control: direct commands, whispers, persistent principles |
| **LLM Timeline** | ✅ Complete | Filter by agent/goal, export JSON, clear events |
| **WebSocket Streaming** | ✅ Complete | Real-time state sync with delta compression |
| **PixiJS Visualization** | ✅ Complete | Map, agents, vision cones, paths, speech bubbles, info panels |
| **Logging System** | ✅ Complete | Structured JSON logging with color-coded console output |
| **Agent Personalities** | ✅ Complete | 12 unique personalities affecting speech and behavior |

## Planned / Not Yet Implemented

| Feature | Status |
|---------|--------|
| Emergency Meetings | Not implemented |
| Discussion & Voting | Not implemented |
| Ejection Mechanics | Not implemented |
| Door System | Not implemented |
| Security Cameras | Not implemented |
| Admin Table | Not implemented |

---

## Prerequisites

- **Node.js 22 LTS** or newer
- **npm 10+**
- **Pollinations AI API key**: required for AI agent decisions ([create a key](https://enter.pollinations.ai/keys))

## AI Provider Setup

The simulation sends server-side, OpenAI-compatible chat-completion requests to Pollinations. Configure the provider before starting the server:

```bash
cp .env.example .env
# Edit .env and set POLLINATIONS_API_KEY to your own key.
```

The server automatically loads the repository-root `.env` in development and when started with `npm --workspace @agentrunner/server run start`. Each agent is assigned one stable, randomly selected model from this default pool: `openai/gpt-6-luna`, `nvidia/nemotron-3.5-lightning`, `minimax/minimax-m3`, `deepseek/deepseek-v4.1-flash`, and `mistralai/mistral-large-3`. Set `POLLINATIONS_MODELS` to override the comma-separated pool, or `POLLINATIONS_MODEL` to pin all agents to one model. The base URL defaults to `https://gen.pollinations.ai` and may be overridden with `POLLINATIONS_BASE_URL`.

Keep the key in the server environment—never expose it through a `VITE_` variable or browser code. The older [`docker-manage/LLM/`](./docker-manage/LLM/README.md) scripts remain available for managing a standalone llama.cpp server, but are no longer needed by the simulation's default AI backend.

## Installation

```bash
npm install
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start both Fastify server (port 4000) and Vite client (port 5173) |
| `npm run dev:server` | Run only the server workspace (`@agentrunner/server`) |
| `npm run dev:client` | Run only the React client |
| `npm --workspace @agentrunner/server run probe` | Execute a headless simulation run to verify the engine |

## Build & Lint

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check shared/server, then build the client bundle |
| `npm run lint` | Lint client, server, and shared TypeScript sources |

## Tests & Smoke Checks

| Command | Description |
|---------|-------------|
| `npm test` | Run the Vitest suite across shared/server packages |
| `npm run test:watch` | Watch mode for the test suite during development |
| `npm run smoke:test` | Launch full stack, poll `/health`, then shut down when ready |

---

## Manual QA Checklist

1. Run `npm run dev:all` to start the Fastify simulation server (port 4000) and Vite client (port 5173).
2. Open http://localhost:5173 in a Chromium-based browser and confirm:
   - Agents render on The Skeld map and continue moving for at least 30 seconds.
   - The Agent Activity panel updates without stalling (watch for frozen timestamps).
3. Open the browser devtools console and ensure the WebSocket handshake logs `connected` and periodic heartbeats from `SimulationClient`.
4. Simulate a dropped connection:
   - In devtools, toggle the Network tab to `Offline` for ~5 seconds, then return to `Online`.
   - Verify the console logs a `stale` state followed by a `connected` state after the connection recovers.
5. With the stack still running, open http://localhost:4000/analytics/metrics to view tick timing averages.
6. When finished, stop `npm run dev:all` with `Ctrl+C`.

---

## Architecture

### Workspace Layout

```
agentrunner/
├── server/           # Fastify WebSocket server + simulation engine
│   └── src/
│       ├── ai/              # LLM integration, decision prompts
│       ├── simulation/      # GameSimulation, SimulationLoop
│       └── observability/   # Telemetry, state history
├── shared/           # TypeScript contracts shared between client/server
│   ├── engine/              # AI agents, pathfinding, movement, state machines
│   ├── types/               # Game types, protocol types, simulation types
│   └── data/                # Map data (The Skeld polygons, tasks, vents)
├── src/              # React + PixiJS client (rendering only)
│   ├── components/          # AgentInfoPanel, UI elements
│   └── rendering/           # PixiJS renderers for map, agents, vision, etc.
└── maps/             # Map editor tools and raw map data
```

### Tech Stack

- **Server**: Fastify, WebSocket, TypeScript
- **Client**: React 19, PixiJS 8, Zustand
- **AI**: Pollinations AI chat completions (server-side API key)
- **Build**: Vite, Vitest, ESLint, TypeScript 5.9

### WebSocket Protocol

| Message Type | Direction | Description |
|--------------|-----------|-------------|
| `handshake` | Server → Client | Protocol version, server time |
| `snapshot` | Server → Client | Full world state (on connect) |
| `state-update` | Server → Client | Delta updates (movement, AI state) |
| `heartbeat` | Bidirectional | Keep-alive with tick count |

### AI Agent Decision Types

Agents can pursue these goals based on LLM reasoning:
- `GO_TO_TASK` — Navigate to assigned task
- `WANDER` — Random exploration
- `FOLLOW_AGENT` — Tail another agent
- `AVOID_AGENT` — Stay away from someone
- `BUDDY_UP` — Team up for safety
- `CONFRONT` — Question suspicious behavior
- `SPREAD_RUMOR` — Share suspicions with others
- `DEFEND_SELF` — Provide alibis when accused
- `SPEAK` — General conversation
- `IDLE` — Wait and observe

**Impostor-Only Goals:**
- `KILL` — Eliminate a crewmate
- `HUNT` — Seek isolated targets
- `SELF_REPORT` — Report own kill
- `FLEE_BODY` — Escape after kill
- `CREATE_ALIBI` — Position for cover

### Agent Memory System

Each AI agent maintains a persistent memory that influences their decisions. The memory system provides **timestamped context** to help agents reason about past events:

#### Memory Components
- **Recent Timeline**: Last 15 events (observations + conversations + accusations) merged chronologically with relative timestamps
- **Last Known Locations**: Where each player was last seen (e.g., "Red: Cafeteria (2m ago, walking)")
- **Suspicion Levels**: Tracked per-player with emoji indicators (🔴 VERY SUS, 🟠 Suspicious, 🟡 Slightly sus, 🟢 Trusted)
- **Alibis Claimed**: What alibis players have stated, with verification status

#### Example Memory Context in LLM Prompt
```
=== RECENT HISTORY (what you remember) ===
[2m ago] in Cafeteria Saw Red in Cafeteria (walking)
[1m ago] in Admin Blue said: "I was doing wires in Electrical"
[45s ago] in Electrical Saw Yellow doing task
[30s ago] ⚠️ Green accused Yellow: "saw you near the body"
[just now] in Weapons Pink said: "I finished asteroids"

=== LAST KNOWN LOCATIONS ===
- Red: Cafeteria (2m ago, walking)
- Blue: Admin (1m ago, walking)
- Yellow: Electrical (45s ago, doing task)

=== YOUR SUSPICIONS ===
- Yellow: 🟠 Suspicious (68%) - near body when found; acting nervous
- Green: 🟢 Trusted (35%)
```

This context is included in every LLM decision prompt, giving agents the information they need to make realistic, informed decisions.

---

## REST Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /analytics/metrics` | Tick timing, delta sizes, agent counts |
| `GET /analytics/state-history` | Rolling buffer of past states for debugging |

---

## Related Documentation

- [`agents.md`](./agents.md) — Complete Among Us game mechanics reference for AI agents
- [`docker-manage/README.md`](./docker-manage/README.md) — LLM server deployment and management
- [`docker-manage/agents.md`](./docker-manage/agents.md) — Docker infrastructure documentation
- [`upgrade.md`](./upgrade.md) — Migration checklist and progress
- [`maps/README.md`](./maps/README.md) — Map editor documentation

---

## License

Private project – see repository for details.
