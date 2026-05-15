if (!self.define) {
  let e,
    a = {};
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    a[s] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = s), (e.onload = a), document.head.appendChild(e));
        } else ((e = s), importScripts(s), a());
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn't register its module`);
        return e;
      })
  );
  self.define = (c, t) => {
    const n =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[n]) return;
    let i = {};
    const r = (e) => s(e, n),
      d = { module: { uri: n }, exports: i, require: r };
    a[n] = Promise.all(c.map((e) => d[e] || r(e))).then((e) => (t(...e), i));
  };
}
define(["./workbox-4754cb34"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "e4880ff4064bb8a487f5ae31c65e161f",
        },
        {
          url: "/_next/static/chunks/1069-ac8928aaad507458.js",
          revision: "ac8928aaad507458",
        },
        {
          url: "/_next/static/chunks/1255-5fe68596fe147850.js",
          revision: "5fe68596fe147850",
        },
        {
          url: "/_next/static/chunks/1646.9123ee47220ed70b.js",
          revision: "9123ee47220ed70b",
        },
        {
          url: "/_next/static/chunks/1943-7b9d7c5935966632.js",
          revision: "7b9d7c5935966632",
        },
        {
          url: "/_next/static/chunks/2454-d92c0bc82bf5ff39.js",
          revision: "d92c0bc82bf5ff39",
        },
        {
          url: "/_next/static/chunks/2619-3c9e02e22d10480a.js",
          revision: "3c9e02e22d10480a",
        },
        {
          url: "/_next/static/chunks/4256-d1f6d8ab005334ff.js",
          revision: "d1f6d8ab005334ff",
        },
        {
          url: "/_next/static/chunks/4952-6c15ffef39a29417.js",
          revision: "6c15ffef39a29417",
        },
        {
          url: "/_next/static/chunks/4bd1b696-f785427dddbba9fb.js",
          revision: "f785427dddbba9fb",
        },
        {
          url: "/_next/static/chunks/5069-09a8e965901a4812.js",
          revision: "09a8e965901a4812",
        },
        {
          url: "/_next/static/chunks/5125-ebf3781a5fcc2919.js",
          revision: "ebf3781a5fcc2919",
        },
        {
          url: "/_next/static/chunks/5139.c5e46d26064a85db.js",
          revision: "c5e46d26064a85db",
        },
        {
          url: "/_next/static/chunks/5401-dd5c5fdb73118b63.js",
          revision: "dd5c5fdb73118b63",
        },
        {
          url: "/_next/static/chunks/5526-ae5d453acf78b8e7.js",
          revision: "ae5d453acf78b8e7",
        },
        {
          url: "/_next/static/chunks/5702-2f0f592c4eb69f06.js",
          revision: "2f0f592c4eb69f06",
        },
        {
          url: "/_next/static/chunks/5854-7aa89401473535ac.js",
          revision: "7aa89401473535ac",
        },
        {
          url: "/_next/static/chunks/6342-473d0c94d09d5a48.js",
          revision: "473d0c94d09d5a48",
        },
        {
          url: "/_next/static/chunks/8055-ccc02190bc25e1d6.js",
          revision: "ccc02190bc25e1d6",
        },
        {
          url: "/_next/static/chunks/app/(auth)/layout-0c10a1b79d29b695.js",
          revision: "0c10a1b79d29b695",
        },
        {
          url: "/_next/static/chunks/app/(auth)/login/page-98e4747365139c28.js",
          revision: "98e4747365139c28",
        },
        {
          url: "/_next/static/chunks/app/(auth)/register/page-087c23601065b6ba.js",
          revision: "087c23601065b6ba",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/dashboard/page-848736e87696724d.js",
          revision: "848736e87696724d",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/layout-e97b1d1c31893aa0.js",
          revision: "e97b1d1c31893aa0",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/announcements/page-da68b591db05f09f.js",
          revision: "da68b591db05f09f",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/audit/page-9b33a708216af415.js",
          revision: "9b33a708216af415",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/chat/page-4925e403edcb7d8f.js",
          revision: "4925e403edcb7d8f",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/events/%5BeventId%5D/page-42b59ca2cebab1b8.js",
          revision: "42b59ca2cebab1b8",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/events/%5BeventId%5D/photos/page-9ec4e4e53e406a07.js",
          revision: "9ec4e4e53e406a07",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/events/create/page-1d2799e7cd7e1ec4.js",
          revision: "1d2799e7cd7e1ec4",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/events/page-5ccdc8cc3ded6291.js",
          revision: "5ccdc8cc3ded6291",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/fines/page-9de34858962e38f3.js",
          revision: "9de34858962e38f3",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/join-requests/page-d23675003ddcf454.js",
          revision: "d23675003ddcf454",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/layout-db77a8f30e1a6b1f.js",
          revision: "db77a8f30e1a6b1f",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/ledger/page-0848f0679861d268.js",
          revision: "0848f0679861d268",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/lottery/page-f4470b1cc3824fd5.js",
          revision: "f4470b1cc3824fd5",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/members/%5BmemberId%5D/page-cdb7e6caa130de71.js",
          revision: "cdb7e6caa130de71",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/members/page-e2037abf5717a5e0.js",
          revision: "e2037abf5717a5e0",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/payments/initiate/page-6f25698dc4b155fe.js",
          revision: "6f25698dc4b155fe",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/payments/page-b51c3b1f61ef40a1.js",
          revision: "b51c3b1f61ef40a1",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/polls/create/page-5ea28af1b0cf464a.js",
          revision: "5ea28af1b0cf464a",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/%5Bid%5D/polls/page-73c17211e372167e.js",
          revision: "73c17211e372167e",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/create/page-489322b6b42236ec.js",
          revision: "489322b6b42236ec",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/discover/page-5d34a99fcc76ad85.js",
          revision: "5d34a99fcc76ad85",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/mahbers/page-087dad4f8c492e6f.js",
          revision: "087dad4f8c492e6f",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-b77139156c982f04.js",
          revision: "b77139156c982f04",
        },
        {
          url: "/_next/static/chunks/app/layout-6ac098ffbb486061.js",
          revision: "6ac098ffbb486061",
        },
        {
          url: "/_next/static/chunks/app/page-0c10a1b79d29b695.js",
          revision: "0c10a1b79d29b695",
        },
        {
          url: "/_next/static/chunks/app/payment/callback/page-555640ab8a5bfe18.js",
          revision: "555640ab8a5bfe18",
        },
        {
          url: "/_next/static/chunks/framework-f31701c9d93f12a4.js",
          revision: "f31701c9d93f12a4",
        },
        {
          url: "/_next/static/chunks/main-88e9ff42bff7cfa5.js",
          revision: "88e9ff42bff7cfa5",
        },
        {
          url: "/_next/static/chunks/main-app-ab659b6ae34a9225.js",
          revision: "ab659b6ae34a9225",
        },
        {
          url: "/_next/static/chunks/pages/_app-131c90850aef965b.js",
          revision: "131c90850aef965b",
        },
        {
          url: "/_next/static/chunks/pages/_error-e4ba546eb376bdf4.js",
          revision: "e4ba546eb376bdf4",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-0f325d668080d284.js",
          revision: "0f325d668080d284",
        },
        {
          url: "/_next/static/css/66970a5a1b6562b8.css",
          revision: "66970a5a1b6562b8",
        },
        {
          url: "/_next/static/g0Zne3d3KwGzRhi4GPXbZ/_buildManifest.js",
          revision: "97db36c64d09919b4e732f5efc8a083c",
        },
        {
          url: "/_next/static/g0Zne3d3KwGzRhi4GPXbZ/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        { url: "/manifest.json", revision: "ab149923ccc127d0fc2ba0e63237edbe" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: a,
              event: s,
              state: c,
            }) =>
              a && "opaqueredirect" === a.type
                ? new Response(a.body, {
                    status: 200,
                    statusText: "OK",
                    headers: a.headers,
                  })
                : a,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const a = e.pathname;
        return !a.startsWith("/api/auth/") && !!a.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});
