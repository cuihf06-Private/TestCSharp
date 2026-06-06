// 计算 TestCSharp 下"被 git 跟踪 + 未跟踪但未被忽略"的文件总大小
import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] || "D:\\Projects\\TestCSharp");
process.chdir(root);

function gitLines(cmd) {
  const out = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return out.split(/\r?\n/).filter(Boolean);
}

const tracked = gitLines("git ls-files");
const untrackedNotIgnored = gitLines("git ls-files --others --exclude-standard");

// 用 Set 去重
const all = new Set([...tracked, ...untrackedNotIgnored]);

let total = 0;
let count = 0;
const big = [];
for (const rel of all) {
  const abs = join(root, rel);
  try {
    const s = statSync(abs);
    if (s.isFile()) {
      total += s.size;
      count++;
      if (s.size > 1 * 1024 * 1024) big.push([s.size, rel]);
    }
  } catch {
    // 文件不存在(可能 deleted in working tree),跳过
  }
}

big.sort((a, b) => b[0] - a[0]);

console.log("Root:", root);
console.log("Tracked files:", tracked.length);
console.log("Untracked-not-ignored files:", untrackedNotIgnored.length);
console.log("Unique files counted:", count);
console.log("Total size of kept files:", (total / 1024 / 1024).toFixed(2), "MB");
console.log("");
console.log("Files larger than 1 MB (top 20):");
for (const [sz, p] of big.slice(0, 20)) {
  console.log("  ", (sz / 1024 / 1024).toFixed(2).padStart(8), "MB  ", p);
}
