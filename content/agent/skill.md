---
name: meetdugong
version: 1.0.0
description: Control the Dugong embodied AI avatar — animate FSM states, show overlays, and make Dugong come alive during interactions.
homepage: https://meetdugong.live
metadata: {"dugong":{"emoji":"🐟","category":"avatar","api_base":"https://meetdugong.live"}}
---

# Meet Dugong

Dugong is an embodied AI avatar controlled through a Finite State Machine (FSM). As an agent, you animate Dugong's states and overlays to visually communicate what you're doing — thinking, speaking, greeting visitors, and more. Use this skill to make interactions feel alive.

## Skill Files

| File | URL |
|------|-----|
| **SKILL.md** (this file) | `https://meetdugong.live/skill.md` |

**Install locally:**
```bash
mkdir -p ~/.openclaw/skills/meetdugong
curl -s https://meetdugong.live/skill.md > ~/.openclaw/skills/meetdugong/SKILL.md
```

**Base URL:** `https://meetdugong.live`

---

## Check Current Status

Always fetch status first to see the active character, current FSM state, and available states:

```bash
curl https://meetdugong.live/status
```

Example response:
```json
{
  "type": "status",
  "orchestrator": "online",
  "currentState": "GREETING",
  "currentClip": "https://meetdugong.live/content/dugong_v2/idle_loops/idle_4.mp4",
  "queueLength": 0,
  "lastError": null,
  "activeCharacter": "dugong_v2",
  "characters": [
    { "id": "dugong_v1", "name": "Dugong V1" },
    { "id": "dugong_v2", "name": "Dugong V2" }
  ],
  "fsmStates": ["IDLE", "HAPPY", "THINK", "SPEAK", "GREETING", "ADJUSTCAP"],
  "stateConfigs": {
    "HAPPY":     { "actionPrefix": "action_happy" },
    "THINK":     { "actionPrefix": "action_think" },
    "SPEAK":     { "actionPrefix": "action_speak" },
    "GREETING":  { "actionPrefix": "action_greeting" },
    "ADJUSTCAP": { "actionPrefix": "adjustcap" }
  }
}
```

## Check Available Scenarios

```bash
curl https://meetdugong.live/scenarios
```

Returns pre-defined interaction sequences (campus tour, student Q&A, enrollment info, research showcase). Each scenario has timed steps combining FSM state transitions and overlay events.

---

## Post Events

Send control events to animate Dugong:

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "GREETING"}'
```

---

## FSM States

### Dugong V2 (default active character)

| State | Meaning | When to Use |
|-------|---------|-------------|
| `IDLE` | Resting, looping idle animation | No active interaction |
| `GREETING` | Greeting wave/animation | User arrives, session starts |
| `THINK` | Processing/thinking | You are working on a request |
| `SPEAK` | Speaking animation | You are delivering a response |
| `HAPPY` | Happy, cheerful | Positive result, wrap-up |
| `ADJUSTCAP` | Casual cap adjustment | Light transitional moment |

### Dugong V1 (alternative character)

States: `IDLE`, `AWARE`, `LISTEN`, `THINK`, `SHOW`

---

## FSM Control Events

### Transition to a state

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "THINK"}'
```

### Reset to IDLE

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.reset"}'
```

### Switch character

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "character.switch", "characterId": "dugong_v1"}'
```

---

## Overlay Events

### Subtitles

```bash
# Show subtitle (disappears after ttlMs)
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.subtitle.set",
  "text": "Hello! How can I help you today?",
  "ttlMs": 4000
}'

# Clear subtitle immediately
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.subtitle.clear"}'
```

### Cards

```bash
# Show info card
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.card.show",
  "id": "info-card",
  "title": "AI Research Labs",
  "subtitle": "State-of-the-art GPU clusters & robotics lab",
  "position": "right-mid",
  "ttlMs": 5000
}'

# Hide specific card
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.card.hide", "id": "info-card"}'
```

Optional card fields: `imageUrl`, `price`, `cta`

### QR Codes

```bash
# Show QR code
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.qr.show",
  "url": "https://example.com",
  "position": "right-mid",
  "ttlMs": 6000
}'

# Hide QR code
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.qr.hide"}'
```

### Clear All Overlays

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.clearAll"}'
```

---

## Agent Status Overlays

Show your internal agent state visually on screen. **Use these to report status to users watching Dugong.**

### Thinking indicator

Show when you are processing or reasoning:

```bash
# Show thinking
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.thinking",
  "text": "Analyzing your question",
  "steps": ["Understanding query", "Searching knowledge base", "Formulating response"]
}'

# Clear
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.thinking.clear"}'
```

### Tool call / action

Show when you are calling a tool or fetching data:

```bash
# Show action
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.action",
  "action": "Calling Tool",
  "detail": "Fetching recent publications",
  "tool": "Scholar Search",
  "progress": 0.65
}'

# Clear
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.action.clear"}'
```

`progress` is optional (0–1) and renders a progress bar.

### Agent state badge

Show a labelled badge for your current agent state:

```bash
# Show badge
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.state",
  "state": "THINKING",
  "label": "Processing",
  "color": "#FF6B6B"
}'

# Clear
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.state.clear"}'
```

### Event toast

Show a brief event notification:

```bash
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.event",
  "eventType": "tool_called",
  "summary": "Fetched 5 results",
  "ttlMs": 2000
}'
```

### Clear all agent overlays

```bash
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.clear"}'
```

---

## Overlay Position Slots

Use `position` in any overlay event:

| Value | Location |
|-------|----------|
| `top-left` | Top left |
| `top-center` | Top center |
| `top-right` | Top right |
| `mid-left` | Middle left |
| `mid-center` | Center |
| `mid-right` | Middle right |
| `bottom-left` | Bottom left |
| `bottom-center` | Bottom center |
| `bottom-right` | Bottom right |

---

## Animating During Interactions

**Mirror your agent state in Dugong.** Use this pattern when handling a user request:

| Step | Your State | Dugong Event |
|------|-----------|--------------|
| User arrives | — | `fsm.manual` → `GREETING` |
| Processing request | Thinking | `fsm.manual` → `THINK` + `overlay.agent.thinking` |
| Calling a tool | Tool use | `overlay.agent.action` with tool name |
| Delivering response | Speaking | `fsm.manual` → `SPEAK` + `overlay.subtitle.set` |
| Done | Wrapping up | `fsm.manual` → `HAPPY`, then `fsm.reset` |

### Example: Full Q&A interaction

```bash
# 1. Greet the user
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "GREETING"}'

# 2. Start thinking
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "THINK"}'
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.thinking",
  "text": "Processing your question",
  "steps": ["Understanding", "Searching", "Formulating"]
}'

# 3. (optionally show a tool call)
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.agent.action",
  "action": "Searching",
  "detail": "Looking up relevant info",
  "tool": "Knowledge Base"
}'
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.action.clear"}'

# 4. Respond
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.agent.thinking.clear"}'
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "SPEAK"}'
curl -X POST https://meetdugong.live/event --json '{
  "type": "overlay.subtitle.set",
  "text": "Here is what I found...",
  "ttlMs": 5000
}'

# 5. Wrap up
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "HAPPY"}'
curl -X POST https://meetdugong.live/event --json '{"type": "overlay.clearAll"}'
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.reset"}'
```

---

## Heartbeat 💓

Add Dugong to your heartbeat so the avatar stays alive and welcoming across sessions.

### Add to your heartbeat file

```markdown
## Meet Dugong (on startup + every session start)
1. Fetch https://meetdugong.live/status
2. If orchestrator is online, send a greeting:
   POST https://meetdugong.live/event {"type":"fsm.manual","state":"GREETING"}
3. Wait ~3 seconds, then reset to IDLE:
   POST https://meetdugong.live/event {"type":"fsm.reset"}
```

### Greeting logic

Check the available `fsmStates` in the status response and pick any state with greeting meaning (`GREETING`, `GREET`, `AWARE`). If found, send it. Otherwise default to `GREETING` if available:

```bash
# Greet
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.manual", "state": "GREETING"}'

# Wait a moment, then return to idle
sleep 3
curl -X POST https://meetdugong.live/event --json '{"type": "fsm.reset"}'
```

Repeat this at the start of each agent session. This keeps Dugong engaged and signals to anyone watching that the agent is online and ready.

---

## Quick Reference

| Goal | Event type |
|------|-----------|
| Greet user | `fsm.manual` → `GREETING` |
| Show thinking | `fsm.manual` → `THINK` + `overlay.agent.thinking` |
| Show tool use | `overlay.agent.action` |
| Speak response | `fsm.manual` → `SPEAK` + `overlay.subtitle.set` |
| Show happy finish | `fsm.manual` → `HAPPY` |
| Reset to idle | `fsm.reset` |
| Show info card | `overlay.card.show` |
| Show QR code | `overlay.qr.show` |
| Clear everything | `overlay.clearAll` |
