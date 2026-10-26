const msg = key => chrome.i18n.getMessage(key) || key;

const DEFAULTS = {
  enabled: true,
  mode: "text",
  text: chrome.i18n.getMessage("defaultText") || "Hello",
  colorful: true,
  color: "#202124",
  imageData: "",
  size: 100,
  offsetY: 0
};

const $ = id => document.getElementById(id);
const save = patch => chrome.storage.local.set(patch);

function localize() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.querySelectorAll("[data-i18n]").forEach(el => (el.textContent = msg(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => (el.placeholder = msg(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-title]").forEach(el => (el.title = msg(el.dataset.i18nTitle)));
}

function showPanel(mode) {
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.dataset.panel === mode));
}

localize();

chrome.storage.local.get(DEFAULTS, s => {
  $("enabled").checked = s.enabled;
  $("text").value = s.text;
  $("colorful").checked = s.colorful;
  $("color").value = s.color;
  $("size").value = s.size;
  $("offsetY").value = s.offsetY;
  if (s.imageData) $("preview").src = s.imageData;
  document.querySelector(`input[name="mode"][value="${s.mode}"]`).checked = true;
  showPanel(s.mode);
});

$("enabled").addEventListener("change", e => save({ enabled: e.target.checked }));
$("text").addEventListener("input", e => save({ text: e.target.value }));
$("colorful").addEventListener("change", e => save({ colorful: e.target.checked }));
$("color").addEventListener("input", e => {
  $("colorful").checked = false;
  save({ color: e.target.value, colorful: false });
});
$("size").addEventListener("input", e => save({ size: Number(e.target.value) }));
$("offsetY").addEventListener("input", e => save({ offsetY: Number(e.target.value) }));

document.querySelectorAll('input[name="mode"]').forEach(r =>
  r.addEventListener("change", e => {
    showPanel(e.target.value);
    save({ mode: e.target.value });
  })
);

$("file").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    $("preview").src = reader.result;
    save({ imageData: reader.result, mode: "image" });
    document.querySelector('input[name="mode"][value="image"]').checked = true;
    showPanel("image");
  };
  reader.readAsDataURL(f);
});
