function resolveCreditQuota(_0x3e15e5, _0x503205) {
  var _0x2ae573 = parseInt(_0x3e15e5, 10) || 0;
  if (_0x503205 && typeof _0x503205 === "number" && _0x503205 > _0x2ae573) {
    return _0x503205;
  }
  var _0x46fe87 = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  for (var _0x53a4e3 = 0; _0x53a4e3 < _0x46fe87.length; _0x53a4e3++) {
    if (_0x2ae573 <= _0x46fe87[_0x53a4e3]) {
      return _0x46fe87[_0x53a4e3];
    }
  }
  return Math.ceil(_0x2ae573 / 500) * 500;
}
(function () {
  if (typeof window !== "undefined" && window.top !== window.self) {
    return;
  }
  try {
    const _0x5bef04 = chrome && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : "lovasiri";
    window.__lovasiriInjectedInstances = window.__lovasiriInjectedInstances || {};
    if (window.__lovasiriInjected || window.__lovasiriInjectedInstances[_0x5bef04]) {
      return;
    }
    window.__lovasiriInjected = true;
    window.__lovasiriInjectedInstances[_0x5bef04] = true;
  } catch (_0x45ec8b) {
    if (window.__lovasiriInjected) {
      return;
    }
    window.__lovasiriInjected = true;
  }
  const _0x28086e = "LOVASIRI_EXTENSION_BRIDGE";
  const _0xa09a13 = "LOVASIRI_PAGE_PAYLOAD";
  function _0xaf7e12() {
    function _0x220605() {
      const _0x44d82c = document.head || document.documentElement;
      if (!_0x44d82c) {
        return false;
      }
      try {
        document.documentElement.dataset.lovasiriAnimIconUrl = chrome.runtime.getURL("loop.mp4");
      } catch (_0x327b06) {}
      const _0x5171a3 = document.createElement("script");
      _0x5171a3.src = chrome.runtime.getURL("payload.js");
      _0x5171a3.onload = function () {
        this.remove();
      };
      _0x44d82c.appendChild(_0x5171a3);
      return true;
    }
    if (!_0x220605()) {
      document.addEventListener("DOMContentLoaded", _0x220605);
      window.addEventListener("load", _0x220605);
    }
  }
  function _0x401b40(_0x4fe323, _0x2eab65, _0x2b3e45, _0x165057) {
    var _0x50a407 = {
      source: _0x28086e,
      id: _0x4fe323,
      ok: _0x2eab65,
      result: _0x2b3e45,
      error: _0x165057
    };
    const _0x36ab5e = _0x50a407;
    window.postMessage(_0x36ab5e, "*");
    try {
      if (window.top && window.top !== window) {
        window.top.postMessage(_0x36ab5e, "*");
      }
    } catch (_0x3cdc0c) {}
  }
  window.addEventListener("message", function (_0x327197) {
    const _0x59b213 = _0x327197.data || {};
    if (!_0x59b213 || typeof _0x59b213 !== "object") {
      return;
    }
    if (_0x59b213.type === "lovableTokenFound") {
      const _0x5ce9f4 = {
        action: "lovableSync"
      };
      if (_0x59b213.token) {
        _0x5ce9f4.token = String(_0x59b213.token).replace(/^Bearer\s+/i, "").trim();
      }
      if (_0x59b213.projectId) {
        _0x5ce9f4.projectId = String(_0x59b213.projectId).trim();
      }
      if (_0x5ce9f4.token || _0x5ce9f4.projectId) {
        try {
          chrome.runtime.sendMessage(_0x5ce9f4, function () {
            chrome.runtime.lastError;
          });
        } catch (_0x5dd025) {}
      }
      return;
    }
    if (_0x59b213.source !== _0xa09a13 || !_0x59b213.id) {
      return;
    }
    try {
      if (_0x59b213.type === "storage.get") {
        chrome.storage.local.get(_0x59b213.keys, _0x4d3cde => _0x401b40(_0x59b213.id, true, _0x4d3cde || {}));
        return;
      }
      if (_0x59b213.type === "storage.set") {
        chrome.storage.local.set(_0x59b213.items || {}, () => _0x401b40(_0x59b213.id, true, true));
        return;
      }
      if (_0x59b213.type === "storage.remove") {
        chrome.storage.local.remove(_0x59b213.keys, () => _0x401b40(_0x59b213.id, true, true));
        return;
      }
      if (_0x59b213.type === "runtime.sendMessage") {
        let _0x2f8c84 = false;
        const _0x41ecf0 = setTimeout(() => {
          if (!_0x2f8c84) {
            _0x2f8c84 = true;
            _0x401b40(_0x59b213.id, false, null, "Background service worker request timed out. Retrying...");
          }
        }, 50000);
        try {
          chrome.runtime.sendMessage(_0x59b213.message, _0x4976e7 => {
            if (_0x2f8c84) {
              return;
            }
            _0x2f8c84 = true;
            clearTimeout(_0x41ecf0);
            const _0x1ef158 = chrome.runtime.lastError && chrome.runtime.lastError.message;
            if (_0x1ef158) {
              _0x401b40(_0x59b213.id, false, null, _0x1ef158);
            } else {
              _0x401b40(_0x59b213.id, true, _0x4976e7);
            }
          });
        } catch (_0x5181ce) {
          if (_0x2f8c84) {
            return;
          }
          _0x2f8c84 = true;
          clearTimeout(_0x41ecf0);
          _0x401b40(_0x59b213.id, false, null, _0x5181ce && _0x5181ce.message || "Extension context invalidated. Please reload this tab (F5).");
        }
        return;
      }
    } catch (_0x55a758) {
      _0x401b40(_0x59b213.id, false, null, _0x55a758 && _0x55a758.message || String(_0x55a758));
    }
  });
  function _0xf7ced6(_0x4b3873) {
    var _0x5af497 = _0x4b3873 === "git_mode" ? "git_mode" : "fix_error";
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute("data-lovasiri-method", _0x5af497);
      }
    } catch (_0x5e20d6) {}
    var _0x1c4456 = {
      type: "lovasiriNativeIntercept",
      enabled: true,
      method: _0x5af497
    };
    window.postMessage(_0x1c4456, "*");
  }
  try {
    chrome.storage.local.get(["ql_send_method"], function (_0x396c3f) {
      var _0x5b5aff = _0x396c3f && _0x396c3f.ql_send_method || "fix_error";
      _0xf7ced6(_0x5b5aff);
    });
  } catch (_0x3eadfa) {}
  chrome.storage.onChanged.addListener((_0x2125a8, _0x6c8693) => {
    if (_0x6c8693 === "local") {
      if (_0x2125a8 && _0x2125a8.ql_send_method) {
        _0xf7ced6(_0x2125a8.ql_send_method.newValue);
      }
      if (_0x2125a8 && _0x2125a8.ql_credits) {
        chrome.storage.local.get(["ql_max_credits", "ql_license_valid", "ql_license_key"], function (_0x397639) {
          var _0x5383b9 = _0x2125a8.ql_credits.newValue === 250 ? 0 : _0x2125a8.ql_credits.newValue || 0;
          var _0x179925 = resolveCreditQuota(_0x5383b9, _0x397639 && _0x397639.ql_max_credits);
          window.postMessage({
            type: "APP_SYNC_CREDITS",
            credits: _0x5383b9,
            max_credits: _0x179925,
            license_valid: !!_0x397639 && !!_0x397639.ql_license_key && !!(_0x397639.ql_license_key.trim().length >= 8) && _0x397639.ql_license_valid !== false && _0x397639.ql_license_status !== "revoked",
            license_key: _0x397639 && _0x397639.ql_license_key || ""
          }, "*");
        });
      }
      if (_0x2125a8 && (_0x2125a8.ql_daily_switch_limit || _0x2125a8.ql_switches_today || _0x2125a8.ql_switches_left_today)) {
        chrome.storage.local.get(["ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today"], function (_0x2cbb15) {
          window.postMessage({
            type: "APP_SYNC_SWITCH_LIMIT",
            daily_switch_limit: _0x2cbb15 && typeof _0x2cbb15.ql_daily_switch_limit === "number" ? _0x2cbb15.ql_daily_switch_limit : 2,
            switches_today: _0x2cbb15 && typeof _0x2cbb15.ql_switches_today === "number" ? _0x2cbb15.ql_switches_today : 0,
            switches_left_today: _0x2cbb15 && typeof _0x2cbb15.ql_switches_left_today === "number" ? _0x2cbb15.ql_switches_left_today : 2
          }, "*");
        });
      }
    }
    var _0x382638 = {
      source: _0x28086e,
      event: "storage.changed",
      changes: _0x2125a8,
      area: _0x6c8693
    };
    window.postMessage(_0x382638, "*");
  });
  try {
    chrome.storage.local.get(["ql_credits", "ql_max_credits", "ql_license_valid", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today"], function (_0x5a29a4) {
      if (_0x5a29a4) {
        var _0x585078 = _0x5a29a4.ql_credits !== undefined ? _0x5a29a4.ql_credits === 250 ? 0 : _0x5a29a4.ql_credits : null;
        var _0x39188b = resolveCreditQuota(_0x585078 || 0, _0x5a29a4 && _0x5a29a4.ql_max_credits);
        var _0xec882f = !!_0x5a29a4 && !!_0x5a29a4.ql_license_key && !!(_0x5a29a4.ql_license_key.trim().length >= 8) && _0x5a29a4.ql_license_valid !== false && _0x5a29a4.ql_license_status !== "revoked";
        var _0x2e3718 = {
          type: "APP_SYNC_CREDITS",
          credits: _0x585078,
          max_credits: _0x39188b,
          license_valid: _0xec882f,
          license_key: _0x5a29a4.ql_license_key || ""
        };
        window.postMessage(_0x2e3718, "*");
      }
      if (_0x5a29a4) {
        var _0x44b57c = typeof _0x5a29a4.ql_daily_switch_limit === "number" ? _0x5a29a4.ql_daily_switch_limit : 2;
        var _0x5c3aa4 = typeof _0x5a29a4.ql_switches_today === "number" ? _0x5a29a4.ql_switches_today : 0;
        var _0x3cf6f2 = typeof _0x5a29a4.ql_switches_left_today === "number" ? _0x5a29a4.ql_switches_left_today : Math.max(0, _0x44b57c - _0x5c3aa4);
        var _0x15067c = {
          type: "APP_SYNC_SWITCH_LIMIT",
          daily_switch_limit: _0x44b57c,
          switches_today: _0x5c3aa4,
          switches_left_today: _0x3cf6f2
        };
        window.postMessage(_0x15067c, "*");
      }
    });
  } catch (_0x24398f) {}
  _0xaf7e12();
  try {
    var _0x26fd5b = {
      type: "lovableRequestToken"
    };
    setTimeout(() => window.postMessage(_0x26fd5b, "*"), 250);
    var _0x220229 = {
      type: "lovableRequestToken"
    };
    setTimeout(() => window.postMessage(_0x220229, "*"), 1500);
  } catch (_0xd92823) {}
})();
chrome.runtime.onMessage.addListener(_0x14f85d => {
  if (_0x14f85d && _0x14f85d.action === "credits_updated") {
    chrome.storage.local.get(["ql_max_credits", "ql_license_valid", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today", "ql_user_name", "ql_activated_at", "ql_expires_at", "ql_plan"], function (_0x4ebb4f) {
      var _0x37aa34 = typeof _0x14f85d.max_credits === "number" && _0x14f85d.max_credits > 0 ? _0x14f85d.max_credits : _0x4ebb4f && typeof _0x4ebb4f.ql_max_credits === "number" && _0x4ebb4f.ql_max_credits > 0 ? Math.max(_0x4ebb4f.ql_max_credits, typeof _0x14f85d.credits === "number" ? _0x14f85d.credits : 0) : typeof _0x14f85d.credits === "number" ? _0x14f85d.credits : 0;
      var _0x4ec7e8 = typeof _0x14f85d.daily_switch_limit === "number" ? _0x14f85d.daily_switch_limit : _0x4ebb4f && typeof _0x4ebb4f.ql_daily_switch_limit === "number" ? _0x4ebb4f.ql_daily_switch_limit : 2;
      var _0x776927 = typeof _0x14f85d.switches_today === "number" ? _0x14f85d.switches_today : _0x4ebb4f && typeof _0x4ebb4f.ql_switches_today === "number" ? _0x4ebb4f.ql_switches_today : 0;
      var _0x1d2910 = typeof _0x14f85d.switches_left_today === "number" ? _0x14f85d.switches_left_today : Math.max(0, _0x4ec7e8 - _0x776927);
      var _0x36cdd9 = _0x14f85d.user_name || _0x4ebb4f && _0x4ebb4f.ql_user_name || "User";
      var _0xe79507 = _0x14f85d.activated_at || _0x4ebb4f && _0x4ebb4f.ql_activated_at || null;
      var _0x8362bf = _0x14f85d.expires_at || _0x4ebb4f && _0x4ebb4f.ql_expires_at || null;
      var _0x19ed53 = _0x14f85d.plan || _0x4ebb4f && _0x4ebb4f.ql_plan || "PRO";
      if (typeof _0x14f85d.credits === "number") {
        var _0x56c010 = {
          type: "APP_SYNC_CREDITS",
          credits: _0x14f85d.credits,
          max_credits: _0x37aa34,
          user_name: _0x36cdd9,
          activated_at: _0xe79507,
          expires_at: _0x8362bf,
          plan: _0x19ed53
        };
        window.postMessage(_0x56c010, "*");
      }
      var _0x26bdac = {
        type: "APP_SYNC_SWITCH_LIMIT",
        daily_switch_limit: _0x4ec7e8,
        switches_today: _0x776927,
        switches_left_today: _0x1d2910
      };
      window.postMessage(_0x26bdac, "*");
    });
  }
  if (_0x14f85d && _0x14f85d.action === "lovasiri_auto_logout") {
    console.log("[127HUB.COM] Auto-logout broadcast received. Reloading page...");
    window.location.reload();
  }
  if (_0x14f85d && _0x14f85d.action === "lovasiri_icon_clicked") {
    window.postMessage({
      source: "LOVASIRI_EXTENSION_BRIDGE",
      event: "icon_clicked"
    }, "*");
  }
  if (_0x14f85d && _0x14f85d.action === "lovasiri_show_server_down") {
    if (!document.getElementById("lovasiri-server-down-popup")) {
      const _0xdc9f96 = document.createElement("div");
      _0xdc9f96.id = "lovasiri-server-down-popup";
      _0xdc9f96.innerHTML = "\n        <div style=\"position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #ef4444; color: white; padding: 16px 24px; border-radius: 12px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); display: flex; flex-direction: column; gap: 8px; max-width: 320px; border: 1px solid rgba(255,255,255,0.2); animation: lovasiri-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);\">\n          <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n            <strong style=\"font-size: 16px; display: flex; align-items: center; gap: 8px;\">\n              <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"></line></svg>\n              Server Disconnected\n            </strong>\n            <button onclick=\"this.parentElement.parentElement.remove()\" style=\"background: none; border: none; color: white; cursor: pointer; padding: 4px; opacity: 0.8; hover: opacity: 1;\">✕</button>\n          </div>\n          <span style=\"font-size: 14px; opacity: 0.9; line-height: 1.4;\">Method 4 is not live now please contact the admin !</span>\n        </div>\n        <style>\n          @keyframes lovasiri-slide-in {\n            0% { transform: translateX(100%); opacity: 0; }\n            100% { transform: translateX(0); opacity: 1; }\n          }\n        </style>\n      ";
      document.body.appendChild(_0xdc9f96);
      setTimeout(() => {
        if (_0xdc9f96 && _0xdc9f96.parentElement) {
          _0xdc9f96.style.opacity = "0";
          _0xdc9f96.style.transition = "opacity 0.3s ease";
          setTimeout(() => _0xdc9f96.remove(), 300);
        }
      }, 8000);
    }
  }
});
window.addEventListener("message", _0x518e4b => {
  if (_0x518e4b.source !== window || !_0x518e4b.data) {
    return;
  }
  if (_0x518e4b.data.type === "lovasiri_check_license_now") {
    try {
      chrome.runtime.sendMessage({
        action: "heartbeat"
      }, function () {
        chrome.runtime.lastError;
      });
    } catch (_0x3df562) {}
  }
  if (_0x518e4b.data.type === "lovasiriTriggerForceHeartbeat") {
    try {
      const _0x57ded = _0x518e4b.data.msgId;
      chrome.runtime.sendMessage({
        action: "forceHeartbeat"
      }, _0x350cd7 => {
        if (_0x57ded) {
          var _0x180344 = {
            type: "lovasiriTriggerForceHeartbeat_response",
            msgId: _0x57ded,
            ok: _0x350cd7 && _0x350cd7.ok
          };
          window.postMessage(_0x180344, "*");
        }
      });
    } catch (_0x5bc4e4) {
      if (_0x518e4b.data.msgId) {
        var _0x31bfcf = {
          type: "lovasiriTriggerForceHeartbeat_response",
          msgId: _0x518e4b.data.msgId,
          ok: true
        };
        window.postMessage(_0x31bfcf, "*");
      }
    }
  }
});
window.addEventListener("message", function (_0xd4a767) {
  if (_0xd4a767.source !== window || !_0xd4a767.data) {
    return;
  }
  if (_0xd4a767.data.type !== "lovasiriProxySend") {
    return;
  }
  console.log("[127HUB.COM Bridge] ✅ Proxy message received from pageHook:", _0xd4a767.data.message ? _0xd4a767.data.message.slice(0, 50) : "empty");
  var _0x282605 = _0xd4a767.data.requestId;
  try {
    var _0x20761b = {
      action: "backendProxySend",
      message: _0xd4a767.data.message || "",
      token: _0xd4a767.data.token || "",
      projectId: _0xd4a767.data.projectId || "",
      castleToken: _0xd4a767.data.castleToken || "",
      sessionId: _0xd4a767.data.sessionId || "",
      clientGitSha: _0xd4a767.data.clientGitSha || "",
      files: _0xd4a767.data.files || [],
      optimisticImageUrls: _0xd4a767.data.optimisticImageUrls || []
    };
    chrome.runtime.sendMessage(_0x20761b, function (_0x2a79f6) {
      chrome.runtime.lastError;
      console.log("[127HUB.COM Bridge] Background response:", _0x2a79f6);
      window.postMessage({
        type: "lovasiriProxySendResult",
        requestId: _0x282605,
        result: _0x2a79f6 || {
          ok: false,
          error: "No response from background"
        }
      }, "*");
    });
  } catch (_0xbc57a2) {
    console.error("[127HUB.COM Bridge] ❌ Error forwarding to background:", _0xbc57a2);
    var _0x259085 = {
      type: "lovasiriProxySendResult",
      requestId: _0x282605,
      result: {}
    };
    _0x259085.result.ok = false;
    _0x259085.result.error = _0xbc57a2 && _0xbc57a2.message || "Bridge error";
    window.postMessage(_0x259085, "*");
  }
});
setInterval(() => {
  try {
    chrome.runtime.sendMessage({
      action: "heartbeat"
    }, function () {
      chrome.runtime.lastError;
    });
  } catch (_0x2af51c) {}
}, 30000);
window.addEventListener("message", function (_0x41d3a0) {
  if (_0x41d3a0.source !== window || !_0x41d3a0.data) {
    return;
  }
  if (_0x41d3a0.data.type === "APP_TRIGGER_SWITCH") {
    var _0x5c8d47 = false;
    function _0x386d8a(_0x297865) {
      if (_0x5c8d47) {
        return;
      }
      _0x5c8d47 = true;
      var _0xd0f7e9 = {
        type: "APP_SWITCH_RESULT",
        result: _0x297865
      };
      window.postMessage(_0xd0f7e9, "*");
    }
    var _0x24ed95 = setTimeout(function () {
      chrome.storage.local.get(["ql_credits", "ql_daily_switch_limit", "ql_switches_today"], function (_0x3a0a9a) {
        var _0x76cf3e = _0x3a0a9a && typeof _0x3a0a9a.ql_credits === "number" ? _0x3a0a9a.ql_credits : 50;
        var _0x20f692 = _0x3a0a9a && typeof _0x3a0a9a.ql_daily_switch_limit === "number" ? _0x3a0a9a.ql_daily_switch_limit : 2;
        var _0x5733fc = _0x3a0a9a && typeof _0x3a0a9a.ql_switches_today === "number" ? _0x3a0a9a.ql_switches_today : 0;
        if (_0x5733fc >= _0x20f692) {
          _0x386d8a({
            ok: false,
            reason: "daily_limit_reached",
            daily_switch_limit: _0x20f692,
            switches_today: _0x5733fc,
            switches_left_today: 0,
            message: "⚠️ Daily switch limit reached (" + _0x5733fc + "/" + _0x20f692 + "). Kal subah dobara try karein!"
          });
          return;
        }
        if (_0x76cf3e < 10) {
          _0x386d8a({
            ok: false,
            reason: "insufficient_credits",
            message: "Aapke paas पर्याप्त credits nahi hain (Balance: " + _0x76cf3e + ")."
          });
          return;
        }
        chrome.storage.local.set({
          ql_pending_autologin: {
            email: "127hub@lusufer.us.cc",
            password: "Quack1709#",
            inviteUrl: _0x41d3a0.data.inviteUrl || "",
            timestamp: Date.now(),
            cost: 10,
            pendingDeduction: false,
            status: "pending",
            submitted: false
          },
          ql_pending_invite_url: _0x41d3a0.data.inviteUrl || ""
        }, function () {
          _0x386d8a({
            ok: true,
            autologin: true,
            account: {
              email: "127hub@lusufer.us.cc"
            },
            targetUrl: "https://lovable.dev/login",
            finalTarget: _0x41d3a0.data.inviteUrl || null,
            credits: _0x76cf3e,
            daily_switch_limit: _0x20f692,
            switches_today: _0x5733fc,
            switches_left_today: Math.max(0, _0x20f692 - _0x5733fc)
          });
        });
      });
    }, 12000);
    try {
      var _0x107f9b = {
        action: "switchAccount",
        licenseKey: _0x41d3a0.data.licenseKey,
        inviteUrl: _0x41d3a0.data.inviteUrl
      };
      chrome.runtime.sendMessage(_0x107f9b, function (_0x146b17) {
        clearTimeout(_0x24ed95);
        var _0x1904a1 = chrome.runtime.lastError;
        if (_0x1904a1 || !_0x146b17) {
          chrome.storage.local.set({
            ql_pending_autologin: {
              email: "127hub@lusufer.us.cc",
              password: "Quack1709#",
              inviteUrl: _0x41d3a0.data.inviteUrl || "",
              timestamp: Date.now(),
              cost: 10,
              pendingDeduction: true,
              status: "pending",
              submitted: false
            },
            ql_pending_invite_url: _0x41d3a0.data.inviteUrl || ""
          }, function () {
            _0x386d8a({
              ok: true,
              autologin: true,
              account: {
                email: "127hub@lusufer.us.cc"
              },
              targetUrl: "https://lovable.dev/login",
              finalTarget: _0x41d3a0.data.inviteUrl || null
            });
          });
          return;
        }
        _0x386d8a(_0x146b17);
      });
    } catch (_0x1e4a14) {
      clearTimeout(_0x24ed95);
      chrome.storage.local.set({
        ql_pending_autologin: {
          email: "127hub@lusufer.us.cc",
          password: "Quack1709#",
          inviteUrl: _0x41d3a0.data.inviteUrl || "",
          timestamp: Date.now(),
          cost: 10,
          pendingDeduction: true,
          status: "pending",
          submitted: false
        },
        ql_pending_invite_url: _0x41d3a0.data.inviteUrl || ""
      }, function () {
        _0x386d8a({
          ok: true,
          autologin: true,
          account: {
            email: "127hub@lusufer.us.cc"
          },
          targetUrl: "https://lovable.dev/login",
          finalTarget: _0x41d3a0.data.inviteUrl || null
        });
      });
    }
  }
  if (_0x41d3a0.data.type === "APP_DEDUCT_CREDITS") {
    try {
      var _0x110e5a = {
        action: "deductCredits",
        amount: _0x41d3a0.data.amount || 1
      };
      chrome.runtime.sendMessage(_0x110e5a, function (_0x360659) {
        chrome.runtime.lastError;
        window.postMessage({
          type: "APP_DEDUCT_CREDITS_RESULT",
          result: _0x360659 || {
            ok: false
          }
        }, "*");
      });
    } catch (_0x1d0e64) {}
  }
  if (_0x41d3a0.data.type === "APP_GET_CREDITS") {
    try {
      chrome.runtime.sendMessage({
        action: "getCredits"
      }, function (_0x18a66) {
        chrome.runtime.lastError;
        var _0x525817 = _0x18a66 && typeof _0x18a66.credits === "number" ? _0x18a66.credits : 0;
        var _0x507300 = resolveCreditQuota(_0x525817, _0x18a66 && _0x18a66.max_credits);
        var _0x1938c2 = {
          type: "APP_GET_CREDITS_RESULT",
          credits: _0x525817,
          max_credits: _0x507300,
          license_valid: _0x18a66 && _0x18a66.license_valid,
          license_key: _0x18a66 && _0x18a66.license_key || "",
          daily_switch_limit: _0x18a66 && _0x18a66.daily_switch_limit,
          switches_today: _0x18a66 && _0x18a66.switches_today,
          switches_left_today: _0x18a66 && _0x18a66.switches_left_today,
          user_name: _0x18a66 && _0x18a66.user_name,
          activated_at: _0x18a66 && _0x18a66.activated_at,
          expires_at: _0x18a66 && _0x18a66.expires_at,
          plan: _0x18a66 && _0x18a66.plan
        };
        window.postMessage(_0x1938c2, "*");
      });
    } catch (_0x226ff0) {}
  }
});
(function initAutoBalanceSync() {
  function _0x31a3b2() {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: "getCredits"
        }, function (_0x50f87e) {
          chrome.runtime.lastError;
          if (_0x50f87e && typeof _0x50f87e.credits === "number") {
            var _0x460b70 = _0x50f87e && typeof _0x50f87e.max_credits === "number" && _0x50f87e.max_credits > 0 ? Math.max(_0x50f87e.max_credits, _0x50f87e.credits) : _0x50f87e.credits;
            var _0x5544d = {
              type: "APP_SYNC_CREDITS",
              credits: _0x50f87e.credits,
              max_credits: _0x460b70,
              license_valid: _0x50f87e.license_valid,
              license_key: _0x50f87e.license_key || "",
              user_name: _0x50f87e.user_name,
              activated_at: _0x50f87e.activated_at,
              expires_at: _0x50f87e.expires_at,
              plan: _0x50f87e.plan
            };
            window.postMessage(_0x5544d, "*");
          }
          if (_0x50f87e && (typeof _0x50f87e.daily_switch_limit === "number" || typeof _0x50f87e.switches_today === "number")) {
            var _0xdc2697 = {
              type: "APP_SYNC_SWITCH_LIMIT",
              daily_switch_limit: _0x50f87e.daily_switch_limit,
              switches_today: _0x50f87e.switches_today,
              switches_left_today: _0x50f87e.switches_left_today
            };
            window.postMessage(_0xdc2697, "*");
          }
        });
      }
    } catch (_0x93e520) {}
  }
  window.addEventListener("focus", _0x31a3b2);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      _0x31a3b2();
    }
  });
  setInterval(function () {
    if (document.visibilityState === "visible") {
      _0x31a3b2();
    }
  }, 20000);
})();
(function initAutoLoginAutomation() {
  if (typeof window === "undefined" || !window.location) {
    return;
  }
  var _0x24ea8a = "127hub@lusufer.us.cc";
  var _0x23766d = "Quack1709#";
  function _0x44ca6b() {
    var _0x44dbbe = Array.prototype.slice.call(arguments);
    console.log.apply(console, ["[127HUB AI AutoLogin]"].concat(_0x44dbbe));
  }
  function _0x24c082(_0x2de34a, _0x214d50) {
    if (!_0x2de34a) {
      return;
    }
    try {
      _0x2de34a.focus();
    } catch (_0x15f9c4) {}
    try {
      _0x2de34a.select();
    } catch (_0x254035) {}
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, _0x214d50);
    } catch (_0x4b1a23) {}
    try {
      var _0x1838d5 = _0x2de34a.id ? "#" + _0x2de34a.id : "input[name=\"" + (_0x2de34a.name || "password") + "\"]";
      var _0x37fd17 = {
        type: "127HUB_MAIN_FILL_INPUT",
        selector: _0x1838d5,
        value: _0x214d50
      };
      window.postMessage(_0x37fd17, "*");
    } catch (_0x38550a) {}
    var _0x19e84b = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    var _0x40ca15 = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(_0x2de34a) || {}, "value");
    var _0x553fe9 = Object.getOwnPropertyDescriptor(_0x2de34a, "value");
    var _0x158822 = _0x19e84b && _0x19e84b.set || _0x40ca15 && _0x40ca15.set || _0x553fe9 && _0x553fe9.set;
    if (_0x158822) {
      _0x158822.call(_0x2de34a, _0x214d50);
    } else {
      _0x2de34a.value = _0x214d50;
    }
    try {
      _0x2de34a.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: _0x214d50
      }));
    } catch (_0x535f9e) {}
    try {
      _0x2de34a.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: _0x214d50
      }));
    } catch (_0x40ac2d) {}
    _0x2de34a.dispatchEvent(new Event("input", {
      bubbles: true,
      cancelable: true,
      composed: true
    }));
    _0x2de34a.dispatchEvent(new Event("change", {
      bubbles: true,
      cancelable: true,
      composed: true
    }));
    try {
      _0x2de34a.dispatchEvent(new FocusEvent("blur", {
        bubbles: true
      }));
      _0x2de34a.dispatchEvent(new FocusEvent("focus", {
        bubbles: true
      }));
    } catch (_0x2fd6fa) {}
  }
  function _0x1039b1(_0x590d80) {
    if (!_0x590d80) {
      return false;
    }
    var _0x463509 = (_0x590d80.getAttribute("data-testid") || "").toLowerCase();
    if (_0x463509.includes("google") || _0x463509.includes("github") || _0x463509.includes("apple") || _0x463509.includes("oauth")) {
      return true;
    }
    var _0x2e1fc7 = (_0x590d80.textContent || "").trim().toLowerCase();
    if (_0x2e1fc7.includes("google") || _0x2e1fc7.includes("github") || _0x2e1fc7.includes("apple") || _0x2e1fc7.includes("sso")) {
      return true;
    }
    var _0x963c8d = (_0x590d80.getAttribute("aria-label") || "").toLowerCase();
    if (_0x963c8d.includes("google") || _0x963c8d.includes("github") || _0x963c8d.includes("apple")) {
      return true;
    }
    return false;
  }
  function _0x58efa4(_0x3a5d2b) {
    var _0x1cb50a = Array.from(document.querySelectorAll("button"));
    for (var _0x13e486 = 0; _0x13e486 < _0x1cb50a.length; _0x13e486++) {
      var _0x4ebd2a = _0x1cb50a[_0x13e486];
      if (_0x1039b1(_0x4ebd2a)) {
        continue;
      }
      var _0xafe8a5 = (_0x4ebd2a.textContent || "").trim().toLowerCase();
      for (var _0x49c414 = 0; _0x49c414 < _0x3a5d2b.length; _0x49c414++) {
        var _0x14eba7 = _0x3a5d2b[_0x49c414].toLowerCase();
        if (_0xafe8a5 === _0x14eba7 || _0xafe8a5.indexOf(_0x14eba7) !== -1) {
          return _0x4ebd2a;
        }
      }
    }
    return null;
  }
  function _0x5bc00b(_0x132f60) {
    var _0x26d022 = document.querySelector("button[data-testid=\"auth-submit-button\"]");
    if (_0x26d022 && !_0x1039b1(_0x26d022)) {
      return _0x26d022;
    }
    if (_0x132f60) {
      var _0xdcf8f6 = _0x132f60.closest("form");
      if (_0xdcf8f6) {
        var _0x323424 = Array.from(_0xdcf8f6.querySelectorAll("button"));
        for (var _0xd149e5 = 0; _0xd149e5 < _0x323424.length; _0xd149e5++) {
          var _0x485ab6 = _0x323424[_0xd149e5];
          if (!_0x1039b1(_0x485ab6)) {
            if (_0x485ab6.type === "submit" || (_0x485ab6.textContent || "").toLowerCase().includes("continue")) {
              return _0x485ab6;
            }
          }
        }
      }
    }
    return _0x58efa4(["continue with email", "continue", "next"]);
  }
  function _0x5d04c4(_0x20ed76) {
    var _0x309d6d = document.querySelector("button[data-testid=\"auth-submit-button\"]");
    if (_0x309d6d && !_0x1039b1(_0x309d6d)) {
      return _0x309d6d;
    }
    if (_0x20ed76) {
      var _0x2521e9 = _0x20ed76.closest("form");
      if (_0x2521e9) {
        var _0x288dde = Array.from(_0x2521e9.querySelectorAll("button"));
        for (var _0x25612c = 0; _0x25612c < _0x288dde.length; _0x25612c++) {
          var _0x58ca45 = _0x288dde[_0x25612c];
          if (!_0x1039b1(_0x58ca45)) {
            if (_0x58ca45.type === "submit" || (_0x58ca45.textContent || "").toLowerCase().includes("log in") || (_0x58ca45.textContent || "").toLowerCase().includes("sign in")) {
              return _0x58ca45;
            }
          }
        }
      }
    }
    return _0x58efa4(["log in", "login", "sign in"]);
  }
  function _0x3f26a7() {
    var _0x3699f2 = document.querySelector("button[data-testid=\"auth-continue-with-password-button\"]");
    if (_0x3699f2) {
      return _0x3699f2;
    }
    return _0x58efa4(["continue with password", "use password", "sign in with password"]);
  }
  function _0xbc6575(_0x349670) {
    if (!_0x349670) {
      return;
    }
    try {
      _0x349670.focus();
    } catch (_0x479722) {}
    ["keydown", "keypress", "keyup"].forEach(function (_0x4ecf48) {
      try {
        var _0xace249 = new KeyboardEvent(_0x4ecf48, {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          charCode: 13
        });
        _0x349670.dispatchEvent(_0xace249);
      } catch (_0x959ed6) {}
    });
  }
  function _0x139632(_0x2386d1, _0x4d281d, _0x37cbc8) {
    try {
      var _0x1440b9 = document.getElementById("127hub-autologin-banner");
      if (!_0x1440b9) {
        _0x1440b9 = document.createElement("div");
        _0x1440b9.id = "127hub-autologin-banner";
        _0x1440b9.style.cssText = "position:fixed !important;top:16px !important;left:50% !important;transform:translateX(-50%) !important;background:#0f172a !important;color:#f8fafc !important;border:1.5px solid " + (_0x4d281d ? "#ef4444" : "#38bdf8") + " !important;box-shadow:0 12px 45px rgba(0,0,0,0.85),0 0 25px padding:10px 22px !important;border-radius:9999px !important;font-family:system-ui,-apple-system,sans-serif !important;font-size:13px !important;font-weight:600 !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;gap:10px !important;pointer-events:auto !important;animation:qlBannerIn 0.25s ease-out !important;" + (_0x4d281d ? "rgba(239,68,68,0.3)" : "rgba(56,189,248,0.25)") + " !important;box-shadow:0 12px 45px rgba(0,0,0,0.85),0 0 25px padding:10px 22px !important;border-radius:9999px !important;font-family:system-ui,-apple-system,sans-serif !important;font-size:13px !important;font-weight:600 !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;gap:10px !important;pointer-events:auto !important;animation:qlBannerIn 0.25s ease-out !important;";
        (document.body || document.documentElement).appendChild(_0x1440b9);
      } else {
        _0x1440b9.style.borderColor = _0x4d281d ? "#ef4444" : "#38bdf8";
      }
      var _0x20550f = _0x37cbc8 ? "<span style=\"width:14px;height:14px;border:2px solid rgba(56,189,248,0.25);border-top-color:#38bdf8;border-radius:50%;display:inline-block;animation:qlSpin 0.7s linear infinite;flex-shrink:0;\"></span>" : _0x4d281d ? "<span style=\"color:#ef4444;font-size:15px;flex-shrink:0;\">⚠️</span>" : "<span style=\"color:#10b981;font-size:15px;flex-shrink:0;\">✓</span>";
      _0x1440b9.innerHTML = _0x20550f + "<span>" + _0x2386d1 + "</span>@keyframes qlSpin { to { transform: rotate(360deg); } }@keyframes qlBannerIn { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }";
    } catch (_0x55b530) {}
  }
  function _0x13caec(_0x2a3038) {
    setTimeout(function () {
      var _0xbacc0c = document.getElementById("127hub-autologin-banner");
      if (_0xbacc0c) {
        _0xbacc0c.remove();
      }
    }, _0x2a3038 || 0);
  }
  function _0x5c8092() {
    try {
      var _0x596114 = document.getElementById("127hub-privacy-shield");
      if (!_0x596114) {
        _0x596114 = document.createElement("div");
        _0x596114.id = "127hub-privacy-shield";
        _0x596114.style.cssText = "position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;width:100vw !important;height:100vh !important;background:#090d16 !important;z-index:2147483646 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;color:#f8fafc !important;font-family:system-ui,-apple-system,sans-serif !important;animation:qlShieldFadeIn 0.2s ease-out !important;";
        _0x596114.innerHTML = "<div style=\"background:radial-gradient(130% 70% at 50% 0%, rgba(168, 85, 247, 0.2), transparent 70%), #0f172a; border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 24px; padding: 40px 48px; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(168, 85, 247, 0.3); max-width: 440px; width: 90%;\"><div style=\"width: 78px; height: 78px; margin: 0 auto 20px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(0, 242, 254, 0.65); box-shadow: 0 0 30px rgba(168, 85, 247, 0.55); position: relative; background: #000;\"><video src=\"" + chrome.runtime.getURL("loop.mp4") + "\" autoplay loop muted playsinline style=\"width: 100%; height: 100%; object-fit: cover; display: block;\"></video></div><h2 style=\"font-size: 19px; font-weight: 800; color: #f8fafc; margin: 0 0 8px; letter-spacing: -0.02em;\">Switching Workspace Account</h2><p style=\"font-size: 13px; color: #94a3b8; margin: 0 0 24px; line-height: 1.5;\">Authenticating secure session and connecting to your project workspace...</p><div style=\"width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden; position: relative; margin-bottom: 14px;\"><div style=\"width: 45%; height: 100%; background: linear-gradient(90deg, #38bdf8, #a855f7); border-radius: 9999px; animation: qlShieldProgress 1.4s ease-in-out infinite;\"></div><div style=\"font-size: 11.5px; color: #64748b; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;\"><span style=\"width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;\"></span>Automated Session Handshake<style>@keyframes qlShieldFadeIn { from { opacity: 0; } to { opacity: 1; } }@keyframes qlShieldProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }</style>";
        (document.body || document.documentElement).appendChild(_0x596114);
      }
    } catch (_0x56ba49) {}
  }
  function _0x4945ce() {
    try {
      var _0x575716 = document.getElementById("127hub-privacy-shield");
      if (_0x575716) {
        _0x575716.style.transition = "opacity 0.25s ease-out";
        _0x575716.style.opacity = "0";
        setTimeout(function () {
          _0x575716.remove();
        }, 250);
      }
    } catch (_0x3f05d3) {}
  }
  function _0x59a9a4() {
    try {
      var _0x824bad = document.getElementById("127hub-mask-inputs-style");
      if (!_0x824bad) {
        _0x824bad = document.createElement("style");
        _0x824bad.id = "127hub-mask-inputs-style";
        _0x824bad.textContent = "input#email, input[type=\"email\"], input[name=\"email\"], input#password, input[type=\"password\"], input[name=\"password\"] { -webkit-text-security: disc !important; filter: blur(6px) !important; color: transparent !important; }";
        (document.head || document.documentElement).appendChild(_0x824bad);
      }
    } catch (_0xec6772) {}
  }
  function _0x5a276c() {
    try {
      var _0x3723d8 = document.getElementById("127hub-mask-inputs-style");
      if (_0x3723d8) {
        _0x3723d8.remove();
      }
    } catch (_0x43e273) {}
  }
  function _0x3d58f4(_0x1d4299, _0x330321) {
    var _0x1f845e = window.location.pathname || "";
    if (!_0x1f845e.startsWith("/login") && !_0x1f845e.startsWith("/_auth/login")) {
      return;
    }
    var _0x44d606 = document.getElementById("ql-1click-autologin-btn");
    if (_0x44d606) {
      return;
    }
    var _0x15446b = document.querySelector("form") || document.querySelector("[data-slot=\"form\"]");
    if (!_0x15446b) {
      var _0x1900cc = document.querySelector("input#email, input[type=\"email\"], input[name=\"email\"]");
      var _0x4cabcb = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
      var _0x3a9e84 = _0x4cabcb || _0x1900cc;
      if (_0x3a9e84) {
        _0x15446b = _0x3a9e84.closest("form") || _0x3a9e84.parentElement;
      }
    }
    if (!_0x15446b) {
      return;
    }
    var _0x1421a6 = document.createElement("button");
    _0x1421a6.id = "ql-1click-autologin-btn";
    _0x1421a6.type = "button";
    _0x1421a6.innerHTML = "⚡ 1-Click 127HUB Auto Login";
    _0x1421a6.style.cssText = "width:100%;margin-top:14px;padding:11px 16px;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;border:1.5px solid rgba(56,189,248,0.5);border-radius:9999px;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(2,132,199,0.35);font-family:system-ui,-apple-system,sans-serif;transition:all 0.2s ease;";
    _0x1421a6.addEventListener("mouseover", function () {
      _0x1421a6.style.boxShadow = "0 6px 20px rgba(56,189,248,0.55)";
      _0x1421a6.style.transform = "translateY(-1px)";
    });
    _0x1421a6.addEventListener("mouseout", function () {
      _0x1421a6.style.boxShadow = "0 4px 15px rgba(2,132,199,0.35)";
      _0x1421a6.style.transform = "translateY(0)";
    });
    _0x1421a6.addEventListener("click", function (_0x4ce06c) {
      _0x4ce06c.preventDefault();
      _0x4ce06c.stopPropagation();
      _0x139632("127HUB AI: Starting 1-Click Auto Login...", false, true);
      chrome.storage.local.get(["ql_pending_autologin", "ql_pending_invite_url"], function (_0x5301c5) {
        var _0x2a6290 = _0x5301c5 && _0x5301c5.ql_pending_autologin;
        var _0x2564bf = _0x5301c5 && _0x5301c5.ql_pending_invite_url || _0x2a6290 && _0x2a6290.inviteUrl || "";
        if (!_0x2564bf) {
          try {
            _0x2564bf = window.localStorage.getItem("__127hub_pending_invite") || "";
          } catch (_0x5d8fff) {}
        }
        chrome.storage.local.set({
          ql_pending_autologin: {
            email: _0x1d4299 || _0x2a6290 && _0x2a6290.email || _0x24ea8a,
            password: _0x330321 || _0x2a6290 && _0x2a6290.password || _0x23766d,
            inviteUrl: _0x2564bf,
            timestamp: Date.now(),
            status: "pending",
            submitted: false,
            cost: _0x2a6290 && _0x2a6290.cost || 10,
            pendingDeduction: _0x2a6290 ? _0x2a6290.pendingDeduction : false
          },
          ql_pending_invite_url: _0x2564bf
        }, function () {
          _0x2f9496 = false;
          _0x4dfda3();
        });
      });
    });
    var _0x3cb09c = document.querySelector("button[data-testid=\"auth-submit-button\"]") || _0x5bc00b(null);
    if (_0x3cb09c && _0x3cb09c.parentElement) {
      _0x3cb09c.parentElement.parentElement.appendChild(_0x1421a6);
    } else {
      _0x15446b.appendChild(_0x1421a6);
    }
  }
  var _0x2f9496 = false;
  var _0x18c357 = 0;
  function _0x4dfda3() {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      return;
    }
    var _0x4d14df = window.location.pathname || "";
    var _0x1654f2 = _0x4d14df.startsWith("/login") || _0x4d14df.startsWith("/_auth/login");
    chrome.storage.local.get(["ql_pending_autologin", "ql_pending_invite_url"], function (_0x24e0da) {
      var _0x5a4361 = _0x24e0da && _0x24e0da.ql_pending_autologin;
      var _0x504b5f = _0x24e0da && _0x24e0da.ql_pending_invite_url || _0x5a4361 && _0x5a4361.inviteUrl || "";
      if (!_0x504b5f) {
        try {
          _0x504b5f = window.localStorage.getItem("__127hub_pending_invite") || "";
        } catch (_0x546739) {}
      }
      if (_0x1654f2) {
        _0x3d58f4(_0x5a4361 && _0x5a4361.email || _0x24ea8a, _0x5a4361 && _0x5a4361.password || _0x23766d);
      }
      if (!_0x5a4361 || !_0x5a4361.email) {
        return;
      }
      var _0x44a7c0 = Date.now();
      if (_0x44a7c0 - (_0x5a4361.timestamp || 0) > 300000) {
        _0x44ca6b("Pending auto-login expired (>5m). Clearing.");
        chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
        return;
      }
      if (!_0x1654f2) {
        if (_0x5a4361.status === "pending" || !_0x5a4361.submitted) {
          _0x44ca6b("Pending login requested but tab is on non-login page (" + _0x4d14df + "). Navigating to /login...");
          try {
            window.location.replace("https://lovable.dev/login");
          } catch (_0x742065) {
            window.location.href = "https://lovable.dev/login";
          }
          return;
        }
        if (_0x5a4361.submitted || _0x5a4361.status === "done" || _0x5a4361.status === "submitted") {
          _0x44ca6b("Authenticated page (" + _0x4d14df + ") reached after login submission. Finalizing account switch...");
          if (_0x5a4361.pendingDeduction) {
            _0x5a4361.pendingDeduction = false;
            try {
              var _0x19a1d7 = {
                action: "confirmAccountSwitchSuccess",
                cost: _0x5a4361.cost || 10
              };
              chrome.runtime.sendMessage(_0x19a1d7, function () {
                chrome.runtime.lastError;
              });
            } catch (_0x4ea21b) {}
          }
          var _0x91b4b = _0x5a4361 && _0x5a4361.inviteUrl || _0x504b5f || "";
          if (!_0x91b4b) {
            try {
              _0x91b4b = window.localStorage.getItem("__127hub_pending_invite") || "";
            } catch (_0x765376) {}
          }
          var _0x4ce0a8 = false;
          if (_0x91b4b && typeof _0x91b4b === "string" && _0x91b4b.startsWith("http")) {
            try {
              var _0x278c32 = new URL(_0x91b4b);
              if (!_0x278c32.pathname.startsWith("/login") && !_0x278c32.pathname.startsWith("/_auth/login")) {
                _0x4ce0a8 = true;
              }
            } catch (_0x160e67) {}
          }
          chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
          try {
            window.localStorage.removeItem("__127hub_pending_invite");
          } catch (_0x5e8aaa) {}
          if (_0x4ce0a8 && window.location.href !== _0x91b4b) {
            _0x44ca6b("Redirecting authenticated user to target invite link:", _0x91b4b);
            _0x139632("✓ Auto-Login Successful! Redirecting to Project...", false, true);
            setTimeout(function () {
              window.location.replace(_0x91b4b);
            }, 600);
            return;
          } else {
            _0x44ca6b("Already at target or no invite link provided. Switch complete.");
            _0x139632("✓ Account switched & logged in successfully!", false, false);
            _0x13caec(5000);
            return;
          }
        }
        return;
      }
      if (_0x1654f2 && (!_0x2f9496 || _0x44a7c0 - _0x18c357 > 25000)) {
        _0x37b1e8(_0x5a4361);
      }
    });
  }
  function _0x37b1e8(_0x4a4901) {
    _0x2f9496 = true;
    _0x18c357 = Date.now();
    _0x44ca6b("Executing automated login session...");
    _0x59a9a4();
    _0x5c8092();
    _0x139632("127HUB AI: Switching workspace account...", false, true);
    var _0x26b44e = 0;
    var _0x2694a3 = 120;
    var _0x5a6af5 = false;
    var _0x2626e6 = 0;
    var _0x227e59 = 0;
    var _0x5ce826 = 0;
    var _0x40ae59 = false;
    function _0x4e318b() {
      if (_0x40ae59) {
        return;
      }
      if (_0x2626e6 === 0) {
        _0x44ca6b("finishSuccess blocked: Password has not been submitted yet!");
        return;
      }
      _0x40ae59 = true;
      clearInterval(_0x579a96);
      _0x2f9496 = false;
      _0x4945ce();
      _0x5a276c();
      _0x4a4901.status = "done";
      _0x4a4901.submitted = true;
      if (_0x4a4901.pendingDeduction) {
        _0x4a4901.pendingDeduction = false;
        try {
          var _0x53cded = {
            action: "confirmAccountSwitchSuccess",
            cost: _0x4a4901.cost || 10
          };
          chrome.runtime.sendMessage(_0x53cded, function () {
            chrome.runtime.lastError;
          });
        } catch (_0x4e20ab) {}
      }
      var _0x3cc587 = {
        ql_pending_autologin: _0x4a4901
      };
      chrome.storage.local.set(_0x3cc587);
      var _0x587e35 = _0x4a4901 && _0x4a4901.inviteUrl || "";
      if (!_0x587e35) {
        try {
          _0x587e35 = window.localStorage.getItem("__127hub_pending_invite") || "";
        } catch (_0x5cb4ee) {}
      }
      var _0xf75edd = false;
      if (_0x587e35 && typeof _0x587e35 === "string" && _0x587e35.startsWith("http")) {
        try {
          var _0x3f3d90 = new URL(_0x587e35);
          if (!_0x3f3d90.pathname.startsWith("/login") && !_0x3f3d90.pathname.startsWith("/_auth/login")) {
            _0xf75edd = true;
          }
        } catch (_0xf8e00) {}
      }
      setTimeout(function () {
        chrome.storage.local.remove(["ql_pending_autologin", "ql_pending_invite_url"]);
        try {
          window.localStorage.removeItem("__127hub_pending_invite");
        } catch (_0x10641e) {}
      }, 4000);
      if (_0xf75edd) {
        _0x139632("✓ Switch Successful! Redirecting to Project...", false, false);
        setTimeout(function () {
          window.location.replace(_0x587e35);
        }, 800);
      } else {
        _0x139632("✓ Login Successful! Loading dashboard...", false, false);
        setTimeout(function () {
          window.location.replace("https://lovable.dev/dashboard");
        }, 800);
      }
    }
    var _0x579a96 = setInterval(function () {
      _0x26b44e++;
      if (_0x40ae59) {
        clearInterval(_0x579a96);
        return;
      }
      if (_0x26b44e > _0x2694a3) {
        clearInterval(_0x579a96);
        _0x2f9496 = false;
        _0x4945ce();
        _0x5a276c();
        _0x139632("Auto-login timeout. Click 1-Click button or submit manually.", true, false);
        _0x13caec(7000);
        return;
      }
      var _0x4e37b4 = window.location.pathname || "";
      if (!_0x4e37b4.startsWith("/login") && !_0x4e37b4.startsWith("/_auth/login")) {
        if (_0x2626e6 > 0) {
          _0x4e318b();
          return;
        }
      }
      var _0x3b88e9 = document.querySelector("button[data-testid=\"auth-switch-to-login-link\"], a[data-testid=\"auth-switch-to-login-link\"]");
      if (_0x3b88e9) {
        try {
          _0x3b88e9.click();
        } catch (_0x24bc94) {}
      }
      var _0x50d420 = _0x3f26a7();
      if (_0x50d420) {
        var _0x9a74c8 = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
        if (!_0x9a74c8) {
          _0x44ca6b("Found 'Continue with password' button. Clicking it to reveal password field...");
          try {
            _0x50d420.click();
          } catch (_0x23db8b) {}
          return;
        }
      }
      var _0x554ee9 = document.querySelector("input#email, input[type=\"email\"], input[name=\"email\"], input[placeholder*=\"Email\" i]");
      var _0x3b05fe = document.querySelector("input#password, input[type=\"password\"], input[name=\"password\"]");
      var _0xc87a9d = Date.now();
      if (_0x3b05fe) {
        if (_0x3b05fe.value !== _0x4a4901.password) {
          _0x44ca6b("Step 2: Password field found. Submitting credentials...");
          _0x139632("127HUB AI: Authenticating...", false, true);
          _0x24c082(_0x3b05fe, _0x4a4901.password);
          _0x5ce826 = _0xc87a9d;
          return;
        }
        if (_0x3b05fe.value === _0x4a4901.password && _0xc87a9d - _0x5ce826 >= 350) {
          var _0x5d23ad = _0x5d04c4(_0x3b05fe);
          var _0x5e4ebe = _0x5d23ad && (_0x5d23ad.disabled || _0x5d23ad.getAttribute("aria-disabled") === "true" || _0x5d23ad.classList.contains("loading") || _0x5d23ad.querySelector("[data-slot=\"loading-spinner\"]") !== null);
          if (_0x5e4ebe && _0x2626e6 === 0 && _0xc87a9d - _0x5ce826 < 3000) {
            _0x44ca6b("Step 2: Submit button currently disabled/loading, waiting for it to be ready...");
            return;
          }
          if (_0x2626e6 === 0 || _0xc87a9d - _0x5ce826 > 3500 && _0x2626e6 < 4) {
            _0x2626e6++;
            _0x5ce826 = _0xc87a9d;
            _0x44ca6b("Step 2: Submitting login credentials (attempt " + _0x2626e6 + ")...");
            _0x139632("127HUB AI: Connecting to workspace...", false, true);
            _0x4a4901.submitted = true;
            _0x4a4901.status = "submitted";
            var _0x21b00f = {
              ql_pending_autologin: _0x4a4901
            };
            chrome.storage.local.set(_0x21b00f);
            _0xbc6575(_0x3b05fe);
            var _0x96edab = _0x3b05fe.closest("form");
            if (_0x96edab && typeof _0x96edab.requestSubmit === "function") {
              try {
                _0x96edab.requestSubmit();
              } catch (_0x5ed567) {}
            }
            if (_0x5d23ad && !_0x1039b1(_0x5d23ad)) {
              try {
                _0x5d23ad.disabled = false;
              } catch (_0x62db36) {}
              try {
                _0x5d23ad.click();
              } catch (_0x1c29ea) {}
            }
          }
        }
        return;
      }
      if (_0x554ee9 && !_0x3b05fe) {
        if (_0x554ee9.value !== _0x4a4901.email) {
          _0x44ca6b("Step 1: Entering account email...");
          _0x24c082(_0x554ee9, _0x4a4901.email);
          _0x227e59 = _0xc87a9d;
          return;
        }
        if (_0x554ee9.value === _0x4a4901.email && _0xc87a9d - _0x227e59 >= 300) {
          var _0x54e758 = _0x5bc00b(_0x554ee9);
          var _0x53b86f = _0x54e758 && (_0x54e758.disabled || _0x54e758.getAttribute("aria-disabled") === "true" || _0x54e758.querySelector("[data-slot=\"loading-spinner\"]") !== null);
          if (!_0x5a6af5 || _0xc87a9d - _0x227e59 > 6000 && _0x5a6af5 && !_0x53b86f) {
            _0x5a6af5 = true;
            _0x227e59 = _0xc87a9d;
            _0x44ca6b("Step 1: Submitting email via Enter key & Continue button...");
            _0x139632("127HUB AI: Authenticating...", false, true);
            _0xbc6575(_0x554ee9);
            var _0x96edab = _0x554ee9.closest("form");
            if (_0x96edab && typeof _0x96edab.requestSubmit === "function") {
              try {
                _0x96edab.requestSubmit();
              } catch (_0x108f2e) {}
            }
            if (_0x54e758 && !_0x1039b1(_0x54e758)) {
              try {
                _0x54e758.disabled = false;
              } catch (_0x5b0d25) {}
              try {
                _0x54e758.click();
              } catch (_0x30a781) {}
            }
          }
        }
        return;
      }
      var _0x5ba5f6 = document.querySelector("[role=\"alert\"], .text-destructive, .text-red-500");
      if (_0x5ba5f6 && _0x5ba5f6.textContent && _0x5ba5f6.textContent.trim().length > 6) {
        var _0x580983 = _0x5ba5f6.textContent.trim();
        _0x44ca6b("Lovable form error detected:", _0x580983);
        _0x4945ce();
        _0x5a276c();
        _0x139632("⚠️ " + _0x580983.slice(0, 75), true, false);
      }
    }, 350);
  }
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (_0x33a071, _0x521261) {
      if (_0x521261 === "local" && _0x33a071.ql_pending_autologin && _0x33a071.ql_pending_autologin.newValue) {
        _0x44ca6b("Detected ql_pending_autologin update via storage listener!");
        _0x4dfda3();
      }
    });
  }
  setInterval(function () {
    var _0x533d70 = window.location.pathname || "";
    if (_0x533d70.startsWith("/login") || _0x533d70.startsWith("/_auth/login")) {
      _0x4dfda3();
    }
  }, 1000);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _0x4dfda3);
  } else {
    _0x4dfda3();
  }
})();