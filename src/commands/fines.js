import { fineService } from '../services/fineService.js';
import { formatFineDashboard, formatMention, escapeHtml } from '../utils/formatters.js';

export function setupFineCommands(bot) {
  /**
   * Command: /finelist or /fines
   */
  const handleFineList = async (ctx) => {
    try {
      const summary = fineService.getFinesSummary();
      const message = formatFineDashboard(summary);
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[FineCommand] Error fetching fine list:', err);
      ctx.reply('❌ ഫൈൻ കണക്കുകൾ ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  bot.command(['finelist', 'fines', 'fine_list'], handleFineList);

  /**
   * Command: /fine @user <amount> OR /payfine @user <amount>
   */
  const handleDeductFine = async (ctx) => {
    try {
      if (!fineService.isAdmin(ctx.from)) {
        return ctx.reply('⚠️ <b>അനുവാദമില്ല:</b> അഡ്മിനായ <b>അർജുന്</b> മാത്രമേ ഫൈൻ തുക ഒഴിവാക്കാനോ കുറയ്ക്കാനോ സാധിക്കൂ!', { parse_mode: 'HTML' });
      }

      const text = ctx.message.text.trim();
      const args = text.split(/\s+/).slice(1);

      if (args.length < 2) {
        return ctx.reply(
          '⚠️ ഉപയോഗിക്കേണ്ട രീതി: <code>/fine @username &lt;തുക&gt;</code>\nഉദാഹരണം: <code>/fine @haroshin 50</code>',
          { parse_mode: 'HTML' }
        );
      }

      const targetQuery = args[0];
      const amount = args[1];

      const result = fineService.deductFine(ctx.from, targetQuery, amount);

      if (!result.success) {
        if (result.reason === 'NOT_ADMIN') {
          return ctx.reply('⚠️ <b>അർജുന്</b> മാത്രമേ ഫൈൻ അടച്ചതായി രേഖപ്പെടുത്താൻ സാധിക്കൂ!', { parse_mode: 'HTML' });
        }
        if (result.reason === 'MEMBER_NOT_FOUND') {
          return ctx.reply(`⚠️ "${escapeHtml(targetQuery)}" എന്ന അംഗത്തെ ലിസ്റ്റിൽ കണ്ടെത്താൻ സാധിച്ചില്ല.`);
        }
        if (result.reason === 'INVALID_AMOUNT') {
          return ctx.reply('⚠️ കൃത്യമായ ഒരു സംഖ്യ നൽകുക (ഉദാഹരണം: <code>/fine @haroshin 50</code>).', { parse_mode: 'HTML' });
        }
        return ctx.reply('⚠️ ഫൈൻ കുറയ്ക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
      }

      const mention = formatMention(result.member);
      await ctx.reply(
        `✅ <b>ഫൈൻ അടച്ചത് രേഖപ്പെടുത്തി!</b> 💵\n━━━━━━━━━━━━━━━━━━━━━━\n${mention}-ന്റെ അക്കൗണ്ടിൽ നിന്ന് <b>₹${result.deductedAmount}</b> കുറച്ചു!\n💰 <b>ബാക്കി നൽകാനുള്ള ഫൈൻ തുക:</b> ₹${result.remainingBalance}\n━━━━━━━━━━━━━━━━━━━━━━`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[FineCommand] Error in fine deduction:', err);
      ctx.reply('❌ ഫൈൻ കുറയ്ക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  bot.command('fine', handleDeductFine);
  bot.command('payfine', handleDeductFine);
  bot.command('fine_pay', handleDeductFine);

  /**
   * Command: /addfine @user <amount>
   */
  bot.command('addfine', async (ctx) => {
    try {
      if (!fineService.isAdmin(ctx.from)) {
        return ctx.reply('⚠️ <b>അനുവാദമില്ല:</b> അഡ്മിനായ <b>അർജുന്</b> മാത്രമേ ഫൈൻ ചേർക്കാൻ സാധിക്കൂ!', { parse_mode: 'HTML' });
      }

      const text = ctx.message.text.trim();
      const args = text.split(/\s+/).slice(1);

      if (args.length < 2) {
        return ctx.reply('⚠️ ഉപയോഗിക്കേണ്ട രീതി: <code>/addfine @username &lt;തുക&gt;</code>', { parse_mode: 'HTML' });
      }

      const targetQuery = args[0].replace('@', '');
      const amount = parseFloat(args[1]);

      if (isNaN(amount) || amount <= 0) {
        return ctx.reply('⚠️ കൃത്യമായ ഒരു സംഖ്യ നൽകുക.');
      }

      const newBal = fineService.addFine(targetQuery, amount, 'Manual Fine Added by Arjun');
      await ctx.reply(`➕ <b>${escapeHtml(targetQuery)}</b>-ന്റെ അക്കൗണ്ടിലേക്ക് <b>₹${amount}</b> ഫൈൻ ചേർത്തു! (ആകെ ഫൈൻ: ₹${newBal})`, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[FineCommand] Error in addfine:', err);
      ctx.reply('❌ ഫൈൻ ചേർക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });
}
