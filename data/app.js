'use strict';

/* ==========================================================================
   MOB BR - app.js
   メインアプリケーション統合ファイル
   ========================================================================== */

(() => {
  const ROOT = window;
  const MOBBR = ROOT.MOBBR = ROOT.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};
  MOBBR.APP = MOBBR.APP || {};

  /* ==========================================================================
     1. 基本設定
     ========================================================================== */

  const APP_VERSION = '1.0.0';
  const SAVE_KEY = 'mobbr_save_v1';
  const BACKUP_SAVE_KEY = 'mobbr_save_backup_v1';
  const SETTINGS_KEY = 'mobbr_settings_v1';
  const AUTOSAVE_INTERVAL = 30000;

  const DEFAULT_SCREEN = 'home';

  const STAT_KEYS = [
    'stamina',
    'mind',
    'physical',
    'aim',
    'agility',
    'technique',
    'support'
  ];

  const TRAINING_POINT_KEYS = [
    'power',
    'technique',
    'mental',
    'shooting'
  ];

  const ROLE_ORDER = ['IGL', 'ATK', 'SUP'];

  const SCREEN_ALIASES = {
    main: 'home',
    menu: 'home',
    top: 'home',

    train: 'training',
    status: 'ability',
    abilities: 'ability',

    cards: 'collection',
    card: 'collection',
    badges: 'collection',

    store: 'shop',

    rooms: 'room',

    coaches: 'coach',

    inventory: 'equipment',
    items: 'equipment',

    event: 'tournament',
    tournaments: 'tournament',

    options: 'settings'
  };

  /* ==========================================================================
     2. 汎用ユーティリティ
     ========================================================================== */

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function deepClone(value) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch (_) {
        // JSON方式へフォールバック
      }
    }

    return JSON.parse(JSON.stringify(value));
  }

  function deepMerge(target, source) {
    if (!isObject(target)) {
      target = {};
    }

    if (!isObject(source)) {
      return target;
    }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];

      if (Array.isArray(sourceValue)) {
        target[key] = deepClone(sourceValue);
        return;
      }

      if (isObject(sourceValue)) {
        target[key] = deepMerge(
          isObject(target[key]) ? target[key] : {},
          sourceValue
        );
        return;
      }

      target[key] = sourceValue;
    });

    return target;
  }

  function clamp(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(max, Math.max(min, number));
  }

  function toInt(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.trunc(number);
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function uniqueArray(values) {
    return [...new Set(Array.isArray(values) ? values : [])];
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ja-JP').format(
      Math.max(0, toInt(value))
    );
  }

  function formatPercent(value, digits = 1) {
    return `${toNumber(value).toFixed(digits)}%`;
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeScreenName(screenName) {
    const raw = String(screenName || DEFAULT_SCREEN)
      .trim()
      .toLowerCase();

    return SCREEN_ALIASES[raw] || raw || DEFAULT_SCREEN;
  }

  function getDatasetJSON(element, key, fallback = null) {
    if (!element || !element.dataset) {
      return fallback;
    }

    const raw = element.dataset[key];

    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function safeCall(fn, ...args) {
    if (typeof fn !== 'function') {
      return undefined;
    }

    try {
      return fn(...args);
    } catch (error) {
      console.error('[MOB BR] Function error:', error);
      return undefined;
    }
  }

  function resolveAPI(groupName) {
    return MOBBR.API[groupName]
      || ROOT[`MOBBR_${String(groupName).toUpperCase()}_API`]
      || null;
  }

  function resolveData(groupName) {
    return MOBBR.DATA[groupName]
      || ROOT[`MOBBR_${String(groupName).toUpperCase()}_DATA`]
      || null;
  }

  function dispatch(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(`mobbr:${name}`, {
        detail
      })
    );
  }

  /* ==========================================================================
     3. 初期状態
     ========================================================================== */

  function createDefaultStats() {
    return {
      stamina: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      mind: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      physical: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      aim: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      agility: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      technique: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      },
      support: {
        rank: 'F1',
        level: 1,
        value: 1,
        exp: 0
      }
    };
  }

  function createDefaultState() {
    return {
      meta: {
        version: APP_VERSION,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        playTimeSeconds: 0,
        saveCount: 0
      },

      profile: {
        playerName: 'PLAYER',
        companyName: 'MOB',
        companyRank: 1,
        companyExp: 0,
        companyExpNext: 100,
        playerRank: 1,
        playerExp: 0,
        playerExpNext: 100,
        role: 'IGL'
      },

      currencies: {
        coin: 10000,
        diamond: 100,
        ruby: 0,
        energy: 100,
        maxEnergy: 100
      },

      training: {
        points: {
          power: 0,
          technique: 0,
          mental: 0,
          shooting: 0
        },
        stats: createDefaultStats(),
        totalSessions: 0,
        streak: 0,
        lastTrainingAt: null,
        history: []
      },

      team: {
        id: 'player-team',
        name: 'MOB TEAM',
        logo: '',
        members: [
          {
            id: 'player-igl',
            role: 'IGL',
            name: 'PLAYER IGL',
            image: '',
            selected: true
          },
          {
            id: 'player-atk',
            role: 'ATK',
            name: 'PLAYER ATK',
            image: '',
            selected: true
          },
          {
            id: 'player-sup',
            role: 'SUP',
            name: 'PLAYER SUP',
            image: '',
            selected: true
          }
        ],
        strategy: {
          style: 'balance',
          aggression: 50,
          rotation: 50,
          support: 50
        }
      },

      coach: {
        owned: [],
        selected: null,
        assignments: {},
        exp: {}
      },

      collection: {
        cards: {},
        badges: {},
        packs: {},
        discovered: {
          cards: [],
          badges: []
        }
      },

      shop: {
        purchased: {},
        purchaseHistory: [],
        lastRefreshAt: null,
        skinPity: 0
      },

      inventory: {
        capacity: 10,
        items: {},
        equipped: [],
        weaponSkins: [],
        selectedWeaponSkin: null
      },

      room: {
        owned: ['room-default'],
        selected: 'room-default'
      },

      tournament: {
        activeTournamentId: null,
        activeMatchId: null,
        season: 1,
        week: 1,
        records: {
          entries: 0,
          wins: 0,
          top3: 0,
          kills: 0,
          assists: 0,
          damage: 0,
          bestPlacement: null
        },
        history: []
      },

      weekly: {
        lastResetKey: null,
        loginDays: 0,
        claimed: [],
        missions: {},
        rewards: {}
      },

      unlocks: {
        screens: [
          'home',
          'training',
          'ability',
          'team',
          'tournament',
          'collection',
          'shop',
          'room',
          'coach',
          'equipment',
          'settings'
        ],
        features: []
      },

      ui: {
        currentScreen: DEFAULT_SCREEN,
        previousScreen: null,
        modal: null,
        selectedCollectionType: 'cards',
        selectedCollectionRegion: 'all',
        selectedShopCategory: 'all',
        selectedTrainingId: null,
        selectedAbility: 'stamina',
        selectedTournamentId: null,
        notices: []
      },

      settings: {
        soundEnabled: true,
        musicEnabled: true,
        vibrationEnabled: true,
        reducedMotion: false,
        autoSave: true,
        textSpeed: 'normal'
      },

      flags: {
        initialized: false,
        tutorialComplete: false,
        adminMode: false,
        firstLaunch: true
      }
    };
  }

  /* ==========================================================================
     4. 状態ストア
     ========================================================================== */

  const Store = {
    state: createDefaultState(),
    listeners: new Set(),
    transactionDepth: 0,
    dirty: false,

    getState() {
      return this.state;
    },

    get(path, fallback = undefined) {
      if (!path) {
        return this.state;
      }

      const keys = Array.isArray(path)
        ? path
        : String(path).split('.').filter(Boolean);

      let current = this.state;

      for (const key of keys) {
        if (
          current === null
          || current === undefined
          || !Object.prototype.hasOwnProperty.call(current, key)
        ) {
          return fallback;
        }

        current = current[key];
      }

      return current;
    },

    set(path, value, options = {}) {
      const keys = Array.isArray(path)
        ? path
        : String(path).split('.').filter(Boolean);

      if (!keys.length) {
        return false;
      }

      let current = this.state;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];

        if (!isObject(current[key]) && !Array.isArray(current[key])) {
          current[key] = {};
        }

        current = current[key];
      }

      current[keys[keys.length - 1]] = value;
      this.markDirty();

      if (!options.silent) {
        this.emit({
          type: 'set',
          path: keys.join('.'),
          value
        });
      }

      return true;
    },

    update(path, updater, options = {}) {
      const currentValue = this.get(path);
      const nextValue = typeof updater === 'function'
        ? updater(currentValue)
        : updater;

      return this.set(path, nextValue, options);
    },

    replace(nextState, options = {}) {
      this.state = normalizeState(nextState);
      this.markDirty();

      if (!options.silent) {
        this.emit({
          type: 'replace'
        });
      }
    },

    transaction(callback) {
      this.transactionDepth += 1;

      try {
        callback(this.state);
      } finally {
        this.transactionDepth -= 1;

        if (this.transactionDepth <= 0) {
          this.transactionDepth = 0;
          this.markDirty();
          this.emit({
            type: 'transaction'
          });
        }
      }
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }

      this.listeners.add(listener);

      return () => {
        this.listeners.delete(listener);
      };
    },

    emit(change) {
      if (this.transactionDepth > 0) {
        return;
      }

      this.listeners.forEach((listener) => {
        try {
          listener(this.state, change);
        } catch (error) {
          console.error('[MOB BR] Store listener error:', error);
        }
      });

      dispatch('statechange', {
        state: this.state,
        change
      });
    },

    markDirty() {
      this.dirty = true;
      this.state.meta.updatedAt = nowISO();
    },

    clearDirty() {
      this.dirty = false;
    }
  };

  function normalizeState(inputState) {
    const defaults = createDefaultState();
    const merged = deepMerge(defaults, isObject(inputState) ? inputState : {});

    merged.meta.version = APP_VERSION;
    merged.meta.createdAt = merged.meta.createdAt || nowISO();
    merged.meta.updatedAt = nowISO();
    merged.meta.playTimeSeconds = Math.max(
      0,
      toInt(merged.meta.playTimeSeconds)
    );
    merged.meta.saveCount = Math.max(
      0,
      toInt(merged.meta.saveCount)
    );

    merged.profile.companyRank = Math.max(
      1,
      toInt(merged.profile.companyRank, 1)
    );
    merged.profile.companyExp = Math.max(
      0,
      toInt(merged.profile.companyExp)
    );
    merged.profile.companyExpNext = Math.max(
      1,
      toInt(merged.profile.companyExpNext, 100)
    );
    merged.profile.playerRank = Math.max(
      1,
      toInt(merged.profile.playerRank, 1)
    );
    merged.profile.playerExp = Math.max(
      0,
      toInt(merged.profile.playerExp)
    );
    merged.profile.playerExpNext = Math.max(
      1,
      toInt(merged.profile.playerExpNext, 100)
    );

    if (!ROLE_ORDER.includes(merged.profile.role)) {
      merged.profile.role = 'IGL';
    }

    Object.keys(merged.currencies).forEach((key) => {
      merged.currencies[key] = Math.max(
        0,
        toInt(merged.currencies[key])
      );
    });

    merged.currencies.maxEnergy = Math.max(
      1,
      merged.currencies.maxEnergy
    );

    merged.currencies.energy = clamp(
      merged.currencies.energy,
      0,
      merged.currencies.maxEnergy
    );

    TRAINING_POINT_KEYS.forEach((key) => {
      merged.training.points[key] = Math.max(
        0,
        toInt(merged.training.points[key])
      );
    });

    STAT_KEYS.forEach((key) => {
      if (!isObject(merged.training.stats[key])) {
        merged.training.stats[key] = createDefaultStats()[key];
      }

      const stat = merged.training.stats[key];

      stat.rank = String(stat.rank || 'F1');
      stat.level = Math.max(1, toInt(stat.level, 1));
      stat.value = Math.max(1, toInt(stat.value, stat.level));
      stat.exp = Math.max(0, toInt(stat.exp));
    });

    merged.inventory.capacity = Math.max(
      1,
      toInt(merged.inventory.capacity, 10)
    );

    merged.inventory.equipped = uniqueArray(
      merged.inventory.equipped
    );

    merged.inventory.weaponSkins = uniqueArray(
      merged.inventory.weaponSkins
    );

    merged.room.owned = uniqueArray(
      merged.room.owned
    );

    if (!merged.room.owned.includes('room-default')) {
      merged.room.owned.unshift('room-default');
    }

    if (!merged.room.owned.includes(merged.room.selected)) {
      merged.room.selected = merged.room.owned[0];
    }

    merged.coach.owned = uniqueArray(
      merged.coach.owned
    );

    merged.unlocks.screens = uniqueArray(
      merged.unlocks.screens
    );

    merged.unlocks.features = uniqueArray(
      merged.unlocks.features
    );

    merged.ui.currentScreen = normalizeScreenName(
      merged.ui.currentScreen
    );

    return merged;
  }

  /* ==========================================================================
     5. セーブ・ロード
     ========================================================================== */

  const SaveManager = {
    save(options = {}) {
      try {
        const state = Store.getState();
        const existingSave = localStorage.getItem(SAVE_KEY);

        if (existingSave) {
          localStorage.setItem(BACKUP_SAVE_KEY, existingSave);
        }

        state.meta.saveCount += 1;
        state.meta.updatedAt = nowISO();

        const payload = {
          format: 'MOBBR_SAVE',
          version: APP_VERSION,
          savedAt: nowISO(),
          state
        };

        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify(payload)
        );

        if (!options.silent) {
          notify('セーブしました', 'success');
        }

        Store.clearDirty();

        dispatch('save', {
          payload
        });

        return {
          ok: true,
          payload
        };
      } catch (error) {
        console.error('[MOB BR] Save failed:', error);

        if (!options.silent) {
          notify('セーブに失敗しました', 'error');
        }

        return {
          ok: false,
          error
        };
      }
    },

    load(options = {}) {
      try {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) {
          Store.replace(createDefaultState(), {
            silent: true
          });

          return {
            ok: true,
            fresh: true,
            state: Store.getState()
          };
        }

        const parsed = JSON.parse(raw);
        const sourceState = parsed && parsed.state
          ? parsed.state
          : parsed;

        const normalized = normalizeState(sourceState);

        normalized.flags.firstLaunch = false;
        normalized.flags.initialized = true;

        Store.replace(normalized, {
          silent: true
        });

        Store.clearDirty();

        if (!options.silent) {
          notify('データをロードしました', 'success');
        }

        dispatch('load', {
          state: normalized
        });

        return {
          ok: true,
          fresh: false,
          state: normalized
        };
      } catch (error) {
        console.error('[MOB BR] Load failed:', error);

        const restored = this.restoreBackup({
          silent: true
        });

        if (restored.ok) {
          notify('バックアップデータを復元しました', 'warning');
          return restored;
        }

        Store.replace(createDefaultState(), {
          silent: true
        });

        notify('セーブデータを初期化しました', 'error');

        return {
          ok: false,
          error,
          state: Store.getState()
        };
      }
    },

    restoreBackup(options = {}) {
      try {
        const raw = localStorage.getItem(BACKUP_SAVE_KEY);

        if (!raw) {
          return {
            ok: false,
            reason: 'backup-not-found'
          };
        }

        const parsed = JSON.parse(raw);
        const sourceState = parsed && parsed.state
          ? parsed.state
          : parsed;

        Store.replace(
          normalizeState(sourceState),
          {
            silent: true
          }
        );

        this.save({
          silent: true
        });

        if (!options.silent) {
          notify('バックアップを復元しました', 'success');
        }

        return {
          ok: true,
          state: Store.getState()
        };
      } catch (error) {
        return {
          ok: false,
          error
        };
      }
    },

    reset() {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(BACKUP_SAVE_KEY);

      Store.replace(createDefaultState());
      this.save({
        silent: true
      });

      Router.go(DEFAULT_SCREEN);
      notify('セーブデータを初期化しました', 'success');

      dispatch('reset', {
        state: Store.getState()
      });
    },

    export() {
      const payload = {
        format: 'MOBBR_SAVE',
        version: APP_VERSION,
        exportedAt: nowISO(),
        state: Store.getState()
      };

      return JSON.stringify(payload, null, 2);
    },

    import(rawText) {
      try {
        const parsed = JSON.parse(rawText);
        const sourceState = parsed && parsed.state
          ? parsed.state
          : parsed;

        Store.replace(normalizeState(sourceState));
        this.save({
          silent: true
        });

        Router.go(
          Store.get('ui.currentScreen', DEFAULT_SCREEN)
        );

        notify('セーブデータを読み込みました', 'success');

        return {
          ok: true
        };
      } catch (error) {
        notify('セーブデータの形式が正しくありません', 'error');

        return {
          ok: false,
          error
        };
      }
    }
  };

  /* ==========================================================================
     6. 通知・モーダル
     ========================================================================== */

  function getToastContainer() {
    let container = document.querySelector('[data-toast-container]');

    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.dataset.toastContainer = '';
    container.className = 'mobbr-toast-container';
    container.setAttribute('aria-live', 'polite');

    Object.assign(container.style, {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      transform: 'translateX(-50%)',
      zIndex: '99999',
      display: 'grid',
      gap: '8px',
      width: 'min(92vw, 440px)',
      pointerEvents: 'none'
    });

    document.body.appendChild(container);

    return container;
  }

  function notify(message, type = 'info', duration = 2200) {
    const text = String(message || '').trim();

    if (!text) {
      return;
    }

    const notice = {
      id: `notice-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: text,
      type,
      createdAt: nowISO()
    };

    Store.update('ui.notices', (notices) => {
      const list = Array.isArray(notices) ? notices.slice() : [];
      list.push(notice);
      return list.slice(-30);
    }, {
      silent: true
    });

    const container = getToastContainer();
    const toast = document.createElement('div');

    toast.className = `mobbr-toast mobbr-toast--${type}`;
    toast.textContent = text;

    Object.assign(toast.style, {
      padding: '12px 16px',
      borderRadius: '12px',
      background: type === 'error'
        ? '#9b2020'
        : type === 'success'
          ? '#176e44'
          : type === 'warning'
            ? '#8a5a11'
            : '#202431',
      color: '#fff',
      fontWeight: '700',
      textAlign: 'center',
      boxShadow: '0 8px 26px rgba(0,0,0,.25)',
      opacity: '0',
      transform: 'translateY(12px)',
      transition: 'opacity .18s ease, transform .18s ease',
      pointerEvents: 'auto'
    });

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';

      window.setTimeout(() => {
        toast.remove();
      }, 220);
    }, Math.max(500, duration));

    dispatch('notify', notice);
  }

  const Modal = {
    open(content, options = {}) {
      this.close();

      const overlay = document.createElement('div');
      overlay.className = 'mobbr-modal-overlay';
      overlay.dataset.mobbrModal = '';

      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '99998',
        background: 'rgba(0,0,0,.66)',
        display: 'grid',
        placeItems: 'center',
        padding: '18px'
      });

      const panel = document.createElement('section');
      panel.className = 'mobbr-modal-panel';

      Object.assign(panel.style, {
        width: 'min(92vw, 560px)',
        maxHeight: '88vh',
        overflow: 'auto',
        background: '#fff',
        color: '#151515',
        borderRadius: '18px',
        padding: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,.35)'
      });

      if (options.title) {
        const heading = document.createElement('h2');
        heading.textContent = options.title;
        heading.style.margin = '0 0 16px';
        panel.appendChild(heading);
      }

      const body = document.createElement('div');

      if (content instanceof Node) {
        body.appendChild(content);
      } else if (options.html === true) {
        body.innerHTML = String(content ?? '');
      } else {
        body.textContent = String(content ?? '');
      }

      panel.appendChild(body);

      if (options.closeButton !== false) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = options.closeText || '閉じる';
        closeButton.dataset.modalClose = '';

        Object.assign(closeButton.style, {
          width: '100%',
          marginTop: '18px',
          padding: '12px',
          border: '0',
          borderRadius: '10px',
          fontWeight: '800',
          cursor: 'pointer'
        });

        panel.appendChild(closeButton);
      }

      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      Store.set('ui.modal', options.id || 'modal', {
        silent: true
      });

      overlay.addEventListener('click', (event) => {
        if (
          event.target === overlay
          && options.closeOnBackdrop !== false
        ) {
          this.close();
        }
      });

      panel.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => {
          this.close();
        });
      });

      dispatch('modalopen', {
        id: options.id || 'modal'
      });

      return overlay;
    },

    confirm(message, options = {}) {
      return new Promise((resolve) => {
        const wrapper = document.createElement('div');
        const text = document.createElement('p');
        text.textContent = message;
        text.style.whiteSpace = 'pre-wrap';

        const actions = document.createElement('div');

        Object.assign(actions.style, {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '18px'
        });

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.textContent = options.cancelText || 'キャンセル';

        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.textContent = options.confirmText || '決定';

        [cancelButton, confirmButton].forEach((button) => {
          Object.assign(button.style, {
            padding: '12px',
            border: '0',
            borderRadius: '10px',
            fontWeight: '800',
            cursor: 'pointer'
          });
        });

        actions.append(cancelButton, confirmButton);
        wrapper.append(text, actions);

        this.open(wrapper, {
          title: options.title || '確認',
          closeButton: false,
          closeOnBackdrop: false
        });

        cancelButton.addEventListener('click', () => {
          this.close();
          resolve(false);
        });

        confirmButton.addEventListener('click', () => {
          this.close();
          resolve(true);
        });
      });
    },

    close() {
      const current = document.querySelector('[data-mobbr-modal]');

      if (current) {
        current.remove();
      }

      Store.set('ui.modal', null, {
        silent: true
      });

      dispatch('modalclose');
    }
  };

  /* ==========================================================================
     7. 画面ルーター
     ========================================================================== */

  const Router = {
    current: DEFAULT_SCREEN,

    exists(screenName) {
      const screen = normalizeScreenName(screenName);

      return Boolean(
        document.querySelector(
          `[data-screen="${CSS.escape(screen)}"], #screen-${CSS.escape(screen)}, .screen-${CSS.escape(screen)}`
        )
      );
    },

    getScreenElements() {
      return [
        ...document.querySelectorAll(
          '[data-screen], [id^="screen-"], [class*="screen-"]'
        )
      ].filter((element, index, array) => {
        return array.indexOf(element) === index;
      });
    },

    resolveElement(screenName) {
      const screen = normalizeScreenName(screenName);

      return document.querySelector(
        `[data-screen="${CSS.escape(screen)}"], #screen-${CSS.escape(screen)}, .screen-${CSS.escape(screen)}`
      );
    },

    isUnlocked(screenName) {
      const screen = normalizeScreenName(screenName);
      const unlocked = Store.get('unlocks.screens', []);

      return unlocked.includes(screen);
    },

    unlock(screenName) {
      const screen = normalizeScreenName(screenName);

      Store.update('unlocks.screens', (screens) => {
        return uniqueArray([
          ...(Array.isArray(screens) ? screens : []),
          screen
        ]);
      });

      updateNavigationState();
    },

    go(screenName, options = {}) {
      const target = normalizeScreenName(screenName);

      if (!this.isUnlocked(target) && !options.force) {
        notify('このメニューはまだ解放されていません', 'warning');
        return false;
      }

      const targetElement = this.resolveElement(target);

      if (!targetElement) {
        const dynamicRenderer = ScreenRenderers[target];

        if (typeof dynamicRenderer === 'function') {
          dynamicRenderer();
        }
      }

      const previous = this.current;

      this.getScreenElements().forEach((element) => {
        const name = getScreenNameFromElement(element);
        const active = name === target;

        element.hidden = !active;
        element.classList.toggle('is-active', active);
        element.setAttribute(
          'aria-hidden',
          active ? 'false' : 'true'
        );
      });

      document.body.dataset.currentScreen = target;

      this.current = target;

      Store.transaction(() => {
        Store.set('ui.previousScreen', previous, {
          silent: true
        });
        Store.set('ui.currentScreen', target, {
          silent: true
        });
      });

      updateNavigationState();
      renderScreen(target);

      window.scrollTo({
        top: 0,
        behavior: Store.get('settings.reducedMotion')
          ? 'auto'
          : 'smooth'
      });

      dispatch('screenchange', {
        previous,
        current: target
      });

      return true;
    },

    back() {
      const previous = Store.get('ui.previousScreen');

      if (previous) {
        return this.go(previous);
      }

      return this.go(DEFAULT_SCREEN);
    }
  };

  function getScreenNameFromElement(element) {
    if (element.dataset.screen) {
      return normalizeScreenName(element.dataset.screen);
    }

    if (element.id && element.id.startsWith('screen-')) {
      return normalizeScreenName(
        element.id.slice('screen-'.length)
      );
    }

    const matchingClass = [...element.classList].find((className) => {
      return className.startsWith('screen-');
    });

    if (matchingClass) {
      return normalizeScreenName(
        matchingClass.slice('screen-'.length)
      );
    }

    return '';
  }

  function updateNavigationState() {
    const current = Store.get('ui.currentScreen', DEFAULT_SCREEN);
    const unlocked = Store.get('unlocks.screens', []);

    document
      .querySelectorAll('[data-screen-target], [data-nav]')
      .forEach((button) => {
        const target = normalizeScreenName(
          button.dataset.screenTarget || button.dataset.nav
        );

        const active = target === current;
        const isUnlocked = unlocked.includes(target);

        button.classList.toggle('is-active', active);
        button.classList.toggle('is-locked', !isUnlocked);
        button.setAttribute(
          'aria-current',
          active ? 'page' : 'false'
        );
        button.setAttribute(
          'aria-disabled',
          isUnlocked ? 'false' : 'true'
        );
      });
  }

  /* ==========================================================================
     8. 通貨・ランク
     ========================================================================== */

  const Currency = {
    get(type) {
      return Math.max(
        0,
        toInt(Store.get(`currencies.${type}`, 0))
      );
    },

    set(type, amount) {
      Store.set(
        `currencies.${type}`,
        Math.max(0, toInt(amount))
      );

      renderCurrencies();
    },

    add(type, amount) {
      const next = this.get(type) + toInt(amount);
      this.set(type, next);

      dispatch('currencychange', {
        type,
        amount: toInt(amount),
        total: next
      });

      return next;
    },

    canAfford(cost) {
      if (!cost) {
        return true;
      }

      if (typeof cost === 'number') {
        return this.get('coin') >= cost;
      }

      return Object.entries(cost).every(([type, amount]) => {
        return this.get(type) >= Math.max(0, toInt(amount));
      });
    },

    spend(cost) {
      if (!this.canAfford(cost)) {
        return false;
      }

      const normalized = typeof cost === 'number'
        ? { coin: cost }
        : cost;

      Store.transaction(() => {
        Object.entries(normalized).forEach(([type, amount]) => {
          Store.set(
            `currencies.${type}`,
            this.get(type) - Math.max(0, toInt(amount)),
            {
              silent: true
            }
          );
        });
      });

      renderCurrencies();

      dispatch('currencyspend', {
        cost: normalized
      });

      return true;
    },

    grant(reward) {
      if (!reward) {
        return;
      }

      Store.transaction(() => {
        Object.entries(reward).forEach(([type, amount]) => {
          if (
            Object.prototype.hasOwnProperty.call(
              Store.get('currencies'),
              type
            )
          ) {
            Store.set(
              `currencies.${type}`,
              this.get(type) + Math.max(0, toInt(amount)),
              {
                silent: true
              }
            );
          }
        });
      });

      renderCurrencies();
    }
  };

  function addCompanyExp(amount) {
    let gain = Math.max(0, toInt(amount));

    if (!gain) {
      return;
    }

    Store.transaction(() => {
      let rank = Store.get('profile.companyRank', 1);
      let exp = Store.get('profile.companyExp', 0) + gain;
      let next = Store.get('profile.companyExpNext', 100);

      while (exp >= next) {
        exp -= next;
        rank += 1;
        next = calculateCompanyExpNext(rank);

        Currency.add('coin', 1000 * rank);
      }

      Store.set('profile.companyRank', rank, {
        silent: true
      });
      Store.set('profile.companyExp', exp, {
        silent: true
      });
      Store.set('profile.companyExpNext', next, {
        silent: true
      });
    });

    renderProfile();
  }

  function calculateCompanyExpNext(rank) {
    const currentRank = Math.max(1, toInt(rank, 1));

    return Math.round(
      100
      + currentRank * 40
      + Math.pow(currentRank, 1.42) * 18
    );
  }

  /* ==========================================================================
     9. トレーニング
     ========================================================================== */

  const Training = {
    getCatalog() {
      const api = resolveAPI('training');
      const data = resolveData('training');

      const fromAPI = safeCall(api?.getTrainings);

      if (Array.isArray(fromAPI)) {
        return fromAPI;
      }

      if (Array.isArray(data?.trainings)) {
        return data.trainings;
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(ROOT.TRAININGS)) {
        return ROOT.TRAININGS;
      }

      return [];
    },

    getById(trainingId) {
      const id = String(trainingId || '');
      const api = resolveAPI('training');

      const fromAPI = safeCall(api?.getTraining, id);

      if (fromAPI) {
        return fromAPI;
      }

      return this.getCatalog().find((training) => {
        return String(training.id) === id;
      }) || null;
    },

    canStart(trainingId) {
      const training = this.getById(trainingId);

      if (!training) {
        return {
          ok: false,
          reason: 'not-found'
        };
      }

      const energyCost = Math.max(
        0,
        toInt(
          training.energyCost
          ?? training.cost?.energy
          ?? training.energy
          ?? 0
        )
      );

      if (Currency.get('energy') < energyCost) {
        return {
          ok: false,
          reason: 'energy',
          required: energyCost
        };
      }

      return {
        ok: true,
        training,
        energyCost
      };
    },

    start(trainingId, options = {}) {
      const check = this.canStart(trainingId);

      if (!check.ok) {
        if (check.reason === 'energy') {
          notify('エネルギーが足りません', 'warning');
        } else {
          notify('トレーニングが見つかりません', 'error');
        }

        return {
          ok: false,
          reason: check.reason
        };
      }

      const training = check.training;
      const api = resolveAPI('training');

      Currency.spend({
        energy: check.energyCost
      });

      const externalResult = safeCall(
        api?.executeTraining,
        training,
        Store.getState(),
        options
      );

      const rewards = normalizeTrainingRewards(
        externalResult?.rewards
        || externalResult
        || training.rewards
        || training.points
        || {}
      );

      const bonusMultiplier = getTrainingBonusMultiplier(training);
      const finalRewards = {};

      TRAINING_POINT_KEYS.forEach((key) => {
        finalRewards[key] = Math.max(
          0,
          Math.round(
            toNumber(rewards[key]) * bonusMultiplier
          )
        );
      });

      Store.transaction(() => {
        TRAINING_POINT_KEYS.forEach((key) => {
          Store.set(
            `training.points.${key}`,
            Store.get(`training.points.${key}`, 0)
              + finalRewards[key],
            {
              silent: true
            }
          );
        });

        const history = Store.get('training.history', []).slice();

        history.unshift({
          id: training.id,
          name: training.name || training.title || training.id,
          rewards: finalRewards,
          energyCost: check.energyCost,
          bonusMultiplier,
          timestamp: nowISO()
        });

        Store.set(
          'training.history',
          history.slice(0, 100),
          {
            silent: true
          }
        );

        Store.set(
          'training.totalSessions',
          Store.get('training.totalSessions', 0) + 1,
          {
            silent: true
          }
        );

        Store.set(
          'training.lastTrainingAt',
          nowISO(),
          {
            silent: true
          }
        );
      });

      addCompanyExp(
        Math.max(
          1,
          toInt(training.companyExp ?? 5)
        )
      );

      renderTraining();
      renderAbility();
      renderCurrencies();

      notify(
        createTrainingRewardText(finalRewards),
        'success',
        3000
      );

      dispatch('trainingcomplete', {
        training,
        rewards: finalRewards,
        energyCost: check.energyCost
      });

      return {
        ok: true,
        training,
        rewards: finalRewards
      };
    }
  };

  function normalizeTrainingRewards(source) {
    const result = {
      power: 0,
      technique: 0,
      mental: 0,
      shooting: 0
    };

    if (!isObject(source)) {
      return result;
    }

    const aliases = {
      power: ['power', 'strength', 'physical'],
      technique: ['technique', 'tech', 'skill'],
      mental: ['mental', 'mind'],
      shooting: ['shooting', 'shot', 'aim']
    };

    Object.entries(aliases).forEach(([targetKey, sourceKeys]) => {
      const matchedKey = sourceKeys.find((key) => {
        return source[key] !== undefined;
      });

      if (matchedKey) {
        result[targetKey] = Math.max(
          0,
          toInt(source[matchedKey])
        );
      }
    });

    return result;
  }

  function getTrainingBonusMultiplier(training) {
    let multiplier = 1;

    const coachAPI = resolveAPI('coach');
    const coachBonus = safeCall(
      coachAPI?.getTrainingBonus,
      Store.getState(),
      training
    );

    if (Number.isFinite(Number(coachBonus))) {
      multiplier *= Math.max(0, Number(coachBonus));
    }

    const weeklyBonus = Store.get(
      'weekly.rewards.trainingMultiplier',
      1
    );

    if (Number.isFinite(Number(weeklyBonus))) {
      multiplier *= Math.max(0, Number(weeklyBonus));
    }

    return Math.max(0, multiplier);
  }

  function createTrainingRewardText(rewards) {
    const labels = {
      power: 'パワー',
      technique: '技術',
      mental: 'メンタル',
      shooting: '射撃'
    };

    const parts = TRAINING_POINT_KEYS
      .filter((key) => rewards[key] > 0)
      .map((key) => `${labels[key]} +${rewards[key]}`);

    return parts.length
      ? parts.join(' / ')
      : 'トレーニング完了';
  }

  /* ==========================================================================
     10. 能力強化
     ========================================================================== */

  const Ability = {
    getDefinition(statKey) {
      const api = resolveAPI('ability');
      const data = resolveData('ability');

      const fromAPI = safeCall(api?.getAbility, statKey);

      if (fromAPI) {
        return fromAPI;
      }

      if (data?.abilities?.[statKey]) {
        return data.abilities[statKey];
      }

      if (data?.[statKey]) {
        return data[statKey];
      }

      return null;
    },

    getCurrent(statKey) {
      return Store.get(`training.stats.${statKey}`);
    },

    getUpgradeCost(statKey) {
      const current = this.getCurrent(statKey);
      const definition = this.getDefinition(statKey);
      const api = resolveAPI('ability');

      const externalCost = safeCall(
        api?.getUpgradeCost,
        statKey,
        current,
        Store.getState()
      );

      if (externalCost && isObject(externalCost)) {
        return normalizePointCost(externalCost);
      }

      if (definition) {
        const level = Math.max(1, toInt(current?.level, 1));

        if (typeof definition.getCost === 'function') {
          return normalizePointCost(
            safeCall(definition.getCost, level, current)
          );
        }

        if (Array.isArray(definition.costs)) {
          return normalizePointCost(
            definition.costs[level - 1]
            || definition.costs.at(-1)
          );
        }
      }

      return getFallbackAbilityCost(statKey, current);
    },

    canUpgrade(statKey) {
      if (!STAT_KEYS.includes(statKey)) {
        return {
          ok: false,
          reason: 'invalid-stat'
        };
      }

      const current = this.getCurrent(statKey);

      if (!current) {
        return {
          ok: false,
          reason: 'missing-stat'
        };
      }

      const cost = this.getUpgradeCost(statKey);

      const enough = Object.entries(cost).every(([pointKey, amount]) => {
        return Store.get(`training.points.${pointKey}`, 0)
          >= amount;
      });

      return {
        ok: enough,
        reason: enough ? null : 'points',
        cost,
        current
      };
    },

    upgrade(statKey) {
      const check = this.canUpgrade(statKey);

      if (!check.ok) {
        notify(
          check.reason === 'points'
            ? '必要なトレーニングポイントが足りません'
            : '能力を強化できません',
          'warning'
        );

        return {
          ok: false,
          reason: check.reason
        };
      }

      const api = resolveAPI('ability');
      const current = deepClone(check.current);

      const externalResult = safeCall(
        api?.upgradeAbility,
        statKey,
        current,
        Store.getState()
      );

      const next = normalizeUpgradedStat(
        externalResult?.stat
        || externalResult
        || calculateFallbackStatUpgrade(current)
      );

      Store.transaction(() => {
        Object.entries(check.cost).forEach(([pointKey, amount]) => {
          Store.set(
            `training.points.${pointKey}`,
            Store.get(`training.points.${pointKey}`, 0) - amount,
            {
              silent: true
            }
          );
        });

        Store.set(
          `training.stats.${statKey}`,
          next,
          {
            silent: true
          }
        );
      });

      addCompanyExp(3);

      renderAbility();

      notify(
        `${getStatLabel(statKey)}を${next.rank}へ強化しました`,
        'success'
      );

      dispatch('abilityupgrade', {
        statKey,
        before: current,
        after: next,
        cost: check.cost
      });

      return {
        ok: true,
        stat: next,
        cost: check.cost
      };
    }
  };

  function normalizePointCost(cost) {
    const normalized = {};

    TRAINING_POINT_KEYS.forEach((key) => {
      const value = Math.max(
        0,
        toInt(cost?.[key])
      );

      if (value > 0) {
        normalized[key] = value;
      }
    });

    return normalized;
  }

  function getFallbackAbilityCost(statKey, current) {
    const level = Math.max(1, toInt(current?.level, 1));
    const base = 4 + Math.floor(level * 1.55);
    const tier = Math.floor((level - 1) / 10);
    const cost = Math.round(base * (1 + tier * 0.22));

    const maps = {
      stamina: {
        power: cost,
        mental: Math.ceil(cost * 0.45)
      },
      mind: {
        mental: cost,
        technique: Math.ceil(cost * 0.35)
      },
      physical: {
        power: cost,
        technique: Math.ceil(cost * 0.35)
      },
      aim: {
        shooting: cost,
        technique: Math.ceil(cost * 0.45)
      },
      agility: {
        power: Math.ceil(cost * 0.55),
        technique: Math.ceil(cost * 0.7)
      },
      technique: {
        technique: cost,
        shooting: Math.ceil(cost * 0.3)
      },
      support: {
        mental: Math.ceil(cost * 0.7),
        technique: Math.ceil(cost * 0.7),
        shooting: Math.ceil(cost * 0.25)
      }
    };

    return normalizePointCost(maps[statKey] || {
      power: cost
    });
  }

  function calculateFallbackStatUpgrade(current) {
    const nextLevel = Math.max(1, toInt(current.level, 1)) + 1;
    const rankInfo = levelToRank(nextLevel);

    return {
      ...current,
      level: nextLevel,
      value: Math.max(
        nextLevel,
        toInt(current.value, nextLevel - 1) + 1
      ),
      rank: rankInfo.rank,
      exp: 0
    };
  }

  function normalizeUpgradedStat(stat) {
    const normalized = isObject(stat)
      ? { ...stat }
      : {};

    normalized.level = Math.max(
      1,
      toInt(normalized.level, 1)
    );
    normalized.value = Math.max(
      1,
      toInt(normalized.value, normalized.level)
    );
    normalized.rank = String(
      normalized.rank
      || levelToRank(normalized.level).rank
    );
    normalized.exp = Math.max(
      0,
      toInt(normalized.exp)
    );

    return normalized;
  }

  function levelToRank(level) {
    const normalizedLevel = Math.max(1, toInt(level, 1));

    const tiers = [
      'F',
      'E',
      'D',
      'C',
      'B',
      'A',
      'S',
      'SS'
    ];

    const maxNormalLevel = tiers.length * 10;

    if (normalizedLevel > maxNormalLevel) {
      return {
        rank: 'MOB',
        tier: 'MOB',
        step: 1
      };
    }

    const index = Math.floor((normalizedLevel - 1) / 10);
    const step = ((normalizedLevel - 1) % 10) + 1;
    const tier = tiers[index];

    return {
      rank: `${tier}${step}`,
      tier,
      step
    };
  }

  function getStatLabel(statKey) {
    const labels = {
      stamina: 'スタミナ',
      mind: 'マインド',
      physical: 'フィジカル',
      aim: 'エイム',
      agility: 'アジリティ',
      technique: 'テクニック',
      support: 'サポート'
    };

    return labels[statKey] || statKey;
  }

  /* ==========================================================================
     11. ショップ・パック・アイテム
     ========================================================================== */

  const Shop = {
    getAPI() {
      return resolveAPI('shop');
    },

    getProducts(category = 'all') {
      const api = this.getAPI();

      const products = safeCall(
        api?.getShopProducts,
        Store.getState(),
        {
          category
        }
      );

      if (Array.isArray(products)) {
        return products;
      }

      const data = resolveData('shop');

      if (Array.isArray(data?.products)) {
        return data.products;
      }

      if (Array.isArray(data?.items)) {
        return data.items;
      }

      return [];
    },

    purchase(productId, quantity = 1) {
      const api = this.getAPI();
      const amount = Math.max(1, toInt(quantity, 1));

      const result = safeCall(
        api?.purchaseItem,
        Store.getState(),
        productId,
        amount
      );

      if (result?.ok) {
        applyExternalStateResult(result);
        notify(result.message || '購入しました', 'success');
        renderAll();

        dispatch('purchase', {
          productId,
          quantity: amount,
          result
        });

        return result;
      }

      const product = this.getProducts().find((entry) => {
        return String(entry.id) === String(productId);
      });

      if (!product) {
        notify('商品が見つかりません', 'error');

        return {
          ok: false,
          reason: 'not-found'
        };
      }

      const unitCost = normalizeShopCost(
        product.cost
        || product.price
        || {
          coin: 0
        }
      );

      const totalCost = {};

      Object.entries(unitCost).forEach(([type, value]) => {
        totalCost[type] = value * amount;
      });

      if (!Currency.spend(totalCost)) {
        notify('通貨が足りません', 'warning');

        return {
          ok: false,
          reason: 'currency'
        };
      }

      grantFallbackProduct(product, amount);

      Store.update('shop.purchaseHistory', (history) => {
        const list = Array.isArray(history) ? history.slice() : [];

        list.unshift({
          productId: product.id,
          quantity: amount,
          cost: totalCost,
          timestamp: nowISO()
        });

        return list.slice(0, 100);
      });

      notify('購入しました', 'success');
      renderAll();

      dispatch('purchase', {
        productId,
        quantity: amount,
        product
      });

      return {
        ok: true,
        product,
        quantity: amount
      };
    },

    purchasePack(packId, quantity = 1) {
      const api = this.getAPI();

      const result = safeCall(
        api?.purchasePack,
        Store.getState(),
        packId,
        Math.max(1, toInt(quantity, 1))
      );

      if (!result) {
        return this.purchase(packId, quantity);
      }

      if (result.ok) {
        applyExternalStateResult(result);
        notify(result.message || 'パックを購入しました', 'success');
        renderAll();
      } else {
        notify(result.message || 'パックを購入できません', 'warning');
      }

      return result;
    },

    openPack(packId, quantity = 1) {
      const api = this.getAPI();

      const result = safeCall(
        api?.openPack,
        Store.getState(),
        packId,
        Math.max(1, toInt(quantity, 1))
      );

      if (!result?.ok) {
        notify(
          result?.message || 'パックを開封できません',
          'warning'
        );

        return result || {
          ok: false
        };
      }

      applyExternalStateResult(result);
      showPackResult(result);
      renderAll();

      dispatch('packopen', {
        packId,
        result
      });

      return result;
    },

    drawWeaponSkin() {
      const api = this.getAPI();

      const result = safeCall(
        api?.drawWeaponSkin,
        Store.getState()
      );

      if (!result?.ok) {
        notify(
          result?.message || 'スキンガチャを実行できません',
          'warning'
        );

        return result || {
          ok: false
        };
      }

      applyExternalStateResult(result);

      notify(
        result.duplicate
          ? '重複スキン報酬を獲得しました'
          : `${result.skin?.name || '武器スキン'}を獲得しました`,
        'success',
        3200
      );

      renderAll();

      return result;
    }
  };

  function normalizeShopCost(cost) {
    if (typeof cost === 'number') {
      return {
        coin: Math.max(0, toInt(cost))
      };
    }

    const normalized = {};

    if (isObject(cost)) {
      Object.entries(cost).forEach(([type, value]) => {
        const amount = Math.max(0, toInt(value));

        if (amount > 0) {
          normalized[type] = amount;
        }
      });
    }

    return normalized;
  }

  function grantFallbackProduct(product, quantity) {
    const type = product.type || product.category || 'item';

    if (type === 'room') {
      Store.update('room.owned', (owned) => {
        return uniqueArray([
          ...(Array.isArray(owned) ? owned : []),
          product.id
        ]);
      });

      return;
    }

    if (
      type === 'weaponSkin'
      || type === 'weapon-skin'
      || type === 'skin'
    ) {
      Store.update('inventory.weaponSkins', (owned) => {
        return uniqueArray([
          ...(Array.isArray(owned) ? owned : []),
          product.id
        ]);
      });

      return;
    }

    Store.update(`inventory.items.${product.id}`, (current) => {
      return Math.max(0, toInt(current)) + quantity;
    });
  }

  function applyExternalStateResult(result) {
    if (result?.state) {
      Store.replace(result.state);
      return;
    }

    if (result?.nextState) {
      Store.replace(result.nextState);
      return;
    }

    if (result?.patch && isObject(result.patch)) {
      Store.transaction(() => {
        Object.entries(result.patch).forEach(([path, value]) => {
          Store.set(path, value, {
            silent: true
          });
        });
      });

      return;
    }

    Store.emit({
      type: 'external-result',
      result
    });
  }

  function showPackResult(result) {
    const items = result.items
      || result.results
      || result.rewards
      || [];

    const wrapper = document.createElement('div');

    if (!Array.isArray(items) || !items.length) {
      wrapper.textContent = result.message || 'パックを開封しました';
    } else {
      const list = document.createElement('div');

      Object.assign(list.style, {
        display: 'grid',
        gap: '10px'
      });

      items.forEach((item) => {
        const card = document.createElement('div');

        Object.assign(card.style, {
          padding: '12px',
          border: '2px solid #222',
          borderRadius: '12px',
          background: '#f4f4f4'
        });

        const name = item.name
          || item.card?.name
          || item.badge?.name
          || item.id
          || 'ITEM';

        const plus = item.plus
          ?? item.level
          ?? item.newPlus;

        card.innerHTML = `
          <strong>${escapeHTML(name)}</strong>
          ${plus !== undefined ? `<div>+${escapeHTML(plus)}</div>` : ''}
          ${item.duplicate ? '<div>重複ボーナス</div>' : ''}
        `;

        list.appendChild(card);
      });

      wrapper.appendChild(list);
    }

    Modal.open(wrapper, {
      title: result.title || 'PACK OPEN'
    });
  }

  /* ==========================================================================
     12. コレクション
     ========================================================================== */

  const Collection = {
    getCardAPI() {
      return resolveAPI('card');
    },

    getCards() {
      const api = this.getCardAPI();
      const cards = safeCall(api?.getCards);

      return Array.isArray(cards) ? cards : [];
    },

    getBadges() {
      const api = this.getCardAPI();
      const badges = safeCall(api?.getBadges);

      return Array.isArray(badges) ? badges : [];
    },

    getOwnedCount(type = 'cards') {
      const collection = Store.get(`collection.${type}`, {});

      return Object.values(collection).filter((entry) => {
        if (typeof entry === 'number') {
          return entry > 0;
        }

        return entry?.owned === true
          || toInt(entry?.count) > 0
          || toInt(entry?.plus) >= 0;
      }).length;
    },

    getBonus() {
      const api = this.getCardAPI();

      const external = safeCall(
        api?.calculateCollectionBonus,
        Store.getState()
      );

      if (external) {
        return external;
      }

      const cards = Store.get('collection.cards', {});
      const badges = Store.get('collection.badges', {});

      let percent = 0;

      [...Object.values(cards), ...Object.values(badges)]
        .forEach((entry) => {
          if (typeof entry === 'number') {
            if (entry > 0) {
              percent += 1;
            }
            return;
          }

          if (entry?.owned || toInt(entry?.count) > 0) {
            percent += 1;
            percent += Math.max(0, toInt(entry?.plus)) * 0.1;
          }
        });

      return {
        percent,
        multiplier: 1 + percent / 100
      };
    }
  };

  /* ==========================================================================
     13. ルーム
     ========================================================================== */

  const Room = {
    getCatalog() {
      const shopAPI = resolveAPI('shop');
      const rooms = safeCall(shopAPI?.getRooms);

      if (Array.isArray(rooms)) {
        return rooms;
      }

      const data = resolveData('shop');

      if (Array.isArray(data?.rooms)) {
        return data.rooms;
      }

      if (Array.isArray(ROOT.ROOMS)) {
        return ROOT.ROOMS;
      }

      return [
        {
          id: 'room-default',
          name: 'DEFAULT ROOM',
          image: ''
        }
      ];
    },

    select(roomId) {
      const id = String(roomId || '');
      const owned = Store.get('room.owned', []);

      if (!owned.includes(id)) {
        notify('このルームは所有していません', 'warning');

        return {
          ok: false,
          reason: 'not-owned'
        };
      }

      const shopAPI = resolveAPI('shop');

      const result = safeCall(
        shopAPI?.selectRoom,
        Store.getState(),
        id
      );

      if (result?.ok === false) {
        notify(result.message || 'ルームを変更できません', 'warning');
        return result;
      }

      if (result?.state || result?.patch) {
        applyExternalStateResult(result);
      } else {
        Store.set('room.selected', id);
      }

      applySelectedRoom();
      renderRoom();

      notify('ルームを変更しました', 'success');

      dispatch('roomchange', {
        roomId: id
      });

      return {
        ok: true,
        roomId: id
      };
    }
  };

  function applySelectedRoom() {
    const roomId = Store.get('room.selected', 'room-default');
    const room = Room.getCatalog().find((entry) => {
      return String(entry.id) === String(roomId);
    });

    document.body.dataset.room = roomId;

    const targets = document.querySelectorAll(
      '[data-room-background]'
    );

    targets.forEach((element) => {
      const image = room?.image
        || room?.background
        || room?.backgroundImage
        || '';

      if (image) {
        element.style.backgroundImage = `url("${image}")`;
      } else {
        element.style.removeProperty('background-image');
      }
    });
  }

  /* ==========================================================================
     14. コーチ
     ========================================================================== */

  const Coach = {
    getCatalog() {
      const api = resolveAPI('coach');
      const coaches = safeCall(api?.getCoaches);

      if (Array.isArray(coaches)) {
        return coaches;
      }

      const data = resolveData('coach');

      if (Array.isArray(data?.coaches)) {
        return data.coaches;
      }

      if (Array.isArray(data)) {
        return data;
      }

      return [];
    },

    select(coachId) {
      const id = String(coachId || '');
      const owned = Store.get('coach.owned', []);

      if (!owned.includes(id)) {
        notify('このコーチは所有していません', 'warning');

        return {
          ok: false,
          reason: 'not-owned'
        };
      }

      Store.set('coach.selected', id);
      renderCoach();

      notify('コーチを変更しました', 'success');

      dispatch('coachchange', {
        coachId: id
      });

      return {
        ok: true,
        coachId: id
      };
    },

    assign(role, coachId) {
      if (!ROLE_ORDER.includes(role)) {
        return {
          ok: false,
          reason: 'invalid-role'
        };
      }

      const owned = Store.get('coach.owned', []);

      if (!owned.includes(coachId)) {
        return {
          ok: false,
          reason: 'not-owned'
        };
      }

      Store.set(`coach.assignments.${role}`, coachId);
      renderCoach();

      return {
        ok: true,
        role,
        coachId
      };
    }
  };

  /* ==========================================================================
     15. 装備・バッグ
     ========================================================================== */

  const Equipment = {
    countEquipped() {
      return Store.get('inventory.equipped', []).length;
    },

    canEquip(itemId) {
      const equipped = Store.get('inventory.equipped', []);
      const capacity = Store.get('inventory.capacity', 10);

      if (equipped.includes(itemId)) {
        return {
          ok: true,
          alreadyEquipped: true
        };
      }

      if (equipped.length >= capacity) {
        return {
          ok: false,
          reason: 'capacity'
        };
      }

      const count = Store.get(`inventory.items.${itemId}`, 0);

      if (count <= 0) {
        return {
          ok: false,
          reason: 'not-owned'
        };
      }

      return {
        ok: true
      };
    },

    equip(itemId) {
      const check = this.canEquip(itemId);

      if (!check.ok) {
        notify(
          check.reason === 'capacity'
            ? 'バッグの装備枠がいっぱいです'
            : 'このアイテムを所有していません',
          'warning'
        );

        return check;
      }

      if (check.alreadyEquipped) {
        return {
          ok: true,
          unchanged: true
        };
      }

      Store.update('inventory.equipped', (equipped) => {
        return uniqueArray([
          ...(Array.isArray(equipped) ? equipped : []),
          itemId
        ]);
      });

      renderEquipment();

      return {
        ok: true,
        itemId
      };
    },

    unequip(itemId) {
      Store.update('inventory.equipped', (equipped) => {
        return (Array.isArray(equipped) ? equipped : [])
          .filter((id) => id !== itemId);
      });

      renderEquipment();

      return {
        ok: true,
        itemId
      };
    },

    use(itemId, quantity = 1) {
      const amount = Math.max(1, toInt(quantity, 1));
      const current = Store.get(`inventory.items.${itemId}`, 0);

      if (current < amount) {
        notify('アイテムが足りません', 'warning');

        return {
          ok: false,
          reason: 'quantity'
        };
      }

      Store.set(
        `inventory.items.${itemId}`,
        current - amount
      );

      renderEquipment();

      dispatch('itemuse', {
        itemId,
        quantity: amount
      });

      return {
        ok: true,
        itemId,
        quantity: amount
      };
    },

    selectWeaponSkin(skinId) {
      const owned = Store.get('inventory.weaponSkins', []);

      if (!owned.includes(skinId)) {
        notify('この武器スキンを所有していません', 'warning');

        return {
          ok: false,
          reason: 'not-owned'
        };
      }

      const shopAPI = resolveAPI('shop');

      const result = safeCall(
        shopAPI?.applyWeaponSkin,
        Store.getState(),
        skinId
      );

      if (result?.ok === false) {
        notify(result.message || 'スキンを変更できません', 'warning');
        return result;
      }

      if (result?.state || result?.patch) {
        applyExternalStateResult(result);
      } else {
        Store.set('inventory.selectedWeaponSkin', skinId);
      }

      renderEquipment();

      notify('武器スキンを変更しました', 'success');

      return {
        ok: true,
        skinId
      };
    }
  };

  /* ==========================================================================
     16. 週間処理
     ========================================================================== */

  const Weekly = {
    getWeekKey(date = new Date()) {
      const target = new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
      );

      const day = target.getUTCDay() || 7;
      target.setUTCDate(target.getUTCDate() + 4 - day);

      const yearStart = new Date(
        Date.UTC(target.getUTCFullYear(), 0, 1)
      );

      const week = Math.ceil(
        (
          (
            target - yearStart
          ) / 86400000
          + 1
        ) / 7
      );

      return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    },

    resetIfNeeded() {
      const currentKey = this.getWeekKey();
      const lastKey = Store.get('weekly.lastResetKey');

      if (lastKey === currentKey) {
        return false;
      }

      Store.transaction(() => {
        Store.set('weekly.lastResetKey', currentKey, {
          silent: true
        });
        Store.set('weekly.claimed', [], {
          silent: true
        });
        Store.set('weekly.missions', createWeeklyMissions(), {
          silent: true
        });
        Store.set('weekly.rewards', {}, {
          silent: true
        });
        Store.set(
          'tournament.week',
          Store.get('tournament.week', 0) + 1,
          {
            silent: true
          }
        );
      });

      dispatch('weeklyreset', {
        weekKey: currentKey
      });

      return true;
    },

    recordLogin() {
      const todayKey = new Date().toISOString().slice(0, 10);
      const lastLogin = Store.get('weekly.lastLoginDate');

      if (lastLogin === todayKey) {
        return false;
      }

      Store.transaction(() => {
        Store.set('weekly.lastLoginDate', todayKey, {
          silent: true
        });
        Store.set(
          'weekly.loginDays',
          Store.get('weekly.loginDays', 0) + 1,
          {
            silent: true
          }
        );
      });

      Currency.grant({
        coin: 500,
        energy: 10
      });

      notify('ログインボーナスを受け取りました', 'success');

      return true;
    }
  };

  function createWeeklyMissions() {
    return {
      training10: {
        id: 'training10',
        type: 'training',
        target: 10,
        progress: 0,
        completed: false,
        claimed: false,
        reward: {
          coin: 3000
        }
      },

      tournament3: {
        id: 'tournament3',
        type: 'tournament',
        target: 3,
        progress: 0,
        completed: false,
        claimed: false,
        reward: {
          diamond: 10
        }
      },

      upgrade5: {
        id: 'upgrade5',
        type: 'ability',
        target: 5,
        progress: 0,
        completed: false,
        claimed: false,
        reward: {
          coin: 2000,
          energy: 20
        }
      }
    };
  }

  function progressWeeklyMission(type, amount = 1) {
    const missions = Store.get('weekly.missions', {});
    let changed = false;

    Object.entries(missions).forEach(([missionId, mission]) => {
      if (
        mission.type !== type
        || mission.claimed
      ) {
        return;
      }

      const progress = Math.min(
        mission.target,
        toInt(mission.progress) + Math.max(0, toInt(amount))
      );

      Store.set(
        `weekly.missions.${missionId}.progress`,
        progress,
        {
          silent: true
        }
      );

      Store.set(
        `weekly.missions.${missionId}.completed`,
        progress >= mission.target,
        {
          silent: true
        }
      );

      changed = true;
    });

    if (changed) {
      Store.emit({
        type: 'weekly-progress',
        missionType: type
      });
    }
  }

  function claimWeeklyMission(missionId) {
    const mission = Store.get(`weekly.missions.${missionId}`);

    if (!mission || !mission.completed || mission.claimed) {
      return {
        ok: false
      };
    }

    Currency.grant(mission.reward);

    Store.set(
      `weekly.missions.${missionId}.claimed`,
      true
    );

    notify('週間ミッション報酬を受け取りました', 'success');

    return {
      ok: true,
      reward: mission.reward
    };
  }

  /* ==========================================================================
     17. 大会連携
     ========================================================================== */

  const Tournament = {
    start(tournamentId, options = {}) {
      const id = String(tournamentId || '');
      const gameAPI = resolveAPI('game');

      Store.transaction(() => {
        Store.set('tournament.activeTournamentId', id, {
          silent: true
        });

        Store.set(
          'tournament.records.entries',
          Store.get('tournament.records.entries', 0) + 1,
          {
            silent: true
          }
        );
      });

      const payload = {
        tournamentId: id,
        state: Store.getState(),
        options
      };

      const result = safeCall(
        gameAPI?.startTournament,
        payload
      );

      dispatch('tournamentstart', payload);

      if (result?.screen) {
        Router.go(result.screen, {
          force: true
        });
      }

      return {
        ok: true,
        tournamentId: id,
        result
      };
    },

    complete(result = {}) {
      const placement = Math.max(
        1,
        toInt(result.placement, 20)
      );

      const records = Store.get('tournament.records');

      Store.transaction(() => {
        Store.set(
          'tournament.records.wins',
          records.wins + (placement === 1 ? 1 : 0),
          {
            silent: true
          }
        );

        Store.set(
          'tournament.records.top3',
          records.top3 + (placement <= 3 ? 1 : 0),
          {
            silent: true
          }
        );

        Store.set(
          'tournament.records.kills',
          records.kills + Math.max(0, toInt(result.kills)),
          {
            silent: true
          }
        );

        Store.set(
          'tournament.records.assists',
          records.assists + Math.max(0, toInt(result.assists)),
          {
            silent: true
          }
        );

        Store.set(
          'tournament.records.damage',
          records.damage + Math.max(0, toInt(result.damage)),
          {
            silent: true
          }
        );

        const previousBest = records.bestPlacement;

        Store.set(
          'tournament.records.bestPlacement',
          previousBest === null
            ? placement
            : Math.min(previousBest, placement),
          {
            silent: true
          }
        );

        const history = Store.get('tournament.history', []).slice();

        history.unshift({
          ...deepClone(result),
          placement,
          tournamentId: Store.get('tournament.activeTournamentId'),
          timestamp: nowISO()
        });

        Store.set(
          'tournament.history',
          history.slice(0, 100),
          {
            silent: true
          }
        );

        Store.set('tournament.activeTournamentId', null, {
          silent: true
        });

        Store.set('tournament.activeMatchId', null, {
          silent: true
        });
      });

      const reward = calculateTournamentReward(result);
      Currency.grant(reward);
      addCompanyExp(calculateTournamentCompanyExp(result));
      progressWeeklyMission('tournament', 1);

      notify(
        `${placement}位 / 報酬を獲得しました`,
        placement === 1 ? 'success' : 'info',
        3200
      );

      renderAll();

      dispatch('tournamentcomplete', {
        result,
        reward
      });

      return {
        ok: true,
        reward
      };
    }
  };

  function calculateTournamentReward(result) {
    const placement = Math.max(
      1,
      toInt(result.placement, 20)
    );

    const kills = Math.max(
      0,
      toInt(result.kills)
    );

    const placementCoins = {
      1: 8000,
      2: 6000,
      3: 4500,
      4: 3500,
      5: 3000,
      6: 2500,
      7: 2200,
      8: 1900,
      9: 1600,
      10: 1400,
      11: 1200,
      12: 1000
    };

    const reward = {
      coin: placementCoins[placement] || 700,
      diamond: placement === 1
        ? 10
        : placement <= 3
          ? 5
          : 0
    };

    reward.coin += kills * 150;

    if (isObject(result.reward)) {
      Object.entries(result.reward).forEach(([type, amount]) => {
        reward[type] = Math.max(
          reward[type] || 0,
          toInt(amount)
        );
      });
    }

    return reward;
  }

  function calculateTournamentCompanyExp(result) {
    const placement = Math.max(
      1,
      toInt(result.placement, 20)
    );

    const kills = Math.max(
      0,
      toInt(result.kills)
    );

    return Math.max(
      10,
      110 - placement * 5 + kills * 3
    );
  }

  /* ==========================================================================
     18. 描画
     ========================================================================== */

  const ScreenRenderers = {
    home: renderHome,
    training: renderTraining,
    ability: renderAbility,
    collection: renderCollection,
    shop: renderShop,
    room: renderRoom,
    coach: renderCoach,
    equipment: renderEquipment,
    tournament: renderTournament,
    settings: renderSettings,
    team: renderTeam
  };

  function renderAll() {
    renderProfile();
    renderCurrencies();
    renderScreen(
      Store.get('ui.currentScreen', DEFAULT_SCREEN)
    );
    updateNavigationState();
    applySelectedRoom();
  }

  function renderScreen(screenName) {
    const screen = normalizeScreenName(screenName);
    const renderer = ScreenRenderers[screen];

    safeCall(renderer);

    document
      .querySelectorAll('[data-bind]')
      .forEach((element) => {
        const path = element.dataset.bind;
        const value = Store.get(path, '');

        if (
          element instanceof HTMLInputElement
          || element instanceof HTMLTextAreaElement
          || element instanceof HTMLSelectElement
        ) {
          element.value = value ?? '';
        } else {
          element.textContent = value ?? '';
        }
      });

    document
      .querySelectorAll('[data-bind-number]')
      .forEach((element) => {
        element.textContent = formatNumber(
          Store.get(element.dataset.bindNumber, 0)
        );
      });
  }

  function renderProfile() {
    const profile = Store.get('profile');

    setTextAll('[data-player-name]', profile.playerName);
    setTextAll('[data-company-name]', profile.companyName);
    setTextAll('[data-company-rank]', profile.companyRank);
    setTextAll('[data-player-rank]', profile.playerRank);
    setTextAll('[data-player-role]', profile.role);

    setProgressAll(
      '[data-company-exp-progress]',
      profile.companyExp,
      profile.companyExpNext
    );

    setProgressAll(
      '[data-player-exp-progress]',
      profile.playerExp,
      profile.playerExpNext
    );
  }

  function renderCurrencies() {
    const currencies = Store.get('currencies');

    Object.entries(currencies).forEach(([type, value]) => {
      setTextAll(
        `[data-currency="${CSS.escape(type)}"]`,
        formatNumber(value)
      );
    });

    setTextAll(
      '[data-energy-text]',
      `${formatNumber(currencies.energy)} / ${formatNumber(currencies.maxEnergy)}`
    );

    setProgressAll(
      '[data-energy-progress]',
      currencies.energy,
      currencies.maxEnergy
    );
  }

  function renderHome() {
    renderProfile();
    renderCurrencies();

    const bonus = Collection.getBonus();
    const percent = toNumber(
      bonus?.percent
      ?? (
        (toNumber(bonus?.multiplier, 1) - 1) * 100
      )
    );

    setTextAll(
      '[data-collection-bonus]',
      formatPercent(percent)
    );

    const selectedRoom = Store.get('room.selected');

    setTextAll(
      '[data-selected-room]',
      Room.getCatalog().find((room) => room.id === selectedRoom)?.name
      || selectedRoom
    );

    const selectedCoach = Store.get('coach.selected');

    setTextAll(
      '[data-selected-coach]',
      Coach.getCatalog().find((coach) => coach.id === selectedCoach)?.name
      || '未設定'
    );

    setTextAll(
      '[data-training-total]',
      formatNumber(Store.get('training.totalSessions', 0))
    );

    setTextAll(
      '[data-tournament-wins]',
      formatNumber(Store.get('tournament.records.wins', 0))
    );
  }

  function renderTraining() {
    TRAINING_POINT_KEYS.forEach((key) => {
      setTextAll(
        `[data-training-point="${CSS.escape(key)}"]`,
        formatNumber(
          Store.get(`training.points.${key}`, 0)
        )
      );
    });

    document
      .querySelectorAll('[data-training-id]')
      .forEach((element) => {
        const training = Training.getById(
          element.dataset.trainingId
        );

        if (!training) {
          return;
        }

        const energyCost = Math.max(
          0,
          toInt(
            training.energyCost
            ?? training.cost?.energy
            ?? training.energy
          )
        );

        const affordable = Currency.get('energy') >= energyCost;

        element.classList.toggle('is-disabled', !affordable);
        element.setAttribute(
          'aria-disabled',
          affordable ? 'false' : 'true'
        );

        const costTarget = element.querySelector(
          '[data-training-energy-cost]'
        );

        if (costTarget) {
          costTarget.textContent = energyCost;
        }
      });
  }

  function renderAbility() {
    TRAINING_POINT_KEYS.forEach((key) => {
      setTextAll(
        `[data-ability-point="${CSS.escape(key)}"]`,
        formatNumber(
          Store.get(`training.points.${key}`, 0)
        )
      );
    });

    STAT_KEYS.forEach((statKey) => {
      const stat = Ability.getCurrent(statKey);
      const cost = Ability.getUpgradeCost(statKey);
      const check = Ability.canUpgrade(statKey);

      setTextAll(
        `[data-stat-rank="${CSS.escape(statKey)}"]`,
        stat?.rank || 'F1'
      );

      setTextAll(
        `[data-stat-value="${CSS.escape(statKey)}"]`,
        formatNumber(stat?.value || stat?.level || 1)
      );

      document
        .querySelectorAll(
          `[data-ability-upgrade="${CSS.escape(statKey)}"]`
        )
        .forEach((button) => {
          button.classList.toggle('is-disabled', !check.ok);
          button.setAttribute(
            'aria-disabled',
            check.ok ? 'false' : 'true'
          );
        });

      const costText = Object.entries(cost)
        .map(([key, amount]) => `${key.toUpperCase()} ${amount}`)
        .join(' / ');

      setTextAll(
        `[data-stat-cost="${CSS.escape(statKey)}"]`,
        costText
      );
    });
  }

  function renderCollection() {
    const type = Store.get(
      'ui.selectedCollectionType',
      'cards'
    );

    const list = type === 'badges'
      ? Collection.getBadges()
      : Collection.getCards();

    const ownedMap = Store.get(`collection.${type}`, {});

    setTextAll(
      '[data-collection-owned]',
      formatNumber(Collection.getOwnedCount(type))
    );

    setTextAll(
      '[data-collection-total]',
      formatNumber(list.length)
    );

    const bonus = Collection.getBonus();

    setTextAll(
      '[data-collection-bonus]',
      formatPercent(
        toNumber(
          bonus?.percent
          ?? (
            (toNumber(bonus?.multiplier, 1) - 1) * 100
          )
        )
      )
    );

    const container = document.querySelector(
      '[data-collection-list]'
    );

    if (!container || container.dataset.manualRender === 'true') {
      return;
    }

    container.innerHTML = '';

    list.forEach((item) => {
      const owned = ownedMap[item.id];
      const isOwned = typeof owned === 'number'
        ? owned > 0
        : Boolean(
          owned?.owned
          || toInt(owned?.count) > 0
          || owned?.plus !== undefined
        );

      const card = document.createElement('article');
      card.className = 'collection-card';
      card.classList.toggle('is-locked', !isOwned);

      card.innerHTML = `
        ${item.image ? `<img src="${escapeHTML(item.image)}" alt="">` : ''}
        <strong>${escapeHTML(isOwned ? item.name : '???')}</strong>
        <span>${escapeHTML(item.region || item.category || '')}</span>
        ${isOwned && owned?.plus ? `<b>+${escapeHTML(owned.plus)}</b>` : ''}
      `;

      container.appendChild(card);
    });
  }

  function renderShop() {
    const category = Store.get(
      'ui.selectedShopCategory',
      'all'
    );

    const products = Shop.getProducts(category);
    const container = document.querySelector('[data-shop-list]');

    if (!container || container.dataset.manualRender === 'true') {
      return;
    }

    container.innerHTML = '';

    products.forEach((product) => {
      const cost = normalizeShopCost(
        product.cost || product.price || {}
      );

      const item = document.createElement('article');
      item.className = 'shop-item';

      const costText = Object.entries(cost)
        .map(([type, amount]) => {
          return `${type.toUpperCase()} ${formatNumber(amount)}`;
        })
        .join(' / ');

      item.innerHTML = `
        ${product.image ? `<img src="${escapeHTML(product.image)}" alt="">` : ''}
        <strong>${escapeHTML(product.name || product.id)}</strong>
        <p>${escapeHTML(product.description || '')}</p>
        <span>${escapeHTML(costText || 'FREE')}</span>
        <button
          type="button"
          data-action="purchase"
          data-product-id="${escapeHTML(product.id)}"
        >
          BUY
        </button>
      `;

      container.appendChild(item);
    });
  }

  function renderRoom() {
    const catalog = Room.getCatalog();
    const owned = Store.get('room.owned', []);
    const selected = Store.get('room.selected');

    document.querySelectorAll('[data-room-id]').forEach((element) => {
      const roomId = element.dataset.roomId;
      const isOwned = owned.includes(roomId);
      const isSelected = selected === roomId;

      element.classList.toggle('is-owned', isOwned);
      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-locked', !isOwned);
    });

    const container = document.querySelector('[data-room-list]');

    if (!container || container.dataset.manualRender === 'true') {
      applySelectedRoom();
      return;
    }

    container.innerHTML = '';

    catalog.forEach((room) => {
      const isOwned = owned.includes(room.id);
      const isSelected = selected === room.id;
      const card = document.createElement('article');

      card.className = 'room-card';
      card.classList.toggle('is-selected', isSelected);
      card.classList.toggle('is-locked', !isOwned);

      card.innerHTML = `
        ${room.image ? `<img src="${escapeHTML(room.image)}" alt="">` : ''}
        <strong>${escapeHTML(room.name || room.id)}</strong>
        <button
          type="button"
          data-action="${isOwned ? 'select-room' : 'purchase'}"
          ${isOwned
            ? `data-room-id="${escapeHTML(room.id)}"`
            : `data-product-id="${escapeHTML(room.id)}"`
          }
        >
          ${isSelected ? 'SELECTED' : isOwned ? 'SELECT' : 'BUY'}
        </button>
      `;

      container.appendChild(card);
    });

    applySelectedRoom();
  }

  function renderCoach() {
    const coaches = Coach.getCatalog();
    const owned = Store.get('coach.owned', []);
    const selected = Store.get('coach.selected');
    const container = document.querySelector('[data-coach-list]');

    if (!container || container.dataset.manualRender === 'true') {
      return;
    }

    container.innerHTML = '';

    coaches.forEach((coach) => {
      const isOwned = owned.includes(coach.id);
      const isSelected = selected === coach.id;
      const card = document.createElement('article');

      card.className = 'coach-card';
      card.classList.toggle('is-selected', isSelected);
      card.classList.toggle('is-locked', !isOwned);

      card.innerHTML = `
        ${coach.image ? `<img src="${escapeHTML(coach.image)}" alt="">` : ''}
        <strong>${escapeHTML(coach.name || coach.id)}</strong>
        <p>${escapeHTML(coach.description || '')}</p>
        <button
          type="button"
          data-action="select-coach"
          data-coach-id="${escapeHTML(coach.id)}"
          ${isOwned ? '' : 'disabled'}
        >
          ${isSelected ? 'SELECTED' : isOwned ? 'SELECT' : 'LOCKED'}
        </button>
      `;

      container.appendChild(card);
    });
  }

  function renderEquipment() {
    const items = Store.get('inventory.items', {});
    const equipped = Store.get('inventory.equipped', []);
    const capacity = Store.get('inventory.capacity', 10);

    setTextAll(
      '[data-equipment-count]',
      `${equipped.length} / ${capacity}`
    );

    document
      .querySelectorAll('[data-equipment-item]')
      .forEach((element) => {
        const itemId = element.dataset.equipmentItem;
        const count = toInt(items[itemId]);
        const isEquipped = equipped.includes(itemId);

        element.classList.toggle('is-equipped', isEquipped);
        element.classList.toggle('is-empty', count <= 0);

        const countTarget = element.querySelector(
          '[data-item-count]'
        );

        if (countTarget) {
          countTarget.textContent = formatNumber(count);
        }
      });
  }

  function renderTournament() {
    const records = Store.get('tournament.records');

    Object.entries(records).forEach(([key, value]) => {
      setTextAll(
        `[data-tournament-record="${CSS.escape(key)}"]`,
        value === null ? '-' : formatNumber(value)
      );
    });
  }

  function renderSettings() {
    const settings = Store.get('settings');

    Object.entries(settings).forEach(([key, value]) => {
      document
        .querySelectorAll(
          `[data-setting="${CSS.escape(key)}"]`
        )
        .forEach((element) => {
          if (
            element instanceof HTMLInputElement
            && element.type === 'checkbox'
          ) {
            element.checked = Boolean(value);
          } else if (
            element instanceof HTMLInputElement
            || element instanceof HTMLSelectElement
          ) {
            element.value = String(value);
          }
        });
    });
  }

  function renderTeam() {
    const team = Store.get('team');

    setTextAll('[data-team-name]', team.name);

    ROLE_ORDER.forEach((role) => {
      const member = team.members.find((entry) => {
        return entry.role === role;
      });

      setTextAll(
        `[data-team-member="${role}"]`,
        member?.name || '-'
      );
    });
  }

  function setTextAll(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value ?? '';
    });
  }

  function setProgressAll(selector, value, max) {
    const safeMax = Math.max(1, toNumber(max, 1));
    const safeValue = clamp(toNumber(value), 0, safeMax);
    const percent = safeValue / safeMax * 100;

    document.querySelectorAll(selector).forEach((element) => {
      if (element instanceof HTMLProgressElement) {
        element.max = safeMax;
        element.value = safeValue;
      } else {
        element.style.setProperty(
          '--progress',
          `${percent}%`
        );

        element.dataset.progress = String(percent);
      }
    });
  }

  /* ==========================================================================
     19. UIアクション
     ========================================================================== */

  async function handleAction(element, event) {
    const action = element.dataset.action;

    switch (action) {
      case 'navigate':
      case 'screen':
        Router.go(
          element.dataset.screenTarget
          || element.dataset.screen
          || element.dataset.target
        );
        break;

      case 'back':
        Router.back();
        break;

      case 'save':
        SaveManager.save();
        break;

      case 'load':
        SaveManager.load();
        renderAll();
        Router.go(
          Store.get('ui.currentScreen', DEFAULT_SCREEN),
          {
            force: true
          }
        );
        break;

      case 'reset-save': {
        const accepted = await Modal.confirm(
          'すべてのセーブデータを削除します。\nこの操作は取り消せません。',
          {
            title: 'セーブデータ削除',
            confirmText: '削除する'
          }
        );

        if (accepted) {
          SaveManager.reset();
          renderAll();
        }
        break;
      }

      case 'training':
      case 'start-training':
        Training.start(
          element.dataset.trainingId
          || element.dataset.id
        );
        progressWeeklyMission('training', 1);
        break;

      case 'upgrade-ability':
        Ability.upgrade(
          element.dataset.stat
          || element.dataset.ability
          || element.dataset.abilityUpgrade
        );
        progressWeeklyMission('ability', 1);
        break;

      case 'purchase':
        Shop.purchase(
          element.dataset.productId
          || element.dataset.itemId
          || element.dataset.id,
          element.dataset.quantity || 1
        );
        break;

      case 'purchase-pack':
        Shop.purchasePack(
          element.dataset.packId
          || element.dataset.productId,
          element.dataset.quantity || 1
        );
        break;

      case 'open-pack':
        Shop.openPack(
          element.dataset.packId,
          element.dataset.quantity || 1
        );
        break;

      case 'draw-weapon-skin':
        Shop.drawWeaponSkin();
        break;

      case 'select-room':
        Room.select(
          element.dataset.roomId
          || element.dataset.id
        );
        break;

      case 'select-coach':
        Coach.select(
          element.dataset.coachId
          || element.dataset.id
        );
        break;

      case 'assign-coach':
        Coach.assign(
          element.dataset.role,
          element.dataset.coachId
        );
        break;

      case 'equip-item':
        Equipment.equip(
          element.dataset.itemId
        );
        break;

      case 'unequip-item':
        Equipment.unequip(
          element.dataset.itemId
        );
        break;

      case 'use-item':
        Equipment.use(
          element.dataset.itemId,
          element.dataset.quantity || 1
        );
        break;

      case 'select-weapon-skin':
        Equipment.selectWeaponSkin(
          element.dataset.skinId
        );
        break;

      case 'start-tournament':
        Tournament.start(
          element.dataset.tournamentId
          || element.dataset.id,
          getDatasetJSON(element, 'options', {})
        );
        break;

      case 'claim-weekly':
        claimWeeklyMission(
          element.dataset.missionId
        );
        break;

      case 'collection-type':
        Store.set(
          'ui.selectedCollectionType',
          element.dataset.collectionType
          || element.dataset.type
          || 'cards'
        );
        renderCollection();
        break;

      case 'shop-category':
        Store.set(
          'ui.selectedShopCategory',
          element.dataset.shopCategory
          || element.dataset.category
          || 'all'
        );
        renderShop();
        break;

      case 'modal-close':
        Modal.close();
        break;

      case 'export-save':
        exportSaveFile();
        break;

      case 'import-save':
        openImportSaveDialog();
        break;

      case 'toggle-admin':
        Store.set(
          'flags.adminMode',
          !Store.get('flags.adminMode')
        );
        notify(
          Store.get('flags.adminMode')
            ? '管理者モードを有効にしました'
            : '管理者モードを無効にしました',
          'info'
        );
        break;

      default:
        dispatch('action', {
          action,
          element,
          event
        });
        break;
    }
  }

  function bindGlobalEvents() {
    document.addEventListener('click', (event) => {
      const actionElement = event.target.closest('[data-action]');

      if (actionElement) {
        event.preventDefault();
        handleAction(actionElement, event);
        return;
      }

      const navElement = event.target.closest(
        '[data-screen-target], [data-nav]'
      );

      if (navElement) {
        event.preventDefault();

        Router.go(
          navElement.dataset.screenTarget
          || navElement.dataset.nav
        );
      }
    });

    document.addEventListener('change', (event) => {
      const target = event.target;

      if (target.matches('[data-setting]')) {
        const key = target.dataset.setting;

        const value = target instanceof HTMLInputElement
          && target.type === 'checkbox'
          ? target.checked
          : target.value;

        Store.set(`settings.${key}`, value);
        applySettings();
        return;
      }

      if (target.matches('[data-bind-input]')) {
        Store.set(
          target.dataset.bindInput,
          target.value
        );
      }
    });

    document.addEventListener('input', (event) => {
      const target = event.target;

      if (target.matches('[data-bind-live]')) {
        Store.set(
          target.dataset.bindLive,
          target.value,
          {
            silent: true
          }
        );
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        Modal.close();
      }

      if (
        event.ctrlKey
        && event.key.toLowerCase() === 's'
      ) {
        event.preventDefault();
        SaveManager.save();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (
        Store.dirty
        && Store.get('settings.autoSave', true)
      ) {
        SaveManager.save({
          silent: true
        });
      }
    });

    document.addEventListener(
      'mobbr:trainingcomplete',
      () => {
        progressWeeklyMission('training', 1);
      }
    );

    document.addEventListener(
      'mobbr:abilityupgrade',
      () => {
        progressWeeklyMission('ability', 1);
      }
    );
  }

  /* ==========================================================================
     20. 設定・セーブ入出力
     ========================================================================== */

  function applySettings() {
    const settings = Store.get('settings');

    document.body.classList.toggle(
      'is-reduced-motion',
      Boolean(settings.reducedMotion)
    );

    document.body.dataset.soundEnabled = String(
      Boolean(settings.soundEnabled)
    );

    document.body.dataset.musicEnabled = String(
      Boolean(settings.musicEnabled)
    );

    document.body.dataset.vibrationEnabled = String(
      Boolean(settings.vibrationEnabled)
    );

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    dispatch('settingschange', {
      settings
    });
  }

  function exportSaveFile() {
    const content = SaveManager.export();
    const blob = new Blob(
      [content],
      {
        type: 'application/json'
      }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `mobbr-save-${new Date()
      .toISOString()
      .replaceAll(':', '-')
      .slice(0, 19)}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    notify('セーブデータを書き出しました', 'success');
  }

  function openImportSaveDialog() {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        SaveManager.import(text);
        renderAll();
      } catch (error) {
        console.error(error);
        notify('ファイルを読み込めませんでした', 'error');
      }
    });

    input.click();
  }

  /* ==========================================================================
     21. 自動セーブ・プレイ時間
     ========================================================================== */

  let autoSaveTimer = null;
  let playTimeTimer = null;

  function startTimers() {
    stopTimers();

    autoSaveTimer = window.setInterval(() => {
      if (
        Store.dirty
        && Store.get('settings.autoSave', true)
      ) {
        SaveManager.save({
          silent: true
        });
      }
    }, AUTOSAVE_INTERVAL);

    playTimeTimer = window.setInterval(() => {
      Store.set(
        'meta.playTimeSeconds',
        Store.get('meta.playTimeSeconds', 0) + 1,
        {
          silent: true
        }
      );

      Store.dirty = true;
    }, 1000);
  }

  function stopTimers() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }

    if (playTimeTimer) {
      clearInterval(playTimeTimer);
      playTimeTimer = null;
    }
  }

  /* ==========================================================================
     22. データ検証
     ========================================================================== */

  function validateModules() {
    const reports = {};

    [
      'game',
      'ability',
      'training',
      'coach',
      'cpu',
      'card',
      'shop'
    ].forEach((name) => {
      const api = resolveAPI(name);

      if (typeof api?.validate === 'function') {
        reports[name] = safeCall(api.validate);
      }
    });

    const errors = [];

    if (!Store.get('training.stats')) {
      errors.push('training.stats is missing');
    }

    STAT_KEYS.forEach((key) => {
      if (!Store.get(`training.stats.${key}`)) {
        errors.push(`training.stats.${key} is missing`);
      }
    });

    TRAINING_POINT_KEYS.forEach((key) => {
      if (
        Store.get(`training.points.${key}`) === undefined
      ) {
        errors.push(`training.points.${key} is missing`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
      modules: reports
    };
  }

  /* ==========================================================================
     23. 初期化
     ========================================================================== */

  let initialized = false;

  function initialize() {
    if (initialized) {
      return MOBBR.APP;
    }

    initialized = true;

    const loadResult = SaveManager.load({
      silent: true
    });

    Weekly.resetIfNeeded();
    Weekly.recordLogin();

    Store.set('flags.initialized', true, {
      silent: true
    });

    bindGlobalEvents();
    applySettings();
    applySelectedRoom();
    startTimers();

    Store.subscribe((state, change) => {
      if (
        change?.type !== 'external-result'
        && change?.type !== 'weekly-progress'
      ) {
        renderProfile();
        renderCurrencies();
      }
    });

    const requestedScreen = normalizeScreenName(
      Store.get('ui.currentScreen', DEFAULT_SCREEN)
    );

    Router.current = requestedScreen;
    Router.go(requestedScreen, {
      force: true
    });

    renderAll();

    const validation = validateModules();

    if (!validation.ok) {
      console.warn(
        '[MOB BR] Validation warnings:',
        validation.errors
      );
    }

    Store.clearDirty();

    dispatch('ready', {
      state: Store.getState(),
      loadResult,
      validation
    });

    return MOBBR.APP;
  }

  /* ==========================================================================
     24. 公開API
     ========================================================================== */

  Object.assign(MOBBR.APP, {
    version: APP_VERSION,

    initialize,

    get initialized() {
      return initialized;
    },

    get state() {
      return Store.getState();
    },

    store: Store,
    router: Router,
    save: SaveManager,
    modal: Modal,
    currency: Currency,
    training: Training,
    ability: Ability,
    shop: Shop,
    collection: Collection,
    room: Room,
    coach: Coach,
    equipment: Equipment,
    weekly: Weekly,
    tournament: Tournament,

    render: renderAll,
    renderScreen,
    notify,
    validate: validateModules,

    getState() {
      return Store.getState();
    },

    setState(nextState) {
      Store.replace(nextState);
      renderAll();
    },

    resetState() {
      SaveManager.reset();
      renderAll();
    },

    completeTournament(result) {
      return Tournament.complete(result);
    },

    startTournament(tournamentId, options) {
      return Tournament.start(tournamentId, options);
    },

    addCurrency(type, amount) {
      return Currency.add(type, amount);
    },

    spendCurrency(cost) {
      return Currency.spend(cost);
    },

    addCompanyExp,

    openScreen(screenName) {
      return Router.go(screenName);
    },

    closeModal() {
      Modal.close();
    }
  });

  ROOT.MOBBR_APP = MOBBR.APP;
  ROOT.MOBBR_STATE = Store.state;

  ROOT.saveGame = function saveGame() {
    return SaveManager.save();
  };

  ROOT.loadGame = function loadGame() {
    const result = SaveManager.load();
    renderAll();
    return result;
  };

  ROOT.resetGame = function resetGame() {
    return SaveManager.reset();
  };

  ROOT.showScreen = function showScreen(screenName) {
    return Router.go(screenName);
  };

  ROOT.startTraining = function startTraining(trainingId) {
    return Training.start(trainingId);
  };

  ROOT.upgradeAbility = function upgradeAbility(statKey) {
    return Ability.upgrade(statKey);
  };

  ROOT.purchaseShopItem = function purchaseShopItem(
    productId,
    quantity = 1
  ) {
    return Shop.purchase(productId, quantity);
  };

  ROOT.openCardPack = function openCardPack(
    packId,
    quantity = 1
  ) {
    return Shop.openPack(packId, quantity);
  };

  ROOT.selectRoom = function selectRoom(roomId) {
    return Room.select(roomId);
  };

  ROOT.selectCoach = function selectCoach(coachId) {
    return Coach.select(coachId);
  };

  ROOT.completeTournament = function completeTournament(result) {
    return Tournament.complete(result);
  };

  /* ==========================================================================
     25. 起動
     ========================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }
})();
