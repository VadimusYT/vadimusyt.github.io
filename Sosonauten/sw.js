const CACHE_NAME = 'sosonauten-website-v1';
const urlsToCache = [
    '/',
    '/styles.css',
    '/script-sosonauten.js',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap',
    '/Sosonauten_Website.png'
    // Removed the iframe src from cache list as it's no longer part of the page
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});



