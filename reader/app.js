const state = { manifest: null, publication: null, index: 0 };
const $ = (id) => document.getElementById(id);

function showMenu() {
  state.publication = null;
  $("reader").hidden = true;
  $("menu").hidden = false;
  $("menuButton").hidden = true;
  $("zoomButton").hidden = true;
  $("title").textContent = state.manifest.siddur.title || "סידור";
  $("subtitle").textContent = state.manifest.siddur.subtitle || "";
  $("status").textContent = "";
}

function openPublication(publication) {
  state.publication = publication;
  state.index = 0;
  $("menu").hidden = true;
  $("reader").hidden = false;
  $("menuButton").hidden = false;
  $("zoomButton").hidden = false;
  $("title").textContent = publication.title;
  renderPage();
}

function renderPage() {
  const pages = state.publication.pages;
  const current = pages[state.index];
  $("page").src = current.src;
  $("page").alt = `${state.publication.title}, עמוד ${state.index + 1}`;
  $("previous").disabled = state.index === 0;
  $("next").disabled = state.index === pages.length - 1;
  $("status").textContent = `${state.index + 1} / ${pages.length}`;
  $("pageFrame").scrollTop = 0;
}

function move(delta) {
  if (!state.publication) return;
  const next = state.index + delta;
  if (next < 0 || next >= state.publication.pages.length) return;
  state.index = next;
  renderPage();
}

async function start() {
  const response = await fetch("siddur.json");
  if (!response.ok) throw new Error("לא ניתן לטעון את קובץ הסידור");
  state.manifest = await response.json();
  document.documentElement.dir = state.manifest.siddur.direction || "rtl";
  document.documentElement.lang = state.manifest.siddur.language || "he";
  const menu = $("menu");
  for (const publication of state.manifest.publications) {
    const button = document.createElement("button");
    button.className = "publication";
    button.textContent = publication.title;
    button.addEventListener("click", () => openPublication(publication));
    menu.appendChild(button);
  }
  showMenu();
}

$("menuButton").addEventListener("click", showMenu);
$("zoomButton").addEventListener("click", () => document.body.classList.toggle("zoomed"));
$("previous").addEventListener("click", () => move(-1));
$("next").addEventListener("click", () => move(1));
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") move(-1);
  if (event.key === "ArrowLeft") move(1);
  if (event.key === "Escape") showMenu();
});
let touchStartX = null;
$("page").addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
$("page").addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 55) move(distance > 0 ? -1 : 1);
  touchStartX = null;
}, { passive: true });

start().catch((error) => { $("status").textContent = error.message; });

