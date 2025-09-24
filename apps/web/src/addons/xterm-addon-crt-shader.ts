import type { Terminal, ITerminalAddon, IDisposable } from "@xterm/xterm";

interface CRTShaderOptions {
  scanlineIntensity?: number;
  scanlineCount?: number;
  curvature?: number;
  vignetteIntensity?: number;
  glowIntensity?: number;
  flickerSpeed?: number;
  chromaAberration?: number;
  enabled?: boolean;
}

export class CRTShaderAddon implements ITerminalAddon {
  private static debugPanelRefCount: number = 0;
  private static globalDebugPanel: HTMLDivElement | null = null;

  private terminal: Terminal | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private startTime: number = 0;
  private options: Required<CRTShaderOptions>;
  private resizeObserver: IDisposable | null = null;
  private lastInputTime: number = 0;
  private idleThreshold: number = 5000; // 5 seconds of idle time
  private manualRedrawTriggered: boolean = false;
  private manualRedrawTime: number = 0;
  private debugPanel: HTMLDivElement | null = null;
  private debugUpdateInterval: number | null = null;

  // Default options
  private readonly defaultOptions: Required<CRTShaderOptions> = {
    scanlineIntensity: 0.15,
    scanlineCount: 800,
    curvature: 0.05,
    vignetteIntensity: 0.3,
    glowIntensity: 0.4,
    flickerSpeed: 0.03,
    chromaAberration: 0.002,
    enabled: true,
  };

  constructor(options: CRTShaderOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  activate(terminal: Terminal): void {
    this.terminal = terminal;
    this.lastInputTime = performance.now();
    this.setupInputHandler();
    this.initialize();
    this.resizeObserver = this.terminal.onResize(() => {
      this.updateCanvasSize();
    });

    // Initialize debug panel (visible by default for testing)
    setTimeout(() => {
      this.createDebugPanel();
      this.updateDebugInfo(); // Do initial update
      // this.hideDebugPanel(); // Comment out to start visible for testing
    }, 500);
  }

  dispose(): void {
    this.cleanup();
    this.terminal = null;
  }

  private setupInputHandler(): void {
    if (!this.terminal) return;

    // Hook into terminal key events to track activity and trigger effects
    this.terminal.onKey(({ domEvent }) => {
      this.lastInputTime = performance.now();

      // Trigger manual redraw effect on Enter key
      if (domEvent.key === "Enter") {
        this.triggerManualRedraw();
      }
    });

    // Hook into data events as well (for programmatic input)
    this.terminal.onData(() => {
      this.lastInputTime = performance.now();
    });
  }

  private triggerManualRedraw(): void {
    // 30% chance to trigger a redraw scanline on Enter
    if (Math.random() < 0.3) {
      this.manualRedrawTriggered = true;
      this.manualRedrawTime = performance.now();
    }
  }

  private checkIdleState(currentTime: number): boolean {
    return currentTime - this.lastInputTime > this.idleThreshold;
  }

  private initialize(): void {
    // Wait for WebGL addon to be ready and terminal to be mounted
    setTimeout(() => {
      this.setupCanvasOverlay();

      if (this.options.enabled) {
        this.startAnimation();
      }
    }, 100);
  }

  private setupCanvasOverlay(): void {
    if (!this.terminal) return;

    const terminalElement = this.terminal.element;
    if (!terminalElement) return;

    // Find the WebGL canvas
    this.canvas = terminalElement.querySelector("canvas") as HTMLCanvasElement;
    if (!this.canvas) return;

    // Create overlay canvas for effects
    this.overlayCanvas = document.createElement("canvas");
    this.overlayCtx = this.overlayCanvas.getContext("2d");

    if (!this.overlayCtx) {
      console.warn("CRT Shader: Could not get 2D context for overlay.");
      return;
    }

    // Style the overlay canvas
    this.overlayCanvas.style.position = "absolute";
    this.overlayCanvas.style.top = "0";
    this.overlayCanvas.style.left = "0";
    this.overlayCanvas.style.pointerEvents = "none";
    this.overlayCanvas.style.zIndex = "10";
    this.overlayCanvas.style.mixBlendMode = "overlay"; // Use overlay blend mode for more subtle effect

    // Make terminal container relative for overlay positioning
    if (
      terminalElement.style.position !== "relative" &&
      terminalElement.style.position !== "absolute"
    ) {
      terminalElement.style.position = "relative";
    }

    // Insert overlay after the WebGL canvas
    this.canvas.parentNode?.insertBefore(
      this.overlayCanvas,
      this.canvas.nextSibling
    );

    this.updateCanvasSize();

    this.startTime = performance.now();
  }

  private updateCanvasSize(): void {
    if (!this.canvas || !this.overlayCanvas) return;

    const rect = {
      width: window.innerWidth * window.devicePixelRatio,
      height: window.innerHeight * window.devicePixelRatio,
    };
    this.overlayCanvas.width = window.innerWidth;
    this.overlayCanvas.height = window.innerHeight;
    this.overlayCanvas.style.width = rect.width + "px";
    this.overlayCanvas.style.height = rect.height + "px";
  }

  private startAnimation(): void {
    this.animate();
  }

  private animate = (): void => {
    if (!this.options.enabled) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000.0;
    this.render(elapsed);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private render(time: number): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;

    // Clear the overlay
    this.overlayCtx.clearRect(0, 0, width, height);

    // Apply CRT effects using canvas 2D API
    this.renderScanlines(time);
    this.renderVignette();
    this.renderFlicker(time);
    this.renderGlow();
  }

  private renderScanlines(time: number): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;
    const scanlineSpacing = height / this.options.scanlineCount;

    // Create scanline pattern with enhanced animation
    this.overlayCtx.globalCompositeOperation = "source-over";

    // Base scanlines with flickering
    for (let y = 0; y < height; y += scanlineSpacing) {
      // More noticeable flicker with variable timing per scanline
      const scanlinePhase = y * 0.01;
      const baseFlicker = Math.sin(
        time * this.options.flickerSpeed * 20 + scanlinePhase
      );
      const rapidFlicker = Math.sin(
        time * this.options.flickerSpeed * 60 + scanlinePhase
      );
      const slowFlicker = Math.sin(
        time * this.options.flickerSpeed * 5 + scanlinePhase
      );

      const intensity =
        this.options.scanlineIntensity *
        0.3 *
        (0.2 + // Reduced base darkness
          0.05 * baseFlicker +
          0.02 * rapidFlicker +
          0.08 * slowFlicker +
          0.05 * Math.random()); // Random noise

      // Dark scanlines with much lower opacity
      this.overlayCtx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, intensity)})`;
      this.overlayCtx.fillRect(0, y, width, Math.max(1, scanlineSpacing * 0.5));
    }

    // Handle manual redraw triggered by Enter key
    let manualRedrawActive = false;
    if (this.manualRedrawTriggered) {
      const timeSinceManualTrigger = time * 1000 - this.manualRedrawTime;
      if (timeSinceManualTrigger < 2000) {
        // 2 second duration
        manualRedrawActive = true;
        const manualProgress = timeSinceManualTrigger / 2000;
        const manualRedrawY = manualProgress * height;

        // More intense manual redraw effect
        this.overlayCtx.globalCompositeOperation = "screen";
        const manualIntensity = 0.5 * Math.sin(manualProgress * Math.PI);

        this.overlayCtx.fillStyle = `rgba(51, 255, 51, ${manualIntensity})`;
        this.overlayCtx.fillRect(0, manualRedrawY, width, 6);

        // Stronger glow for manual redraw
        const glowHeight = 16;
        const glowGradient = this.overlayCtx.createLinearGradient(
          0,
          manualRedrawY - glowHeight,
          0,
          manualRedrawY + glowHeight
        );
        glowGradient.addColorStop(0, "rgba(51, 255, 51, 0)");
        glowGradient.addColorStop(
          0.5,
          `rgba(51, 255, 51, ${manualIntensity * 0.4})`
        );
        glowGradient.addColorStop(1, "rgba(51, 255, 51, 0)");

        this.overlayCtx.fillStyle = glowGradient;
        this.overlayCtx.fillRect(
          0,
          manualRedrawY - glowHeight,
          width,
          2 * glowHeight
        );
      } else {
        this.manualRedrawTriggered = false;
      }
    }

    // Automatic redraw scanline (only if no manual redraw is active)
    if (!manualRedrawActive) {
      // Occasional bright redraw scanline that sweeps down (classic CRT refresh effect)
      const redrawSpeed = 0.25; // Slightly slower for more dramatic effect
      const redrawFrequency = 5; // Every 5 seconds
      const redrawPhase = (time * redrawSpeed) % redrawFrequency;

      if (redrawPhase < 3) {
        // Show redraw line for 3 seconds out of every 5
        const redrawProgress = redrawPhase / 3; // 0 to 1 over 3 seconds
        const redrawY = redrawProgress * height; // Sweep from top to bottom
        const redrawHeight = 4;

        // Bright green redraw line with more visible intensity
        this.overlayCtx.globalCompositeOperation = "screen";

        // Create a wave effect for the intensity
        const waveEffect = Math.sin(redrawProgress * Math.PI); // Peak in the middle
        const redrawIntensity = 0.3 * waveEffect; // More visible

        // Main redraw line
        this.overlayCtx.fillStyle = `rgba(51, 255, 51, ${redrawIntensity})`;
        this.overlayCtx.fillRect(0, redrawY, width, redrawHeight);

        // Add a more pronounced glow above and below the redraw line
        const glowHeight = 12;
        const glowGradient = this.overlayCtx.createLinearGradient(
          0,
          redrawY - glowHeight,
          0,
          redrawY + redrawHeight + glowHeight
        );
        glowGradient.addColorStop(0, "rgba(51, 255, 51, 0)");
        glowGradient.addColorStop(
          0.2,
          `rgba(51, 255, 51, ${redrawIntensity * 0.3})`
        );
        glowGradient.addColorStop(
          0.5,
          `rgba(51, 255, 51, ${redrawIntensity * 0.5})`
        );
        glowGradient.addColorStop(
          0.8,
          `rgba(51, 255, 51, ${redrawIntensity * 0.3})`
        );
        glowGradient.addColorStop(1, "rgba(51, 255, 51, 0)");

        this.overlayCtx.fillStyle = glowGradient;
        this.overlayCtx.fillRect(
          0,
          redrawY - glowHeight,
          width,
          redrawHeight + 2 * glowHeight
        );

        // Add a subtle trailing effect
        if (redrawY > 20) {
          const trailGradient = this.overlayCtx.createLinearGradient(
            0,
            redrawY - 20,
            0,
            redrawY
          );
          trailGradient.addColorStop(0, "rgba(51, 255, 51, 0)");
          trailGradient.addColorStop(
            1,
            `rgba(51, 255, 51, ${redrawIntensity * 0.1})`
          );

          this.overlayCtx.fillStyle = trailGradient;
          this.overlayCtx.fillRect(0, redrawY - 20, width, 20);
        }
      }
    } // Close the automatic redraw if block
  }

  private renderVignette(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Create radial gradient for vignette glow using P1 phosphor green
    const gradient = this.overlayCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );

    gradient.addColorStop(
      0,
      `rgba(51, 255, 51, ${this.options.vignetteIntensity * 0.01})`
    );
    gradient.addColorStop(0.8, "rgba(51, 255, 51, 0)");
    gradient.addColorStop(1, "rgba(51, 255, 51, 0)");

    this.overlayCtx.globalCompositeOperation = "source-over";
    this.overlayCtx.fillStyle = gradient;
    this.overlayCtx.fillRect(0, 0, width, height);
  }

  private renderFlicker(time: number): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;
    const currentTime = performance.now();
    const isIdle = this.checkIdleState(currentTime);

    // Base flicker intensity increases when idle (like old CRTs losing power regulation)
    const idleMultiplier = isIdle ? 2.5 : 1.0;

    // Much more subtle flicker effect when active, stronger when idle
    const baseFlicker =
      Math.sin(time * this.options.flickerSpeed * 25) * 0.1 * idleMultiplier;
    const rapidFlicker =
      Math.sin(time * this.options.flickerSpeed * 120) * 0.05 * idleMultiplier;
    const slowFlicker = Math.sin(time * this.options.flickerSpeed * 8) * 0.03;
    const randomFlicker = (Math.random() - 0.5) * 0.02 * idleMultiplier;

    // Power fluctuation is more pronounced when idle
    const powerFluctuationCycle = time * (isIdle ? 0.15 : 0.2);
    const powerFluctuationIntensity = isIdle ? 0.03 : 0.01;
    const powerFluctuation =
      Math.sin(powerFluctuationCycle) *
      powerFluctuationIntensity *
      (Math.sin(powerFluctuationCycle * 0.3) > (isIdle ? 0.6 : 0.8) ? 1 : 0);

    // Add occasional "power surge" when idle
    const surgeCycle = time * 0.05;
    const powerSurge =
      isIdle && Math.sin(surgeCycle) > 0.95
        ? Math.sin(surgeCycle * 20) * 0.05
        : 0;

    const totalFlicker =
      (baseFlicker +
        rapidFlicker +
        slowFlicker +
        randomFlicker +
        powerFluctuation +
        powerSurge) *
      0.002;

    // Only apply very subtle brightness changes
    if (totalFlicker > 0) {
      this.overlayCtx.globalCompositeOperation = "screen";
      this.overlayCtx.fillStyle = `rgba(51, 255, 51, ${totalFlicker})`;
      this.overlayCtx.fillRect(0, 0, width, height);
    } else {
      // Very subtle darkening
      this.overlayCtx.globalCompositeOperation = "multiply";
      const darkeningAmount = Math.abs(totalFlicker) * 50;
      this.overlayCtx.fillStyle = `rgba(${255 - darkeningAmount}, ${
        255 - darkeningAmount * 0.5
      }, ${255 - darkeningAmount}, 1)`;
      this.overlayCtx.fillRect(0, 0, width, height);
    }
  }

  private renderGlow(): void {
    if (
      !this.overlayCtx ||
      !this.overlayCanvas ||
      this.options.glowIntensity === 0
    )
      return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;

    // Create a very subtle P1 phosphor green glow effect
    this.overlayCtx.globalCompositeOperation = "source-over";
    this.overlayCtx.shadowColor = "#33ff33";
    this.overlayCtx.shadowBlur = this.options.glowIntensity * 5; // Much reduced
    this.overlayCtx.fillStyle = `rgba(51, 255, 51, ${
      this.options.glowIntensity * 0.005
    })`; // Much more subtle
    this.overlayCtx.fillRect(0, 0, width, height);
    this.overlayCtx.shadowBlur = 0;
  }

  private cleanup(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.dispose();
      this.resizeObserver = null;
    }

    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
    }

    this.cleanupDebugPanel();

    this.overlayCanvas = null;
    this.overlayCtx = null;
    this.canvas = null;
  }

  // Public methods to control the shader
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;

    if (this.overlayCanvas) {
      this.overlayCanvas.style.display = enabled ? "block" : "none";
    }

    if (enabled) {
      this.startAnimation();
    } else if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateOptions(options: Partial<CRTShaderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getScanlineIntensity(): number {
    return this.options.scanlineIntensity;
  }

  setScanlineIntensity(intensity: number): void {
    this.options.scanlineIntensity = Math.max(0, Math.min(1, intensity));
  }

  getCurvature(): number {
    return this.options.curvature;
  }

  setCurvature(curvature: number): void {
    this.options.curvature = Math.max(0, Math.min(1, curvature));
  }

  getVignetteIntensity(): number {
    return this.options.vignetteIntensity;
  }

  setVignetteIntensity(intensity: number): void {
    this.options.vignetteIntensity = Math.max(0, Math.min(1, intensity));
  }

  toggle(): void {
    this.setEnabled(!this.options.enabled);
  }

  // Public method to check if terminal is idle
  isIdle(currentTime?: number): boolean {
    const time = currentTime || performance.now();
    return time - this.lastInputTime > this.idleThreshold;
  }

  switchToCSS(): void {
    // Clean up canvas overlay
    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
    }
  }

  // Debug UI Methods
  createDebugPanel(): void {
    if (!__DEV__ || !this.terminal) return;

    // Use static global debug panel to ensure only one exists across all instances
    if (CRTShaderAddon.globalDebugPanel) {
      this.debugPanel = CRTShaderAddon.globalDebugPanel;
      CRTShaderAddon.debugPanelRefCount++;
      this.startDebugUpdates();
      return;
    }

    // Check if a debug panel already exists in the DOM (from another instance)
    const existingPanel = document.getElementById("crt-debug-panel");
    if (existingPanel) {
      console.log("Debug panel already exists in DOM, using existing one");
      this.debugPanel = existingPanel as HTMLDivElement;
      CRTShaderAddon.globalDebugPanel = this.debugPanel;
      CRTShaderAddon.debugPanelRefCount++;
      this.startDebugUpdates();
      return;
    }

    this.debugPanel = document.createElement("div");
    this.debugPanel.id = "crt-debug-panel";
    this.debugPanel.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 17, 0, 0.9);
        border: 1px solid #33ff33;
        color: #33ff33;
        padding: 10px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 10000;
        min-width: 250px;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(51, 255, 51, 0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong>CRT Shader Debug</strong>
          <button id="crt-debug-toggle" style="
            background: none;
            border: 1px solid #33ff33;
            color: #33ff33;
            font-size: 10px;
            padding: 2px 6px;
            cursor: pointer;
            border-radius: 2px;
          ">Close</button>
        </div>
        <div id="crt-debug-content">
          <div>Status: <span id="crt-status">Loading...</span></div>
          <div>Mode: <span id="crt-mode">Loading...</span></div>
          <div>Scanlines: <span id="crt-scanlines">Loading...</span></div>
          <div>Intensity: <span id="crt-intensity">Loading...</span></div>
          <div>Curvature: <span id="crt-curvature">Loading...</span></div>
          <div>Vignette: <span id="crt-vignette">Loading...</span></div>
          <div>Glow: <span id="crt-glow">Loading...</span></div>
          <div>Flicker: <span id="crt-flicker">Loading...</span></div>
          <div>Aberration: <span id="crt-aberration">Loading...</span></div>
          <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
            Press Ctrl+Shift+D to toggle
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.debugPanel);

    // Set static references
    CRTShaderAddon.globalDebugPanel = this.debugPanel;
    CRTShaderAddon.debugPanelRefCount = 1;

    // Add close button functionality
    const closeBtn = document.getElementById("crt-debug-toggle");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideDebugPanel());
    }

    // Start updating the debug info
    this.startDebugUpdates();

    // Add keyboard shortcut
    this.addDebugKeyboardShortcut();
  }

  private addDebugKeyboardShortcut(): void {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        this.toggleDebugPanel();
      }
    };

    document.addEventListener("keydown", handleKeydown);
  }

  toggleDebugPanel(): void {
    if (this.debugPanel && this.debugPanel.style.display !== "none") {
      this.hideDebugPanel();
    } else {
      this.showDebugPanel();
    }
  }

  showDebugPanel(): void {
    if (!this.debugPanel) {
      this.createDebugPanel();
    } else {
      this.debugPanel.style.display = "block";
    }
    this.startDebugUpdates();
  }

  hideDebugPanel(): void {
    if (this.debugPanel) {
      this.debugPanel.style.display = "none";
      this.stopDebugUpdates();
    }
  }

  private startDebugUpdates(): void {
    if (this.debugUpdateInterval) return;

    this.debugUpdateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 100); // Update every 100ms

    // Initial update
    this.updateDebugInfo();
  }

  private stopDebugUpdates(): void {
    if (this.debugUpdateInterval) {
      clearInterval(this.debugUpdateInterval);
      this.debugUpdateInterval = null;
    }
  }

  private updateDebugInfo(): void {
    if (!this.debugPanel) return;

    const currentTime = performance.now();
    const isIdle = this.isIdle(currentTime);

    // Update status
    const statusEl = document.getElementById("crt-status");
    if (statusEl) {
      statusEl.textContent = this.options.enabled ? "Enabled" : "Disabled";
      statusEl.style.color = this.options.enabled ? "#33ff33" : "#ff3333";
    }

    // Update mode
    const modeEl = document.getElementById("crt-mode");
    if (modeEl) {
      modeEl.textContent = isIdle ? "Idle (Enhanced)" : "Active";
      modeEl.style.color = isIdle ? "#ffff33" : "#33ff33";
    }

    // Update values
    const updates = [
      { id: "crt-scanlines", value: this.options.scanlineCount },
      { id: "crt-intensity", value: this.options.scanlineIntensity.toFixed(3) },
      { id: "crt-curvature", value: this.options.curvature.toFixed(3) },
      { id: "crt-vignette", value: this.options.vignetteIntensity.toFixed(3) },
      { id: "crt-glow", value: this.options.glowIntensity.toFixed(3) },
      { id: "crt-flicker", value: this.options.flickerSpeed.toFixed(4) },
      { id: "crt-aberration", value: this.options.chromaAberration.toFixed(4) },
    ];

    updates.forEach(({ id, value }) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value.toString();
      } else {
        console.warn(`Element with id ${id} not found`); // Debug log
      }
    });
  }

  private cleanupDebugPanel(): void {
    this.stopDebugUpdates();

    if (this.debugPanel) {
      // Decrease reference count
      CRTShaderAddon.debugPanelRefCount--;

      // Only remove from DOM if this is the last reference
      if (
        CRTShaderAddon.debugPanelRefCount <= 0 &&
        this.debugPanel.parentNode
      ) {
        try {
          document.body.removeChild(this.debugPanel);
          CRTShaderAddon.globalDebugPanel = null;
          CRTShaderAddon.debugPanelRefCount = 0;
        } catch (e) {
          console.warn("Debug panel was already removed from DOM:", e);
        }
      }
    }

    this.debugPanel = null;
  }
}

export default CRTShaderAddon;
