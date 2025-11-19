# obsidian-cipher.github.io

Solve the Obsidian Cipher and join the cause. Web3 ZK cipher puzzle w/ NFT rewards. Connect your Abstract wallet, solve the puzzle or sacrifice to reveal a hint. 666 obsidian cipher sigils available to claim.

## TODO

1. Wasm Runner on a Worker that supports fetching binaries from a pre-determined registry.

Example Implementations

- https://github.com/cryptool-org/wasm-webterm/blob/master/src/runnables/WasmerRunnable.js
- https://github.com/taybenlor/runno/blob/main/packages/wasi/lib/worker/wasi-host.ts

Requirements

- No SharedArrayBuffer, use transferable objects w/ a ring buffer for stdin / stdout streams from wasm cli tools running in a worker
- Adopt the filesystem pattern from runno to allow cli apps to manipulate an in memory fs

2. Integrate AGW and connect commands

3. Cipher Contract
