# 🚀 Deploying Bhavanam Telegram Bot to Render

This guide provides step-by-step instructions to deploy the **Bhavanam Telegram Home Management Bot** to **[Render](https://render.com/)** using Docker and automatic persistence.

---

## 📋 Prerequisites

1. A **GitHub** account and your repository pushed to GitHub.
2. A **Telegram Bot Token** from `@BotFather` (e.g. `8650138368:AA...`).
3. A **Render** account (Free tier available at [render.com](https://render.com)).

---

## ⚙️ Why Render Background Worker?

Telegram bots using **Long Polling** (`telegraf.launch()`) do not serve HTTP web pages. On Render, choosing a **Background Worker** ensures your bot runs **24/7** without timing out or failing port binding health checks.

---

## 🛠️ Deployment Options

### Option A: Automatic Blueprint Deployment (Recommended)

Render includes built-in support for `render.yaml` infrastructure-as-code included in this repository.

1. Push your repository to **GitHub**.
2. Log into the **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New +** top right and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically read `render.yaml` and configure:
   - **Service Type**: Background Worker
   - **Environment**: Docker
   - **Persistent Disk**: 1GB mounted at `/app/data`
6. Fill in your environment variables:
   - `BOT_TOKEN`: Your Telegram Bot API token.
   - `TARGET_CHAT_ID`: Telegram Group Chat ID (e.g. `-1004493419172`).
7. Click **Apply**. Render will build the Docker container and start your bot live!

---

### Option B: Manual Setup via Render Dashboard

If you prefer to configure the service manually on Render:

1. Log into **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** -> **Background Worker**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `bhavanam-bot`
   - **Region**: Choose the closest region to you (e.g. Oregon, Frankfurt, Singapore).
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free` or `Starter`
5. Scroll to **Environment Variables** and add:

   | Key | Value | Notes |
   |---|---|---|
   | `BOT_TOKEN` | `8650138368:AAG2...` | Required |
   | `TARGET_CHAT_ID` | `-1004493419172` | Group Chat ID for alerts |
   | `ENABLE_SCHEDULED_REMINDERS` | `true` | Enables scheduled daily reminders |
   | `TRASH_SCHEDULE_CRON` | `0 20 * * *` | Everyday at 8:00 PM |

6. *(Recommended for data retention)* Scroll down to **Disks** -> **Add Disk**:
   - **Name**: `bhavanam-data`
   - **Mount Path**: `/app/data`
   - **Size**: `1 GB`
7. Click **Create Background Worker**.

---

## 🐳 Option C: Local Testing with Docker Compose

Before deploying to the cloud, you can test the Docker container locally on your PC:

```bash
# 1. Build and start container in detached mode
docker compose up --build -d

# 2. View real-time logs
docker compose logs -f

# 3. Stop container
docker compose down
```

---

## 🔍 Verification & Logs

Once deployed on Render:
1. Open your service in Render Dashboard and click **Logs**.
2. You should see output similar to:
   ```text
   🏡 Starting Bhavanam Telegram Home Manager Bot...
   ✅ Bhavanam Bot (@bhavanam_home_bot) is online and listening for Telegram commands!
   ```
3. Open Telegram and test commands in your group chat:
   - `/trash_status`
   - `/trash`
   - `/help`

---

## 💡 Notes on Persistence
All rotation states, history, and roster edits are stored in JSON files under `/app/data/`. 
With Render's **Persistent Disk** mounted at `/app/data`, your turn history and member lists persist smoothly across container rebuilds and restarts!
