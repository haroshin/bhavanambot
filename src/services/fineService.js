import { storage } from '../storage/store.js';

export const fineService = {
  /**
   * Check if a Telegram user is authorized Admin (Arjun).
   */
  isAdmin(user) {
    if (!user) return false;

    const telegramId = user.id;
    const username = (user.username || '').toLowerCase();
    const firstName = (user.first_name || '').toLowerCase();

    // Arjun's Telegram ID, username, or name matching
    if (telegramId && String(telegramId) === '5048376485') return true;
    if (username === 'arjun_pk') return true;
    if (firstName === 'arjun') return true;

    return false;
  },

  /**
   * Get total fine balance summary for all members.
   */
  getFinesSummary() {
    const members = storage.getMembers();
    const fines = storage.getFines();

    let totalHouseFines = 0;
    const memberFines = members.map(m => {
      const key = (m.name || m.username || '').toLowerCase();
      const amount = fines[key] && fines[key].balance ? fines[key].balance : 0;
      totalHouseFines += amount;
      return {
        member: m,
        balance: amount
      };
    });

    return {
      memberFines,
      totalHouseFines
    };
  },

  /**
   * Add fine to a member.
   */
  addFine(memberKey, amount = 50, reason = 'Uncompleted Task Penalty') {
    const fines = storage.getFines();
    const key = memberKey.toLowerCase();

    if (!fines[key]) {
      fines[key] = { balance: 0, history: [] };
    }

    fines[key].balance = (fines[key].balance || 0) + amount;
    fines[key].history = fines[key].history || [];
    fines[key].history.unshift({
      type: 'FINE_ADDED',
      amount,
      reason,
      date: new Date().toISOString()
    });

    storage.saveFines(fines);
    return fines[key].balance;
  },

  /**
   * Deduct paid fine amount (Admin Arjun only).
   */
  deductFine(adminUser, targetQuery, amount) {
    if (!this.isAdmin(adminUser)) {
      return { success: false, reason: 'NOT_ADMIN' };
    }

    const members = storage.getMembers();
    let targetMember = null;

    const numeric = parseInt(targetQuery, 10);
    if (!isNaN(numeric) && numeric >= 1 && numeric <= members.length) {
      targetMember = members[numeric - 1];
    } else {
      const cleanQuery = targetQuery.replace('@', '').toLowerCase().trim();
      targetMember = members.find(m => 
        (m.name && m.name.toLowerCase() === cleanQuery) ||
        (m.username && m.username.toLowerCase() === cleanQuery)
      );
    }

    if (!targetMember) {
      return { success: false, reason: 'MEMBER_NOT_FOUND', query: targetQuery };
    }

    const parseAmount = parseFloat(amount);
    if (isNaN(parseAmount) || parseAmount <= 0) {
      return { success: false, reason: 'INVALID_AMOUNT' };
    }

    const fines = storage.getFines();
    const key = (targetMember.name || targetMember.username || '').toLowerCase();

    if (!fines[key]) {
      fines[key] = { balance: 0, history: [] };
    }

    const currentBalance = fines[key].balance || 0;
    const newBalance = Math.max(0, currentBalance - parseAmount);
    const actualDeducted = currentBalance - newBalance;

    fines[key].balance = newBalance;
    fines[key].history.unshift({
      type: 'FINE_PAID',
      amount: actualDeducted,
      deductedBy: adminUser.first_name || adminUser.username || 'Arjun',
      date: new Date().toISOString()
    });

    storage.saveFines(fines);

    return {
      success: true,
      member: targetMember,
      deductedAmount: parseAmount,
      remainingBalance: newBalance,
      previousBalance: currentBalance
    };
  },

  /**
   * 6:30 PM Check for uncompleted Water Motor duty.
   * Adds ₹50 fine if motor was not turned ON by 6:30 PM.
   */
  checkMotorPenalty() {
    const state = storage.getState();
    let penaltyInfo = null;

    if (state.pendingMotorTask && state.pendingMotorTask.status === 'PENDING') {
      const assigned = state.pendingMotorTask.assignedMember;
      const key = assigned.name || assigned.username;
      const newBal = this.addFine(key, 50, 'Uncompleted Water Motor Duty at 6:30 PM');

      penaltyInfo = {
        member: assigned,
        taskName: 'Water Motor Duty',
        fineAdded: 50,
        newBalance: newBal
      };

      state.pendingMotorTask = null; // Clear pending motor task
      storage.saveState(state);
    }

    return penaltyInfo;
  },

  /**
   * Daily Midnight 12:00 AM Check for uncompleted Trash Cleaning duty.
   * Adds ₹50 fine if trash duty was not completed before midnight.
   */
  checkTrashMidnightPenalty() {
    const state = storage.getState();
    const members = storage.getMembers();
    let penaltyInfo = null;

    if (state.pendingTask && state.pendingTask.status === 'PENDING') {
      const assigned = state.pendingTask.assignedMember;
      const key = assigned.name || assigned.username;
      const newBal = this.addFine(key, 50, 'Uncompleted Trash Cleaning Duty at Midnight');

      penaltyInfo = {
        member: assigned,
        taskName: 'Trash Cleaning Duty',
        fineAdded: 50,
        newBalance: newBal
      };

      // Advance rotation to next member since current turn was uncompleted and fined
      if (members.length > 0) {
        let currentIndex = (state.currentIndex || 0) % members.length;
        state.currentIndex = (currentIndex + 1) % members.length;
      }

      state.pendingTask = null; // Clear pending trash task
      state.pendingMotorTask = null;
      storage.saveState(state);
    }

    return penaltyInfo;
  }
};
