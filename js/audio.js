/* Emogame audio — self-contained SFX + music + ambience.
   Data-driven via content/audio.json (EG.AUDIO). No layout/CSS. */
(function () {
  'use strict';

  const LS_KEY = 'eg_audio_prefs';
  const DEF_PREFS = () => ({ musicOn: true, sfxOn: true, musicVol: 0.7, sfxVol: 0.85, muted: false });

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return Object.assign(DEF_PREFS(), JSON.parse(raw));
    } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem('eg_save') || '{}');
      const p = DEF_PREFS();
      if (typeof s.musicOn === 'boolean') p.musicOn = s.musicOn;
      if (typeof s.sfx === 'boolean') p.sfxOn = s.sfx;
      return p;
    } catch (e) {}
    return DEF_PREFS();
  }

  function savePrefs(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem('eg_save') || '{}');
      s.musicOn = !!p.musicOn;
      s.sfx = !!p.sfxOn;
      localStorage.setItem('eg_save', JSON.stringify(s));
    } catch (e) {}
  }

  const AudioSys = {
    prefs: loadPrefs(),
    map: null,
    ready: false,
    unlocked: false,
    _cache: {},
    _music: null,
    _musicKey: null,
    _amb: null,
    _ambKey: null,
    _xfadeMs: 900,
    _bus: [],

    async init() {
      let map = window.EG && EG.AUDIO;
      if (!map) {
        try { map = await (await fetch('content/audio.json')).json(); }
        catch (e) { map = { sfx: {}, music: {}, ambience: {}, base: 'assets/audio/' }; }
      }
      this.map = map;
      this.ready = true;
      this._bindUnlock();
      this._bindVisibility();
      this._bindAndroid();
      ['ui_tap', 'sheet_open', 'sheet_close', 'coin', 'eat', 'drink', 'error', 'notification', 'travel', 'door']
        .forEach(k => this._ensure(k, 'sfx'));
      return this;
    },

    _bindUnlock() {
      if (this.unlocked) return;
      const unlock = () => {
        if (this.unlocked) return;
        this.unlocked = true;
        if (this._music && this.prefs.musicOn && !this.prefs.muted) {
          this._music.play().catch(() => {});
        }
        document.removeEventListener('pointerdown', unlock, true);
        document.removeEventListener('keydown', unlock, true);
        document.removeEventListener('touchstart', unlock, true);
      };
      document.addEventListener('pointerdown', unlock, true);
      document.addEventListener('keydown', unlock, true);
      document.addEventListener('touchstart', unlock, true);
    },

    _bindVisibility() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pauseAll();
        else this.resumeAll();
      });
      window.addEventListener('pagehide', () => this.pauseAll());
      window.addEventListener('pageshow', () => this.resumeAll());
    },

    _bindAndroid() {
      window.__egAudioOnPause = () => this.pauseAll();
      window.__egAudioOnResume = () => this.resumeAll();
      try {
        if (window.PL && typeof PL.on === 'function') {
          PL.on('pause', () => this.pauseAll());
          PL.on('resume', () => this.resumeAll());
        }
      } catch (e) {}
    },

    setPrefs(partial) {
      Object.assign(this.prefs, partial || {});
      savePrefs(this.prefs);
      this._applyVol();
      if (this.prefs.muted || !this.prefs.musicOn) {
        if (this._music) this._music.pause();
      } else if (this._music && this.unlocked) {
        this._music.play().catch(() => {});
      }
      if (this.prefs.muted || !this.prefs.sfxOn) {
        if (this._amb) this._amb.pause();
      } else if (this._amb && this.unlocked) {
        this._amb.play().catch(() => {});
      }
    },

    getPrefs() { return Object.assign({}, this.prefs); },

    _applyVol() {
      const mv = (this.prefs.muted || !this.prefs.musicOn) ? 0 : this.prefs.musicVol;
      const sv = (this.prefs.muted || !this.prefs.sfxOn) ? 0 : this.prefs.sfxVol;
      if (this._music) {
        const meta = (this.map.music && this.map.music[this._musicKey]) || {};
        this._music.volume = Math.max(0, Math.min(1, (meta.vol || 0.45) * mv));
      }
      if (this._amb) {
        const meta = (this.map.ambience && this.map.ambience[this._ambKey]) || {};
        this._amb.volume = Math.max(0, Math.min(1, (meta.vol || 0.3) * sv));
      }
    },

    _url(rel) {
      const base = (this.map && this.map.base) || 'assets/audio/';
      const formats = (this.map && this.map.formats) || ['ogg', 'mp3'];
      return formats.map(ext => base + rel + '.' + ext);
    },

    _makeAudio(rel, loop) {
      const a = new Audio();
      a.preload = 'auto';
      a.loop = !!loop;
      const urls = this._url(rel);
      let picked = urls[0];
      try {
        if (a.canPlayType('audio/ogg; codecs=opus') || a.canPlayType('audio/ogg')) {
          picked = urls.find(u => u.endsWith('.ogg')) || urls[0];
        } else {
          picked = urls.find(u => u.endsWith('.mp3')) || urls[0];
        }
      } catch (e) {}
      a.src = picked;
      return a;
    },

    _ensure(key, kind) {
      const bucket = kind === 'music' ? this.map.music
        : (kind === 'ambience' ? this.map.ambience : this.map.sfx);
      const meta = bucket && bucket[key];
      if (!meta) return null;
      const ck = kind + ':' + key;
      if (this._cache[ck]) return this._cache[ck];
      const loop = !!meta.loop || kind === 'music' || kind === 'ambience';
      const a = this._makeAudio(meta.file, loop);
      this._cache[ck] = a;
      return a;
    },

    playSfx(key, opts) {
      if (!this.ready || !this.map) return;
      if (this.prefs.muted || !this.prefs.sfxOn) return;
      if (!this.unlocked) return;
      const meta = (this.map.sfx && this.map.sfx[key]) || null;
      if (!meta) return;
      const base = this._ensure(key, 'sfx');
      if (!base) return;
      let a;
      try { a = base.cloneNode(true); }
      catch (e) { a = this._makeAudio(meta.file, false); }
      const volMul = (opts && opts.vol != null) ? opts.vol : 1;
      a.volume = Math.max(0, Math.min(1, (meta.vol || 0.6) * this.prefs.sfxVol * volMul));
      try { a.currentTime = 0; } catch (e) {}
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      return a;
    },

    _crossfadeTo(slot, nextAudio, nextKey, kind) {
      const prev = this[slot];
      const fade = this._xfadeMs;
      const metaBucket = kind === 'music' ? this.map.music : this.map.ambience;
      const meta = (metaBucket && metaBucket[nextKey]) || {};
      const channelOn = kind === 'music' ? this.prefs.musicOn : this.prefs.sfxOn;
      const channelVol = kind === 'music' ? this.prefs.musicVol : this.prefs.sfxVol;
      const muted = this.prefs.muted || !channelOn;
      const targetVol = muted ? 0 : Math.max(0, Math.min(1, (meta.vol || 0.4) * channelVol));

      if (prev === nextAudio) { this._applyVol(); return; }

      if (nextAudio) {
        nextAudio.loop = true;
        nextAudio.volume = 0;
        if (this.unlocked && targetVol > 0) nextAudio.play().catch(() => {});
        const t0 = performance.now();
        const step = () => {
          const t = Math.min(1, (performance.now() - t0) / fade);
          nextAudio.volume = targetVol * t;
          if (prev) {
            const pv = (prev._targetVol != null) ? prev._targetVol : prev.volume;
            prev.volume = Math.max(0, pv * (1 - t));
          }
          if (t < 1) requestAnimationFrame(step);
          else if (prev && prev !== nextAudio) {
            try { prev.pause(); prev.currentTime = 0; } catch (e) {}
          }
        };
        nextAudio._targetVol = targetVol;
        requestAnimationFrame(step);
      } else if (prev) {
        const start = prev.volume;
        const t0 = performance.now();
        const step = () => {
          const t = Math.min(1, (performance.now() - t0) / fade);
          prev.volume = start * (1 - t);
          if (t < 1) requestAnimationFrame(step);
          else { try { prev.pause(); } catch (e) {} }
        };
        requestAnimationFrame(step);
      }
      this[slot] = nextAudio || null;
    },

    playMusic(key) {
      if (!this.ready || !this.map) return;
      if (!key) { this.stopMusic(); return; }
      if (key === this._musicKey && this._music) { this._applyVol(); return; }
      const a = this._ensure(key, 'music');
      if (!a) return;
      this._crossfadeTo('_music', a, key, 'music');
      this._musicKey = key;
      this._applyVol();
    },

    stopMusic() {
      if (this._music) { try { this._music.pause(); } catch (e) {} }
      this._music = null;
      this._musicKey = null;
    },

    playAmbience(key) {
      if (!this.ready || !this.map) return;
      if (!key) { this.stopAmbience(); return; }
      if (key === this._ambKey && this._amb) { this._applyVol(); return; }
      const a = this._ensure(key, 'ambience');
      if (!a) return;
      this._crossfadeTo('_amb', a, key, 'ambience');
      this._ambKey = key;
      this._applyVol();
    },

    stopAmbience() {
      if (this._amb) { try { this._amb.pause(); } catch (e) {} }
      this._amb = null;
      this._ambKey = null;
    },

    pauseAll() {
      try { if (this._music) this._music.pause(); } catch (e) {}
      try { if (this._amb) this._amb.pause(); } catch (e) {}
    },

    resumeAll() {
      if (!this.unlocked || this.prefs.muted) return;
      try { if (this._music && this.prefs.musicOn) this._music.play().catch(() => {}); } catch (e) {}
      try { if (this._amb && this.prefs.sfxOn) this._amb.play().catch(() => {}); } catch (e) {}
    },

    musicFor(screen, locId, phase) {
      const m = this.map;
      if (!m) return null;
      let key = null;
      if (locId && m.locMusic && m.locMusic[locId]) key = m.locMusic[locId];
      else if (screen && m.screenMusic && m.screenMusic[screen]) key = m.screenMusic[screen];
      if (phase && m.phaseMusicOverride && m.phaseMusicOverride[phase]) {
        const ov = m.phaseMusicOverride[phase];
        if (key && ov[key]) key = ov[key];
        if (screen && ov[screen]) key = ov[screen];
      }
      if (phase === 'night' && (screen === 'home' || locId === 'room') && m.music && m.music.home_night) {
        key = 'home_night';
      }
      return key;
    },

    ambienceFor(locId, weather) {
      const m = this.map;
      if (!m) return null;
      if (weather && m.weatherAmbience && m.weatherAmbience[weather]) return m.weatherAmbience[weather];
      if (locId && m.locAmbience && m.locAmbience[locId]) return m.locAmbience[locId];
      return null;
    },

    applyScene(screen, locId, phase, weather) {
      const mk = this.musicFor(screen, locId, phase);
      if (mk) this.playMusic(mk); else this.stopMusic();
      const ak = this.ambienceFor(locId, weather);
      if (ak) this.playAmbience(ak); else this.stopAmbience();
    },

    on(ev, fn) {
      const entry = { ev, fn };
      this._bus.push(entry);
      return () => { this._bus = this._bus.filter(x => x !== entry); };
    },

    emit(ev, payload) {
      const p = payload || {};
      this._bus.forEach(x => {
        if (x.ev === ev || x.ev === '*') {
          try { x.fn(ev, p); } catch (e) {}
        }
      });
      this._route(ev, p);
    },

    _route(ev, p) {
      const map = {
        tap: 'ui_tap', ui_tap: 'ui_tap',
        sheet_open: 'sheet_open', sheet_close: 'sheet_close', tab: 'tab',
        coin: 'coin', gem: 'gem', level_up: 'level_up', achievement: 'achievement',
        gift_open: 'gift_open', gift_receive: 'gift_receive',
        eat: 'eat', drink: 'drink', sleep: 'sleep', snore: 'snore', wake: 'wake',
        clean: 'clean', trash: 'trash', laundry: 'laundry', dishes: 'dishes', shower: 'shower',
        happy: 'happy', sad: 'sad', hungry: 'hungry', error: 'error',
        notification: 'notification', chat_send: 'chat_send', chat_receive: 'chat_receive',
        purchase: 'purchase', travel: 'travel', door: 'door',
        cat_meow: 'cat_meow', cat_purr: 'cat_purr',
        metro_arrive: 'metro_arrive', footsteps: 'footsteps'
      };
      if (map[ev]) this.playSfx(map[ev], p);
      if (ev === 'scene') this.applyScene(p.screen, p.loc, p.phase, p.weather);
    }
  };

  window.EGAudio = AudioSys;
})();
