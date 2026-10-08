/* Swansea Labour ward block
 *
 * Squarespace Code Block (one or more per ward page):
 *   <div class="sl-ward" data-ward="Gowerton"></div>
 *   <script src="https://swansealabour.github.io/swansea-labour-news/ward.js" defer></script>
 *
 * Attributes on each .sl-ward div:
 *   data-ward="Gowerton"        ward name exactly as in wards.json (required)
 *   data-show="councillors,pledges,projects,news"
 *                               which parts to show, in this order (default: all four)
 *   data-map-url="/delivering"  link from "Delivered in this ward" to the full map page
 *   data-news-url="/news"       news page, used if articles.json has no pageUrl set
 *   data-news-limit="3"         how many news stories to show
 *   data-projects-limit="6"     how many delivered projects to show
 *   data-imprint="off"          hide the imprint line under the news
 *   data-accent="#E4003B"       accent colour
 *
 * Data comes from wards.json, delivery.json and articles.json beside this script,
 * all edited from the review page (admin.html).
 */
(function () {
  var script = document.currentScript;
  var base = script ? script.src.replace(/ward\.js(\?.*)?$/, "") : "https://swansealabour.github.io/swansea-labour-news/";
  var roots = [].slice.call(document.querySelectorAll(".sl-ward:not([data-sl-done])"));
  if (!roots.length) return;
  roots.forEach(function (r) { r.setAttribute("data-sl-done", ""); r.textContent = "Loading…"; });

  var STATUS = {
    "delivered": { label: "Delivered", cls: "done" },
    "in-progress": { label: "In progress", cls: "doing" },
    "ongoing": { label: "Ongoing", cls: "ongoing" },
    "not-yet": { label: "Not yet started", cls: "todo" }
  };

  if (!document.getElementById("sl-ward-css")) {
    var css = document.createElement("style");
    css.id = "sl-ward-css";
    css.textContent =
      ".sl-ward{--sl-accent:#E4003B;display:block;width:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:1.6}" +
      ".sl-ward *{box-sizing:border-box}" +
      ".sl-ward .slw-part{margin:0 0 3em}" +
      ".sl-ward .slw-part:last-child{margin-bottom:0}" +
      ".sl-ward h2.slw-h{font-family:inherit;font-size:1.75em;line-height:1.2;font-weight:600;margin:0 0 .4em;letter-spacing:normal;text-transform:none}" +
      ".sl-ward .slw-sub{margin:0 0 1.4em;opacity:.8}" +
      ".sl-ward .slw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:28px}" +
      ".sl-ward .slw-person{text-align:center}" +
      ".sl-ward .slw-photo{width:150px;height:150px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 14px;background:#eee}" +
      ".sl-ward .slw-noimg{width:150px;height:150px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;background:var(--sl-accent);color:#fff;font-size:2.4em;font-weight:700}" +
      ".sl-ward .slw-name{font-size:1.25em;font-weight:600;margin:0 0 2px}" +
      ".sl-ward .slw-role{font-size:.9em;opacity:.75;margin:0 0 8px}" +
      ".sl-ward .slw-contact{margin:0;font-size:.95em}" +
      ".sl-ward .slw-contact a{color:inherit;text-decoration:underline;text-underline-offset:3px;word-break:break-word}" +
      ".sl-ward details{margin-top:10px;text-align:left}" +
      ".sl-ward summary{cursor:pointer;font-weight:600;color:var(--sl-accent);text-align:center;list-style-position:inside}" +
      ".sl-ward details p{font-size:.95em;margin:.7em 0 0}" +
      ".sl-ward .slw-progress{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:0 0 1.2em;font-size:.95em}" +
      ".sl-ward .slw-bar{flex:1 1 200px;height:10px;border-radius:5px;background:rgba(128,128,128,.2);overflow:hidden;display:flex}" +
      ".sl-ward .slw-bar span{display:block;height:100%}" +
      ".sl-ward .slw-pledges{list-style:none;margin:0;padding:0;display:grid;gap:14px}" +
      ".sl-ward .slw-pledge{border-left:4px solid rgba(128,128,128,.35);padding:4px 0 4px 16px}" +
      ".sl-ward .slw-pledge.done{border-left-color:#1a7f4b}" +
      ".sl-ward .slw-pledge.doing{border-left-color:#c27c00}" +
      ".sl-ward .slw-pledge.ongoing{border-left-color:#2b6cb0}" +
      ".sl-ward .slw-ptitle{font-weight:600;margin:0}" +
      ".sl-ward .slw-pdetail{margin:2px 0 0}" +
      ".sl-ward .slw-evidence{margin:6px 0 0;font-size:.92em}" +
      ".sl-ward .slw-evidence a{color:var(--sl-accent);font-weight:600}" +
      ".sl-ward .slw-pill{display:inline-block;font-size:.72em;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle;color:#fff;background:#777}" +
      ".sl-ward .slw-pill.done{background:#1a7f4b}.sl-ward .slw-pill.doing{background:#c27c00}.sl-ward .slw-pill.ongoing{background:#2b6cb0}.sl-ward .slw-pill.todo{background:#777}" +
      ".sl-ward .slw-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:24px}" +
      ".sl-ward .slw-card{display:flex;flex-direction:column;border-top:4px solid var(--sl-accent);padding-top:14px;color:inherit;text-decoration:none;min-width:0}" +
      ".sl-ward a.slw-card:hover .slw-ctitle{text-decoration:underline;text-decoration-color:var(--sl-accent);text-underline-offset:4px}" +
      ".sl-ward .slw-media{aspect-ratio:16/10;border-radius:6px;overflow:hidden;margin:0 0 12px;background:var(--sl-accent);position:relative}" +
      ".sl-ward .slw-media img{width:100%;height:100%;object-fit:cover;display:block}" +
      ".sl-ward .slw-ph{position:absolute;inset:0;display:flex;align-items:flex-end;padding:14px;color:#fff;font-weight:700;font-size:1.1em;background:linear-gradient(135deg,var(--sl-accent),color-mix(in srgb,var(--sl-accent) 70%,#000))}" +
      ".sl-ward .slw-meta{font-size:.75em;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:0 0 6px}" +
      ".sl-ward .slw-ctitle{font-size:1.15em;line-height:1.25;font-weight:600;margin:0 0 6px}" +
      ".sl-ward .slw-ctext{margin:0 0 10px;font-size:.95em}" +
      ".sl-ward .slw-more{margin-top:auto;font-weight:600;color:var(--sl-accent);font-size:.95em}" +
      ".sl-ward .slw-more a{color:inherit}" +
      ".sl-ward .slw-link{display:inline-block;margin-top:1.2em;font-weight:600;color:var(--sl-accent)}" +
      ".sl-ward .slw-imprint{margin-top:2em;font-size:.85em;opacity:.75}";
    document.head.appendChild(css);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    return e;
  }
  function link(href, text, cls) {
    var a = el("a", cls, text);
    a.href = href;
    return a;
  }
  function resolve(src) {
    if (!src) return "";
    return /^(https?:)?\/\//.test(src) || src.charAt(0) === "/" ? src : base + src;
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\band\b/g, "&").replace(/[^a-z&]/g, "");
  }
  function monthYear(s) {
    var d = new Date(s && s.length === 7 ? s + "-01" : s);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  function fullDate(s) {
    var d = new Date(s);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function telHref(p) { return "tel:" + String(p).replace(/[^\d+]/g, ""); }
  function prettyPhone(p) {
    var d = String(p).replace(/[^\d+]/g, "").replace(/^\+44/, "0");
    if (/^07\d{9}$/.test(d)) return d.slice(0, 5) + " " + d.slice(5);
    if (/^01792\d{6}$/.test(d)) return "01792 " + d.slice(5);
    return p;
  }
  function getJson(name) {
    return fetch(base + name + "?t=" + Math.floor(Date.now() / 300000), { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // ---- Parts ----
  function councillorsPart(ward) {
    var list = ward.councillors || [];
    if (!list.length) return null;
    var part = el("section", "slw-part");
    part.appendChild(el("h2", "slw-h", "Your " + ward.name + " Labour " + (list.length > 1 ? "councillors" : "councillor")));
    var grid = el("div", "slw-grid");
    list.forEach(function (c) {
      var card = el("div", "slw-person");
      if (c.photo) {
        var img = el("img", "slw-photo");
        img.src = resolve(c.photo);
        img.alt = c.photoAlt || ("Councillor " + c.name);
        img.loading = "lazy";
        img.width = 150; img.height = 150;
        card.appendChild(img);
      } else {
        var ph = el("div", "slw-noimg", (c.name || "?").charAt(0));
        ph.setAttribute("aria-hidden", "true");
        card.appendChild(ph);
      }
      card.appendChild(el("h3", "slw-name", c.name));
      if (c.role) card.appendChild(el("p", "slw-role", c.role));
      if (c.phone) {
        var p = el("p", "slw-contact");
        p.appendChild(document.createTextNode("Phone: "));
        p.appendChild(link(telHref(c.phone), prettyPhone(c.phone)));
        card.appendChild(p);
      }
      if (c.email) {
        var m = el("p", "slw-contact");
        m.appendChild(document.createTextNode("Email: "));
        m.appendChild(link("mailto:" + c.email, c.email));
        card.appendChild(m);
      }
      if (c.bio && c.bio.length) {
        var det = el("details");
        det.appendChild(el("summary", null, "About " + String(c.name).split(" ")[0]));
        c.bio.forEach(function (t) { det.appendChild(el("p", null, t)); });
        card.appendChild(det);
      }
      grid.appendChild(card);
    });
    part.appendChild(grid);
    return part;
  }

  function pledgesPart(ward) {
    var list = ward.pledges || [];
    if (!list.length) return null;
    var part = el("section", "slw-part");
    part.appendChild(el("h2", "slw-h", ward.pledgeHeading || "Our pledges"));
    var counted = list.filter(function (p) { return STATUS[p.status]; });
    if (counted.length) {
      part.appendChild(el("p", "slw-sub", "What we promised at the last council election, and what has happened since."));
      var done = list.filter(function (p) { return p.status === "delivered"; }).length;
      var doing = list.filter(function (p) { return p.status === "in-progress"; }).length;
      var ongoing = list.filter(function (p) { return p.status === "ongoing"; }).length;
      var prog = el("div", "slw-progress");
      var bar = el("div", "slw-bar");
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", done + " of " + list.length + " pledges delivered");
      [[done, "#1a7f4b"], [doing, "#c27c00"], [ongoing, "#2b6cb0"]].forEach(function (s) {
        if (!s[0]) return;
        var seg = el("span");
        seg.style.width = (100 * s[0] / list.length) + "%";
        seg.style.background = s[1];
        bar.appendChild(seg);
      });
      prog.appendChild(el("strong", null, done + " of " + list.length + " delivered"));
      prog.appendChild(bar);
      part.appendChild(prog);
    }
    var ul = el("ul", "slw-pledges");
    list.forEach(function (p) {
      var st = STATUS[p.status];
      var li = el("li", "slw-pledge" + (st ? " " + st.cls : ""));
      var t = el("p", "slw-ptitle", p.title);
      if (st) t.appendChild(el("span", "slw-pill " + st.cls, st.label));
      li.appendChild(t);
      if (p.detail) li.appendChild(el("p", "slw-pdetail", p.detail));
      if (p.evidence || p.evidenceUrl) {
        var ev = el("p", "slw-evidence", p.evidence ? p.evidence + " " : "");
        if (p.evidenceUrl) ev.appendChild(link(p.evidenceUrl, "Find out more"));
        li.appendChild(ev);
      }
      ul.appendChild(li);
    });
    part.appendChild(ul);
    return part;
  }

  function projectsPart(ward, delivery, opts) {
    var list = ((delivery && delivery.projects) || []).filter(function (p) { return norm(p.ward) === norm(ward.name); });
    if (!list.length) return null;
    var part = el("section", "slw-part");
    part.appendChild(el("h2", "slw-h", "Delivered in " + ward.name));
    var cards = el("div", "slw-cards");
    list.slice(0, opts.projectsLimit).forEach(function (p) {
      var card = el("div", "slw-card");
      card.appendChild(el("p", "slw-meta", [p.theme, monthYear(p.date), p.status === "Completed" ? "" : p.status].filter(Boolean).join(" · ")));
      card.appendChild(el("h3", "slw-ctitle", p.title));
      card.appendChild(el("p", "slw-ctext", p.summary));
      if (p.source && p.source.url) {
        var more = el("p", "slw-more");
        var a = link(p.source.url, "Source: " + (p.source.name || "read more"));
        a.target = "_blank"; a.rel = "noopener";
        more.appendChild(a);
        card.appendChild(more);
      }
      cards.appendChild(card);
    });
    part.appendChild(cards);
    if (opts.mapUrl) {
      var all = link(opts.mapUrl + (opts.mapUrl.indexOf("?") < 0 ? "?" : "&") + "ward=" + encodeURIComponent(ward.name), "See everything on the map →", "slw-link");
      part.appendChild(all);
    }
    return part;
  }

  function newsPart(ward, news, opts) {
    var articles = (news && news.articles) || [];
    if (!articles.length) return null;
    var mine = articles.filter(function (a) { return (a.wards || []).some(function (w) { return norm(w) === norm(ward.name); }); });
    var heading = ward.name + " news";
    if (!mine.length) { mine = articles; heading = "Latest from Swansea Labour"; }
    var pageUrl = (news.pageUrl || opts.newsUrl || "/news").replace(/\/+$/, "");
    var part = el("section", "slw-part");
    part.appendChild(el("h2", "slw-h", heading));
    var cards = el("div", "slw-cards");
    mine.slice(0, opts.newsLimit).forEach(function (a) {
      var card = link(pageUrl + "?article=" + encodeURIComponent(a.id), "", "slw-card");
      var media = el("div", "slw-media");
      var img = (a.images || []).filter(function (i) { return i && i.src; })[0] || (a.image ? { src: a.image, alt: a.imageAlt } : null);
      if (img) {
        var i = el("img");
        i.src = resolve(img.src); i.alt = img.alt || ""; i.loading = "lazy";
        media.appendChild(i);
      } else {
        media.appendChild(el("div", "slw-ph", "Swansea Labour"));
      }
      card.appendChild(media);
      card.appendChild(el("p", "slw-meta", fullDate(a.date)));
      card.appendChild(el("h3", "slw-ctitle", a.headline));
      card.appendChild(el("p", "slw-ctext", a.summary));
      card.appendChild(el("span", "slw-more", "Read more →"));
      cards.appendChild(card);
    });
    part.appendChild(cards);
    if (opts.showImprint && news.imprint) part.appendChild(el("p", "slw-imprint", news.imprint));
    return part;
  }

  // ---- Render ----
  Promise.all([getJson("wards.json"), getJson("delivery.json"), getJson("articles.json")]).then(function (res) {
    var wards = res[0], delivery = res[1], news = res[2];
    roots.forEach(function (root) {
      root.style.setProperty("--sl-accent", root.getAttribute("data-accent") || "#E4003B");
      var name = root.getAttribute("data-ward") || "";
      var ward = wards && (wards.wards || []).filter(function (w) { return norm(w.name) === norm(name); })[0];
      root.textContent = "";
      if (!ward) { if (wards) root.appendChild(el("p", null, "Ward details are not available right now.")); return; }
      var opts = {
        mapUrl: root.getAttribute("data-map-url") || "",
        newsUrl: root.getAttribute("data-news-url") || "",
        newsLimit: parseInt(root.getAttribute("data-news-limit") || "3", 10),
        projectsLimit: parseInt(root.getAttribute("data-projects-limit") || "6", 10),
        showImprint: root.getAttribute("data-imprint") !== "off"
      };
      var show = (root.getAttribute("data-show") || "councillors,pledges,projects,news").split(",");
      show.forEach(function (s) {
        s = s.trim();
        var part = s === "councillors" ? councillorsPart(ward)
          : s === "pledges" ? pledgesPart(ward)
          : s === "projects" ? projectsPart(ward, delivery, opts)
          : s === "news" ? newsPart(ward, news, opts) : null;
        if (part) root.appendChild(part);
      });
    });
  });
})();
