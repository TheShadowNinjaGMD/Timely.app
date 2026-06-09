// APP STATE
const APP = {
  mode: "timer",
  running: false,
  theme: "ocean",
  glow: true,
  sound: true,
  vol: 0.8,
  sfx: 0.7,
  music: 0.4,
  musicOn: false,
  lightMode: false,
  audio: null,
  chime: document.getElementById("chime"),
  bgMusic: document.getElementById("bgMusic"),
};

// TIMER STATE
const TIMER = {
  sec: 300,
  max: 300,
  interval: null,
  study: false,
  phase: "focus",
  session: 1,
  presets: [30, 60, 300],
};

// STOPWATCH STATE
const STOPWATCH = {
  ms: 0,
  interval: null,
  laps: [],
};

// ─── INITIALIZATION ───────────────────────────────────────────────

function init() {
  APP.audio = new (window.AudioContext || window.webkitAudioContext)();

  // Resume audio context on first interaction
  document.body.addEventListener(
    "click",
    () => {
      if (APP.audio && APP.audio.state === "suspended") APP.audio.resume();
    },
    { once: true },
  );

  load();
  initTimer();
  initStopwatch();
  updateTimer();

  // Sync snd-lib volume with our settings
  syncSndLibVolume();

  // Sync UI icons
  updateLightIcon();
  updateMuteIcon();

  console.log("Timely initialized ✓");
}

// Run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ─── SND-LIB INTEGRATION ─────────────────────────────────────────

function syncSndLibVolume() {
  // snd-lib uses data-snd-volume on the body or individual elements
  // Range: 0.0 to 1.0
  if (typeof snd !== "undefined" && snd && snd.setVolume) {
    snd.setVolume(APP.sound ? APP.vol * APP.sfx : 0);
  }
  // Also set data attribute for CSS-based volume
  document.body.setAttribute(
    "data-snd-volume",
    APP.sound ? APP.vol * APP.sfx : 0,
  );
}

// ─── AUDIO FUNCTIONS ──────────────────────────────────────────────

function playSound(freq, dur) {
  if (!APP.sound || !APP.audio) return;
  try {
    const osc = APP.audio.createOscillator();
    const gain = APP.audio.createGain();
    osc.connect(gain);
    gain.connect(APP.audio.destination);
    osc.frequency.value = freq;
    const vol = APP.vol * APP.sfx * 0.15;
    gain.gain.setValueAtTime(vol, APP.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, APP.audio.currentTime + dur);
    osc.start();
    osc.stop(APP.audio.currentTime + dur);
  } catch (e) {}
}

function playClick() {
  playSound(1200, 0.06);
}
function playPop() {
  playSound(800, 0.1);
}

function playComplete() {
  if (!APP.sound || !APP.audio) return;
  try {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const osc = APP.audio.createOscillator();
      const gain = APP.audio.createGain();
      osc.connect(gain);
      gain.connect(APP.audio.destination);
      osc.frequency.value = f;
      const vol = APP.vol * APP.sfx * 0.25;
      const time = APP.audio.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
      osc.start(time);
      osc.stop(time + 0.35);
    });
  } catch (e) {}
  try {
    APP.chime.volume = APP.vol * APP.sfx;
    APP.chime.play().catch(() => {});
  } catch (e) {}
}

function startMusic() {
  if (APP.bgMusic && APP.musicOn) {
    APP.bgMusic.volume = APP.vol * APP.music;
    APP.bgMusic.play().catch(() => {});
  }
}

function stopMusic() {
  if (APP.bgMusic) {
    APP.bgMusic.pause();
    APP.bgMusic.currentTime = 0;
  }
}

// ─── SETTINGS FUNCTIONS ───────────────────────────────────────────

function openSettings() {
  playClick();
  document.getElementById("settings").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeSettings() {
  playClick();
  document.getElementById("settings").classList.remove("show");
  document.body.style.overflow = "";
}

function setTheme(theme) {
  playClick();
  APP.theme = theme;
  document.body.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.theme === theme);
  });
  save();
}

function toggleGlow() {
  APP.glow = document.getElementById("glowToggle").checked;
  document.body.classList.toggle("no-glow", !APP.glow);
  save();
}

function toggleSound() {
  APP.sound = document.getElementById("soundToggle").checked;
  syncSndLibVolume();
  updateMuteIcon();
  save();
}

function updateVol(v) {
  APP.vol = v / 100;
  document.getElementById("volText").textContent = v + "%";
  if (APP.bgMusic && !APP.bgMusic.paused) {
    APP.bgMusic.volume = APP.vol * APP.music;
  }
  syncSndLibVolume();
  save();
}

function updateSFX(v) {
  APP.sfx = v / 100;
  document.getElementById("sfxText").textContent = v + "%";
  syncSndLibVolume();
  playClick();
  save();
}

function updateMusic(v) {
  APP.music = v / 100;
  document.getElementById("musicText").textContent = v + "%";
  if (APP.bgMusic) {
    APP.bgMusic.volume = APP.vol * APP.music;
  }
  save();
}

function toggleMusic() {
  APP.musicOn = document.getElementById("musicToggle").checked;
  document.getElementById("musicBox").style.display = APP.musicOn
    ? "block"
    : "none";
  if (APP.musicOn && TIMER.study && APP.running) {
    startMusic();
  } else {
    stopMusic();
  }
  save();
}

// ─── THEME / LIGHT MODE TOGGLE ──────────────────────────────────

function toggleLightMode() {
  APP.lightMode = !APP.lightMode;
  document.body.classList.toggle("light-mode", APP.lightMode);
  updateLightIcon();
  save();
}

function updateLightIcon() {
  const icon = document.getElementById("lightIcon");
  const label = document.getElementById("lightLabel");
  if (icon) {
    if (APP.lightMode) {
      // Moon icon
      icon.innerHTML =
        '<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clip-rule="evenodd" />';
      icon.setAttribute("fill", "currentColor");
      icon.removeAttribute("stroke");
    } else {
      // Sun icon
      icon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />';
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "1.5");
    }
  }
  if (label) label.textContent = APP.lightMode ? "Dark" : "Light";
}

// ─── MUTE TOGGLE ──────────────────────────────────────────────────

function toggleMute() {
  APP.sound = !APP.sound;
  document.getElementById("soundToggle").checked = APP.sound;
  syncSndLibVolume();
  updateMuteIcon();
  save();
}

function updateMuteIcon() {
  const icon = document.getElementById("muteIcon");
  const label = document.getElementById("muteLabel");
  if (icon) {
    if (APP.sound) {
      // Unmuted speaker (with sound waves)
      icon.innerHTML =
        '<path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />' +
        '<path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />';
    } else {
      // Muted speaker (with X)
      icon.innerHTML =
        '<path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" />';
    }
  }
  if (label) label.textContent = APP.sound ? "Sound" : "Muted";
}

function toggleStudyFromSettings() {
  if (document.getElementById("studyToggle").checked && !TIMER.study) {
    toggleStudy();
  } else if (!document.getElementById("studyToggle").checked && TIMER.study) {
    toggleStudy();
  }
}

function resetSettings() {
  playClick();
  if (!confirm("Reset all settings to default values?")) return;

  APP.theme = "ocean";
  APP.glow = true;
  APP.sound = true;
  APP.vol = 0.8;
  APP.sfx = 0.7;
  APP.music = 0.4;
  APP.musicOn = false;
  APP.lightMode = false;

  setTheme("ocean");
  document.getElementById("soundToggle").checked = true;
  document.getElementById("glowToggle").checked = true;
  document.getElementById("volSlider").value = 80;
  document.getElementById("sfxSlider").value = 70;
  document.getElementById("musicSlider").value = 40;
  document.getElementById("musicToggle").checked = false;
  document.getElementById("autoBreak").checked = true;

  updateVol(80);
  updateSFX(70);
  updateMusic(40);

  document.getElementById("musicBox").style.display = "none";
  document.body.classList.remove("no-glow");
  document.body.classList.remove("light-mode");
  syncSndLibVolume();
  updateLightIcon();
  updateMuteIcon();
  save();
}

function showNotif(text) {
  document.getElementById("notifText").textContent = text;
  document.getElementById("notification").classList.add("show");
  setTimeout(() => {
    document.getElementById("notification").classList.remove("show");
  }, 3000);
}

function save() {
  try {
    localStorage.setItem(
      "timely",
      JSON.stringify({
        theme: APP.theme,
        glow: APP.glow,
        sound: APP.sound,
        vol: APP.vol,
        sfx: APP.sfx,
        music: APP.music,
        musicOn: APP.musicOn,
        lightMode: APP.lightMode,
      }),
    );
  } catch (e) {}
}

function load() {
  try {
    const data = localStorage.getItem("timely");
    if (!data) return;

    const s = JSON.parse(data);
    APP.theme = s.theme || "ocean";
    APP.glow = s.glow !== false;
    APP.sound = s.sound !== false;
    APP.vol = s.vol || 0.8;
    APP.sfx = s.sfx || 0.7;
    APP.music = s.music || 0.4;
    APP.musicOn = s.musicOn || false;
    APP.lightMode = s.lightMode === true;

    setTheme(APP.theme);
    document.getElementById("soundToggle").checked = APP.sound;
    document.getElementById("glowToggle").checked = APP.glow;
    document.getElementById("volSlider").value = APP.vol * 100;
    document.getElementById("sfxSlider").value = APP.sfx * 100;
    document.getElementById("musicSlider").value = APP.music * 100;
    document.getElementById("musicToggle").checked = APP.musicOn;

    updateVol(APP.vol * 100);
    updateSFX(APP.sfx * 100);
    updateMusic(APP.music * 100);

    if (!APP.glow) document.body.classList.add("no-glow");
    if (APP.lightMode) document.body.classList.add("light-mode");
    document.getElementById("musicBox").style.display = APP.musicOn
      ? "block"
      : "none";
  } catch (e) {}
}

// ─── TIMER FUNCTIONS ──────────────────────────────────────────────

function initTimer() {
  renderTimer();
  updateTimer();
}

function renderTimer() {
  document.getElementById("timerView").innerHTML = `
    <div class="view">
      <div class="ring">
        <svg class="ring-svg" viewBox="0 0 340 340">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--grad1)"/>
              <stop offset="100%" stop-color="var(--grad2)"/>
            </linearGradient>
          </defs>
          <circle class="ring-bg" cx="170" cy="170" r="150"/>
          <circle class="ring-progress" cx="170" cy="170" r="150"/>
        </svg>
        <div class="time-display">
          <input type="text" class="time-input" id="timeInput" value="5:00" maxlength="8" autocomplete="off"/>
        </div>
      </div>
      <div class="presets" id="presets">
        ${TIMER.presets
          .map((v, i) => {
            // Delta amounts: first preset +/-5, second +/-10, third +/-30
            const delta = [5, 10, 30][i] || Math.floor(v / 10);
            return `
          <div class="preset-group">
            <button class="preset-adj snd__button" onclick="adjustPreset(${i}, -${delta})" title="Decrease preset">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button class="preset-add snd__button" onclick="addTime(${v})">
              <span>${formatTime(v)}</span>
            </button>
            <button class="preset-adj snd__button" onclick="adjustPreset(${i}, ${delta})" title="Increase preset">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        `;
          })
          .join("")}
      </div>
    </div>
  `;

  const input = document.getElementById("timeInput");
  input.addEventListener("focus", function () {
    if (!APP.running && !TIMER.study) this.select();
  });
  input.addEventListener("blur", function () {
    if (!APP.running && !TIMER.study) {
      const newSec = parseTime(this.value);
      if (newSec > 0 && newSec <= 5999) {
        TIMER.sec = newSec;
        TIMER.max = newSec;
      }
      updateTimer();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.target.blur();
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m === 0
    ? `0:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function parseTime(str) {
  const parts = str.split(":");
  if (parts.length === 2) {
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  }
  return 0;
}

function updateTimer() {
  const input = document.getElementById("timeInput");
  const progress = document.querySelector("#timerView .ring-progress");

  if (input) input.value = formatTime(TIMER.sec);
  if (progress) {
    progress.style.strokeDashoffset = 942 * (1 - TIMER.sec / TIMER.max);
  }
}

function startTimer() {
  playClick();
  APP.running = true;
  document.body.classList.add("running");
  document.getElementById("playIcon").innerHTML =
    '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';

  if (TIMER.study && APP.musicOn) startMusic();

  const startTime = Date.now();
  const startVal = TIMER.sec;

  TIMER.interval = setInterval(() => {
    TIMER.sec = Math.max(
      0,
      startVal - Math.floor((Date.now() - startTime) / 1000),
    );
    if (TIMER.sec <= 0) {
      TIMER.sec = 0;
      stopTimer();
      handleTimerComplete();
    }
    updateTimer();
  }, 100);
}

function stopTimer() {
  APP.running = false;
  document.body.classList.remove("running");
  clearInterval(TIMER.interval);
  stopMusic();
  document.getElementById("playIcon").innerHTML =
    '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
}

function handleTimerComplete() {
  const text = TIMER.study
    ? TIMER.phase === "focus"
      ? "🎯 Focus Complete!"
      : "☕ Break Complete!"
    : "⏰ Timer Complete!";

  showNotif(text);
  playComplete();

  if (TIMER.study) {
    setTimeout(() => {
      switchPhase();
      if (
        TIMER.phase === "break" &&
        document.getElementById("autoBreak").checked
      ) {
        startTimer();
      }
    }, 2000);
  }
}

// Add specified time to the current timer (called by preset buttons)
function addTime(sec) {
  if (TIMER.study) return;
  playPop();
  TIMER.sec += sec;
  if (TIMER.sec < 0) TIMER.sec = 0;
  if (TIMER.sec > 5999) TIMER.sec = 5999;
  TIMER.max = TIMER.sec;
  updateTimer();
}

// Adjust the preset values (called by +/- buttons on presets)
function adjustPreset(i, delta) {
  playClick();
  TIMER.presets[i] += delta;
  if (TIMER.presets[i] < 10) TIMER.presets[i] = 10;
  if (TIMER.presets[i] > 3600) TIMER.presets[i] = 3600;
  renderTimer();
}

function toggleStudy() {
  playClick();
  TIMER.study = !TIMER.study;
  document.getElementById("studyToggle").checked = TIMER.study;

  if (TIMER.study) {
    stopTimer();
    TIMER.phase = "focus";
    TIMER.session = 1;
    TIMER.sec = 1500;
    TIMER.max = 1500;
    document.getElementById("studyBanner").style.display = "flex";
    document.getElementById("presets").style.display = "none";
    updateStudyDisplay();
  } else {
    stopTimer();
    stopMusic();
    document.getElementById("studyBanner").style.display = "none";
    document.getElementById("presets").style.display = "flex";
    TIMER.sec = 300;
    TIMER.max = 300;
    document.body.classList.remove("study-focus", "study-break");
  }
  updateTimer();
}

function updateStudyDisplay() {
  if (TIMER.phase === "focus") {
    document.body.classList.remove("study-break");
    document.body.classList.add("study-focus");
    document.getElementById("studyPhase").textContent = "🎯 Focus Session";
  } else {
    document.body.classList.remove("study-focus");
    document.body.classList.add("study-break");
    document.getElementById("studyPhase").textContent = "☕ Break Time";
  }
  document.getElementById("studySession").textContent =
    "Session " + TIMER.session;
}

function switchPhase() {
  if (TIMER.phase === "focus") {
    TIMER.phase = "break";
    TIMER.sec = 300;
  } else {
    TIMER.phase = "focus";
    TIMER.session++;
    TIMER.sec = 1500;
  }
  TIMER.max = TIMER.sec;
  updateStudyDisplay();
  updateTimer();
}

// ─── STOPWATCH FUNCTIONS ──────────────────────────────────────────

function initStopwatch() {
  renderStopwatch();
  updateStopwatch();
}

function renderStopwatch() {
  document.getElementById("stopwatchView").innerHTML = `
    <div class="view">
      <div class="ring">
        <svg class="ring-svg" viewBox="0 0 340 340">
          <defs>
            <linearGradient id="swGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--grad1)"/>
              <stop offset="100%" stop-color="var(--grad2)"/>
            </linearGradient>
          </defs>
          <circle class="ring-bg" cx="170" cy="170" r="150"/>
          <circle class="ring-progress" cx="170" cy="170" r="150"/>
        </svg>
        <div class="time-display">
          <div class="time-input" id="swTime">0:00</div>
        </div>
      </div>
      <div class="ms-text">
        <span id="swMs">00</span>
      </div>
      <div class="lap-controls">
        <button class="lap-btn snd__button" onclick="recordLap()" id="lapBtn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span>Record Lap</span>
        </button>
        <div class="lap-list" id="lapList"></div>
      </div>
    </div>
  `;
}

function updateStopwatch() {
  const timeEl = document.getElementById("swTime");
  const msEl = document.getElementById("swMs");
  const progress = document.querySelector("#stopwatchView .ring-progress");

  if (timeEl && msEl && progress) {
    const totalSec = Math.floor(STOPWATCH.ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ms = Math.floor((STOPWATCH.ms % 1000) / 10);

    timeEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    msEl.textContent = String(ms).padStart(2, "0");

    const secInHour = totalSec % 3600;
    progress.style.strokeDashoffset = 942 * (1 - secInHour / 3600);
  }
}

function startStopwatch() {
  playClick();
  APP.running = true;
  document.body.classList.add("running");
  document.getElementById("playIcon").innerHTML =
    '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';

  const lapBtn = document.getElementById("lapBtn");
  if (lapBtn) lapBtn.disabled = false;

  const startTime = Date.now();
  const startVal = STOPWATCH.ms;

  STOPWATCH.interval = setInterval(() => {
    STOPWATCH.ms = startVal + (Date.now() - startTime);
    updateStopwatch();
  }, 50);
}

function stopStopwatch() {
  playClick();
  APP.running = false;
  document.body.classList.remove("running");
  clearInterval(STOPWATCH.interval);
  document.getElementById("playIcon").innerHTML =
    '<polygon points="5 3 19 12 5 21 5 3"></polygon>';

  const lapBtn = document.getElementById("lapBtn");
  if (lapBtn && STOPWATCH.laps.length === 0) lapBtn.disabled = true;
}

function recordLap() {
  if (!APP.running) return;
  playPop();

  const lapTime = STOPWATCH.ms;
  STOPWATCH.laps.unshift(lapTime);

  const lapList = document.getElementById("lapList");
  if (lapList) {
    const totalSec = Math.floor(lapTime / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ms = Math.floor((lapTime % 1000) / 10);

    const item = document.createElement("div");
    item.className = "lap-item";
    item.innerHTML = `
      <span class="lap-num">Lap ${STOPWATCH.laps.length}</span>
      <span class="lap-time">${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}</span>
    `;
    lapList.insertBefore(item, lapList.firstChild);
  }
}

// ─── MODE SWITCHING ───────────────────────────────────────────────

function switchMode(mode) {
  playClick();
  APP.mode = mode;

  document
    .getElementById("timerTab")
    .classList.toggle("active", mode === "timer");
  document
    .getElementById("stopwatchTab")
    .classList.toggle("active", mode === "stopwatch");
  document.getElementById("timerView").style.display =
    mode === "timer" ? "block" : "none";
  document.getElementById("stopwatchView").style.display =
    mode === "stopwatch" ? "block" : "none";

  document.getElementById("playIcon").innerHTML =
    '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
}

function togglePlay() {
  if (APP.mode === "timer") {
    APP.running ? stopTimer() : startTimer();
  } else {
    APP.running ? stopStopwatch() : startStopwatch();
  }
}

function resetApp() {
  playClick();

  if (APP.mode === "timer") {
    stopTimer();
    if (TIMER.study) {
      TIMER.sec = TIMER.phase === "focus" ? 1500 : 300;
      TIMER.max = TIMER.sec;
    } else {
      TIMER.sec = TIMER.max;
    }
    updateTimer();
  } else {
    stopStopwatch();
    STOPWATCH.ms = 0;
    STOPWATCH.laps = [];
    const lapList = document.getElementById("lapList");
    if (lapList) lapList.innerHTML = "";
    updateStopwatch();
  }
}

// Close settings when clicking overlay
document.getElementById("settings").addEventListener("click", (e) => {
  if (e.target.id === "settings") closeSettings();
});
