/* Shared language handling for index.html and privacy.html */
(function () {
  var LANGS = [
    ["ko", "한국어"],
    ["en", "English"],
    ["ja", "日本語"],
    ["zh-CN", "简体中文"],
    ["zh-TW", "繁體中文"]
  ];

  var COMMON = {
    ko: {
      langLabel: "언어",
      privacy: "개인정보처리방침",
      home: "소개",
      disclaimer: "StartLogo는 독립적으로 만든 확장 프로그램이며 Google LLC와 제휴, 후원, 보증 관계가 없습니다. Google은 Google LLC의 상표입니다."
    },
    en: {
      langLabel: "Language",
      privacy: "Privacy Policy",
      home: "About",
      disclaimer: "StartLogo is an independent extension and is not affiliated with, endorsed by, or sponsored by Google LLC. Google is a trademark of Google LLC."
    },
    ja: {
      langLabel: "言語",
      privacy: "プライバシーポリシー",
      home: "紹介",
      disclaimer: "StartLogoは独立した拡張機能であり、Google LLCとは提携・後援・承認の関係にありません。GoogleはGoogle LLCの商標です。"
    },
    "zh-CN": {
      langLabel: "语言",
      privacy: "隐私政策",
      home: "介绍",
      disclaimer: "StartLogo 是独立开发的扩展程序，与 Google LLC 没有关联，也未获其赞助或认可。Google 是 Google LLC 的商标。"
    },
    "zh-TW": {
      langLabel: "語言",
      privacy: "隱私權政策",
      home: "介紹",
      disclaimer: "StartLogo 是獨立開發的擴充功能，與 Google LLC 沒有關聯，也未獲其贊助或認可。Google 是 Google LLC 的商標。"
    }
  };

  function valid(code) {
    return LANGS.some(function (l) { return l[0] === code; });
  }

  function detect() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && valid(q)) return q;
    try {
      var s = localStorage.getItem("sl-lang");
      if (s && valid(s)) return s;
    } catch (e) {}
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase();
      if (l.indexOf("ko") === 0) return "ko";
      if (l.indexOf("ja") === 0) return "ja";
      if (l.indexOf("zh") === 0) return /tw|hk|mo|hant/.test(l) ? "zh-TW" : "zh-CN";
      if (l.indexOf("en") === 0) return "en";
    }
    return "en";
  }

  function start(T, render) {
    var sel = document.getElementById("lang");
    LANGS.forEach(function (l) {
      var o = document.createElement("option");
      o.value = l[0];
      o.textContent = l[1];
      sel.appendChild(o);
    });

    function apply(lang) {
      function t(k) {
        if (T[lang] && T[lang][k] !== undefined) return T[lang][k];
        if (COMMON[lang] && COMMON[lang][k] !== undefined) return COMMON[lang][k];
        if (T.en && T.en[k] !== undefined) return T.en[k];
        return COMMON.en[k];
      }
      document.documentElement.lang = lang;
      document.title = t("title");
      var m = document.querySelector("meta[name=description]");
      if (m) m.setAttribute("content", t("desc"));
      document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
      document.querySelectorAll("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
      sel.value = lang;
      sel.setAttribute("aria-label", t("langLabel"));
      if (render) render(lang, t);
    }

    sel.addEventListener("change", function () {
      var l = sel.value;
      try { localStorage.setItem("sl-lang", l); } catch (e) {}
      try {
        var u = new URL(location.href);
        u.searchParams.set("lang", l);
        history.replaceState(null, "", u);
      } catch (e) {}
      apply(l);
    });

    apply(detect());
  }

  window.SL = { LANGS: LANGS, COMMON: COMMON, detect: detect, start: start };
})();
