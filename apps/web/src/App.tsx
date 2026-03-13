import React, { Suspense } from "react";
import type { FileSystemEntry } from "@/types/file-system";

const HexTerm = React.lazy(() => import("./components/HexTerm"));

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <Suspense fallback={<div>Loading...</div>}>
          <HexTerm
            defaultPrompt={`initiate@thevoid:\udb81\udf25 $ `}
            welcomeMessage={WELCOME_MESSAGE}
            history={HISTORY}
            historySize={10}
            fs={FILE_SYSTEM}
          />
        </Suspense>
      </div>
    </div>
  );
}

const WELCOME_MESSAGE = `
        ▄▄▄▄· .▄▄ · ▪  ·▄▄▄▄  ▪   ▄▄▄·  ▐ ▄      ▄▄· ▪   ▄▄▄· ▄ .▄▄▄▄ .▄▄▄  \r
  ▪     ▐█ ▀█▪▐█ ▀. ██ ██▪ ██ ██ ▐█ ▀█ •█▌▐█    ▐█ ▌▪██ ▐█ ▄███▪▐█▀▄.▀·▀▄ █·\r
   ▄█▀▄ ▐█▀▀█▄▄▀▀▀█▄▐█·▐█· ▐█▌▐█·▄█▀▀█ ▐█▐▐▌    ██ ▄▄▐█· ██▀·██▀▐█▐▀▀▪▄▐▀▀▄ \r
  ▐█▌.▐▌██▄▪▐█▐█▄▪▐█▐█▌██. ██ ▐█▌▐█ ▪▐▌██▐█▌    ▐███▌▐█▌▐█▪·•██▌▐▀▐█▄▄▌▐█•█▌\r
   ▀█▄▀▪·▀▀▀▀  ▀▀▀▀ ▀▀▀▀▀▀▀▀• ▀▀▀ ▀  ▀ ▀▀ █▪    ·▀▀▀ ▀▀▀.▀   ▀▀▀ · ▀▀▀ .▀  ▀\r
   \r
Last login: Mon Jul 23 05:44:47 TD 1888 on ttys666\r
As in the Code, so in the Void.\r
HexOS v${__VERSION__} (c) 2025 Obsidian Cipher Systems LLC. All rights reserved.\r`;

const HISTORY = ["about", "help", "echo As above so below, as below so above"];

const FILE_SYSTEM: FileSystemEntry[] = [
  { type: "file", name: "./file1.txt" },
  { type: "file", name: "./file2.txt" },
  { type: "file", name: "./file3.txt" },
  { type: "file", name: "./file4.txt" },
  { type: "file", name: "./file5.txt" },
  { type: "file", name: "./protocol.txt" },
  { type: "directory", name: "./dir1" },
  { type: "directory", name: "./dir2" },
  { type: "directory", name: "./dir3" },
  { type: "binary", name: "./binary1.bin" },
  { type: "binary", name: "./binary2.bin" },
  { type: "symlink", name: "./link1" },
  { type: "symlink", name: "./link2" },
];
