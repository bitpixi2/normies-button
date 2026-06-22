import { describe, expect, it } from "vitest";
import {
  ROUND_SECONDS,
  canPressRound,
  createFailedRun,
  createPressRun,
  formatClock,
  getSecondsRemaining,
  getTypeForSecondsRemaining,
  summarizeHistory,
  trimHistory,
  type RunRecord
} from "./game";

describe("Normies Type windows", () => {
  it("maps countdown windows to Normies Types", () => {
    expect(getTypeForSecondsRemaining(60)).toBe("Human");
    expect(getTypeForSecondsRemaining(49)).toBe("Human");
    expect(getTypeForSecondsRemaining(48)).toBe("Cat");
    expect(getTypeForSecondsRemaining(37)).toBe("Cat");
    expect(getTypeForSecondsRemaining(36)).toBe("Alien");
    expect(getTypeForSecondsRemaining(25)).toBe("Alien");
    expect(getTypeForSecondsRemaining(24)).toBe("Agent");
    expect(getTypeForSecondsRemaining(13)).toBe("Agent");
    expect(getTypeForSecondsRemaining(12)).toBe("Zombie");
    expect(getTypeForSecondsRemaining(1)).toBe("Zombie");
    expect(getTypeForSecondsRemaining(0)).toBeNull();
  });

  it("formats countdown values", () => {
    expect(formatClock(60)).toBe("1:00");
    expect(formatClock(13)).toBe("0:13");
    expect(formatClock(0)).toBe("0:00");
  });
});

describe("round logic", () => {
  it("computes remaining seconds from the start time", () => {
    expect(getSecondsRemaining(1_000, 1_000)).toBe(ROUND_SECONDS);
    expect(getSecondsRemaining(1_000, 13_000)).toBe(48);
    expect(getSecondsRemaining(1_000, 61_000)).toBe(0);
  });

  it("only allows one active running press", () => {
    expect(canPressRound("running", 1)).toBe(true);
    expect(canPressRound("running", 0)).toBe(false);
    expect(canPressRound("pressed", 60)).toBe(false);
    expect(canPressRound("failed", 60)).toBe(false);
    expect(canPressRound("idle", 60)).toBe(false);
  });

  it("records the awarded Type and waited time", () => {
    const run = createPressRun(10, new Date("2026-06-22T00:00:00.000Z"));

    expect(run.status).toBe("success");
    expect(run.awardedType).toBe("Zombie");
    expect(run.secondsWaited).toBe(50);
    expect(run.pressedAtSecondsRemaining).toBe(10);
  });

  it("records no Type at zero", () => {
    const run = createFailedRun(new Date("2026-06-22T00:00:00.000Z"));

    expect(run.status).toBe("failed");
    expect(run.awardedType).toBeNull();
    expect(run.secondsWaited).toBe(60);
  });
});

describe("history summaries", () => {
  it("summarizes local standings and best run", () => {
    const runs: RunRecord[] = [
      createPressRun(8, new Date("2026-06-22T00:00:03.000Z")),
      createPressRun(40, new Date("2026-06-22T00:00:02.000Z")),
      createFailedRun(new Date("2026-06-22T00:00:01.000Z"))
    ];

    const summary = summarizeHistory(runs);

    expect(summary.totalRuns).toBe(3);
    expect(summary.successfulRuns).toBe(2);
    expect(summary.failedRuns).toBe(1);
    expect(summary.bestRun?.awardedType).toBe("Zombie");
    expect(
      summary.standings.find((standing) => standing.type === "Zombie")
        ?.bestSecondsWaited
    ).toBe(52);
  });

  it("limits stored history length", () => {
    const runs = Array.from({ length: 45 }, (_, index) =>
      createPressRun(60 - index, new Date(2026, 5, 22, 0, 0, index))
    );

    expect(trimHistory(runs)).toHaveLength(40);
  });
});
