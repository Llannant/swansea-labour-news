/* Swansea Labour news reel (v2)
 *
 * Squarespace Code Block:
 *   <div id="sl-news" data-limit="12"></div>
 *   <script src="https://swansealabour.github.io/swansea-labour-news/widget.js" defer></script>
 *
 * Optional attributes on the #sl-news div:
 *   data-limit="12"            how many cards to show
 *   data-accent="#E4003B"      accent colour
 *   data-label="Swansea Labour" text on the red panel shown when a story has no photo
 *   data-ward="Gowerton"       only show stories tagged with this ward
 *   data-imprint="off"         hide the imprint line (only if the page already carries one)
 *   data-all-url="/news"       where "See all news" points when used on a ward page
 *
 * Each story has its own address (?article=ID) with its own title, description,
 * sharing image and NewsArticle structured data, so Google can index it. Old
 * #news/ID links still work and are upgraded automatically.
 */
(function () {
  var script = document.currentScript;
  var base = script.src.replace(/widget\.js(\?.*)?$/, "");
  var root = document.getElementById("sl-news");
  if (!root) return;

  var limit = parseInt(root.getAttribute("data-limit") || "12", 10);
  var accent = root.getAttribute("data-accent") || "#E4003B";
  var label = root.getAttribute("data-label") || "Swansea Labour";
  var wardFilter = (root.getAttribute("data-ward") || "").trim().toLowerCase();
  var showImprint = root.getAttribute("data-imprint") !== "off";
  var allUrl = root.getAttribute("data-all-url") || "";
  var PARAM = "article";

  var css =
    "#sl-news{--sl-accent:" + accent + ";display:block;width:100%;max-width:100%;color:inherit;font-family:inherit;" +
    "font-size:clamp(16px,0.6vw + 13px,19px);line-height:1.55;container-type:inline-size}" +
    "#sl-news *{box-sizing:border-box}" +
    "#sl-news .sl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:clamp(20px,3vw,40px)}" +
    "#sl-news .sl-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;min-width:0}" +
    "#sl-news .sl-media{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:6px;margin-bottom:16px;background:var(--sl-accent)}" +
    "#sl-news .sl-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}" +
    "#sl-news .sl-card:hover .sl-media img{transform:scale(1.04)}" +
    "#sl-news .sl-ph{position:absolute;inset:0;display:flex;align-items:flex-end;padding:18px;color:#fff;font-weight:800;" +
    "font-size:1.3em;line-height:1.1;letter-spacing:-.01em;background:linear-gradient(135deg,var(--sl-accent),color-mix(in srgb,var(--sl-accent) 70%,#000))}" +
    "#sl-news .sl-date{font-size:.78em;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:0 0 8px}" +
    "#sl-news .sl-title{font-size:1.3em;line-height:1.2;font-weight:700;margin:0 0 10px}" +
    "#sl-news .sl-card:hover .sl-title,#sl-news .sl-card:focus-visible .sl-title{text-decoration:underline;text-decoration-color:var(--sl-accent);text-underline-offset:4px}" +
    "#sl-news .sl-summary{margin:0 0 14px}" +
    "#sl-news .sl-more{margin-top:auto;font-weight:700;color:var(--sl-accent)}" +
    "@container (min-width:860px){" +
    "#sl-news .sl-card.sl-feature{grid-column:1/-1;display:grid;grid-template-columns:3fr 2fr;gap:clamp(24px,3vw,48px);align-items:center}" +
    "#sl-news .sl-feature .sl-media{margin-bottom:0}" +
    "#sl-news .sl-feature .sl-title{font-size:2em}" +
    "#sl-news .sl-feature .sl-summary{font-size:1.1em}}" +
    "#sl-news .sl-article{max-width:760px;margin:0 auto}" +
    "#sl-news .sl-article h2{font-size:clamp(1.8em,4cqi,2.6em);line-height:1.12;margin:6px 0 22px}" +
    "#sl-news .sl-article p{margin:0 0 1.1em}" +
    "#sl-news .sl-figure{margin:0 0 1.4em}" +
    "#sl-news .sl-figure img{width:100%;height:auto;display:block;border-radius:6px}" +
    "#sl-news .sl-figure.sl-hero img{aspect-ratio:16/9;object-fit:cover}" +
    "#sl-news .sl-figure figcaption{font-size:.82em;opacity:.75;line-height:1.4;margin-top:8px}" +
    "#sl-news .sl-back{display:inline-block;font-weight:700;color:var(--sl-accent);margin-bottom:18px;text-decoration:none}" +
    "#sl-news .sl-back:hover{text-decoration:underline}" +
    "#sl-news .sl-source,#sl-news .sl-imprint{font-size:.85em;opacity:.75}" +
    "#sl-news .sl-source a{color:inherit}" +
    "#sl-news .sl-imprint{margin-top:32px}" +
    "#sl-news .sl-empty{opacity:.7}" +
    "#sl-news .sl-empty a{color:var(--sl-accent)}";
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

  function resolve(src) {
    if (!src) return "";
    return /^(https?:)?\/\//.test(src) || src.charAt(0) === "/" ? src : base + src;
  }

  // Photos for a story. Accepts the current images[] list and the older single image field.
  function imagesOf(a) {
    var list = (a.images || []).filter(function (i) { return i && i.src; });
    if (!list.length && a.image) list = [{ src: a.image, alt: a.imageAlt || "" }];
    return list;
  }

  // ---- Addresses: ?article=ID on the current page; legacy #news/ID still understood ----
  function pageUrl() {
    var u = new URL(location.href);
    u.hash = "";
    u.searchParams.delete(PARAM);
    return u.toString();
  }
  function articleUrl(id) {
    var u = new URL(location.href);
    u.hash = "";
    u.searchParams.set(PARAM, id);
    return u.toString();
  }
  function currentId() {
    var q = new URL(location.href).searchParams.get(PARAM);
    if (q) return q;
    var m = location.hash.match(/^#news\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function go(url) {
    history.pushState({}, "", url);
    route();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---- Page head: title, description, canonical, sharing tags, structured data ----
  var head = document.head;
  function grab(sel, attr) { var t = head.querySelector(sel); return t ? t.getAttribute(attr) || "" : ""; }
  var original = {
    title: document.title,
    description: grab('meta[name="description"]', "content"),
    canonical: grab('link[rel="canonical"]', "href"),
    ogTitle: grab('meta[property="og:title"]', "content"),
    ogDesc: grab('meta[property="og:description"]', "content"),
    ogUrl: grab('meta[property="og:url"]', "content"),
    ogImage: grab('meta[property="og:image"]', "content")
  };
  function setTag(selector, create, value) {
    var t = head.querySelector(selector);
    if (!value) { if (t && t.hasAttribute("data-sl-news")) t.remove(); return; }
    if (!t) { t = create(); t.setAttribute("data-sl-news", ""); head.appendChild(t); }
    if (t.tagName === "LINK") t.setAttribute("href", value); else t.setAttribute("content", value);
  }
  function meta(name) { return function () { var m = document.createElement("meta"); m.setAttribute("name", name); return m; }; }
  function prop(p) { return function () { var m = document.createElement("meta"); m.setAttribute("property", p); return m; }; }
  function link(rel) { return function () { var l = document.createElement("link"); l.setAttribute("rel", rel); return l; }; }

  function applyHead(a) {
    var ld = head.querySelector("#sl-news-ld");
    if (ld) ld.remove();
    if (!a) {
      document.title = original.title;
      setTag('meta[name="description"]', meta("description"), original.description);
      setTag('link[rel="canonical"]', link("canonical"), original.canonical);
      setTag('meta[property="og:title"]', prop("og:title"), original.ogTitle);
      setTag('meta[property="og:description"]', prop("og:description"), original.ogDesc);
      setTag('meta[property="og:url"]', prop("og:url"), original.ogUrl);
      setTag('meta[property="og:image"]', prop("og:image"), original.ogImage);
      return;
    }
    var url = articleUrl(a.id);
    var imgs = imagesOf(a);
    document.title = a.headline + " — Swansea Labour";
    setTag('meta[name="description"]', meta("description"), a.summary || "");
    setTag('link[rel="canonical"]', link("canonical"), url);
    setTag('meta[property="og:title"]', prop("og:title"), a.headline);
    setTag('meta[property="og:description"]', prop("og:description"), a.summary || "");
    setTag('meta[property="og:url"]', prop("og:url"), url);
    setTag('meta[property="og:image"]', prop("og:image"), imgs[0] ? resolve(imgs[0].src) : original.ogImage);

    var json = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": a.headline,
      "description": a.summary || "",
      "datePublished": a.date,
      "dateModified": a.updated || a.date,
      "mainEntityOfPage": url,
      "author": { "@type": "Organization", "name": "Swansea Labour" },
      "publisher": { "@type": "Organization", "name": "Swansea Labour", "url": "https://www.swansealabour.org" },
      "articleBody": (a.body || []).join("\n\n")
    };
    if (imgs.length) json.image = imgs.map(function (i) { return resolve(i.src); });
    if (a.sourceUrl) json.isBasedOn = a.sourceUrl;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "sl-news-ld";
    s.textContent = JSON.stringify(json);
    head.appendChild(s);
  }

  function imprintEl(text) {
    return showImprint && text ? el("p", "sl-imprint", text) : document.createDocumentFragment();
  }

  function media(a) {
    var box = el("div", "sl-media");
    var img = imagesOf(a)[0];
    if (img) {
      var i = el("img");
      i.src = resolve(img.src);
      i.alt = img.alt || "";
      i.loading = "lazy";
      box.appendChild(i);
    } else {
      box.appendChild(el("div", "sl-ph", label));
    }
    return box;
  }

  function figure(img, hero) {
    var f = el("figure", "sl-figure" + (hero ? " sl-hero" : ""));
    var i = el("img");
    i.src = resolve(img.src);
    i.alt = img.alt || "";
    i.loading = hero ? "eager" : "lazy";
    if (img.width && img.height) { i.width = img.width; i.height = img.height; }
    f.appendChild(i);
    var cap = [img.caption, img.credit ? "Photo: " + img.credit : ""].filter(Boolean).join(" ");
    if (cap) f.appendChild(el("figcaption", null, cap));
    return f;
  }

  function visibleArticles(data) {
    var items = data.articles || [];
    if (wardFilter) {
      items = items.filter(function (a) {
        return (a.wards || []).some(function (w) { return String(w).toLowerCase() === wardFilter; });
      });
    }
    return items;
  }

  // ---- Views ----
  function renderList(data) {
    root.innerHTML = "";
    var items = visibleArticles(data).slice(0, limit);
    if (!items.length) {
      var p = el("p", "sl-empty", wardFilter ? "No news for this ward yet. " : "No news yet. Check back soon.");
      if (wardFilter && allUrl) {
        var all = el("a", null, "See all Swansea Labour news");
        all.href = allUrl;
        p.appendChild(all);
      }
      root.appendChild(p);
      return;
    }
    var grid = el("div", "sl-grid");
    items.forEach(function (a, idx) {
      var card = el("a", "sl-card" + (idx === 0 && !wardFilter ? " sl-feature" : ""));
      card.href = articleUrl(a.id);
      card.onclick = function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;
        ev.preventDefault();
        go(card.href);
      };
      card.appendChild(media(a));
      var text = el("div");
      text.appendChild(el("p", "sl-date", fmtDate(a.date)));
      text.appendChild(el("h3", "sl-title", a.headline));
      text.appendChild(el("p", "sl-summary", a.summary));
      text.appendChild(el("span", "sl-more", "Read more →"));
      card.appendChild(text);
      grid.appendChild(card);
    });
    root.appendChild(grid);
    root.appendChild(imprintEl(data.imprint));
  }

  function renderArticle(data, a) {
    root.innerHTML = "";
    var art = el("article", "sl-article");
    var back = el("a", "sl-back", "← All news");
    back.href = pageUrl();
    back.onclick = function (ev) { ev.preventDefault(); go(back.href); };
    art.appendChild(back);
    art.appendChild(el("p", "sl-date", fmtDate(a.date)));
    art.appendChild(el("h2", null, a.headline));

    var imgs = imagesOf(a);
    if (imgs[0]) art.appendChild(figure(imgs[0], true));
    var body = a.body || [];
    body.forEach(function (p, idx) {
      art.appendChild(el("p", null, p));
      if (idx === 0) imgs.slice(1).forEach(function (im) { art.appendChild(figure(im, false)); });
    });
    if (!body.length) imgs.slice(1).forEach(function (im) { art.appendChild(figure(im, false)); });

    if (a.sourceTitle || a.sourceUrl) {
      var src = el("p", "sl-source", "Based on a Swansea Council press release");
      if (a.sourceUrl) {
        src.appendChild(document.createTextNode(": "));
        var l = el("a", null, a.sourceTitle || "read the original");
        l.href = a.sourceUrl;
        l.target = "_blank";
        l.rel = "noopener";
        src.appendChild(l);
      } else if (a.sourceTitle) {
        src.appendChild(document.createTextNode(": " + a.sourceTitle));
      }
      src.appendChild(document.createTextNode("."));
      art.appendChild(src);
    }
    art.appendChild(imprintEl(data.imprint));
    root.appendChild(art);
  }

  var data = null;
  function route() {
    if (!data) return;
    var id = currentId();
    if (id && location.hash) history.replaceState({}, "", articleUrl(id));
    var a = id && (data.articles || []).find(function (x) { return x.id === id; });
    applyHead(a || null);
    if (a) renderArticle(data, a);
    else renderList(data);
  }

  root.textContent = "Loading news…";
  fetch(base + "articles.json?t=" + Math.floor(Date.now() / 300000), { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      data = d;
      route();
      window.addEventListener("popstate", route);
      window.addEventListener("hashchange", route);
    })
    .catch(function () {
      root.textContent = "News is unavailable right now.";
    });
})();
