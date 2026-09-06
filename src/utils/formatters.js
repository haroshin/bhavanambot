import { Markup } from 'telegraf';

/**
Helper to format a member mention (HTML link if telegramId exists, or @username, or bold name).
*/
export function formatMention(member) {
  if (!member) return 'ആരുമില്ല';
  if (member.telegramId) {
    return `<a href="tg://user?id=${member.telegramId}">${escapeHtml(member.name)}</a>`;
  }
  if (member.username && !member.username.startsWith('@')) {
    return `@${member.username}`;
  }
  if (member.username) {
    return member.username;
  }
  return `<b>${escapeHtml(member.name)}</b>`;
}

/**
 * Escapes special HTML characters for Telegram HTML mode.
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Returns inline keyboard markup with "Mark as Done" button for trash duty in Malayalam.
 */
export function getDoneButton() {
  return Markup.inlineKeyboard([
    Markup.button.callback('✅ വേസ്റ്റ് കളഞ്ഞു', 'complete_trash_task')
  ]);
}

/**
 * Returns inline keyboard markup with "Motor Turned ON" button for water system in Malayalam.
 */
export function getMotorButton() {
  return Markup.inlineKeyboard([
    Markup.button.callback('⚡ മോട്ടോർ ഓൺ ചെയ്തു', 'motor_turned_on')
  ]);
}

/**
 * Formats calendar duty schedule list for all members with DD-MM-YYYY dates.
 */
export function formatScheduleCalendar({ schedule, totalMembers }) {
  if (!schedule || schedule.length === 0) {
    return `📅 <b>BHAVANAM — DUTY CALENDAR</b> 🗓️\n\n<i>No members found.</i>`;
  }

  const rows = schedule.map((item, idx) => {
    const mention = formatMention(item.member);
    let tag = '';
    if (item.isToday) {
      tag = ' <b>[ഇന്ന് / Today]</b> 🔴';
    } else if (item.isTomorrow) {
      tag = ' <b>[നാളെ / Tomorrow]</b> 🟠';
    }
    return `${idx + 1}. ${mention} — <code>${item.dateStr}</code>${tag}`;
  }).join('\n');

  return `
📅 <b>BHAVANAM — DUTY CALENDAR SCHEDULE</b> 🗓️
━━━━━━━━━━━━━━━━━━━━━━
<i>(അടുത്ത ദിവസങ്ങളിലെ ഡ്യൂട്ടി പട്ടിക / Duty schedule with dates)</i>

${rows}

━━━━━━━━━━━━━━━━━━━━━━
<i>ഡ്യൂട്ടി സമയം: 5:30 PM (മോട്ടോർ) & 8:00 PM (വേസ്റ്റ്)</i>
`.trim();
}

/**
 * Formats user turn check response message.
 */
export function formatUserTurnInfo({ member, turnsRemaining, currentMember, totalMembers }) {
  const mention = formatMention(member);
  const currentMention = formatMention(currentMember);

  let statusText = '';
  if (turnsRemaining === 0) {
    statusText = `🚨 <b>ഇന്ന് താങ്കളുടെ ഡ്യൂട്ടി ദിവസമാണ്!</b> 🧹⚡\n<i>(Today is your duty turn!)</i>`;
  } else if (turnsRemaining === 1) {
    statusText = `⏭️ <b>താങ്കളുടെ അടുത്ത ഡ്യൂട്ടി നാളെയാണ്!</b>\n<i>(Your next duty is Tomorrow!)</i>`;
  } else {
    statusText = `📅 <b>താങ്കളുടെ അടുത്ത ഡ്യൂട്ടി ${turnsRemaining} ദിവസങ്ങൾക്ക് ശേഷമാണ്.</b>\n<i>(Your next duty is in ${turnsRemaining} days.)</i>`;
  }

  return `
🗓️ <b>BHAVANAM — TURN CHECKER</b> 👤
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>അംഗം (Member):</b> ${mention}
${statusText}

👤 <b>ഇന്നത്തെ ഡ്യൂട്ടി (Today's Duty):</b> ${currentMention}
📋 <b>ലിസ്റ്റിലെ സ്ഥാനം:</b> Position ${member.id || '?'} of ${totalMembers}
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats the primary Trash Duty alert message (8:00 PM) in Malayalam.
 */
export function formatTrashDutyAlert(assignedMember, nextMember) {
  const mention = formatMention(assignedMember);
  const nextMention = formatMention(nextMember);

  return `
🗑️ <b>വേസ്റ്റ് ക്ലീനിംഗ് ഡ്യൂട്ടി റിമൈൻഡർ</b> 🧹
━━━━━━━━━━━━━━━━━━━━━━
${mention}, ദയവായി വേസ്റ്റ് കളയുക! 🧼✨

📌 <b>സ്റ്റാറ്റസ്:</b> കാത്തിരിക്കുന്നു (PENDING)
<i>പൂർത്തിയാക്കിയ ശേഷം താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക! (രാത്രി 12:00-ന് മുമ്പ് വേസ്റ്റ് കളഞ്ഞില്ലെങ്കിൽ ₹50 ഫൈൻ അടയ്ക്കേണ്ടി വരും!)</i>

👥 <b>അടുത്ത ഊഴം:</b> ${nextMention}
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats task completion confirmation message in Malayalam.
 */
export function formatTaskCompleted(completedMember, nextMember) {
  const mention = formatMention(completedMember);
  const nextMention = formatMention(nextMember);

  return `
✅ <b>ഡ്യൂട്ടി പൂർത്തിയാക്കി!</b> 🧼🧹
━━━━━━━━━━━━━━━━━━━━━━
വേസ്റ്റ് കൃത്യമായി കളഞ്ഞതിന് നന്ദി ${mention}! വീട് വൃത്തിയായി സൂക്ഷിച്ചതിന് അഭിനന്ദനങ്ങൾ! 🏡✨

⏭️ <b>അടുത്ത ഊഴം:</b> ${nextMention}
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats the Water Motor alert message for 5:30 PM in Malayalam.
 */
export function formatWaterMotorAlert(assignedMember) {
  const mention = formatMention(assignedMember);

  return `
💧 <b>വാട്ടർ മോട്ടോർ റിമൈൻഡർ</b> 🚰
━━━━━━━━━━━━━━━━━━━━━━
${mention}, ദയവായി വാട്ടർ മോട്ടോർ ഓൺ ചെയ്യുക! ⚡🚰

📌 <i>വൈകുന്നേരം <b>6:30-ന് മുമ്പ്</b> താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക! (6:30-ന് ശേഷം മോട്ടോർ ഓൺ ചെയ്തില്ലെങ്കിൽ ₹50 ഫൈൻ അടയ്ക്കേണ്ടി വരും!)</i>
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats Water Motor turned on confirmation message in Malayalam.
 */
export function formatMotorTurnedOn(completedMember) {
  const mention = formatMention(completedMember);
  return `
✅ <b>വാട്ടർ മോട്ടോർ ഓൺ ചെയ്തു!</b> ⚡🚰
━━━━━━━━━━━━━━━━━━━━━━
വാട്ടർ മോട്ടോർ ഓൺ ചെയ്തതിന് നന്ദി ${mention}! 💧✨
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats 6:30 PM Water Motor penalty notification alert in Malayalam.
 */
export function formatMotorPenaltyAlert(penalty) {
  if (!penalty) return '';
  const mention = formatMention(penalty.member);

  return `
⚠️ <b>വാട്ടർ മോട്ടോർ ഫൈൻ പെനാൽറ്റി</b> 💸
━━━━━━━━━━━━━━━━━━━━━━
${mention} വൈകുന്നേരം 6:30-ന് മുമ്പ് വാട്ടർ മോട്ടോർ ഓൺ ചെയ്തില്ല!

➕ <b>+₹50 ഫൈൻ ചേർത്തു</b> (ആകെ നൽകാനുള്ള ഫൈൻ: ₹${penalty.newBalance})
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats fine balance dashboard message (Ranked by Highest Fine First) in Malayalam.
 */
export function formatFineDashboard({ memberFines, totalHouseFines }) {
  if (!memberFines || memberFines.length === 0) {
    return `💰 <b>ഭവനം — ഫൈൻ റാങ്കിംഗ് ബോർഡ്</b> 💸\n\n<i>അംഗങ്ങളാരും ലിസ്റ്റിൽ ഇല്ല.</i>`;
  }

  // Sort by highest fine balance descending
  const sortedFines = [...memberFines].sort((a, b) => b.balance - a.balance);

  const rows = sortedFines.map((item, idx) => {
    const mention = formatMention(item.member);
    const balanceStr = item.balance > 0 ? `<b>₹${item.balance}</b> ⚠️` : `₹0 ✅`;
    const rankPrefix = item.balance > 0 ? (idx === 0 ? '🔴 ' : (idx === 1 ? '🟠 ' : '🟡 ')) : '🟢 ';
    return `${rankPrefix}#${idx + 1} ${mention}: ${balanceStr}`;
  }).join('\n');

  return `
💰 <b>ഭവനം — ഫൈൻ റാങ്കിംഗ് ബോർഡ്</b> 💸
━━━━━━━━━━━━━━━━━━━━━━
<i>(ഏറ്റവും ഉയർന്ന ഫൈൻ തുക അടിസ്ഥാനമാക്കി റാങ്ക് ചെയ്തത്)</i>

${rows}

━━━━━━━━━━━━━━━━━━━━━━
💵 <b>വീട്ടിലെ ആകെ നൽകാനുള്ള ഫൈൻ തുക:</b> <b>₹${totalHouseFines}</b>
<i>അഡ്മിൻ (അർജുൻ) ഫൈൻ അടച്ചതായി രേഖപ്പെടുത്താൻ: <code>/fine @user &lt;തുക&gt;</code></i>
`.trim();
}

/**
 * Formats midnight penalty notification alert in Malayalam.
 */
export function formatMidnightPenaltyAlert(penalty) {
  if (!penalty) return '';
  const mention = formatMention(penalty.member);

  return `
⚠️ <b>മിഡ്‌നൈറ്റ് ഫൈൻ പെനാൽറ്റി</b> 💸
━━━━━━━━━━━━━━━━━━━━━━
${mention} രാത്രി 12:00 മണിക്ക് മുമ്പ് വേസ്റ്റ് ക്ലീനിംഗ് ഡ്യൂട്ടി പൂർത്തിയാക്കിയില്ല!

➕ <b>+₹50 ഫൈൻ ചേർത്തു</b> (ആകെ നൽകാനുള്ള ഫൈൻ: ₹${penalty.newBalance})
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Formats status dashboard message in Malayalam.
 */
export function formatTrashStatus({ members, currentIndex, currentMember, nextMember, pendingTask, history }) {
  if (!members || members.length === 0) {
    return `⚠️ <b>അംഗങ്ങളാരും ലിസ്റ്റിൽ ഇല്ല.</b>\nഅംഗങ്ങളെ ചേർക്കാൻ <code>/addmember &lt;പേര്&gt;</code> ഉപയോഗിക്കുക!`;
  }

  const isPending = pendingTask && pendingTask.status === 'PENDING';
  const activeDutyMember = isPending ? pendingTask.assignedMember : currentMember;

  let memberRows = members.map((m, idx) => {
    const isCurrent = idx === currentIndex;
    let badge = '  ';
    if (isCurrent) {
      badge = isPending ? '⏳ <b>[പൂർത്തിയാക്കാൻ കാത്തിരിക്കുന്നു]</b>' : '➡️ <b>[ഇപ്പോഴത്തെ ഡ്യൂട്ടി]</b>';
    }
    const num = `${idx + 1}.`;
    return `${badge} ${num} ${escapeHtml(m.name)} (${m.username ? '@' + m.username.replace('@', '') : 'handle ഇല്ല'})`;
  }).join('\n');

  let historyRows = '<i>കഴിഞ്ഞ ഡ്യൂട്ടി ഹിസ്റ്ററികൾ ലഭ്യമല്ല.</i>';
  if (history && history.length > 0) {
    historyRows = history.slice(0, 5).map(h => {
      const dateStr = new Date(h.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `• <b>${escapeHtml(h.assignedTo)}</b> — ${dateStr} (${h.triggeredBy || 'Manual'})`;
    }).join('\n');
  }

  return `
📊 <b>ഭവനം — വേസ്റ്റ് ഡ്യൂട്ടി സ്റ്റാറ്റസ്</b> 🧹
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>ഇപ്പോഴത്തെ ഡ്യൂട്ടി:</b> ${formatMention(activeDutyMember)} ${isPending ? '<i>(ബട്ടൺ അമർത്താൻ കാത്തിരിക്കുന്നു)</i>' : ''}
⏭️ <b>അടുത്ത ഊഴം:</b> ${formatMention(nextMember)}

📋 <b>അംഗങ്ങളുടെ ലിസ്റ്റിലെ ക്രമം (${members.length} പേർ):</b>
${memberRows}

📜 <b>കഴിഞ്ഞ ഡ്യൂട്ടി ഹിസ്റ്ററി (അവസാന 5 എണ്ണം):</b>
${historyRows}
━━━━━━━━━━━━━━━━━━━━━━
<i>ഡ്യൂട്ടി ട്രിഗർ ചെയ്യാൻ <code>/trash</code> ഉപയോഗിക്കുക!</i>
`.trim();
}

/**
 * Formats Help menu with concise command triggers list.
 */
export function formatHelpMessage() {
  return `
🏡 <b>BHAVANAM BOT COMMAND TRIGGERS</b> 🤖
━━━━━━━━━━━━━━━━━━━━━━
📅 <b>For Duty Calendar:</b> <code>/turns</code> or <code>/turn</code>
💰 <b>For House Fine List:</b> <code>/finelist</code> or <code>/fines</code>
💵 <b>For Deducting Fine:</b> <code>/fine @username &lt;amount&gt;</code> <i>(Admin Arjun)</i>
💧 <b>For Water Motor:</b> <code>/motor</code>
🗑️ <b>For Trash Duty:</b> <code>/trash</code>
📊 <b>For Duty Status:</b> <code>/status</code> or <code>/trash_status</code>
👥 <b>For Member List:</b> <code>/listmembers</code>
━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
