/* Cube Any Pano — project page interactions */
(function () {
  "use strict";

  /* ---------- Nav shadow on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Hero: animated panorama backdrop ---------- */
  (function panoBackdrop() {
    var canvas = document.getElementById("pano-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.src = "assets/images/pano-gallery.jpg"; // 2:1 equirect
    var offset = 0, w = 0, h = 0, iw = 0, ih = 0;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    img.onload = function () {
      iw = img.width; ih = img.height;
      requestAnimationFrame(draw);
    };

    function draw() {
      if (!iw) { requestAnimationFrame(draw); return; }
      offset = (offset + 0.25) % iw;
      // Tile the panorama left→right, chaining slices so a source rect
      // crossing the image's right edge never leaves a gap.
      var scale = h / ih;
      ctx.clearRect(0, 0, w, h);
      var dx = 0, sx = offset;
      while (dx < w) {
        var avail = iw - sx;
        var sw = Math.min(avail, (w - dx) / scale);
        if (sw <= 0) { sx = 0; continue; }
        ctx.drawImage(img, sx, 0, sw, ih, dx, 0, sw * scale, h);
        dx += sw * scale;
        sx = 0;
      }
      requestAnimationFrame(draw);
    }
  })();

  /* ---------- Scene gallery ---------- */
  var SCENES = [
    { id: "arched-gallery",   name: "Arched Gallery",   type: "indoor"  },
    { id: "modern-apartment", name: "Modern Apartment", type: "indoor"  },
    { id: "staircase-hall",   name: "Staircase Hall",   type: "indoor"  },
    { id: "studio-room",      name: "Studio Room",      type: "indoor"  },
    { id: "coastal-cliff",    name: "Coastal Cliff",    type: "outdoor" },
    { id: "lakeside-house",   name: "Lakeside House",   type: "outdoor" },
    { id: "night-field",      name: "Night Field",      type: "outdoor" },
    { id: "riverside-town",   name: "Riverside Town",   type: "outdoor" }
  ];

  var VTYPE_LABEL = {
    orbit:   "A full 360° orbit around the reconstructed scene.",
    regions: "Functional-zone mask overlaid on the orbit: near (red), transition (yellow) and far/linear (green) regions.",
    tour:    "Free multi-range roaming through the scene — near, middle and far views."
  };

  var grid = document.getElementById("scene-grid");
  var viewer = document.getElementById("scene-viewer");
  var vName = document.getElementById("viewer-name");
  var vType = document.getElementById("viewer-type");
  var vCap = document.getElementById("viewer-cap");
  var video = document.getElementById("viewer-video");
  var source = video.querySelector("source");
  var currentScene = null;
  var currentVType = "orbit";

  // build tiles
  SCENES.forEach(function (s) {
    var btn = document.createElement("button");
    btn.className = "scene-tile";
    btn.type = "button";
    btn.dataset.scene = s.id;
    btn.dataset.type = s.type;
    btn.innerHTML =
      '<img src="assets/images/posters/scenes_' + s.id + '_orbit.jpg" alt="' + s.name + '" loading="lazy">' +
      '<span class="tile-label">' + s.name + '<span class="tile-dot ' + s.type + '" title="' + s.type + '"></span></span>';
    btn.addEventListener("click", function () { selectScene(s.id, true); });
    grid.appendChild(btn);
  });

  function selectScene(id, scroll) {
    currentScene = id;
    var scene = SCENES.filter(function (s) { return s.id === id; })[0];
    Array.prototype.forEach.call(grid.children, function (tile) {
      tile.classList.toggle("is-active", tile.dataset.scene === id);
    });
    vName.textContent = scene.name;
    vType.textContent = scene.type + " scene";
    setVType(currentVType, false);
    if (scroll) {
      var top = viewer.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  function setVType(vtype, userAction) {
    currentVType = vtype;
    Array.prototype.forEach.call(document.querySelectorAll(".vtab"), function (t) {
      t.classList.toggle("is-active", t.dataset.vtype === vtype);
    });
    if (!currentScene) return;
    var poster = "assets/images/posters/scenes_" + currentScene + "_" + vtype + ".jpg";
    var src = "assets/videos/scenes/" + currentScene + "/" + vtype + ".mp4";
    video.poster = poster;
    source.src = src;
    video.load();
    if (userAction) video.play().catch(function () {});
    vCap.textContent = VTYPE_LABEL[vtype];
  }

  Array.prototype.forEach.call(document.querySelectorAll(".vtab"), function (t) {
    t.addEventListener("click", function () { setVType(t.dataset.vtype, true); });
  });

  // filters
  document.getElementById("scene-filters").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    Array.prototype.forEach.call(this.querySelectorAll(".chip"), function (c) {
      c.classList.toggle("is-active", c === btn);
    });
    var f = btn.dataset.filter;
    Array.prototype.forEach.call(grid.children, function (tile) {
      tile.classList.toggle("is-hidden", f !== "all" && tile.dataset.type !== f);
    });
  });

  // default scene
  selectScene("arched-gallery", false);

  /* ---------- Only play hero video when near viewport ---------- */
  var heroVideo = document.getElementById("hero-video");
  if ("IntersectionObserver" in window && heroVideo) {
    heroVideo.preload = "none";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { heroVideo.preload = "metadata"; io.disconnect(); }
      });
    }, { rootMargin: "400px" });
    io.observe(heroVideo);
  }
})();
