import type { CommandOptions } from "@/types/command";

const help = "privacy - View our Privacy Policy";
const matcher = /^privacy$/;

function command({ echo }: CommandOptions) {
  echo.stdout(
    "We value your privacy. We do not collect any personal data.\r\n"
  );
  echo.stdout(
    "For more details, visit: https://obsidian-cypher.systems/privacy\r\n"
  );
}

export const privacy = {
  help,
  matcher,
  command,
  group: "info",
};
