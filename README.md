# Lazy Feed

A small local website for catching up on new public Instagram posts. It reads public profile and post pages directly, then uses Gemma 4 through Ollama on your computer to summarize captions, tagged locations when available, and pictures. Summaries appear above the media. There is no Apify account, SMS, `.env` file, npm dependency, or build step.

## Requirements

- Node.js 22.13 or newer
- Ollama with `gemma4:e2b-it-qat` available
- Internet access to Instagram's public pages
- FFmpeg on `PATH` to inspect videos; captions and photos work without it

## Run it

The checked-in `config.json` has five editable NYU public-account examples. They are examples, not personal friends. Edit the profile URLs if you want different public accounts. Teammates can use the same project config or customize their local copy.

```sh
ollama pull gemma4:e2b-it-qat
npm start
```

Open **http://127.0.0.1:4317**. Click **Refresh feed** for an immediate update. The app also refreshes daily at the configured local time while the process is running; keep the computer awake and Ollama available.

## Configuration

Edit `config.json` to change profile URLs, model, port, daily time, or timezone. A profile URL should have this form:

```json
"https://www.instagram.com/username/"
```

The collector makes ordinary, unauthenticated requests to these pages; it does not use cookies, proxies, or an API token. Instagram can change its page format, return a login wall, or block automated requests. This is a best-effort MVP and may stop working without a code change. It reads at most five recent post links per profile and summarizes available captions plus preview media. It does not access Stories or private accounts. If Instagram blocks a refresh, the page reports the error and does not try to bypass the block.

For video posts, install FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html); Lazy Feed samples two frames. Summaries and seen-post IDs are saved locally in `.lazy-feed/`. The app binds only to `127.0.0.1`; media is analyzed by local Ollama.

## Contributing

This project uses native Node.js APIs and browser HTML/CSS/JavaScript. No install or build command is needed. Source is MIT licensed; Instagram content and external services retain their own terms.
