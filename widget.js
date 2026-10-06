/* Swansea Labour news reel.
 * Squarespace Code Block:
 *   <div id="sl-news" data-limit="12"></div>
 *   <script src="https://YOUR-USERNAME.github.io/swansea-labour-news/widget.js" defer></script>
 */
(function () {
  var script = document.currentScript;
  var base = script.src.replace(/widget\.js(\?.*)?$/, "");
  var root = document.getElementById("sl-news");
  if (!root) return;
  var limit = parseInt(root.getAttribute("data-limit") || "12", 10);
  var accent = root.getAttribute("data-accent") || "#E4003B";

  var css =
    "#sl-news{--sl-accent:" + accent + ";font:inherit;color:inherit}" +
    "#sl-news *{box-sizing:border-box}" +
    "#sl-news .sl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px}" +
    "#sl-news .sl-card{display:flex;flex-direction:column;border-top:4px solid var(--sl-accent);padding:18px 0 0;text-decoration:none;color:inherit;cursor:pointer;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;font:inherit}" +
    "#sl-news .sl-card:hover .sl-title,#sl-news .sl-card:focus-visible .sl-title{text-decoration:underline}" +
    "#sl-news .sl-date{font-size:.8em;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin:0 0 8px}" +
    "#sl-news .sl-title{font-size:1.25em;line-height:1.25;font-weight:700;margin:0 0 10px}" +
    "#sl-news .sl-summary{margin:0 0 12px;line-height:1.5}" +
    "#sl-news .sl-more{margin-top:auto;font-weight:700;color:var(--sl-accent)}" +
    "#sl-news .sl-article{max-width:720px}" +
    "#sl-news .sl-article h2{font-size:2em;line-height:1.15;margin:8px 0 20px}" +
    "#sl-news .sl-article p{line-height:1.65;margin:0 0 1em}" +
    "#sl-news .sl-back{background:none;border:0;padding:0;font:inherit;font-weight:700;color:var(--sl-accent);cursor:pointer;margin-bottom:16px}" +
    "#sl-news .sl-source,#sl-news .sl-imprint{font-size:.85em;opacity:.75;line-height:1.5}" +
    "#sl-news .sl-source a{color:inherit}" +
    "#sl-news .sl-imprint{margin-top:28px}" +
    "#sl-news .sl-empty{opacity:.7}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function imprintEl(text) {
    return text ? el("p", "sl-imprint", text) : document.createDocumentFragment();
  }

  function renderList(data) {
    root.innerHTML = "";
    var items = data.articles.slice(0, limit);
    if (!items.length) {
      root.appendChild(el("p", "sl-empty", "No news yet. Check back soon."));
      return;
    }
    var grid = el("div", "sl-grid");
    items.forEach(function (a) {
      var card = el("a", "sl-card");
      card.href = "#news/" + a.id;
      card.appendChild(el("p", "sl-date", fmtDate(a.date)));
      card.appendChild(el("h3", "sl-title", a.headline));
      card.appendChild(el("p", "sl-summary", a.summary));
      card.appendChild(el("span", "sl-more", "Read more →"));
      grid.appendChild(card);
    });
    root.appendChild(grid);
    root.appendChild(imprintEl(data.imprint));
  }

  function renderArticle(data, a) {
    root.innerHTML = "";
    var art = el("article", "sl-article");
    var back = el("button", "sl-back", "← All news");
    back.type = "button";
    back.onclick = function () {
      history.pushState("", document.title, location.pathname + location.search);
      route();
      root.scrollIntoView({ behavior: "smooth" });
    };
    art.appendChild(back);
    art.appendChild(el("p", "sl-date", fmtDate(a.date)));
    art.appendChild(el("h2", null, a.headline));
    a.body.forEach(function (p) {
      art.appendChild(el("p", null, p));
    });
    if (a.sourceTitle || a.sourceUrl) {
      var src = el("p", "sl-source", "Based on a Swansea Council press release");
      if (a.sourceUrl) {
        src.appendChild(document.createTextNode(": "));
        var link = el("a", null, a.sourceTitle || "read the original");
        link.href = a.sourceUrl;
        link.target = "_blank";
        link.rel = "noopener";
        src.appendChild(link);
      } else if (a.sourceTitle) {
        src.appendChild(document.createTextNode(": " + a.sourceTitle));
      }
      src.appendChild(document.createTextNode("."));
      art.appendChild(src);
    }
    art.appendChild(imprintEl(data.imprint));
    root.appendChild(art);
    root.scrollIntoView({ behavior: "smooth" });
  }

  var data = null;
  function route() {
    if (!data) return;
    var m = location.hash.match(/^#news\/(.+)$/);
    var a = m && data.articles.find(function (x) { return x.id === decodeURIComponent(m[1]); });
    if (a) renderArticle(data, a);
    else renderList(data);
  }

  root.textContent = "Loading news…";
  fetch(base + "articles.json?t=" + Math.floor(Date.now() / 300000), { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      data = d;
      route();
      window.addEventListener("hashchange", route);
    })
    .catch(function () {
      root.textContent = "News is unavailable right now.";
    });
})();
