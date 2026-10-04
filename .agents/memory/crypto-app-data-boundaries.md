---
name: Crypto app data boundaries
description: Why publisher RSS is served through the API and why alerts currently only evaluate while the app is active.
---

Fetch CoinDesk and Cointelegraph RSS feeds from the shared server API, not from the Expo client. The publishers do not allow browser-origin requests, so direct web-preview requests fail CORS.

Price alerts use local notifications and are evaluated while the app is active. They do not provide background or push delivery.

**Why:** the RSS sources are usable from the server but reject browser CORS, while background alert delivery needs infrastructure beyond the first mobile build.

**How to apply:** keep the generated API route as the client boundary for RSS. If adding background alerts, design and verify server-side or platform push delivery rather than implying the foreground monitor runs while the app is closed.