# Vanity Role Bot

Automatically grant a special Discord role to members who advertise your server in their custom status. When the status no longer matches, the role is removed silently. Built with `discord.js` v14 and tuned for presence-based automations.

## Features

- Watches member presence updates and reacts in real time.
- Supports multiple vanity formats: `discord.gg/<keyword>`, `.gg/<keyword>`, `/<keyword>`, or the keyword alone.
- Rich welcome embed with server emoji detection, avatar thumbnail, and configurable channel.
- Slash-command administration for vanity keyword and target channel; both restricted to administrators.
- Persistent configuration stored in `data.json`, keeping settings across restarts.

## Quick Start

```bash
cp env.example .env   # or copy manually on Windows
npm install
node index.js
```

Before launching the bot, enable the following Gateway Intents in the Discord Developer Portal:
- Presence Intent
- Server Members Intent

## Configuration

Copy `env.example` to `.env` and fill in your Discord credentials before running the bot. `config.js` still holds non-sensitive defaults, but any value present in `.env` takes precedence.

Runtime changes to the vanity keyword or destination channel are saved automatically in `data.json` (ignored by Git by default).

## Slash Commands

- `/setvanity keyword:<texto>` — Updates the vanity keyword and regenerates trigger variants. Administrator only.
- `/setchannel channel:<canal>` — Selects the channel where the embed is posted. Administrator only.

All commands reply ephemerally so only the executor sees the confirmation.

## Project Structure

- `index.js` — Main bot logic, event handlers, and slash-command registration.
- `config.js` — Static configuration defaults.
- `data.json` — Persisted runtime settings (`vanity`, `channelId`).
- `env.example` — Template for `.env` secrets (token, guild, role, channel, keyword).
- `package.json` — Dependencies and scripts.

## Contributing

Issues and pull requests are welcome. Fork the repo, open your branch, and submit a PR describing the change. Please keep the README free of emoji per project style.

## Author

Maintained by [jiroaku](https://github.com/jiroaku).

Repository: [github.com/jiroaku/vanity-role-bot](https://github.com/jiroaku/vanity-role-bot)