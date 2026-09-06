import { roundRobinService } from '../services/roundRobin.js';
import { formatTrashDutyAlert, formatTrashStatus, formatTaskCompleted, getDoneButton, formatUserTurnInfo, formatScheduleCalendar } from '../utils/formatters.js';

export function setupTrashCommands(bot) {
  /**
   * Command: /turn, /turns, /schedule, /myturn
   * Displays the full calendar schedule for all members with DD-MM-YYYY dates.
   */
  bot.command(['turn', 'turns', 'schedule', 'myturn', 'my_turn'], async (ctx) => {
    try {
      const result = roundRobinService.getScheduleCalendar();

      if (!result.success) {
        return ctx.reply('⚠️ Members list is empty.', { parse_mode: 'HTML' });
      }

      const message = formatScheduleCalendar(result);
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[TrashCommand] Error in /turn:', err);
      ctx.reply('❌ An error occurred while generating turn schedule.');
    }
  });
  /**
   * Command: /trash or /cleantrash
   */
  const handleTrash = async (ctx) => {
    try {
      const senderName = ctx.from ? (ctx.from.first_name || ctx.from.username) : 'Telegram';
      const result = roundRobinService.triggerDuty(`Triggers: ${senderName}`);

      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`, { parse_mode: 'HTML' });
      }

      const message = formatTrashDutyAlert(result.assignedMember, result.nextMember);
      await ctx.reply(message, { parse_mode: 'HTML', ...getDoneButton() });
    } catch (err) {
      console.error('[TrashCommand] Error in /trash:', err);
      ctx.reply('❌ വേസ്റ്റ് ക്ലീനിംഗ് അലേർട്ട് അയക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  bot.command('trash', handleTrash);
  bot.command('cleantrash', handleTrash);
  bot.command('clean_trash', handleTrash);

  /**
   * Action Handler: Inline Button [ ✅ വേസ്റ്റ് കളഞ്ഞു ]
   */
  bot.action('complete_trash_task', async (ctx) => {
    try {
      console.log(`[TrashAction] "വേസ്റ്റ് കളഞ്ഞു" button clicked by user:`, {
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        username: ctx.from.username
      });

      const result = roundRobinService.completeTask(ctx.from);

      if (!result.success) {
        if (result.reason === 'NO_PENDING_TASK') {
          return ctx.answerCbQuery('ℹ️ നിലവിൽ പൂര്ത്തിയാക്കാന് ബാക്കിയുള്ള വേസ്റ്റ് ഡ്യൂട്ടികൾ ഒന്നുമില്ല.', { show_alert: true });
        }
        if (result.reason === 'NOT_ASSIGNED_USER') {
          const assigned = result.assignedMember;
          const assignedName = assigned ? (assigned.name || assigned.username) : 'ഡ്യൂട്ടിയുള്ള ആൾ';
          return ctx.answerCbQuery(`⚠️ ഡ്യൂട്ടിയുള്ള ആൾക്ക് (${assignedName}) മാത്രമേ വേസ്റ്റ് കളഞ്ഞു എന്ന് മാർക്ക് ചെയ്യാൻ സാധിക്കൂ!`, { show_alert: true });
        }
        return ctx.answerCbQuery('⚠️ ഡ്യൂട്ടി പൂർത്തിയാക്കാൻ സാധിച്ചില്ല.', { show_alert: true });
      }

      await ctx.answerCbQuery('✅ വേസ്റ്റ് ഡ്യൂട്ടി പൂർത്തിയാക്കി!');

      const completedMsg = formatTaskCompleted(result.completedMember, result.nextMember);
      try {
        await ctx.editMessageText(completedMsg, { parse_mode: 'HTML' });
      } catch {
        await ctx.reply(completedMsg, { parse_mode: 'HTML' });
      }
    } catch (err) {
      console.error('[TrashAction] Error handling complete_trash_task:', err);
      try {
        await ctx.answerCbQuery('❌ തടസ്സം നേരിട്ടു.', { show_alert: true });
      } catch {}
    }
  });

  /**
   * Handler for /done command and plain "done" text.
   */
  const handleDone = async (ctx) => {
    try {
      const result = roundRobinService.completeTask(ctx.from);

      if (!result.success) {
        if (result.reason === 'NO_PENDING_TASK') {
          return ctx.reply('ℹ️ നിലവിൽ പൂർത്തിയാക്കാൻ ബാക്കിയുള്ള വേസ്റ്റ് ഡ്യൂട്ടികൾ ഒന്നുമില്ല. അടുത്ത ഊഴത്തിന് <code>/trash</code> ഉപയോഗിക്കുക.', { parse_mode: 'HTML' });
        }
        if (result.reason === 'NOT_ASSIGNED_USER') {
          const assigned = result.assignedMember;
          const assignedName = assigned ? (assigned.name || assigned.username) : 'ഡ്യൂട്ടിയുള്ള ആൾ';
          return ctx.reply(
            `⚠️ ഡ്യൂട്ടിയുള്ള ആൾക്ക് (<b>${assignedName}</b>) മാത്രമേ ഈ ഡ്യൂട്ടി പൂർത്തിയാക്കാൻ സാധിക്കൂ!`,
            { parse_mode: 'HTML' }
          );
        }
        return;
      }

      const message = formatTaskCompleted(result.completedMember, result.nextMember);
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[TrashCommand] Error completing task:', err);
    }
  };

  bot.command('done', handleDone);
  bot.hears(/^done$/i, handleDone);

  /**
   * Command: /trash_status or /status
   */
  bot.command(['trash_status', 'trashstatus', 'status'], async (ctx) => {
    try {
      const statusData = roundRobinService.getStatus();
      const message = formatTrashStatus(statusData);
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[TrashCommand] Error in /trash_status:', err);
      ctx.reply('❌ സ്റ്റാറ്റസ് ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /skip_trash
   */
  bot.command(['skip_trash', 'skiptrash'], async (ctx) => {
    try {
      const result = roundRobinService.skipTurn();
      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`, { parse_mode: 'HTML' });
      }

      const skippedName = result.skippedMember ? result.skippedMember.name : 'Unknown';
      const nextName = result.nextMember ? result.nextMember.name : 'Unknown';

      await ctx.reply(
        `⏭️ <b>${skippedName}-ന്റെ ഡ്യൂട്ടി സ്കിപ്പ് ചെയ്തു.</b>\n➡️ അടുത്ത ഡ്യൂട്ടി <b>${nextName}</b>-നാണ്.`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[TrashCommand] Error in /skip_trash:', err);
      ctx.reply('❌ ഡ്യൂട്ടി സ്കിപ്പ് ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /set_turn <name/index>
   */
  bot.command(['set_turn', 'setturn'], async (ctx) => {
    try {
      const text = ctx.message.text.trim();
      const args = text.split(/\s+/).slice(1).join(' ');

      if (!args) {
        return ctx.reply('⚠️ ഉപയോഗിക്കേണ്ട രീതി: <code>/set_turn &lt;പേര് അല്ലെങ്കിൽ നമ്പർ&gt;</code>\nഉദാഹരണം: <code>/set_turn Arjun</code>', { parse_mode: 'HTML' });
      }

      const result = roundRobinService.setTurn(args);
      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`, { parse_mode: 'HTML' });
      }

      await ctx.reply(
        `✅ <b>ഡ്യൂട്ടി മാറ്റം വരുത്തി!</b>\n➡️ നിലവിലെ ഡ്യൂട്ടി <b>${result.assignedMember.name}</b>-നായി ക്രമീകരിച്ചു.`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[TrashCommand] Error in /set_turn:', err);
      ctx.reply('❌ ഡ്യൂട്ടി മാറ്റുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });
}
