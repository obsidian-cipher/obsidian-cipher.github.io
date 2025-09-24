import type { CommandOptions } from "@/types/command";

const help = "about - About Obsidian Cipher Systems";
const matcher = /^about$/;

function command({ echo }: CommandOptions) {
  echo.stdout("Obsidian Cipher Systems LLC\r\n");
  echo.stdout("A crypto native software company established in 2025.\r\n");
  echo.stdout("Run the following commands to learn more:\r\n");
  echo.stdout("  contact - Contact us\r\n");
  echo.stdout("  privacy - View our Privacy Policy\r\n");
  echo.stdout("\r\n");
  echo.stdout("Type 'help' to see all available commands.\r\n");
}

export const about = {
  help,
  matcher,
  command,
  group: "info",
};
