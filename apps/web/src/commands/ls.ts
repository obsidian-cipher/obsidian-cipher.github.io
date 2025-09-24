import type { CommandOptions } from "@/types/command";
import { ICONS } from "@/types/file-system";

const help = "ls - List files in directory";
const matcher = /^ls(\s+.*)?$/;

function command({ echo, args, fs }: CommandOptions) {
  const dir = args?.[0] || "./";
  const files = fs
    ?.filter((file) => file.name.startsWith(dir))
    .map((file) => ({ ...file, name: file.name.slice(dir.length) }))
    .map((file) => `${ICONS[file.type] || "📄"} ${file.name}`);
  if (files) echo.stdout(files.join("\t") + "\r\n");
}

export const ls = {
  help,
  matcher,
  command,
  group: "command",
};
