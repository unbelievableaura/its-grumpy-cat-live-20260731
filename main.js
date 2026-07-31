(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer:fine)").matches;
  const $ = (selector) => document.querySelector(selector);
  const root = document.documentElement;
  const track = $("#track");
  const muteButton = $("#mute");
  const splash = $("#splash");
  const flashLayer = $("#flash-cats");
  const trailLayer = $("#trails");

  let audioStarted = false;
  let analyser = null;
  let frequencyData = null;
  let amplitude = 0;
  let cameoTimer = null;

  function setMuted(muted) {
    track.muted = muted;
    muteButton.textContent = muted ? "✕ MUTED" : "♫ SOUND";
    try { localStorage.setItem("grumpy-muted", muted ? "1" : "0"); } catch (_) {}
  }

  function startAudio(muted) {
    setMuted(muted);
    if (audioStarted) {
      if (!muted) track.play().catch(() => {});
      return;
    }
    audioStarted = true;
    track.play().then(() => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const source = context.createMediaElementSource(track);
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(context.destination);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
      } catch (_) {}
    }).catch(() => {});
  }

  function grumble(intensity = 1) {
    if (track.muted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const now = context.currentTime;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(115 + Math.random() * 25, now);
      oscillator.frequency.exponentialRampToValueAtTime(45, now + 0.28);
      filter.type = "lowpass";
      filter.frequency.value = 390;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07 * intensity, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.34);
    } catch (_) {}
  }

  function quake() {
    if (reducedMotion) return;
    document.body.classList.remove("quake");
    void document.body.offsetWidth;
    document.body.classList.add("quake");
    setTimeout(() => document.body.classList.remove("quake"), 520);
  }

  const cameoWords = ["NO", "UGH", "WHY", "LEAVE", "MONDAY 2", "STILL NO", "0/10", "NAP COURT", "JOY CRIME", "BOWL EMPTY", "YOU AGAIN?"];
  const shadows = ["#ffe600", "#f7ff75", "#00d95f", "#b9ff00"];

  function flashCat(options = {}) {
    if (reducedMotion || flashLayer.childElementCount > 8) return;
    const cat = document.createElement("div");
    cat.className = "flash-cat";
    const x = options.x ?? 10 + Math.random() * 80;
    const y = options.y ?? 14 + Math.random() * 72;
    const size = options.size ?? 170 + Math.random() * 230;
    const rotation = -16 + Math.random() * 32;
    const life = 650 + Math.random() * 500;
    const word = options.word || cameoWords[Math.floor(Math.random() * cameoWords.length)];
    cat.style.cssText = `left:${x}%;top:${y}%;--size:${size}px;--rot:${rotation.toFixed(1)}deg;--life:${life.toFixed(0)}ms;--shadow:${shadows[Math.floor(Math.random() * shadows.length)]}`;
    cat.innerHTML = `<img src="assets/img/grumpy-cat-cutout.png" alt=""><b>${word}</b>`;
    cat.addEventListener("animationend", () => cat.remove());
    flashLayer.appendChild(cat);
  }

  function scheduleCameo() {
    clearTimeout(cameoTimer);
    if (reducedMotion) return;
    cameoTimer = setTimeout(() => {
      flashCat();
      if (Math.random() > .56) setTimeout(() => flashCat(), 120);
      scheduleCameo();
    }, 430 + Math.random() * 780);
  }

  function enter(muted) {
    document.body.classList.remove("locked");
    scrollTo(0, 0);
    splash.classList.add("gone");
    setTimeout(() => splash.remove(), 560);
    startAudio(muted);
    quake();
    setTimeout(() => flashCat({ x: 76, y: 34, size: 360, word: "NO" }), 120);
    setTimeout(() => flashCat({ x: 20, y: 70, size: 240, word: "BAD ENTRY" }), 360);
    setTimeout(() => flashCat({ x: 52, y: 22, size: 190, word: "WHY" }), 610);
    scheduleCameo();
  }

  document.body.classList.add("locked");
  $("#enter").addEventListener("click", () => enter(false));
  $("#enter-quiet").addEventListener("click", () => enter(true));
  splash.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    grumble(1.2);
    quake();
  });
  muteButton.addEventListener("click", () => {
    if (!audioStarted) startAudio(false);
    else setMuted(!track.muted);
  });
  try { if (localStorage.getItem("grumpy-muted") === "1") setMuted(true); } catch (_) {}

  const stickerWords = ["NO", "UGH", "WHY", "NAP", "0/10", "LEAVE"];
  function buildStickers() {
    const box = $("#stickers");
    box.textContent = "";
    const pageHeight = document.documentElement.scrollHeight;
    stickerWords.forEach((word, index) => {
      const sticker = document.createElement("span");
      sticker.className = "doc-sticker";
      sticker.textContent = word;
      sticker.style.cssText = `position:absolute;z-index:1;left:${index % 2 ? 81 : 3 + index * 2}vw;top:${((index + 1) / 7) * pageHeight}px;font:900 ${48 + (index % 3) * 18}px/1 var(--disp);rotate:${index % 2 ? 11 : -10}deg;pointer-events:none`;
      box.appendChild(sticker);
    });
  }
  addEventListener("load", buildStickers);
  addEventListener("resize", buildStickers);

  const units = {
    px: [$("#u-px"), $("#m-px")],
    sighs: [$("#u-sighs"), $("#m-sighs")],
    mondays: [$("#u-mondays"), $("#m-mondays")],
    naps: [$("#u-naps"), $("#m-naps")],
    joy: [$("#u-joy"), $("#m-joy")]
  };
  const miniStats = $("#ministats");
  const chaosSection = $("#chaos");
  const hud = $("#hud-len");
  const startTime = performance.now();
  let odometer = 0;
  let previousY = scrollY;
  const format = (value) => Math.round(value).toLocaleString("en-US");
  const update = (pair, value) => pair.forEach((element) => { if (element) element.textContent = value; });

  function frame(time) {
    const y = scrollY;
    odometer += Math.abs(y - previousY);
    previousY = y;
    hud.textContent = `MOOD: -${String(Math.round(y / 11)).padStart(4, "0")}`;
    update(units.px, format(odometer));
    update(units.sighs, (odometer / 913).toFixed(2));
    update(units.mondays, (odometer / 1760).toFixed(1));
    update(units.naps, format((time - startTime) / 700));
    update(units.joy, `${Math.max(0.1, 100 - (time - startTime) / 3900 - odometer * 0.00045).toFixed(1)}%`);
    miniStats.classList.toggle("on", y > chaosSection.offsetTop - innerHeight * 0.15);

    if (analyser && !track.muted) {
      analyser.getByteFrequencyData(frequencyData);
      let total = 0;
      for (let index = 0; index < 24; index += 1) total += frequencyData[index];
      amplitude += (total / 24 / 255 - amplitude) * 0.22;
    } else {
      amplitude += (0.08 + Math.sin(time * 0.0022) * 0.04 - amplitude) * 0.05;
    }
    root.style.setProperty("--amp", amplitude.toFixed(3));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (!reducedMotion && finePointer) {
    let lastTrail = 0;
    addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - lastTrail < 42 || trailLayer.childElementCount > 35) return;
      lastTrail = now;
      const dot = document.createElement("div");
      dot.className = "trail";
      dot.style.cssText = `left:${event.clientX - 5}px;top:${event.clientY - 5}px;background:${shadows[Math.floor(Math.random() * shadows.length)]};rotate:${Math.random() * 45}deg`;
      dot.addEventListener("animationend", () => dot.remove());
      trailLayer.appendChild(dot);
    }, { passive: true });
  }

  function popWord(x, y, word) {
    const label = document.createElement("span");
    label.className = "popword";
    label.textContent = word;
    label.style.cssText = `left:${x}px;top:${y}px;--rot:${(-12 + Math.random() * 24).toFixed(1)}deg`;
    label.addEventListener("animationend", () => label.remove());
    trailLayer.appendChild(label);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("a,button,input,#hud,#ministats,#splash")) return;
    const word = cameoWords[Math.floor(Math.random() * cameoWords.length)];
    popWord(event.clientX, event.clientY, word);
    flashCat({ x: event.clientX / innerWidth * 100, y: event.clientY / innerHeight * 100, size: 210, word });
    grumble(.7);
  }, { passive: true });

  const verdicts = [
    "I had fun once. It was awful.",
    "No.",
    "Your idea has been declined by the face.",
    "I would sleep on it, but now you've ruined my nap.",
    "Ask again after never.",
    "This meeting could have been a nap.",
    "I expected nothing and you delivered less.",
    "The bowl is empty. Fix that before speaking.",
    "Absolutely not. Remove the absolutely if you need brevity.",
    "I dislike this question and several nearby questions."
  ];
  const thoughts = ["this green is suspicious", "the cursor has bad energy", "somebody moved the blanket", "the bowl has visible bottom", "you are still here", "tomorrow is monday twice", "your appeal font is ugly"];
  let verdictIndex = 0;

  $("#ask").addEventListener("click", () => {
    verdictIndex = (verdictIndex + 1 + Math.floor(Math.random() * (verdicts.length - 1))) % verdicts.length;
    $("#verdict-text").textContent = `“${verdicts[verdictIndex]}”`;
    $("#thought").textContent = thoughts[Math.floor(Math.random() * thoughts.length)];
    flashCat({ x: 77, y: 44, size: 320, word: "DENIED" });
    grumble(1.1);
    quake();
  });

  $("#pet").addEventListener("click", (event) => {
    const petButton = event.currentTarget;
    petButton.textContent = "✕ PETTING DENIED";
    flashCat({ x: 50, y: 48, size: 430, word: "HISSSSS" });
    grumble(1.6);
    quake();
    setTimeout(() => { petButton.textContent = "PET HER ANYWAY"; }, 1700);
  });

  let rageCount = 0;
  let rageTimer = null;
  const rageNames = ["NORMAL AWFUL", "SPICY DISPLEASURE", "MONDAY PREMIUM", "BOWL COURT", "MAXIMUM NO", "LEGALIZE NAPS"];
  $("#make-worse").addEventListener("click", () => {
    rageCount += 1;
    document.body.classList.add("rage-mode");
    $("#rage-level").textContent = rageNames[Math.min(rageCount, rageNames.length - 1)];
    $("#make-worse").textContent = rageCount > 2 ? "WHY DID YOU KEEP CLICKING" : "WORSE. AGAIN.";
    quake();
    grumble(1.8);
    for (let index = 0; index < 10; index += 1) {
      setTimeout(() => flashCat({
        x: 5 + Math.random() * 90,
        y: 8 + Math.random() * 84,
        size: 150 + Math.random() * 330,
        word: cameoWords[(index + rageCount) % cameoWords.length]
      }), index * 85);
    }
    clearTimeout(rageTimer);
    rageTimer = setTimeout(() => {
      document.body.classList.remove("rage-mode");
      $("#make-worse").textContent = "MAKE IT WORSE";
    }, 6500);
  });

  const complaint = $("#complaint-form");
  $("#complain").addEventListener("click", () => {
    complaint.hidden = !complaint.hidden;
    if (!complaint.hidden) $("#complaint-input").focus();
  });
  $("#submit-complaint").addEventListener("click", () => {
    const input = $("#complaint-input");
    $("#complaint-result").textContent = input.value.trim() ? "Complaint received. Complaint immediately judged." : "Even your complaint was empty.";
    input.value = "";
    flashCat({ x: 70, y: 65, size: 240, word: "IGNORED" });
  });
})();
