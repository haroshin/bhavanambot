import { formatHelpMessage } from '../utils/formatters.js';

export function setupHelpCommands(bot) {
  /**
   * Command: /start
   */
  bot.command('start', async (ctx) => {
    const welcome = `
🏡 <b>BHAVANAM — HOME MANAGEMENT BOT</b> 🤖

വീട്ടിലെ കാര്യങ്ങൾ (വാട്ടർ മോട്ടോർ, വേസ്റ്റ് ക്ലീനിംഗ് ഡ്യൂട്ടി, ഫൈൻ കണക്കുകൾ) കൃത്യമായി മാനേജ് ചെയ്യാൻ ഞാൻ സഹായിക്കാം.

കമാൻഡുകൾ കാണാൻ <code>/help</code> അല്ലെങ്കിൽ <code>help</code> ടൈപ്പ് ചെയ്യുക!
`.trim();
    await ctx.reply(welcome, { parse_mode: 'HTML' });
  });

  /**
   * Command: /help or plain text "help" / "Help" / "HELP"
   * Displays the concise triggers menu.
   */
  const handleHelp = async (ctx) => {
    try {
      const message = formatHelpMessage();
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[HelpCommand] Error in help:', err);
      ctx.reply('❌ An error occurred generating help response.');
    }
  };

  bot.command('help', handleHelp);
  bot.hears(/^\s*help\s*$/i, handleHelp);
}
