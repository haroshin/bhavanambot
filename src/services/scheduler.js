import cron from 'node-cron';
import { config } from '../config.js';
import { storage } from '../storage/store.js';
import { roundRobinService } from './roundRobin.js';
import { fineService } from './fineService.js';
import { 
  formatTrashDutyAlert, 
  getDoneButton, 
  formatWaterMotorAlert, 
  getMotorButton, 
  formatMotorPenaltyAlert, 
  formatMidnightPenaltyAlert 
} from '../utils/formatters.js';

export function setupScheduler(bot) {
  if (!config.enableScheduledReminders) {
    console.log('[Scheduler] Scheduled reminders are disabled (ENABLE_SCHEDULED_REMINDERS=false).');
    return;
  }

  const timezone = config.timezone || 'Asia/Kolkata';

  // ----------------------------------------------------
  // 1. Daily 5:30 PM Water Motor Reminder (30 17 * * *)
  // ----------------------------------------------------
  const motorCron = '30 17 * * *';
  console.log(`[Scheduler] Daily 5:30 PM Water Motor reminder active (cron: "${motorCron}", timezone: "${timezone}")`);

  cron.schedule(motorCron, async () => {
    console.log('[Scheduler] Daily 5:30 PM Water Motor cron job triggered.');
    try {
      const targetChatId = storage.getChatId();
      if (!targetChatId) {
        console.warn('[Scheduler] Group Chat ID not registered for motor reminder.');
        return;
      }

      const result = roundRobinService.triggerMotorDuty('Daily 5:30 PM Cron Job');
      if (!result.success) {
        console.warn('[Scheduler] Motor duty trigger skipped:', result.reason);
        return;
      }

      const message = formatWaterMotorAlert(result.assignedMember);
      await bot.telegram.sendMessage(targetChatId, message, { parse_mode: 'HTML', ...getMotorButton() });
      console.log(`[Scheduler] Daily 5:30 PM Water Motor alert sent to Chat ID: ${targetChatId}`);
    } catch (err) {
      console.error('[Scheduler] Failed to send scheduled water motor alert:', err);
    }
  }, { timezone });

  // ----------------------------------------------------
  // 2. Daily 6:30 PM Water Motor Penalty Check (30 18 * * *)
  // ----------------------------------------------------
  const motorPenaltyCron = '30 18 * * *';
  console.log(`[Scheduler] Daily 6:30 PM Water Motor penalty check active (cron: "${motorPenaltyCron}", timezone: "${timezone}")`);

  cron.schedule(motorPenaltyCron, async () => {
    console.log('[Scheduler] Daily 6:30 PM Water Motor penalty check triggered.');
    try {
      const targetChatId = storage.getChatId();
      const penalty = fineService.checkMotorPenalty();

      if (penalty && targetChatId) {
        const alertMsg = formatMotorPenaltyAlert(penalty);
        await bot.telegram.sendMessage(targetChatId, alertMsg, { parse_mode: 'HTML' });
        console.log(`[Scheduler] 6:30 PM Motor penalty alert sent to Chat ID ${targetChatId} for ${penalty.member.name}.`);
      } else {
        console.log('[Scheduler] 6:30 PM Motor check: Water motor was turned ON on time! No penalty.');
      }
    } catch (err) {
      console.error('[Scheduler] Error running 6:30 PM motor penalty check:', err);
    }
  }, { timezone });

  // ----------------------------------------------------
  // 3. Daily 8:00 PM Trash Duty Reminder (0 20 * * *)
  // ----------------------------------------------------
  const trashCron = config.trashScheduleCron || '0 20 * * *';
  console.log(`[Scheduler] Daily 8:00 PM Trash Duty reminder active (cron: "${trashCron}", timezone: "${timezone}")`);

  cron.schedule(trashCron, async () => {
    console.log('[Scheduler] Daily 8:00 PM Trash Duty cron job triggered.');
    try {
      const targetChatId = storage.getChatId();
      if (!targetChatId) {
        console.warn('[Scheduler] Group Chat ID not registered for trash reminder.');
        return;
      }

      const result = roundRobinService.triggerDuty('Daily 8 PM Cron Job');
      if (!result.success) {
        console.warn('[Scheduler] Duty trigger skipped:', result.reason);
        return;
      }

      const message = formatTrashDutyAlert(result.assignedMember, result.nextMember);
      await bot.telegram.sendMessage(targetChatId, message, { parse_mode: 'HTML', ...getDoneButton() });
      console.log(`[Scheduler] Daily 8 PM Trash duty alert sent to Chat ID: ${targetChatId}`);
    } catch (err) {
      console.error('[Scheduler] Failed to send scheduled trash duty alert:', err);
    }
  }, { timezone });

  // ----------------------------------------------------
  // 4. Daily 12:00 AM Midnight Trash Penalty Check (0 0 * * *)
  // ----------------------------------------------------
  const midnightCron = '0 0 * * *';
  console.log(`[Scheduler] Daily 12:00 AM Midnight penalty check active (cron: "${midnightCron}", timezone: "${timezone}")`);

  cron.schedule(midnightCron, async () => {
    console.log('[Scheduler] Daily 12:00 AM Midnight penalty cron job triggered.');
    try {
      const targetChatId = storage.getChatId();
      const penalty = fineService.checkTrashMidnightPenalty();

      if (penalty && targetChatId) {
        const alertMsg = formatMidnightPenaltyAlert(penalty);
        await bot.telegram.sendMessage(targetChatId, alertMsg, { parse_mode: 'HTML' });
        console.log(`[Scheduler] Midnight trash penalty alert sent to Chat ID ${targetChatId} for ${penalty.member.name}.`);
      } else {
        console.log('[Scheduler] Midnight check: Trash duty was completed before midnight! No penalty.');
      }
    } catch (err) {
      console.error('[Scheduler] Error running midnight trash penalty check:', err);
    }
  }, { timezone });
}
