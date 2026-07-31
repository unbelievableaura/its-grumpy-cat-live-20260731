(() => {
  "use strict";

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer:fine)").matches;
  const $ = (selector) => document.querySelector(selector);
  const root = document.documentElement;

  const torso = $("#grump-torso");
  let lastTileWidth = 0;

  function buildTorso() {
    if (!torso) return;
    const tileWidth = torso.clientWidth || 300;
    if (tileWidth !== lastTileWidth) {
      torso.textContent = "";
      lastTileWidth = tileWidth;
    }
    const needed = Math.ceil(torso.clientHeight / (tileWidth * 0.76)) + 2;
    while (torso.childElementCount < needed) {
      const tile = document.createElement("div");
      tile.className = "tile";
      torso.appendChild(tile);
    }
  }

  addEventListener("load", buildTorso);
  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      lastTileWidth = 0;
      buildTorso();
      sizeAura();
    }, 120);
  });
  buildTorso();

  const track = $("#track");
  const muteButton = $("#mute");
  let analyser = null;
  let frequencyData = null;
  let amplitude = 0;
  let audioStarted = false;

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

  muteButton.addEventListener("click", () => {
    if (!audioStarted) startAudio(false);
    else setMuted(!track.muted);
  });

  const splash = $("#splash");
  document.body.classList.add("locked");

  function quake(duration = 700) {
    if (RM) return;
    document.body.classList.remove("quake");
    void document.body.offsetWidth;
    document.body.classList.add("quake");
    setTimeout(() => document.body.classList.remove("quake"), duration);
  }

  function synthGrumble(intensity = 1) {
    if (track.muted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const now = context.currentTime;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(105 + Math.random() * 35, now);
      oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.34);
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } catch (_) {}
  }

  function enter(muted) {
    document.body.classList.remove("locked");
    scrollTo(0, 0);
    splash.classList.add("gone");
    setTimeout(() => splash.remove(), 680);
    startAudio(muted);
    quake();
  }

  $("#enter").addEventListener("click", () => enter(false));
  $("#enter-quiet").addEventListener("click", () => enter(true));
  splash.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    synthGrumble(1.3);
    quake();
  });

  try {
    if (localStorage.getItem("grumpy-muted") === "1") setMuted(true);
  } catch (_) {}

  const stickerWords = ["NO", "UGH", "MONDAY", "WHY", "LEAVE", "NAP", "STILL NO", "AWFUL", "0/10", "HISSS"];
  const stickers = $("#stickers");

  function buildStickers() {
    stickers.textContent = "";
    const height = document.body.scrollHeight;
    stickerWords.forEach((word, index) => {
      const sticker = document.createElement("span");
      sticker.className = "doc-sticker";
      sticker.textContent = word;
      const left = index % 2 ? 78 + (index % 3) * 5 : 3 + (index % 4) * 3;
      const top = ((index + 1) / (stickerWords.length + 1)) * height;
      const color = ["#ff2bd1", "#00f0ff", "#b4ff39", "#fff200"][index % 4];
      sticker.style.cssText = `position:absolute;z-index:3;left:${left}vw;top:${top}px;color:${color};font:900 ${42 + (index % 3) * 18}px/1 var(--disp);opacity:.42;rotate:${index % 2 ? 12 : -10}deg;text-shadow:0 0 18px ${color};mix-blend-mode:screen;pointer-events:none`;
      sticker.dataset.speed = String(0.08 + (index % 4) * 0.05);
      stickers.appendChild(sticker);
    });
  }
  addEventListener("load", buildStickers);

  const aura = $("#aura");
  const auraContext = aura.getContext("2d");
  let auraWidth = 0;
  let auraHeight = 0;

  function sizeAura() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    auraWidth = innerWidth;
    auraHeight = innerHeight;
    aura.width = auraWidth * ratio;
    aura.height = auraHeight * ratio;
    auraContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  sizeAura();

  function drawAura(time, scrollTop) {
    auraContext.clearRect(0, 0, auraWidth, auraHeight);
    const cat = $("#grump");
    if (!cat) return;
    const rect = cat.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const points = [];
    const wobble = RM ? 0 : 30 + amplitude * 70;
    for (let y = -50; y <= auraHeight + 50; y += 24) {
      points.push([center + Math.sin((y + scrollTop) * 0.0044 + time * 0.0011) * wobble, y]);
    }
    const stroke = (offset, color, width, alpha) => {
      auraContext.beginPath();
      points.forEach(([x, y], index) => index ? auraContext.lineTo(x + offset, y) : auraContext.moveTo(x + offset, y));
      auraContext.strokeStyle = color;
      auraContext.lineWidth = width;
      auraContext.globalAlpha = alpha;
      auraContext.lineCap = "round";
      auraContext.stroke();
    };
    auraContext.globalCompositeOperation = "lighter";
    stroke(-10 - amplitude * 12, "#00f0ff", rect.width * 0.45, 0.15);
    stroke(10 + amplitude * 12, "#ff2bd1", rect.width * 0.45, 0.16);
    stroke(0, "#fff200", rect.width * (0.26 + amplitude * 0.2), 0.1 + amplitude * 0.1);
    auraContext.globalAlpha = 1;
    auraContext.globalCompositeOperation = "source-over";
  }

  const hudLength = $("#hud-len");
  const miniStats = $("#ministats");
  const howGrumpy = $("#howgrumpy");
  const units = {
    px: [$("#u-px"), $("#m-px")],
    sighs: [$("#u-sighs"), $("#m-sighs")],
    mondays: [$("#u-mondays"), $("#m-mondays")],
    naps: [$("#u-naps"), $("#m-naps")],
    joy: [$("#u-joy"), $("#m-joy")]
  };
  const startTime = performance.now();
  let odometer = 0;
  let previousY = scrollY;
  let extraHeight = 0;
  const outro = $("#outro");
  const format = (number) => Math.round(number).toLocaleString("en-US");

  function updatePair(pair, value) {
    pair.forEach((element) => { if (element) element.textContent = value; });
  }

  function maybeExtend(scrollTop) {
    if (scrollTop + innerHeight * 2.15 < document.body.scrollHeight) return;
    extraHeight += Math.round(innerHeight * 1.35);
    outro.style.height = `calc(110vh + ${extraHeight}px)`;
    buildTorso();
  }

  function frame(time) {
    const scrollTop = scrollY;
    odometer += Math.abs(scrollTop - previousY);
    previousY = scrollTop;
    maybeExtend(scrollTop);

    hudLength.textContent = `GRUDGE: ${String(Math.round(scrollTop + innerHeight)).padStart(6, "0")} px`;
    updatePair(units.px, format(odometer));
    updatePair(units.sighs, (odometer / 913).toFixed(2));
    updatePair(units.mondays, (odometer / 1760).toFixed(1));
    updatePair(units.naps, format((time - startTime) / 675));
    updatePair(units.joy, `${Math.max(0.1, 100 - (time - startTime) / 3600 - odometer * 0.0005).toFixed(1)}%`);
    miniStats.classList.toggle("on", scrollTop > howGrumpy.offsetTop + howGrumpy.offsetHeight - innerHeight * 0.4);

    if (analyser && !track.muted) {
      analyser.getByteFrequencyData(frequencyData);
      let total = 0;
      for (let index = 0; index < 26; index += 1) total += frequencyData[index];
      amplitude += (total / 26 / 255 - amplitude) * 0.2;
    } else if (!RM) {
      amplitude += (0.12 + 0.08 * Math.sin(time * 0.0024) - amplitude) * 0.05;
    }

    if (!RM) {
      root.style.setProperty("--wob", `${(Math.sin(scrollTop * 0.0017 + time * 0.0005) * 15).toFixed(1)}px`);
      root.style.setProperty("--amp", amplitude.toFixed(3));
      document.querySelectorAll(".doc-sticker").forEach((sticker) => {
        const speed = Number(sticker.dataset.speed);
        sticker.style.transform = `translateY(${(-scrollTop * speed).toFixed(1)}px) rotate(${Math.sin(time * 0.0005 + sticker.offsetLeft) * 7}deg)`;
      });
      drawAura(time, scrollTop);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (RM) drawAura(0, 0);

  const trailBox = $("#trails");
  if (!RM && finePointer) {
    let lastTrail = 0;
    addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - lastTrail < 38 || trailBox.childElementCount > 45) return;
      lastTrail = now;
      const dot = document.createElement("div");
      dot.className = "trail";
      const color = ["#ff2bd1", "#00f0ff", "#b4ff39", "#fff200"][Math.floor(Math.random() * 4)];
      dot.style.cssText = `left:${event.clientX - 5}px;top:${event.clientY - 5}px;background:${color};box-shadow:0 0 14px ${color}`;
      dot.addEventListener("animationend", () => dot.remove());
      trailBox.appendChild(dot);
    }, { passive: true });
  }

  const clickWords = ["NO", "UGH", "MONDAY", "STOP", "WHY", "HISSS", "0/10", "STILL NO", "GO AWAY", "AWFUL"];
  const colors = ["#ff2bd1", "#00f0ff", "#b4ff39", "#fff200", "#ff5a00"];
  let rage = 0;
  let shakeFrame = null;

  function popWord(x, y, word) {
    const element = document.createElement("span");
    element.className = "popword";
    element.textContent = word;
    const color = colors[Math.floor(Math.random() * colors.length)];
    element.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:${20 + Math.random() * 30}px;--rot:${(Math.random() * 30 - 15).toFixed(1)}deg`;
    element.addEventListener("animationend", () => element.remove());
    trailBox.appendChild(element);
  }

  function shakeLoop() {
    rage = Math.max(0, rage - 0.03);
    const amount = Math.min(rage, 24) * 1.12;
    if (amount < 0.3) {
      root.style.setProperty("--shx", "0px");
      root.style.setProperty("--shy", "0px");
      root.style.setProperty("--shr", "0deg");
      shakeFrame = null;
      return;
    }
    root.style.setProperty("--shx", `${((Math.random() * 2 - 1) * amount).toFixed(1)}px`);
    root.style.setProperty("--shy", `${((Math.random() * 2 - 1) * amount * 0.65).toFixed(1)}px`);
    root.style.setProperty("--shr", `${((Math.random() * 2 - 1) * Math.min(amount * 0.12, 2.5)).toFixed(2)}deg`);
    shakeFrame = requestAnimationFrame(shakeLoop);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("a,button,input,#hud,#ministats,#splash")) return;
    const word = clickWords[Math.floor(Math.random() * clickWords.length)];
    if (!RM) popWord(event.clientX, event.clientY, word);
    synthGrumble(0.7);
    rage = Math.min(rage + 1.8, 28);
    if (!shakeFrame && !RM) shakeFrame = requestAnimationFrame(shakeLoop);
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
  const thoughts = ["this website is too cheerful", "the cursor is suspicious", "somebody moved the blanket", "the bowl has visible bottom", "you are still scrolling", "tomorrow is probably monday"];
  let verdictIndex = 0;

  $("#ask").addEventListener("click", () => {
    verdictIndex = (verdictIndex + 1 + Math.floor(Math.random() * (verdicts.length - 1))) % verdicts.length;
    $("#verdict-text").textContent = `“${verdicts[verdictIndex]}”`;
    $("#thought").textContent = thoughts[Math.floor(Math.random() * thoughts.length)];
    synthGrumble(1.1);
    quake(520);
  });

  $("#pet").addEventListener("click", (event) => {
    event.currentTarget.textContent = "✕ PETTING DENIED";
    popWord(innerWidth / 2, innerHeight / 2, "HISSSSS");
    rage = 18;
    if (!shakeFrame && !RM) shakeFrame = requestAnimationFrame(shakeLoop);
    synthGrumble(1.7);
    setTimeout(() => { event.currentTarget.textContent = "PET THE CAT"; }, 1800);
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
    synthGrumble(0.8);
  });
})();
