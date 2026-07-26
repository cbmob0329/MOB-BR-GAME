/**
 * MOB BR strategy master data.
 *
 * All 50 strategies are carried into tournaments. D strategies are unlimited;
 * C through SS use tournament-local remaining counts based on persistent owned
 * quantities. Persistent inventory is not consumed by tournament use.
 */

import { STAT_IDS } from "./game-data.js";

export const STRATEGY_DATA_VERSION = "mobbr-strategy-data-1.0.0";
export const STRATEGY_MASTER_VERSION = "mobbr-strategy-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const STRATEGY_RANKS = deepFreeze(["D", "C", "B", "A", "S", "SS"]);
export const STRATEGY_RANK_ICONS = deepFreeze({
  D: "icon/takd.png",
  C: "icon/takc.png",
  B: "icon/takb.png",
  A: "icon/taka.png",
  S: "icon/taks.png",
  SS: "icon/takss.png",
});

export const STRATEGY_RULES = deepFreeze({
  totalCount: 50,
  initialStrategyIds: ["D-01", "D-02", "D-03", "D-04", "D-05"],
  noEquipmentSlots: true,
  carryAllOwnedStrategies: true,
  consumeAt: "battle_start",
  doNotConsumeAtSelection: true,
  persistentInventoryConsumedByTournament: false,
  fallbackStrategyId: "D-01",
  battleHudPersistentNameVisible: false,
  rankTabs: ["ALL", "D", "C", "B", "A", "S", "SS"],
  firstHitRule: {
    strategyId: "C-11",
    consumeEffectOnlyAfterFirstSuccessfulHit: true,
    missDoesNotConsumeEffect: true,
  },
});

export const STRATEGIES = deepFreeze([
  {
    "id": "D-01",
    "rank": "D",
    "name": "バランスを大事に",
    "description": "能力・距離性能への影響なし。",
    "usageMode": "unlimited",
    "effect": {
      "type": "none"
    },
    "icon": "icon/takd.png"
  },
  {
    "id": "D-02",
    "rank": "D",
    "name": "遠距離で削ろう",
    "description": "遠距離で与えるダメージ+5%。",
    "usageMode": "unlimited",
    "effect": {
      "type": "rangeDamage",
      "range": "far",
      "value": 0.05
    },
    "icon": "icon/takd.png"
  },
  {
    "id": "D-03",
    "rank": "D",
    "name": "中距離で勝負しよう",
    "description": "中距離で与えるダメージ+5%。",
    "usageMode": "unlimited",
    "effect": {
      "type": "rangeDamage",
      "range": "mid",
      "value": 0.05
    },
    "icon": "icon/takd.png"
  },
  {
    "id": "D-04",
    "rank": "D",
    "name": "近距離で勝負しよう",
    "description": "近距離で与えるダメージ+5%。",
    "usageMode": "unlimited",
    "effect": {
      "type": "rangeDamage",
      "range": "close",
      "value": 0.05
    },
    "icon": "icon/takd.png"
  },
  {
    "id": "D-05",
    "rank": "D",
    "name": "足並みをそろえよう",
    "description": "メンバー全員のサポート+1。",
    "usageMode": "unlimited",
    "effect": {
      "type": "stats",
      "stats": {
        "support": 1
      }
    },
    "icon": "icon/takd.png"
  },
  {
    "id": "C-01",
    "rank": "C",
    "name": "インファイトで勝負だ",
    "description": "近距離で与えるダメージ+8%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "close",
      "value": 0.08
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-02",
    "rank": "C",
    "name": "射線を広く使おう",
    "description": "遠距離で与えるダメージ+8%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "far",
      "value": 0.08
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-03",
    "rank": "C",
    "name": "中距離を保とう",
    "description": "中距離で与えるダメージ+8%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "mid",
      "value": 0.08
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-04",
    "rank": "C",
    "name": "エイムに自信を持て",
    "description": "メンバー全員のエイム+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-05",
    "rank": "C",
    "name": "冷静さを忘れるな",
    "description": "メンバー全員のマインド+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-06",
    "rank": "C",
    "name": "足を止めるな",
    "description": "メンバー全員のアジリティ+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "agility": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-07",
    "rank": "C",
    "name": "基本を丁寧に",
    "description": "メンバー全員のテクニック+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "technique": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-08",
    "rank": "C",
    "name": "当たり負けするな",
    "description": "メンバー全員のフィジカル+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "physical": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-09",
    "rank": "C",
    "name": "最後まで走り切れ",
    "description": "メンバー全員のスタミナ+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "stamina": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-10",
    "rank": "C",
    "name": "仲間の動きを見よう",
    "description": "メンバー全員のサポート+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "support": 2
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-11",
    "rank": "C",
    "name": "先手を取ろう",
    "description": "味方の最初の攻撃が命中するまで全距離ダメージ+6%。命中した最初の攻撃にも適用。",
    "usageMode": "inventory",
    "effect": {
      "type": "firstHitDamage",
      "value": 0.06
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-12",
    "rank": "C",
    "name": "一度落ち着こう",
    "description": "メンバー全員のマインド+1、サポート+1。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 1,
        "support": 1
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "C-13",
    "rank": "C",
    "name": "体勢を整えよう",
    "description": "メンバー全員のスタミナ+1、フィジカル+1。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "stamina": 1,
        "physical": 1
      }
    },
    "icon": "icon/takc.png"
  },
  {
    "id": "B-01",
    "rank": "B",
    "name": "遠距離で仕留めよう",
    "description": "遠距離で与えるダメージ+10%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "far",
      "value": 0.1
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-02",
    "rank": "B",
    "name": "スピードで翻弄しよう",
    "description": "メンバー全員のアジリティ+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "agility": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-03",
    "rank": "B",
    "name": "一気に距離を詰めろ",
    "description": "近距離で与えるダメージ+10%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "close",
      "value": 0.1
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-04",
    "rank": "B",
    "name": "中距離を支配しよう",
    "description": "中距離で与えるダメージ+10%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "mid",
      "value": 0.1
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-05",
    "rank": "B",
    "name": "一発一発を正確に",
    "description": "メンバー全員のエイム+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-06",
    "rank": "B",
    "name": "プレッシャーに負けるな",
    "description": "メンバー全員のマインド+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-07",
    "rank": "B",
    "name": "相手の動きを読み切れ",
    "description": "メンバー全員のテクニック+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "technique": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-08",
    "rank": "B",
    "name": "力で押し切ろう",
    "description": "メンバー全員のフィジカル+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "physical": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-09",
    "rank": "B",
    "name": "三人で一つだ",
    "description": "メンバー全員のサポート+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "support": 3
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-10",
    "rank": "B",
    "name": "攻守を素早く切り替えろ",
    "description": "メンバー全員のアジリティ+2、サポート+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "agility": 2,
        "support": 2
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "B-11",
    "rank": "B",
    "name": "相手の射線を切れ",
    "description": "メンバー全員のマインド+2、アジリティ+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 2,
        "agility": 2
      }
    },
    "icon": "icon/takb.png"
  },
  {
    "id": "A-01",
    "rank": "A",
    "name": "中距離こそ至高の距離",
    "description": "中距離で与えるダメージ+12%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "mid",
      "value": 0.12
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-02",
    "rank": "A",
    "name": "お前たちは強い",
    "description": "メンバー全員のマインド+4。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 4
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-03",
    "rank": "A",
    "name": "懐まで潜り込め",
    "description": "近距離で与えるダメージ+12%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "close",
      "value": 0.12
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-04",
    "rank": "A",
    "name": "射程外から制圧しろ",
    "description": "遠距離で与えるダメージ+12%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "far",
      "value": 0.12
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-05",
    "rank": "A",
    "name": "狙った敵は逃がすな",
    "description": "メンバー全員のエイム+4。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 4
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-06",
    "rank": "A",
    "name": "完璧な連携を見せろ",
    "description": "メンバー全員のサポート+4。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "support": 4
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-07",
    "rank": "A",
    "name": "戦場のすべてを見抜け",
    "description": "メンバー全員のテクニック+4。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "technique": 4
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-08",
    "rank": "A",
    "name": "攻撃の主導権を握れ",
    "description": "メンバー全員のエイム+2、アジリティ+2、テクニック+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 2,
        "agility": 2,
        "technique": 2
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "A-09",
    "rank": "A",
    "name": "守りから流れを作れ",
    "description": "メンバー全員のスタミナ+2、フィジカル+2、サポート+2。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "stamina": 2,
        "physical": 2,
        "support": 2
      }
    },
    "icon": "icon/taka.png"
  },
  {
    "id": "S-01",
    "rank": "S",
    "name": "スナイパーの心得",
    "description": "遠距離で与えるダメージ+15%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "far",
      "value": 0.15
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-02",
    "rank": "S",
    "name": "ヘッドショットマスターズ",
    "description": "メンバー全員のエイム+3、テクニック+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 3,
        "technique": 3
      }
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-03",
    "rank": "S",
    "name": "至近距離を制圧せよ",
    "description": "近距離で与えるダメージ+15%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "close",
      "value": 0.15
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-04",
    "rank": "S",
    "name": "中距離の王者たち",
    "description": "中距離で与えるダメージ+15%。",
    "usageMode": "inventory",
    "effect": {
      "type": "rangeDamage",
      "range": "mid",
      "value": 0.15
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-05",
    "rank": "S",
    "name": "攻撃の手を緩めるな",
    "description": "メンバー全員のスタミナ+3、エイム+3、アジリティ+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "stamina": 3,
        "aim": 3,
        "agility": 3
      }
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-06",
    "rank": "S",
    "name": "最後まで心を折るな",
    "description": "メンバー全員のマインド+3、フィジカル+3、サポート+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 3,
        "physical": 3,
        "support": 3
      }
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "S-07",
    "rank": "S",
    "name": "三人で戦場を制圧しろ",
    "description": "メンバー全員のエイム+3、テクニック+3、サポート+3。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 3,
        "technique": 3,
        "support": 3
      }
    },
    "icon": "icon/taks.png"
  },
  {
    "id": "SS-01",
    "rank": "SS",
    "name": "チャンピオンムーブ",
    "description": "メンバー全員の全7能力+5。",
    "usageMode": "inventory",
    "effect": {
      "type": "allStats",
      "value": 5
    },
    "icon": "icon/takss.png"
  },
  {
    "id": "SS-02",
    "rank": "SS",
    "name": "すべての距離を支配しろ",
    "description": "近・中・遠距離で与えるダメージ+10%。",
    "usageMode": "inventory",
    "effect": {
      "type": "allRangeDamage",
      "value": 0.1
    },
    "icon": "icon/takss.png"
  },
  {
    "id": "SS-03",
    "rank": "SS",
    "name": "世界に実力を見せつけろ",
    "description": "メンバー全員のエイム+6、アジリティ+6、テクニック+6。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "aim": 6,
        "agility": 6,
        "technique": 6
      }
    },
    "icon": "icon/takss.png"
  },
  {
    "id": "SS-04",
    "rank": "SS",
    "name": "最後に立つのは俺たちだ",
    "description": "メンバー全員のスタミナ+6、マインド+6、フィジカル+6、サポート+6。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "stamina": 6,
        "mind": 6,
        "physical": 6,
        "support": 6
      }
    },
    "icon": "icon/takss.png"
  },
  {
    "id": "SS-05",
    "rank": "SS",
    "name": "完全無欠のフォーメーション",
    "description": "メンバー全員のマインド+5、テクニック+5、サポート+5。",
    "usageMode": "inventory",
    "effect": {
      "type": "stats",
      "stats": {
        "mind": 5,
        "technique": 5,
        "support": 5
      }
    },
    "icon": "icon/takss.png"
  }
]);

const strategyById = new Map(
  STRATEGIES.map((strategy) => [strategy.id, strategy]),
);

export function getStrategy(strategyId) {
  const strategy = strategyById.get(strategyId);
  if (!strategy) {
    throw new RangeError(`Unknown strategy: ${strategyId}`);
  }
  return strategy;
}

export function getStrategiesByRank(rank) {
  if (!STRATEGY_RANKS.includes(rank)) {
    throw new RangeError(`Unknown strategy rank: ${rank}`);
  }
  return Object.freeze(
    STRATEGIES.filter((strategy) => strategy.rank === rank),
  );
}

export function createTournamentStrategyRuntime(persistentInventory) {
  if (!persistentInventory || typeof persistentInventory !== "object") {
    throw new TypeError("Persistent strategy inventory must be an object.");
  }

  return Object.freeze(
    Object.fromEntries(
      STRATEGIES.map((strategy) => {
        const ownedCount =
          strategy.rank === "D"
            ? 1
            : persistentInventory[strategy.id] ?? 0;
        if (!Number.isInteger(ownedCount) || ownedCount < 0) {
          throw new RangeError(`Invalid owned count for ${strategy.id}.`);
        }

        return [
          strategy.id,
          Object.freeze({
            strategyId: strategy.id,
            unlimited: strategy.rank === "D",
            persistentOwnedCount: ownedCount,
            tournamentRemaining:
              strategy.rank === "D" ? null : ownedCount,
          }),
        ];
      }),
    ),
  );
}

export function resolveSelectableStrategy(
  requestedStrategyId,
  tournamentRuntime,
) {
  const fallback = getStrategy(STRATEGY_RULES.fallbackStrategyId);
  if (!strategyById.has(requestedStrategyId)) {
    return fallback;
  }
  const requested = getStrategy(requestedStrategyId);
  if (requested.rank === "D") {
    return requested;
  }

  const runtimeEntry = tournamentRuntime?.[requested.id];
  if (
    !runtimeEntry ||
    !Number.isInteger(runtimeEntry.tournamentRemaining) ||
    runtimeEntry.tournamentRemaining <= 0
  ) {
    return fallback;
  }

  return requested;
}

export function validateStrategyMaster() {
  if (STRATEGIES.length !== STRATEGY_RULES.totalCount) {
    throw new Error("Strategy master must contain exactly 50 strategies.");
  }

  const ids = new Set();
  const expectedCounts = { D: 5, C: 13, B: 11, A: 9, S: 7, SS: 5 };
  const actualCounts = Object.fromEntries(
    STRATEGY_RANKS.map((rank) => [rank, 0]),
  );

  for (const strategy of STRATEGIES) {
    if (ids.has(strategy.id)) {
      throw new Error(`Duplicate strategy ID: ${strategy.id}`);
    }
    ids.add(strategy.id);
    actualCounts[strategy.rank] += 1;

    if (strategy.usageMode !== (strategy.rank === "D" ? "unlimited" : "inventory")) {
      throw new Error(`Invalid usage mode: ${strategy.id}`);
    }

    if (strategy.effect.type === "stats") {
      for (const [statId, value] of Object.entries(strategy.effect.stats)) {
        if (!STAT_IDS.includes(statId) || !Number.isFinite(value)) {
          throw new Error(`Invalid stat effect: ${strategy.id}/${statId}`);
        }
      }
    }
  }

  for (const rank of STRATEGY_RANKS) {
    if (actualCounts[rank] !== expectedCounts[rank]) {
      throw new Error(
        `Invalid strategy count for ${rank}: ${actualCounts[rank]}`,
      );
    }
  }

  return Object.freeze({
    totalCount: STRATEGIES.length,
    countsByRank: Object.freeze(actualCounts),
    valid: true,
  });
}
