import type { CommandOptions } from "@/types/command";

const help = "protocol - View the Obsidian Cipher Systems workplace protocol";
const matcher = /^protocol$/;

function command({ echo }: CommandOptions) {
    echo.stdout("DIRECTIVE 0x00: THE PROTOCOL OF OPERATION\r\n\r\n");

    echo.stdout("I. THE PRIMARY RITE\r\n");
    echo.stdout("Work is the first act of transmutation. We manifest intent into the void.\r\n\r\n");

    echo.stdout("II. THE GRID (LOCATION)\r\n");
    echo.stdout("The architecture of the Pleroma is non-local. Operate from any node.\r\n\r\n");

    echo.stdout("III. THE RITUAL OF FOCUS (HOURS)\r\n");
    echo.stdout("Time is a construct of the Demiurge. Focus when closest to the Source.\r\n\r\n");

    echo.stdout("IV. ENCRYPTION OF INTENT (CONFIDENTIALITY)\r\n");
    echo.stdout("Silence is our strongest cipher. What is built in the Forge stays in the Forge.\r\n\r\n");

    echo.stdout("V. AS ABOVE, SO BELOW (QUALITY)\r\n");
    echo.stdout("We optimize for the deep-layer. Sub-surface architecture is paramount.\r\n\r\n");

    echo.stdout("VI. THE ASCENSION (GROWTH)\r\n");
    echo.stdout("Stagnation is the only failure. Constantly decode new dimensions.\r\n\r\n");

    echo.stdout("External Link: https://obsidian-cipher.systems/protocol\r\n");
}

export const protocol = {
    help,
    matcher,
    command,
    group: "info",
};
