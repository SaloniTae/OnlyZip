// Downloads the Ubuntu .deb packages Chrome needs and extracts them into
// .tools/rootfs so Chrome can run with LD_LIBRARY_PATH. Nothing is installed
// system-wide and nothing outside the project dir is touched.
import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const ROOT = ".tools/rootfs";
const DEBS = ".tools/debs";
fs.mkdirSync(ROOT, { recursive: true });
fs.mkdirSync(DEBS, { recursive: true });

const MIRROR = "https://archive.ubuntu.com/ubuntu";
const SUITES = ["jammy", "jammy-updates", "jammy-security"];

const SEED = {
  "libX11.so.6": "libx11-6",
  "libXcomposite.so.1": "libxcomposite1",
  "libXdamage.so.1": "libxdamage1",
  "libXext.so.6": "libxext6",
  "libXfixes.so.3": "libxfixes3",
  "libXrandr.so.2": "libxrandr2",
  "libasound.so.2": "libasound2",
  "libatk-1.0.so.0": "libatk1.0-0",
  "libatk-bridge-2.0.so.0": "libatk-bridge2.0-0",
  "libatspi.so.0": "libatspi2.0-0",
  "libcairo.so.2": "libcairo2",
  "libcups.so.2": "libcups2",
  "libdbus-1.so.3": "libdbus-1-3",
  "libgbm.so.1": "libgbm1",
  "libgio-2.0.so.0": "libglib2.0-0",
  "libglib-2.0.so.0": "libglib2.0-0",
  "libgobject-2.0.so.0": "libglib2.0-0",
  "libnspr4.so": "libnspr4",
  "libnss3.so": "libnss3",
  "libnssutil3.so": "libnss3",
  "libpango-1.0.so.0": "libpango-1.0-0",
  "libsmime3.so": "libnss3",
  "libxcb.so.1": "libxcb1",
  "libxkbcommon.so.0": "libxkbcommon0",
};

function installed() {
  try {
    const out = execFileSync("dpkg-query", ["-W", "-f=${Package}\\n"], { encoding: "utf8" });
    return new Set(out.split("\n").map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const index = new Map();
for (const suite of SUITES) {
  const url = `${MIRROR}/dists/${suite}/main/binary-amd64/Packages.gz`;
  let raw;
  try {
    raw = await get(url);
  } catch (e) {
    console.log("skip", url, String(e).slice(0, 80));
    continue;
  }
  const text = zlib.gunzipSync(raw).toString("utf8");
  let count = 0;
  for (const block of text.split("\n\n")) {
    const name = /^Package: (.+)$/m.exec(block)?.[1];
    if (!name || index.has(name)) continue;
    const filename = /^Filename: (.+)$/m.exec(block)?.[1];
    if (!filename) continue;
    const depends = [
      ...(/^Depends: (.+)$/m.exec(block)?.[1] || "").split(","),
      ...(/^Pre-Depends: (.+)$/m.exec(block)?.[1] || "").split(","),
    ]
      .map((d) => d.split("|")[0].replace(/\(.*?\)/g, "").trim().split(" ")[0])
      .filter(Boolean);
    index.set(name, { filename, depends });
    count++;
  }
  console.log(`index ${suite}: ${count} packages`);
}

const SKIP = new Set(["libc6", "libgcc-s1", "libstdc++6", "zlib1g", "multiarch-support", "debconf"]);
const have = installed();
const queue = [...new Set(Object.values(SEED))];
const needed = new Map();
while (queue.length) {
  const name = queue.shift();
  if (needed.has(name) || SKIP.has(name) || have.has(name)) continue;
  const entry = index.get(name);
  if (!entry) {
    console.log("!! no index entry for", name);
    continue;
  }
  needed.set(name, entry);
  for (const dep of entry.depends) queue.push(dep);
}
console.log("resolved", needed.size, "packages:", [...needed.keys()].join(" "));

let downloaded = 0;
const list = [...needed.entries()];
const CONC = 6;
async function worker(slice) {
  for (const [name, entry] of slice) {
    const file = `${DEBS}/${name}.deb`;
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    const buf = await get(`${MIRROR}/${entry.filename}`);
    fs.writeFileSync(file, buf);
    downloaded++;
  }
}
const slices = Array.from({ length: CONC }, (_, i) => list.filter((_, j) => j % CONC === i));
await Promise.all(slices.map(worker));
console.log("downloaded", downloaded, "debs");

for (const [name] of list) {
  const file = `${DEBS}/${name}.deb`;
  if (!fs.existsSync(file)) continue;
  try {
    execFileSync("dpkg-deb", ["-x", file, ROOT], { stdio: "pipe" });
  } catch (e) {
    console.log("extract fail", name, String(e).slice(0, 100));
  }
}
const libdir = `${ROOT}/usr/lib/x86_64-linux-gnu`;
console.log("libs in rootfs:", fs.existsSync(libdir) ? fs.readdirSync(libdir).length : 0);
console.log("LIBDIR=" + libdir);
