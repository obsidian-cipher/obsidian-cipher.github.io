import type { LocalEchoAddon } from "@/addons/xterm-addon-local-echo";
import type { FileSystemEntry } from "./file-system";

export type CommandOptions = {
  echo: LocalEchoAddon;
  args?: string[];
  fs?: readonly FileSystemEntry[];
};

export type Command = (opts: CommandOptions) => void;

export type CommandGroup = "command" | "info";
export type CommandDefinition = {
  help: string;
  matcher: RegExp;
  command: Command;
  group: CommandGroup;
};

export type Commands = Record<string, CommandDefinition | undefined>;
