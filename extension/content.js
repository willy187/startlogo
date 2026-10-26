(() => {
  const DEFAULTS = {
    enabled: true,
    mode: "text", // text | image | clock
    text: chrome.i18n.getMessage("defaultText") || "Hello",
    colorful: true,
    color: "#202124",
    imageData: "",
    size: 100, // %
    offsetY: 0 // px
  };

  const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];
  // 한글/일본어/중국어를 모두 커버하도록 폰트 폴백 체인을 구성
  const FONT_STACK =
    '"Product Sans","Google Sans","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",' +
    '"Noto Sans CJK KR","Hiragino Sans","Noto Sans JP","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';

  const ID = "startlogo-box";
  let settings = { ...DEFAULTS };
  let clockTimer = null;
  let hiddenLogo = null;

  // ---------- 로고 찾기 ----------
  function findLogo() {
    const selectors = [
      "img.lnXdpd",
      "#hplogo",
      'svg[aria-label="Google"]',
      '[role="img"][aria-label="Google"]',
      'img[alt="Google"]',
      'img[alt="구글"]',
      ".k1zIA img",
      ".logo img"
    ];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.closest("#" + ID)) continue;
        const r = el.getBoundingClientRect();
        // 홈 화면 큰 로고만 대상 (상단 작은 로고 제외)
        if (r.width > 120 || el === hiddenLogo) return el;
      }
    }
    return null;
  }

  // ---------- 텍스트를 글자 단위로 (한글·이모지 등 안전하게) ----------
  function splitChars(str) {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(str), s => s.segment);
    }
    return Array.from(str); // 코드포인트 단위 폴백
  }

  // 전각 문자(한글/한자/가나)는 폭 1, 그 외는 0.6으로 계산해서 글자 크기 자동 조절
  function widthUnits(chars) {
    let u = 0;
    for (const ch of chars) u += /[\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u3400-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]/.test(ch) ? 1 : 0.6;
    return Math.max(u, 1);
  }

  function buildText(box) {
    const chars = splitChars(settings.text || "");
    const units = widthUnits(chars);
    const base = Math.min(92, 560 / units); // 긴 문자열이면 자동 축소
    box.style.fontSize = base * (settings.size / 100) + "px";
    let ci = 0;
    for (const ch of chars) {
      const span = document.createElement("span");
      span.textContent = ch;
      if (/\s/.test(ch)) {
        span.style.whiteSpace = "pre";
      } else {
        span.style.color = settings.colorful ? GOOGLE_COLORS[ci++ % GOOGLE_COLORS.length] : settings.color;
      }
      box.appendChild(span);
    }
  }

  function buildImage(box) {
    if (!settings.imageData) {
      box.textContent = (chrome.i18n.getMessage("imagePlaceholder") || "(Choose an image in the popup)");
      box.style.fontSize = "16px";
      return;
    }
    const img = document.createElement("img");
    img.src = settings.imageData;
    img.style.maxHeight = 120 * (settings.size / 100) + "px";
    img.style.maxWidth = "80vw";
    img.style.objectFit = "contain";
    box.appendChild(img);
  }

  function buildClock(box) {
    box.style.fontSize = 72 * (settings.size / 100) + "px";
    box.style.fontVariantNumeric = "tabular-nums";
    const tick = () => {
      const d = new Date();
      const p = n => String(n).padStart(2, "0");
      box.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      box.style.color = settings.colorful ? "#4285F4" : settings.color;
    };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  // ---------- 적용 / 복원 ----------
  function restore() {
    clearInterval(clockTimer);
    clockTimer = null;
    const old = document.getElementById(ID);
    if (old) old.remove();
    if (hiddenLogo) {
      hiddenLogo.style.removeProperty("display");
      hiddenLogo = null;
    }
  }

  function apply(force) {
    if (!settings.enabled) {
      restore();
      return;
    }
    const existing = document.getElementById(ID);
    if (existing && !force) return; // 이미 적용됨 (옵저버 무한루프 방지)

    const logo = hiddenLogo && document.contains(hiddenLogo) ? hiddenLogo : findLogo();
    if (!logo) return;

    restore();
    hiddenLogo = logo;

    const box = document.createElement("div");
    box.id = ID;
    Object.assign(box.style, {
      fontFamily: FONT_STACK,
      fontWeight: "500",
      lineHeight: "1.2",
      textAlign: "center",
      minHeight: "92px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto",
      position: "relative",
      top: settings.offsetY + "px",
      letterSpacing: "-0.02em",
      userSelect: "none"
    });

    if (settings.mode === "image") buildImage(box);
    else if (settings.mode === "clock") buildClock(box);
    else buildText(box);

    logo.style.setProperty("display", "none", "important");
    logo.parentNode.insertBefore(box, logo);
  }

  // ---------- 설정 로드 & 변경 감지 ----------
  chrome.storage.local.get(DEFAULTS, saved => {
    settings = { ...DEFAULTS, ...saved };
    apply(true);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const k in changes) settings[k] = changes[k].newValue;
    apply(true);
  });

  // 구글이 로고를 다시 그리는 경우 대비 (디바운스)
  let debounce = null;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => apply(false), 200);
  }).observe(document.body, { childList: true, subtree: true });
})();
