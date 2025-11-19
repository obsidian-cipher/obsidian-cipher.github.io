import { useLayoutEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { debounce } from "es-toolkit";

import { LocalEchoAddon } from "@/addons/xterm-addon-local-echo";
import { CRTShaderAddon } from "@/addons/xterm-addon-crt-shader";
import * as commands from "@/commands";

import type { Commands } from "@/types/command";
import type { FileSystemEntry } from "@/types/file-system";

export type HexTermProps = {
  defaultPrompt?: string;
  history?: string[];
  historySize?: number;
  onPromptChange?: (prompt: string) => void;
  welcomeMessage?: string;
  fs?: FileSystemEntry[];
};

export default function HexTerm({
  defaultPrompt = "$ ",
  history,
  historySize = 100,
  onPromptChange,
  welcomeMessage,
  fs = [],
}: HexTermProps = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const term = new Terminal({
      scrollback: Number.MAX_SAFE_INTEGER,
      cursorBlink: true,
      theme,
      fontFamily:
        '"Terminess", "Courier New", "Liberation Mono", "DejaVu Sans Mono", monospace',
      fontSize: 22,
      lineHeight: 1,
      letterSpacing: 0,
    });

    const fit = new FitAddon();
    const resize = new ResizeObserver(
      debounce(() => {
        fit.fit();
      }, 100)
    );
    resize.observe(document.body);

    const links = new WebLinksAddon(
      (_, uri) => {
        if (uri.startsWith("https")) {
          window.open(uri, "_blank", "noopener");
        } else if (uri.startsWith("mailto:")) {
          window.open(uri, "_self");
        }
      },
      {
        urlRegex: /(https?:\/\/[^\s]+)|(mailto:\/\/[^\s]+@[^\s]+\.[^\s]+)/,
      }
    );

    const webgl = new WebglAddon(true);

    const localEcho = new LocalEchoAddon({
      prompt: defaultPrompt,
      welcomeMessage: welcomeMessage,
      history: history,
      historySize: historySize,
    });
    const crtShader = new CRTShaderAddon({
      scanlineIntensity: 0.08,
      scanlineCount: 300,
      curvature: 0.8,
      vignetteIntensity: 0.5,
      glowIntensity: 0.3,
      flickerSpeed: 0.015,
      chromaAberration: 0.001,
      enabled: true,
    });

    webgl.onContextLoss(() => {
      webgl.dispose();
    });

    term.loadAddon(fit);
    term.loadAddon(webgl);
    term.loadAddon(crtShader);
    term.loadAddon(localEcho);
    term.loadAddon(links);

    console.log("Initializing terminal...");
    term.open(ref.current);

    const timeout = setTimeout(() => {
      fit.fit();
      term.focus();
      console.log(`Terminal fitted: ${term.rows} x ${term.cols}`);
      console.log(
        `Container size: ${ref.current?.offsetWidth} x ${ref.current?.offsetHeight}`
      );

      // Simple command handler loop
      const handleCommand = async () => {
        while (true) {
          const line = await localEcho.readLine();
          const cmd = line.trim();
          if (cmd === "help") {
            localEcho.stdout("Available commands:\r\n");
            help().forEach((h) => localEcho.stdout(`  ${h}`));
            localEcho.stdout("  help - Show this help\r\n");
            localEcho.stdout("  history - Show command history\r\n");
            localEcho.stdout("  clear - Clear terminal\r\n");
          } else if (cmd === "history") {
            history?.forEach((h, i) => {
              localEcho.stdout(`${i + 1} ${h}\r\n`);
            });
          } else if (cmd === "clear") {
            term.clear();
          } else if (cmd) {
            await run(cmd, localEcho, fs);
          }
        }
      };
      handleCommand();
    }, 10);

    return () => {
      clearTimeout(timeout);
      resize.disconnect();
      term.dispose();
    };
  }, [defaultPrompt, fs, history, historySize, onPromptChange, welcomeMessage]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        id="terminal"
        ref={ref}
        style={{ width: "100%", height: "100%" }}
      ></div>
    </div>
  );
}

// Classic 1970s/1980s green CRT color theme
const theme = {
  background: "#001100", // Very dark green background
  foreground: "#33ff33", // Bright phosphor green (P1 phosphor)
  cursor: "#44ff44", // Slightly brighter cursor
  cursorAccent: "#001100", // Dark accent for cursor
  selectionBackground: "#114411", // Subtle green selection
  // ANSI colors using various shades of green
  black: "#002200", // Dark green instead of black
  red: "#22aa22", // Green tint instead of red
  green: "#44ff44", // Bright green
  yellow: "#66ff66", // Light green for yellow
  blue: "#33cc33", // Medium green for blue
  magenta: "#55dd55", // Green tint for magenta
  cyan: "#77ff77", // Bright light green for cyan
  white: "#aaffaa", // Very light green for white
  // Bright variants
  brightBlack: "#334433", // Medium dark green
  brightRed: "#44cc44", // Brighter green
  brightGreen: "#66ff66", // Very bright green
  brightYellow: "#88ff88", // Super bright green
  brightBlue: "#55ee55", // Bright medium green
  brightMagenta: "#77ff77", // Bright light green
  brightCyan: "#99ff99", // Very bright light green
  brightWhite: "#ccffcc", // Almost white green
};

function help() {
  return Object.entries(commands)
    .sort(([, { group: a }], [, { group: b }]) => {
      if (a === b) return 0;
      return a === "info" ? -1 : 1;
    })
    .map(([, { help }]) => `${help}\r\n`);
}

async function run(
  cmd: string,
  echo: LocalEchoAddon,
  fs?: readonly FileSystemEntry[]
) {
  const [name, ...args] = cmd.split(/\s+/);
  const command = (commands as unknown as Commands)[name];
  if (command) {
    await command.command({ echo, args, fs });
  } else {
    echo.stdout(`Unknown command: ${cmd}\r\n`);
  }
}
