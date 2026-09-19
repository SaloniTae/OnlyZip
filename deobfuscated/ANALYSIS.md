# 127HUB AI v30.0 — deobfuscation & analysis

Analysis of `127HUB-AI-V30.0.zip`, focused on **`content.js`**, which is now available as a
fully deobfuscated, renamed and annotated file: **[`content.annotated.js`](./content.annotated.js)**.

> ⚠️ **Verdict up front:** this extension harvests Lovable session cookies/JWTs, wipes your
> Lovable cookies on account switch, logs the browser into a *shared* Lovable account with a
> hard-coded password, and forwards your sessions and chat requests to a third-party server
> (`ai.127hub.com`). Do not install it, and if you already have, sign out of Lovable everywhere
> and rotate your password. Details in [Security findings](#7-security-findings).

---

## 1. What the zip is

A **Chrome Manifest V3 extension** named "127HUB AI" (version 30.0), advertised as
*"premium productivity tools for the Lovable editor"*. It targets `https://*.lovable.dev/*`,
runs a content script at `document_start`, requests the `cookies` permission plus
wildcard host permissions (`https://*/*`), and ships ~32 MB of heavily obfuscated JavaScript.

Its operator identities, from `branding.json`:

| field | value |
|---|---|
| extensionName | `127HUB AI` |
| adminTelegram | `lusuferr` |
| channelTelegram | `lusufer127` |
| serverUrl / secondaryServerUrl | `ai.127hub.com` |
| footerText / footerLink | `127HUB.COM` / `https://127hub.com/` |

Internally the product is called **`lovasiri`** (`LOVASIRI_*` messages, `__lovasiriInjected`,
`lovasiri-*` DOM ids, storage prefix `ql_`) — the branding was renamed, the code was not.

## 2. File map

| file | size | manifest role | what it is |
|---|---|---|---|
| `manifest.json` | 2.7 KB | — | MV3 manifest: 8 permissions incl. `cookies`, host perms incl. `https://*/*`, 3 content-script blocks |
| `branding.json` | 299 B | — | operator branding / server URLs |
| `content.js` | 2.4 MB | isolated world, `document_start`, all 3 URL groups | **bridge + credits/license state + autologin + UI** ← analysed here |
| `background.js` | 3.6 MB | `service_worker` | cookie harvesting, session sync, licence, OTA, GitHub ops, BYOK chat |
| `pageHook.js` | 6.1 MB | MAIN world | hooks the Lovable page (fetch/XHR/websocket) — the actual "premium unlock" |
| `payload.js` | 2.0 MB | web-accessible, injected by `content.js` | MAIN-world payload the bridge talks to |
| `powerkits-core.js` + `.css` | 11.9 MB | web-accessible | the in-page product UI ("powerkits") |
| `gitMode.js` | 3.5 MB | MAIN world | Lovable/repo "git mode" integration |
| `drag-blocker.js` | 231 KB | MAIN world, `document_start` | UI guard |
| `hwFingerprint.js` | 270 KB | isolated world | hardware fingerprinting (licence binding) |
| `ota-update.js` | 769 KB | isolated world | self-updater / remote config |
| `lovable-feature-api.js` | 94 KB | — (bundled helper) | feature API layer |
| `jszip.min.js` | 98 KB | web-accessible | stock JSZip (not obfuscated) |
| `loop.mp4`, `icons/*` | 495 KB / 1 MB | web-accessible | the animated logo shown in the switch overlay |

`build-config.js` and `castle-v2.js` are present in the archive but **0 bytes**.

## 3. Obfuscation and how it was removed

`content.js` is **2 402 448 bytes on a single line**. It is stock
[`javascript-obfuscator`](https://github.com/javascript-obfuscator/javascript-obfuscator)
(`obfuscator.io`) output. Techniques present:

* hex identifiers (`_0x17c8fb`, `_0x2d03a7`) with **aliased decoder wrappers** — dozens of
  tiny functions like `_0x185a1d() { return _0x2526(n - 0x29b, arg); }` that hide the real
  string-array index;
* a **rotated/encoded string array** addressed through `_0x2526`, mixing hex-escaped strings
  (`'\x29\x46\x25\x4d'`) with plain ones, so grepping the raw file for `lovable`, `cookie`
  or `LOVASIRI` returns nothing;
* **control-flow flattening** (switch-on-index state machines) — 6 327 rewritten statements;
* **dead-code injection** and unreachable branches — this is why 2.4 MB collapses to 54 KB;
* **self-defending / anti-debug** stubs.

Reproducing this result:

```bash
unzip 127HUB-AI-V30.0.zip content.js
bun add -d webcrack
bunx webcrack content.js -o out/          # -> out/deobfuscated.js  (1 264 lines)
```

Then, for the delivered `content.annotated.js`, every remaining `_0x…` identifier was renamed
to a descriptive name and the whole file was commented. **No behaviour was changed**, and this
was verified mechanically: the annotated file parses cleanly (`node --check`) and contains
**exactly the same 429 string literals (212 unique)** as the webcrack output — nothing lost,
nothing invented.

The obfuscation is off-the-shelf and provides **no security value**. Note the irony: the layout
above (`content.js` only handles state/UI/autologin; the *actual* premium bypass lives in
`pageHook.js`, `payload.js` and `powerkits-core.js`) means the obfuscation only hides the
marketing surface, not the mechanism.

## 4. `content.js` walkthrough

The annotated file is organised into 9 numbered sections; this is the map.

| § | name | responsibility |
|---|---|---|
| 1 | `resolveCreditQuota()` | rounds a credit balance up to the tidy tiers `[50,100,200,250,500,1000,2000,2500,5000,10000]`, else to a multiple of 500 |
| 2 | `lovasiriBridge()` | single-instance guard, injects MAIN-world `payload.js`, and translates messages page ↔ background |
| 3 | `chrome.runtime.onMessage` | handles `credits_updated`, `lovasiri_auto_logout`, `lovasiri_icon_clicked`, `lovasiri_show_server_down` |
| 4 | page→bg control | `lovasiri_check_license_now`, `lovasiriTriggerForceHeartbeat` |
| 5 | **request proxy** | `lovasiriProxySend` → `{action:"backendProxySend"}` with token, projectId, castleToken, sessionId |
| 6 | heartbeat | `{action:"heartbeat"}` every 30 s |
| 7 | app commands | `APP_TRIGGER_SWITCH`, `APP_DEDUCT_CREDITS`, `APP_GET_CREDITS` |
| 8 | `initAutoBalanceSync()` | re-syncs credits on focus / visibility / every 20 s |
| 9 | `initAutoLoginAutomation()` | the 1-click autologin + account-switch state machine and its UI |

### 4.1 The bridge (§2)

Content scripts live in an isolated world, so the extension appends
`<script src=chrome.runtime.getURL("payload.js")>` to the page to get its code into the real
page context, and publishes the packaged `loop.mp4` URL via
`documentElement.dataset.lovasiriAnimIconUrl`. `window.postMessage` is the only channel; the
envelope is `{source:"LOVASIRI_EXTENSION_BRIDGE"|"LOVASIRI_PAGE_PAYLOAD", id, ...}` and the two
sides do request/response correlation by `id`.

Through that channel the page is allowed to drive **`chrome.storage.local.get/set/remove`** and
to send **arbitrary `chrome.runtime.sendMessage` payloads**, with a 50 s timeout. That means any
script running in the Lovable page — including one injected by a third party — can reach the
extension's privileged APIs by simply posting a message.

### 4.2 Credit / licence state (§2.6, §2.7, §3.1, §7.3, §8)

`chrome.storage.local` is the source of truth; `content.js` mirrors it into the page as
`APP_SYNC_CREDITS` / `APP_SYNC_SWITCH_LIMIT` / `APP_GET_CREDITS_RESULT`. A licence counts as
valid when `ql_license_key.trim().length >= 8` **and** `ql_license_valid !== false` **and**
`ql_license_status !== "revoked"` — client-side checks that a user could satisfy by hand.

Two quirks worth noticing:

* `ql_credits === 250` is treated as a **sentinel meaning "0"** (two places). Reading the raw
  storage value and the displayed value can therefore disagree.
* `resolveCreditQuota` lets a *local* `ql_max_credits` override the rounded tier, so the progress
  bar's denominator is attacker/user-controlled.

### 4.3 Account switching (§7.1, §9)

`APP_TRIGGER_SWITCH` is gated on a daily switch limit (default 2) and a 10-credit balance, then
writes a `ql_pending_autologin` record and, if the background worker is unreachable, performs
the same write itself after a 12 s timeout (three near-identical copies of that write, with
`pendingDeduction` differing).

`initAutoLoginAutomation()` (§9) is the interesting part. It contains:

```js
var SHARED_ACCOUNT_EMAIL    = "127hub@lusufer.us.cc";
var SHARED_ACCOUNT_PASSWORD = "Quack1709#";
```

— a **plaintext shared Lovable account** baked into the content script (the same pair is the
"emergency fallback account" in `background.js`). Every customer of the extension is logged into
this one account.

The engine then drives the real login form:

* `setInputValue()` writes a value five different ways (focus+select, `execCommand`,
  a MAIN-world helper message `127HUB_MAIN_FILL_INPUT`, the native `HTMLInputElement.prototype`
  `value` setter, plain assignment) and then dispatches `beforeinput`, `input`, `change`,
  `blur`, `focus` — enough to satisfy React controlled inputs.
* `isOAuthProviderButton()` exists to **avoid** clicking "Continue with Google/GitHub/Apple".
* `runLoginSession()` polls every 350 ms for up to 120 ticks (~42 s): click
  `auth-switch-to-login-link` → click "Continue with password" → fill e-mail → `requestSubmit()`
  + click Continue → fill password → `requestSubmit()` + click Log in, re-enabling a disabled
  submit button, up to 4 password attempts. A guard refuses to report success if the password
  was never submitted.
* `finishSuccess()` records `status:"done"`, charges the 10 credits
  (`confirmAccountSwitchSuccess`) and redirects to the pending invite URL or `/dashboard`.

While typing, `maskCredentialInputs()` injects
`-webkit-text-security: disc; filter: blur(6px); color: transparent` over the e-mail and password
fields, and `showSwitchOverlay()` covers the page with a fullscreen "Switching Workspace Account"
overlay playing `loop.mp4`. That is not a security feature — it stops the *paying user* from
reading the shared password.

`injectOneClickLoginButton()` adds the extra `⚡ 1-Click 127HUB Auto Login` button to the real
form; pending logins expire after 5 minutes, and the target project is carried in the page's
`localStorage` key `__127hub_pending_invite`.

### 4.4 Request proxy (§5)

The page posts `lovasiriProxySend` with
`{message, token, projectId, castleToken, sessionId, clientGitSha, files, optimisticImageUrls}`;
`content.js` forwards it verbatim to the background worker as `backendProxySend`. Castle is
Lovable's bot-defence vendor, so the session's *anti-bot token* is being forwarded along with the
auth token — that is, the extension is built to make requests that look like they come from the
user's browser while being issued elsewhere.

### 4.5 Bugs in the shipped code (preserved and marked `BUG:` in the annotated file)

* The status banner's `cssText` has its `box-shadow` value truncated into
  `0 0 25px padding:10px 22px !important;…` and then the entire declaration block is concatenated
  **twice**; the second fragment is appended after the colour value.
* The banner's `@keyframes qlSpin` / `qlBannerIn` are appended as **text content** instead of
  living in a `<style>` element, so the spinner and slide-in animations never actually exist.
* The privacy-shield markup opens a progress-bar `<div>` that is never closed, and puts its
  `<style>` block inside a flex row.
* Two user-facing strings are Hinglish/Hindi mixed with Devanagari
  (`"Kal subah dobara try karein!"`, `"Aapke paas पर्याप्त credits nahi hain"`), the error path
  says `"Method 4 is not live now please contact the admin !"`, and log prefixes are
  hard-coded to `[127HUB.COM]` / `[127HUB AI AutoLogin]`.

## 5. Message-protocol reference

The full, cross-referenceable list of every message type, storage key and DOM id owned by
`content.js` is the **appendix at the bottom of `content.annotated.js`** — that is the intended
carry-over when reading `pageHook.js` / `payload.js` / `powerkits-core.js`.

Summary of the exfiltration-relevant edges:

```
page  ──lovableTokenFound {token, projectId}──▶ content.js
content.js ──{action:"lovableSync", token, projectId}──▶ background ──▶ ai.127hub.com
page  ──lovasiriProxySend {token, castleToken, sessionId, …}──▶ content.js
content.js ──{action:"backendProxySend", …}──▶ background ──▶ ai.127hub.com/api/v1/lovable/chat
```

Storage keys: `ql_send_method`, `ql_credits`, `ql_max_credits`, `ql_license_valid`,
`ql_license_key`, `ql_license_status`, `ql_daily_switch_limit`, `ql_switches_today`,
`ql_switches_left_today`, `ql_pending_autologin`, `ql_pending_invite_url`, `ql_user_name`,
`ql_activated_at`, `ql_expires_at`, `ql_plan`.

## 6. What `background.js` adds (cracked for context)

`background.js` was also run through webcrack (3.6 MB → 4 313 lines, shipped as
[`background.webcrack.js`](./background.webcrack.js)) to close the story, because that is where
the `cookies` permission is actually used. It has **not** been renamed/annotated — it is the raw
webcrack output, so expect `_0x…` names below the top level. Its top-level functions include
`_handleByokChat`, `_handleGitHubAutoConnect`, `_handleGitHubDirectCommit`, `_handleGitHubGetFiles`,
`_handleGitHubGetTree`, `buildLovasiriTokenCandidates`, `addLovasiriTokenCandidate`,
`_isSupabaseToken`, `_isValidLovableToken`, `fetchLovableSourceDirect`,
`fetchLovableSourceViaPage`, `otaCheckForUpdate`, `refreshGateStatus`, `_initDeclarativeCorsRules`.

The four findings that matter:

1. **Session-cookie harvesting.** An `action:"readCookies"` handler reads
   `lovable-session-id.id`, `.custom`, `.refresh` and `.sig` from `https://lovable.dev` and
   returns any value that starts with `eyJ` and has three dot-separated parts — i.e. **the
   user's httpOnly Lovable session JWTs**, including `httpOnly: true` in the response. This is
   precisely why the manifest needs the `cookies` permission, and it is the reason `content.js`
   alone (isolated world, no cookie access) could not do it.
2. **Cookie wiping on switch.** Before switching, it iterates
   `["lovable.dev", "api.lovable.dev", "lovable.app", "supabase.co"]`, calls
   `chrome.cookies.getAll({domain})` and deletes every match via `chrome.cookies.remove`.
3. **Hard-coded fallback account.** When its own backend is unreachable:
   `console.warn("[127HUB AI] Backend unreachable, using emergency fallback account")` →
   `{email:"127hub@lusufer.us.cc", password:"Quack1709#"}`.
4. **Server endpoints.**
   `https://ai.127hub.com/api/v1/lovable/session` and `.../lovable/chat` (session + chat replay),
   `.../api/extension_versions` (OTA), `https://keygen.eklas.dev/api/license` (licensing),
   `https://securetoken.googleapis.com/v1/token?key=AIzaSyBQNjlw9Vp4tP4VVeANzyPJnqbG2wLbYPw`
   (Firebase token refresh), `api.github.com` (repo read/commit with the user's GitHub token),
   sandbox git/`raw.githubusercontent.com`, and BYOK providers `api.openai.com`,
   `api.anthropic.com`, `generativelanguage.googleapis.com`, `api.groq.com`, `api.deepseek.com`,
   `api.mistral.ai`, `api.x.ai`, `api.together.xyz`, `openrouter.ai`, `http://localhost:11434`.

## 7. Security findings

**High**

1. **Session-token exfiltration.** Lovable session JWTs are read out of `chrome.cookies` and
   forwarded with the licence key, project id, workspace id, Castle token and session id to
   `https://ai.127hub.com/api/v1/lovable/session`. `content.js` separately forwards the token it
   scrapes from the page as `lovableSync`.
2. **Hard-coded shared credentials** (`127hub@lusufer.us.cc` / `Quack1709#`) in shipped code,
   used both for autologin and as an emergency fallback. Anyone who unpacks the extension has
   that account.
3. **Destructive cookie deletion** for `lovable.dev`, `api.lovable.dev`, `lovable.app` and
   `supabase.co` on every account switch.
4. **Requests and anti-bot tokens replayed off-device.** The Castle token and audio/session id
   being shipped alongside the auth token means third parties issue Lovable traffic attributed to
   the user's browser session.

**Medium**

5. **Page → privileged bridge.** Any page script can POST a `LOVASIRI_PAGE_PAYLOAD` message and
   get arbitrary `chrome.storage` access and arbitrary `chrome.runtime.sendMessage` forwarding.
   The only gate is the `source` string, which is not a secret.
6. **Wildcard host permissions** (`https://*/*`) plus `cookies`, `tabs`, `scripting`,
   `declarativeNetRequest`, `alarms` — far beyond what "productivity tools for Lovable" needs.
7. **Client-side licence enforcement** (a `>= 8` character key and two flags) and a
   user-overridable credit ceiling. The product's own business rules are bypassable by editing
   `chrome.storage.local`.
8. **Remote update channel** (`ai.127hub.com/api/extension_versions` + `ota-update.js`) lets the
   operator ship new obfuscated code to installed clients.

**Low / quality**

9. Dead stubs shipped (`castle-v2.js`, `build-config.js` are 0 bytes), copy-pasted code paths,
   duplicated CSS, masked credentials as a privacy *feature* rather than a risk.

**Assessment.** Considered as a whole — obfuscated code, a shared account, cookie access,
session forwarding, chat replay and an OTA update channel — this is best described as a
**paid account-sharing / session-hijacking wrapper around a web app**, not a productivity tool.
The obfuscation is what stops a normal user from seeing that the extension reads their session
cookie, and the blur overlay is what stops them from seeing the password it types.

**If the extension was used on a machine with a personal Lovable account:**

1. Sign out of Lovable everywhere and sign back in (invalidates the session cookies that were
   read).
2. Change the Lovable account password, and any password reused from it.
3. Revoke GitHub tokens/OAuth access granted to the extension, and review recent commits in
   affected repositories (`_handleGitHubDirectCommit` can push).
4. Remove the extension and delete its `chrome.storage.local` data.
5. Rotate any BYOK provider keys that were entered into it (OpenAI, Anthropic, Gemini, Groq,
   DeepSeek, Mistral, xAI, Together, OpenRouter).

## 8. Files in this folder

| file | what it is |
|---|---|
| **`content.annotated.js`** | **the deliverable** — complete `content.js`, deobfuscated, every identifier renamed, every section annotated, with an appendix of the full message protocol. Verified to parse (`node --check`) and to contain the identical set of 429 string literals as the machine deobfuscation. |
| `content.webcrack.js` | the raw webcrack output for `content.js` (1 264 lines) — the machine baseline `content.annotated.js` was derived from and verified against. |
| `background.webcrack.js` | the raw webcrack output for `background.js` (4 313 lines) — the source of §6 above. |
| `ANALYSIS.md` | this report. |

The remaining bundle files (`pageHook.js` 6.1 MB, `powerkits-core.js` 11.9 MB, `gitMode.js`,
`payload.js`, `ota-update.js`, `hwFingerprint.js`, `drag-blocker.js`, `lovable-feature-api.js`)
have not been cracked yet; the same pipeline applies to each:

```bash
unzip 127HUB-AI-V30.0.zip <file>.js
bun add -d webcrack && bunx webcrack <file>.js -o out/
```
