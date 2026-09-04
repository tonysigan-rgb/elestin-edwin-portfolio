let films = [
  { id: "1GHPriOUqiOhudraP3o0Z_BkRGoj3zdGI", title: "Jacque & Georgiana", category: "wedding", display: "Wedding" },
  { id: "1vz0wHX5EdcLpxkm7GvYhNmIExgsFH16M", title: "Patrick & Vanessa — Full Film", category: "wedding", display: "Wedding" },
  { id: "1WUR0P8pzDcHoH0EBpWYH-4cKVt0pgsN7", title: "A quiet celebration", category: "wedding", display: "Wedding" },
  { id: "16EtORfNixwTc_o_RngTuixvDLMPOhpDe", title: "Fazrol & Zurriah", category: "wedding", display: "Wedding" },
  { id: "1pANhxObdkaBDVR7d9PA26PqQTcRqvnC0", title: "A day to remember", category: "wedding", display: "Wedding" },
  { id: "1lS1J17no1z8V20T3rPblG1l1cAhMZaGZ", title: "Vincent & Affydyren", category: "wedding", display: "Wedding" },
  { id: "1JUaD3Maiqs0MeegCYQfH3GWeNTa1RJTb", title: "McWalter & Annastasia", category: "wedding", display: "Wedding" },
  { id: "1a1vWOMmbI0lHiHrfl1D4b5RNim6nuv4r", title: "Mike & Janice", category: "wedding", display: "Wedding" },
  { id: "1WpTHuGUVSdZHWJKUK6m0aPPFSM9XQZcV", title: "Gary & Rowena", category: "wedding", display: "Wedding" },
  { id: "1p2cWM_kEbfBh8_EEfzuu1p-788ZfHdTn", title: "Patrick & Vanessa — Teaser", category: "wedding", display: "Wedding" },
  { id: "1dJbNbVyP8Sm2dQb1AIbhfKWQcZq3jpzo", title: "Wedding moments", category: "wedding", display: "Wedding" },
  { id: "1ibvrTYSBANsrrUnTqRrB5kcmVyzkWZqy", title: "A new chapter", category: "wedding", display: "Wedding" },
  { id: "14dIyWfZkyFHYA7AFNd8WpWyuAPgW_OIv", title: "HPU", category: "corporate", display: "Corporate" },
  { id: "1ZSgAbeL7PCESfZEE8rERS-7-ATJzRj6-", title: "Christmas Gathering, Bukit Saban", category: "corporate", display: "Corporate" },
  { id: "14Vyx8kYHLWCl7IxCQU1TZq09WJfzkb6_", title: "Household LPG: What You Need To Know", category: "corporate", display: "Corporate" },
  { id: "1M9HrRC1PrhUTlwZ1_UJAE_PIfeUwUdqx", title: "For the Family That We Love", category: "corporate", display: "Corporate" },
  { id: "10gW6LolRcqDNNs-ckJpyK9WiWDodV3Ea", title: "Kia Opening", category: "reels", display: "Reel" },
  { id: "1uhKcK1NYUfb1ijpWeYWC6X7iDQQJ6aqn", title: "Reels Video", category: "reels", display: "Reel" },
  { id: "1Ph9mdbA4QkK-n4rv3bI5x65Swm3w2HOe", title: "Viviana Lin & Winston Watson — Gawai", category: "reels", display: "Reel" },
];

const grid = document.querySelector("#film-grid");
const workCount = document.querySelector("#work-count");
const filters = document.querySelectorAll(".filter");
const searchLayer = document.querySelector("#search-layer");
const searchInput = document.querySelector("#film-search");
const playerLayer = document.querySelector("#player-layer");
const playerFrame = document.querySelector("#player-frame");
const playerTitle = document.querySelector("#player-title");
const playerCategory = document.querySelector("#player-category");
const playerPosition = document.querySelector("#player-position");
const liveDriveConfig = window.DRIVE_GALLERY_CONFIG;
const liveDriveFolders = [
  { id: "1Q9ggNqy97KpFJl_OSEyClvQ4CvUNb3eP", category: "wedding", display: "Wedding" },
  { id: "17EIbqk4WS5Gt4HNpcT4DnZuGCc-tDxGg", category: "corporate", display: "Corporate" },
  { id: "1YrBIR_c9jiumiudIZ8sDDsPxOk52tVQf", category: "reels", display: "Reel" },
];
let activeFilter = "all";
let currentFilmIndex = 0;
let lastFocus;

function filteredFilms() {
  const query = searchInput.value.trim().toLowerCase();
  return films.filter((film) => (activeFilter === "all" || film.category === activeFilter) && film.title.toLowerCase().includes(query));
}

function thumbUrl(id) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

function filmTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .trim();
}

async function readDriveFolder(folder) {
  const files = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      key: liveDriveConfig.apiKey,
      q: `'${folder.id}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,createdTime)",
      orderBy: "createdTime desc",
      pageSize: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!response.ok) throw new Error(`Google Drive returned ${response.status}`);

    const result = await response.json();
    files.push(...(result.files || []));
    pageToken = result.nextPageToken || "";
  } while (pageToken);

  return files
    .filter((file) => file.mimeType?.startsWith("video/"))
    .map((file) => ({
      id: file.id,
      title: filmTitle(file.name),
      category: folder.category,
      display: folder.display,
    }));
}

async function refreshLiveDriveGallery() {
  if (!liveDriveConfig?.apiKey) return;

  const groups = await Promise.all(liveDriveFolders.map(readDriveFolder));
  const liveFilms = groups.flat();
  if (!liveFilms.length) return;

  films = liveFilms;
  renderFilms();
}

function renderFilms() {
  const visibleFilms = filteredFilms();
  workCount.textContent = `${visibleFilms.length} ${visibleFilms.length === 1 ? "film" : "films"}`;
  if (!visibleFilms.length) {
    grid.innerHTML = `<p class="empty-state">No films match that search.</p>`;
    return;
  }
  grid.innerHTML = visibleFilms.map((film) => `
    <button class="film-card" data-film-id="${film.id}" type="button" aria-label="Play ${film.title}">
      <img src="${thumbUrl(film.id)}" alt="" loading="lazy" />
      <span class="card-play" aria-hidden="true"><span class="play-symbol"></span></span>
      <span class="film-card-content">
        <span class="film-card-type">${film.display}</span>
        <span class="film-card-title">${film.title}</span>
      </span>
    </button>
  `).join("");

  grid.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => image.closest(".film-card").classList.add("no-image"), { once: true });
  });
}

function openPlayer(id) {
  currentFilmIndex = films.findIndex((film) => film.id === id);
  if (currentFilmIndex < 0) return;
  const film = films[currentFilmIndex];
  lastFocus = document.activeElement;
  playerTitle.textContent = film.title;
  playerCategory.textContent = film.display.toUpperCase();
  playerPosition.textContent = `${currentFilmIndex + 1} / ${films.length}`;
  playerFrame.innerHTML = `<iframe src="https://drive.google.com/file/d/${film.id}/preview" title="${film.title}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  playerLayer.classList.add("open");
  playerLayer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.querySelector("#close-player").focus();
}

function closePlayer() {
  playerLayer.classList.remove("open");
  playerLayer.setAttribute("aria-hidden", "true");
  playerFrame.innerHTML = "";
  document.body.style.overflow = "";
  lastFocus?.focus();
}

function stepFilm(direction) {
  currentFilmIndex = (currentFilmIndex + direction + films.length) % films.length;
  openPlayer(films[currentFilmIndex].id);
}

function openSearch() {
  lastFocus = document.activeElement;
  searchLayer.classList.add("open");
  searchLayer.setAttribute("aria-hidden", "false");
  searchInput.focus();
}

function closeSearch() {
  searchLayer.classList.remove("open");
  searchLayer.setAttribute("aria-hidden", "true");
  searchInput.value = "";
  renderFilms();
  lastFocus?.focus();
}

filters.forEach((filter) => filter.addEventListener("click", () => {
  activeFilter = filter.dataset.filter;
  filters.forEach((button) => button.classList.toggle("active", button === filter));
  renderFilms();
}));

grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-film-id]");
  if (card) openPlayer(card.dataset.filmId);
});
document.querySelector("#open-search").addEventListener("click", openSearch);
document.querySelector("#close-search").addEventListener("click", closeSearch);
document.querySelector("#close-player").addEventListener("click", closePlayer);
document.querySelector("#previous-film").addEventListener("click", () => stepFilm(-1));
document.querySelector("#next-film").addEventListener("click", () => stepFilm(1));
searchInput.addEventListener("input", renderFilms);

[searchLayer, playerLayer].forEach((layer) => layer.addEventListener("click", (event) => {
  if (event.target === layer) layer === searchLayer ? closeSearch() : closePlayer();
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (playerLayer.classList.contains("open")) closePlayer();
    else if (searchLayer.classList.contains("open")) closeSearch();
  }
});

renderFilms();

if (liveDriveConfig?.apiKey) {
  refreshLiveDriveGallery().catch((error) => console.warn("Live Drive gallery was not refreshed:", error));
  window.setInterval(() => {
    refreshLiveDriveGallery().catch((error) => console.warn("Live Drive gallery was not refreshed:", error));
  }, 60 * 1000);
}
