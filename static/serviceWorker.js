this.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('v1').then(function (cache) {
      return cache.addAll([
        "/jquery/jquery.min.js",
        "/materialize/js/materialize.min.js",
        "/materialize/css/materialize.min.css",
        "/material-fonts/material-icons.css",
        "/codemirror/lib/codemirror.js",
        "/codemirror/lib/codemirror.css",
        "/codemirror/mode/python/python.js",
        "/codemirror/theme/neo.css",
        "/codemirror/theme/material.css",
        "/index.html",
        "/console.js",
        "/",
        "/materialize/fonts/roboto/Roboto-Regular.woff2",
        "/materialize/fonts/roboto/Roboto-Bold.woff2",
        "/materialize/fonts/roboto/Roboto-Regular.woff",
        "/materialize/fonts/roboto/Roboto-Bold.woff",
        "/material-fonts/MaterialIcons-Regular.woff2",
        "/material-fonts/MaterialIcons-Regular.ttf",
        "/material-fonts/MaterialIcons-Regular.woff",
        "/material-fonts/MaterialIcons-Regular.ttf"
      ]);
    })
  )
});


this.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (result) {
      if (result)
        return result
      else
        return fetch(event.request);
    })
  );
});