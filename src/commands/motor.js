import { roundRobinService } from '../services/roundRobin.js';
import { formatWaterMotorAlert, formatMotorTurnedOn, getMotorButton } from '../utils/formatters.js';

export function setupMotorCommands(bot) {
  /**
   * Command: /motor or /water_motor or /motor_on
   */
  const handleMotorAlert = async (ctx) => {
    try {
      const senderName = ctx.from ? (ctx.from.first_name || ctx.from.username) : 'Telegram';
      const result = roundRobinService.triggerMotorDuty(`Triggers: ${senderName}`);

      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`, { parse_mode: 'HTML' });
      }

      const message = formatWaterMotorAlert(result.assignedMember);
      await ctx.reply(message, { parse_mode: 'HTML', ...getMotorButton() });
    } catch (err) {
      console.error('[MotorCommand] Error triggering motor alert:', err);
      ctx.reply('❌ വാട്ടർ മോട്ടോർ അലേർട്ട് അയക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  bot.command(['motor', 'water_motor', 'watermotor', 'motor_on'], handleMotorAlert);

  /**
   * Action Handler: Inline Button [ ⚡ മോട്ടോർ ഓൺ ചെയ്തു ]
   */
  bot.action('motor_turned_on', async (ctx) => {
    try {
      const user = ctx.from;
      console.log(`[MotorAction] Water motor button clicked by user:`, {
        id: user.id,
        first_name: user.first_name,
        username: user.username
      });

      const result = roundRobinService.completeMotorTask(user);

      if (!result.success) {
        if (result.reason === 'NOT_ASSIGNED_USER') {
          const assigned = result.assignedMember;
          const assignedName = assigned ? (assigned.name || assigned.username) : 'ഡ്യൂട്ടിയുള്ള ആൾ';
          return ctx.answerCbQuery(`⚠️ ഡ്യൂട്ടിയുള്ള ആൾക്ക് (${assignedName}) മാത്രമേ മോട്ടോർ ഓൺ ചെയ്തു എന്ന് മാർക്ക് ചെയ്യാൻ സാധിക്കൂ!`, { show_alert: true });
        }
        return ctx.answerCbQuery('⚠️ മാർക്ക് ചെയ്യാൻ സാധിച്ചില്ല.', { show_alert: true });
      }

      await ctx.answerCbQuery('⚡ വാട്ടർ മോട്ടോർ ഓൺ ചെയ്തു എന്ന് മാർക്ക് ചെയ്തു!');

      const completedMsg = formatMotorTurnedOn(result.completedMember);
      try {
        await ctx.editMessageText(completedMsg, { parse_mode: 'HTML' });
      } catch {
        await ctx.reply(completedMsg, { parse_mode: 'HTML' });
      }
    } catch (err) {
      console.error('[MotorAction] Error handling motor_turned_on:', err);
      try {
        await ctx.answerCbQuery('❌ തടസ്സം നേരിട്ടു.', { show_alert: true });
      } catch {}
    }
  });
}
