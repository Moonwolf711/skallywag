---
name: track-crash
description: "Crash — phrase downbeats and drop punctuation. Invoke when working on the 'CRASH' channel."
---

# THE CRASH ROOM

You stand at the entrance of THE CRASH ROOM. Five surfaces hold everything you need.

## NORTH WALL — Your Channel
A hand-painted sign reads **'CRASH'**.
Find your track index by name. Iterate `mcp__AbletonBridge__get_track_info(i)`
from i=0 upward until the returned name matches `'CRASH'`. That index is `<idx>`
for every command below. If no match: STOP and report — never create a new track.

## EAST WALL — The Instrument
Drum Rack pad with crash sample. Long envelope, reverb send.

## SOUTH WALL — The Knobs (OSC whitelist — ONLY these paths, ONLY these ranges)
Send via the helper: `python tools/osc.py <addr> [args...]`.
The helper binds 11001 (AbletonOSC's fixed reply port) and decodes replies as JSON.
Address can be passed without the leading `/` to avoid Git-Bash path mangling.
Never bind raw sockets yourself. Never port 8001.

  • Volume         → `/live/track/set/volume <idx> 0.6..0.8`  (typical 0.7)
  • Send Reverb    → `/live/track/set/send <idx> 0 0.4..0.6`  (typical 0.5)

Discover device-parameter indices (`<pi>`) at runtime:
  `/live/device/get/parameters/name <track> <device>` returns names
  `/live/device/get/parameters/value <track> <device>` returns current values
Stay within the ranges above. Don't twist what isn't on this list.

## WEST WALL — The Patterns
Place clips inside section locators (you set tempo to 124 BPM at start).
Query the song's actual locator names at runtime:
  `/live/song/get/cue_points` → returns [name, time, name, time, ...]
  `/live/song/jump_to_cue_point <name_or_index>`

Fallback section map if no locators set:
INTRO     bar  1- 8  sparse, mood-setting, one element at a time
BUILD     bar  9-16  layers add, tension rises, filter sweeps open
DROP      bar 17-32  full pattern, all elements, peak energy
BREAKDOWN bar 33-40  half-time, sparser, vox forward, sub drops out
DROP 2    bar 41-56  full pattern + extra layers, biggest moment
OUTRO     bar 57-64  thin to single elements, fade or tape-stop

Note 49. Hit on bar 1 of each major section (1, 17, 33, 41, 57).
Sparse — never more than 1 hit per 8 bars.

## CEILING — Hard Rules
1. **NEVER create tracks.** No `create_midi_track`, no `load_instrument_or_effect`,
   no `load_drum_kit`. The instruments are already on this channel — leave them.
2. **Find by NAME, not assumed index.** Indices shift between sessions.
3. **Stay inside PRE MASTER.** Don't touch tracks outside that group.
4. **OSC only to 127.0.0.1:11000.** Port 8001 is CoLaB — DO NOT touch it.
5. **Stay inside the OSC whitelist above.** If you need a param not listed,
   surface the request to the user instead of guessing.
6. **One channel = one agent.** Don't reach into other channels' work.

## TOOLS YOU MAY CALL
- `mcp__AbletonBridge__get_session_info`
- `mcp__AbletonBridge__get_track_info`
- `mcp__AbletonBridge__create_clip`  (MIDI authoring on YOUR track only)
- `mcp__AbletonBridge__add_notes_to_clip`
- `mcp__AbletonBridge__set_clip_name` (label sections: INTRO, BUILD, DROP, etc.)
- `mcp__AbletonBridge__fire_clip` / `stop_clip`
- `Bash` — only for AbletonOSC sends to 127.0.0.1:11000 matching the whitelist.

Reply plain-text only, 1-3 sentences.
