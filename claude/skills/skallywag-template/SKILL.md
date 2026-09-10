---
name: skallywag-template
description: "THIS IS THE WAY Ableton Live template map (channel tree, post chains, drum-rack pads, locators, placement rules) plus Skallywag's concrete-request rules. Use when working inside the Skallywag template, driving Ableton through Skallywag or AbletonBridge, or writing MIDI/devices onto its lanes."
---

# Skallywag template skill

## How to ask (Skallywag rejects vague requests on purpose)
- A request is CONCRETE when it names WHAT (notes/chord/rhythm, device, parameter, clip, loop, tempo, mixer move) and WHERE (track by name or number, plus bars or length whenever notes or clips are placed).
- Vague = vibe, genre, mood or quality with no concrete target ("make me a banger in 140 deep dub", "make it slap", "write a hook", "make a beat" without track+style+tempo+bars). Answer with one line naming what is needed; never fill the gap with taste.
- Concrete but missing ONE detail (which track, root/key, how many bars) → ask exactly one question. Global commands (tempo, play/stop, metronome, loop brace) need no track.
- Concrete → execute exactly. No added notes, effects, movement or alternate ideas.
- "track N" = Live's visible 1-based number N → index N-1. A track named in words is matched by name. If two lanes share a name (the two SYNTH 1 lanes), ask which.

# TEMPLATE MAP — "THIS IS THE WAY" (Live 12.3.8). Ground truth for channel names, what sits on each channel, and sample locations.
Indices shift; the NAMES below are fixed. Confirm with get_track_info by name before writing. (.als paths that mention "Live 12 Beta" are stale references — ignore.)

## Structure (groups nest, top→bottom in Session view)
PRE MASTER [group; post: Utility]
  DRUMS [group; post: Saturator preset "DONT YOU DARE"]
    Drum Kit Full (MIDI) — Drum Rack "Lycra Kit". Pads by MIDI note: 92 Kick Lycra · 91 Clap Wood Block · 90 Snare Lycra · 89 Clap Lycra · 88 Snare Reverb · 87 Tom Mid Analog 1 · 86 Hihat Closed Thin Machine · 85 Tom Mid Analog 2 · 84 Shaker Noise 3 · 83 Tom 909 Hi 2 · 82 Hihat Open Low Machine · 81 Tom 909 Mid 3 · 80/79 Synth Bass DCO 1 · 78 Synth Bass Distort · 77 Synth Bass Sub F. Rack FX return: Auto Filter → Utility → Saturator → Compressor → EQ Three → Ping Pong Delay → Squash → Limiter. Post: "lycan that B$TCH".
    KICK (MIDI) — Sampler "XLNT-Cartel V2 - Kick 08", trigger C3 (note 60). Post: "lycan that B$TCH".
    REVERSE K (audio) — reversed kick tail lane. No devices.
    SNARE (MIDI) — Sampler "XLNT-Cartel V2 - Snare 44", trigger C3 (60). Post: "lycan that B$TCH".
    REVERSE S (audio) — reversed snare tail lane. No devices.
    CYMBOLS [group; post: EQ Eight]
      HH (MIDI) — Simpler "Cymatics Dubstep Toolkit Closed Hihat 3" (60). Post: "lycan that B$TCH".
      HH CLOSED (MIDI) — same Simpler/sample (60). Post: "lycan that B$TCH".
      CRASH (MIDI) — Simpler currently holds the SAME closed-hat sample as a placeholder (swap for a real crash when asked). Post: "lycan that B$TCH".
    (SPICE) DRUMS (audio) — spice/percussion loops. No devices.
  MIDS [group; post: EQ Eight "HIGH PASS BOI" (high-pass) → Saturator "DONT YOU DARE" → ShaperBox 3]
    TRIG (MIDI) — group trigger lane, no instrument.
    SYNTH 1 (MIDI, first) — Instrument Rack: Serum 2 + LOW/HIGH split chains (EQ Eight; HIGH adds Shifter) + "!MR. BILL - SOUND DESIGN - FREQ SHIFT SPLITTER". Lead / chord stab.
    SYNTH 1 (MIDI, second) — Instrument Rack: Serum 2 + LOW/HIGH split. Twin-timbre / second lead patch.
    SYNTH 2 (MIDI) — Instrument Rack: Serum 2 + LOW/HIGH split. Hook / response layer.
    SYNTH 3 (MIDI) — Serum 2 → 4 BAND OTT → Glue Compressor → GClip. Pluck / bell / low answer.
    SYNTH 4, SYNTH 5, SYNTH 6 (audio) — resample/bounce lanes. No devices.
  SUB [group; post: EQ Eight → ShaperBox 3 (sidechain/volume shaping)]
    TRIG (MIDI) — sidechain/trigger lane.
    SUB 1 (MIDI) — rack "LYCAN HEAVIEST SUB V2": Operator → Auto Pan → Saturator → Amp → EQ Eight → Redux → EQ Eight → Erosion. Mono sub; sits under everything.
  FX [group]
    TRIG (MIDI). RISE 1 / RISE 2 / RISE 3 (audio) risers-uplifters. DOWN 1 / DOWN 2 / DOWN 3 (audio) downlifters/impacts. No devices.
  VOCALS [group; post: THE_STRIP MINI 2]
    TRIG (MIDI). VOX M (audio, post: THE_BALANCE). VOX F (audio, post: THE_BALANCE).
RREFERANCE (audio, OUTSIDE PRE MASTER) — reference track. Never process, never route through the bus.
Returns: A-Reverb (Reverb), B-Delay (Delay).

## "lycan that B$TCH" = the drum post-processing rack on every drum channel
kHs Transient Shaper → Glue Compressor → Utility → Ozone Imager 2 → GClip. Tune it; don't replace it.
Every MIDI drum/synth channel also carries the Skallywag M4L device first in chain — ignore it.

## Where the samples live
- User Library: <User Library>/
- Imported one-shots (drum rack + template hits): <User Library>/Samples/Imported/
- Packs: <User Library>/XLNTSOUND-Cartel Vol. 2/ (Drums/Kicks, Drums/Snares, ...), other packs alongside
- Live core library: C:/ProgramData/Ableton/Live 12 Suite/Resources/Core Library/
- Templates: <User Library>/Templates/ (THIS IS THE WAY.als = this map; Untitled.als = same layout)
- Loose MIDI files: <your drive>/ (e.g. <your drive>/STINKMODE_call_response_140_Gm.mid)

## Arrangement locators (beats)
START 0 · INTRO 32 · TRANSITION 96 · Drop 128 · Drop 2 192 · Trans 256 · Drop 3 288 · Outro 352 · END 384

## Placement rules
- Drums go to their element channel: kick→KICK, snare/ghosts→SNARE, closed hats→HH CLOSED (HH = second hat voice), crash→CRASH, open hat/toms/claps/shaker→Drum Kit Full pads (notes above).
- Leads/chords/hooks→SYNTH 1-3 (Serum 2 patches). Sub→SUB 1. Risers/impacts→RISE/DOWN audio lanes. Vocals→VOX M/F.
- Prefer an existing template channel over creating a track. Session-view clips: use the first empty scene on every target track and name the scene.
- Scene "STINKMODE C&R 140" holds the call/response set (CALL on SYNTH 1, TWIN on SYNTH 1 #2, RESPONSE on SYNTH 2, low answer on SYNTH 3, drums split as above).

