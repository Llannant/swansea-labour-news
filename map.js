/* Swansea Labour delivery map
 *
 * Squarespace Code Block:
 *   <div id="sl-map"></div>
 *   <script src="https://swansealabour.github.io/swansea-labour-news/map.js" defer></script>
 *
 * Optional attributes on #sl-map:
 *   data-height="560"       map height in pixels
 *   data-ward="Gowerton"    start filtered to one ward (a ?ward= in the page address also works)
 *   data-list="off"         hide the list of projects under the map
 *   data-imprint="off"      hide the imprint line
 *
 * Projects come from delivery.json, edited in the review page's Map tab.
 * Map data © OpenStreetMap contributors.
 */
(function () {
  var script = document.currentScript;
  var base = script ? script.src.replace(/map\.js(\?.*)?$/, "") : "https://swansealabour.github.io/swansea-labour-news/";
  var root = document.getElementById("sl-map");
  if (!root || root.hasAttribute("data-sl-done")) return;
  root.setAttribute("data-sl-done", "");

  var LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
  var height = parseInt(root.getAttribute("data-height") || "560", 10);
  var showList = root.getAttribute("data-list") !== "off";
  var showImprint = root.getAttribute("data-imprint") !== "off";
  var startWard = new URL(location.href).searchParams.get("ward") || root.getAttribute("data-ward") || "";
  var THEMES = {
    "Play": "#E4003B",
    "Sport and leisure": "#E07B00",
    "Homes": "#7B3FA0",
    "Active travel": "#1A8A4A",
    "Regeneration": "#1F5FBF",
    "Coast and countryside": "#0E8C8C",
    "Community": "#C2185B",
    "Roads": "#555555"
  };

  var css = document.createElement("style");
  css.textContent =
    "#sl-map{display:block;width:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:1.55}" +
    "#sl-map *{box-sizing:border-box}" +
    "#sl-map .slm-bar{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;margin:0 0 14px}" +
    "#sl-map .slm-chips{display:flex;flex-wrap:wrap;gap:6px}" +
    "#sl-map .slm-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(128,128,128,.45);background:transparent;color:inherit;border-radius:999px;padding:4px 12px;font:inherit;font-size:.85em;cursor:pointer}" +
    "#sl-map .slm-chip[aria-pressed=false]{opacity:.45}" +
    "#sl-map .slm-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex:none}" +
    "#sl-map select{font:inherit;font-size:.9em;padding:5px 8px;border:1px solid rgba(128,128,128,.45);border-radius:6px;background:transparent;color:inherit}" +
    "#sl-map .slm-count{font-size:.9em;opacity:.75}" +
    "#sl-map .slm-canvas{width:100%;border-radius:8px;overflow:hidden;background:#e8e8e8;z-index:0}" +
    "#sl-map .leaflet-popup-content{font-family:inherit;font-size:14px;line-height:1.45;margin:12px 14px}" +
    "#sl-map .slm-pop h3{font-size:15px;margin:0 0 4px;font-weight:600;line-height:1.3}" +
    "#sl-map .slm-pop p{margin:0 0 6px}" +
    "#sl-map .slm-pop .slm-meta{font-size:12px;opacity:.75;text-transform:uppercase;letter-spacing:.05em}" +
    "#sl-map .slm-pop a{color:#E4003B;font-weight:600}" +
    "#sl-map .slm-list{list-style:none;margin:24px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:18px 28px}" +
    "#sl-map .slm-item{border-left:4px solid #999;padding:2px 0 2px 14px}" +
    "#sl-map .slm-item h3{font-size:1.05em;font-weight:600;margin:0 0 2px;line-height:1.3}" +
    "#sl-map .slm-item p{margin:0 0 4px;font-size:.93em}" +
    "#sl-map .slm-item .slm-meta{font-size:.75em;letter-spacing:.06em;text-transform:uppercase;opacity:.7}" +
    "#sl-map .slm-actions{font-size:.9em}" +
    "#sl-map .slm-actions button{background:none;border:0;padding:0;font:inherit;color:#E4003B;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:3px}" +
    "#sl-map .slm-actions a{color:inherit}" +
    "#sl-map .slm-imprint{margin-top:2em;font-size:.85em;opacity:.75}";
  document.head.appendChild(css);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    return e;
  }
  function monthYear(s) {
    var d = new Date(s && s.length === 7 ? s + "-01" : s);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\band\b/g, "&").replace(/[^a-z&]/g, "");
  }
  function colour(theme) { return THEMES[theme] || "#666666"; }
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (!document.querySelector('link[href*="leaflet"]')) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = LEAFLET + "leaflet.min.css";
      document.head.appendChild(l);
    }
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = LEAFLET + "leaflet.min.js";
      s.onload = function () { res(window.L); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function getJson(name) {
    return fetch(base + name + "?t=" + Math.floor(Date.now() / 300000), { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  root.textContent = "Loading map…";
  Promise.all([getJson("delivery.json"), getJson("articles.json"), loadLeaflet()]).then(function (res) {
    var data = res[0], news = res[1], L = res[2];
    var projects = ((data && data.projects) || []).filter(function (p) { return isFinite(p.lat) && isFinite(p.lng); });
    root.textContent = "";
    if (!projects.length) { root.appendChild(el("p", null, "The delivery map is not available right now.")); return; }

    // ---- Filters ----
    var themesInUse = Object.keys(THEMES).filter(function (t) { return projects.some(function (p) { return p.theme === t; }); });
    var activeThemes = {};
    themesInUse.forEach(function (t) { activeThemes[t] = true; });
    var bar = el("div", "slm-bar");
    var chips = el("div", "slm-chips");
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Show projects by type");
    themesInUse.forEach(function (t) {
      var b = el("button", "slm-chip");
      b.type = "button";
      b.setAttribute("aria-pressed", "true");
      var dot = el("span", "slm-dot"); dot.style.background = colour(t);
      b.appendChild(dot); b.appendChild(document.createTextNode(t));
      b.onclick = function () {
        activeThemes[t] = !activeThemes[t];
        b.setAttribute("aria-pressed", String(activeThemes[t]));
        apply(true);
      };
      chips.appendChild(b);
    });
    var wardSel = el("select");
    wardSel.setAttribute("aria-label", "Show projects in a ward");
    var opt = el("option", null, "All of Swansea"); opt.value = ""; wardSel.appendChild(opt);
    var wardNames = projects.map(function (p) { return p.ward || p.councilWard; }).filter(Boolean)
      .filter(function (w, i, a) { return a.indexOf(w) === i; }).sort(function (a, b) { return a.localeCompare(b); });
    wardNames.forEach(function (w) { var o = el("option", null, w); o.value = w; wardSel.appendChild(o); });
    var match = wardNames.filter(function (w) { return norm(w) === norm(startWard); })[0];
    if (match) wardSel.value = match;
    wardSel.onchange = function () { apply(true); };
    var count = el("span", "slm-count");
    count.setAttribute("aria-live", "polite");
    bar.appendChild(chips); bar.appendChild(wardSel); bar.appendChild(count);
    root.appendChild(bar);

    // ---- Map ----
    var canvas = el("div", "slm-canvas");
    canvas.style.height = height + "px";
    root.appendChild(canvas);
    var map = L.map(canvas, { scrollWheelZoom: false, tap: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.on("focus", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });

    var list = showList ? el("ul", "slm-list") : null;
    if (list) root.appendChild(list);

    function popup(p) {
      var d = el("div", "slm-pop");
      d.appendChild(el("p", "slm-meta", [p.theme, monthYear(p.date), p.status === "Completed" ? "" : p.status].filter(Boolean).join(" · ")));
      d.appendChild(el("h3", null, p.title));
      d.appendChild(el("p", null, p.summary));
      if (p.source && p.source.url) {
        var a = el("a", null, "Source: " + (p.source.name || "read more"));
        a.href = p.source.url; a.target = "_blank"; a.rel = "noopener";
        d.appendChild(a);
      }
      return d;
    }

    var items = projects.map(function (p) {
      var c = colour(p.theme);
      var marker = L.circleMarker([p.lat, p.lng], {
        radius: 9, color: "#ffffff", weight: 2, fillColor: c, fillOpacity: p.status === "Completed" ? 0.95 : 0.55
      }).bindPopup(popup(p), { maxWidth: 300 });
      marker.bindTooltip(p.title, { direction: "top", offset: [0, -8] });
      var li = null;
      if (list) {
        li = el("li", "slm-item");
        li.style.borderLeftColor = c;
        li.appendChild(el("p", "slm-meta", [p.theme, monthYear(p.date), p.ward || p.councilWard].filter(Boolean).join(" · ")));
        li.appendChild(el("h3", null, p.title));
        li.appendChild(el("p", null, p.summary));
        var act = el("p", "slm-actions");
        var show = el("button", null, "Show on map");
        show.type = "button";
        show.onclick = function () {
          map.setView([p.lat, p.lng], 15);
          marker.openPopup();
          canvas.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        act.appendChild(show);
        if (p.source && p.source.url) {
          act.appendChild(document.createTextNode(" · "));
          var a = el("a", null, "Source");
          a.href = p.source.url; a.target = "_blank"; a.rel = "noopener";
          act.appendChild(a);
        }
        li.appendChild(act);
      }
      return { p: p, marker: marker, li: li };
    });

    function apply(fit) {
      var w = wardSel.value;
      var visible = [];
      items.forEach(function (it) {
        var ok = activeThemes[it.p.theme] !== false && (!w || norm(it.p.ward || it.p.councilWard) === norm(w));
        if (ok) { it.marker.addTo(map); visible.push(it); } else { it.marker.remove(); }
        if (it.li) { if (ok) list.appendChild(it.li); else if (it.li.parentNode) it.li.parentNode.removeChild(it.li); }
      });
      count.textContent = visible.length + (visible.length === 1 ? " project" : " projects") + (w ? " in " + w : " across Swansea");
      if (fit && visible.length) {
        var b = L.latLngBounds(visible.map(function (it) { return [it.p.lat, it.p.lng]; }));
        map.fitBounds(b, { padding: [30, 30], maxZoom: 15 });
      }
    }
    apply(false);
    var start = items.filter(function (it) { return !wardSel.value || norm(it.p.ward || it.p.councilWard) === norm(wardSel.value); });
    map.fitBounds(L.latLngBounds(start.map(function (it) { return [it.p.lat, it.p.lng]; })), { padding: [30, 30], maxZoom: 15 });

    if (showImprint && news && news.imprint) root.appendChild(el("p", "slm-imprint", news.imprint));
  }).catch(function () {
    root.textContent = "The delivery map could not be loaded.";
  });
})();
