# Daybreak

**Daybreak is an app as well as a website.** Type or paste your tasks in plain words, and Daybreak turns them into a timed daily schedule with reminders.

- 🌐 **Website:** the original web app (PWA) in this repository, which runs in any browser and can be installed to your home screen.
- 📱 **Android app:** a native app (Kotlin + Jetpack Compose) published as a file in this repository's **Releases**.

Both versions are built for mobile first and keep your plan on your own device.

---

## Preview

```
┌──────────────────────────────┐
│ ☀ Daybreak        Guide      │
│                              │
│  ┌────┐  ┌────┐  ┌────────┐  │
│  │Add │  │Day │  │Function│  │
│  └────┘  └────┘  └────────┘  │
│                              │
│  Thu 22 Oct                  │
│  ──────────────────────────  │
│  ◉ Wake up        9:00 AM    │
│  ○ Maths, physics 4:00 PM    │
│       ▸ Details              │
│  ○ Sleep          8:00 PM    │
│                              │
│  ▓▓▓▓▓▓░░░░░░  1 of 3 done   │
│                              │
│  ━━━━━  (drag up for note)   │
└──────────────────────────────┘
```

*A simple sketch of the Day screen. Replace it with a real screenshot by adding `docs/screenshot.png` to the repository and using `![Daybreak](docs/screenshot.png)`.*

---

## What it does

- **Write tasks naturally.** Examples: `wake up at 6`, `maths, physics 4 pm +2 hr`, `4:20 to 6:10 revision`.
- **Add one task at a time.** On the Add tab, tap the round **+** button, give the task a title, pick a time (an end time is optional), and tap **Add task**.
- **Day view** with a progress bar and an animated tick when you complete a task, plus a soft sound and haptic feedback.
- **Reminders in the background**, even when the app is closed, plus an ongoing "current task" notification with a countdown.
- **Notes for every day.** Drag up the thin line at the bottom of the screen.
- **Lock-screen and home-screen widgets** (Android): Now, Today, Clock, Ring, Countdown and Week, each with a live preview in the **Function** tab.
- **Themes.** Light, Dark or System, plus five accent colours, applied to the app and the widgets.
- **First-time guide** that explains every tab and how to write tasks. Reopen it any time from **Guide**.

### Tabs

| Tab | Purpose |
|---|---|
| **Add** | Paste a schedule or add a single task with **+** |
| **Day** | See, tick and edit the tasks for each day |
| **Function** | Reminders, widgets, feel (haptics and sound), reliability tips and appearance |

---

## Use the website

Open the site for this repository (GitHub Pages, if enabled under **Settings → Pages**). In your phone browser you can choose **Add to Home screen** / **Install app** to use it like an app.

---

## Download the Android app from Releases

1. **Open the repository** on your Android phone: <https://github.com/sakshamy744-y/Daybreak>
2. On the right side of the page (or under the repository name on mobile), tap **Releases**, then the **latest** release at the top.
   Direct link: <https://github.com/sakshamy744-y/Daybreak/releases/latest>
3. Scroll to **Assets** and tap the file ending in **`.apk`** to download it.
4. If Android warns that the file type can harm your device, tap **Download anyway**.
5. When the download finishes, tap **Open** (or open it from your **Downloads** folder).
6. If asked, tap **Settings** and turn on **Allow from this source** for your browser or file manager, then go back and tap **Install**.
7. Tap **Open**. The first-time guide starts automatically.
8. Allow **Notifications** when asked.

### For reliable reminders

Some phones stop background apps to save battery. If reminders arrive late:

1. Go to **Settings → Apps → Daybreak → Battery** and choose **Unrestricted** (or turn off battery optimisation).
2. Allow **Alarms & reminders** for Daybreak if your phone offers that setting.
3. Open the **Function** tab and use **Send test notification** to check it works.

### Updating

Download the newer `.apk` from the latest release and install it over the old one. Your plan and notes are kept.

---

## Build it yourself

1. Download the project and open the `DaybreakPlanner` folder in **Android Studio**.
2. Let Gradle sync, connect a phone or start an emulator, then press **Run**.

Requirements: Android 8.0 (API 26) or newer.

---

## Privacy

Your plan, ticks and notes are saved **only on your device**. Daybreak has no account and does not send your data anywhere.

## Credits

Fonts: Bricolage Grotesque, DM Sans and IBM Plex Mono (SIL Open Font License).
