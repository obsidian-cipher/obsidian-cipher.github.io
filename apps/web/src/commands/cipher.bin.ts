import type { CommandOptions } from "@/types/command";
import { WASI, WASIContext } from "../wasi/main";

const help = "cipher - Cipher bin";
const matcher = /^cipher(\s+.*)?$/;

async function command({ echo, args }: CommandOptions) {
  const result = await WASI.start(
    fetch("/programs/cipher.wasm"),
    new WASIContext({
      args: args ?? [],
      stdout: (out) => {
        out
          .split(/\r\n|\n|\r/)
          .forEach((line) => echo.stdout(`${line.trim()}\r\n`));
      },
      stderr: (err) => {
        err
          .split(/\r\n|\n|\r/)
          .forEach((line) => echo.stdout(`${line.trim()}\r\n`));
      },
      stdin: () => "",
      fs: {},
    })
  );
  console.log("Exit code:", result.exitCode);
}

export const cipher = {
  help,
  matcher,
  command,
  group: "command",
};
