import type { CommandOptions } from "@/types/command";

const help = "tos - View our Terms of Service";
const matcher = /^tos$/;

function command({ echo }: CommandOptions) {
  echo.stdout(
    "Our Terms of Service are designed to protect both you and us.\r\n"
  );
  echo.stdout(
    "For more details, visit: https://obsidian-cypher.systems/tos\r\n"
  );
}

export const tos = {
  help,
  matcher,
  command,
  group: "info",
};
