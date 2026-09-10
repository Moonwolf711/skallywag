# Skallywag

**An AI first mate that lives in the channel bar of every lane in Ableton Live.**

Skallywag is a Max for Live device plus a small local agent. You type or say a concrete move and it writes the MIDI, builds and loops the clip, loads sounds from *your* Live browser, sets plugin parameters, drives the mixer, fires scenes. It runs on your own machine: no account, no API key, works offline.

> The captain isn't always steering. Your first mate takes the order and turns the wheel. Skallywag is the first mate.

## It won't make you a banger

Skallywag is built for producers who already know the tools and the tactics. Vague, generative prompts are **rejected on purpose**. You have to say exactly what you want.

| Rejected | Accepted |
|---|---|
| `make me a banger in 140 deep dub` | `SUB 1: one note F1, bars 1–8, sidechain depth 0.7 on the SUB bus` |
| `make something dark and bouncy` | `C minor chord on SYNTH 2, 4 bars, offbeat 8ths, velocity 90` |
| `make a beat` | `house beat on track 3 at 124 bpm, 4 bars` |
| `write a hook` | `loop bars 33–41, Sampler on SYNTH 2 with a one-shot, one C3 held the full length` |

Missing one detail and it asks one question. Missing the idea and it sends you back to the drawing board.

**No AI-generated music. None.** Skallywag never generates a sound. It moves your sounds, writes the notes you asked for, and loads from your library. The idea is still yours. The hands are still yours.

## What's in this repo (free)

| Folder | What it is |
|---|---|
| `device-lite/` | **Skallywag Lite**, a free Max for Live audio effect: a live, color-coded activity terminal for whatever your scripts, OSC automation, or agents send it over UDP. |
| `claude/agents/` | 24 Claude Code channel agents (KICK, SNARE, HH, SYNTH 1–6, SUB, RISE, DOWN, VOX…) that drive one lane each through AbletonBridge. |
| `claude/skills/skallywag-template/` | The **THIS IS THE WAY** template map as a Claude Code skill: channel tree, post chains, drum-rack pads, locators, placement rules, and Skallywag's concrete-request rules. |
| `tools/osc.py` | The tiny OSC helper the channel agents call (AbletonOSC, port 11000/11001). |
| `install.ps1` / `install.sh` | One-line installers for the dependencies, the Lite device, the skills, and the paid bundle if you have it. |

The full Skallywag device, the local agent runtime, and the stacked template with mastered one-shots are the paid bundle: **https://4420607908526.gumroad.com/l/skallywag**

## Install

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/Moonwolf711/skallywag/main/install.ps1 | iex
```

macOS / Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/Moonwolf711/skallywag/main/install.sh | bash
```

Node users, any platform:

```bash
npx github:Moonwolf711/skallywag
```

The installer:

1. Installs **Node.js LTS** and **Ollama** if they are missing (winget on Windows, Homebrew on macOS).
2. Downloads this repo and copies **Skallywag Lite** into your Ableton User Library (`Presets/Audio Effects/Max Audio Effect/Skallywag Lite`).
3. Copies the **channel agents and template skill** into `~/.claude` when Claude Code is installed.
4. Pulls the default local model (`qwen2.5:7b`, about 4.7 GB, one time).
5. If you point it at your purchased bundle (`-Zip path\to\Skallywag.zip` on Windows, `SKALLYWAG_ZIP=... ` on macOS), unpacks it to `Documents/Skallywag` and runs its setup.

Options are environment variables so they work with the one-liners: `SKALLYWAG_DRYRUN=1` prints every step without changing anything; `SKALLYWAG_SKIP_MODEL=1`, `SKALLYWAG_SKIP_SKILLS=1`, `SKALLYWAG_MODEL=qwen3:8b`, `SKALLYWAG_ZIP=<path>`.

## Requirements

| | Minimum | Recommended |
|---|---|---|
| Ableton | Live 11 or 12 with Max for Live | Live 12 |
| OS | Windows 10/11 x64, macOS Apple Silicon | |
| RAM | 16 GB | 32 GB |
| Disk | 6 GB free for the local model | SSD |
| GPU | none (CPU works, slower) | NVIDIA 8 GB+ VRAM or Apple Silicon 16 GB+ for instant replies |
| Node.js | LTS | |
| Ollama | current | |

## Model backends

Skallywag ships pointed at a **local** model through Ollama, so it works offline with no key. The tool schema and the rejection rules ship with the device and work with any tool-calling model, so nobody has to train anything to use a cloud model. Set one line in `agent/.env`:

| Backend | `.env` | Notes |
|---|---|---|
| Local (default) | `LLM_BACKEND=local`, `LLM_MODEL=qwen2.5:7b` | Offline. Speed depends on your machine. |
| Groq (free tier) | `LLM_BACKEND=groq`, `GROQ_API_KEY=...` | Default model `openai/gpt-oss-120b`. Fast. Rate-limited on the free tier. |
| Muse Glimmer (local) | `LLM_MODEL=muse-glimmer` | Meta's 30B agent model, Apache 2.0, `ollama pull muse-glimmer`. Needs a 24 GB GPU or a 32 GB Apple Silicon Mac to be quick; runs on CPU otherwise, slowly. |
| Swarm | `LLM_SPEC=swarm:cascade:local:qwen2.5:7b,groq:openai/gpt-oss-120b` | One master, several models: `cascade` asks the first model and escalates only when its answer is not decisive; `vote` asks every member in parallel and takes the majority tool call. Members are any `local:` or `groq:` spec. |
| Claude, OpenAI, Gemini, xAI | API key for the provider | Pay per token with the provider's **API key**. Consumer subscriptions (Claude Max, ChatGPT plans) are not usable from third-party tools under those services' terms. |

**Voice.** Put `ELEVENLABS_API_KEY=` (free key) in `agent/.env` and Skallywag talks back in a gravelly premade voice; `SKW_VOICE_ID=` picks any voice from your ElevenLabs account, `/voice off` at the chat bar mutes it.

Deepest integration: Claude through Claude Code with the AbletonBridge MCP and the template skill in this repo. The Skallywag drive edition (limited run) ships a model fine-tuned on this exact tool set and template so it runs reliably at small size, offline.

## The template

The paid bundle includes the **THIS IS THE WAY** Live set. The layout, so the agents and skill make sense:

```
PRE MASTER            Utility
├ DRUMS               Saturator
│  Drum Kit Full      full kit · KICK + SNARE samplers · HH · HH CLOSED · CRASH
│                     reverse-tail lanes · spice lane · mastered one-shots loaded
├ MIDS                EQ Eight high-pass → Saturator → ShaperBox 3
│  SYNTH 1 · 1b · 2 · 3   Serum 2 racks, LOW/HIGH split chains
│  SYNTH 4–6          resample lanes
├ SUB                 EQ Eight → ShaperBox 3 (sidechain shaping)
│  SUB 1              mono sub rack
├ FX                  RISE 1–3 · DOWN 1–3
└ VOCALS              VOX M · VOX F
REFERENCE             outside the bus, never processed
locators              INTRO 32 · DROP 128 · DROP 2 192 · DROP 3 288 · OUTRO 352
```

Every drum lane runs the same post rack: kHs Transient Shaper → Glue Compressor → Utility → Ozone Imager 2 → GClip. Tune it, don't replace it. Third-party plugins named there are not included.

## Using the channel agents (Claude Code)

The agents in `claude/agents/` each own one lane and talk to Live through the **AbletonBridge** MCP server (`mcp__AbletonBridge__*`) and the OSC helper in `tools/osc.py` (AbletonOSC on ports 11000/11001). Put `tools/osc.py` somewhere on your path or edit the helper line in each agent. Invoke one with, for example, `/agents track-kick` or by asking for "the KICK channel".

## License

Scripts, agents, and the skill in this repo are MIT licensed. Skallywag Lite is free to use in your own sets. The full device, agent, and template are sold separately under the Gumroad license.
