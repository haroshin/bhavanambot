import http from 'http';
import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { storage } from './storage/store.js';
import { setupTrashCommands } from './commands/trash.js';
import { setupMemberCommands } from './commands/members.js';
import { setupMotorCommands } from './commands/motor.js';
import { setupFineCommands } from './commands/fines.js';
import { setupHelpCommands } from './commands/help.js';
import { setupScheduler } from './services/scheduler.js';

/**
 * Start lightweight HTTP health check server for Render Free Web Service compatibility.
 */
function startHealthCheckServer() {
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('🏡 Bhavanam Telegram Bot is online and healthy!\n');
  });

  server.listen(port, () => {
    console.log(`[HTTP] Health check server listening on port ${port}`);
  });
}


async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🏡 Starting Bhavanam Telegram Home Manager Bot...');

  // Start HTTP server for Render Free Web Service health check
  startHealthCheckServer();


  if (!config.botToken || config.botToken === 'your_telegram_bot_token_here') {
    console.error('\n❌ ERROR: BOT_TOKEN is missing or not set in .env file!');
    console.error('Please obtain a Telegram Bot Token from @BotFather on Telegram.');
    console.error('Copy .env.example to .env and paste your token in BOT_TOKEN=...\n');
    console.error('Example command to test local logic without token: npm run sim');
    process.exit(1);
  }

  const bot = new Telegraf(config.botToken);

  // Automatically capture and persist group chat ID when bot receives a message in a group
  bot.use((ctx, next) => {
    if (ctx.chat && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')) {
      storage.setChatId(ctx.chat.id);
    }
    return next();
  });

  // Register command modules
  setupHelpCommands(bot);
  setupTrashCommands(bot);
  setupMemberCommands(bot);
  setupMotorCommands(bot);
  setupFineCommands(bot);

  // Setup automated cron scheduling
  setupScheduler(bot);

  // Handle graceful shutdown
  process.once('SIGINT', () => {
    console.log('\n[Bot] Received SIGINT signal. Stopping bot...');
    bot.stop('SIGINT');
  });

  process.once('SIGTERM', () => {
    console.log('\n[Bot] Received SIGTERM signal. Stopping bot...');
    bot.stop('SIGTERM');
  });

  // Global error handler
  bot.catch((err, ctx) => {
    console.error(`[Telegraf Error] update type: ${ctx.updateType}`, err);
  });

  // Launch bot long polling with automatic retry handling for 409 Conflicts during Render deploys
  const maxRetries = 5;
  const delayMs = 6000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const botInfo = await bot.telegram.getMe();
      console.log(`✅ Bhavanam Bot (@${botInfo.username}) is online and listening for Telegram commands!`);
      console.log('----------------------------------------------------');
      
      // Clear any existing webhook to ensure long polling works cleanly
      await bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch(() => {});

      await bot.launch();
      break;
    } catch (err) {
      console.error(`❌ Launch attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries && (err.message.includes('409') || err.message.includes('Conflict'))) {
        console.log(`[Bot] Retrying connection in ${delayMs / 1000}s (waiting for previous instance to terminate)...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        process.exit(1);
      }
    }
  }
}

bootstrap();
