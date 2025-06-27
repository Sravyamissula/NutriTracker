const CACHE_NAME = "nutritrack-ai-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/index.html"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Avoid unsupported or irrelevant schemes like chrome-extension://
  if (
    event.request.method !== "GET" ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("chrome://") ||
    url.startsWith("devtools://")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Cache only valid responses
          if (
            networkResponse &&
            (networkResponse.status === 200 ||
              networkResponse.type === "opaque")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, responseToCache);
              } catch (err) {
                console.warn("Failed to cache request:", url, err);
              }
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error(
            "Fetch failed; returning offline fallback if available.",
            error
          );
          // Return cached version if available, otherwise nothing (or could add a fallback page)
          return cachedResponse || Response.error();
        });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
