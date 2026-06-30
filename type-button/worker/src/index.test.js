import { describe, expect, it } from "vitest";
import {
  FINAL_ROUND_ID,
  calculateUltimateWinner,
  createActiveRound,
  createFinaleRound,
  createRoundAfterEnd
} from "./index.js";

describe("Worker finale round transitions", () => {
  it("advances Round 9,999 to final playable Round 10,000", () => {
    const round = createActiveRound(9999, 1_000, null, {
      pressCounts: { Human: 2 }
    });
    const nextRound = createRoundAfterEnd(round, 2_000);

    expect(nextRound.status).toBe("active");
    expect(nextRound.roundId).toBe(FINAL_ROUND_ID);
    expect(nextRound.expiresAt).toBe(2_000 + 60_000);
  });

  it("freezes after Round 10,000 ends instead of creating Round 10,001", () => {
    const round = createActiveRound(FINAL_ROUND_ID, 1_000, null, {
      pressCounts: { Zombie: 7 },
      lastPress: { timestamp: "2026-06-30T00:00:00.000Z" }
    });
    const nextRound = createRoundAfterEnd(round, 2_000);

    expect(nextRound.status).toBe("finale");
    expect(nextRound.roundId).toBe(FINAL_ROUND_ID);
    expect(nextRound.expiresAt).toBeNull();
  });

  it("normalizes explicit finale rounds to the final round id", () => {
    const finale = createFinaleRound({
      status: "active",
      roundId: FINAL_ROUND_ID + 5,
      pressCounts: { Agent: 3 }
    });

    expect(finale.status).toBe("finale");
    expect(finale.roundId).toBe(FINAL_ROUND_ID);
    expect(finale.pressCounts.Agent).toBe(3);
  });
});

describe("Worker ultimate winner calculation", () => {
  it("returns a single winner", () => {
    expect(
      calculateUltimateWinner({
        Human: 2,
        Cat: 3,
        Alien: 1,
        Agent: 0,
        Zombie: 9
      })
    ).toEqual({
      winners: ["Zombie"],
      winningCount: 9,
      isTie: false
    });
  });

  it("returns co-winners for ties", () => {
    expect(
      calculateUltimateWinner({
        Human: 4,
        Cat: 4,
        Alien: 1,
        Agent: 0,
        Zombie: 2
      })
    ).toEqual({
      winners: ["Human", "Cat"],
      winningCount: 4,
      isTie: true
    });
  });

  it("returns no winner when nobody pressed", () => {
    expect(calculateUltimateWinner({})).toEqual({
      winners: [],
      winningCount: 0,
      isTie: false
    });
  });
});
