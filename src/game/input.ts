import { WORLD_HEIGHT, WORLD_WIDTH } from "./config";
import { Vector } from "./vector";

type PointerRole = "move" | "fire";

interface ActivePointer {
  role: PointerRole;
  origin: Vector;
  position: Vector;
}

const MOVEMENT_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

export class InputController {
  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, ActivePointer>();
  private mouseFiring = false;
  private keyboardFiring = false;
  private enabled = false;

  public readonly aim = new Vector(WORLD_WIDTH * 0.75, WORLD_HEIGHT / 2);

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onPauseRequest: () => void,
  ) {
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerEnd);
    canvas.addEventListener("pointercancel", this.handlePointerEnd);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", this.handleKeyDown, { passive: false });
    window.addEventListener("keyup", this.handleKeyUp, { passive: false });
    window.addEventListener("blur", this.reset);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public get movement(): Vector {
    const keyboard = new Vector(
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
        Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")),
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
        Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")),
    ).limit(1);

    const touch = [...this.pointers.values()].find((pointer) => pointer.role === "move");
    if (touch) {
      keyboard.add(Vector.between(touch.origin, touch.position).scale(1 / 70).limit(1));
    }

    return keyboard.limit(1);
  }

  public get firing(): boolean {
    const touchFiring = [...this.pointers.values()].some((pointer) => pointer.role === "fire");
    return this.enabled && (this.mouseFiring || this.keyboardFiring || touchFiring);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.enabled || event.button > 0) {
      return;
    }
    event.preventDefault();
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(event.pointerId);
    const position = this.toWorldPosition(event);

    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      this.aim.x = position.x;
      this.aim.y = position.y;
      this.mouseFiring = true;
      return;
    }

    const role: PointerRole = position.x < WORLD_WIDTH * 0.46 ? "move" : "fire";
    this.pointers.set(event.pointerId, {
      role,
      origin: position.clone(),
      position,
    });
    if (role === "fire") {
      this.aim.x = position.x;
      this.aim.y = position.y;
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.enabled) {
      return;
    }
    const position = this.toWorldPosition(event);
    const pointer = this.pointers.get(event.pointerId);
    if (pointer) {
      pointer.position = position;
      if (pointer.role === "fire") {
        this.aim.x = position.x;
        this.aim.y = position.y;
      }
      return;
    }
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      this.aim.x = position.x;
      this.aim.y = position.y;
    }
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      this.mouseFiring = false;
    }
    this.pointers.delete(event.pointerId);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyP" || event.code === "Escape") {
      if (!event.repeat) {
        this.onPauseRequest();
      }
      event.preventDefault();
      return;
    }
    if (!this.enabled) {
      return;
    }
    if (MOVEMENT_KEYS.has(event.code)) {
      this.keys.add(event.code);
      event.preventDefault();
    }
    if (event.code === "Space") {
      this.keyboardFiring = true;
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
    if (event.code === "Space") {
      this.keyboardFiring = false;
      event.preventDefault();
    }
  };

  private readonly reset = (): void => {
    this.keys.clear();
    this.pointers.clear();
    this.mouseFiring = false;
    this.keyboardFiring = false;
  };

  private toWorldPosition(event: PointerEvent): Vector {
    const bounds = this.canvas.getBoundingClientRect();
    return new Vector(
      ((event.clientX - bounds.left) / bounds.width) * WORLD_WIDTH,
      ((event.clientY - bounds.top) / bounds.height) * WORLD_HEIGHT,
    );
  }
}
