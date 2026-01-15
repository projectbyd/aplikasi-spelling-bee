const CACHE = "sb-v1";
const ASSETS = [
  "./",
  "index.html",
  "login.html",
  "guided-level.html",
  "guided-player.html",
  "student.html",
  "auth-check.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});