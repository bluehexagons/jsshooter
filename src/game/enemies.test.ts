import { describe, expect, it } from "vitest";
import { centipedeLength, FORMATIONS, formationTop } from "./enemies";

describe("legacy formations", () => {
  it("keeps the five-ship chevron geometry", () => {
    expect(FORMATIONS.chevron.placements).toHaveLength(5);
    expect(FORMATIONS.chevron.placements.map((placement) => placement.x)).toEqual([0, 40, 40, 80, 80]);
  });

  it("keeps the wall and eight escorts in the barricade", () => {
    expect(FORMATIONS.barricade.placements.filter((placement) => placement.kind === "wall")).toHaveLength(1);
    expect(FORMATIONS.barricade.placements.filter((placement) => placement.kind === "scout")).toHaveLength(8);
  });

  it("fits a formation inside a short playfield", () => {
    expect(formationTop(FORMATIONS.barricade, 550, 600)).toBe(458);
  });
});

describe("centipede chains", () => {
  it("always creates at least two and caps unusually long chains", () => {
    expect(centipedeLength(() => 0.9)).toBe(2);
    expect(centipedeLength(() => 0)).toBe(10);
  });

  it("adds one segment for each successful legacy roll", () => {
    const rolls = [0.4, 0.6, 0.9];
    expect(centipedeLength(() => rolls.shift() ?? 1)).toBe(4);
  });
});
