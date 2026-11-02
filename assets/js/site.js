/* Weibitech — minimal vanilla JS: menu, language memory, video lists from data/videos.json, click-to-load YouTube. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var lang = doc.lang === "en" ? "en" : "fr";
  var root = document.body.getAttribute("data-root") || "../";

  var T = {
    fr: {
      play: "Lire la vidéo : ", loads: " (charge le lecteur YouTube)",
      yt: "Voir sur YouTube", ytAria: "Voir sur YouTube : ", channel: "Voir sur la chaîne",
      soon: "Bientôt", onChannel: "Sur la chaîne YouTube", ep: "Ép. ", other: "Vidéo en anglais",
      note: "Rien n'est chargé depuis YouTube avant votre clic.",
      err: "La liste n'a pas pu être chargée. Retrouvez toutes les vidéos sur la chaîne YouTube.",
      none: "Les premiers épisodes arrivent bientôt : ils s'afficheront ici le jour de leur sortie.",
      menu: "Menu", close: "Fermer"
    },
    en: {
      play: "Play video: ", loads: " (loads the YouTube player)",
      yt: "Watch on YouTube", ytAria: "Watch on YouTube: ", channel: "See on the channel",
      soon: "Coming soon", onChannel: "On the YouTube channel", ep: "Ep. ", other: "Video in French",
      note: "Nothing loads from YouTube until you click.",
      err: "The list could not be loaded. Find every video on the YouTube channel.",
      none: "The first episodes are coming soon: they will appear here on release day.",
      menu: "Menu", close: "Close"
    }
  }[lang];

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector(".lbl").textContent = open ? T.close : T.menu;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { btn.click(); btn.focus(); }
    });
  }

  /* Remember an explicit language choice (used only by the root page redirect). */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-setlang]");
    if (a) { try { localStorage.setItem("wb-lang", a.getAttribute("data-setlang")); } catch (err) {} }
  });

  /* Click-to-load YouTube (privacy-enhanced domain, nothing loaded before the click). */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button.vplay");
    if (!b) return;
    var id = b.getAttribute("data-yt");
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || "")) return;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&hl=" + lang;
    f.title = b.getAttribute("data-title") || "YouTube";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.allowFullscreen = true;
    var media = b.parentNode;
    media.innerHTML = "";
    media.appendChild(f);
    f.focus();
  });

  /* Video lists */
  var lists = document.querySelectorAll("[data-videos]");
  if (!lists.length) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* An episode shows only once it is out: a YouTube ID for that language and, if set, its publishAt time passed. */
  function released(v, l) {
    var id = (v.youtube || {})[l] || "";
    if (!id) return "";
    var at = v.publishAt ? (typeof v.publishAt === "string" ? v.publishAt : v.publishAt[l]) : "";
    if (at && Date.now() < Date.parse(at)) return "";
    return id;
  }
  function ytUrl(id) { return "https://www.youtube.com/watch?v=" + id; }

  function card(v, data, layout) {
    var s = data.series[v.series] || { name: { fr: "", en: "" }, playlist: { fr: "", en: "" } };
    var otherLang = lang === "fr" ? "en" : "fr";
    var id = released(v, lang);
    var altId = !id ? released(v, otherLang) : "";
    var playId = id || altId;
    var title = v.title[lang] || v.title[otherLang];
    var kick = esc(s.name[lang]);
    if (v.episode) kick += ' <span class="badge">' + T.ep + v.episode + "</span>";
    else if (v.label) kick += ' <span class="badge">' + esc(v.label[lang]) + "</span>";
    var listUrl = (s.playlist && s.playlist[lang]) || (data.channel + "/videos");
    var thumb = v.thumb ? v.thumb[lang] || v.thumb[otherLang] : "";
    var dur = v.duration ? v.duration[lang] : "";

    var media = "";
    if (thumb) {
      var img = '<img src="' + esc(root + thumb) + '" alt="" width="640" height="360" loading="lazy" decoding="async">';
      if (playId) {
        media = '<div class="vmedia"><button type="button" class="vplay" data-yt="' + esc(playId) + '" data-title="' + esc(title) + '" aria-label="' + esc(T.play + title + T.loads) + '">' + img +
          '<span class="pbtn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' +
          (altId ? '<span class="vlocked">' + T.other + "</span>" : "") +
          (dur ? '<span class="vtime">' + esc(dur) + "</span>" : "") + "</button></div>";
      } else {
        media = '<div class="vmedia">' + img + '<span class="vlocked">' + T.onChannel + "</span>" + (dur ? '<span class="vtime">' + esc(dur) + "</span>" : "") + "</div>";
      }
    }
    var links = playId
      ? '<a href="' + ytUrl(playId) + '" rel="noopener" aria-label="' + esc(T.ytAria + title) + '">' + T.yt + " ↗</a>"
      : (v.series === "dep"
        ? '<span class="badge badge--soft">' + T.soon + "</span>"
        : '<a href="' + esc(listUrl) + '" rel="noopener">' + T.channel + " ↗</a>");
    var body = '<div class="vbody"><p class="kicker">' + kick + "</p><h3>" + esc(title) + "</h3><p>" + esc(v.summary[lang]) + '</p><div class="vlinks">' + links + "</div></div>";
    var tag = layout === "rows" ? "li" : "article";
    var cls = layout === "rows" ? "ep" : "vcard";
    return "<" + tag + ' class="' + cls + '">' + media + body + "</" + tag + ">";
  }

  function render(data) {
    lists.forEach(function (el) {
      var series = el.getAttribute("data-series");
      var season = el.getAttribute("data-season");
      var codes = el.getAttribute("data-codes");
      var latest = parseInt(el.getAttribute("data-latest") || "0", 10);
      var layout = el.getAttribute("data-layout") || "cards";
      var other = lang === "fr" ? "en" : "fr";
      var items = data.videos.map(function (v, i) { v._i = i; return v; })
        .filter(function (v) { return released(v, lang) || released(v, other); });
      if (series) items = items.filter(function (v) { return v.series === series; });
      if (season) items = items.filter(function (v) { return String(v.season) === season; });
      if (codes) { var c = codes.split(","); items = items.filter(function (v) { return c.indexOf(v.code) > -1; }); }
      if (latest) {
        items = items.filter(function (v) { return released(v, lang); });
        items.sort(function (a, b) {
          var d = String(b.published || "").localeCompare(String(a.published || ""));
          return d !== 0 ? d : b._i - a._i;
        });
        items = items.slice(0, latest);
      }
      el.innerHTML = items.length ? items.map(function (v) { return card(v, data, layout); }).join("")
        : (layout === "rows" ? '<li class="note">' : '<p class="note">') + T.none + (layout === "rows" ? "</li>" : "</p>");
      el.setAttribute("aria-busy", "false");
    });
  }

  function fail() {
    lists.forEach(function (el) {
      el.innerHTML = '<p class="note">' + T.err + ' <a href="https://www.youtube.com/@Weibitech" rel="noopener">youtube.com/@Weibitech</a></p>';
    });
  }

  fetch(root + "data/videos.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(fail);
})();
