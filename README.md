# Daybreak Planner (PWA)

Turn a task summary into a timed daily schedule. Pick which weekdays each task shows on, keep per-date steps and notes, and get reminders when a task is about to start.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it

A service worker only runs on **https** or **localhost**, so do not open `index.html` by double-clicking it. Serve the folder instead:

```bash
cd daybreak-planner-pwa
python3 -m http.server 8080
# then open http://localhost:8080
```

(Any static server works: `npx serve`, VS Code Live Server, and so on.)

## Put it online (free)

Upload the whole folder to any static host. All of these give you https automatically:

- Netlify: drag the folder onto app.netlify.com/drop
- GitHub Pages: push the folder to a repo, then Settings → Pages
- Cloudflare Pages or Vercel: import the repo or upload the folder

The app uses relative paths, so it also works from a sub-folder (for example `https://you.github.io/daybreak/`).

## Install it

- **Android / Chrome / Edge:** open the hosted link, then use the Install button on the Alerts tab (or the browser menu → Install app).
- **iPhone / iPad (Safari):** Share → Add to Home Screen.
- **Desktop Chrome / Edge:** the install icon in the address bar.

Once installed it opens like a normal app and works offline.

## Several apps on one GitHub account (important)

All GitHub Pages repos share one origin (`yourname.github.io`). Browsers decide whether two PWAs are "the same app" from the manifest **`id`**, not from the folder. If the id is `./` or missing, it can resolve to the site root, and then installing or opening one app opens or replaces another.

This project avoids that:

- `manifest.webmanifest` has a unique `"id": "daybreak-planner-7f3a9c"`.
- `scope` and `start_url` are relative (`./`), so they follow whatever repo folder the app is hosted in.
- Service worker caches are named after the app's own scope, so apps on the same domain never clear each other's files.

Rules for every PWA you host on the same domain:

1. Give each one a different `id` in its manifest (for example `"id": "my-other-app-1b2c3d"`).
2. Keep `scope` and `start_url` relative, inside that app's own folder.
3. Use a different `localStorage` key and cache name in each app.

**If you already installed the earlier version:** uninstall it first (Chrome: `chrome://apps` → right-click → Remove, or the app's menu → Uninstall), then open the site and install again. The identity changed, so the browser treats this as a new app.

## Now widget

- **Now tab:** the current task, time left, and what is next. Tick it off from there.
- **Mini window (desktop Chrome / Edge):** a small always-on-top window with the same card. It stays visible over other apps. In browsers without that feature it opens a small popup window instead.
- **Launch shortcut:** installed app → right-click the icon (or long-press on Android) → **Now** opens straight to the card. Pin it as a small window next to your work.
- **Phone:** web apps cannot place a widget on the home screen. Turn on **Alerts → Current task in notifications** and a silent notification shows what you should be doing now. It updates while the app is running.

## Add panel on desktop

The `<` / `>` button at the top left hides or shows the add panel. The choice is remembered.

## Reminders: what to expect

- Reminders fire while the app is open, including an installed app that is running in the background. Open the **Alerts** tab to set how early to be warned, turn the sound on or off, and allow system notifications.
- Browsers do not let any web app wake itself up at a set time after it has been fully closed. Keep the app open on your laptop, or set a phone alarm for the tasks that matter most.
- System notifications need permission, and on iPhone they only work for the app installed to the Home Screen (iOS 16.4 or later).

## Files

```
index.html              page shell, manifest and icon links
css/app.css             all styles (light and dark themes follow the device)
js/app.js               task parser, views, reminders, install prompt
sw.js                   offline cache + notification click handling
manifest.webmanifest    name, colours, icons, shortcuts
icons/                  192, 512, maskable 512, Apple touch icon, favicon
```

## Changing things

- After editing any cached file (`index.html`, `css/`, `js/`, `icons/`, the manifest), change the `:v2` suffix of `VERSION` at the top of `sw.js` (for example `:v3`). Installed copies then pick up the update on their next visit.
- Do not change the manifest `id` once people have installed the app. A new id is a new app.
- Your plan, ticks and settings are stored in the browser's `localStorage` under the key `daybreak.planner.v1`. They stay on that device and browser.
- Changing the example text: edit the `SAMPLE` constant in `js/app.js`.
