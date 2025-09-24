// xterm-addon-local-echo.ts
// Minimal local echo addon for xterm.js
import type { Terminal } from "@xterm/xterm";

export interface LocalEchoOptions {
  prompt?: string;
  welcomeMessage?: string;
  history?: string[];
  historySize?: number;
}

export class LocalEchoAddon {
  private prompt = "> ";
  private welcomeMessage = "";
  private term: Terminal | null = null;
  private input = "";
  private history: string[] = [];
  private historyIndex = -1;
  private resolveLine: ((line: string) => void) | null = null;
  private historySize: number;

  constructor(options: LocalEchoOptions = {}) {
    this.prompt = options.prompt ?? "> ";
    this.welcomeMessage = options.welcomeMessage ?? "";
    this.historySize = options.historySize ?? 1000;
    this.history = options.history
      ? [...options.history.slice(0, this.historySize)]
      : [];
    this.historyIndex = this.history.length || -1;
  }

  activate(term: Terminal) {
    this.term = term;
    term.onKey(this.handleKey);

    if (this.welcomeMessage) {
      this.stdout(this.welcomeMessage + "\r\n");
    }
  }

  dispose() {
    // No-op for now
  }

  setPrompt(newPrompt: string) {
    this.prompt = newPrompt;
  }

  getPrompt(): string {
    return this.prompt;
  }

  stdout(text: string) {
    this.term?.write(text);
  }

  private handleKey = ({
    key,
    domEvent,
  }: {
    key: string;
    domEvent: KeyboardEvent;
  }) => {
    if (!this.term) return;
    const t = this.term;
    if (domEvent.key === "Enter") {
      t.write("\r\n");
      const line = this.input;
      this.history.push(line);

      // Maintain history size limit
      if (this.history.length > this.historySize) {
        this.history = this.history.slice(-this.historySize);
      }

      this.historyIndex = this.history.length;
      this.input = "";
      if (this.resolveLine) {
        this.resolveLine(line);
        this.resolveLine = null;
      }
    } else if (domEvent.key === "Backspace") {
      if (this.input.length > 0) {
        t.write("\b \b");
        this.input = this.input.slice(0, -1);
      }
    } else if (domEvent.key === "ArrowUp") {
      if (this.history.length > 0 && this.historyIndex > 0) {
        this.historyIndex--;
        this.replaceInput(this.history[this.historyIndex]);
      }
    } else if (domEvent.key === "ArrowDown") {
      if (
        this.history.length > 0 &&
        this.historyIndex < this.history.length - 1
      ) {
        this.historyIndex++;
        this.replaceInput(this.history[this.historyIndex]);
      } else {
        this.replaceInput("");
        this.historyIndex = this.history.length;
      }
    } else if (
      domEvent.key.length === 1 &&
      !domEvent.ctrlKey &&
      !domEvent.metaKey
    ) {
      t.write(key);
      this.input += key;
    }
  };

  private replaceInput(newInput: string) {
    if (!this.term) return;
    // Erase current input
    for (let i = 0; i < this.input.length; i++) {
      this.term.write("\b \b");
    }
    this.input = newInput;
    this.term.write(newInput);
  }

  async readLine(): Promise<string> {
    this.term?.write("\r\n" + this.prompt);
    this.input = "";
    return new Promise((resolve) => {
      this.resolveLine = resolve;
    });
  }
}
