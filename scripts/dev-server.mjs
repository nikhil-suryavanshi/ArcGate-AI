import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const nextArgs = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--host") {
    nextArgs.push("--hostname", args[index + 1]);
    index += 1;
    continue;
  }

  if (arg.startsWith("--host=")) {
    nextArgs.push("--hostname", arg.slice("--host=".length));
    continue;
  }

  // Vite's preview launcher appends this flag. Next.js does not need it.
  if (arg === "--strictPort") continue;

  nextArgs.push(arg);
}

const next = spawn("next", ["dev", ...nextArgs], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

next.on("exit", (code) => process.exit(code ?? 1));
