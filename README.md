# Ek Diwali Sab Ke Saath

A virtual Diwali night: a Hindi Ramayana-themed landing page, a night courtyard where you light diyas and drag-and-drop crackers (rocket, skyshot with a "HAPPY DIWALI" sky greeting, fuljhari, charkhi, anaar, bomb and the Jethelal Special), achievements, Hindi/English, sound + volume, haptics on bombs, a connect menu and a quiet **Diwali Ki Kharchi** corner with a UPI QR.

## Run it

```bash
npm install        # installs "qrcode" (the only dependency)
npm start          # http://localhost:3000
```

Without `npm install` the site still runs; the Kharchi panel just shows your static QR image (`public/assets/upi-qr.jpg`) instead of generating one per amount.

## Configure

Copy `.env.example` to `.env`:

| Variable | Meaning |
|---|---|
| `PORT` | Port to listen on (default 3000) |
| `UPI_ID` | Where Kharchi money goes (`sakshamsingh1331@oksbi`) |
| `PAYEE_NAME` | Name shown in UPI apps |

Preset amounts live in `server/index.js` (`PRESETS`). Social links live in `public/js/ui.js` (`LINKS`).

## Deploy

Any Node 18+ host works (Render, Railway, a VPS). Use HTTPS so audio, clipboard and UPI deep links behave. `data/stats.json` stores the global cracker counter; if your host has an ephemeral disk the counter simply restarts at 0.

## Structure

```
server/index.js      static files + /api/config, /api/qr, /api/stats, /api/burst
public/index.html    landing page (Ayodhya castle is inline SVG so the diyas can animate)
public/play.html     the game
public/css/          base.css (shared UI), landing.css, game.css
public/js/
  game.js            canvas stage, lighting, drag and drop, main loop
  crackers.js        how each cracker looks and behaves
  fx.js              particle system + the "HAPPY DIWALI" text burst
  scene.js           the courtyard (SVG) plus diya / bulb / lantern positions
  audio.js           synthesised sounds + the Jethelal tune player
  ui.js              language/sound controls, connect menu, Kharchi panel, Shukriya, toasts
  ach.js             achievements (saved in the browser)
  i18n.js            Hindi / English text
public/assets/       jethelal-special.mp3, landing-music.mp3, upi-qr.jpg
```

## Notes

* The courtyard is original artwork inspired by a pastel apartment compound; no show footage, logos or names appear on the site.
* Make sure you have the right to publish the Jethelal tune and the landing-page music (compressed to 112 kbps so the page stays light).
* The landing music loops and fades out when you enter the game. Browsers only allow sound after a tap or key press, so it starts on the first interaction if autoplay is blocked. It follows the sound mute/volume setting.
* Payments are plain UPI: there is no gateway and nothing is tracked, so the site cannot confirm that anyone paid.

## Deploy on Vercel

Vercel serves `public/` as static files and runs `api/*.js` as serverless functions (`/api/config`, `/api/qr`). Settings:

* Framework Preset: **Other**
* Root Directory: `./`
* Build Command: leave empty
* Output Directory: `public`
* Install Command: default (`npm install`, needed for `qrcode`)
* Environment Variables: `UPI_ID`, `PAYEE_NAME`

The global "crackers burst so far" counter needs a writable server, so on Vercel it is hidden automatically. Everything else works the same.
