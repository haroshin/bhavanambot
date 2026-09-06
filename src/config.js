import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Load environment variables from .env if present
dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  targetChatId: process.env.TARGET_CHAT_ID || '',
  enableScheduledReminders: process.env.ENABLE_SCHEDULED_REMINDERS !== 'false', // Default enabled
  trashScheduleCron: process.env.TRASH_SCHEDULE_CRON || '0 20 * * *', // Default: Everyday at 8 PM (20:00)
  rootDir,
  dataDir: path.join(rootDir, 'data'),
  membersFilePath: path.join(rootDir, 'data', 'members.json'),
  stateFilePath: path.join(rootDir, 'data', 'state.json'),
  finesFilePath: path.join(rootDir, 'data', 'fines.json')
};
