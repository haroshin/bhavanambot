import { storage } from '../storage/store.js';

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const roundRobinService = {
  /**
   * Get duty calendar schedule for all members with DD-MM-YYYY dates.
   */
  getScheduleCalendar() {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    const state = storage.getState();
    const currentIndex = (state.currentIndex || 0) % members.length;
    const now = new Date();

    // Check if today's task was already completed today
    let todayCompleted = false;
    if (state.history && state.history.length > 0 && state.history[0].completedAt) {
      if (isSameDay(state.history[0].completedAt, now) && (!state.pendingTask || state.pendingTask.status !== 'PENDING')) {
        todayCompleted = true;
      }
    }

    const dateOffset = todayCompleted ? 1 : 0;
    const schedule = [];

    for (let i = 0; i < members.length; i++) {
      const idx = (currentIndex + i) % members.length;
      const member = members[idx];

      const dutyDate = new Date(now);
      dutyDate.setDate(now.getDate() + i + dateOffset);

      const day = String(dutyDate.getDate()).padStart(2, '0');
      const month = String(dutyDate.getMonth() + 1).padStart(2, '0');
      const year = dutyDate.getFullYear();
      const dateStr = `${day}-${month}-${year}`;

      const totalOffsetDays = i + dateOffset;

      schedule.push({
        member,
        dateStr,
        stepIndex: i,
        isToday: totalOffsetDays === 0,
        isTomorrow: totalOffsetDays === 1
      });
    }

    return {
      success: true,
      schedule,
      totalMembers: members.length
    };
  },

  /**
   * Get turn details for a specific user.
   */
  getUserTurnInfo(userQueryOrObj) {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    const state = storage.getState();
    const currentIndex = (state.currentIndex || 0) % members.length;
    const now = new Date();

    let todayCompleted = false;
    if (state.history && state.history.length > 0 && state.history[0].completedAt) {
      if (isSameDay(state.history[0].completedAt, now) && (!state.pendingTask || state.pendingTask.status !== 'PENDING')) {
        todayCompleted = true;
      }
    }

    const dateOffset = todayCompleted ? 1 : 0;

    let targetIndex = -1;

    // Search by user object or string query
    if (typeof userQueryOrObj === 'object' && userQueryOrObj !== null) {
      const uId = userQueryOrObj.id;
      const uUsername = (userQueryOrObj.username || '').replace('@', '').toLowerCase();
      const uName = (userQueryOrObj.first_name || '').toLowerCase();

      targetIndex = members.findIndex(m => 
        (m.telegramId && uId && String(m.telegramId) === String(uId)) ||
        (m.username && uUsername && m.username.replace('@', '').toLowerCase() === uUsername) ||
        (m.name && uName && m.name.toLowerCase() === uName)
      );
    } else if (typeof userQueryOrObj === 'string' && userQueryOrObj.trim()) {
      const cleanQuery = userQueryOrObj.replace('@', '').toLowerCase().trim();
      targetIndex = members.findIndex(m => 
        (m.name && m.name.toLowerCase() === cleanQuery) ||
        (m.username && m.username.toLowerCase() === cleanQuery)
      );
    }

    if (targetIndex === -1) {
      return { success: false, reason: 'MEMBER_NOT_FOUND' };
    }

    const targetMember = members[targetIndex];
    const currentMember = members[currentIndex];

    const rawStepIndex = (targetIndex - currentIndex + members.length) % members.length;
    const turnsRemaining = rawStepIndex + dateOffset;

    return {
      success: true,
      member: targetMember,
      currentMember,
      turnsRemaining,
      memberPosition: targetIndex + 1,
      totalMembers: members.length,
      pendingTask: state.pendingTask || null
    };
  },

  /**
   * Get overall rotation status and list of members.
   */
  getStatus() {
    const members = storage.getMembers();
    const state = storage.getState();

    let currentIndex = state.currentIndex || 0;
    if (members.length > 0) {
      currentIndex = currentIndex % members.length;
    } else {
      currentIndex = 0;
    }

    const currentMember = members[currentIndex] || null;
    const nextIndex = members.length > 0 ? (currentIndex + 1) % members.length : 0;
    const nextMember = members[nextIndex] || null;

    return {
      members,
      currentIndex,
      currentMember,
      nextMember,
      pendingTask: state.pendingTask || null,
      pendingMotorTask: state.pendingMotorTask || null,
      lastTriggered: state.lastTriggered,
      history: state.history || []
    };
  },

  /**
   * Triggers trash duty: assigns current turn member and creates pending task state.
   */
  triggerDuty(triggeredBy = 'Manual') {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    const state = storage.getState();
    let currentIndex = (state.currentIndex || 0) % members.length;

    // If there is already a pending trash task, return existing assigned member
    if (state.pendingTask && state.pendingTask.status === 'PENDING') {
      const assignedMember = state.pendingTask.assignedMember;
      const nextIndex = (currentIndex + 1) % members.length;
      return {
        success: true,
        assignedMember,
        nextMember: members[nextIndex],
        isAlreadyPending: true
      };
    }

    const assignedMember = members[currentIndex];
    const nextIndex = (currentIndex + 1) % members.length;
    const nextMember = members[nextIndex];

    state.pendingTask = {
      assignedMember,
      assignedAt: new Date().toISOString(),
      triggeredBy,
      status: 'PENDING'
    };
    state.lastTriggered = new Date().toISOString();
    storage.saveState(state);

    return {
      success: true,
      assignedMember,
      nextMember,
      isAlreadyPending: false
    };
  },

  /**
   * Triggers water motor duty: assigns the SAME round-robin member on duty.
   */
  triggerMotorDuty(triggeredBy = 'Manual') {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    const state = storage.getState();
    let currentIndex = (state.currentIndex || 0) % members.length;

    // Use current pending trash assigned member if active, otherwise member at currentIndex
    const assignedMember = (state.pendingTask && state.pendingTask.assignedMember) 
      ? state.pendingTask.assignedMember 
      : members[currentIndex];

    state.pendingMotorTask = {
      assignedMember,
      assignedAt: new Date().toISOString(),
      triggeredBy,
      status: 'PENDING'
    };
    storage.saveState(state);

    return {
      success: true,
      assignedMember
    };
  },

  /**
   * Complete pending water motor task when assigned member clicks button or types command.
   */
  completeMotorTask(senderUser) {
    const state = storage.getState();
    const members = storage.getMembers();

    if (!state.pendingMotorTask || state.pendingMotorTask.status !== 'PENDING') {
      // If no pending motor task, check current round-robin assignee
      const currentIndex = (state.currentIndex || 0) % members.length;
      const currentMember = members[currentIndex];
      return {
        success: true,
        completedMember: senderUser ? { name: senderUser.first_name || senderUser.username } : currentMember
      };
    }

    const assigned = state.pendingMotorTask.assignedMember;

    // Verify sender matches assigned member
    let isMatch = false;

    if (senderUser) {
      const senderId = senderUser.id;
      const senderUsername = (senderUser.username || '').replace('@', '').toLowerCase();
      const senderFirstName = (senderUser.first_name || '').toLowerCase();
      const senderFullName = `${senderUser.first_name || ''} ${senderUser.last_name || ''}`.trim().toLowerCase();

      const assignedId = assigned.telegramId;
      const assignedUsername = (assigned.username || '').replace('@', '').toLowerCase();
      const assignedName = (assigned.name || '').toLowerCase();

      if (assignedId && senderId && String(assignedId) === String(senderId)) {
        isMatch = true;
      } else if (assignedUsername && senderUsername && assignedUsername === senderUsername) {
        isMatch = true;
      } else if (assignedName && (senderFirstName === assignedName || senderFullName === assignedName || senderUsername === assignedName)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return {
        success: false,
        reason: 'NOT_ASSIGNED_USER',
        assignedMember: assigned
      };
    }

    // Save telegram ID if missing
    if (senderUser && senderUser.id && !assigned.telegramId) {
      assigned.telegramId = senderUser.id;
      const memberIdx = members.findIndex(m => m.id === assigned.id || m.name === assigned.name);
      if (memberIdx !== -1) {
        members[memberIdx].telegramId = senderUser.id;
        storage.saveMembers(members);
      }
    }

    state.pendingMotorTask = null;
    storage.saveState(state);

    return {
      success: true,
      completedMember: assigned
    };
  },

  /**
   * Complete pending trash task when assigned member types "done" or clicks button.
   */
  completeTask(senderUser) {
    const state = storage.getState();
    const members = storage.getMembers();

    if (!state.pendingTask || state.pendingTask.status !== 'PENDING') {
      return { success: false, reason: 'NO_PENDING_TASK' };
    }

    const assigned = state.pendingTask.assignedMember;

    let isMatch = false;

    if (senderUser) {
      const senderId = senderUser.id;
      const senderUsername = (senderUser.username || '').replace('@', '').toLowerCase();
      const senderFirstName = (senderUser.first_name || '').toLowerCase();
      const senderFullName = `${senderUser.first_name || ''} ${senderUser.last_name || ''}`.trim().toLowerCase();

      const assignedId = assigned.telegramId;
      const assignedUsername = (assigned.username || '').replace('@', '').toLowerCase();
      const assignedName = (assigned.name || '').toLowerCase();

      if (assignedId && senderId && String(assignedId) === String(senderId)) {
        isMatch = true;
      } else if (assignedUsername && senderUsername && assignedUsername === senderUsername) {
        isMatch = true;
      } else if (assignedName && (senderFirstName === assignedName || senderFullName === assignedName || senderUsername === assignedName)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return {
        success: false,
        reason: 'NOT_ASSIGNED_USER',
        assignedMember: assigned
      };
    }

    let currentIndex = (state.currentIndex || 0) % members.length;
    const newIndex = (currentIndex + 1) % members.length;

    if (senderUser && senderUser.id && !assigned.telegramId) {
      assigned.telegramId = senderUser.id;
      const memberIdx = members.findIndex(m => m.id === assigned.id || m.name === assigned.name);
      if (memberIdx !== -1) {
        members[memberIdx].telegramId = senderUser.id;
        storage.saveMembers(members);
      }
    }

    const logEntry = {
      timestamp: state.pendingTask.assignedAt,
      completedAt: new Date().toISOString(),
      assignedTo: assigned.name || assigned.username,
      triggeredBy: state.pendingTask.triggeredBy || 'Manual'
    };

    const updatedHistory = [logEntry, ...(state.history || [])].slice(0, 50);

    state.currentIndex = newIndex;
    state.pendingTask = null;
    state.pendingMotorTask = null;
    state.history = updatedHistory;

    storage.saveState(state);

    return {
      success: true,
      completedMember: assigned,
      nextMember: members[newIndex],
      newIndex
    };
  },

  /**
   * Skips current turn holder.
   */
  skipTurn() {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    const state = storage.getState();
    let currentIndex = (state.currentIndex || 0) % members.length;

    const skippedMember = members[currentIndex];
    const newIndex = (currentIndex + 1) % members.length;
    const nextMember = members[newIndex];

    state.currentIndex = newIndex;
    state.pendingTask = null;
    state.pendingMotorTask = null;
    storage.saveState(state);

    return {
      success: true,
      skippedMember,
      nextMember,
      newIndex
    };
  },

  /**
   * Manually override current turn.
   */
  setTurn(query) {
    const members = storage.getMembers();
    if (!members || members.length === 0) {
      return { success: false, reason: 'No members in rotation list.' };
    }

    let targetIndex = -1;

    const numeric = parseInt(query, 10);
    if (!isNaN(numeric) && numeric >= 1 && numeric <= members.length) {
      targetIndex = numeric - 1;
    } else {
      const cleanQuery = query.replace('@', '').toLowerCase().trim();
      targetIndex = members.findIndex(m => 
        (m.name && m.name.toLowerCase() === cleanQuery) ||
        (m.username && m.username.toLowerCase() === cleanQuery)
      );
    }

    if (targetIndex === -1) {
      return { success: false, reason: `Member matching "${query}" was not found.` };
    }

    const state = storage.getState();
    state.currentIndex = targetIndex;
    state.pendingTask = null;
    state.pendingMotorTask = null;
    storage.saveState(state);

    return {
      success: true,
      assignedMember: members[targetIndex],
      currentIndex: targetIndex
    };
  },

  /**
   * Add a member to the rotation.
   */
  addMember(name, username = null, telegramId = null) {
    const members = storage.getMembers();
    const cleanName = name.trim();
    const cleanUsername = username ? username.replace('@', '').trim() : cleanName;

    const exists = members.some(m => 
      m.name.toLowerCase() === cleanName.toLowerCase() ||
      (m.username && m.username.toLowerCase() === cleanUsername.toLowerCase())
    );

    if (exists) {
      return { success: false, reason: `Member "${cleanName}" already exists in the rotation.` };
    }

    const newMember = {
      id: members.length > 0 ? Math.max(...members.map(m => m.id || 0)) + 1 : 1,
      name: cleanName,
      username: cleanUsername,
      telegramId: telegramId || null
    };

    members.push(newMember);
    storage.saveMembers(members);

    return { success: true, member: newMember, totalMembers: members.length };
  },

  /**
   * Remove a member by name, username, or 1-based index.
   */
  removeMember(query) {
    let members = storage.getMembers();
    if (members.length === 0) {
      return { success: false, reason: 'Rotation list is currently empty.' };
    }

    let targetIndex = -1;
    const numeric = parseInt(query, 10);

    if (!isNaN(numeric) && numeric >= 1 && numeric <= members.length) {
      targetIndex = numeric - 1;
    } else {
      const cleanQuery = query.replace('@', '').toLowerCase().trim();
      targetIndex = members.findIndex(m => 
        (m.name && m.name.toLowerCase() === cleanQuery) ||
        (m.username && m.username.toLowerCase() === cleanQuery)
      );
    }

    if (targetIndex === -1) {
      return { success: false, reason: `Member matching "${query}" was not found.` };
    }

    const removed = members.splice(targetIndex, 1)[0];
    storage.saveMembers(members);

    const state = storage.getState();
    if (state.currentIndex >= members.length) {
      state.currentIndex = 0;
    }
    state.pendingTask = null;
    state.pendingMotorTask = null;
    storage.saveState(state);

    return { success: true, removedMember: removed, remainingCount: members.length };
  }
};
