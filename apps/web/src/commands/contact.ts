import type { CommandOptions } from "@/types/command";

const help = "contact - View our contact information";
const matcher = /^contact$/;

function command({ echo }: CommandOptions) {
  echo.stdout("Contact us at mailto://inquiry@obsidian-cipher.systems\r\n");
}

export const contact = {
  help,
  matcher,
  command,
  group: "info",
};
