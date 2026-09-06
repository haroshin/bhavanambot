import { roundRobinService } from '../services/roundRobin.js';
import { escapeHtml } from '../utils/formatters.js';

export function setupMemberCommands(bot) {
  /**
   * Command: /listmembers
   */
  bot.command(['listmembers', 'members'], async (ctx) => {
    try {
      const { members, currentIndex } = roundRobinService.getStatus();
      if (!members || members.length === 0) {
        return ctx.reply('⚠️ അംഗങ്ങളാരും ലിസ്റ്റിൽ ഇല്ല.');
      }

      const rows = members.map((m, i) => {
        const marker = i === currentIndex ? '➡️ [ഇപ്പോഴത്തെ ഡ്യൂട്ടി]' : '  ';
        return `${marker} ${i + 1}. <b>${escapeHtml(m.name)}</b> (${m.username ? '@' + m.username.replace('@', '') : 'handle ഇല്ല'})`;
      }).join('\n');

      const message = `📋 <b>ഭവനം — അംഗങ്ങളുടെ ലിസ്റ്റ് (${members.length} പേർ):</b>\n\n${rows}`;
      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[MemberCommand] Error in /listmembers:', err);
      ctx.reply('❌ അംഗങ്ങളുടെ ലിസ്റ്റ് ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /addmember <name>
   */
  bot.command('addmember', async (ctx) => {
    try {
      const text = ctx.message.text.trim();
      const args = text.split(/\s+/).slice(1);

      if (args.length === 0) {
        return ctx.reply('⚠️ ഉപയോഗിക്കേണ്ട രീതി: <code>/addmember &lt;പേര് അല്ലെങ്കിൽ @username&gt;</code>', { parse_mode: 'HTML' });
      }

      const input = args.join(' ');
      const result = roundRobinService.addMember(input);

      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`);
      }

      await ctx.reply(
        `✅ <b>${escapeHtml(result.member.name)}</b>-നെ ഡ്യൂട്ടി ലിസ്റ്റിൽ ചേർത്തു! (ആകെ അംഗങ്ങൾ: ${result.totalMembers})`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[MemberCommand] Error in /addmember:', err);
      ctx.reply('❌ അംഗത്തെ ചേർക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /removemember <name/index>
   */
  bot.command('removemember', async (ctx) => {
    try {
      const text = ctx.message.text.trim();
      const args = text.split(/\s+/).slice(1).join(' ');

      if (!args) {
        return ctx.reply('⚠️ ഉപയോഗിക്കേണ്ട രീതി: <code>/removemember &lt;പേര് അല്ലെങ്കിൽ നമ്പർ&gt;</code>', { parse_mode: 'HTML' });
      }

      const result = roundRobinService.removeMember(args);

      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`);
      }

      await ctx.reply(
        `🗑️ <b>${escapeHtml(result.removedMember.name)}</b>-നെ ലിസ്റ്റിൽ നിന്ന് ഒഴിവാക്കി. (ബാക്കി അംഗങ്ങൾ: ${result.remainingCount})`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[MemberCommand] Error in /removemember:', err);
      ctx.reply('❌ അംഗത്തെ ഒഴിവാക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /join_trash (Self-registration)
   */
  bot.command(['join_trash', 'jointrash'], async (ctx) => {
    try {
      const user = ctx.from;
      if (!user) return;

      const name = user.first_name || user.username || `User_${user.id}`;
      const username = user.username || name;
      const telegramId = user.id;

      const result = roundRobinService.addMember(name, username, telegramId);
      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`);
      }

      await ctx.reply(
        `🎉 <b>${escapeHtml(name)}</b> ഡ്യൂട്ടി ലിസ്റ്റിൽ ജോയിൻ ചെയ്തു!`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[MemberCommand] Error in /join_trash:', err);
      ctx.reply('❌ ഡ്യൂട്ടിയിൽ ജോയിൻ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });

  /**
   * Command: /leave_trash (Self-removal)
   */
  bot.command(['leave_trash', 'leavetrash'], async (ctx) => {
    try {
      const user = ctx.from;
      if (!user) return;

      const identifier = user.username ? `@${user.username}` : (user.first_name || String(user.id));
      const result = roundRobinService.removeMember(identifier);

      if (!result.success) {
        return ctx.reply(`⚠️ ${result.reason}`);
      }

      await ctx.reply(
        `👋 <b>${escapeHtml(result.removedMember.name)}</b> ഡ്യൂട്ടി ലിസ്റ്റിൽ നിന്ന് ലീവായി.`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[MemberCommand] Error in /leave_trash:', err);
      ctx.reply('❌ ഡ്യൂട്ടി ലീവാകുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  });
}
