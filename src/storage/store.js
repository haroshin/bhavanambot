import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * Ensures the data directory exists.
 */
function ensureDataDirExists() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

/**
 * Safely load JSON data from a file, returning fallback if file does not exist or is invalid.
 */
function loadJson(filePath, fallback) {
  ensureDataDirExists();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[Storage] Error loading ${filePath}:`, err.message);
  }
  return fallback;
}

/**
 * Safely write JSON data to a file atomically.
 */
function saveJson(filePath, data) {
  ensureDataDirExists();
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`[Storage] Error saving ${filePath}:`, err.message);
  }
}

export const storage = {
  /**
   * Load members roster array.
   */
  getMembers() {
    return loadJson(config.membersFilePath, []);
  },

  /**
   * Save members roster array.
   */
  saveMembers(members) {
    saveJson(config.membersFilePath, members);
  },

  /**
   * Load state object ({ currentIndex, lastTriggered, history }).
   */
  getState() {
    return loadJson(config.stateFilePath, {
      currentIndex: 0,
      lastTriggered: null,
      history: []
    });
  },

  /**
   * Save state object.
   */
  saveState(state) {
    saveJson(config.stateFilePath, state);
  },

  /**
   * Get stored group chat ID.
   */
  getChatId() {
    const state = this.getState();
    return state.chatId || config.targetChatId || null;
  },

  /**
   * Automatically save group chat ID when bot interacts with a group.
   */
  setChatId(chatId) {
    const state = this.getState();
    if (state.chatId !== chatId) {
      state.chatId = chatId;
      this.saveState(state);
      console.log(`[Storage] Automatically registered Group Chat ID: ${chatId}`);
    }
  },

  /**
   * Load fine records map ({ "member_name": balance, logs: [...] }).
   */
  getFines() {
    return loadJson(config.finesFilePath, {});
  },

  /**
   * Save fine records map.
   */
  saveFines(fines) {
    saveJson(config.finesFilePath, fines);
  }
};
