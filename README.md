# Luucid

A modern, clean, minimal meditation timer built with Next.js (App Router) and JavaScript.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Audio files

Luucid expects local audio assets in these folders:

	- `rain.mp3`
	- `ocean.mp3`
	- `white-noise.mp3`
	- `bell-soft.mp3`
	- `bell-deep.mp3`
	- `bell-bright.mp3`

If an audio file is missing, the app still works and shows "Audio unavailable" when playback fails.

### Add your own sounds (no code changes)

Luucid auto-discovers audio files by scanning the folders below on the server:

- `public/audio/background/`
- `public/audio/bells/`

To add new sounds:

1. Drop audio files into those folders (supported: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`).
2. Refresh the app.

Luucid uses the filename as the ID and generates a label from it. Example:

- `public/audio/background/forest-rain.mp3` → shows as “Forest Rain”

IDs are normalized to a lowercase slug (safe for URLs and mappings). Examples:

- `Coffee Shop.mp3` → id `coffee-shop`
- `Rainy Night.mp3` → id `rainy-night`

Note: if you deploy to a host like Vercel, you still need to include the new files in your deployment (e.g., commit and redeploy). This avoids modifying code, but the server must have the files.

### Seamless looping

Luucid uses Web Audio’s `AudioBufferSourceNode.loop`, which is sample-accurate. For a truly seamless loop, the *audio file itself* must be loopable (no awkward tail, click, or silence).

Best results:

- Prefer `.wav` or `.ogg` for looping backgrounds (MP3 can include encoder padding that can sound like a tiny gap).
- Edit the clip so the end meets the start cleanly (often at a zero-crossing), or use a short crossfade when creating the loop.

Optional: Loop points (no code changes)

You can define loop start/end points in seconds here:

- `public/audio/loops.json`

Example:

- `"beach-waves": { "start": 2.4, "end": 38.9 }`

If `end` is `0` (the default in the sample file), Luucid won’t apply loop points and will loop the entire decoded buffer.

### Preloading (reduce first-click delay)

Luucid can preload audio by fetching and decoding files into the Web Audio buffer cache before you press Play/Begin.

- Backgrounds preload when you enter the Sound step.
- Bells preload when you enter any bell-related step.

This reduces the “first click” delay, but it does download audio files in the background, so keep file sizes reasonable (especially for mobile users).

### Set icons for sounds (no code changes)

Luucid supports an optional mapping file:

- `public/audio/icons.json`

The audio catalog will attach an `icon` name to any matching sound ID, and the UI will render that Lucide icon when available.

Example:

- `public/audio/background/beach-waves.mp3` has ID `beach-waves`
- Add to `public/audio/icons.json`:
	- `"beach-waves": "Waves"`

If an icon name isn’t recognized, Luucid falls back to a simple default icon.

## Autoplay restrictions

Mobile browsers typically block audio until you interact with the page.

- Use Preview or Begin to start audio
- Audio will not start automatically on page load

## Stateless behavior

Luucid is anonymous and stateless.

- No accounts
- No saving
- Refreshing the page resets the session

## Development notes

- Central audio logic lives in `lib/audioEngine.js`
- Session state is managed by Zustand in `store/useLuucidStore.js`
