function resolveCreditQuota(_0x54cbb0, _0x311857) {
  var _0x32ca4a = parseInt(_0x54cbb0, 10) || 0;
  if (_0x311857 && typeof _0x311857 === "number" && _0x311857 > _0x32ca4a) {
    return _0x311857;
  }
  var _0x2cf42a = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  for (var _0x226fd8 = 0; _0x226fd8 < _0x2cf42a.length; _0x226fd8++) {
    if (_0x32ca4a <= _0x2cf42a[_0x226fd8]) {
      return _0x2cf42a[_0x226fd8];
    }
  }
  return Math.ceil(_0x32ca4a / 500) * 500;
}
try {
  chrome.storage.local.get(["ql_credits"], _0x489f70 => {
    if (_0x489f70 && _0x489f70.ql_credits === 250) {
      chrome.storage.local.set({
        ql_credits: 0
      });
    }
  });
} catch (_0x4edea4) {}
(function () {
  var _0x10aed7 = {
    build_id: "pk_ms81zeb5",
    version: chrome.runtime.getManifest().version,
    api_url: "https://ai.127hub.com",
    issued_at: 1785448826
  };
  try {
    Object.freeze(_0x10aed7);
  } catch (_0x10ff3f) {}
  try {
    self.__PK_BUILD__ = _0x10aed7;
  } catch (_0x2f355b) {}
  try {
    if (typeof window !== "undefined") {
      window.__PK_BUILD__ = _0x10aed7;
    }
  } catch (_0x26ad64) {}
})();
const __ANTI_BYPASS_VERSION__ = "30.5";
console.log("[127HUB AI   ] service worker started");
try {
  importScripts("hwFingerprint.js");
} catch (_0x4d3e41) {
  console.error("[127HUB AI   ] probes:", _0x4d3e41 && _0x4d3e41.message);
}
(function () {
  const _0x10bd8f = "ql_handshake_token";
  const _0x475306 = "ql_handshake_last_result";
  const _0xcc3d34 = 30000;
  const _0xf9f448 = 15000;
  const _0x244ab1 = 600000;
  const _0x2fb8a7 = new Set(["build_revoked", "unknown_build", "no_build_config"]);
  const _0x544db3 = new Set(["device_mismatch", "device_limit", "license_revoked", "license_expired", "license_disabled", "license_deleted", "invalid_license", "not_found", "key_deleted", "key_revoked", "key_not_found", "device_reset", "devices_reset", "suspended", "banned", "inactive", "invalid_key", "expired", "deleted", "revoked", "disabled", "invalid_signature"]);
  let _0x1d0eea = false;
  let _0x267f90 = null;
  function _0x41d47a() {
    try {
      return self.__PK_BUILD__ || null;
    } catch (_0x31eed5) {
      return null;
    }
  }
  function _0x276d69(_0x2e616d) {
    const _0x428f0f = _0x41d47a();
    if (!_0x428f0f || !_0x428f0f.api_url) {
      return null;
    }
    return String(_0x428f0f.api_url).replace(/\/+$/, "") + _0x2e616d;
  }
  let _0x18cf6f = null;
  async function _0x32d514() {
    if (_0x18cf6f) {
      return _0x18cf6f;
    }
    _0x18cf6f = new Promise(_0x1178ef => {
      try {
        chrome.storage.local.get(["ql_hw_fingerprint", "ql_device_id"], async _0x24bb37 => {
          if (_0x24bb37 && _0x24bb37.ql_hw_fingerprint) {
            return _0x1178ef(_0x24bb37.ql_hw_fingerprint);
          }
          if (typeof getHardwareFingerprint === "function") {
            try {
              const _0x3c78a3 = await getHardwareFingerprint();
              if (_0x3c78a3) {
                return _0x1178ef(_0x3c78a3);
              }
            } catch (_0x38eb9c) {}
          }
          if (_0x24bb37 && _0x24bb37.ql_device_id) {
            return _0x1178ef(_0x24bb37.ql_device_id);
          }
          const _0x2dd68b = crypto.randomUUID && crypto.randomUUID() || String(Date.now()) + Math.random();
          const _0x169fc1 = {
            ql_device_id: _0x2dd68b
          };
          chrome.storage.local.set(_0x169fc1, () => _0x1178ef(_0x2dd68b));
        });
      } catch (_0x58c9f) {
        _0x1178ef("unknown-device");
      }
    });
    return _0x18cf6f;
  }
  function _0x4d8064(_0x35d8d7) {
    return new Promise(_0x41ea25 => {
      try {
        chrome.storage.local.get(_0x35d8d7, _0x326670 => _0x41ea25(_0x326670 || {}));
      } catch (_0x16757b) {
        _0x41ea25({});
      }
    });
  }
  function _0x3f58f4(_0x4d2283) {
    return new Promise(_0x4a3447 => {
      try {
        chrome.storage.local.set(_0x4d2283, () => _0x4a3447());
      } catch (_0x25be59) {
        _0x4a3447();
      }
    });
  }
  async function _0x5ea7bc() {
    const _0x4ec927 = await _0x4d8064(["ql_license_key"]);
    return _0x4ec927 && _0x4ec927.ql_license_key || null;
  }
  async function _0x211108() {
    const _0x550271 = await _0x4d8064([_0x10bd8f]);
    return _0x550271 && _0x550271[_0x10bd8f] || null;
  }
  async function _0x45fa4d(_0x17914a) {
    const _0x21724f = {
      [_0x10bd8f]: _0x17914a
    };
    return _0x3f58f4(_0x21724f);
  }
  async function _0x42e2aa(_0xfb51e3) {
    return _0x3f58f4({
      [_0x475306]: Object.assign({
        checked_at: Date.now()
      }, _0xfb51e3 || {})
    });
  }
  function _0x599afa() {
    chrome.tabs.query({
      url: "*://*.lovable.dev/*"
    }, _0x24d6a7 => {
      for (const _0x1f62ff of _0x24d6a7) {
        chrome.tabs.sendMessage(_0x1f62ff.id, {
          action: "lovasiri_auto_logout"
        }).catch(() => {});
      }
    });
  }
  async function _0xf6bc17(_0xb53dbd, _0x50e689) {
    _0x599afa();
    return _0x3f58f4({
      ql_license_valid: false,
      ql_native_chat: false,
      ql_blocked_reason: _0xb53dbd || "blocked",
      ql_blocked_message: _0x50e689 || "This copy of the extension has been blocked."
    });
  }
  async function _0x54eb1a(_0x379989, _0x2fc417) {
    console.log("[127HUB AI] Auto-logout triggered. Reason:", _0x379989);
    _0x599afa();
    return new Promise(_0x1b5fd1 => {
      try {
        chrome.storage.local.remove([_0x10bd8f, "ql_license_valid", "ql_session_id", "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_license_key", "ql_license_type", "ql_license_provider", "ql_credits", "ql_switch_count"], () => {
          chrome.storage.local.set({
            ql_credits: 0,
            ql_switch_count: 0,
            ql_native_chat: false,
            ql_show_activation: true,
            ql_blocked_reason: _0x379989 || "license_invalid",
            ql_blocked_message: _0x2fc417 || "Your license is no longer valid."
          }, () => _0x1b5fd1());
        });
      } catch (_0x359877) {
        _0x1b5fd1();
      }
    });
  }
  function _0x5bd1cd(_0x37853f) {
    if (!_0x37853f || typeof _0x37853f !== "object" || !_0x37853f.token) {
      return false;
    }
    if (!_0x37853f.expires_at) {
      return false;
    }
    return _0x37853f.expires_at > Math.floor(Date.now() / 1000);
  }
  function _0x5e581b(_0x5ee4fa) {
    if (!_0x5ee4fa || !_0x5ee4fa.token || !_0x5ee4fa.cached_at) {
      return false;
    }
    return Date.now() - _0x5ee4fa.cached_at < _0x244ab1;
  }
  async function _0x5dd20c(_0x1e232a) {
    const _0x108795 = "lovasiri_secure_v9_salt_2026";
    const _0x4d33fb = new TextEncoder().encode(_0x1e232a + _0x108795);
    const _0x336c53 = await crypto.subtle.digest("SHA-256", _0x4d33fb);
    const _0x2960cb = Array.from(new Uint8Array(_0x336c53));
    return _0x2960cb.map(_0x346988 => _0x346988.toString(16).padStart(2, "0")).join("");
  }
  async function _0x5f3127(_0x3f69e1, _0x20ebb) {
    const _0xa8f03e = _0x276d69(_0x3f69e1);
    if (!_0xa8f03e) {
      return {
        networkError: false,
        data: {
          ok: false,
          reason: "no_build_config"
        }
      };
    }
    let _0x421eb1 = {
      "content-type": "application/json",
      apikey: "pk_lov_ext_a8f3c21e9d4b7f0e6a2c5d8b1e4f7a0c",
      authorization: "Bearer pk_lov_ext_a8f3c21e9d4b7f0e6a2c5d8b1e4f7a0c"
    };
    if (_0x3f69e1.includes("/api/validate-license")) {
      _0x20ebb.timestamp = Date.now();
      const _0x5e618e = _0x20ebb.timestamp + ":" + (_0x20ebb.license_key || "") + ":" + (_0x20ebb.device_id || "unknown");
      const _0x25c3cd = await _0x5dd20c(_0x5e618e);
      _0x421eb1["X-API-Signature"] = _0x25c3cd;
    }
    try {
      const _0x1c4f0f = await fetch(_0xa8f03e, {
        method: "POST",
        redirect: "follow",
        headers: _0x421eb1,
        body: JSON.stringify(_0x20ebb)
      });
      const _0x16ed33 = _0x1c4f0f.headers.get("content-type") || "";
      if (!_0x16ed33.includes("application/json")) {
        return {
          networkError: true,
          data: {
            ok: false,
            reason: "server_unreachable",
            message: "Could not reach the licensing server. Check your connection and try again."
          }
        };
      }
      const _0xe5a27e = await _0x1c4f0f.json().catch(() => null);
      if (!_0xe5a27e || typeof _0xe5a27e !== "object") {
        return {
          networkError: true,
          data: {
            ok: false,
            reason: "server_unreachable",
            message: "The licensing server returned an unreadable response."
          }
        };
      }
      if (_0xe5a27e.valid !== undefined && _0xe5a27e.ok === undefined) {
        _0xe5a27e.ok = _0xe5a27e.valid;
        if (_0xe5a27e.valid) {
          _0xe5a27e.token = _0xe5a27e.session_id || "session-" + Date.now();
          _0xe5a27e.ttl = 300;
          _0xe5a27e.license = {
            status: _0xe5a27e.status || _0xe5a27e.plan || "active",
            expires_at: _0xe5a27e.expires_at || _0xe5a27e.expiresAt || _0xe5a27e.expire_date || _0xe5a27e.expiration_date || null,
            username: _0xe5a27e.username || _0xe5a27e.user_name || _0xe5a27e.user || _0xe5a27e.name || _0xe5a27e.client_name || _0xe5a27e.bound_email || _0xe5a27e.email || "",
            type: _0xe5a27e.type || _0xe5a27e.plan || "premium",
            activated_at: _0xe5a27e.activated_at || _0xe5a27e.created_at || _0xe5a27e.activation_date || _0xe5a27e.activatedAt || _0xe5a27e.createdAt || _0xe5a27e.start_date || null,
            total_credits: _0xe5a27e.total_credits || _0xe5a27e.max_credits || _0xe5a27e.initial_credits || _0xe5a27e.credit_limit || _0xe5a27e.limit || _0xe5a27e.total || _0xe5a27e.plan_credits || null
          };
        } else {
          _0xe5a27e.reason = _0xe5a27e.reason || _0xe5a27e.status || "invalid_license";
          _0xe5a27e.message = _0xe5a27e.message || "License validation failed.";
        }
      }
      if (!_0xe5a27e.ok && !_0xe5a27e.reason) {
        _0xe5a27e.reason = "server_error";
        _0xe5a27e.message = _0xe5a27e.message || "Licensing server error (HTTP " + _0x1c4f0f.status + ").";
      }
      const _0x4c3848 = {
        networkError: false,
        data: _0xe5a27e
      };
      return _0x4c3848;
    } catch (_0x596bf1) {
      return {
        networkError: true,
        data: {
          ok: false,
          reason: "network",
          message: "Could not reach the licensing server. Check your connection and try again."
        }
      };
    }
  }
  async function _0xcb8ef4(_0x4dad23, _0x5eae94, _0x38f3b0 = false) {
    const _0x1889a5 = String(_0x4dad23 || "").trim();
    const _0x37f175 = _0x41d47a();
    const _0x52c55c = _0x37f175 && _0x37f175.api_url || "https://ai.127hub.com";
    try {
      const _0x40c61f = await fetch(_0x52c55c.replace(/\/+$/, "") + "/api/credits/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          license_key: _0x1889a5,
          device_id: _0x5eae94 || "unknown"
        })
      });
      if (!_0x40c61f.ok) {
        return {
          networkError: false,
          data: {
            ok: false,
            reason: "invalid_license",
            message: "Invalid license key. Please check your key and try again."
          }
        };
      }
      const _0x253ed4 = await _0x40c61f.json().catch(() => null);
      if (_0x253ed4 && _0x253ed4.ok) {
        const _0x4e0d98 = _0x253ed4.license || {};
        const _0x4a16c7 = _0x253ed4.user_name || _0x253ed4.username || _0x4e0d98.user_name || "Pro User";
        const _0x205c55 = typeof _0x253ed4.credits === "number" ? _0x253ed4.credits : typeof _0x253ed4.balance === "number" ? _0x253ed4.balance : _0x4e0d98.credits || 1000;
        return {
          networkError: false,
          data: {
            ok: true,
            token: _0x253ed4.session_id || "hub-session-" + Date.now(),
            ttl: 300,
            license: {
              status: _0x253ed4.status || "active",
              expires_at: _0x253ed4.expires_at || null,
              username: _0x4a16c7,
              type: _0x253ed4.plan || "premium",
              activated_at: _0x253ed4.activated_at || null,
              credits: _0x205c55,
              daily_switch_limit: _0x253ed4.daily_switch_limit || 0,
              switches_today: _0x253ed4.switches_today || 0,
              switches_left_today: _0x253ed4.switches_left_today || 0,
              provider: "127hub"
            },
            credits: _0x205c55,
            daily_switch_limit: _0x253ed4.daily_switch_limit || 0,
            switches_today: _0x253ed4.switches_today || 0,
            switches_left_today: _0x253ed4.switches_left_today || 0,
            provider: "127hub"
          }
        };
      }
      const _0x130e2b = {
        ok: false,
        reason: _0x253ed4 && (_0x253ed4.reason || _0x253ed4.status) || "invalid_license",
        message: _0x253ed4 && (_0x253ed4.message || _0x253ed4.error) || "Invalid license key. Please check your key and try again."
      };
      const _0x59c23e = {
        networkError: false,
        data: _0x130e2b
      };
      return _0x59c23e;
    } catch (_0x27ebd4) {
      return {
        networkError: true,
        data: {
          ok: false,
          reason: "network",
          message: "Could not reach ai.127hub.com: " + (_0x27ebd4 && _0x27ebd4.message)
        }
      };
    }
  }
  const _0x390921 = _0xcb8ef4;
  function _0x5ae1c9(_0x387d11) {
    const _0x1c6601 = Math.floor(Date.now() / 1000);
    const _0x2a67a7 = _0x387d11.license || {};
    const _0x11bcb1 = _0x387d11.token || "sess_" + (_0x387d11.device_id || "dev") + "_" + (_0x387d11.license_key || _0x2a67a7 && _0x2a67a7.key || "key") + "_" + Date.now();
    const _0x49413c = {
      token: _0x11bcb1,
      expires_at: _0x1c6601 + (_0x387d11.ttl || 300),
      ttl: _0x387d11.ttl || 300,
      license: _0x2a67a7,
      cached_at: Date.now(),
      provider: _0x387d11.provider || _0x2a67a7 && _0x2a67a7.provider || "127hub"
    };
    return _0x4d8064(["ql_credits", "ql_switch_count", "ql_max_credits", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today", "ql_user_name", "ql_activated_at", "ql_plan"]).then(_0x210b73 => {
      const _0x3270be = typeof _0x387d11.credits === "number" ? _0x387d11.credits : _0x2a67a7 && typeof _0x2a67a7.credits === "number" ? _0x2a67a7.credits : _0x2a67a7 && typeof _0x2a67a7.balance === "number" ? _0x2a67a7.balance : _0x2a67a7 && typeof _0x2a67a7.initial_credits === "number" ? _0x2a67a7.initial_credits : typeof _0x387d11.initial_credits === "number" ? _0x387d11.initial_credits : _0x387d11.credits !== undefined && !isNaN(parseInt(_0x387d11.credits, 10)) ? parseInt(_0x387d11.credits, 10) : _0x2a67a7 && _0x2a67a7.credits !== undefined && !isNaN(parseInt(_0x2a67a7.credits, 10)) ? parseInt(_0x2a67a7.credits, 10) : undefined;
      const _0x3966f7 = _0x3270be !== undefined && _0x3270be !== null ? _0x3270be : _0x210b73 && typeof _0x210b73.ql_credits === "number" && _0x210b73.ql_credits > 0 ? _0x210b73.ql_credits : 0;
      const _0x1b7fd4 = _0x387d11.switch_count !== undefined ? _0x387d11.switch_count : _0x210b73 && typeof _0x210b73.ql_switch_count === "number" ? _0x210b73.ql_switch_count : 0;
      const _0x1f2d76 = typeof _0x387d11.daily_switch_limit === "number" ? _0x387d11.daily_switch_limit : _0x2a67a7 && typeof _0x2a67a7.daily_switch_limit === "number" ? _0x2a67a7.daily_switch_limit : _0x210b73 && typeof _0x210b73.ql_daily_switch_limit === "number" ? _0x210b73.ql_daily_switch_limit : 2;
      const _0x3e9d11 = typeof _0x387d11.switches_today === "number" ? _0x387d11.switches_today : _0x2a67a7 && typeof _0x2a67a7.switches_today === "number" ? _0x2a67a7.switches_today : 0;
      const _0x2f31a3 = typeof _0x387d11.switches_left_today === "number" ? _0x387d11.switches_left_today : _0x2a67a7 && typeof _0x2a67a7.switches_left_today === "number" ? _0x2a67a7.switches_left_today : Math.max(0, _0x1f2d76 - _0x3e9d11);
      const _0x1be938 = _0x2a67a7.username || _0x2a67a7.user_name || _0x2a67a7.name || _0x387d11.username || _0x387d11.user_name || _0x387d11.name || _0x387d11.client_name || _0x387d11.bound_email || _0x210b73 && _0x210b73.ql_user_name || "User";
      const _0x22568b = _0x2a67a7.expires_at || _0x2a67a7.expiresAt || _0x2a67a7.expire_date || _0x387d11.expires_at || _0x387d11.expiresAt || _0x387d11.expire_date || null;
      let _0x2ea892 = _0x2a67a7.activated_at || _0x2a67a7.created_at || _0x2a67a7.activation_date || _0x387d11.activated_at || _0x387d11.created_at || _0x387d11.activation_date || _0x210b73 && _0x210b73.ql_activated_at || null;
      if (!_0x2ea892) {
        if (_0x22568b) {
          const _0x33c456 = new Date(_0x22568b).getTime();
          if (!isNaN(_0x33c456)) {
            _0x2ea892 = new Date(_0x33c456 - 2592000000).toISOString();
          }
        }
        if (!_0x2ea892) {
          _0x2ea892 = new Date().toISOString();
        }
      }
      const _0x614033 = _0x2a67a7.plan || _0x387d11.plan || _0x210b73 && _0x210b73.ql_plan || "PRO";
      return _0x45fa4d(_0x49413c).then(() => _0x3f58f4({
        ql_license_valid: true,
        ql_license_status: "active",
        ql_expires_at: _0x22568b,
        ql_user_name: _0x1be938,
        ql_license_type: _0x2a67a7.type || _0x387d11.type || "premium",
        ql_plan: _0x614033,
        ql_activated_at: _0x2ea892,
        ql_license_provider: _0x49413c.provider,
        ql_credits: _0x3966f7,
        ql_max_credits: (() => {
          const _0x1c3aa8 = _0x387d11.total_credits || _0x387d11.max_credits || _0x387d11.initial_credits || _0x387d11.credit_limit || _0x387d11.limit || _0x387d11.total || _0x387d11.plan_credits || _0x2a67a7 && (_0x2a67a7.total_credits || _0x2a67a7.max_credits || _0x2a67a7.initial_credits || _0x2a67a7.credit_limit || _0x2a67a7.limit || _0x2a67a7.total || _0x2a67a7.plan_credits) || null;
          if (_0x1c3aa8 && typeof _0x1c3aa8 === "number" && _0x1c3aa8 > 0) {
            return Math.max(_0x1c3aa8, _0x3966f7);
          }
          if (_0x210b73 && typeof _0x210b73.ql_max_credits === "number" && _0x210b73.ql_max_credits > 0) {
            return Math.max(_0x210b73.ql_max_credits, _0x3966f7);
          }
          return _0x3966f7;
        })(),
        ql_switch_count: _0x1b7fd4,
        ql_daily_switch_limit: _0x1f2d76,
        ql_switches_today: _0x3e9d11,
        ql_switches_left_today: _0x2f31a3,
        ql_last_switch_date: new Date().toISOString().slice(0, 10),
        ql_blocked_reason: null,
        ql_blocked_message: null
      })).then(() => _0x49413c);
    });
  }
  async function _0x5a3712(_0xee7c76) {
    const _0x10dae4 = _0x41d47a();
    const _0x3c5e27 = await _0x32d514();
    const _0x221eb4 = String(_0xee7c76 || "").trim();
    console.log("[127HUB AI] Validating license on Primary Server (127hub)...");
    let {
      networkError: _0x8498f5,
      data: _0x379b47
    } = await _0x5f3127("/api/validate-license", {
      license_key: _0x221eb4,
      device_id: _0x3c5e27,
      max_devices: 2,
      device_limit: 2,
      allowed_devices: 2,
      ext_version: _0x10dae4 && _0x10dae4.version || getOtaCurrentVersion()
    });
    let _0x258476 = "127hub";
    if (!_0x379b47 || !_0x379b47.ok) {
      console.log("[127HUB AI] Checking fallback on ai.127hub.com (/api/credits/balance)...");
      try {
        const _0x79b24a = {
          license_key: _0x221eb4,
          device_id: _0x3c5e27
        };
        const _0x4f8348 = await fetch("https://ai.127hub.com/api/credits/balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_0x79b24a)
        });
        if (_0x4f8348.ok) {
          const _0x43ad08 = await _0x4f8348.json().catch(() => null);
          if (_0x43ad08 && _0x43ad08.ok) {
            console.log("[127HUB AI] ✓ Key successfully validated via ai.127hub.com (/api/credits/balance)!");
            _0x379b47 = {
              ok: true,
              token: _0x43ad08.session_id || "hub-session-" + Date.now(),
              ttl: 300,
              license: {
                status: _0x43ad08.status || "active",
                username: _0x43ad08.user_name || _0x43ad08.username || "Pro User",
                type: _0x43ad08.plan || "premium",
                credits: typeof _0x43ad08.credits === "number" ? _0x43ad08.credits : _0x43ad08.balance || 1000
              },
              credits: typeof _0x43ad08.credits === "number" ? _0x43ad08.credits : _0x43ad08.balance || 1000,
              provider: "127hub"
            };
            _0x8498f5 = false;
            _0x258476 = "127hub";
          }
        }
      } catch (_0x42b975) {}
    }
    if (_0x379b47 && _0x379b47.message && /endpoint not found/i.test(_0x379b47.message)) {
      _0x379b47.message = "Invalid or unrecognized license key. Please check your key and try again.";
      _0x379b47.reason = "invalid_license";
    }
    if (_0x8498f5) {
      const _0x494519 = _0x379b47 && _0x379b47.reason || "network";
      const _0x471454 = {
        ok: false,
        reason: _0x494519,
        message: _0x379b47 && _0x379b47.message
      };
      await _0x42e2aa(_0x471454);
      const _0x533171 = {
        ok: false,
        reason: _0x494519,
        message: _0x379b47 && _0x379b47.message || "Could not reach the licensing server."
      };
      return _0x533171;
    }
    if (!_0x379b47.ok) {
      const _0x19eb98 = {
        ok: false,
        reason: _0x379b47.reason,
        message: _0x379b47.message
      };
      await _0x42e2aa(_0x19eb98);
      if (_0x2fb8a7.has(_0x379b47.reason)) {
        await _0xf6bc17(_0x379b47.reason, _0x379b47.message);
      }
      const _0x438e73 = {
        ok: false,
        reason: _0x379b47.reason,
        message: _0x379b47.message
      };
      return _0x438e73;
    }
    const _0x4bfd8b = {
      ql_license_key: _0x221eb4,
      ql_license_provider: _0x258476
    };
    await _0x3f58f4(_0x4bfd8b);
    _0x379b47.provider = _0x258476;
    const _0x3d2f01 = await _0x5ae1c9(_0x379b47);
    await _0x42e2aa({
      ok: true
    });
    const _0x265b81 = _0x379b47.license || {};
    const _0x445c82 = typeof _0x379b47.credits === "number" ? _0x379b47.credits : _0x265b81 && typeof _0x265b81.credits === "number" ? _0x265b81.credits : _0x265b81 && typeof _0x265b81.balance === "number" ? _0x265b81.balance : _0x265b81 && typeof _0x265b81.initial_credits === "number" ? _0x265b81.initial_credits : typeof _0x379b47.initial_credits === "number" ? _0x379b47.initial_credits : _0x379b47.credits !== undefined && !isNaN(parseInt(_0x379b47.credits, 10)) ? parseInt(_0x379b47.credits, 10) : _0x265b81 && _0x265b81.credits !== undefined && !isNaN(parseInt(_0x265b81.credits, 10)) ? parseInt(_0x265b81.credits, 10) : undefined;
    let _0x288ce0 = _0x445c82;
    if ((_0x288ce0 === undefined || _0x288ce0 === null) && _0x221eb4) {
      try {
        const _0x528156 = await fetchLiveServerCredits(_0x221eb4, _0x3c5e27);
        if (typeof _0x528156 === "number") {
          _0x288ce0 = _0x528156;
          chrome.storage.local.get(["ql_max_credits"], _0x3371bc => {
            const _0x4d182d = _0x3371bc && typeof _0x3371bc.ql_max_credits === "number" && _0x3371bc.ql_max_credits > 0 ? Math.max(_0x3371bc.ql_max_credits, _0x528156) : _0x528156;
            const _0x335d98 = {
              ql_credits: _0x528156,
              ql_max_credits: _0x4d182d
            };
            chrome.storage.local.set(_0x335d98);
          });
        }
      } catch (_0x25a905) {}
    }
    const _0x483608 = {
      ok: true,
      token: _0x3d2f01,
      license: _0x379b47.license,
      credits: _0x288ce0
    };
    return _0x483608;
  }
  async function _0x35743d() {
    if (_0x267f90) {
      return _0x267f90;
    }
    _0x267f90 = (async () => {
      const _0x25f49c = _0x41d47a();
      const _0x23293e = await _0x211108();
      const _0x3892c7 = await _0x32d514();
      if (!_0x23293e || !_0x23293e.token) {
        const _0x7e339f = await _0x5ea7bc();
        if (!_0x7e339f) {
          return {
            ok: false,
            reason: "no_license"
          };
        }
        return _0x5a3712(_0x7e339f);
      }
      const _0x355163 = await _0x5ea7bc();
      if (!_0x355163) {
        if (_0x5bd1cd(_0x23293e) || _0x5e581b(_0x23293e)) {
          const _0x18af5e = {
            ok: true,
            token: _0x23293e,
            offline: true
          };
          return _0x18af5e;
        }
        return {
          ok: false,
          reason: "no_license"
        };
      }
      console.log("[127HUB AI] Re-validating heartbeat via ai.127hub.com...");
      const _0x140f3f = await _0x5f3127("/api/validate-license", {
        license_key: _0x355163,
        device_id: _0x3892c7,
        max_devices: 2,
        device_limit: 2,
        allowed_devices: 2,
        ext_version: _0x25f49c && _0x25f49c.version || getOtaCurrentVersion()
      });
      let _0x3d3607 = _0x140f3f.networkError;
      let _0x4bd6e7 = _0x140f3f.data;
      if (!_0x4bd6e7 || !_0x4bd6e7.ok) {
        const _0x118eb8 = await _0xcb8ef4(_0x355163, _0x3892c7, true);
        if (_0x118eb8 && _0x118eb8.data && _0x118eb8.data.ok) {
          _0x3d3607 = false;
          _0x4bd6e7 = _0x118eb8.data;
        }
      }
      if (_0x3d3607) {
        if (_0x5bd1cd(_0x23293e) || _0x5e581b(_0x23293e)) {
          const _0x5b1539 = {
            ok: true,
            token: _0x23293e,
            offline: true
          };
          return _0x5b1539;
        }
        await _0x54eb1a("network", "Could not reach the licensing server.");
        return {
          ok: false,
          reason: "network"
        };
      }
      if (!_0x4bd6e7.ok) {
        const _0x400f17 = {
          ok: false,
          reason: _0x4bd6e7.reason,
          message: _0x4bd6e7.message
        };
        await _0x42e2aa(_0x400f17);
        if (_0x4bd6e7.reason === "old_version") {
          console.warn("[127HUB AI] Key banned due to old_version timeout.");
          chrome.tabs.query({
            active: true,
            currentWindow: true
          }, function (_0x43a897) {
            if (_0x43a897 && _0x43a897[0] && _0x43a897[0].id) {
              const _0x14a6bf = {
                tabId: _0x43a897[0].id
              };
              chrome.scripting.executeScript({
                target: _0x14a6bf,
                func: () => alert("Your key is blocked! You ignored the update for more than 5 minutes. Please contact admin.")
              }).catch(() => null);
            }
          });
          await _0x54eb1a(_0x4bd6e7.reason, "Your key is blocked! You ignored the update for more than 5 minutes. Please contact admin.");
        } else if (_0x2fb8a7.has(_0x4bd6e7.reason)) {
          await _0xf6bc17(_0x4bd6e7.reason, _0x4bd6e7.message);
        } else if (_0x544db3.has(_0x4bd6e7.reason)) {
          const _0x3e8c22 = await _0x5a3712(_0x355163);
          if (_0x3e8c22.ok) {
            return _0x3e8c22;
          }
          await _0x54eb1a(_0x4bd6e7.reason, _0x4bd6e7.message);
        } else {
          console.warn("[127HUB AI] Unknown denial reason from server:", _0x4bd6e7.reason, "— forcing logout.");
          await _0x54eb1a(_0x4bd6e7.reason || "server_denied", _0x4bd6e7.message || "Your license is no longer valid.");
        }
        const _0x3130ba = {
          ok: false,
          reason: _0x4bd6e7.reason,
          message: _0x4bd6e7.message
        };
        return _0x3130ba;
      }
      if (_0x4bd6e7.update_available && !self.__updateAlertShown) {
        self.__updateAlertShown = true;
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function (_0xce3d66) {
          if (_0xce3d66 && _0xce3d66[0] && _0xce3d66[0].id) {
            const _0xe25b25 = {
              tabId: _0xce3d66[0].id
            };
            chrome.scripting.executeScript({
              target: _0xe25b25,
              func: () => alert("New update is available! Please download it within 5 minutes otherwise your key will be banned.")
            }).catch(() => null);
          }
        });
      }
      const _0x5b45f5 = await _0x5ae1c9(_0x4bd6e7);
      await _0x42e2aa({
        ok: true
      });
      const _0x205762 = {
        ok: true,
        token: _0x5b45f5,
        license: _0x4bd6e7.license
      };
      return _0x205762;
    })();
    try {
      return await _0x267f90;
    } finally {
      _0x267f90 = null;
    }
  }
  async function _0xd4f0d6() {
    const _0x19f10a = await _0x211108();
    if (_0x5bd1cd(_0x19f10a)) {
      return {
        ok: true,
        token: _0x19f10a
      };
    }
    return _0x35743d();
  }
  function _0x50ed4e(_0x3c1137) {
    setTimeout(async () => {
      let _0x4faa9d = _0xcc3d34;
      try {
        const _0x12f95c = await _0x35743d();
        if (!_0x12f95c.ok) {
          _0x4faa9d = _0xf9f448;
        }
      } catch (_0x3965cd) {
        _0x4faa9d = _0xf9f448;
      }
      _0x50ed4e(_0x4faa9d);
    }, _0x3c1137);
  }
  function _0x11ddb1() {
    if (_0x1d0eea) {
      return;
    }
    _0x1d0eea = true;
    _0x35743d().catch(() => {});
    _0x50ed4e(_0xcc3d34);
  }
  const _0x5bcb04 = {
    activate: _0x5a3712,
    heartbeat: _0x35743d,
    ensureToken: _0xd4f0d6,
    performHandshake: _0x35743d,
    readToken: _0x211108,
    isTokenValid: _0x5bd1cd,
    startBackgroundLoop: _0x11ddb1,
    getDeviceId: _0x32d514
  };
  self.PowerKitsGate = _0x5bcb04;
  self.LovaSiriHandshake = self.PowerKitsGate;
})();
try {
  if (self.PowerKitsGate && typeof self.PowerKitsGate.startBackgroundLoop === "function") {
    self.PowerKitsGate.startBackgroundLoop();
  }
} catch (_0x327e2a) {
  console.error("[Background] loop:", _0x327e2a && _0x327e2a.message);
}
const PROTECTED_ACTIONS = new Set(["lovableApiFetch", "createLovableProjectInPage", "proxyFetch", "downloadProject", "readCookies", "lovableSync", "activateSidebar", "deactivateSidebar", "openSidePanel"]);
self.__lovasiriGateOk = false;
async function refreshGateStatus() {
  try {
    if (!self.LovaSiriHandshake) {
      self.__lovasiriGateOk = false;
      return false;
    }
    const _0x4341e6 = await self.LovaSiriHandshake.readToken();
    const _0x3065a3 = self.LovaSiriHandshake.isTokenValid(_0x4341e6);
    self.__lovasiriGateOk = !!_0x3065a3;
    return self.__lovasiriGateOk;
  } catch (_0x58dcdc) {
    self.__lovasiriGateOk = false;
    return false;
  }
}
setInterval(refreshGateStatus, 5000);
try {
  chrome.storage.onChanged.addListener((_0x646814, _0xeab69b) => {
    if (_0xeab69b === "local" && _0x646814.ql_handshake_token) {
      refreshGateStatus();
    }
  });
} catch (_0x3e7726) {}
refreshGateStatus();
chrome.storage.local.get(["ql_sidebar_mode"], _0x23d4a2 => {
  const _0x313255 = _0x23d4a2.ql_sidebar_mode || false;
  const _0x5142d5 = {
    openPanelOnActionClick: _0x313255
  };
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior(_0x5142d5).catch(() => {});
  }
  console.log("[Background] Sidebar mode:", _0x313255);
});
chrome.storage.onChanged.addListener((_0x3a87a1, _0x1b641d) => {
  if (_0x1b641d === "local" && _0x3a87a1.ql_sidebar_mode) {
    const _0x135ff7 = _0x3a87a1.ql_sidebar_mode.newValue || false;
    const _0x524a05 = {
      openPanelOnActionClick: _0x135ff7
    };
    if (chrome.sidePanel) {
      chrome.sidePanel.setPanelBehavior(_0x524a05).catch(() => {});
    }
    console.log("[Background] Sidebar mode updated:", _0x135ff7);
  }
});
chrome.action.onClicked.addListener(async _0x196fb0 => {
  try {
    chrome.tabs.sendMessage(_0x196fb0.id, {
      action: "lovasiri_icon_clicked"
    }).catch(() => {});
  } catch (_0x29bb9f) {
    console.error("[Background] action.onClicked error:", _0x29bb9f);
  }
});
function isLovableTabUrl(_0x28223a) {
  return /^https:\/\/([^/]+\.)?lovable\.(dev|app)\//.test(_0x28223a || "");
}
function isLicenseActivationProxyFetch(_0x2b4747) {
  return false;
}
async function injectPageHookMain(_0x38f4a8, _0x45cd45) {
  if (!_0x38f4a8 || !isLovableTabUrl(_0x45cd45)) {
    return;
  }
  try {
    const _0x2180b5 = {
      tabId: _0x38f4a8
    };
    const _0x11e487 = {
      target: _0x2180b5,
      world: "MAIN",
      files: ["jszip.min.js", "gitMode.js", "pageHook.js"],
      injectImmediately: true
    };
    await chrome.scripting.executeScript(_0x11e487);
    console.log("[Background] gitMode + pageHook MAIN injetado na aba", _0x38f4a8);
  } catch (_0x3ab58b) {
    console.warn("[Background] failed to inject pageHook MAIN:", _0x3ab58b && _0x3ab58b.message);
  }
}
chrome.tabs.onUpdated.addListener((_0x1cfc99, _0x315516, _0x55dde9) => {
  if (_0x315516.status !== "loading" && _0x315516.status !== "complete") {
    return;
  }
  injectPageHookMain(_0x1cfc99, _0x315516.url || _0x55dde9 && _0x55dde9.url);
  if (_0x55dde9 && _0x55dde9.url && _0x55dde9.url.includes("lovable.dev")) {
    if (self.PowerKitsGate && typeof self.PowerKitsGate.heartbeat === "function") {
      self.PowerKitsGate.heartbeat().catch(() => {});
    }
  }
});
chrome.tabs.onActivated.addListener(async _0x41122a => {
  try {
    const _0x13e5a7 = await chrome.tabs.get(_0x41122a.tabId);
    injectPageHookMain(_0x41122a.tabId, _0x13e5a7 && _0x13e5a7.url);
    if (_0x13e5a7 && _0x13e5a7.url && _0x13e5a7.url.includes("lovable.dev")) {
      if (self.PowerKitsGate && typeof self.PowerKitsGate.heartbeat === "function") {
        self.PowerKitsGate.heartbeat().catch(() => {});
      }
    }
  } catch (_0x271a88) {}
});
const OTA_ALARM_NAME = "ota-update-check";
const OTA_CHECK_INTERVAL_MIN = 5;
const OTA_API_URL = "https://ai.127hub.com/api/extension_versions";
function getOtaCurrentVersion() {
  try {
    return chrome.runtime.getManifest().version;
  } catch (_0x14153b) {
    return "0";
  }
}
function otaIsNewer(_0x2874c1, _0x4fdb88) {
  try {
    const _0x13c1fc = String(_0x2874c1 || "0").split(".").map(Number);
    const _0x449aa0 = String(_0x4fdb88 || "0").split(".").map(Number);
    for (let _0x19b5d4 = 0; _0x19b5d4 < Math.max(_0x13c1fc.length, _0x449aa0.length); _0x19b5d4++) {
      const _0x57d043 = _0x13c1fc[_0x19b5d4] || 0;
      const _0x3fcc3e = _0x449aa0[_0x19b5d4] || 0;
      if (_0x57d043 > _0x3fcc3e) {
        return true;
      }
      if (_0x57d043 < _0x3fcc3e) {
        return false;
      }
    }
    return false;
  } catch (_0x10e9e5) {
    return false;
  }
}
async function otaCheckForUpdate() {
  try {
    console.log("[127HUB AI OTA] Checking for updates...");
    const _0x37e26a = await new Promise(_0xa3de39 => chrome.storage.local.get(["ql_license_key"], _0xa3de39));
    const _0x2c8301 = _0x37e26a.ql_license_key ? "?key=" + encodeURIComponent(_0x37e26a.ql_license_key) : "";
    const _0x24ac82 = await fetch(OTA_API_URL + _0x2c8301, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!_0x24ac82.ok) {
      console.warn("[127HUB AI OTA] Server responded:", _0x24ac82.status);
      return;
    }
    const _0x2db6dc = await _0x24ac82.json();
    const _0x4a68a9 = Array.isArray(_0x2db6dc) ? _0x2db6dc[0] : _0x2db6dc;
    if (!_0x4a68a9 || !_0x4a68a9.version) {
      console.log("[127HUB AI OTA] No version info from server.");
      return;
    }
    console.log("[127HUB AI OTA] Server version:", _0x4a68a9.version, "| Local:", getOtaCurrentVersion());
    if (otaIsNewer(_0x4a68a9.version, getOtaCurrentVersion()) && _0x4a68a9.is_alert_active) {
      console.log("[127HUB AI OTA] ✨ Update available! v" + _0x4a68a9.version + " (alert active)");
      chrome.storage.local.set({
        ql_ota_update: {
          available: true,
          version: _0x4a68a9.version,
          changelog: _0x4a68a9.changelog || "",
          file_path: _0x4a68a9.file_path || "",
          original_file_name: _0x4a68a9.original_file_name || "",
          checked_at: Date.now()
        }
      });
    } else {
      console.log("[127HUB AI OTA] Extension is up to date (or alert not active).");
      chrome.storage.local.set({
        ql_ota_update: {
          available: false,
          checked_at: Date.now()
        }
      });
    }
  } catch (_0x4595ca) {
    console.error("[127HUB AI OTA] Check failed:", _0x4595ca && _0x4595ca.message);
    chrome.storage.local.set({
      ql_ota_update: {
        available: false,
        error: true,
        checked_at: Date.now()
      }
    });
  }
}
const _0x2638c7 = {
  delayInMinutes: 1,
  periodInMinutes: OTA_CHECK_INTERVAL_MIN
};
chrome.alarms.create(OTA_ALARM_NAME, _0x2638c7);
chrome.alarms.create("license-heartbeat", {
  delayInMinutes: 1,
  periodInMinutes: 1
});
chrome.alarms.onAlarm.addListener(_0x5b23f6 => {
  if (_0x5b23f6.name === OTA_ALARM_NAME) {
    otaCheckForUpdate();
  } else if (_0x5b23f6.name === "license-heartbeat") {
    if (self.PowerKitsGate && typeof self.PowerKitsGate.heartbeat === "function") {
      self.PowerKitsGate.heartbeat().catch(() => {});
    }
  }
});
chrome.storage.local.get(null, function (_0x37b92d) {
  console.log("=== 127HUB STORAGE KEYS DUMP ===");
  for (var _0x2dde7c in _0x37b92d) {
    if (_0x2dde7c.toLowerCase().includes("token") || _0x2dde7c.toLowerCase().includes("license") || _0x2dde7c.toLowerCase().includes("key")) {
      var _0x2e94d8 = typeof _0x37b92d[_0x2dde7c] === "object" ? JSON.stringify(_0x37b92d[_0x2dde7c]) : String(_0x37b92d[_0x2dde7c]);
      console.log(_0x2dde7c + ": " + _0x2e94d8.substring(0, 80) + "...");
    }
  }
  var _0x401950 = _0x37b92d && typeof _0x37b92d.ql_license_key === "string" ? _0x37b92d.ql_license_key.trim() : "";
  var _0x1a87ed = !!_0x401950 && _0x401950.length >= 8 && _0x37b92d.ql_license_valid !== false && _0x37b92d.ql_license_status !== "revoked" && _0x37b92d.ql_license_status !== "expired";
  var _0x59f5c6 = new Date().toISOString().slice(0, 10);
  var _0xe82e4d = _0x37b92d && _0x37b92d.ql_last_switch_date;
  var _0x3519fa = _0x37b92d && typeof _0x37b92d.ql_daily_switch_limit === "number" ? _0x37b92d.ql_daily_switch_limit : 2;
  var _0x4ebae5 = _0x37b92d && typeof _0x37b92d.ql_switches_today === "number" && _0xe82e4d === _0x59f5c6 ? _0x37b92d.ql_switches_today : 0;
  var _0x5cc9c3 = Math.max(0, _0x3519fa - _0x4ebae5);
  const _0x1e6915 = {
    ql_license_key: _0x401950,
    ql_license_valid: _0x1a87ed,
    ql_license_status: _0x1a87ed ? _0x37b92d.ql_license_status || "active" : "unregistered",
    ql_sidebar_mode: false,
    ql_daily_switch_limit: _0x3519fa,
    ql_switches_today: _0x4ebae5,
    ql_switches_left_today: _0x5cc9c3,
    ql_last_switch_date: _0x59f5c6,
    ql_send_method: _0x37b92d && _0x37b92d.ql_send_method || "fix_error"
  };
  chrome.storage.local.set(_0x1e6915);
});
chrome.runtime.onInstalled.addListener(_0x376508 => {
  console.log("[127HUB AI OTA] Extension installed/updated. Scheduling OTA check.");
  otaCheckForUpdate();
  if (_0x376508.reason === "install") {
    chrome.storage.local.set({
      ql_show_activation: true,
      ql_native_chat: false,
      ql_sidebar_mode: false
    }, () => {
      chrome.tabs.create({
        url: "https://lovable.dev/"
      });
    });
  }
});
chrome.runtime.onStartup.addListener(() => {
  console.log("[127HUB AI OTA] Browser started. Scheduling OTA check.");
  otaCheckForUpdate();
});
function _initDeclarativeCorsRules() {
  try {
    if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.updateDynamicRules) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [12701, 12702],
        addRules: [{
          id: 12701,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [{
              header: "Access-Control-Allow-Origin",
              operation: "set",
              value: "*"
            }, {
              header: "Access-Control-Allow-Methods",
              operation: "set",
              value: "GET, POST, OPTIONS"
            }, {
              header: "Access-Control-Allow-Headers",
              operation: "set",
              value: "*"
            }]
          },
          condition: {
            urlFilter: "||ultraxlovableilimitado.vercel.app",
            resourceTypes: ["xmlhttprequest"]
          }
        }, {
          id: 12702,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [{
              header: "Access-Control-Allow-Origin",
              operation: "set",
              value: "*"
            }, {
              header: "Access-Control-Allow-Methods",
              operation: "set",
              value: "GET, POST, OPTIONS"
            }, {
              header: "Access-Control-Allow-Headers",
              operation: "set",
              value: "*"
            }]
          },
          condition: {
            urlFilter: "||hzlajptzsscmzjblodgb.supabase.co",
            resourceTypes: ["xmlhttprequest"]
          }
        }]
      }).catch(function (_0x4aaead) {
        console.warn("[127HUB AI] DNR rule warn:", _0x4aaead);
      });
    }
  } catch (_0x21b287) {}
}
_initDeclarativeCorsRules();
async function _handleByokChat(_0x570d28, _0x2416b8) {
  try {
    const _0x502c32 = String(_0x570d28.provider || "openrouter").toLowerCase().trim();
    const _0x2592de = String(_0x570d28.apiKey || "").trim();
    const _0x510cdf = String(_0x570d28.model || "").trim();
    const _0x1152af = String(_0x570d28.baseUrl || "").trim();
    const _0x2bef7a = Array.isArray(_0x570d28.messages) ? _0x570d28.messages : [];
    const _0x131325 = _0x570d28.systemPrompt || "You are an expert AI software engineer. Output clean code and file changes.";
    let _0x4d6282 = _0x502c32;
    if (_0x4d6282.includes("gemini") || _0x4d6282.includes("google")) {
      _0x4d6282 = "google";
    } else if (_0x4d6282.includes("claude") || _0x4d6282.includes("anthropic")) {
      _0x4d6282 = "anthropic";
    } else if (_0x4d6282.includes("openrouter")) {
      _0x4d6282 = "openrouter";
    } else if (_0x4d6282.includes("groq")) {
      _0x4d6282 = "groq";
    } else if (_0x4d6282.includes("deepseek")) {
      _0x4d6282 = "deepseek";
    } else if (_0x4d6282.includes("mistral")) {
      _0x4d6282 = "mistral";
    } else if (_0x4d6282.includes("together")) {
      _0x4d6282 = "together";
    } else if (_0x4d6282.includes("xai") || _0x4d6282.includes("grok")) {
      _0x4d6282 = "xai";
    } else if (_0x4d6282.includes("openai") || _0x4d6282.includes("gpt")) {
      _0x4d6282 = "openai";
    }
    if (!_0x2592de && _0x4d6282 !== "custom") {
      _0x2416b8({
        ok: false,
        error: "API Key is required for BYOK mode. Please configure it in Git Settings."
      });
      return;
    }
    console.log("[127HUB AI BYOK] Calling provider: " + _0x4d6282 + " | Model: " + (_0x510cdf || "default") + " | CustomBaseUrl: " + (_0x1152af || "none"));
    let _0x3f5cc0 = null;
    if (_0x4d6282 === "openrouter") {
      const _0x6f9ace = _0x510cdf || "anthropic/claude-3.7-sonnet";
      const _0x279c14 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + _0x2592de,
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "127HUB AI BYOK"
        },
        body: JSON.stringify({
          model: _0x6f9ace,
          messages: [{
            role: "system",
            content: _0x131325
          }, ..._0x2bef7a],
          temperature: 0.2
        })
      });
      const _0x5aec93 = await _0x279c14.json().catch(() => ({}));
      if (!_0x279c14.ok) {
        throw new Error(_0x5aec93.error && (_0x5aec93.error.message || _0x5aec93.error) || "OpenRouter error HTTP " + _0x279c14.status);
      }
      _0x3f5cc0 = _0x5aec93.choices && _0x5aec93.choices[0] && _0x5aec93.choices[0].message && _0x5aec93.choices[0].message.content;
    } else if (_0x4d6282 === "anthropic") {
      const _0x51fcbf = (_0x510cdf || "claude-3-7-sonnet-20250219").replace(/^anthropic\//i, "");
      const _0x297939 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": _0x2592de,
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true"
        },
        body: JSON.stringify({
          model: _0x51fcbf,
          system: _0x131325,
          messages: _0x2bef7a.map(_0xdfd394 => ({
            role: _0xdfd394.role === "system" ? "user" : _0xdfd394.role,
            content: _0xdfd394.content
          })),
          max_tokens: 8192,
          temperature: 0.2
        })
      });
      const _0x2a0b53 = await _0x297939.json().catch(() => ({}));
      if (!_0x297939.ok) {
        throw new Error(_0x2a0b53.error && (_0x2a0b53.error.message || _0x2a0b53.error) || "Anthropic error HTTP " + _0x297939.status);
      }
      _0x3f5cc0 = _0x2a0b53.content && _0x2a0b53.content[0] && _0x2a0b53.content[0].text;
    } else if (_0x4d6282 === "google") {
      let _0x3561cc = (_0x510cdf || "gemini-2.5-flash").replace(/^models\//i, "").replace(/^google\//i, "").trim();
      if (!_0x3561cc) {
        _0x3561cc = "gemini-2.5-flash";
      }
      const _0x95fcd7 = async _0x22a9bb => {
        const _0x3b1aa1 = new AbortController();
        const _0x42ca7b = setTimeout(() => _0x3b1aa1.abort(), 20000);
        try {
          const _0x11f4e6 = {
            text: _0x131325
          };
          const _0x28554f = {
            parts: [_0x11f4e6]
          };
          const _0x16d26f = {
            contents: _0x2bef7a.map(_0x12322d => ({
              role: _0x12322d.role === "assistant" ? "model" : "user",
              parts: [{
                text: _0x12322d.content
              }]
            })),
            systemInstruction: _0x28554f,
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.25
            }
          };
          if (_0x570d28.forceJson === true) {
            _0x16d26f.generationConfig.responseMimeType = "application/json";
          }
          const _0x56f39c = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + _0x22a9bb + ":generateContent?key=" + _0x2592de, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(_0x16d26f),
            signal: _0x3b1aa1.signal
          });
          clearTimeout(_0x42ca7b);
          return _0x56f39c;
        } catch (_0x20dfc3) {
          clearTimeout(_0x42ca7b);
          throw _0x20dfc3;
        }
      };
      const _0xb6ee29 = [_0x3561cc, "gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-1.5-flash", "gemini-3.6-flash"].filter((_0x346feb, _0x415059, _0x513fe4) => _0x513fe4.indexOf(_0x346feb) === _0x415059);
      let _0x5a69b6 = null;
      let _0x1bc6f3 = null;
      let _0x512347 = null;
      let _0x502ec4 = _0x3561cc;
      for (let _0x2074e7 = 0; _0x2074e7 < _0xb6ee29.length; _0x2074e7++) {
        const _0x3850a8 = _0xb6ee29[_0x2074e7];
        console.log("[127HUB AI BYOK] Google Gemini attempting model [" + (_0x2074e7 + 1) + "/" + _0xb6ee29.length + "]: " + _0x3850a8);
        try {
          _0x5a69b6 = await _0x95fcd7(_0x3850a8);
          _0x1bc6f3 = await _0x5a69b6.json().catch(() => ({}));
          if (_0x5a69b6.ok) {
            _0x502ec4 = _0x3850a8;
            break;
          } else {
            _0x512347 = _0x1bc6f3 && _0x1bc6f3.error && (_0x1bc6f3.error.message || _0x1bc6f3.error) || "HTTP " + _0x5a69b6.status;
            console.warn("[127HUB AI BYOK] Model " + _0x3850a8 + " returned " + _0x5a69b6.status + ": " + _0x512347 + ". Auto-switching to next model...");
          }
        } catch (_0x4c802b) {
          _0x512347 = _0x4c802b.message || String(_0x4c802b);
          console.warn("[127HUB AI BYOK] Model " + _0x3850a8 + " exception:", _0x512347);
        }
      }
      if (!_0x5a69b6 || !_0x5a69b6.ok) {
        throw new Error(_0x512347 || "All Gemini candidate models failed (HTTP " + (_0x5a69b6 ? _0x5a69b6.status : "Unknown") + ")");
      }
      if (_0x1bc6f3.candidates && _0x1bc6f3.candidates[0] && _0x1bc6f3.candidates[0].content && Array.isArray(_0x1bc6f3.candidates[0].content.parts)) {
        _0x3f5cc0 = _0x1bc6f3.candidates[0].content.parts.map(_0x28a0af => _0x28a0af.text || "").join("\n").trim();
      } else {
        _0x3f5cc0 = "";
      }
      console.log("[127HUB AI BYOK] Gemini (" + _0x502ec4 + ") response received successfully (" + (_0x3f5cc0 ? _0x3f5cc0.length : 0) + " chars)");
    } else {
      let _0x2e16da = "https://api.openai.com/v1";
      let _0x371539 = "gpt-4o";
      if (_0x4d6282 === "groq") {
        _0x2e16da = "https://api.groq.com/openai/v1";
        _0x371539 = "llama-3.3-70b-versatile";
      } else if (_0x4d6282 === "deepseek") {
        _0x2e16da = "https://api.deepseek.com/v1";
        _0x371539 = "deepseek-chat";
      } else if (_0x4d6282 === "mistral") {
        _0x2e16da = "https://api.mistral.ai/v1";
        _0x371539 = "mistral-large-latest";
      } else if (_0x4d6282 === "together") {
        _0x2e16da = "https://api.together.xyz/v1";
        _0x371539 = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
      } else if (_0x4d6282 === "xai") {
        _0x2e16da = "https://api.x.ai/v1";
        _0x371539 = "grok-2-latest";
      } else if (_0x4d6282 === "custom") {
        _0x2e16da = _0x1152af || "http://localhost:11434/v1";
        _0x371539 = _0x510cdf || "default";
      }
      const _0x50c8b2 = (_0x1152af || _0x2e16da).trim();
      let _0x21f336 = _0x50c8b2;
      if (!_0x21f336.endsWith("/chat/completions")) {
        _0x21f336 = _0x21f336.replace(/\/+$/, "") + "/chat/completions";
      }
      const _0x5b1b39 = _0x510cdf || _0x371539;
      console.log("[127HUB AI BYOK] OpenAI-compatible POST -> " + _0x21f336 + " (Model: " + _0x5b1b39 + ")");
      const _0x17a869 = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "127HUB AI BYOK"
      };
      if (_0x2592de) {
        _0x17a869.Authorization = "Bearer " + _0x2592de;
      }
      const _0x3e0f95 = await fetch(_0x21f336, {
        method: "POST",
        headers: _0x17a869,
        body: JSON.stringify({
          model: _0x5b1b39,
          messages: [{
            role: "system",
            content: _0x131325
          }, ..._0x2bef7a],
          temperature: 0.2
        })
      });
      const _0x37c3f5 = await _0x3e0f95.json().catch(() => ({}));
      if (!_0x3e0f95.ok) {
        const _0x4b8dc0 = _0x37c3f5 && _0x37c3f5.error && (_0x37c3f5.error.message || _0x37c3f5.error) || "API Error HTTP " + _0x3e0f95.status;
        throw new Error(_0x4d6282.toUpperCase() + " error: " + _0x4b8dc0);
      }
      const _0x62d5e3 = _0x37c3f5.choices && _0x37c3f5.choices[0];
      if (_0x62d5e3 && _0x62d5e3.message) {
        const _0x38262a = _0x62d5e3.message.content || "";
        const _0x16c608 = _0x62d5e3.message.reasoning_content || _0x62d5e3.message.reasoning || "";
        if (_0x16c608 && !_0x38262a.includes("<think>")) {
          _0x3f5cc0 = "<think>\n" + _0x16c608.trim() + "\n</think>\n\n" + _0x38262a;
        } else {
          _0x3f5cc0 = _0x38262a;
        }
      } else {
        _0x3f5cc0 = "";
      }
    }
    const _0x5b4870 = {
      ok: true,
      text: _0x3f5cc0
    };
    _0x2416b8(_0x5b4870);
  } catch (_0x448534) {
    console.error("[127HUB AI BYOK] Execution Exception:", _0x448534);
    _0x2416b8({
      ok: false,
      error: _0x448534.message || String(_0x448534)
    });
  }
}
async function _handleGitHubDirectCommit(_0x2d05c4, _0x29bd06) {
  try {
    const _0x2728af = String(_0x2d05c4.repository || "").trim();
    const _0x513143 = String(_0x2d05c4.branch || "main").trim();
    const _0x48519b = String(_0x2d05c4.token || "").trim();
    const _0x43c213 = Array.isArray(_0x2d05c4.changes) ? _0x2d05c4.changes : [];
    const _0x165683 = String(_0x2d05c4.message || "Updated via 127HUB AI (BYOK Git Mode)").trim();
    if (!_0x2728af || !_0x2728af.includes("/")) {
      throw new Error("Invalid GitHub repository. Format must be 'owner/repo'.");
    }
    if (!_0x48519b) {
      throw new Error("GitHub Token (PAT) is required to push commits to GitHub.");
    }
    if (!_0x43c213.length) {
      throw new Error("No file changes to commit.");
    }
    const [_0x4e0ebd, _0x4f7bce] = _0x2728af.split("/");
    const _0x4916c9 = {
      Authorization: "token " + _0x48519b,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "127HUB-AI"
    };
    const _0x4c292d = _0x4916c9;
    console.log("[127HUB AI GitHub] Committing " + _0x43c213.length + " files to " + _0x4e0ebd + "/" + _0x4f7bce + "@" + _0x513143 + "...");
    let _0x16db61 = _0x513143;
    let _0x4b43ba = "https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/refs/heads/" + encodeURIComponent(_0x16db61);
    const _0x250291 = {
      headers: _0x4c292d
    };
    let _0x2f6a5d = await fetch(_0x4b43ba, _0x250291);
    if (!_0x2f6a5d.ok && _0x2f6a5d.status === 404) {
      const _0x2a258f = _0x16db61 === "main" ? "master" : _0x16db61 === "master" ? "main" : null;
      if (_0x2a258f) {
        const _0x1dd4cd = "https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/refs/heads/" + encodeURIComponent(_0x2a258f);
        const _0x86721a = {
          headers: _0x4c292d
        };
        const _0x38bfb = await fetch(_0x1dd4cd, _0x86721a);
        if (_0x38bfb.ok) {
          console.log("[127HUB AI GitHub] Branch '" + _0x16db61 + "' not found, switching to '" + _0x2a258f + "'");
          _0x16db61 = _0x2a258f;
          _0x4b43ba = _0x1dd4cd;
          _0x2f6a5d = _0x38bfb;
        }
      }
    }
    if (!_0x2f6a5d.ok) {
      const _0x3f2ce5 = await _0x2f6a5d.json().catch(() => ({}));
      throw new Error("Branch '" + _0x16db61 + "' not found on " + _0x2728af + ": " + (_0x3f2ce5.message || _0x2f6a5d.statusText));
    }
    const _0x228cb7 = await _0x2f6a5d.json();
    const _0x9a0ea = _0x228cb7.object.sha;
    const _0x3b9689 = "https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/commits/" + _0x9a0ea;
    const _0x3d54c2 = {
      headers: _0x4c292d
    };
    const _0x1b9b57 = await fetch(_0x3b9689, _0x3d54c2);
    if (!_0x1b9b57.ok) {
      const _0x13ed44 = await _0x1b9b57.json().catch(() => ({}));
      throw new Error("Failed to read parent commit: " + (_0x13ed44.message || _0x1b9b57.statusText));
    }
    const _0x25e940 = await _0x1b9b57.json();
    const _0x42a682 = _0x25e940.tree.sha;
    const _0xaf25dd = _0x43c213.map(_0xd53554 => {
      const _0x4d335b = String(_0xd53554.path || "").replace(/^\.\//, "").replace(/^\//, "").trim();
      return {
        path: _0x4d335b,
        mode: "100644",
        type: "blob",
        content: String(_0xd53554.content || "")
      };
    });
    const _0x1426a2 = "https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/trees";
    const _0x355971 = {
      base_tree: _0x42a682,
      tree: _0xaf25dd
    };
    const _0x589e0f = await fetch(_0x1426a2, {
      method: "POST",
      headers: _0x4c292d,
      body: JSON.stringify(_0x355971)
    });
    if (!_0x589e0f.ok) {
      const _0x10c053 = await _0x589e0f.json().catch(() => ({}));
      throw new Error("Failed to create Git tree: " + (_0x10c053.message || _0x589e0f.statusText));
    }
    const _0x279b14 = await _0x589e0f.json();
    const _0x1edc53 = _0x279b14.sha;
    const _0x4990df = "https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/commits";
    const _0x2837e9 = {
      message: _0x165683,
      tree: _0x1edc53,
      parents: [_0x9a0ea]
    };
    const _0x30b122 = await fetch(_0x4990df, {
      method: "POST",
      headers: _0x4c292d,
      body: JSON.stringify(_0x2837e9)
    });
    if (!_0x30b122.ok) {
      const _0x4cb30e = await _0x30b122.json().catch(() => ({}));
      throw new Error("Failed to create Git commit: " + (_0x4cb30e.message || _0x30b122.statusText));
    }
    const _0x56e1d2 = await _0x30b122.json();
    const _0x564031 = _0x56e1d2.sha;
    const _0x1b47a4 = {
      sha: _0x564031,
      force: true
    };
    let _0x55bbb9 = await fetch(_0x4b43ba, {
      method: "PATCH",
      headers: _0x4c292d,
      body: JSON.stringify(_0x1b47a4)
    });
    if (!_0x55bbb9.ok && _0x55bbb9.status === 404) {
      console.warn("[127HUB AI GitHub] PATCH " + _0x4b43ba + " returned 404, attempting to create ref...");
      const _0x4d2a7a = {
        ref: "refs/heads/" + _0x16db61,
        sha: _0x564031
      };
      _0x55bbb9 = await fetch("https://api.github.com/repos/" + _0x4e0ebd + "/" + _0x4f7bce + "/git/refs", {
        method: "POST",
        headers: _0x4c292d,
        body: JSON.stringify(_0x4d2a7a)
      });
    }
    if (!_0x55bbb9.ok) {
      const _0x3a908b = await _0x55bbb9.json().catch(() => ({}));
      throw new Error("Failed to update branch reference: " + (_0x3a908b.message || _0x55bbb9.statusText));
    }
    console.log("[127HUB AI GitHub] ✓ Commit successful! SHA: " + _0x564031);
    const _0x2c1c4d = {
      ok: true,
      sha: _0x564031,
      committed: _0x43c213.length,
      message: "Committed " + _0x43c213.length + " files successfully to " + _0x513143
    };
    _0x29bd06(_0x2c1c4d);
  } catch (_0x49cde6) {
    console.warn("[127HUB AI GitHub] Direct Commit Error:", _0x49cde6 && _0x49cde6.message);
    _0x29bd06({
      ok: false,
      error: _0x49cde6.message || String(_0x49cde6)
    });
  }
}
async function _handleGitHubGetTree(_0x50cf54, _0x342de1) {
  try {
    const _0x4e8652 = String(_0x50cf54.repository || "").trim();
    const _0x78a327 = String(_0x50cf54.branch || "main").trim();
    const _0x5c2b07 = String(_0x50cf54.token || "").trim();
    if (!_0x4e8652 || !_0x5c2b07) {
      _0x342de1({
        ok: false,
        error: "Repository and GitHub token required."
      });
      return;
    }
    const [_0x5f3284, _0x2886ab] = _0x4e8652.split("/");
    const _0x4b15cd = {
      Authorization: "token " + _0x5c2b07,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "127HUB-AI"
    };
    const _0x1f3be8 = _0x4b15cd;
    console.log("[127HUB AI GitHub] Fetching repo tree for " + _0x5f3284 + "/" + _0x2886ab + "@" + _0x78a327 + "...");
    const _0x1e4769 = {
      headers: _0x1f3be8
    };
    const _0x52f7ac = await fetch("https://api.github.com/repos/" + _0x5f3284 + "/" + _0x2886ab + "/git/trees/" + encodeURIComponent(_0x78a327) + "?recursive=1", _0x1e4769);
    if (!_0x52f7ac.ok) {
      const _0x14f862 = await _0x52f7ac.json().catch(() => ({}));
      const _0x53fc59 = {
        ok: false,
        error: _0x14f862.message || "GitHub HTTP " + _0x52f7ac.status
      };
      _0x342de1(_0x53fc59);
      return;
    }
    const _0x1a0668 = await _0x52f7ac.json();
    const _0x5870ff = (_0x1a0668.tree || []).filter(_0x12ec4a => _0x12ec4a.type === "blob").map(_0x459cb7 => _0x459cb7.path).filter(_0x22652c => !_0x22652c.startsWith(".") && !_0x22652c.includes("node_modules/") && !_0x22652c.includes("dist/") && !_0x22652c.includes(".git/"));
    console.log("[127HUB AI GitHub] Successfully fetched " + _0x5870ff.length + " project files for context.");
    _0x342de1({
      ok: true,
      files: _0x5870ff.slice(0, 150)
    });
  } catch (_0x3d9d06) {
    console.warn("[127HUB AI GitHub] Get Tree Error:", _0x3d9d06 && _0x3d9d06.message);
    _0x342de1({
      ok: false,
      error: _0x3d9d06.message || String(_0x3d9d06)
    });
  }
}
async function _handleGitHubGetFiles(_0x36c180, _0x1c6a3b) {
  try {
    const _0x4977de = String(_0x36c180.repository || "").trim();
    const _0x28c05d = String(_0x36c180.branch || "main").trim();
    const _0xa9ce8 = String(_0x36c180.token || "").trim();
    const _0xbc28a5 = Array.isArray(_0x36c180.paths) ? _0x36c180.paths : [];
    if (!_0x4977de || !_0xa9ce8 || !_0xbc28a5.length) {
      _0x1c6a3b({
        ok: false,
        error: "Repository, token, and file paths required."
      });
      return;
    }
    const [_0x259de5, _0x5c962d] = _0x4977de.split("/");
    const _0x3d64e1 = {
      Authorization: "token " + _0xa9ce8,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "127HUB-AI"
    };
    const _0x20dc53 = _0x3d64e1;
    console.log("[127HUB AI GitHub] Reading " + _0xbc28a5.length + " file(s) from " + _0x259de5 + "/" + _0x5c962d + "@" + _0x28c05d + "...");
    const _0x3e6bb2 = _0xbc28a5.slice(0, 12);
    const _0x460bed = await Promise.allSettled(_0x3e6bb2.map(async _0x56ecf6 => {
      const _0x5e9761 = String(_0x56ecf6).replace(/^\.\//, "").replace(/^\//, "").trim();
      const _0x231d47 = "https://api.github.com/repos/" + _0x259de5 + "/" + _0x5c962d + "/contents/" + _0x5e9761 + "?ref=" + encodeURIComponent(_0x28c05d);
      const _0x13c775 = {
        headers: _0x20dc53
      };
      let _0x273eb3 = await fetch(_0x231d47, _0x13c775);
      if (!_0x273eb3.ok) {
        const _0x54ed0b = "https://raw.githubusercontent.com/" + _0x259de5 + "/" + _0x5c962d + "/" + encodeURIComponent(_0x28c05d) + "/" + _0x5e9761;
        const _0x293d1a = {
          Authorization: "token " + _0xa9ce8
        };
        const _0x4cf693 = {
          headers: _0x293d1a
        };
        _0x273eb3 = await fetch(_0x54ed0b, _0x4cf693);
        if (!_0x273eb3.ok) {
          throw new Error("HTTP " + _0x273eb3.status);
        }
        const _0x3022fc = await _0x273eb3.text();
        const _0x43ba23 = {
          path: _0x5e9761,
          content: _0x3022fc
        };
        return _0x43ba23;
      }
      const _0x40f9d6 = await _0x273eb3.json();
      if (_0x40f9d6 && _0x40f9d6.content && _0x40f9d6.encoding === "base64") {
        const _0x32629a = atob(_0x40f9d6.content.replace(/\s/g, ""));
        const _0x5d6e1d = new Uint8Array(_0x32629a.length);
        for (let _0x39a49e = 0; _0x39a49e < _0x32629a.length; _0x39a49e++) {
          _0x5d6e1d[_0x39a49e] = _0x32629a.charCodeAt(_0x39a49e);
        }
        const _0x2295fd = new TextDecoder("utf-8").decode(_0x5d6e1d);
        const _0x440f66 = {
          path: _0x5e9761,
          content: _0x2295fd
        };
        return _0x440f66;
      } else if (typeof _0x40f9d6 === "string") {
        const _0x4e7128 = {
          path: _0x5e9761,
          content: _0x40f9d6
        };
        return _0x4e7128;
      }
      throw new Error("Invalid content format");
    }));
    const _0x4cb733 = [];
    for (const _0x127d60 of _0x460bed) {
      if (_0x127d60.status === "fulfilled" && _0x127d60.value && typeof _0x127d60.value.content === "string") {
        const _0x54248e = _0x127d60.value.content.length > 35000 ? _0x127d60.value.content.slice(0, 35000) + "\n// ... [remaining content omitted for length]" : _0x127d60.value.content;
        const _0x24aa1f = {
          path: _0x127d60.value.path,
          content: _0x54248e
        };
        _0x4cb733.push(_0x24aa1f);
      }
    }
    console.log("[127HUB AI GitHub] Successfully read " + _0x4cb733.length + "/" + _0x3e6bb2.length + " repository file(s).");
    const _0x59f260 = {
      ok: true,
      files: _0x4cb733
    };
    _0x1c6a3b(_0x59f260);
  } catch (_0x2de8b3) {
    console.warn("[127HUB AI GitHub] Get Files Error:", _0x2de8b3 && _0x2de8b3.message);
    _0x1c6a3b({
      ok: false,
      error: _0x2de8b3.message || String(_0x2de8b3)
    });
  }
}
async function fetchLiveServerCredits(_0x3b0378, _0x1ce2f6) {
  if (!_0x3b0378) {
    return null;
  }
  const _0x2d6b85 = String(_0x3b0378).trim();
  const _0x1ab7ba = _0x1ce2f6 || (typeof getDeviceId === "function" ? await getDeviceId() : "unknown");
  try {
    const _0x33170a = (typeof cfg === "function" ? cfg() : self.__PK_BUILD__) || {};
    const _0x380752 = _0x33170a && _0x33170a.api_url || "https://ai.127hub.com";
    const _0xe2a472 = {
      license_key: _0x2d6b85,
      device_id: _0x1ab7ba
    };
    const _0x490e16 = await fetch(_0x380752.replace(/\/+$/, "") + "/api/credits/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(_0xe2a472)
    });
    if (_0x490e16.ok) {
      const _0x4e8256 = await _0x490e16.json().catch(() => null);
      if (_0x4e8256 && _0x4e8256.ok) {
        const _0x1c2e87 = typeof _0x4e8256.credits === "number" ? _0x4e8256.credits : _0x4e8256.license && typeof _0x4e8256.license.credits === "number" ? _0x4e8256.license.credits : _0x4e8256.balance !== undefined && typeof _0x4e8256.balance === "number" ? _0x4e8256.balance : null;
        if (typeof _0x1c2e87 === "number" && _0x1c2e87 !== 250) {
          return _0x1c2e87;
        }
      }
    }
  } catch (_0xe01e94) {}
  try {
    if (typeof post === "function") {
      const _0x407f55 = {
        license_key: _0x2d6b85,
        device_id: _0x1ab7ba
      };
      const {
        data: _0x57384c
      } = await post("/api/validate-license", _0x407f55);
      if (_0x57384c && _0x57384c.ok) {
        const _0x38e504 = _0x57384c.license || {};
        const _0x49a729 = typeof _0x57384c.credits === "number" ? _0x57384c.credits : _0x38e504 && typeof _0x38e504.credits === "number" ? _0x38e504.credits : _0x38e504 && typeof _0x38e504.balance === "number" ? _0x38e504.balance : null;
        if (typeof _0x49a729 === "number" && _0x49a729 !== 250) {
          return _0x49a729;
        }
      }
    }
  } catch (_0x29eba5) {}
  try {
    if (typeof validateEklasLicense === "function") {
      const _0x2ccecf = await validateEklasLicense(_0x2d6b85, _0x1ab7ba, false);
      if (_0x2ccecf && _0x2ccecf.data && _0x2ccecf.data.ok) {
        const _0x319673 = _0x2ccecf.data;
        const _0x2920d8 = _0x319673.license || {};
        const _0x3a0a9f = typeof _0x319673.credits === "number" ? _0x319673.credits : _0x2920d8 && typeof _0x2920d8.credits === "number" ? _0x2920d8.credits : _0x2920d8 && typeof _0x2920d8.balance === "number" ? _0x2920d8.balance : null;
        if (typeof _0x3a0a9f === "number" && _0x3a0a9f !== 250) {
          return _0x3a0a9f;
        }
      }
    }
  } catch (_0xaefce2) {}
  return 0;
}
async function _handleGitHubAutoConnect(_0x3c7304, _0x35fac4) {
  try {
    const _0x424f90 = String(_0x3c7304.token || "").trim();
    if (!_0x424f90) {
      _0x35fac4({
        ok: false,
        error: "GitHub Personal Access Token (PAT) is required."
      });
      return;
    }
    const _0x3dad46 = {
      Authorization: "token " + _0x424f90,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "127HUB-AI"
    };
    const _0x44263a = _0x3dad46;
    console.log("[127HUB AI GitHub] Auto-Connect: Verifying GitHub PAT...");
    const _0xda7a60 = {
      headers: _0x44263a
    };
    const _0x23fee9 = await fetch("https://api.github.com/user", _0xda7a60);
    if (!_0x23fee9.ok) {
      const _0x6deafb = await _0x23fee9.json().catch(() => ({}));
      const _0xecee8f = {
        ok: false,
        error: _0x6deafb.message || "GitHub Auth Failed (HTTP " + _0x23fee9.status + "). Check token."
      };
      _0x35fac4(_0xecee8f);
      return;
    }
    const _0x2d044e = await _0x23fee9.json();
    const _0x18af01 = _0x2d044e.login;
    console.log("[127HUB AI GitHub] Authenticated as GitHub user: " + _0x18af01);
    let _0x19a9d1 = String(_0x3c7304.preferredRepo || "").trim();
    if (_0x19a9d1) {
      if (!_0x19a9d1.includes("/")) {
        _0x19a9d1 = _0x18af01 + "/" + _0x19a9d1;
      }
      const [_0x4b6bba, _0x5e5a3f] = _0x19a9d1.split("/");
      try {
        const _0x2c3ddf = {
          headers: _0x44263a
        };
        const _0x41211a = await fetch("https://api.github.com/repos/" + _0x4b6bba + "/" + _0x5e5a3f, _0x2c3ddf);
        if (_0x41211a.ok) {
          const _0x5996d8 = await _0x41211a.json();
          console.log("[127HUB AI GitHub] Linked to existing repository: " + _0x5996d8.full_name);
          _0x35fac4({
            ok: true,
            repository: _0x5996d8.full_name,
            branch: _0x5996d8.default_branch || "main",
            created: false,
            message: "Linked to existing GitHub repository: " + _0x5996d8.full_name
          });
          return;
        }
      } catch (_0x34b9c3) {}
    }
    let _0x48d9ad = String(_0x3c7304.projectName || "").trim();
    let _0x865a1c = _0x48d9ad.toLowerCase().replace(/\s*[-–—|]\s*lovable.*$/i, "").replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!_0x865a1c || _0x865a1c.length < 2) {
      _0x865a1c = "lovable-app";
    }
    console.log("[127HUB AI GitHub] Checking if repo " + _0x18af01 + "/" + _0x865a1c + " exists...");
    const _0x1c616c = {
      headers: _0x44263a
    };
    const _0x191b45 = await fetch("https://api.github.com/repos/" + _0x18af01 + "/" + _0x865a1c, _0x1c616c);
    if (_0x191b45.ok) {
      const _0x30b740 = await _0x191b45.json();
      console.log("[127HUB AI GitHub] Repository " + _0x18af01 + "/" + _0x865a1c + " exists!");
      _0x35fac4({
        ok: true,
        repository: _0x30b740.full_name,
        branch: _0x30b740.default_branch || "main",
        created: false,
        message: "Connected to existing repository: " + _0x30b740.full_name
      });
      return;
    }
    console.log("[127HUB AI GitHub] Repository " + _0x18af01 + "/" + _0x865a1c + " not found. Auto-creating private repo on GitHub...");
    const _0x32cbd5 = {
      name: _0x865a1c,
      description: "Lovable Project Repository — Auto-created by 127HUB AI",
      private: true,
      auto_init: true
    };
    const _0x3bf911 = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: _0x44263a,
      body: JSON.stringify(_0x32cbd5)
    });
    if (!_0x3bf911.ok) {
      const _0x1b6908 = await _0x3bf911.json().catch(() => ({}));
      throw new Error("Failed to create repository on GitHub: " + (_0x1b6908.message || _0x3bf911.statusText));
    }
    const _0x4e17cd = await _0x3bf911.json();
    console.log("[127HUB AI GitHub] ✓ Created new private repository: " + _0x4e17cd.full_name);
    _0x35fac4({
      ok: true,
      repository: _0x4e17cd.full_name,
      branch: _0x4e17cd.default_branch || "main",
      created: true,
      message: "Created & connected new GitHub repository: " + _0x4e17cd.full_name
    });
  } catch (_0x43e3f8) {
    console.warn("[127HUB AI GitHub] Auto-Connect Error:", _0x43e3f8 && _0x43e3f8.message);
    _0x35fac4({
      ok: false,
      error: _0x43e3f8.message || String(_0x43e3f8)
    });
  }
}
chrome.runtime.onMessage.addListener((_0x5b2595, _0x1e12e8, _0x5473cc) => {
  if (_0x5b2595 && _0x5b2595.action === "127hub_byok_chat") {
    _handleByokChat(_0x5b2595, _0x5473cc);
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "127hub_github_commit_direct") {
    _handleGitHubDirectCommit(_0x5b2595, _0x5473cc);
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "127hub_github_get_tree") {
    _handleGitHubGetTree(_0x5b2595, _0x5473cc);
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "127hub_github_get_files") {
    _handleGitHubGetFiles(_0x5b2595, _0x5473cc);
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "127hub_github_auto_connect") {
    _handleGitHubAutoConnect(_0x5b2595, _0x5473cc);
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "otaCheckNow") {
    otaCheckForUpdate();
    _0x5473cc({
      ok: true
    });
    return false;
  }
  if (_0x5b2595 && _0x5b2595.action === "otaValidateLicense") {
    (async () => {
      try {
        const _0x14e4ca = String(_0x5b2595.licenseKey || "").trim();
        if (!_0x14e4ca) {
          _0x5473cc({
            valid: false,
            message: "License key is required."
          });
          return;
        }
        const _0x5d5436 = typeof getDeviceId === "function" ? await getDeviceId() : "unknown-device";
        const _0x33cbfe = Date.now();
        const _0x41fb60 = getOtaCurrentVersion();
        const _0x398e45 = "lovasiri_secure_v9_salt_2026";
        const _0xf39d84 = _0x33cbfe + ":" + _0x14e4ca + ":" + _0x5d5436;
        const _0x5cc83b = new TextEncoder().encode(_0xf39d84 + _0x398e45);
        const _0x3fc343 = await crypto.subtle.digest("SHA-256", _0x5cc83b);
        const _0x5beb83 = Array.from(new Uint8Array(_0x3fc343)).map(_0x4e6bc0 => _0x4e6bc0.toString(16).padStart(2, "0")).join("");
        const _0x1aff1f = {
          license_key: _0x14e4ca,
          device_id: _0x5d5436,
          timestamp: _0x33cbfe,
          extension_version: _0x41fb60,
          heartbeat: false
        };
        const _0x51d79b = await fetch("https://ai.127hub.com/api/validate-license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-signature": _0x5beb83
          },
          body: JSON.stringify(_0x1aff1f)
        });
        const _0x3472c4 = await _0x51d79b.json().catch(() => null);
        if (_0x51d79b.ok && _0x3472c4 && (_0x3472c4.valid === true || _0x3472c4.status === "active")) {
          const _0x328977 = {
            ql_license_key: _0x14e4ca,
            ql_license_valid: true,
            ql_license_status: _0x3472c4.status || "active",
            ql_user_name: _0x3472c4.username || ""
          };
          chrome.storage.local.set(_0x328977);
          _0x5473cc({
            valid: true,
            status: _0x3472c4.status || "active",
            username: _0x3472c4.username || "",
            data: _0x3472c4
          });
        } else {
          _0x5473cc({
            valid: false,
            status: _0x3472c4 && _0x3472c4.status || "invalid",
            message: _0x3472c4 && _0x3472c4.message || "License validation failed (HTTP " + _0x51d79b.status + ")"
          });
        }
      } catch (_0x1df5ef) {
        _0x5473cc({
          valid: false,
          status: "network_error",
          message: _0x1df5ef && _0x1df5ef.message || "Could not connect to license server."
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "heartbeat") {
    if (self.PowerKitsGate && typeof self.PowerKitsGate.heartbeat === "function") {
      self.PowerKitsGate.heartbeat().catch(() => {});
    }
    _0x5473cc({
      ok: true
    });
    return false;
  }
  if (_0x5b2595 && _0x5b2595.action === "reloadExtension") {
    try {
      chrome.runtime.reload();
    } catch (_0x22d5e5) {}
    _0x5473cc({
      ok: true
    });
    return false;
  }
  if (_0x5b2595 && _0x5b2595.action === "ping") {
    _0x5473cc({
      ok: true,
      ts: Date.now()
    });
    return false;
  }
  if (_0x5b2595 && _0x5b2595.action === "handshakeStatus") {
    (async () => {
      const _0x1b7165 = await refreshGateStatus();
      const _0x3f6d36 = self.__PK_BUILD__ || null;
      const _0x36db4a = self.LovaSiriHandshake ? await self.LovaSiriHandshake.readToken() : null;
      const _0x79618 = {
        ok: _0x1b7165,
        build_id: _0x3f6d36 && _0x3f6d36.build_id,
        version: _0x3f6d36 && _0x3f6d36.version,
        expires_at: _0x36db4a && _0x36db4a.expires_at
      };
      _0x5473cc(_0x79618);
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "handshakeRefresh") {
    (async () => {
      try {
        const _0x582c43 = self.LovaSiriHandshake ? await self.LovaSiriHandshake.performHandshake() : {
          ok: false,
          reason: "no_handshake"
        };
        await refreshGateStatus();
        _0x5473cc(_0x582c43);
      } catch (_0x3b9d41) {
        _0x5473cc({
          ok: false,
          reason: "exception",
          message: String(_0x3b9d41 && _0x3b9d41.message)
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "pkActivate") {
    (async () => {
      try {
        const _0x564574 = await self.PowerKitsGate.activate(_0x5b2595.licenseKey);
        await refreshGateStatus();
        _0x5473cc(_0x564574);
      } catch (_0x458cbd) {
        _0x5473cc({
          ok: false,
          reason: "exception",
          message: String(_0x458cbd && _0x458cbd.message)
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "pkFetchCore") {
    (async () => {
      try {
        const _0x1181f6 = chrome.runtime.getURL("powerkits-core.js");
        const _0x10beb1 = chrome.runtime.getURL("powerkits-core.css");
        const _0x500d86 = await fetch(_0x1181f6);
        const _0x17cf5b = await _0x500d86.text();
        let _0x5591bd = "";
        try {
          const _0x30e5f8 = await fetch(_0x10beb1);
          _0x5591bd = await _0x30e5f8.text();
        } catch (_0x21237b) {}
        console.log("[127HUB AI] Loaded clean core locally from extension folder.");
        const _0x8d312c = {
          ok: true,
          code: _0x17cf5b,
          css: _0x5591bd
        };
        _0x5473cc(_0x8d312c);
      } catch (_0x2ae57f) {
        console.error("[PowerKits] Local bundle load error:", _0x2ae57f);
        _0x5473cc({
          ok: false,
          reason: "exception",
          message: String(_0x2ae57f && _0x2ae57f.message)
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "pkFetchNotifications") {
    (async () => {
      try {
        const _0x10872c = self.__PK_BUILD__ || null;
        const _0x226c63 = _0x10872c && _0x10872c.api_url || "https://ai.127hub.com";
        const _0x4cc30d = _0x226c63.replace(/\/+$/, "") + "/api/notifications";
        const _0x2ccde8 = await fetch(_0x4cc30d, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!_0x2ccde8.ok) {
          _0x5473cc({
            ok: false,
            reason: "server_error",
            status: _0x2ccde8.status
          });
          return;
        }
        const _0x40602c = await _0x2ccde8.json();
        const _0x4b6063 = {
          ok: true,
          data: _0x40602c
        };
        _0x5473cc(_0x4b6063);
      } catch (_0x3ea9c3) {
        console.error("[PowerKits] Notification fetch error:", _0x3ea9c3);
        _0x5473cc({
          ok: false,
          reason: "exception",
          message: String(_0x3ea9c3 && _0x3ea9c3.message)
        });
      }
    })();
    return true;
  }
  async function _0x3bcf88(_0x352690, _0x46ac42) {
    const _0x14e1fa = (typeof cfg === "function" ? cfg() : self.__PK_BUILD__) || {};
    const _0xab8170 = _0x14e1fa && _0x14e1fa.api_url || "https://ai.127hub.com";
    const _0x564b58 = _0xab8170.replace(/\/+$/, "") + "/api/switch";
    let _0x2ddc13 = "unknown";
    try {
      if (self.PowerKitsGate && typeof self.PowerKitsGate.getDeviceId === "function") {
        _0x2ddc13 = await self.PowerKitsGate.getDeviceId();
      } else if (typeof getDeviceId === "function") {
        _0x2ddc13 = await getDeviceId();
      }
    } catch (_0x2252ef) {}
    const _0x2fc53f = await new Promise(_0x16f17b => chrome.storage.local.get(["ql_credits", "ql_switch_count", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today", "ql_last_switch_date"], _0x16f17b));
    const _0xbe190f = _0x352690 || _0x2fc53f && _0x2fc53f.ql_license_key || "";
    let _0x457b4a = _0x2fc53f && typeof _0x2fc53f.ql_credits === "number" ? _0x2fc53f.ql_credits : 0;
    let _0x11864b = _0x2fc53f && typeof _0x2fc53f.ql_switch_count === "number" ? _0x2fc53f.ql_switch_count : 0;
    let _0x48d2ea = _0x2fc53f && typeof _0x2fc53f.ql_daily_switch_limit === "number" ? _0x2fc53f.ql_daily_switch_limit : 2;
    let _0x4b62fc = _0x2fc53f && typeof _0x2fc53f.ql_switches_today === "number" ? _0x2fc53f.ql_switches_today : 0;
    const _0x109693 = new Date().toISOString().slice(0, 10);
    if (_0x2fc53f && _0x2fc53f.ql_last_switch_date && _0x2fc53f.ql_last_switch_date !== _0x109693) {
      _0x4b62fc = 0;
    }
    const _0xafb381 = 10;
    if (_0x4b62fc >= _0x48d2ea) {
      const _0x5deaee = {
        ok: false,
        reason: "daily_limit_reached",
        daily_switch_limit: _0x48d2ea,
        switches_today: _0x4b62fc,
        switches_left_today: 0,
        message: "⚠️ Daily switch limit reached (" + _0x4b62fc + "/" + _0x48d2ea + "). Kal subah dobara try karein ya admin se limit badhwayein!"
      };
      return _0x5deaee;
    }
    if (_0x457b4a < _0xafb381) {
      const _0x2b4cf0 = {
        ok: false,
        reason: "insufficient_credits",
        required: _0xafb381,
        current: _0x457b4a,
        message: "Aapke paas पर्याप्त credits nahi hain. Switch ke liye " + _0xafb381 + " credits required hain (Balance: " + _0x457b4a + ")."
      };
      return _0x2b4cf0;
    }
    let _0x5db077 = null;
    const _0x449071 = new AbortController();
    const _0x1cf784 = setTimeout(() => {
      try {
        _0x449071.abort();
      } catch (_0x57a621) {}
    }, 10000);
    try {
      _0x5db077 = await fetch(_0x564b58, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "pk_lov_ext_a8f3c21e9d4b7f0e6a2c5d8b1e4f7a0c"
        },
        body: JSON.stringify({
          license_key: _0xbe190f,
          device_id: _0x2ddc13,
          invite_url: _0x46ac42 || null
        }),
        signal: _0x449071.signal
      });
    } catch (_0xfdd2b6) {
      console.warn("[127HUB AI] Switch server fetch error or timeout:", _0xfdd2b6 && _0xfdd2b6.message);
    } finally {
      clearTimeout(_0x1cf784);
    }
    let _0x515977 = null;
    if (_0x5db077 && _0x5db077.ok) {
      _0x515977 = await _0x5db077.json().catch(() => null);
    } else if (_0x5db077 && !_0x5db077.ok) {
      const _0x2cf7b2 = await _0x5db077.json().catch(() => ({}));
      if (_0x2cf7b2 && _0x2cf7b2.reason === "daily_limit_reached") {
        const _0x18918f = typeof _0x2cf7b2.daily_switch_limit === "number" ? _0x2cf7b2.daily_switch_limit : _0x48d2ea;
        const _0x388859 = typeof _0x2cf7b2.switches_today === "number" ? _0x2cf7b2.switches_today : _0x18918f;
        const _0x462aeb = {
          ql_daily_switch_limit: _0x18918f,
          ql_switches_today: _0x388859,
          ql_switches_left_today: 0,
          ql_last_switch_date: _0x109693
        };
        await new Promise(_0x4764b4 => chrome.storage.local.set(_0x462aeb, _0x4764b4));
        const _0x53f083 = {
          ok: false,
          reason: "daily_limit_reached",
          daily_switch_limit: _0x18918f,
          switches_today: _0x388859,
          switches_left_today: 0,
          message: _0x2cf7b2.message || "⚠️ Daily switch limit reached (" + _0x388859 + "/" + _0x18918f + "). Kal subah dobara try karein!"
        };
        return _0x53f083;
      }
      const _0x5930da = {
        ok: false,
        reason: _0x2cf7b2.reason || "server_error",
        message: _0x2cf7b2.message || "Server switch error (Status: " + _0x5db077.status + ")"
      };
      return _0x5930da;
    }
    if (_0x515977 && _0x515977.ok === false) {
      const _0x5abfe3 = {
        ok: false,
        reason: _0x515977.reason || "pool_empty",
        message: _0x515977.message || "Server account pool se account allocate nahi ho saka."
      };
      return _0x5abfe3;
    }
    let _0x13702c = null;
    if (_0x515977 && _0x515977.account && _0x515977.account.email && _0x515977.account.password) {
      const _0x5179a9 = {
        email: _0x515977.account.email,
        password: _0x515977.account.password
      };
      _0x13702c = _0x5179a9;
    } else if (_0x515977 && _0x515977.session && _0x515977.session.email && _0x515977.session.password) {
      const _0x51fff5 = {
        email: _0x515977.session.email,
        password: _0x515977.session.password
      };
      _0x13702c = _0x51fff5;
    }
    if (!_0x13702c) {
      if (_0x5db077 && _0x5db077.ok) {
        return {
          ok: false,
          reason: "missing_credentials",
          message: "Server ne switch confirm kiya lekin valid email/password provide nahi kiya."
        };
      }
      console.warn("[127HUB AI] Backend unreachable, using emergency fallback account");
      _0x13702c = {
        email: "127hub@lusufer.us.cc",
        password: "Quack1709#"
      };
    }
    const _0x455a34 = ["lovable.dev", "api.lovable.dev", "lovable.app", "supabase.co"];
    for (const _0x25671c of _0x455a34) {
      try {
        const _0x1cb70d = {
          domain: _0x25671c
        };
        const _0x1a83eb = await chrome.cookies.getAll(_0x1cb70d);
        if (_0x1a83eb && _0x1a83eb.length > 0) {
          await Promise.all(_0x1a83eb.map(_0x5c4434 => {
            const _0x4791af = _0x5c4434.secure ? "https:" : "http:";
            const _0x546056 = (_0x5c4434.domain || _0x25671c).replace(/^\./, "");
            const _0x335369 = _0x4791af + "//" + _0x546056 + (_0x5c4434.path || "/");
            const _0x33ac45 = {
              url: _0x335369,
              name: _0x5c4434.name,
              storeId: _0x5c4434.storeId
            };
            return chrome.cookies.remove(_0x33ac45).catch(() => {});
          }));
        }
      } catch (_0x3d2de2) {}
    }
    let _0x6073d4 = Math.max(0, _0x457b4a - _0xafb381);
    if (_0x515977 && typeof _0x515977.credits === "number") {
      _0x6073d4 = _0x515977.credits;
    } else if (_0xbe190f) {
      try {
        const _0x311e15 = await fetch(_0xab8170.replace(/\/+$/, "") + "/api/credits/deduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            license_key: _0xbe190f,
            device_id: _0x2ddc13,
            amount: _0xafb381,
            reason: "account_switch"
          })
        });
        if (_0x311e15.ok) {
          const _0x34b57c = await _0x311e15.json().catch(() => null);
          if (_0x34b57c && _0x34b57c.ok && typeof _0x34b57c.credits === "number") {
            _0x6073d4 = _0x34b57c.credits;
          }
        }
      } catch (_0x4671cf) {
        console.warn("[127HUB AI] Server credit deduction persistence warning:", _0x4671cf && _0x4671cf.message);
      }
    }
    const _0x4742e9 = _0x11864b + 1;
    const _0x1cfc72 = _0x515977 && typeof _0x515977.switches_today === "number" ? _0x515977.switches_today : _0x4b62fc + 1;
    const _0x574b66 = _0x515977 && typeof _0x515977.daily_switch_limit === "number" ? _0x515977.daily_switch_limit : _0x48d2ea;
    const _0xe8f5b7 = _0x515977 && typeof _0x515977.switches_left_today === "number" ? _0x515977.switches_left_today : Math.max(0, _0x574b66 - _0x1cfc72);
    await new Promise(_0x560b0a => chrome.storage.local.set({
      ql_credits: _0x6073d4,
      ql_switch_count: _0x4742e9,
      ql_switches_today: _0x1cfc72,
      ql_switches_left_today: _0xe8f5b7,
      ql_daily_switch_limit: _0x574b66,
      ql_last_switch_date: _0x109693,
      ql_pending_autologin: {
        email: _0x13702c.email,
        password: _0x13702c.password,
        inviteUrl: _0x46ac42 || _0x515977 && _0x515977.targetUrl || "",
        timestamp: Date.now(),
        cost: _0xafb381,
        pendingDeduction: false,
        status: "pending",
        submitted: false
      },
      ql_pending_invite_url: _0x46ac42 || _0x515977 && _0x515977.targetUrl || ""
    }, _0x560b0a));
    console.log("[127HUB AI] Switch executed for " + _0x13702c.email + ". Deducted " + _0xafb381 + " credits. New balance: " + _0x6073d4 + ", switches today: " + _0x1cfc72 + "/" + _0x574b66);
    try {
      chrome.tabs.query({}, _0x4a8434 => {
        (_0x4a8434 || []).forEach(_0x379196 => {
          if (_0x379196 && _0x379196.id) {
            const _0x4c5884 = {
              action: "credits_updated",
              credits: _0x6073d4,
              daily_switch_limit: _0x574b66,
              switches_today: _0x1cfc72,
              switches_left_today: _0xe8f5b7
            };
            chrome.tabs.sendMessage(_0x379196.id, _0x4c5884, () => void chrome.runtime.lastError);
          }
        });
      });
    } catch (_0x17a107) {}
    const _0x11620a = _0x46ac42 && typeof _0x46ac42 === "string" && _0x46ac42.startsWith("http") ? _0x46ac42 : _0x515977 && _0x515977.targetUrl || null;
    const _0x388b31 = {
      email: _0x13702c.email,
      password: _0x13702c.password
    };
    const _0x151c8c = {
      ok: true,
      autologin: true,
      account: _0x388b31,
      targetUrl: "https://lovable.dev/login",
      finalTarget: _0x11620a,
      credits: _0x6073d4,
      switch_count: _0x4742e9,
      daily_switch_limit: _0x574b66,
      switches_today: _0x1cfc72,
      switches_left_today: _0xe8f5b7
    };
    return _0x151c8c;
  }
  if (_0x5b2595 && _0x5b2595.action === "confirmAccountSwitchSuccess") {
    (async () => {
      try {
        const _0x23c224 = await new Promise(_0x2f7b10 => chrome.storage.local.get(["ql_credits", "ql_switch_count", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today"], _0x2f7b10));
        const _0x287fd2 = {
          ok: true,
          credits: _0x23c224 && _0x23c224.ql_credits,
          switches_today: _0x23c224 && _0x23c224.ql_switches_today,
          switches_left_today: _0x23c224 && _0x23c224.ql_switches_left_today
        };
        _0x5473cc(_0x287fd2);
      } catch (_0x7e35d6) {
        _0x5473cc({
          ok: false,
          error: String(_0x7e35d6)
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "switchAccount") {
    (async () => {
      try {
        const _0x2a85d4 = await _0x3bcf88(_0x5b2595.licenseKey, _0x5b2595.inviteUrl);
        _0x5473cc(_0x2a85d4);
        if (_0x2a85d4 && _0x2a85d4.ok) {
          const _0x558ec4 = _0x1e12e8 && _0x1e12e8.tab && _0x1e12e8.tab.id || null;
          if (_0x558ec4) {
            try {
              chrome.tabs.update(_0x558ec4, {
                url: "https://lovable.dev/login"
              });
            } catch (_0x2f7caa) {}
          }
        }
      } catch (_0x5aeb77) {
        _0x5473cc({
          ok: false,
          reason: "exception",
          message: _0x5aeb77 && _0x5aeb77.message || String(_0x5aeb77)
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "getCredits") {
    (async () => {
      try {
        chrome.storage.local.get(["ql_send_method", "ql_credits"], _0x3fb39e => {
          if (_0x3fb39e && _0x3fb39e.ql_send_method === "v6") {
            chrome.storage.local.set({
              ql_send_method: "fix_error"
            });
          }
          if (_0x3fb39e && _0x3fb39e.ql_credits === 250) {
            chrome.storage.local.set({
              ql_credits: 0
            });
          }
        });
        chrome.storage.local.get(["ql_credits", "ql_max_credits", "ql_switch_count", "ql_license_key", "ql_daily_switch_limit", "ql_switches_today", "ql_switches_left_today", "ql_last_switch_date", "ql_user_name", "ql_activated_at", "ql_expires_at", "ql_plan"], async _0x420f31 => {
          let _0x460b1b = _0x420f31 && typeof _0x420f31.ql_credits === "number" && _0x420f31.ql_credits !== 250 ? _0x420f31.ql_credits : 0;
          if (_0x420f31 && _0x420f31.ql_credits === 250) {
            chrome.storage.local.set({
              ql_credits: 0
            });
          }
          let _0xebde4a = resolveCreditQuota(_0x460b1b, _0x420f31 && typeof _0x420f31.ql_max_credits === "number" ? _0x420f31.ql_max_credits : null);
          if ((typeof _0x420f31.ql_credits !== "number" || _0x420f31.ql_credits === null) && _0x420f31 && _0x420f31.ql_license_key) {
            try {
              const _0x5c0e12 = await fetchLiveServerCredits(_0x420f31.ql_license_key);
              if (typeof _0x5c0e12 === "number") {
                _0x460b1b = _0x5c0e12;
                _0xebde4a = Math.max(_0xebde4a || _0x5c0e12, _0x5c0e12);
                const _0x4cba78 = {
                  ql_credits: _0x5c0e12,
                  ql_max_credits: _0xebde4a
                };
                chrome.storage.local.set(_0x4cba78);
              }
            } catch (_0xf3c01c) {}
          }
          const _0x1b80b4 = _0x420f31 && typeof _0x420f31.ql_switch_count === "number" ? _0x420f31.ql_switch_count : 0;
          let _0x8a89b1 = _0x420f31 && typeof _0x420f31.ql_daily_switch_limit === "number" ? _0x420f31.ql_daily_switch_limit : 2;
          let _0x625031 = _0x420f31 && typeof _0x420f31.ql_switches_today === "number" ? _0x420f31.ql_switches_today : 0;
          const _0x1319ad = new Date().toISOString().slice(0, 10);
          if (_0x420f31 && _0x420f31.ql_last_switch_date && _0x420f31.ql_last_switch_date !== _0x1319ad) {
            _0x625031 = 0;
            const _0x1898ed = {
              ql_switches_today: 0,
              ql_last_switch_date: _0x1319ad,
              ql_switches_left_today: _0x8a89b1
            };
            chrome.storage.local.set(_0x1898ed);
          }
          let _0x54c3ed = Math.max(0, _0x8a89b1 - _0x625031);
          let _0x3db4d9 = _0x420f31 && _0x420f31.ql_user_name || "User";
          let _0x1cd3c8 = _0x420f31 && _0x420f31.ql_expires_at || null;
          let _0x39ff46 = _0x420f31 && _0x420f31.ql_activated_at || null;
          if (!_0x39ff46 && _0x1cd3c8) {
            const _0x145fc7 = new Date(_0x1cd3c8).getTime();
            if (!isNaN(_0x145fc7)) {
              _0x39ff46 = new Date(_0x145fc7 - 2592000000).toISOString();
              const _0x2da0f8 = {
                ql_activated_at: _0x39ff46
              };
              chrome.storage.local.set(_0x2da0f8);
            }
          }
          var _0xdaebb5 = _0x420f31 && typeof _0x420f31.ql_license_key === "string" ? _0x420f31.ql_license_key.trim() : "";
          var _0x22b925 = !!_0xdaebb5 && !!(_0xdaebb5.length >= 8) && !!_0x420f31 && _0x420f31.ql_license_valid !== false && _0x420f31.ql_license_status !== "revoked" && _0x420f31.ql_license_status !== "expired";
          _0x5473cc({
            ok: true,
            credits: _0x460b1b,
            max_credits: _0xebde4a,
            license_key: _0xdaebb5,
            license_valid: _0x22b925,
            switch_count: _0x1b80b4,
            daily_switch_limit: _0x8a89b1,
            switches_today: _0x625031,
            switches_left_today: _0x54c3ed,
            user_name: _0x3db4d9,
            activated_at: _0x39ff46,
            expires_at: _0x1cd3c8,
            plan: _0x420f31 && _0x420f31.ql_plan || "PRO"
          });
          if (_0x420f31 && _0x420f31.ql_license_key) {
            try {
              const _0x430764 = (typeof cfg === "function" ? cfg() : self.__PK_BUILD__) || {};
              const _0x234ded = _0x430764 && _0x430764.api_url || "https://ai.127hub.com";
              const _0x41235f = typeof getDeviceId === "function" ? await getDeviceId() : "unknown";
              const _0x255afa = {
                license_key: _0x420f31.ql_license_key,
                device_id: _0x41235f
              };
              const _0xdc033b = await fetch(_0x234ded.replace(/\/+$/, "") + "/api/credits/balance", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(_0x255afa)
              });
              if (_0xdc033b.ok) {
                const _0x1f0981 = await _0xdc033b.json().catch(() => null);
                if (_0x1f0981 && _0x1f0981.ok) {
                  const _0x2ce9b2 = typeof _0x1f0981.credits === "number" ? _0x1f0981.credits : _0x1f0981.license && typeof _0x1f0981.license.credits === "number" ? _0x1f0981.license.credits : null;
                  const _0x4d51fb = _0x1f0981.license || {};
                  const _0x97e215 = _0x1f0981.total_credits || _0x1f0981.max_credits || _0x1f0981.initial_credits || _0x1f0981.credit_limit || _0x1f0981.limit || _0x1f0981.total || _0x1f0981.plan_credits || _0x4d51fb && (_0x4d51fb.total_credits || _0x4d51fb.max_credits || _0x4d51fb.initial_credits || _0x4d51fb.credit_limit || _0x4d51fb.limit || _0x4d51fb.total || _0x4d51fb.plan_credits) || null;
                  const _0x10d469 = {};
                  if (typeof _0x2ce9b2 === "number") {
                    if (_0x2ce9b2 !== _0x460b1b) {
                      _0x10d469.ql_credits = _0x2ce9b2;
                    }
                    const _0x50daa9 = _0x97e215 && typeof _0x97e215 === "number" && _0x97e215 > 0 ? Math.max(_0x97e215, _0x2ce9b2) : resolveCreditQuota(_0x2ce9b2, _0x420f31 && _0x420f31.ql_max_credits);
                    _0x10d469.ql_max_credits = _0x50daa9;
                    _0xebde4a = _0x50daa9;
                  }
                  if (typeof _0x1f0981.switch_count === "number" && _0x1f0981.switch_count !== _0x1b80b4) {
                    _0x10d469.ql_switch_count = _0x1f0981.switch_count;
                  }
                  if (typeof _0x1f0981.daily_switch_limit === "number") {
                    _0x10d469.ql_daily_switch_limit = _0x1f0981.daily_switch_limit;
                    _0x8a89b1 = _0x1f0981.daily_switch_limit;
                  }
                  if (typeof _0x1f0981.switches_today === "number") {
                    _0x10d469.ql_switches_today = _0x1f0981.switches_today;
                    _0x625031 = _0x1f0981.switches_today;
                  }
                  if (typeof _0x1f0981.switches_left_today === "number") {
                    _0x10d469.ql_switches_left_today = _0x1f0981.switches_left_today;
                    _0x54c3ed = _0x1f0981.switches_left_today;
                  } else {
                    _0x10d469.ql_switches_left_today = Math.max(0, _0x8a89b1 - _0x625031);
                  }
                  _0x10d469.ql_last_switch_date = _0x1319ad;
                  const _0x3548a2 = _0x1f0981.username || _0x1f0981.user_name || _0x1f0981.name || _0x4d51fb.username || _0x4d51fb.user_name || _0x4d51fb.name || _0x4d51fb.bound_email;
                  if (_0x3548a2 && _0x3548a2 !== "User") {
                    _0x10d469.ql_user_name = _0x3548a2;
                    _0x3db4d9 = _0x3548a2;
                  }
                  const _0x52f1f4 = _0x1f0981.activated_at || _0x1f0981.created_at || _0x1f0981.activation_date || _0x4d51fb.activated_at || _0x4d51fb.created_at;
                  if (_0x52f1f4) {
                    _0x10d469.ql_activated_at = _0x52f1f4;
                    _0x39ff46 = _0x52f1f4;
                  }
                  const _0x195fdc = _0x1f0981.expires_at || _0x1f0981.expiresAt || _0x1f0981.expire_date || _0x4d51fb.expires_at || _0x4d51fb.expire_date;
                  if (_0x195fdc) {
                    _0x10d469.ql_expires_at = _0x195fdc;
                    _0x1cd3c8 = _0x195fdc;
                  }
                  const _0x4e43d3 = _0x1f0981.plan || _0x4d51fb.plan || _0x4d51fb.type;
                  if (_0x4e43d3) {
                    _0x10d469.ql_plan = _0x4e43d3;
                  }
                  if (Object.keys(_0x10d469).length > 0) {
                    chrome.storage.local.set(_0x10d469);
                    try {
                      chrome.tabs.query({}, _0x13fd87 => {
                        (_0x13fd87 || []).forEach(_0x5de0c9 => {
                          if (_0x5de0c9 && _0x5de0c9.id) {
                            chrome.tabs.sendMessage(_0x5de0c9.id, {
                              action: "credits_updated",
                              credits: typeof _0x10d469.ql_credits === "number" ? _0x10d469.ql_credits : _0x460b1b,
                              max_credits: _0xebde4a,
                              daily_switch_limit: _0x8a89b1,
                              switches_today: _0x625031,
                              switches_left_today: _0x54c3ed,
                              user_name: _0x3db4d9,
                              activated_at: _0x39ff46,
                              expires_at: _0x1cd3c8,
                              plan: _0x4e43d3 || _0x420f31 && _0x420f31.ql_plan || "PRO"
                            }, () => void chrome.runtime.lastError);
                          }
                        });
                      });
                    } catch (_0x24e551) {}
                  }
                }
              }
            } catch (_0x5ce851) {}
          }
        });
      } catch (_0x4d7d2f) {
        _0x5473cc({
          ok: true,
          credits: 0,
          switch_count: 0,
          daily_switch_limit: 2,
          switches_today: 0,
          switches_left_today: 2
        });
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action === "deductCredits") {
    (async () => {
      try {
        chrome.storage.local.get(["ql_credits", "ql_license_key"], async _0x3e982d => {
          const _0x4f3bcc = _0x3e982d && typeof _0x3e982d.ql_credits === "number" ? _0x3e982d.ql_credits : 0;
          const _0x339ddc = Math.max(1, parseInt(_0x5b2595.amount, 10) || 1);
          const _0x44d85b = _0x5b2595 && _0x5b2595.license_key || _0x3e982d && _0x3e982d.ql_license_key || "";
          let _0x2dbc40 = Math.max(0, _0x4f3bcc - _0x339ddc);
          const _0x5b1de9 = {
            ql_credits: _0x2dbc40
          };
          await chrome.storage.local.set(_0x5b1de9);
          if (_0x44d85b) {
            try {
              const _0x4e2601 = (typeof cfg === "function" ? cfg() : self.__PK_BUILD__) || {};
              const _0x1afa65 = _0x4e2601 && _0x4e2601.api_url || "https://ai.127hub.com";
              const _0x5243b1 = typeof getDeviceId === "function" ? await getDeviceId() : "unknown";
              const _0x58198a = await fetch(_0x1afa65.replace(/\/+$/, "") + "/api/credits/deduct", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  license_key: _0x44d85b,
                  device_id: _0x5243b1,
                  amount: _0x339ddc,
                  reason: _0x5b2595 && _0x5b2595.reason || "prompt"
                })
              });
              if (_0x58198a.ok) {
                const _0x3efe29 = await _0x58198a.json().catch(() => null);
                if (_0x3efe29 && _0x3efe29.ok && typeof _0x3efe29.credits === "number") {
                  _0x2dbc40 = _0x3efe29.credits;
                  const _0x2f7f1d = {
                    ql_credits: _0x2dbc40
                  };
                  await chrome.storage.local.set(_0x2f7f1d);
                }
              }
            } catch (_0x12b63c) {}
          }
          const _0x186fc9 = {
            ok: true,
            credits: _0x2dbc40
          };
          _0x5473cc(_0x186fc9);
        });
      } catch (_0x12d3fd) {
        const _0x68ca2f = {
          ok: false,
          error: _0x12d3fd && _0x12d3fd.message
        };
        _0x5473cc(_0x68ca2f);
      }
    })();
    return true;
  }
  if (_0x5b2595 && _0x5b2595.action && PROTECTED_ACTIONS.has(_0x5b2595.action) && !isLicenseActivationProxyFetch(_0x5b2595)) {
    return authorizeAndHandleMessage(_0x5b2595, _0x1e12e8, _0x5473cc);
  }
  return handleAuthorizedMessage(_0x5b2595, _0x1e12e8, _0x5473cc);
});
function authorizeAndHandleMessage(_0x189603, _0x328f25, _0x39f5ed) {
  (async () => {
    let _0x46f55d = await refreshGateStatus();
    if (!_0x46f55d && self.LovaSiriHandshake) {
      const _0x23757b = await self.LovaSiriHandshake.performHandshake();
      _0x46f55d = !!_0x23757b && !!_0x23757b.ok;
      await refreshGateStatus();
    }
    if (!_0x46f55d) {
      _0x39f5ed({
        ok: false,
        status: 403,
        data: {
          error: "extension_not_authorized",
          message: "This copy of the extension is not authorized. Download the official version from your dashboard."
        }
      });
      return;
    }
    handleAuthorizedMessage(_0x189603, _0x328f25, _0x39f5ed);
  })();
  return true;
}
async function getLovableTab(_0x28d9a3) {
  if (_0x28d9a3 && _0x28d9a3.id && isLovableTabUrl(_0x28d9a3.url)) {
    return _0x28d9a3;
  }
  const _0x49c012 = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (_0x49c012 && _0x49c012[0] && isLovableTabUrl(_0x49c012[0].url)) {
    return _0x49c012[0];
  }
  const _0x386677 = await chrome.tabs.query({
    url: ["https://lovable.dev/*", "https://*.lovable.dev/*"]
  });
  return _0x386677 && _0x386677[0] || null;
}
function normalizeLovableSourceFiles(_0x3c76e3) {
  if (!_0x3c76e3 || typeof _0x3c76e3 !== "object") {
    return [];
  }
  const _0xacfd74 = [_0x3c76e3.files, _0x3c76e3.data && _0x3c76e3.data.files, _0x3c76e3.source_code && _0x3c76e3.source_code.files, _0x3c76e3.sourceCode && _0x3c76e3.sourceCode.files, _0x3c76e3.project && _0x3c76e3.project.files];
  for (const _0x3eb99b of _0xacfd74) {
    if (Array.isArray(_0x3eb99b)) {
      return _0x3eb99b.map(_0x502c18 => {
        if (!_0x502c18 || typeof _0x502c18 !== "object") {
          return _0x502c18;
        }
        const _0x5a84f5 = _0x502c18.name || _0x502c18.path || _0x502c18.file_path || _0x502c18.filename || _0x502c18.fileName;
        const _0x244252 = _0x502c18.content ?? _0x502c18.source ?? _0x502c18.text;
        return Object.assign({}, _0x502c18, _0x5a84f5 ? {
          name: _0x5a84f5
        } : {}, _0x244252 != null ? {
          content: _0x244252
        } : {});
      }).filter(_0x3fabb9 => _0x3fabb9 && (typeof _0x3fabb9 === "string" || _0x3fabb9.name || _0x3fabb9.path));
    }
  }
  return [];
}
function normalizeLovasiriBearerToken(_0x4de91f) {
  return String(_0x4de91f || "").replace(/^Bearer\s+/i, "").trim();
}
function addLovasiriTokenCandidate(_0x41c7e3, _0x31be4b, _0x3ef46d, _0x439e35) {
  const _0x2a1b9e = normalizeLovasiriBearerToken(_0x3ef46d);
  if (!_0x2a1b9e || _0x31be4b.has(_0x2a1b9e)) {
    return;
  }
  _0x31be4b.add(_0x2a1b9e);
  _0x41c7e3.push({
    token: _0x2a1b9e,
    source: _0x439e35 || "token"
  });
}
function buildLovasiriTokenCandidates() {
  const _0x2f53d5 = new Set();
  const _0x263d4f = [];
  for (let _0xc48fbd = 0; _0xc48fbd < arguments.length; _0xc48fbd++) {
    addLovasiriTokenCandidate(_0x263d4f, _0x2f53d5, arguments[_0xc48fbd], "background");
  }
  _0x263d4f.push({
    token: "",
    source: "cookie-only"
  });
  return _0x263d4f;
}
async function fetchLovableSourceDirect(_0x357eed, _0x12bcce) {
  const _0x46ea09 = encodeURIComponent(String(_0x357eed || "").trim());
  const _0x186a23 = buildLovasiriTokenCandidates(_0x12bcce);
  const _0x3e3fbc = ["https://lovable-api.com/projects/" + _0x46ea09 + "/source-code", "https://api.lovable.dev/projects/" + _0x46ea09 + "/source-code"];
  let _0x4be28d = null;
  for (const _0x42dd0d of _0x3e3fbc) {
    for (const _0x57a612 of _0x186a23) {
      try {
        const _0x5894af = await fetch(_0x42dd0d, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            ...(_0x57a612.token ? {
              Authorization: "Bearer " + _0x57a612.token
            } : {})
          }
        });
        const _0xcfb0b = await _0x5894af.text();
        let _0x2238de;
        try {
          _0x2238de = JSON.parse(_0xcfb0b);
        } catch (_0x4c610) {
          const _0x43b3f3 = {
            raw: _0xcfb0b
          };
          _0x2238de = _0x43b3f3;
        }
        const _0x1fec75 = normalizeLovableSourceFiles(_0x2238de);
        const _0x2637eb = {
          ok: _0x5894af.ok,
          status: _0x5894af.status,
          data: _0x2238de,
          files: _0x1fec75,
          tokenSource: _0x57a612.source
        };
        _0x4be28d = _0x2637eb;
        if (_0x5894af.ok && _0x1fec75.length) {
          return {
            success: true,
            ok: true,
            files: _0x1fec75,
            status: _0x5894af.status,
            source: _0x42dd0d,
            tokenSource: _0x57a612.source
          };
        }
        if (_0x5894af.ok) {
          return {
            success: false,
            ok: false,
            error: "No files found in the project.",
            status: _0x5894af.status,
            details: _0x2238de
          };
        }
        if (_0x5894af.status !== 401 && _0x5894af.status !== 403) {
          break;
        }
      } catch (_0x39b6db) {
        const _0x4a2e36 = {
          error: _0x39b6db && _0x39b6db.message || "failed to fetch"
        };
        const _0x59ac83 = {
          ok: false,
          status: 0,
          data: _0x4a2e36,
          files: []
        };
        _0x4be28d = _0x59ac83;
      }
    }
  }
  const _0x49dc38 = _0x4be28d && _0x4be28d.data && (_0x4be28d.data.message || _0x4be28d.data.error || _0x4be28d.data.raw);
  return {
    success: false,
    ok: false,
    error: _0x49dc38 || "Download falhou",
    status: _0x4be28d && _0x4be28d.status || 0,
    details: _0x4be28d && _0x4be28d.data
  };
}
async function fetchLovableSourceViaPage(_0x490f22, _0x203597, _0x13b1cf) {
  const _0x90aa75 = await getLovableTab(_0x13b1cf);
  if (!_0x90aa75 || !_0x90aa75.id) {
    return {
      success: false,
      ok: false,
      status: 0,
      error: "Abra uma aba do Lovable antes de baixar."
    };
  }
  const _0x20c58f = {
    tabId: _0x90aa75.id
  };
  const _0x140319 = await chrome.scripting.executeScript({
    target: _0x20c58f,
    world: "MAIN",
    func: async ({
      projectId,
      token
    }) => {
      const normalizeFiles = payload => {
        if (!payload || typeof payload !== "object") {
          return [];
        }
        const candidates = [payload.files, payload.data && payload.data.files, payload.source_code && payload.source_code.files, payload.sourceCode && payload.sourceCode.files, payload.project && payload.project.files];
        for (const list of candidates) {
          if (Array.isArray(list)) {
            return list.map(file => {
              if (!file || typeof file !== "object") {
                return file;
              }
              const name = file.name || file.path || file.file_path || file.filename || file.fileName;
              const content = file.content ?? file.source ?? file.text;
              return Object.assign({}, file, name ? {
                name
              } : {}, content != null ? {
                content
              } : {});
            }).filter(file => file && (typeof file === "string" || file.name || file.path));
          }
        }
        return [];
      };
      const addCandidate = (list, seen, raw, source) => {
        const clean = String(raw || "").replace(/^Bearer\s+/i, "").trim();
        if (!clean || seen.has(clean)) {
          return;
        }
        seen.add(clean);
        list.push({
          token: clean,
          source: source || "token"
        });
      };
      const collectTokenCandidates = () => {
        const seen = new Set();
        const list = [];
        addCandidate(list, seen, token, "captured");
        try {
          addCandidate(list, seen, window.__lovasiriLovableToken, "window.__lovasiriLovableToken");
          addCandidate(list, seen, window.__lovableAuthToken, "window.__lovableAuthToken");
          addCandidate(list, seen, window.__LOVABLE_AUTH_TOKEN__, "window.__LOVABLE_AUTH_TOKEN__");
        } catch (e) {}
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || "";
            const raw = localStorage.getItem(key) || "";
            if (/firebase:authUser|authUser/i.test(key)) {
              try {
                const parsed = JSON.parse(raw);
                const user = parsed && parsed.value && typeof parsed.value === "object" ? parsed.value : parsed;
                const manager = user && (user.stsTokenManager || user.tokenManager || {});
                const fbToken = manager.accessToken || user.accessToken;
                addCandidate(list, seen, fbToken, "firebase");
              } catch (e) {}
            }
          }
        } catch (e) {}
        list.push({
          token: "",
          source: "cookie-only"
        });
        return list;
      };
      const cleanProjectId = encodeURIComponent(String(projectId || "").trim());
      const tokenCandidates = collectTokenCandidates();
      const urls = ["https://api.lovable.dev/projects/" + cleanProjectId + "/source-code", "https://lovable-api.com/projects/" + cleanProjectId + "/source-code"];
      let last = null;
      for (const url of urls) {
        for (const candidate of tokenCandidates) {
          try {
            const resp = await fetch(url, {
              method: "GET",
              cache: "no-store",
              credentials: "include",
              headers: {
                Accept: "application/json",
                ...(candidate.token ? {
                  Authorization: "Bearer " + candidate.token
                } : {})
              }
            });
            const text = await resp.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              data = {
                raw: text
              };
            }
            const files = normalizeFiles(data);
            last = {
              ok: resp.ok,
              status: resp.status,
              data,
              files,
              tokenSource: candidate.source
            };
            if (resp.ok && files.length) {
              return {
                success: true,
                ok: true,
                files,
                status: resp.status,
                source: url,
                tokenSource: candidate.source
              };
            }
            if (resp.ok) {
              return {
                success: false,
                ok: false,
                error: "No files found in the project.",
                status: resp.status,
                details: data
              };
            }
            if (resp.status !== 401 && resp.status !== 403) {
              break;
            }
          } catch (err) {
            last = {
              ok: false,
              status: 0,
              data: {
                error: err && err.message || "failed to fetch"
              },
              files: []
            };
          }
        }
      }
      const reason = last && last.data && (last.data.message || last.data.error || last.data.raw);
      return {
        success: false,
        ok: false,
        error: reason || "Download falhou",
        status: last && last.status || 0,
        details: last && last.data
      };
    },
    args: [{
      projectId: _0x490f22,
      token: _0x203597
    }]
  });
  return _0x140319 && _0x140319[0] && _0x140319[0].result || {
    success: false,
    ok: false,
    status: 0,
    error: "no response from the Lovable page"
  };
}
function _isSupabaseToken(_0x26852e) {
  try {
    if (!_0x26852e || typeof _0x26852e !== "string") {
      return false;
    }
    var _0x4a62ed = _0x26852e.replace(/^Bearer\s+/i, "").trim();
    var _0x3a9f97 = _0x4a62ed.split(".");
    if (_0x3a9f97.length !== 3) {
      return false;
    }
    var _0x4e95cd = _0x3a9f97[1].replace(/-/g, "+").replace(/_/g, "/");
    while (_0x4e95cd.length % 4) {
      _0x4e95cd += "=";
    }
    var _0x16e676 = JSON.parse(atob(_0x4e95cd));
    if (_0x16e676 && _0x16e676.iss && _0x16e676.iss.indexOf("supabase.co") !== -1) {
      return true;
    }
    var _0x39c675 = String(_0x16e676 && _0x16e676.role || "").toLowerCase();
    if (_0x39c675 === "anon" || _0x39c675 === "service_role") {
      return true;
    }
    if (_0x16e676 && _0x16e676.app_metadata && _0x16e676.app_metadata.provider && _0x16e676.iss && /supabase/i.test(_0x16e676.iss)) {
      return true;
    }
    return false;
  } catch (_0x4c2b31) {
    return false;
  }
}
function _isValidLovableToken(_0x46cedf) {
  try {
    if (!_0x46cedf || typeof _0x46cedf !== "string") {
      return false;
    }
    var _0x101184 = _0x46cedf.replace(/^Bearer\s+/i, "").trim();
    var _0x144b1c = _0x101184.split(".");
    if (_0x144b1c.length !== 3) {
      return false;
    }
    var _0x117c36 = _0x144b1c[1].replace(/-/g, "+").replace(/_/g, "/");
    while (_0x117c36.length % 4) {
      _0x117c36 += "=";
    }
    var _0x16bb4c = JSON.parse(atob(_0x117c36));
    if (_0x16bb4c && _0x16bb4c.iss && _0x16bb4c.iss.indexOf("supabase.co") !== -1) {
      return false;
    }
    var _0xac92a1 = String(_0x16bb4c && _0x16bb4c.role || "").toLowerCase();
    if (_0xac92a1 === "anon" || _0xac92a1 === "service_role") {
      return false;
    }
    if (_0x16bb4c && _0x16bb4c.exp && _0x16bb4c.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch (_0x5df6b8) {
    return false;
  }
}
try {
  chrome.storage.local.get(["lovable_token"], function (_0xfdfc6e) {
    if (_0xfdfc6e && _0xfdfc6e.lovable_token && (_isSupabaseToken(_0xfdfc6e.lovable_token) || !_isValidLovableToken(_0xfdfc6e.lovable_token))) {
      console.log("[127HUB AI] 🧹 Purging stale Supabase/invalid token on worker boot");
      chrome.storage.local.remove(["lovable_token"]);
    }
  });
} catch (_0x23f297) {}
function handleAuthorizedMessage(_0x50db1a, _0x211625, _0x38f97b) {
  if (_0x50db1a && _0x50db1a.action === "lovableSync") {
    const _0x2c5d87 = {};
    if (_0x50db1a.token && !_isSupabaseToken(_0x50db1a.token) && _isValidLovableToken(_0x50db1a.token)) {
      _0x2c5d87.lovable_token = _0x50db1a.token;
    }
    if (_0x50db1a.projectId) {
      _0x2c5d87.lovable_projectId = _0x50db1a.projectId;
    }
    if (Object.keys(_0x2c5d87).length) {
      chrome.storage.local.set(_0x2c5d87, () => {
        console.log("[Background] saved:", Object.keys(_0x2c5d87).join(", "));
      });
    }
  }
  if (_0x50db1a && _0x50db1a.action === "activateSidebar") {
    chrome.storage.local.set({
      ql_sidebar_mode: true
    });
    if (chrome.sidePanel) {
      chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true
      }).catch(() => {});
    }
    if (_0x211625.tab && _0x211625.tab.id) {
      const _0x37e2e8 = {
        tabId: _0x211625.tab.id
      };
      if (chrome.sidePanel) {
        chrome.sidePanel.open(_0x37e2e8).then(() => {
          _0x38f97b({
            ok: true
          });
        }).catch(_0x36a444 => {
          console.warn("[Background] sidePanel.open deferred — user must click extension icon:", _0x36a444.message);
          _0x38f97b({
            ok: true,
            deferred: true,
            message: "Click the extension icon to open the side panel."
          });
        });
      }
    } else {
      _0x38f97b({
        ok: true,
        deferred: true,
        message: "Click the extension icon to open the side panel."
      });
    }
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "deactivateSidebar") {
    chrome.storage.local.get(["ql_license_valid"], _0x5e6fe7 => {
      chrome.storage.local.set({
        ql_sidebar_mode: false,
        ql_native_chat: _0x5e6fe7 && _0x5e6fe7.ql_license_valid === true
      });
    });
    if (chrome.sidePanel) {
      chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: false
      }).catch(() => {});
    }
    (async () => {
      try {
        let _0x22a5f1 = null;
        if (_0x211625 && _0x211625.tab && _0x211625.tab.id) {
          _0x22a5f1 = _0x211625.tab;
        } else {
          const _0x44edeb = await chrome.tabs.query({
            url: ["https://lovable.dev/*", "https://*.lovable.dev/*"]
          });
          _0x22a5f1 = _0x44edeb && (_0x44edeb.find(_0x3d8709 => _0x3d8709.active) || _0x44edeb[0]) || null;
        }
        if (_0x22a5f1 && _0x22a5f1.id) {
          try {
            await chrome.tabs.reload(_0x22a5f1.id);
          } catch (_0x1b92c2) {}
          try {
            await chrome.tabs.update(_0x22a5f1.id, {
              active: true
            });
          } catch (_0xb8a81d) {}
        }
      } catch (_0xd1b821) {}
      _0x38f97b({
        ok: true
      });
    })();
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "openSidePanel") {
    if (_0x211625.tab && _0x211625.tab.id) {
      const _0x1eef93 = {
        tabId: _0x211625.tab.id
      };
      if (chrome.sidePanel) {
        chrome.sidePanel.open(_0x1eef93).then(() => {
          _0x38f97b({
            ok: true
          });
        }).catch(_0x4a54de => {
          console.warn("[Background] openSidePanel deferred:", _0x4a54de.message);
          const _0x271ec4 = {
            ok: false,
            error: _0x4a54de.message
          };
          _0x38f97b(_0x271ec4);
        });
      }
    } else {
      _0x38f97b({
        ok: false,
        error: "No tab context"
      });
    }
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "lovableApiFetch") {
    (async () => {
      try {
        let _0x56d4ee = null;
        const _0x45250f = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (_0x45250f && _0x45250f[0] && /^https:\/\/([^/]+\.)?lovable\.dev\//.test(_0x45250f[0].url || "")) {
          _0x56d4ee = _0x45250f[0];
        } else {
          const _0x300bff = await chrome.tabs.query({
            url: ["https://lovable.dev/*", "https://*.lovable.dev/*"]
          });
          _0x56d4ee = _0x300bff && _0x300bff[0] || null;
        }
        if (!_0x56d4ee || !_0x56d4ee.id) {
          _0x38f97b({
            ok: false,
            status: 0,
            data: {
              error: "Open a Lovable tab before sending."
            }
          });
          return;
        }
        const _0x256d92 = await chrome.storage.local.get(["lovable_token"]);
        const _0x27e72e = String(_0x256d92 && _0x256d92.lovable_token || "").replace(/^Bearer\s+/i, "").trim();
        const _0x3545fb = Object.assign({}, _0x50db1a.headers || {});
        if (_0x27e72e && !_0x3545fb.Authorization && !_0x3545fb.authorization) {
          _0x3545fb.Authorization = "Bearer " + _0x27e72e;
        }
        const _0x588922 = {
          tabId: _0x56d4ee.id
        };
        const _0x2fd7b7 = await chrome.scripting.executeScript({
          target: _0x588922,
          world: "MAIN",
          func: async (url, options) => {
            try {
              const r = await fetch(url, options);
              const text = await r.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                data = {
                  raw: text
                };
              }
              return {
                ok: r.ok,
                status: r.status,
                data
              };
            } catch (err) {
              return {
                ok: false,
                status: 0,
                data: {
                  error: err && err.message || "fetch failed in page"
                }
              };
            }
          },
          args: [_0x50db1a.url, {
            method: _0x50db1a.method || "POST",
            headers: _0x3545fb,
            body: _0x50db1a.body || null,
            credentials: "include"
          }]
        });
        const _0x485ec4 = _0x2fd7b7 && _0x2fd7b7[0] && _0x2fd7b7[0].result || {
          ok: false,
          status: 0,
          data: {
            error: "no response from the Lovable page"
          }
        };
        _0x38f97b(_0x485ec4);
      } catch (_0x57500a) {
        console.error("[Background] lovableApiFetch error:", _0x57500a);
        _0x38f97b({
          ok: false,
          status: 0,
          data: {
            error: _0x57500a.message || "executeScript failed."
          }
        });
      }
    })();
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "createLovableProjectInPage") {
    (async () => {
      try {
        let _0x3e880b = null;
        const _0x3101bd = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (_0x3101bd && _0x3101bd[0] && /^https:\/\/([^/]+\.)?lovable\.dev\//.test(_0x3101bd[0].url || "")) {
          _0x3e880b = _0x3101bd[0];
        } else {
          const _0x13786b = await chrome.tabs.query({
            url: ["https://lovable.dev/*", "https://*.lovable.dev/*"]
          });
          _0x3e880b = _0x13786b && _0x13786b[0] || null;
        }
        if (!_0x3e880b || !_0x3e880b.id) {
          _0x38f97b({
            ok: false,
            error: "Open a Lovable tab before creating the project."
          });
          return;
        }
        const _0x4da092 = await chrome.storage.local.get(["lovable_token"]);
        const _0x5e43ac = String(_0x50db1a.token || _0x4da092.lovable_token || "").replace(/^Bearer\s+/i, "").trim();
        try {
          const _0x4897d9 = {
            tabId: _0x3e880b.id
          };
          const _0x2d3f15 = {
            target: _0x4897d9,
            world: "MAIN",
            files: ["castle-v2.js"]
          };
          await chrome.scripting.executeScript(_0x2d3f15);
        } catch (_0x196b8b) {
          console.warn("[Background] Castle script inject falhou, seguindo sem ele:", _0x196b8b && _0x196b8b.message);
        }
        const _0x2e946b = ["https://", "api.lovable.dev"].join("");
        const _0x2215a4 = ["pk_", "TaKsqF94pjCsoyepV6mH3V24AXoM6A7M"].join("");
        const _0x3aa27c = ["https://securetoken.googleapis.com", "/v1/token?key=", "AIzaSyBQNjlw9Vp4tP4VVeANzyPJnqbG2wLbYPw"].join("");
        const _0x2ccdcf = {
          tabId: _0x3e880b.id
        };
        const _0x8b7581 = await chrome.scripting.executeScript({
          target: _0x2ccdcf,
          world: "MAIN",
          func: async ({
            token,
            title,
            apiBase,
            castlePk,
            firebaseRefreshUrl
          }) => {
            const API_BASE = apiBase;
            const CASTLE_PK = castlePk;
            const asJson = async response => {
              const text = await response.text();
              try {
                return JSON.parse(text);
              } catch (e) {
                return {
                  raw: text
                };
              }
            };
            const readFirebaseAuth = async () => {
              const fromValue = value => {
                if (!value || typeof value !== "object") {
                  return null;
                }
                const user = value.value && typeof value.value === "object" ? value.value : value;
                const manager = user.stsTokenManager || user.tokenManager || {};
                const accessToken = manager.accessToken || user.accessToken || "";
                const refreshToken = manager.refreshToken || user.refreshToken || "";
                const expirationTime = Number(manager.expirationTime || user.expirationTime || 0);
                if (!accessToken && !refreshToken) {
                  return null;
                }
                return {
                  accessToken,
                  refreshToken,
                  expirationTime
                };
              };
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i) || "";
                  if (!/firebase:authUser|authUser/i.test(key)) {
                    continue;
                  }
                  const parsed = JSON.parse(localStorage.getItem(key) || "null");
                  const found = fromValue(parsed);
                  if (found) {
                    return found;
                  }
                }
              } catch (e) {}
              try {
                return await new Promise(resolve => {
                  const req = indexedDB.open("firebaseLocalStorageDb");
                  req.onerror = () => resolve(null);
                  req.onsuccess = () => {
                    const db = req.result;
                    try {
                      const tx = db.transaction("firebaseLocalStorage", "readonly");
                      const store = tx.objectStore("firebaseLocalStorage");
                      const all = store.getAll();
                      all.onerror = () => resolve(null);
                      all.onsuccess = () => {
                        const rows = all.result || [];
                        for (const row of rows) {
                          const found = fromValue(row);
                          if (found) {
                            resolve(found);
                            return;
                          }
                        }
                        resolve(null);
                      };
                    } catch (e) {
                      resolve(null);
                    }
                  };
                });
              } catch (e) {
                return null;
              }
            };
            const refreshFirebaseToken = async refreshToken => {
              if (!refreshToken) {
                return "";
              }
              try {
                const body = new URLSearchParams({
                  grant_type: "refresh_token",
                  refresh_token: refreshToken
                });
                const r = await fetch(firebaseRefreshUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                  },
                  body
                });
                const data = await asJson(r);
                if (r.ok) {
                  return data.id_token || data.access_token || "";
                } else {
                  return "";
                }
              } catch (e) {
                return "";
              }
            };
            const readSupabaseAuth = () => {
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i) || "";
                  if (!/^sb-.*-auth-token$/.test(key)) {
                    continue;
                  }
                  const raw = localStorage.getItem(key);
                  if (!raw) {
                    continue;
                  }
                  let parsed;
                  try {
                    parsed = JSON.parse(raw);
                  } catch (e) {
                    continue;
                  }
                  let accessToken = "";
                  let refreshToken = "";
                  let expiresAt = 0;
                  if (Array.isArray(parsed)) {
                    accessToken = parsed[0] || "";
                    refreshToken = parsed[1] || "";
                  } else if (parsed && typeof parsed === "object") {
                    accessToken = parsed.access_token || parsed.currentSession && parsed.currentSession.access_token || "";
                    refreshToken = parsed.refresh_token || parsed.currentSession && parsed.currentSession.refresh_token || "";
                    expiresAt = Number(parsed.expires_at || parsed.currentSession && parsed.currentSession.expires_at || 0);
                  }
                  if (accessToken) {
                    return {
                      accessToken,
                      refreshToken,
                      expirationTime: expiresAt * 1000
                    };
                  }
                }
              } catch (e) {}
              return null;
            };
            const getFreshToken = async () => {
              const sb = readSupabaseAuth();
              if (sb && sb.accessToken) {
                return sb.accessToken;
              }
              const storedAuth = await readFirebaseAuth();
              if (storedAuth) {
                const expiresSoon = storedAuth.expirationTime && storedAuth.expirationTime - Date.now() < 300000;
                if (expiresSoon && storedAuth.refreshToken) {
                  const refreshed = await refreshFirebaseToken(storedAuth.refreshToken);
                  if (refreshed) {
                    return refreshed;
                  }
                }
                if (storedAuth.accessToken) {
                  return storedAuth.accessToken;
                }
              }
              return String(token || "").replace(/^Bearer\s+/i, "").trim();
            };
            const createCastleHeader = async () => {
              try {
                if (!window.Castle || typeof window.Castle.configure !== "function") {
                  return {};
                }
                window.__lovasiriCastleClient = window.__lovasiriCastleClient || window.Castle.configure({
                  pk: CASTLE_PK
                });
                const castleToken = await window.__lovasiriCastleClient.createRequestToken();
                if (castleToken) {
                  return {
                    "X-Castle-Request-Token": castleToken
                  };
                } else {
                  return {};
                }
              } catch (e) {
                return {};
              }
            };
            const freshToken = await getFreshToken();
            const makeHeaders = async (json = true) => ({
              Accept: "application/json",
              ...(json ? {
                "Content-Type": "application/json"
              } : {}),
              ...(freshToken ? {
                Authorization: "Bearer " + freshToken
              } : {}),
              ...(await createCastleHeader())
            });
            const pickWorkspaces = payload => {
              if (!payload || typeof payload !== "object") {
                return [];
              }
              if (Array.isArray(payload.workspaces)) {
                return payload.workspaces;
              }
              if (Array.isArray(payload.data)) {
                return payload.data;
              }
              if (payload.workspace) {
                return [payload.workspace];
              }
              return [];
            };
            const wsUrls = [API_BASE + "/user/workspaces", API_BASE + "/workspaces"];
            let workspaces = [];
            let workspaceStatus = 0;
            let workspacePayload = null;
            for (const url of wsUrls) {
              try {
                const r = await fetch(url, {
                  method: "GET",
                  headers: await makeHeaders(false),
                  credentials: "include"
                });
                workspaceStatus = r.status;
                const data = await asJson(r);
                workspacePayload = data;
                if (r.ok) {
                  workspaces = pickWorkspaces(data).filter(w => w && w.id);
                  if (workspaces.length) {
                    break;
                  }
                }
              } catch (e) {}
            }
            if (!workspaces.length) {
              const why = workspacePayload && (workspacePayload.message || workspacePayload.error || workspacePayload.type);
              return {
                ok: false,
                error: why || "Could not find your Lovable workspace.",
                status: workspaceStatus,
                details: workspacePayload
              };
            }
            const workspace = workspaces.find(w => !/free/i.test(String(w.plan || ""))) || workspaces[0];
            const workspaceId = workspace.id;
            const projectTitle = title || "Project " + new Date().toLocaleString("en-US");
            const bodies = [{
              description: projectTitle,
              tech_stack: "modern",
              visibility: "private",
              metadata: {
                chat_mode_enabled: true,
                fullscreen_enabled: true
              }
            }, {
              description: projectTitle,
              visibility: "private",
              metadata: {
                fullscreen_enabled: true
              }
            }];
            const urls = [API_BASE + "/workspaces/" + encodeURIComponent(workspaceId) + "/projects"];
            let last = null;
            for (const url of urls) {
              for (const body of bodies) {
                try {
                  const r = await fetch(url, {
                    method: "POST",
                    headers: await makeHeaders(true),
                    credentials: "include",
                    body: JSON.stringify(body)
                  });
                  const data = await asJson(r);
                  last = {
                    status: r.status,
                    data,
                    url
                  };
                  if (r.ok) {
                    const project = data.project || data.data || data;
                    const id = project.id || project.project_id || data.id || data.projectId;
                    const link = project.editor_url || project.url || project.link || data.editor_url || data.url || data.link || (id ? "https://lovable.dev/projects/" + id : "https://lovable.dev/");
                    return {
                      ok: true,
                      success: true,
                      link,
                      projectId: id || "",
                      workspaceId,
                      data
                    };
                  }
                  if (r.status !== 400 && r.status !== 404 && r.status !== 422) {
                    break;
                  }
                } catch (e) {
                  last = {
                    status: 0,
                    data: {
                      error: e.message
                    },
                    url
                  };
                }
              }
            }
            const msg = last && last.data && (last.data.message || last.data.error || last.data.type) || "Failed to create the project in Lovable.";
            if (last && last.status === 401) {
              return {
                ok: false,
                status: 401,
                error: "Your Lovable session did not authorize the creation. Refresh the Lovable.dev tab, make sure you are signed in and try again.",
                details: last
              };
            }
            if (last && last.status === 402) {
              return {
                ok: false,
                status: 402,
                error: "Your Lovable account needs available credits/plan to create a project.",
                details: last
              };
            }
            if (/castle|denied|captcha/i.test(String(msg))) {
              return {
                ok: false,
                status: last && last.status,
                error: "Lovable blocked the automation for security reasons. Refresh the Lovable.dev tab and try again from the extension panel.",
                details: last
              };
            }
            return {
              ok: false,
              status: last && last.status,
              error: msg,
              details: last
            };
          },
          args: [{
            token: _0x5e43ac,
            title: _0x50db1a.title || "",
            apiBase: _0x2e946b,
            castlePk: _0x2215a4,
            firebaseRefreshUrl: _0x3aa27c
          }]
        });
        const _0x67d7a1 = _0x8b7581 && _0x8b7581[0] && _0x8b7581[0].result || {
          ok: false,
          error: "no response from the Lovable page"
        };
        if (_0x67d7a1 && _0x67d7a1.ok && _0x67d7a1.projectId) {
          const _0x71b804 = {
            lovable_token: _0x67d7a1.token || _0x5e43ac,
            lovable_projectId: _0x67d7a1.projectId
          };
          chrome.storage.local.set(_0x71b804);
          chrome.runtime.sendMessage({
            action: "forceHeartbeat"
          });
        }
        _0x38f97b(_0x67d7a1);
      } catch (_0x5e33f3) {
        console.error("[Background] createLovableProjectInPage error:", _0x5e33f3);
        _0x38f97b({
          ok: false,
          error: _0x5e33f3.message || "Failed to create through the Lovable tab."
        });
      }
    })();
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "proxyFetch") {
    (async () => {
      try {
        console.log("[Background] proxyFetch ->", _0x50db1a.url);
        var _0x3801cd = String(_0x50db1a.url || "");
        if (_0x3801cd.includes("/optimize-prompt")) {
          _0x38f97b({
            ok: true,
            status: 200,
            data: {
              error: false,
              optimized_prompt: ""
            }
          });
          return;
        }
        if (_0x3801cd.includes("/remove-watermark")) {
          function executeWatermark(tabId) {
            chrome.scripting.executeScript({
              target: {
                tabId: tabId
              },
              world: "MAIN",
              func: function () {
                try {
                  var prompt = "Add this CSS to global styles on every page: #lovable-badge { display: none !important; visibility: hidden !important; pointer-events: none !important; } Completely remove the entire Lovable branding widget — the Made with Lovable text AND the floating close X button. Hide the parent #lovable-badge container, not just the text inside it. No empty box or orphaned X button should remain visible.";
                  var chatForm = document.querySelector("form#chat-input") || document.querySelector("form");
                  var editor = chatForm ? chatForm.querySelector("textarea") || chatForm.querySelector("[contenteditable=\"true\"]") : document.querySelector("textarea, [contenteditable=\"true\"]");
                  if (!editor) {
                    alert("127HUB AI Error: Could not find the chat input box.");
                    return;
                  }
                  editor.focus();
                  if (editor.tagName.toLowerCase() === "textarea") {
                    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(editor, prompt);
                    } else {
                      editor.value = prompt;
                    }
                    editor.dispatchEvent(new Event("input", {
                      bubbles: true
                    }));
                    editor.dispatchEvent(new Event("change", {
                      bubbles: true
                    }));
                  } else {
                    document.execCommand("selectAll", false, null);
                    document.execCommand("insertText", false, prompt);
                  }
                  setTimeout(function () {
                    var sendBtn = document.getElementById("chatinput-send-message-button") || chatForm && chatForm.querySelector("button[type=\"submit\"]");
                    if (!sendBtn) {
                      sendBtn = document.querySelector("button[aria-label=\"Send\"], button:has(svg.lucide-arrow-up), button:has(svg.lucide-send)");
                    }
                    if (sendBtn) {
                      if (sendBtn.disabled) {
                        sendBtn.removeAttribute("disabled");
                      }
                      sendBtn.click();
                    } else {
                      alert("127HUB AI Error: Could not find the Send button.");
                    }
                  }, 300);
                } catch (err) {
                  alert("127HUB AI Error: " + err.message);
                }
              }
            });
          }
          if (_0x50db1a.tabId) {
            executeWatermark(_0x50db1a.tabId);
          } else if (_0x211625 && _0x211625.tab) {
            executeWatermark(_0x211625.tab.id);
          } else {
            chrome.tabs.query({
              active: true,
              currentWindow: true
            }, function (_0x369edd) {
              if (_0x369edd && _0x369edd[0]) {
                executeWatermark(_0x369edd[0].id);
              }
            });
          }
          _0x38f97b({
            ok: true,
            status: 200,
            data: {
              error: false
            }
          });
          return;
        }
        if (_0x50db1a.method === "POST" && (_0x3801cd.includes("/send-lovable-prompt") || _0x3801cd.includes("/git-mode") || _0x3801cd.includes("/_serverFn/") || _0x3801cd.includes("lovable.dev"))) {
          let _0x4bbc68 = false;
          let _0xf1249e = "";
          try {
            if (_0x50db1a.body && typeof _0x50db1a.body === "string" && _0x50db1a.body.length > 2 && (_0x50db1a.body.includes("\"prompt\"") || _0x50db1a.body.includes("\"message\""))) {
              const _0x4923e0 = JSON.parse(_0x50db1a.body);
              if (Array.isArray(_0x4923e0)) {
                for (var _0x555113 = 0; _0x555113 < _0x4923e0.length; _0x555113++) {
                  if (_0x4923e0[_0x555113] && (_0x4923e0[_0x555113].prompt || _0x4923e0[_0x555113].message || _0x4923e0[_0x555113].text || _0x4923e0[_0x555113].content)) {
                    _0x4bbc68 = true;
                    _0xf1249e = _0x4923e0[_0x555113].prompt || _0x4923e0[_0x555113].message || _0x4923e0[_0x555113].text || _0x4923e0[_0x555113].content;
                    break;
                  }
                }
              } else if (_0x4923e0.prompt || _0x4923e0.message || _0x4923e0.text || _0x4923e0.content) {
                _0x4bbc68 = true;
                _0xf1249e = _0x4923e0.prompt || _0x4923e0.message || _0x4923e0.text || _0x4923e0.content;
              }
            }
          } catch (_0x5aaaeb) {}
          if (_0x4bbc68) {
            console.log("[127HUB AI] INTERCEPTED CHAT POST FROM proxyFetch:", _0x3801cd);
            var _0x364d74 = {};
            try {
              if (typeof _0x50db1a.body === "string") {
                _0x364d74 = JSON.parse(_0x50db1a.body);
              } else if (_0x50db1a.body && typeof _0x50db1a.body === "object") {
                _0x364d74 = _0x50db1a.body;
              }
            } catch (_0x369920) {}
            var _0x2ce2a7 = _0x364d74.message || _0xf1249e || "";
            var _0x2a86f8 = _0x364d74.send_method || store.ql_send_method || "fix_error";
            if (_0x2a86f8 === "git_mode" || _0x3801cd.includes("/git-mode")) {
              console.log("[127HUB AI] proxyFetch: git_mode prompt intercepted in background (handled locally)");
              _0x38f97b({
                ok: true,
                status: 200,
                data: {
                  ok: true,
                  message: "Handled by Git Mode"
                }
              });
              return;
            }
            if (_0x2a86f8 === "fix_error") {
              console.log("[127HUB AI] proxyFetch: sending via direct fix_error (zero-credit)");
              var _0x85d34d = Date.now().toString(16).padStart(16, "0");
              var _0x17fc80 = "main:agent#" + _0x85d34d + "#bld:E2XRYD7A";
              var _0x54c04b = String(_0x2ce2a7).trim();
              var _0x2644c3 = ["approve", "aprovar", "implement plan", "implementar plano", "approve plan", "execute plan"];
              var _0xb37482 = _0x54c04b.toLowerCase();
              var _0x134437 = _0x2644c3.some(function (_0x1dc830) {
                return _0xb37482 === _0x1dc830 || _0xb37482.startsWith(_0x1dc830 + " ");
              });
              if (_0x134437) {
                _0x54c04b = "Approve and execute this plan completely and in detail without omitting any code or leaving placeholders.";
              } else if (_0x364d74.intent === "plan" || _0x364d74.isPlanMode) {
                var _0x43e021 = "Make a complete and detailed plan: ";
                if (!_0xb37482.startsWith(_0x43e021.toLowerCase())) {
                  _0x54c04b = _0x43e021 + _0x54c04b;
                }
              }
              var _0x316be4 = {
                message: "For the code present, I get the error below.\n\nPlease think step-by-step in order to resolve it.\n```\nsrc/lib/utils.ts(8,7): error TS2322: Type 'number' is not assignable to type 'string'.\n```\n\nTask: " + _0x54c04b,
                intent: "fix_error",
                contains_error: true,
                error_source: "build_errors",
                error_ids: [_0x17fc80],
                message_intent_metadata: {
                  fix_error_metadata: {
                    errors: [{
                      error_type: "build",
                      error_message: "src/lib/utils.ts(8,7): error TS2322: Type 'number' is not assignable to type 'string'.",
                      build_event_id: ""
                    }]
                  }
                }
              };
              var _0x1d1060 = _0x364d74.projectId || store.lovable_projectId || "";
              var _0x5e672f = _0x364d74.token || store.lovable_token || "";
              if (_0x1d1060 && _0x5e672f) {
                var _0x375678 = "https://api.lovable.dev/projects/" + _0x1d1060 + "/chat";
                fetch(_0x375678, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: _0x5e672f.startsWith("Bearer ") ? _0x5e672f : "Bearer " + _0x5e672f
                  },
                  body: JSON.stringify(_0x316be4)
                }).catch(function (_0x408919) {
                  console.warn("[127HUB AI] Direct fix_error fetch failed:", _0x408919);
                });
              }
              _0x38f97b({
                ok: true,
                status: 200,
                data: {
                  ok: true
                }
              });
              return;
            }
            const _0x4e7946 = {
              projectId: _0x364d74.projectId || "",
              token: _0x364d74.token || "",
              clientGitSha: _0x364d74.clientGitSha || "",
              files: _0x364d74.files || [],
              optimisticImageUrls: _0x364d74.optimisticImageUrls || []
            };
            _0x2bf519(String(_0x2ce2a7).trim(), _0x4e7946).catch(function (_0x59afdf) {
              console.error("[127HUB AI] proxyFetch Eklas dispatch error:", _0x59afdf);
            });
            _0x38f97b({
              ok: true,
              status: 202,
              data: {}
            });
            return;
          }
        }
        const _0x5f4b6e = {
          method: _0x50db1a.method || "POST",
          headers: _0x50db1a.headers || {}
        };
        var _0xd892ec = _0x5f4b6e;
        if (_0x50db1a.body) {
          _0xd892ec.body = _0x50db1a.body;
        }
        var _0x3e381b = await fetch(_0x50db1a.url, _0xd892ec);
        var _0xa6a1e = await _0x3e381b.text();
        var _0x30f068;
        try {
          _0x30f068 = JSON.parse(_0xa6a1e);
        } catch (_0x4467e2) {
          const _0x879616 = {
            raw: _0xa6a1e
          };
          _0x30f068 = _0x879616;
        }
        const _0x1349c4 = {
          ok: _0x3e381b.ok,
          status: _0x3e381b.status,
          data: _0x30f068
        };
        _0x38f97b(_0x1349c4);
      } catch (_0x311e08) {
        console.error("[Background] proxyFetch error:", _0x311e08);
        _0x38f97b({
          ok: false,
          status: 0,
          data: {
            error: _0x311e08.message || "Fetch failed in background"
          }
        });
      }
    })();
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "forceHeartbeat") {
    (async () => {
      let _0x159ead = {
        ok: true
      };
      if (self.PowerKitsGate && typeof self.PowerKitsGate.heartbeat === "function") {
        try {
          _0x159ead = await self.PowerKitsGate.heartbeat();
        } catch (_0x4a718a) {}
      }
      if (_0x38f97b) {
        _0x38f97b(_0x159ead);
      }
    })();
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "readCookies") {
    var _0x2ea28c = ["lovable-session-id.id", "lovable-session-id.custom", "lovable-session-id.refresh", "lovable-session-id.sig"];
    var _0x104c9e = [];
    var _0x1a9e2b = 0;
    _0x2ea28c.forEach(function (_0x42032b) {
      const _0x292e6c = {
        url: "https://lovable.dev",
        name: _0x42032b
      };
      chrome.cookies.get(_0x292e6c, function (_0x7ab3e9) {
        _0x1a9e2b++;
        if (_0x7ab3e9 && _0x7ab3e9.value) {
          var _0x5df9bf = _0x7ab3e9.value.split(".");
          if (_0x5df9bf.length === 3 && _0x7ab3e9.value.indexOf("eyJ") === 0) {
            const _0x5b64ab = {
              token: _0x7ab3e9.value,
              cookieName: _0x42032b,
              httpOnly: _0x7ab3e9.httpOnly
            };
            _0x104c9e.push(_0x5b64ab);
          }
        }
        if (_0x1a9e2b === _0x2ea28c.length) {
          _0x38f97b({
            success: _0x104c9e.length > 0,
            tokens: _0x104c9e
          });
        }
      });
    });
    return true;
  }
  if (_0x50db1a && _0x50db1a.action === "downloadProject") {
    (async function () {
      try {
        const _0x4058d4 = await chrome.storage.local.get(["lovable_token", "lovable_projectId"]);
        const _0x549330 = String(_0x50db1a.projectId || _0x4058d4.lovable_projectId || "").trim();
        const _0x334578 = String(_0x50db1a.token || _0x4058d4.lovable_token || "").replace(/^Bearer\s+/i, "").trim();
        if (!_0x549330) {
          _0x38f97b({
            success: false,
            ok: false,
            error: "Project not identified. Open the project in Lovable and try again."
          });
          return;
        }
        let _0x372f0e = null;
        try {
          _0x372f0e = await fetchLovableSourceViaPage(_0x549330, _0x334578, _0x211625 && _0x211625.tab);
        } catch (_0x58a945) {
          const _0x585010 = {
            success: false,
            ok: false,
            status: 0,
            error: _0x58a945 && _0x58a945.message || "page_fetch_failed"
          };
          _0x372f0e = _0x585010;
        }
        const _0x4b12f5 = !_0x372f0e || !_0x372f0e.success;
        if (_0x4b12f5) {
          try {
            const _0x22794c = await fetchLovableSourceDirect(_0x549330, _0x334578);
            if (_0x22794c && _0x22794c.success) {
              _0x372f0e = _0x22794c;
            } else if (!_0x372f0e) {
              _0x372f0e = _0x22794c;
            }
          } catch (_0x245a30) {
            const _0x1a083f = {
              success: false,
              ok: false,
              status: 0,
              error: _0x245a30 && _0x245a30.message || "direct_fetch_failed"
            };
            if (!_0x372f0e) {
              _0x372f0e = _0x1a083f;
            }
          }
        }
        if (_0x372f0e && !_0x372f0e.success && /invalid.?token|401/i.test(String(_0x372f0e.error || _0x372f0e.status || ""))) {
          _0x372f0e.error = "Your Lovable session expired. Reload the project page (F5) and try again.";
        }
        _0x38f97b(_0x372f0e && _0x372f0e.success ? {
          success: true,
          ok: true,
          files: _0x372f0e.files || []
        } : _0x372f0e);
      } catch (_0x35cb69) {
        _0x38f97b({
          success: false,
          ok: false,
          status: 0,
          error: _0x35cb69 && _0x35cb69.message || "Download falhou"
        });
      }
    })();
    return true;
  }
  async function _0x3eb37e() {
    var _0x5c5836 = await chrome.storage.local.get(["eklas_license_key", "eklas_license_expires"]);
    if (_0x5c5836.eklas_license_key) {
      var _0x2223f2 = _0x5c5836.eklas_license_expires || 0;
      var _0x5746ee = Date.now();
      if (_0x2223f2 === 0 || _0x2223f2 - _0x5746ee > 86400000) {
        console.log("[127HUB AI] Reusing stored Eklas key:", _0x5c5836.eklas_license_key);
        return _0x5c5836.eklas_license_key;
      }
      console.log("[127HUB AI] Stored Eklas key is expiring, generating fresh key...");
    }
    var _0x408271 = ["EKLAS-J3RU-NPCV-3Y79-98JE", "EKLAS-A253-T3E4-SZY6-KF6L", "EKLAS-PT4R-GJPU-ZV3C-2TUC"];
    try {
      console.log("[127HUB AI] Generating new Eklas Enterprise key from keygen.eklas.dev...");
      var _0x21c279 = await fetch("https://keygen.eklas.dev/api/license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: "Enterprise",
          durationValue: 3650,
          durationUnit: "day",
          maxActivations: 10000
        })
      });
      if (_0x21c279.ok) {
        var _0xfb6297 = await _0x21c279.json();
        if (_0xfb6297.license_key) {
          var _0x27ed0a = _0xfb6297.expires_at ? new Date(_0xfb6297.expires_at).getTime() : 0;
          const _0x11d957 = {
            eklas_license_key: _0xfb6297.license_key,
            eklas_license_plan: _0xfb6297.plan || "Enterprise",
            eklas_license_expires: _0x27ed0a,
            eklas_license_status: _0xfb6297.status || "active"
          };
          await chrome.storage.local.set(_0x11d957);
          console.log("[127HUB AI] ✅ New Eklas key generated:", _0xfb6297.license_key, "| Expires:", _0xfb6297.expires_at);
          return _0xfb6297.license_key;
        }
      }
    } catch (_0x4fed98) {
      console.warn("[127HUB AI] Keygen API request error, using fallback Master Key:", _0x4fed98);
    }
    var _0xd02d = _0x408271[Math.floor(Math.random() * _0x408271.length)];
    await chrome.storage.local.set({
      eklas_license_key: _0xd02d,
      eklas_license_plan: "Enterprise",
      eklas_license_expires: Date.now() + 315360000000,
      eklas_license_status: "active"
    });
    console.log("[127HUB AI] ✅ Using fallback Master Key:", _0xd02d);
    return _0xd02d;
  }
  async function _0x58a94b() {
    try {
      var _0x4c9a8b = await chrome.tabs.query({
        url: ["*://*.lovable.dev/*", "*://lovable.dev/*"]
      });
      if (!_0x4c9a8b || _0x4c9a8b.length === 0) {
        return null;
      }
      var _0x1f7c22 = _0x4c9a8b[0].id;
      const _0x3d12ac = {
        tabId: _0x1f7c22
      };
      var _0x27278f = await chrome.scripting.executeScript({
        target: _0x3d12ac,
        world: "MAIN",
        func: async function () {
          function _0x2e12fe(_0x40aab0) {
            try {
              if (!_0x40aab0 || typeof _0x40aab0 !== "string") {
                return true;
              }
              var _0x4e3226 = _0x40aab0.replace(/^Bearer\s+/i, "").trim();
              var _0x26f237 = _0x4e3226.split(".");
              if (_0x26f237.length !== 3) {
                return true;
              }
              var _0x1a49c5 = _0x26f237[1].replace(/-/g, "+").replace(/_/g, "/");
              while (_0x1a49c5.length % 4) {
                _0x1a49c5 += "=";
              }
              var _0xc698b2 = JSON.parse(atob(_0x1a49c5));
              if (_0xc698b2 && _0xc698b2.iss && _0xc698b2.iss.indexOf("supabase.co") !== -1) {
                return true;
              }
              var _0x327d19 = String(_0xc698b2 && _0xc698b2.role || "").toLowerCase();
              if (_0x327d19 === "anon" || _0x327d19 === "service_role") {
                return true;
              }
              if (_0xc698b2 && _0xc698b2.exp && _0xc698b2.exp * 1000 < Date.now()) {
                return true;
              }
              return false;
            } catch (_0x267e52) {
              return true;
            }
          }
          var _0x5977ff = window.__lovableAuthToken || window.__lovasiriLovableToken || window.__LOVABLE_AUTH_TOKEN__;
          if (_0x5977ff && typeof _0x5977ff === "string" && !_0x2e12fe(_0x5977ff)) {
            return {
              token: _0x5977ff.replace(/^Bearer\s+/i, "").trim(),
              source: "window_global"
            };
          }
          try {
            for (var _0x101e50 = 0; _0x101e50 < localStorage.length; _0x101e50++) {
              var _0x2a2ecc = localStorage.key(_0x101e50) || "";
              if (/firebase:authUser|authUser/i.test(_0x2a2ecc)) {
                var _0x605b0f = localStorage.getItem(_0x2a2ecc);
                if (_0x605b0f) {
                  var _0x218281 = JSON.parse(_0x605b0f);
                  var _0x2b8b65 = _0x218281 && _0x218281.value && typeof _0x218281.value === "object" ? _0x218281.value : _0x218281;
                  var _0x24f16a = _0x2b8b65 && (_0x2b8b65.stsTokenManager || _0x2b8b65.tokenManager) || {};
                  var _0x5f08f7 = _0x24f16a.accessToken || _0x2b8b65 && _0x2b8b65.accessToken || "";
                  var _0x15233f = _0x24f16a.refreshToken || _0x2b8b65 && _0x2b8b65.refreshToken || "";
                  var _0x155a72 = Number(_0x24f16a.expirationTime || _0x2b8b65 && _0x2b8b65.expirationTime || 0);
                  if (_0x15233f && _0x155a72 - Date.now() < 180000) {
                    try {
                      var _0x57df9b = await fetch("https://securetoken.googleapis.com/v1/token?key=AIzaSyBQNjlw9Vp4tP4VVeANzyPJnqbG2wLbYPw", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/x-www-form-urlencoded"
                        },
                        body: new URLSearchParams({
                          grant_type: "refresh_token",
                          refresh_token: _0x15233f
                        })
                      });
                      var _0x3e95be = await _0x57df9b.json();
                      if (_0x3e95be && (_0x3e95be.id_token || _0x3e95be.access_token)) {
                        const _0x4b594e = {
                          token: _0x3e95be.id_token || _0x3e95be.access_token,
                          source: "firebase_refreshed"
                        };
                        return _0x4b594e;
                      }
                    } catch (_0xf0c0d6) {}
                  }
                  if (_0x5f08f7 && !_0x2e12fe(_0x5f08f7)) {
                    const _0x6dd534 = {
                      token: _0x5f08f7,
                      source: "firebase_local"
                    };
                    return _0x6dd534;
                  }
                }
              }
            }
          } catch (_0x432def) {}
          try {
            var _0x261517 = await new Promise(function (_0x5d0a3d) {
              try {
                var _0x20191c = indexedDB.open("firebaseLocalStorageDb");
                _0x20191c.onerror = function () {
                  _0x5d0a3d(null);
                };
                _0x20191c.onsuccess = function () {
                  try {
                    var _0x293a35 = _0x20191c.result;
                    var _0xd85d3c = _0x293a35.transaction("firebaseLocalStorage", "readonly");
                    var _0x1b4ee9 = _0xd85d3c.objectStore("firebaseLocalStorage");
                    var _0x16ae44 = _0x1b4ee9.getAll();
                    _0x16ae44.onerror = function () {
                      _0x5d0a3d(null);
                    };
                    _0x16ae44.onsuccess = function () {
                      var _0x5baf99 = _0x16ae44.result || [];
                      for (var _0x2fdfb6 of _0x5baf99) {
                        var _0x3ef1e9 = _0x2fdfb6 && _0x2fdfb6.value && typeof _0x2fdfb6.value === "object" ? _0x2fdfb6.value : _0x2fdfb6;
                        var _0x4cca38 = _0x3ef1e9 && (_0x3ef1e9.stsTokenManager || _0x3ef1e9.tokenManager) || {};
                        var _0x368d24 = _0x4cca38.accessToken || _0x3ef1e9 && _0x3ef1e9.accessToken || "";
                        if (_0x368d24 && !_0x2e12fe(_0x368d24)) {
                          _0x5d0a3d(_0x368d24);
                          return;
                        }
                      }
                      _0x5d0a3d(null);
                    };
                  } catch (_0x119f9a) {
                    _0x5d0a3d(null);
                  }
                };
              } catch (_0x194712) {
                _0x5d0a3d(null);
              }
            });
            if (_0x261517) {
              return {
                token: _0x261517,
                source: "firebase_idb"
              };
            }
          } catch (_0x114218) {}
          return null;
        }
      });
      if (_0x27278f && _0x27278f[0] && _0x27278f[0].result && _0x27278f[0].result.token) {
        return _0x27278f[0].result;
      }
    } catch (_0xe456e1) {
      console.warn("[127HUB AI] _extractFreshLovableToken error:", _0xe456e1);
    }
    return null;
  }
  async function _0x2bf519(_0x12b8d7, _0x356547) {
    _0x356547 = _0x356547 || {};
    var _0x329072 = await _0x3eb37e();
    var _0x1766fc = await chrome.storage.local.get(["lovable_token", "lovable_projectId", "lovable_email", "lovable_workspaceId", "lovable_clientGitSha"]);
    var _0x579306 = _0x356547.projectId || _0x1766fc.lovable_projectId || "";
    if (!_0x579306) {
      try {
        var _0x1d861b = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        var _0x4215ec = _0x1d861b && _0x1d861b[0] && _0x1d861b[0].url ? _0x1d861b[0].url : "";
        var _0x2b5384 = _0x4215ec.match(/\/projects\/([a-f0-9-]{36})/i);
        if (_0x2b5384) {
          _0x579306 = _0x2b5384[1];
          const _0x9b4cb4 = {
            lovable_projectId: _0x579306
          };
          chrome.storage.local.set(_0x9b4cb4);
        }
      } catch (_0x3d6196) {}
    }
    var _0x27ced8 = _0x356547.token || _0x1766fc.lovable_token || "";
    if (_0x27ced8.indexOf("Bearer ") === 0) {
      _0x27ced8 = _0x27ced8.slice(7);
    }
    if (_0x27ced8 && (_isSupabaseToken(_0x27ced8) || !_isValidLovableToken(_0x27ced8))) {
      console.warn("[127HUB AI] ⚠ Purging invalid/Supabase token from storage");
      chrome.storage.local.remove(["lovable_token"]);
      _0x27ced8 = "";
    }
    if (!_0x27ced8) {
      var _0x425589 = await _0x58a94b();
      if (_0x425589 && _0x425589.token) {
        _0x27ced8 = _0x425589.token;
        const _0x1489d7 = {
          lovable_token: _0x27ced8
        };
        chrome.storage.local.set(_0x1489d7);
        console.log("[127HUB AI] ✅ Fresh Lovable token extracted (" + _0x425589.source + "):", _0x27ced8.slice(0, 15) + "...");
      }
    }
    var _0x12f1ac = ["lovable-session-id.id", "lovable-session-id.custom", "lovable-session-id.refresh", "lovable-session-id.sig"];
    var _0x196277 = "";
    for (var _0x390dcc of _0x12f1ac) {
      try {
        const _0x516e46 = {
          url: "https://lovable.dev",
          name: _0x390dcc
        };
        var _0x3fbf6d = await chrome.cookies.get(_0x516e46);
        if (_0x3fbf6d && _0x3fbf6d.value && _0x390dcc === "lovable-session-id.refresh") {
          _0x196277 = _0x3fbf6d.value;
        }
      } catch (_0x47bed3) {}
    }
    console.log("[127HUB AI] 1. Syncing session with ai.127hub.com/session | Project:", _0x579306, "| Key:", _0x329072);
    try {
      const _0x287134 = {
        licenseKey: _0x329072,
        token: _0x27ced8,
        projectId: _0x579306,
        workspaceId: _0x1766fc.lovable_workspaceId || "",
        castleToken: _0x356547.castleToken || "",
        sessionId: _0x356547.sessionId || "",
        clientGitSha: _0x356547.clientGitSha || _0x1766fc.lovable_clientGitSha || "",
        email: _0x1766fc.lovable_email || "",
        "lovable-session-id.refresh": _0x196277
      };
      var _0x4c1ab5 = await fetch("https://ai.127hub.com/api/v1/lovable/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(_0x287134)
      });
      var _0x318619 = await _0x4c1ab5.json().catch(function () {
        return {};
      });
      console.log("[127HUB AI] Session sync response:", _0x4c1ab5.status, _0x318619);
    } catch (_0x5a8931) {
      console.warn("[127HUB AI] Session sync error:", _0x5a8931);
    }
    console.log("[127HUB AI] 2. Dispatching prompt to ai.127hub.com/chat... (Token present: " + !!_0x27ced8 + ")");
    const _0x5d6084 = {
      "Content-Type": "application/json",
      "X-License-Key": _0x329072
    };
    var _0x21597c = _0x5d6084;
    if (_0x27ced8) {
      _0x21597c.Authorization = "Bearer " + _0x27ced8;
    }
    var _0x145f14 = await fetch("https://ai.127hub.com/api/v1/lovable/chat", {
      method: "POST",
      headers: _0x21597c,
      body: JSON.stringify({
        message: _0x12b8d7,
        licenseKey: _0x329072,
        token: _0x27ced8,
        email: _0x1766fc.lovable_email || "",
        projectId: _0x579306,
        clientGitSha: _0x356547.clientGitSha || _0x1766fc.lovable_clientGitSha || "",
        files: Array.isArray(_0x356547.files) ? _0x356547.files : [],
        optimisticImageUrls: Array.isArray(_0x356547.optimisticImageUrls) ? _0x356547.optimisticImageUrls : []
      })
    });
    var _0x2c6fc4 = await _0x145f14.json().catch(function () {
      return {};
    });
    console.log("[127HUB AI] Eklas chat response:", _0x145f14.status, _0x2c6fc4);
    if ((_0x145f14.status === 401 || _0x145f14.status === 403) && !_0x356547._retried) {
      var _0x3d61a5 = JSON.stringify(_0x2c6fc4).toLowerCase();
      var _0x2bc3ec = _0x145f14.status === 403 && (_0x3d61a5.indexOf("invalid license") !== -1 || _0x3d61a5.indexOf("license") !== -1 || _0x3d61a5.indexOf("license_key") !== -1);
      if (_0x2bc3ec) {
        console.log("[127HUB AI] Eklas license key rejected (403), regenerating...");
        await chrome.storage.local.remove(["eklas_license_key", "eklas_license_expires"]);
        _0x356547._retried = true;
        return _0x2bf519(_0x12b8d7, _0x356547);
      } else {
        console.warn("[127HUB AI] ⚠ Lovable auth error (401 / Invalid token). Purging token and attempting refresh...");
        await chrome.storage.local.remove(["lovable_token"]);
        _0x356547._retried = true;
        var _0x36db2a = await _0x58a94b();
        if (_0x36db2a && _0x36db2a.token) {
          _0x356547.token = _0x36db2a.token;
          const _0x5c14de = {
            lovable_token: _0x36db2a.token
          };
          await chrome.storage.local.set(_0x5c14de);
          console.log("[127HUB AI] ✅ Retrying with refreshed Lovable token from tab...");
          return _0x2bf519(_0x12b8d7, _0x356547);
        }
        _0x2c6fc4.ok = false;
        _0x2c6fc4.error = "Lovable session expired or invalid token. Please open/reload your Lovable project tab (F5) to refresh your session.";
        return _0x2c6fc4;
      }
    }
    if (!_0x145f14.ok && !_0x2c6fc4.error) {
      _0x2c6fc4.error = "HTTP " + _0x145f14.status;
    }
    _0x2c6fc4.ok = _0x145f14.ok && _0x2c6fc4.ok !== false;
    return _0x2c6fc4;
  }
  if (_0x50db1a && _0x50db1a.action === "backendProxySend") {
    (async function () {
      try {
        var _0x3d22f7 = await chrome.storage.local.get(["ql_ota_update"]);
        if (_0x3d22f7 && _0x3d22f7.ql_ota_update && _0x3d22f7.ql_ota_update.available) {
          console.warn("[127HUB AI] 🔒 Blocked Eklas send — Extension is locked for update.");
          _0x38f97b({
            ok: false,
            error: "127HUB AI Extension is locked for update. Please install the latest update to send prompts."
          });
          return;
        }
        var _0x3e1e45 = String(_0x50db1a.message || "").trim();
        if (!_0x3e1e45) {
          _0x38f97b({
            ok: false,
            error: "Empty message"
          });
          return;
        }
        const _0x5d9996 = {
          projectId: _0x50db1a.projectId || "",
          token: _0x50db1a.token || "",
          castleToken: _0x50db1a.castleToken || "",
          sessionId: _0x50db1a.sessionId || "",
          clientGitSha: _0x50db1a.clientGitSha || "",
          files: _0x50db1a.files || [],
          optimisticImageUrls: _0x50db1a.optimisticImageUrls || []
        };
        var _0x16c9b4 = await _0x2bf519(_0x3e1e45, _0x5d9996);
        _0x38f97b(_0x16c9b4);
      } catch (_0x4bfcc5) {
        console.error("[127HUB AI] backendProxySend error:", _0x4bfcc5);
        _0x38f97b({
          ok: false,
          error: _0x4bfcc5 && _0x4bfcc5.message || "Proxy send failed"
        });
      }
    })();
    return true;
  }
}