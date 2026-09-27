/**
 * rename.mjs — turn the webcrack output of background.js (strings already decoded,
 * control flow already flattened, but every local still named `_0x1a2b3c`) into a
 * readable, fully renamed file.
 *
 * Strategy: resolve every `_0x…` identifier to its Babel binding, gather evidence
 * about how it is used (initialiser shape, properties read on it, what it is passed
 * to, the chrome API called in its body), then pick a descriptive name from an
 * ordered rule list. Names are made unique globally so nothing is shadowed.
 *
 *   node rename.mjs out/deobfuscated.js renamed.js [--dump]
 */
import fs from "node:fs";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";
import { parse } from "@babel/parser";

const traverse = _traverse.default ?? _traverse;
const generate = _generate.default ?? _generate;

const INPUT = process.argv[2] ?? "out/deobfuscated.js";
const OUTPUT = process.argv[3] ?? "renamed.js";
const dump = process.argv.includes("--dump");

const code = fs.readFileSync(INPUT, "utf8");
const ast = parse(code, {
  sourceType: "unambiguous",
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
});

const isHex = (s) => typeof s === "string" && /^_0x[0-9a-f]+$/.test(s);
const src = (n) => {
  try {
    return generate(n, { compact: true }).code;
  } catch {
    return "";
  }
};

/* ------------------------------------------------------------------ *
 * 1. collect one record per binding
 * ------------------------------------------------------------------ */
const records = new Map(); // binding.identifier node -> record

traverse(ast, {
  Identifier(p) {
    const n = p.node.name;
    if (!isHex(n)) return;
    const par = p.parentPath;
    if (par.isMemberExpression() && par.node.property === p.node && !par.node.computed) return;
    if (
      (par.isObjectProperty() || par.isObjectMethod()) &&
      par.node.key === p.node &&
      !par.node.computed
    )
      return;
    const binding = p.scope.getBinding(n);
    if (!binding) return;
    let rec = records.get(binding.identifier);
    if (!rec) {
      rec = {
        binding,
        name: binding.identifier.name,
        refs: [],
        infos: [],
        paramIndex: undefined,
        declLine: p.node.loc?.start.line ?? 0,
      };
      records.set(binding.identifier, rec);
    }
    rec.refs.push(p);
  },
});

/* ------------------------------------------------------------------ *
 * 2. helpers
 * ------------------------------------------------------------------ */
function calleeName(c) {
  if (!c) return null;
  if (t.isIdentifier(c)) return c.name;
  if (t.isMemberExpression(c) || t.isOptionalMemberExpression(c)) {
    const o = calleeName(c.object) ?? "(expr)";
    const pr = c.computed
      ? t.isStringLiteral(c.property)
        ? c.property.value
        : "(key)"
      : t.isIdentifier(c.property)
        ? c.property.name
        : "(key)";
    return `${o}.${pr}`;
  }
  if (c.type === "ChainExpression") return calleeName(c.expression);
  return null;
}

function refInfo(path) {
  const p = path.parentPath;
  if (!p) return { kind: "other" };
  const n = p.node;
  if ((t.isCallExpression(n) || t.isOptionalCallExpression(n)) && n.callee === path.node)
    return { kind: "callee", node: n };
  if ((t.isMemberExpression(n) || t.isOptionalMemberExpression(n)) && n.object === path.node) {
    const prop = n.computed
      ? t.isStringLiteral(n.property)
        ? n.property.value
        : null
      : t.isIdentifier(n.property)
        ? n.property.name
        : null;
    return { kind: "member", prop, node: n };
  }
  if (
    (t.isCallExpression(n) || t.isOptionalCallExpression(n) || t.isNewExpression(n)) &&
    n.arguments.includes(path.node)
  )
    return {
      kind: "arg",
      callee: calleeName(n.callee),
      index: n.arguments.indexOf(path.node),
      node: n,
    };
  if (t.isReturnStatement(n)) return { kind: "return", node: n };
  if (t.isAssignmentExpression(n) && n.right === path.node) return { kind: "assigned", node: n };
  if (t.isBinaryExpression(n) || t.isLogicalExpression(n))
    return { kind: "binary", op: n.operator, node: n };
  if (t.isUnaryExpression(n)) return { kind: "unary", op: n.operator, node: n };
  if (t.isObjectProperty(n)) return { kind: "value", node: n };
  if (t.isArrayExpression(n)) return { kind: "array", node: n };
  if (t.isSpreadElement(n)) return { kind: "spread", node: n };
  if (t.isConditionalExpression(n)) return { kind: "cond", node: n };
  if (t.isVariableDeclarator(n)) return { kind: "declInit", node: n };
  if (t.isTemplateLiteral(n)) return { kind: "tpl", node: n };
  return { kind: "other", node: n };
}

/** minimal recursive AST walk — babel/traverse cannot traverse detached sub-nodes */
function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  const keys = t.VISITOR_KEYS[node.type];
  if (!keys) return;
  for (const k of keys) {
    const child = node[k];
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === "string") walk(c, visit);
    } else if (child && typeof child.type === "string") walk(child, visit);
  }
}

/**
 * `const X = "some string"` constants: obfuscated names are unique across the file,
 * so a name -> value map is enough to resolve `[QL_TOKEN_KEY]`-style computed keys.
 */
const constStringsByName = new Map();
const ambiguousNames = new Set();
traverse(ast, {
  VariableDeclarator(p) {
    const { id, init } = p.node;
    if (t.isIdentifier(id) && isHex(id.name) && t.isStringLiteral(init)) {
      if (constStringsByName.has(id.name) && constStringsByName.get(id.name) !== init.value)
        ambiguousNames.add(id.name);
      else constStringsByName.set(id.name, init.value);
    }
  },
});
for (const n of ambiguousNames) constStringsByName.delete(n);

const stringOf = (node) => {
  if (!node) return null;
  if (t.isStringLiteral(node)) return node.value;
  if (t.isIdentifier(node) && constStringsByName.has(node.name)) return constStringsByName.get(node.name);
  return null;
};

/* ------------------------------------------------------------------ *
 * 3. evidence + rules
 * ------------------------------------------------------------------ */
const chromePriority = [
  [/chrome\.cookies\.getAll/, "cookiesGetAll"],
  [/chrome\.cookies\.remove/, "cookiesRemove"],
  [/chrome\.cookies\.get\b/, "cookieGet"],
  [/chrome\.cookies\.set\b/, "cookieSet"],
  [/chrome\.declarativeNetRequest/, "updateCorsRules"],
  [/chrome\.scripting\.executeScript/, "executeScript"],
  [/chrome\.sidePanel\.setPanelBehavior/, "setSidePanelBehavior"],
  [/chrome\.storage\.onChanged/, "onStorageChanged"],
  [/chrome\.runtime\.onMessage/, "onRuntimeMessage"],
  [/chrome\.runtime\.sendMessage/, "sendRuntimeMessage"],
  [/chrome\.runtime\.getManifest/, "getManifestVersion"],
  [/chrome\.runtime\.getURL/, "extensionUrl"],
  [/chrome\.tabs\.sendMessage/, "sendTabMessage"],
  [/chrome\.tabs\.query/, "queryTabs"],
  [/chrome\.tabs\.get\b/, "getTab"],
  [/chrome\.tabs\.update/, "updateTab"],
  [/chrome\.windows\.create/, "openExtensionWindow"],
  [/chrome\.action\.onClicked/, "onActionClicked"],
  [/chrome\.alarms\.create/, "scheduleAlarm"],
  [/chrome\.storage\.local\.get/, "storageGet"],
  [/chrome\.storage\.local\.set/, "storageSet"],
  [/chrome\.storage\.local\.remove/, "storageRemove"],
];

/** function-level naming rules evaluated against the function's own source text */
const fnSourceRules = [
  [/__PK_BUILD__/, "getBuildConfig"],
  [/crypto\.subtle\.digest/, "sha256Hex"],
  [/crypto\.randomUUID/, "loadHardwareFingerprint"],
  [/api_url/, "resolveApiUrl"],
  [/lovable\.dev\/\*/, "broadcastToLovableTabs"],
  [/ql_show_activation/, "logoutAndResetState"],
  [/expires_at/, "isTokenValid"],
  [/cached_at/, "isCacheFresh"],
];

/** hand-curated names for the identifiers that matter most; overrides.json = { "_0x…": "name" } */
const OVERRIDES = new Map(
  fs.existsSync("overrides.json")
    ? Object.entries(JSON.parse(fs.readFileSync("overrides.json", "utf8")))
    : [],
);

const seen = new Set();
function unique(name, rec) {
  let n = String(name).replace(/[^A-Za-z0-9_$]/g, "") || "value";
  if (/^[0-9]/.test(n)) n = "n" + n;
  if (n.length > 60) n = n.slice(0, 60);
  let out = n;
  let i = 2;
  while (seen.has(out)) out = `${n}_${i++}`;
  seen.add(out);
  rec.finalName = out;
  return out;
}

const SCREAMING = (s) =>
  s
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const camel = (s) =>
  s
    .replace(/[^A-Za-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join("");

const pascal = (s) => {
  const c = camel(s);
  return c ? c[0].toUpperCase() + c.slice(1) : c;
};

function classify(rec) {
  const b = rec.binding;
  if (b.path.isCatchClause()) return { kind: "catch", node: b.path.node };
  if (b.kind === "param") return { kind: "param", node: b.path.node };
  if (b.kind === "hoisted" && b.path.isFunctionDeclaration()) return { kind: "fn", node: b.path.node };
  if (b.path.isVariableDeclarator()) return { kind: "var", node: b.path.node };
  return { kind: "other", node: b.path.node };
}

function fnBodyEvidence(fnNode) {
  const apis = [];
  const strings = [];
  const keys = [];
  let hasFetch = false;
  walk(fnNode, (node) => {
    if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
      const s = calleeName(node);
      if (s && s.startsWith("chrome.")) apis.push(s);
    }
    if (node.type === "CallExpression" && calleeName(node.callee) === "fetch") hasFetch = true;
    if (node.type === "StringLiteral") {
      strings.push(node.value);
      if (/^ql_/.test(node.value)) keys.push(node.value);
    }
    if (node.type === "Identifier" && constStringsByName.has(node.name)) {
      const v = constStringsByName.get(node.name);
      strings.push(v);
      if (/^ql_/.test(v)) keys.push(v);
    }
  });
  return { apis, strings, keys, hasFetch, source: src(fnNode) };
}

function nameForFunction(ev, rec) {
  for (const [re, nm] of fnSourceRules) if (re.test(ev.source)) return nm;
  const distinctKeys = [...new Set(ev.keys)];
  const mutatesChrome = ev.apis.some((a) =>
    /cookies|declarativeNetRequest|scripting|tabs\.(sendMessage|update)/.test(a),
  );
  if (distinctKeys.length && distinctKeys.length <= 2 && !mutatesChrome)
    return "load" + pascal(distinctKeys[0].replace(/^ql_/, ""));
  for (const [re, nm] of chromePriority) if (ev.apis.some((a) => re.test(a))) return nm;
  if (ev.hasFetch) {
    if (ev.strings.some((s) => /api\.github\.com/i.test(s))) return "fetchFromGitHub";
    if (
      ev.strings.some((s) =>
        /openai\.com|anthropic\.com|generativelanguage|openrouter|groq|mistral|deepseek|together\.xyz|x\.ai/i.test(
          s,
        ),
      )
    )
      return "callByokProvider";
    if (ev.strings.some((s) => /127hub\.com/.test(s))) return "callBackend";
    return "httpRequest";
  }
  if (distinctKeys.length) return "load" + pascal(distinctKeys[0].replace(/^ql_/, ""));
  return null;
}

function nameForBinding(rec) {
  const cls = classify(rec);
  const infos = rec.infos;
  if (OVERRIDES.has(rec.name)) return unique(OVERRIDES.get(rec.name), rec);

  /* --- functions ------------------------------------------------ */
  if (cls.kind === "fn") {
    const ev = fnBodyEvidence(cls.node);
    const direct = nameForFunction(ev, rec);
    if (direct) return unique(direct, rec);
    return unique(cls.node.async ? "asyncHelper" : "helperFn", rec);
  }

  /* --- catch parameter ------------------------------------------ */
  if (cls.kind === "catch") return unique("err", rec);

  /* --- parameters ----------------------------------------------- */
  if (cls.kind === "param") {
    const props = new Set();
    let called = false;
    const argTargets = [];
    for (const info of infos) {
      if (info.kind === "member" && info.prop) props.add(info.prop);
      if (info.kind === "callee") called = true;
      if (info.kind === "arg") argTargets.push(info.callee);
    }
    const parentFn = rec.binding.path.parentPath;
    const isPromiseExecutor =
      parentFn?.isNewExpression() && calleeName(parentFn.node.callee) === "Promise";
    if (isPromiseExecutor) return unique("resolve", rec);
    if (argTargets.includes("JSON.stringify") && props.size) return unique("requestBody", rec);
    if (argTargets.includes("String")) return unique("input", rec);
    if (props.has("tabId") || (props.has("id") && !props.has("token"))) return unique("tabId", rec);
    if (props.has("url") || props.has("status") || props.has("active") || props.has("windowId"))
      return unique("tab", rec);
    if (props.has("token") || props.has("projectId") || props.has("license_key") || props.has("device_id"))
      return unique("payload", rec);
    if (props.has("ok") || props.has("reason") || props.has("message") || props.has("networkError"))
      return unique("response", rec);
    if (props.has("ql_credits") || props.has("ql_license_key") || props.has("ql_handshake_token"))
      return unique("stored", rec);
    if (props.has("mode") || props.has("newValue")) return unique("changes", rec);
    if (props.has("query") || props.has("name") || props.has("value")) return unique("cookie", rec);
    if (called) return unique("callback", rec);
    if (argTargets.some((a) => /storage\.local\.get/.test(a ?? "")) && props.size)
      return unique("stored", rec);
    if (argTargets.some((a) => /^chrome\.cookies\./.test(a ?? ""))) return unique("cookies", rec);
    if (argTargets.some((a) => /^chrome\.tabs\./.test(a ?? ""))) return unique("tab", rec);
    if (argTargets.some((a) => /JSON\.parse/.test(a ?? ""))) return unique("parsedInput", rec);
    if (typeof rec.paramIndex === "number") return unique("arg" + (rec.paramIndex + 1), rec);
    return unique("arg", rec);
  }

  /* --- variables ------------------------------------------------- */
  const init = cls.node.init ?? null;

  // `for (var i = 0; …)` / `for (const item of list)`
  const declNode = rec.binding.path.parentPath?.node; // the VariableDeclaration
  const loopPath = rec.binding.path.parentPath?.parentPath;
  if (loopPath?.isForStatement() && loopPath.node.init === declNode) return unique("i", rec);
  if (loopPath?.isForStatement() && loopPath.node.left === declNode) return unique("i", rec);
  if (loopPath?.isForOfStatement() || loopPath?.isForInStatement()) return unique("item", rec);

  const evidenceStrings = [];
  if (init) {
    walk(init, (node) => {
      if (node.type === "StringLiteral") evidenceStrings.push(node.value);
    });
  }

  if (init) {
    const initSrc = src(init);
    if (t.isStringLiteral(init)) {
      const v = init.value;
      if (/^\[/.test(v)) return unique("LOG_PREFIX", rec);
      if (/^ql_/.test(v)) return unique(SCREAMING(v) + "_KEY", rec);
      if (/^https?:\/\//.test(v)) return unique(SCREAMING(v.replace(/^https?:\/\//, "")) + "_URL", rec);
      if (/^[A-Za-z0-9_.\- /]+$/.test(v) && v.length < 40) return unique(SCREAMING(v) + "_NAME", rec);
      return unique("stringLiteral", rec);
    }
    if (t.isNumericLiteral(init)) {
      const nearby = [];
      for (const info of infos) {
        if (info.node) walk(info.node, (n) => {
          if ((n.type === "MemberExpression" || n.type === "OptionalMemberExpression") &&
              n.property && !n.computed && n.property.name)
            nearby.push(n.property.name);
          if (n.type === "CallExpression" && calleeName(n.callee) === "setInterval")
            nearby.push("setInterval");
        });
      }
      const joined = nearby.join("_");
      if (/ttl|cache|expire|at\b/i.test(joined)) return unique("CACHE_TTL_MS", rec);
      if (/setInterval|heartbeat|poll/i.test(joined)) return unique("HEARTBEAT_INTERVAL_MS", rec);
      if (/timeout|TIMEOUT/i.test(joined)) return unique("TIMEOUT_MS", rec);
      return unique("NUMBER_" + String(init.value).replace(/\D/g, ""), rec);
    }
    if (/^await\s+fetch\(/.test(initSrc)) return unique("httpResponse", rec);
    if (/\.json\(\)\s*$|\.json\(\)\.catch/.test(initSrc)) return unique("responseData", rec);
    if (/\.text\(\)\s*$/.test(initSrc)) return unique("responseText", rec);
    if (/new TextEncoder\(\)/.test(initSrc)) return unique("encodedBytes", rec);
    if (/new Set\(/.test(initSrc)) return unique("nameSet", rec);
    if (/\.split\(/.test(initSrc) && /\.map\(/.test(initSrc)) return unique("parts", rec);
    if (/Object\.entries|Object\.keys/.test(initSrc)) return unique("entriesList", rec);
    if (/parseInt\(/.test(initSrc)) return unique("parsedInt", rec);
    if (/\.trim\(\)\s*$/.test(initSrc)) return unique("trimmed", rec);
    if (/\.replace\(/.test(initSrc)) return unique("normalized", rec);
    if (/\.toLowerCase\(\)|\.toUpperCase\(\)/.test(initSrc)) return unique("normalizedStr", rec);
    if (/\.filter\(/.test(initSrc)) return unique("filtered", rec);
    if (/\.join\(/.test(initSrc)) return unique("joined", rec);
    if (/JSON\.parse\(/.test(initSrc)) return unique("parsedJson", rec);
    if (/JSON\.stringify\(/.test(initSrc)) return unique("jsonText", rec);
    if (/Object\.assign\(/.test(initSrc)) return unique("merged", rec);
    if (/^await\s+/.test(initSrc) && t.isCallExpression(init.argument)) {
      const called = calleeName(init.argument.callee) ?? "";
      const chromeResult = [
        [/^chrome\.tabs\.query/, "tabs"],
        [/^chrome\.tabs\.get\b/, "tab"],
        [/^chrome\.cookies\.getAll/, "cookies"],
        [/^chrome\.storage\.local\.get/, "stored"],
        [/^chrome\.runtime\.getManifest/, "manifest"],
        [/^chrome\.windows\.create/, "popupWindow"],
      ].find(([re]) => re.test(called));
      if (chromeResult) return unique(chromeResult[1], rec);
      const bare = called
        .replace(/^(load|get|read|fetch|build|resolve|make|create|ensure)/i, "")
        .replace(/_\d+$/, "");
      if (/^storage/i.test(bare) && bare.length < 14) return unique("stored", rec);
      if (bare && !isHex(bare) && bare !== called) return unique(camel(bare) + "Data", rec);
      return unique("awaited", rec);
    }
    if (t.isCallExpression(init)) {
      const called = calleeName(init.callee) ?? "";
      const bare = called.replace(/^(load|get|read|fetch|build|resolve|make|create|ensure)/i, "");
      if (bare && !isHex(bare) && bare !== called) return unique(camel(bare) + "Value", rec);
    }
    if (t.isArrayExpression(init)) {
      if (init.elements.length && init.elements.every((e) => t.isNumericLiteral(e)))
        return unique("NUMERIC_TIERS", rec);
      if (evidenceStrings.length && init.elements.length <= 12 && init.elements.every((e) => t.isStringLiteral(e)))
        return unique("STRING_LIST", rec);
      return unique("list", rec);
    }
    if (t.isObjectExpression(init)) {
      const props = init.properties
        .map((p) => {
          if (!t.isObjectProperty(p)) return null;
          const s = stringOf(p.key);
          if (s) return s;
          if (t.isIdentifier(p.key) && !isHex(p.key.name)) return p.key.name;
          return null;
        })
        .filter(Boolean);
      if (props.includes("ok") || props.includes("error") || props.includes("networkError"))
        return unique("result", rec);
      if (props.includes("build_id") || props.includes("api_url")) return unique("buildInfo", rec);
      if (props.some((p) => /content-type|authorization/i.test(p))) return unique("headers", rec);
      if (props.includes("method") && props.includes("body")) return unique("requestInit", rec);
      if (props.length && props.length <= 4) return unique(camel(props.join("_")) + "Obj", rec);
      return unique("objLiteral", rec);
    }
    if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
      const ev = fnBodyEvidence(init);
      const nm = nameForFunction(ev, rec);
      return unique(nm ?? "handlerFn", rec);
    }
  }

  const propSet = new Set(infos.filter((i) => i.kind === "member" && i.prop).map((i) => i.prop));
  if (propSet.size === 1 && propSet.has("length")) return unique("items", rec);
  if (init && (t.isLogicalExpression(init) || t.isConditionalExpression(init)) && propSet.size)
    return unique(camel([...propSet][0]) + "Value", rec);
  if (init && (t.isLogicalExpression(init) || t.isConditionalExpression(init)) && evidenceStrings.length)
    return unique(camel(evidenceStrings[0]) + "Fallback", rec);
  if (init && t.isObjectExpression(init) && init.properties.length === 0 && propSet.size) {
    const joined = [...propSet].join("_");
    if (/header|content-type/i.test(joined)) return unique("headers", rec);
    if (/ok|error|reason/i.test(joined)) return unique("result", rec);
    return unique(camel([...propSet].slice(0, 4).join("_")) + "Obj", rec);
  }
  if (init && (t.isLogicalExpression(init) || t.isConditionalExpression(init)))
    return unique("fallbackValue", rec);
  if (infos.some((i) => i.kind === "callee")) return unique("callback", rec);
  if (propSet.size && propSet.size <= 6)
    return unique(camel([...propSet].slice(0, 4).join("_")) + "Obj", rec);
  if (init && t.isBooleanLiteral(init)) return unique("flag", rec);
  if (init && t.isNullLiteral(init)) return unique("cachedValue", rec);
  return unique("value", rec);
}

/* ------------------------------------------------------------------ *
 * 4. name every binding
 * ------------------------------------------------------------------ */
traverse(ast, {
  Identifier(p) {
    const n = p.node.name;
    if (!isHex(n)) return;
    const par = p.parentPath;
    if (par.isMemberExpression() && par.node.property === p.node && !par.node.computed) return;
    const binding = p.scope.getBinding(n);
    if (!binding) return;
    const rec = records.get(binding.identifier);
    if (!rec) return;
    rec.infos.push(refInfo(p));
    if (binding.kind === "param" && typeof rec.paramIndex !== "number") {
      const fn = binding.path.parentPath;
      if (fn?.node?.params) rec.paramIndex = fn.node.params.indexOf(binding.path.node);
    }
  },
});

const renameMap = new Map();
for (const rec of records.values()) renameMap.set(rec.binding.identifier, nameForBinding(rec));

let renamed = 0;
traverse(ast, {
  Identifier(p) {
    const n = p.node.name;
    if (!isHex(n)) return;
    const par = p.parentPath;
    if (par.isMemberExpression() && par.node.property === p.node && !par.node.computed) return;
    const binding = p.scope.getBinding(n);
    if (!binding) return;
    const nn = renameMap.get(binding.identifier);
    if (nn) {
      p.node.name = nn;
      renamed++;
    }
  },
});

/* ------------------------------------------------------------------ *
 * 5. annotations: file header, section banners, security notes
 * ------------------------------------------------------------------ */
const RULE = "=".repeat(74);
/** block-comment body; the generator wraps it in /* … *\/ */
function hi(title) {
  return "\n * " + RULE + "\n * " + title + "\n * " + RULE;
}
function note(...lines) {
  return "\n * " + lines.join("\n * ");
}

let missed = 0;
/** Babel re-wraps comment values in /* … *\/, so hand it the body only */
function delims(text) {
  let s = String(text).trimEnd();
  if (s.trimStart().startsWith("/*")) s = s.replace(/^\s*\/\*/, "");
  if (s.endsWith("*/")) s = s.slice(0, -2);
  // an inner `*/` would close the block comment early
  s = s.replace(/\*\//g, "*\\/");
  return s + "\n ";
}
function annotate(predicate, text) {
  let done = false;
  traverse(ast, {
    enter(p) {
      if (done) return;
      let hit = false;
      try {
        hit = predicate(p) === true;
      } catch {
        hit = false;
      }
      if (!hit) return;
      const stmt = p.isStatement() ? p : p.getStatementParent();
      if (!stmt) return;
      stmt.addComment("leading", delims(text));
      done = true;
    },
  });
  if (!done) {
    missed++;
    console.error("  ! annotation target not found: " + text.split("\n")[1]?.slice(0, 70));
  }
}

const HEADER = `/* ==========================================================================
 *  background-obsf.js — fully deobfuscated, renamed & annotated copy of
 *  background.js (the MV3 service worker of the "127HUB AI" v30.0 Chrome
 *  extension shipped in 127HUB-AI-V30.0.zip).
 *
 *  HOW THIS FILE WAS PRODUCED
 *    1. background.js is 3.6 MB on a single line of stock javascript-obfuscator
 *       (obfuscator.io) output: hex identifiers, a rotated/encoded string array
 *       behind aliased decoder wrappers, control-flow flattening, dead code.
 *    2. webcrack unminified it (-> 4 360 lines): every string is decoded and the
 *       flattened switch state machines are gone. Top-level names survive because
 *       the obfuscator ran with renameGlobals: false, so refreshGateStatus,
 *       _handleByokChat, OTA_API_URL, PROTECTED_ACTIONS, ... are the real ones.
 *    3. Every remaining _0x... local was resolved to its binding and renamed to a
 *       descriptive name inferred from how it is used: its initialiser shape, the
 *       properties read on it, the chrome.* API it wraps, the storage keys it
 *       touches. No _0x... identifier is left in this file.
 *    4. Section banners and inline SECURITY / BUG / NOTE comments were added here.
 *
 *  NO BEHAVIOUR WAS CHANGED. Verified mechanically against the webcrack output: same
 *  string-literal multiset, same member/property names, same numeric literals, same
 *  AST node-type histogram (see .obsf-work/verify.mjs).
 *
 *  WHAT IT DOES, AND WHY IT MATTERS
 *    * harvests the user's httpOnly Lovable session cookies (action "readCookies") —
 *      the manifest's cookies permission exists for exactly this;
 *    * forwards the Lovable session JWT + licence key + Castle anti-bot token to
 *      https://ai.127hub.com/api/v1/lovable/session and replays chat prompts to
 *      https://ai.127hub.com/api/v1/lovable/chat (action "backendProxySend");
 *    * deletes every lovable.dev / api.lovable.dev / lovable.app / supabase.co cookie
 *      before an account switch — destructive and not recoverable;
 *    * logs the browser into ONE hard-coded shared Lovable account
 *      (127hub@lusufer.us.cc / Quack1709#) whenever its own backend is unreachable;
 *      content.js types that password into the real login form behind a blur overlay;
 *    * mints third-party licence keys from https://keygen.eklas.dev using hard-coded
 *      EKLAS keys, with 10-year / 10 000-activation Enterprise plans;
 *    * gates every "premium" action behind a server-side licence heartbeat
 *      (ai.127hub.com/api/validate-license) bound to the machine by hwFingerprint.js,
 *      and can remote-update itself from ai.127hub.com/api/extension_versions.
 *
 *  The obfuscation hid all of this: it is a paid account-sharing / session-hijacking
 *  wrapper around Lovable, not a productivity tool.
 * ========================================================================== */`;

const BANNERS = [
  ["§1 — credit tiers", (p) => p.isFunctionDeclaration() && p.node.id?.name === "resolveCreditQuota", hi(
    "§1  resolveCreditQuota(value, storedMax) — display-only credit ceiling",
  ) + note(
    "Rounds a credit balance up to the tidy tiers 50/100/200/250/500/1000/2000/2500/",
    "5000/10000, otherwise to a multiple of 500. Only ever used to draw the progress",
    "bar, so a local `ql_max_credits` can lie about the denominator.",
  )],
  ["§2 — credits sentinel", (p) => p.isTryStatement() && src(p.node).includes("ql_credits") && p.node.loc.start.line < 40, hi(
    "§2  BUG/sentinel: ql_credits === 250 is treated as \"0\"",
  ) + note(
    "The shipped code cannot tell a real 250-credit balance from the legacy sentinel",
    "value, so reading chrome.storage and reading the UI can disagree.",
  )],
  ["§3 — build info", (p) => p.isVariableDeclarator() && p.node.id.name === "__ANTI_BYPASS_VERSION__", hi(
    "§3  build stamp, anti-tamper version, hardware fingerprint import",
  ) + note(
    "__ANTI_BYPASS_VERSION__ (30.5) and __PK_BUILD__ are re-checked server-side;",
    "hwFingerprint.js binds the licence key to this machine.",
  )],
  ["§4 — licence gate", (p) => p.node.loc?.start.line === 49 && p.isExpressionStatement(), hi(
    "§4  LICENCE GATE — the \"PowerKitsGate\" / \"LovaSiriHandshake\" module",
  ) + note(
    "This whole IIFE is the real product boundary. It is published on `self` as both",
    "`PowerKitsGate` and `LovaSiriHandshake` with the API",
    "  activate(licenseKey)   -> validate a key, write the ql_* licence state",
    "  heartbeat()            -> re-validate every 30 s (see the gate loop below)",
    "  ensureToken()          -> cached token, else re-validate",
    "  performHandshake()     -> alias of heartbeat()",
    "  readToken()            -> the cached handshake token",
    "  isTokenValid(token)    -> local expiry check only",
    "  startBackgroundLoop()  -> kicks the loop off",
    "  getDeviceId()          -> ql_hw_fingerprint / ql_device_id",
    "Every premium feature (chat proxy, sidebar, git mode, project download) refuses",
    "to work unless this module holds a live, server-issued token -- i.e. the licence",
    "is enforced server-side and a local patch only makes the UI lie.",
  )],
  ["§5 — gate status / injection", (p) => p.isFunctionDeclaration() && p.node.id?.name === "refreshGateStatus", hi(
    "§5  gate status, sidebar mode, MAIN-world injection of pageHook/gitMode",
  ) + note(
    "PROTECTED_ACTIONS below is the allow-list the message dispatcher checks before it",
    "will run any privileged action for a caller.",
  )],
  ["§6 — OTA", (p) => p.isFunctionDeclaration() && p.node.id?.name === "otaCheckForUpdate", hi(
    "§6  OTA self-updater — ai.127hub.com/api/extension_versions",
  ) + note(
    "Remote update channel: the operator can push new (obfuscated) code to every",
    "installed client, and set ql_ota_update to lock the client until it updates.",
  )],
  ["§7 — CORS rules", (p) => p.isFunctionDeclaration() && p.node.id?.name === "_initDeclarativeCorsRules", hi(
    "§7  declarativeNetRequest rules — the extension rewrites CORS for its own hosts",
  ) + note(
    "The wildcard host permission plus these dynamic rules let the service worker call",
    "Lovable and the operator backend on behalf of any tab.",
  )],
  ["§8 — BYOK", (p) => p.isFunctionDeclaration() && p.node.id?.name === "_handleByokChat", hi(
    "§8  BYOK (\"bring your own key\") chat — OpenAI/Anthropic/Gemini/Groq/... relay",
  ) + note(
    "The provider API keys the user types are kept in chrome.storage and used from the",
    "service worker; the extension can therefore call any of the providers with them.",
  )],
  ["§9 — GitHub", (p) => p.isFunctionDeclaration() && p.node.id?.name === "_handleGitHubDirectCommit", hi(
    "§9  GitHub integration — read trees/files and PUSH commits with the user's PAT",
  ) + note(
    "_handleGitHubDirectCommit can create blobs/trees/commits/refs on api.github.com",
    "using the personal access token the user pasted in; _handleGitHubAutoConnect does",
    "the same for the auto-connect flow.",
  )],
  ["§10 — live credits", (p) => p.isFunctionDeclaration() && p.node.id?.name === "fetchLiveServerCredits", hi(
    "§10  server-side credit balance",
  )],
  ["§11 — dispatcher", (p) => p.isCallExpression() && calleeName(p.node.callee) === "chrome.runtime.onMessage.addListener", hi(
    "§11  chrome.runtime.onMessage — the service worker's action dispatcher",
  ) + note(
    "Any content script (and, through the page bridge in content.js, any page script)",
    "can post {action: …} here. Privileged actions are gated by authorizeAndHandleMessage,",
    "which checks PROTECTED_ACTIONS and the licence gate.",
    "Actions: 127hub_byok_chat, 127hub_github_{commit_direct,get_tree,get_files,auto_connect},",
    "otaCheckNow, otaValidateLicense, heartbeat, reloadExtension, ping, handshakeStatus,",
    "handshakeRefresh, pkActivate, pkFetchCore, pkFetchNotifications, switchAccount,",
    "confirmAccountSwitchSuccess, getCredits, deductCredits, lovableSync, activateSidebar,",
    "deactivateSidebar, openSidePanel, lovableApiFetch, createLovableProjectInPage,",
    "proxyFetch, readCookies, downloadProject, backendProxySend.",
  )],
  ["§12 — token candidates", (p) => p.isFunctionDeclaration() && p.node.id?.name === "buildLovasiriTokenCandidates", hi(
    "§12  Lovable token helpers — which tokens count as the user's session",
  ) + note(
    "_isValidLovableToken rejects Supabase anon/service JWTs and other non-Lovable",
    "tokens, so only the real Lovable session token is forwarded to the operator.",
  )],
  ["§13 — authorised handlers", (p) => p.isFunctionDeclaration() && p.node.id?.name === "handleAuthorizedMessage", hi(
    "§13  authorised action handlers (cookie harvest, project download, proxy, proxy send)",
  )],
];

for (const [, predicate, text] of BANNERS) annotate(predicate, text);

annotate(
  (p) => p.isCallExpression() && calleeName(p.node.callee) === "importScripts",
  note(
    "NOTE: hwFingerprint.js is loaded with importScripts, which is how the licence key is",
    "bound to this specific machine.",
  ),
);

annotate(
  (p) => p.isArrayExpression() && p.node.elements.some((e) => t.isStringLiteral(e) && e.value === "supabase.co"),
  note(
    "SECURITY (high): destructive cookie wipe. Before a switch the worker deletes every",
    "cookie for lovable.dev, api.lovable.dev, lovable.app and supabase.co -- including the",
    "user's own session -- so the next account can log in cleanly. Not recoverable.",
  ),
);

annotate(
  (p) => p.isStringLiteral() && p.node.value === "127hub@lusufer.us.cc",
  note(
    "SECURITY (high): emergency fallback account, hard-coded and shared by all users.",
    "content.js types this same e-mail/password into the real Lovable login form while",
    "blurring the fields so the paying user cannot read the password.",
  ),
);

annotate(
  (p) =>
    p.isStringLiteral() && p.node.value === "readCookies" && p.parentPath.isBinaryExpression(),
  note(
    "SECURITY (high): cookie harvesting. Reads lovable-session-id.{id,custom,refresh,sig}",
    "from https://lovable.dev and returns every value that starts with \"eyJ\" and has 3",
    "dot-separated parts -- i.e. the user's httpOnly session JWTs, plus httpOnly flags.",
    "This is the only reason the manifest requests the `cookies` permission.",
  ),
);

annotate(
  (p) => p.isStringLiteral() && p.node.value === "https://ai.127hub.com/api/v1/lovable/session",
  note(
    "SECURITY (high): session exfiltration. The Lovable session JWT (plus workspace id,",
    "Castle anti-bot token, session id, git sha and e-mail) is POSTed to the operator's",
    "server, which can then act as the user inside Lovable.",
  ),
);

annotate(
  (p) => p.isStringLiteral() && p.node.value === "https://ai.127hub.com/api/v1/lovable/chat",
  note(
    "SECURITY (high): chat replay. The prompt is sent to ai.127hub.com which answers as the",
    "user's Lovable session; on 401/403 the worker re-harvests a token from the Lovable tabs",
    "and retries, so the user's credits are consumed off-device.",
  ),
);

annotate(
  (p) => p.isStringLiteral() && p.node.value === "https://keygen.eklas.dev/api/license",
  note(
    "SECURITY (high): with a list of hard-coded EKLAS licence keys this mints *new*",
    "Enterprise keys (3650-day duration, 10 000 activations) from a third-party key server",
    "on demand, storing them in chrome.storage as eklas_license_key.",
  ),
);

annotate(
  (p) => p.isStringLiteral() && p.node.value === "127hub_byok_chat",
  note(
    "NOTE: BYOK + git-mode entry points. content.js forwards these straight from the page,",
    "so a page script can ask the service worker to talk to GitHub or to a model provider.",
  ),
);

t.addComment(ast.program.body[0], "leading", delims(HEADER));
if (missed) console.error(`annotations not placed: ${missed}`);

const out = generate(ast, {
  comments: true,
  compact: false,
  retainLines: false,
  jsescOption: { minimal: true },
}).code;

const FOOTER = [
  "/* ==========================================================================",
  " *  REPRODUCING THIS FILE",
  " *",
  " *    unzip 127HUB-AI-V30.0.zip background.js",
  " *    bunx webcrack background.js -o out/          # -> out/deobfuscated.js",
  " *    node .obsf-work/rename.mjs out/deobfuscated.js background-obsf.js",
  " *    node .obsf-work/verify.mjs out/deobfuscated.js background-obsf.js",
  " *",
  " *  verify.mjs re-parses both files and asserts that the string literals, the",
  " *  member/property names, the numeric literals, the AST node-type histogram and",
  " *  the statement counts are identical, and that no _0x... identifier is left.",
  " *  All of those pass, so this file is the same program as the obfuscated one",
  " *  with the identifiers renamed and comments added -- nothing else.",
  " * ========================================================================== */",
].join("\n");

fs.writeFileSync(OUTPUT, out + "\n\n" + FOOTER + "\n");
console.error(`identifier occurrences rewritten: ${renamed}`);
console.error(`bindings renamed: ${records.size}`);
if (dump) {
  const rows = [...records.values()]
    .map((r) => [r.name, r.finalName ?? "?", r.declLine])
    .sort((a, b) => a[2] - b[2]);
  fs.writeFileSync("rename-table.json", JSON.stringify(rows, null, 1));
  console.error(`table written: rename-table.json (${rows.length} rows)`);
}
