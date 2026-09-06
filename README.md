# 🏡 Bhavanam — Telegram Home Management Bot

A modular Telegram bot for home management. Includes a **Round-Robin Trash Cleaning Manager** with automated reminders, custom roster management, turn overrides, skip turn features, and persistent storage.

---

## 👥 Pre-Configured Rotation List

The bot comes pre-filled with your rotation list:
1. **Arjun**
2. **haroshin**
3. **azim**
4. **Abhijith**
5. **surusu**
6. **jais**
7. **Yohaan_libert**
8. **noel**

---

## ⚡ Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Create Telegram Bot Token (@BotFather)

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot` to create a new bot.
3. Choose a name (e.g. `Bhavanam Home Manager`) and a username (e.g. `bhavanam_home_bot`).
4. Copy the **HTTP API Token** provided by BotFather (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyZ`).
5. Open `@BotFather` again and turn **Group Privacy OFF** so the bot can see commands in groups:
   - Send `/mybots` -> Select your bot -> **Bot Settings** -> **Group Privacy** -> **Turn OFF**.
6. Add your bot as an **Administrator** or **Member** in your house Telegram group chat.

---

### 3. Configure Environment Variables (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and paste your Bot Token:

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyZ

# (Optional) Chat ID of your Telegram group for scheduled alerts
TARGET_CHAT_ID=-1001234567890

# (Optional) Set to true to enable background cron reminders
ENABLE_SCHEDULED_REMINDERS=true
TRASH_SCHEDULE_CRON=0 20 * * 2,5
```

---

### 4. Run the Bot

#### Development Mode (Auto-restart on code edit)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

#### Test Logic & Simulation without Token
```bash
npm test
npm run sim
```

---

## 🤖 Command Reference

| Command | Description |
|---|---|
| `/trash` or `/cleantrash` | Triggers trash cleaning duty alert tagging the next assigned member in rotation. |
| `/trash_status` | View current turn holder, member list, and past duty history. |
| `/skip_trash` | Skip the current turn holder and move to the next person. |
| `/set_turn <name/index>` | Override current turn manually (e.g. `/set_turn Yohaan_libert` or `/set_turn 3`). |
| `/listmembers` | View all members in rotation order. |
| `/addmember <name>` | Add a new member to the rotation. |
| `/removemember <name/index>` | Remove a member from the rotation. |
| `/join_trash` | Self-register to join trash rotation. |
| `/leave_trash` | Self-register to leave trash rotation. |
| `/help` | Show command reference menu. |

---

## 📁 File Structure

```
d:/Bhavanam/
├── package.json            # Node.js dependencies & scripts
├── .env.example            # Environment configuration template
├── README.md               # Setup and usage guide
├── data/
│   ├── members.json        # Pre-filled member roster
│   └── state.json          # Persistent round-robin index & duty history log
├── src/
│   ├── index.js            # Main bot entry point
│   ├── config.js           # Configuration loader
│   ├── commands/
│   │   ├── trash.js        # /trash, /trash_status, /skip_trash, /set_turn
│   │   ├── members.js      # /addmember, /removemember, /listmembers, /join_trash
│   │   └── help.js         # /start, /help
│   ├── services/
│   │   ├── roundRobin.js   # Round-robin rotation algorithm & state logic
│   │   └── scheduler.js    # Cron automated scheduled reminders
│   ├── storage/
│   │   └── store.js        # Persistent JSON file storage manager
│   └── utils/
│       └── formatters.js   # HTML formatted Telegram message templates
└── test/
    ├── roundRobin.test.js  # Automated unit test suite
    └── sim.js              # CLI simulator script
```

---

## 🚀 Running 24/7 in Production

### Option 1: Render Cloud Deployment (Recommended)

Deploy to **Render** using Docker for 24/7 zero-downtime execution and persistent data storage. See the full step-by-step guide in [DEPLOYMENT.md](file:///d:/Bhavanam/DEPLOYMENT.md).

Quick steps:
1. Push code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Blueprint**.
3. Connect repository (Render will auto-detect `render.yaml`).
4. Set environment variables `BOT_TOKEN` & `TARGET_CHAT_ID` and click **Apply**.

---

### Option 2: Docker / Docker Compose

```bash
docker compose up --build -d
```

---

### Option 3: PM2 (Local / VPS Process Manager)

```bash
npm install -g pm2
pm2 start src/index.js --name "bhavanam-bot"
pm2 save
```

