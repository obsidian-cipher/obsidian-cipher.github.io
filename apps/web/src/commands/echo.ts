import type { CommandOptions } from "@/types/command";

const help = "echo - Echo text to the terminal";
const matcher = /^echo(\s+.*)?$/;

function command({ echo, args }: CommandOptions) {
  const text = args?.join(" ") || "";
  echo.stdout(`${text}\r\n`);
}

export const echo = {
  help,
  matcher,
  command,
  group: "command",
};
