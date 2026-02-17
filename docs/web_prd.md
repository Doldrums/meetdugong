# PRD — Split Admin Panel with Embedded Player (HoloBox Web Runtime) — MVP v0.1

## 1. Summary

Build a single-page web Admin Panel intended for a single operator (no auth).  
The page is split 50/50:

- **Left (50%)**: Embedded **Player** view (the same web runtime that will be opened on HoloBox) showing:
  - clip-based character video playback
  - React overlays rendered on top (cards, subtitles, UI elements)
- **Right (50%)**: **Admin/Debug** panel:
  - manual controls (FSM triggers, overlay triggers)
  - real-time logs (events, state transitions, errors)
  - status indicators

**Key assumption:** HoloBox supports a modern browser reliably.

This MVP does **not** require server-side compositing or streaming. Rendering happens client-side in the browser.

---

## 2. Goals

### Primary Goals
1. Provide a unified operator console to:
   - preview the exact Player output that will run on HoloBox
   - control playback states and overlays
   - observe system state and debug events in real time
2. Keep setup simple: deploy as a web app, open the URL on HoloBox.

### Secondary Goals
- Ensure low perceived latency between control actions and visual changes.
- Make the Player resilient (no blank screen during clip switching, auto recovery).

---

## 3. Non-Goals (Out of Scope)
- Authentication / user management
- Multi-operator concurrency
- Full clip upload/management UI (can be added later)
- Visual FSM editor
- Analytics dashboards
- Voice capture / CV / presence detection (can be simulated by events)

---

## 4. Product Structure

### 4.1 Routes
- `/player` — Fullscreen Player (to run on HoloBox)
- `/admin` — Split Admin Panel:
  - left: embedded Player preview
  - right: admin/debug UI

### 4.2 Layout Requirement (Strict)
`/admin` must be a single screen with a fixed 50/50 split:
⸻

|                   |                                   |
|    PLAYER PREVIEW |      ADMIN + DEBUG PANEL          |
|    (embedded)     |      (controls + logs)            |

Player preview is implemented as:
- preferred: `<iframe src="/player?mode=preview">`
- alternative: render Player component directly inside `/admin` (shared code)

---

## 5. Player Requirements (`/player`)

### 5.1 Core Functionality
- Plays the character as a **sequence of pre-recorded clips** (mp4/webm).
- Supports **bridges** for smooth transitions between FSM states.
- Renders **React overlays above the video** (z-index layer).

### 5.2 Video Playback Model (MVP)
Use a reliable clip-switching strategy:
- **Dual video element A/B**:
  - while A plays current clip, B preloads next clip
  - swap visibility at transition boundary (instant cut or short fade)
- Bridges are used to hide micro-gaps and preserve continuity.

### 5.3 Overlay Layer (React)
Must support:
- Subtitles / single-line captions
- Card overlay (title, image, price, CTA, QR)
- Simple shapes/markers (arrow, highlight box)
- Clear-all / hide-by-id

Overlays are driven by real-time events (WebSocket), and must update without reloading the page.

### 5.4 Player Status Overlay (Debug HUD)
Optional but recommended for MVP:
- current FSM state
- current clip ID
- next clip queued
- connection status (WS connected/disconnected)

### 5.5 Resilience
- Auto-reconnect WebSocket
- If a clip fails to load:
  - log error
  - fallback to IDLE loop
- Avoid black frames:
  - keep last frame visible until next clip is ready (or use bridge)

---

## 6. Admin Panel Requirements (`/admin`)

### 6.1 Right Panel Sections

#### A) System Status (Top)
- Orchestrator: online/offline
- WS connection: connected/reconnecting
- Current state
- Current clip
- Queue length
- Last error (if any)

#### B) FSM Controls
Buttons:
- IDLE
- AWARE
- GREET
- LISTEN
- THINK
- SPEAK
- SHOW
- GOODBYE
- RESET (force ANY → IDLE; clear queues)

Behavior:
- Clicking a button sends an event to Orchestrator.
- UI immediately shows "pending" feedback.
- On backend confirmation, highlight active state.

#### C) Overlay Controls
- Subtitle input + buttons:
  - Set subtitle
  - Clear subtitle
- Card controls:
  - Show card (with JSON or form fields)
  - Hide card (by id)
  - Clear all overlays
- Quick overlays:
  - Show QR (URL)
  - Hide QR

#### D) Event Log (Bottom)
- Real-time list of events:
  - inbound events (manual triggers)
  - state transitions
  - clip playback start/end
  - overlay show/hide
  - errors
- Features:
  - auto-scroll toggle
  - max buffer (e.g., 500 lines)
  - color-coded severity (info/warn/error)

### 6.2 Player Preview (Left)
- Shows the same output as `/player`.
- Must be visually identical (or clearly marked as "PREVIEW" via a small badge).
- Optional: a "Open Fullscreen Player" link/button.

---

## 7. Orchestrator Requirements (Backend, MVP Scope)

Orchestrator is the **single source of truth** for:
- FSM state
- clip queue / next clip selection
- bridge selection
- overlay commands routing
- event log

The UI does not implement FSM logic; it sends events and renders updates.

### 7.1 Minimal Responsibilities
- Accept control events (REST or WS)
- Broadcast state changes + debug events (WS)
- Provide a `/status` snapshot endpoint

---

## 8. Event & API Contracts (MVP)

### 8.1 Control Events (Admin → Orchestrator)
`POST /event` or `WS send`

#### Manual State Trigger
```json
{ "type": "fsm.manual", "state": "GREET" }

Reset

{ "type": "fsm.reset" }

Subtitle

{ "type": "overlay.subtitle.set", "text": "Hello!", "ttlMs": 3000 }

{ "type": "overlay.subtitle.clear" }

Card Overlay

{
  "type": "overlay.card.show",
  "id": "card_1",
  "title": "Product X",
  "subtitle": "Key benefit",
  "imageUrl": "/assets/p1.png",
  "price": "$99",
  "cta": "Scan to learn more",
  "position": "right",
  "ttlMs": 8000
}

{ "type": "overlay.card.hide", "id": "card_1" }

{ "type": "overlay.clearAll" }

8.2 Broadcast Events (Orchestrator → Player/Admin via WS)

Status / Health

{
  "type": "status",
  "orchestrator": "online",
  "currentState": "LISTEN",
  "currentClip": "listen_loop_02",
  "queueLength": 2
}

State Transition

{
  "type": "fsm.transition",
  "from": "THINK",
  "to": "SPEAK",
  "bridgeClip": "think_to_speak_01",
  "nextClip": "speak_neutral_03"
}

Playback

{ "type": "playback.started", "clip": "speak_neutral_03" }

{ "type": "playback.ended", "clip": "speak_neutral_03" }

Overlay Events (echo for logs)

{ "type": "overlay.applied", "name": "subtitle", "details": { "text": "Hello!" } }

Errors

{ "type": "error", "code": "CLIP_LOAD_FAILED", "message": "Could not load idle_loop_04" }


⸻

9. Performance & UX Requirements
	•	Admin button feedback < 150ms (optimistic UI)
	•	Player should switch clips without visible black frames
	•	WS auto-reconnect with exponential backoff
	•	Player must keep running 30+ minutes without reload

⸻

10. Deployment (MVP)

Target Environment
	•	Any web server / VM (e.g., vast.ai CPU instance)
	•	Static clip hosting on the same origin is acceptable:
	•	/clips/.mp4

Minimal Open Ports
	•	80 (HTTP) for MVP
	•	443 (HTTPS) later (recommended for production / kiosk environments)

Runtime Assumption
	•	HoloBox opens https:/host/player in a modern browser (kiosk mode recommended).

⸻

11. Definition of Done (MVP)

MVP is complete when:
	1.	/player plays clip sequences with bridge transitions (no black flash)
	2.	React overlays render on top of video and update in real time via WS
	3.	/admin shows split view (left Player preview, right controls + logs)
	4.	FSM manual controls trigger correct transitions and are visible in logs
	5.	Overlay controls (subtitle + card + clear) work end-to-end
	6.	Reset reliably returns to IDLE and clears overlays/queues
	7.	WS reconnect works; errors are visible in the log

⸻

12. Success Criteria
	•	Operator can run a full demo loop from /admin without restarting anything
	•	Player output on HoloBox matches Player preview on /admin
	•	State transitions feel smooth (bridges working) and overlays are responsive