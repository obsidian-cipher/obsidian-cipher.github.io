import type { CommandOptions } from "@/types/command";

const help = "protocol - View the Obsidian Cipher Systems workplace protocol";
const matcher = /^protocol$/;

function command({ echo }: CommandOptions) {
    echo.stdout("DIRECTIVE 0x00: THE PROTOCOL\r\n\r\n");
    echo.stdout(
        "The laboratory is non-local; manifest your intent from any node on the grid where focus is absolute.\r\n"
    );
    echo.stdout(
        "Silence is our primary cipher, and the transmutation of code is our only ritual.\r\n"
    );
    echo.stdout("\r\nExternal Link: https://obsidian-cipher.systems/protocol\r\n");
}

export const protocol = {
    help,
    matcher,
    command,
    group: "info",
};
