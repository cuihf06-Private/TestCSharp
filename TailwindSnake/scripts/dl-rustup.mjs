// 下载 rustup-init.exe 到用户 Downloads 目录
import { createWriteStream, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { get } from "node:https";

const out = join(process.env.USERPROFILE || process.env.HOME, "Downloads", "rustup-init.exe");
mkdirSync(join(out, ".."), { recursive: true });

function download(url, attempt = 0) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log("redirect ->", res.headers.location);
        return resolve(download(res.headers.location, attempt + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error("HTTP " + res.statusCode));
      }
      const ws = createWriteStream(out);
      res.pipe(ws);
      ws.on("finish", () => ws.close(() => {
        const sz = statSync(out).size;
        console.log("saved", out, sz, "bytes");
        resolve();
      }));
      ws.on("error", reject);
    }).on("error", reject);
  });
}

await download("https://win.rustup.rs/x86_64");
