/**
 * MOB BR player growth, weapon-upgrade, and special-ability master data.
 *
 * Source:
 * - MOB BR 完全指示書 第1部: 7能力強化・武器強化
 * - MOB BR 完全指示書 第2部: 青100段階・金35・赤20
 */

import {
  STAT_IDS,
  TRAINING_POINT_IDS,
  characterValueToRank,
} from "./game-data.js";

export const ABILITY_DATA_VERSION = "mobbr-ability-data-1.0.0";
export const SPECIAL_ABILITY_MASTER_VERSION =
  "mobbr-special-ability-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const PLAYER_STAT_DEFINITIONS = deepFreeze([
  {
    id: "stamina",
    name: "STAMINA",
    displayName: "スタミナ",
    icon: "icon/sta.png",
    primaryPoint: "power",
    secondaryPoint: "mental",
  },
  {
    id: "mind",
    name: "MIND",
    displayName: "マインド",
    icon: "icon/mind.png",
    primaryPoint: "mental",
    secondaryPoint: "tech",
  },
  {
    id: "physical",
    name: "PHYSICAL",
    displayName: "フィジカル",
    icon: "icon/phy.png",
    primaryPoint: "power",
    secondaryPoint: "tech",
  },
  {
    id: "aim",
    name: "AIM",
    displayName: "エイム",
    icon: "icon/aim.png",
    primaryPoint: "shoot",
    secondaryPoint: "mental",
  },
  {
    id: "agility",
    name: "AGILITY",
    displayName: "アジリティ",
    icon: "icon/agi.png",
    primaryPoint: "tech",
    secondaryPoint: "power",
  },
  {
    id: "technique",
    name: "TECHNIQUE",
    displayName: "テクニック",
    icon: "icon/teq.png",
    primaryPoint: "tech",
    secondaryPoint: "shoot",
  },
  {
    id: "support",
    name: "SUPPORT",
    displayName: "サポート",
    icon: "icon/sup.png",
    primaryPoint: "mental",
    secondaryPoint: "shoot",
  },
]);

export const STAT_UPGRADE_COSTS = deepFreeze({
  F: { primary: 5, secondary: 3 },
  E: { primary: 10, secondary: 5 },
  D: { primary: 18, secondary: 9 },
  C: { primary: 30, secondary: 15 },
  B: { primary: 48, secondary: 24 },
  A: { primary: 75, secondary: 38 },
  S: { primary: 115, secondary: 58 },
  SS: { primary: 170, secondary: 85 },
});

export const WEAPON_STAT_DEFINITIONS = deepFreeze([
  { id: "close", name: "近距離", rankField: "rangeRanks.close" },
  { id: "mid", name: "中距離", rankField: "rangeRanks.mid" },
  { id: "far", name: "遠距離", rankField: "rangeRanks.far" },
  { id: "fireRate", name: "連射", rankField: "fireRateRank" },
  { id: "reload", name: "リロード", rankField: "reloadRank" },
]);

export const WEAPON_UPGRADE_COSTS = deepFreeze(
  [
  {
    "currentRank": "F1",
    "nextRank": "F2",
    "coin": 12500,
    "ruby": 1
  },
  {
    "currentRank": "F2",
    "nextRank": "F3",
    "coin": 15000,
    "ruby": 1
  },
  {
    "currentRank": "F3",
    "nextRank": "F4",
    "coin": 17500,
    "ruby": 1
  },
  {
    "currentRank": "F4",
    "nextRank": "F5",
    "coin": 20000,
    "ruby": 1
  },
  {
    "currentRank": "F5",
    "nextRank": "F6",
    "coin": 22500,
    "ruby": 1
  },
  {
    "currentRank": "F6",
    "nextRank": "F7",
    "coin": 25000,
    "ruby": 1
  },
  {
    "currentRank": "F7",
    "nextRank": "F8",
    "coin": 27500,
    "ruby": 1
  },
  {
    "currentRank": "F8",
    "nextRank": "F9",
    "coin": 30000,
    "ruby": 2
  },
  {
    "currentRank": "F9",
    "nextRank": "E1",
    "coin": 35000,
    "ruby": 2
  },
  {
    "currentRank": "E1",
    "nextRank": "E2",
    "coin": 40000,
    "ruby": 2
  },
  {
    "currentRank": "E2",
    "nextRank": "E3",
    "coin": 45000,
    "ruby": 2
  },
  {
    "currentRank": "E3",
    "nextRank": "E4",
    "coin": 50000,
    "ruby": 2
  },
  {
    "currentRank": "E4",
    "nextRank": "E5",
    "coin": 55000,
    "ruby": 2
  },
  {
    "currentRank": "E5",
    "nextRank": "E6",
    "coin": 60000,
    "ruby": 2
  },
  {
    "currentRank": "E6",
    "nextRank": "E7",
    "coin": 65000,
    "ruby": 2
  },
  {
    "currentRank": "E7",
    "nextRank": "E8",
    "coin": 70000,
    "ruby": 3
  },
  {
    "currentRank": "E8",
    "nextRank": "E9",
    "coin": 75000,
    "ruby": 3
  },
  {
    "currentRank": "E9",
    "nextRank": "D1",
    "coin": 75000,
    "ruby": 3
  },
  {
    "currentRank": "D1",
    "nextRank": "D2",
    "coin": 84000,
    "ruby": 3
  },
  {
    "currentRank": "D2",
    "nextRank": "D3",
    "coin": 93000,
    "ruby": 3
  },
  {
    "currentRank": "D3",
    "nextRank": "D4",
    "coin": 102000,
    "ruby": 3
  },
  {
    "currentRank": "D4",
    "nextRank": "D5",
    "coin": 111000,
    "ruby": 3
  },
  {
    "currentRank": "D5",
    "nextRank": "D6",
    "coin": 120000,
    "ruby": 3
  },
  {
    "currentRank": "D6",
    "nextRank": "D7",
    "coin": 129000,
    "ruby": 4
  },
  {
    "currentRank": "D7",
    "nextRank": "D8",
    "coin": 138000,
    "ruby": 4
  },
  {
    "currentRank": "D8",
    "nextRank": "D9",
    "coin": 147000,
    "ruby": 4
  },
  {
    "currentRank": "D9",
    "nextRank": "C1",
    "coin": 140000,
    "ruby": 4
  },
  {
    "currentRank": "C1",
    "nextRank": "C2",
    "coin": 155000,
    "ruby": 4
  },
  {
    "currentRank": "C2",
    "nextRank": "C3",
    "coin": 170000,
    "ruby": 4
  },
  {
    "currentRank": "C3",
    "nextRank": "C4",
    "coin": 185000,
    "ruby": 4
  },
  {
    "currentRank": "C4",
    "nextRank": "C5",
    "coin": 200000,
    "ruby": 4
  },
  {
    "currentRank": "C5",
    "nextRank": "C6",
    "coin": 215000,
    "ruby": 5
  },
  {
    "currentRank": "C6",
    "nextRank": "C7",
    "coin": 230000,
    "ruby": 5
  },
  {
    "currentRank": "C7",
    "nextRank": "C8",
    "coin": 245000,
    "ruby": 5
  },
  {
    "currentRank": "C8",
    "nextRank": "C9",
    "coin": 260000,
    "ruby": 5
  },
  {
    "currentRank": "C9",
    "nextRank": "B1",
    "coin": 250000,
    "ruby": 5
  },
  {
    "currentRank": "B1",
    "nextRank": "B2",
    "coin": 275000,
    "ruby": 5
  },
  {
    "currentRank": "B2",
    "nextRank": "B3",
    "coin": 300000,
    "ruby": 5
  },
  {
    "currentRank": "B3",
    "nextRank": "B4",
    "coin": 325000,
    "ruby": 5
  },
  {
    "currentRank": "B4",
    "nextRank": "B5",
    "coin": 350000,
    "ruby": 6
  },
  {
    "currentRank": "B5",
    "nextRank": "B6",
    "coin": 375000,
    "ruby": 6
  },
  {
    "currentRank": "B6",
    "nextRank": "B7",
    "coin": 400000,
    "ruby": 6
  },
  {
    "currentRank": "B7",
    "nextRank": "B8",
    "coin": 425000,
    "ruby": 6
  },
  {
    "currentRank": "B8",
    "nextRank": "B9",
    "coin": 450000,
    "ruby": 6
  },
  {
    "currentRank": "B9",
    "nextRank": "A1",
    "coin": 450000,
    "ruby": 6
  },
  {
    "currentRank": "A1",
    "nextRank": "A2",
    "coin": 490000,
    "ruby": 6
  },
  {
    "currentRank": "A2",
    "nextRank": "A3",
    "coin": 530000,
    "ruby": 6
  },
  {
    "currentRank": "A3",
    "nextRank": "A4",
    "coin": 570000,
    "ruby": 7
  },
  {
    "currentRank": "A4",
    "nextRank": "A5",
    "coin": 610000,
    "ruby": 7
  },
  {
    "currentRank": "A5",
    "nextRank": "A6",
    "coin": 650000,
    "ruby": 7
  },
  {
    "currentRank": "A6",
    "nextRank": "A7",
    "coin": 690000,
    "ruby": 7
  },
  {
    "currentRank": "A7",
    "nextRank": "A8",
    "coin": 730000,
    "ruby": 7
  },
  {
    "currentRank": "A8",
    "nextRank": "A9",
    "coin": 770000,
    "ruby": 7
  },
  {
    "currentRank": "A9",
    "nextRank": "S1",
    "coin": 800000,
    "ruby": 7
  },
  {
    "currentRank": "S1",
    "nextRank": "S2",
    "coin": 865000,
    "ruby": 7
  },
  {
    "currentRank": "S2",
    "nextRank": "S3",
    "coin": 930000,
    "ruby": 8
  },
  {
    "currentRank": "S3",
    "nextRank": "S4",
    "coin": 995000,
    "ruby": 8
  },
  {
    "currentRank": "S4",
    "nextRank": "S5",
    "coin": 1060000,
    "ruby": 8
  },
  {
    "currentRank": "S5",
    "nextRank": "S6",
    "coin": 1125000,
    "ruby": 8
  },
  {
    "currentRank": "S6",
    "nextRank": "S7",
    "coin": 1190000,
    "ruby": 8
  },
  {
    "currentRank": "S7",
    "nextRank": "S8",
    "coin": 1255000,
    "ruby": 8
  },
  {
    "currentRank": "S8",
    "nextRank": "S9",
    "coin": 1320000,
    "ruby": 8
  },
  {
    "currentRank": "S9",
    "nextRank": "SS1",
    "coin": 1300000,
    "ruby": 8
  },
  {
    "currentRank": "SS1",
    "nextRank": "SS2",
    "coin": 1400000,
    "ruby": 9
  },
  {
    "currentRank": "SS2",
    "nextRank": "SS3",
    "coin": 1500000,
    "ruby": 9
  },
  {
    "currentRank": "SS3",
    "nextRank": "SS4",
    "coin": 1600000,
    "ruby": 9
  },
  {
    "currentRank": "SS4",
    "nextRank": "SS5",
    "coin": 1700000,
    "ruby": 9
  },
  {
    "currentRank": "SS5",
    "nextRank": "SS6",
    "coin": 1800000,
    "ruby": 9
  },
  {
    "currentRank": "SS6",
    "nextRank": "SS7",
    "coin": 1900000,
    "ruby": 9
  },
  {
    "currentRank": "SS7",
    "nextRank": "SS8",
    "coin": 2000000,
    "ruby": 9
  },
  {
    "currentRank": "SS8",
    "nextRank": "SS9",
    "coin": 2100000,
    "ruby": 9
  },
  {
    "currentRank": "SS9",
    "nextRank": "MOB",
    "coin": 2100000,
    "ruby": 10
  }
]
);

export const BLUE_SPECIAL_ABILITIES = deepFreeze(
  [
  {
    "abilityKey": "blue:c01:1",
    "abilityId": "c01",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "初動集中",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 25,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "戦闘開始から3秒間、エイム+1。",
    "effect": {
      "code": "opening_stats",
      "duration": 3,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c01"
    ]
  },
  {
    "abilityKey": "blue:c01:2",
    "abilityId": "c01",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "初動掌握",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 40,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "戦闘開始から4秒間、エイム+2、マインド+1。",
    "effect": {
      "code": "opening_stats",
      "duration": 4,
      "stats": {
        "aim": 2,
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c01"
    ]
  },
  {
    "abilityKey": "blue:c02:1",
    "abilityId": "c02",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "平常維持",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 60,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から5秒間、マインド+1。",
    "effect": {
      "code": "opening_stats",
      "duration": 5,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c02"
    ]
  },
  {
    "abilityKey": "blue:c02:2",
    "abilityId": "c02",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "平常支配",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から6秒間、マインド+2。効果中に受けるデバフ時間を10%短縮。",
    "effect": {
      "code": "opening_composure",
      "duration": 6,
      "stats": {
        "mind": 2
      },
      "debuffDurationReduction": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c02"
    ]
  },
  {
    "abilityKey": "blue:c03:1",
    "abilityId": "c03",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "先行充填",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 30,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "各戦闘開始時、3スキルの残りCTを0.15秒短縮。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c03"
    ]
  },
  {
    "abilityKey": "blue:c03:2",
    "abilityId": "c03",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "高速充填",
    "cost": {
      "power": 0,
      "tech": 120,
      "mental": 80,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "各戦闘開始時、3スキルの残りCTを0.30秒短縮。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c03"
    ]
  },
  {
    "abilityKey": "blue:c04:1",
    "abilityId": "c04",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "長期設計",
    "cost": {
      "power": 35,
      "tech": 0,
      "mental": 35,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から10秒後、フィジカル+1、マインド+1。",
    "effect": {
      "code": "elapsed_stats",
      "after": 10,
      "stats": {
        "physical": 1,
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c04"
    ]
  },
  {
    "abilityKey": "blue:c04:2",
    "abilityId": "c04",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "持久戦略",
    "cost": {
      "power": 90,
      "tech": 50,
      "mental": 80,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から8秒後、フィジカル+2、マインド+2。",
    "effect": {
      "code": "elapsed_stats",
      "after": 8,
      "stats": {
        "physical": 2,
        "mind": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c04"
    ]
  },
  {
    "abilityKey": "blue:c05:1",
    "abilityId": "c05",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "終盤加速",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 35,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP35%以下の間、アジリティ+1。",
    "effect": {
      "code": "low_hp_stats",
      "hpRate": 0.35,
      "stats": {
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c05"
    ]
  },
  {
    "abilityKey": "blue:c05:2",
    "abilityId": "c05",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "極限加速",
    "cost": {
      "power": 0,
      "tech": 110,
      "mental": 90,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP35%以下の間、アジリティ+2、CT進行速度+3%。",
    "effect": {
      "code": "low_hp_ct_speed",
      "hpRate": 0.35,
      "stats": {
        "agility": 2
      },
      "ctSpeed": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c05"
    ]
  },
  {
    "abilityKey": "blue:c06:1",
    "abilityId": "c06",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "背水照準",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 30,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "HP30%以下の間、エイム+1。",
    "effect": {
      "code": "low_hp_stats",
      "hpRate": 0.3,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c06"
    ]
  },
  {
    "abilityKey": "blue:c06:2",
    "abilityId": "c06",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "極限照準",
    "cost": {
      "power": 0,
      "tech": 50,
      "mental": 70,
      "shoot": 120
    },
    "unlockConditions": [],
    "description": "HP30%以下の間、エイム+2、テクニック+1。",
    "effect": {
      "code": "low_hp_stats",
      "hpRate": 0.3,
      "stats": {
        "aim": 2,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c06"
    ]
  },
  {
    "abilityKey": "blue:c07:1",
    "abilityId": "c07",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "不屈姿勢",
    "cost": {
      "power": 45,
      "tech": 0,
      "mental": 35,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP30%以下の間、被ダメージ-2%。",
    "effect": {
      "code": "low_hp_damage_reduction",
      "hpRate": 0.3,
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c07"
    ]
  },
  {
    "abilityKey": "blue:c07:2",
    "abilityId": "c07",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "不倒闘志",
    "cost": {
      "power": 120,
      "tech": 40,
      "mental": 80,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP30%以下の間、被ダメージ-4%。",
    "effect": {
      "code": "low_hp_damage_reduction",
      "hpRate": 0.3,
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c07"
    ]
  },
  {
    "abilityKey": "blue:c08:1",
    "abilityId": "c08",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "復帰防護",
    "cost": {
      "power": 40,
      "tech": 0,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活後3秒間、被ダメージ-6%。",
    "effect": {
      "code": "revive_guard",
      "duration": 3,
      "rate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c08"
    ]
  },
  {
    "abilityKey": "blue:c08:2",
    "abilityId": "c08",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "再起装甲",
    "cost": {
      "power": 110,
      "tech": 50,
      "mental": 70,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活後4秒間、被ダメージ-10%。",
    "effect": {
      "code": "revive_guard",
      "duration": 4,
      "rate": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c08"
    ]
  },
  {
    "abilityKey": "blue:c09:1",
    "abilityId": "c09",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "戦後整備",
    "cost": {
      "power": 30,
      "tech": 40,
      "mental": 0,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘終了時、最大HPの1%を回復。",
    "effect": {
      "code": "battle_end_recovery",
      "healRate": 0.01
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c09"
    ]
  },
  {
    "abilityKey": "blue:c09:2",
    "abilityId": "c09",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "継戦整備",
    "cost": {
      "power": 80,
      "tech": 100,
      "mental": 30,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘終了時、最大HPの2%を回復し、最長残りCTを0.15秒短縮。",
    "effect": {
      "code": "battle_end_recovery",
      "healRate": 0.02,
      "longestCtReduction": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c09"
    ]
  },
  {
    "abilityKey": "blue:c10:1",
    "abilityId": "c10",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "再戦準備",
    "cost": {
      "power": 0,
      "tech": 30,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "前戦終了時HP50%以下なら、次戦開始から4秒間マインド+1。",
    "effect": {
      "code": "next_battle_if_injured",
      "threshold": 0.5,
      "duration": 4,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c10"
    ]
  },
  {
    "abilityKey": "blue:c10:2",
    "abilityId": "c10",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "再戦適応",
    "cost": {
      "power": 50,
      "tech": 70,
      "mental": 90,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "前戦終了時HP50%以下なら、次戦開始から5秒間マインド+2、被ダメージ-2%。",
    "effect": {
      "code": "next_battle_if_injured",
      "threshold": 0.5,
      "duration": 5,
      "stats": {
        "mind": 2
      },
      "damageReduction": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c10"
    ]
  },
  {
    "abilityKey": "blue:c11:1",
    "abilityId": "c11",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "接近感覚",
    "cost": {
      "power": 30,
      "tech": 0,
      "mental": 0,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "近距離にいる間、エイム+1。",
    "effect": {
      "code": "range_bonus",
      "range": "close",
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c11",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c11"
    ]
  },
  {
    "abilityKey": "blue:c11:2",
    "abilityId": "c11",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "接近支配",
    "cost": {
      "power": 80,
      "tech": 40,
      "mental": 0,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "近距離にいる間、エイム+2、与ダメージ+2%。",
    "effect": {
      "code": "range_bonus",
      "range": "close",
      "stats": {
        "aim": 2
      },
      "damageRate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c11",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c11"
    ]
  },
  {
    "abilityKey": "blue:c12:1",
    "abilityId": "c12",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "中域感覚",
    "cost": {
      "power": 0,
      "tech": 25,
      "mental": 0,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "中距離にいる間、エイム+1。",
    "effect": {
      "code": "range_bonus",
      "range": "mid",
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c12",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c12"
    ]
  },
  {
    "abilityKey": "blue:c12:2",
    "abilityId": "c12",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "中域支配",
    "cost": {
      "power": 0,
      "tech": 100,
      "mental": 20,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "中距離にいる間、エイム+2、テクニック+1。",
    "effect": {
      "code": "range_bonus",
      "range": "mid",
      "stats": {
        "aim": 2,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c12",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c12"
    ]
  },
  {
    "abilityKey": "blue:c13:1",
    "abilityId": "c13",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "遠隔感覚",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 25,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "遠距離にいる間、エイム+1。",
    "effect": {
      "code": "range_bonus",
      "range": "far",
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c13",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c13"
    ]
  },
  {
    "abilityKey": "blue:c13:2",
    "abilityId": "c13",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "遠隔支配",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 70,
      "shoot": 110
    },
    "unlockConditions": [],
    "description": "遠距離にいる間、エイム+2、マインド+1。",
    "effect": {
      "code": "range_bonus",
      "range": "far",
      "stats": {
        "aim": 2,
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c13",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c13"
    ]
  },
  {
    "abilityKey": "blue:c14:1",
    "abilityId": "c14",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "距離適応",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 30,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "距離移動後2秒間、マインド+1。",
    "effect": {
      "code": "after_range_move",
      "duration": 2,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c14",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c14"
    ]
  },
  {
    "abilityKey": "blue:c14:2",
    "abilityId": "c14",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "射程適応",
    "cost": {
      "power": 0,
      "tech": 110,
      "mental": 50,
      "shoot": 60
    },
    "unlockConditions": [],
    "description": "距離移動後3秒間、マインド+2。不得意距離の命中ペナルティを15%軽減。",
    "effect": {
      "code": "after_range_move",
      "duration": 3,
      "stats": {
        "mind": 2
      },
      "offRangePenaltyReduction": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c14",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c14"
    ]
  },
  {
    "abilityKey": "blue:c15:1",
    "abilityId": "c15",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "修正射撃",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 25,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "攻撃を外した場合、次の通常攻撃時にエイム+2。",
    "effect": {
      "code": "after_miss_aim",
      "aim": 2,
      "appliesTo": "normal"
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c15",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c15"
    ]
  },
  {
    "abilityKey": "blue:c15:2",
    "abilityId": "c15",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "照準補正",
    "cost": {
      "power": 0,
      "tech": 70,
      "mental": 40,
      "shoot": 110
    },
    "unlockConditions": [],
    "description": "攻撃を外した場合、次の通常攻撃または攻撃スキル時にエイム+3。",
    "effect": {
      "code": "after_miss_aim",
      "aim": 3,
      "appliesTo": "all_attack"
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c15",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c15"
    ]
  },
  {
    "abilityKey": "blue:c16:1",
    "abilityId": "c16",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "安定射撃",
    "cost": {
      "power": 0,
      "tech": 25,
      "mental": 0,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "3回連続命中で3秒間、エイム+1。",
    "effect": {
      "code": "hit_streak",
      "hits": 3,
      "duration": 3,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c16",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c16"
    ]
  },
  {
    "abilityKey": "blue:c16:2",
    "abilityId": "c16",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "精密射撃",
    "cost": {
      "power": 0,
      "tech": 80,
      "mental": 30,
      "shoot": 120
    },
    "unlockConditions": [],
    "description": "3回連続命中で4秒間、エイム+2。",
    "effect": {
      "code": "hit_streak",
      "hits": 3,
      "duration": 4,
      "stats": {
        "aim": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c16",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c16"
    ]
  },
  {
    "abilityKey": "blue:c17:1",
    "abilityId": "c17",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "弱点観察",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 0,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "HP50%以下の敵への与ダメージ+2%。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.5,
          "rate": 0.02
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c17",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c17"
    ]
  },
  {
    "abilityKey": "blue:c17:2",
    "abilityId": "c17",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "弱点解析",
    "cost": {
      "power": 0,
      "tech": 100,
      "mental": 30,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "HP50%以下の敵へ+3%、HP25%以下なら+5%。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.5,
          "rate": 0.03
        },
        {
          "hpRate": 0.25,
          "rate": 0.05
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c17",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c17"
    ]
  },
  {
    "abilityKey": "blue:c18:1",
    "abilityId": "c18",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "連携射線",
    "cost": {
      "power": 0,
      "tech": 45,
      "mental": 0,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "味方の攻撃後2秒以内に同じ敵を攻撃すると与ダメージ+2%。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2,
      "damageRate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c18",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c18"
    ]
  },
  {
    "abilityKey": "blue:c18:2",
    "abilityId": "c18",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "交差射線",
    "cost": {
      "power": 0,
      "tech": 110,
      "mental": 40,
      "shoot": 80
    },
    "unlockConditions": [],
    "description": "同条件で与ダメージ+4%、同じ敵を選ぶ優先度+15%。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2,
      "damageRate": 0.04,
      "targetPriority": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c18",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c18"
    ]
  },
  {
    "abilityKey": "blue:c19:1",
    "abilityId": "c19",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "状態耐性",
    "cost": {
      "power": 0,
      "tech": 30,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "受けるデバフ時間-8%。",
    "effect": {
      "code": "debuff_resist",
      "durationReduction": 0.08
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c19",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c19"
    ]
  },
  {
    "abilityKey": "blue:c19:2",
    "abilityId": "c19",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "状態制御",
    "cost": {
      "power": 30,
      "tech": 100,
      "mental": 110,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "受けるデバフ時間-15%、デバフ数値効果を10%軽減。",
    "effect": {
      "code": "debuff_resist",
      "durationReduction": 0.15,
      "valueReduction": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c19",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c19"
    ]
  },
  {
    "abilityKey": "blue:c20:1",
    "abilityId": "c20",
    "color": "blue",
    "target": "COMMON",
    "stage": 1,
    "name": "防護循環",
    "cost": {
      "power": 30,
      "tech": 45,
      "mental": 0,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "シールドチャージの回復量+1pt、基本CT-0.10秒。",
    "effect": {
      "code": "shield_charge_boost",
      "healPoint": 1,
      "baseCtReduction": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c20",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c20"
    ]
  },
  {
    "abilityKey": "blue:c20:2",
    "abilityId": "c20",
    "color": "blue",
    "target": "COMMON",
    "stage": 2,
    "name": "装甲循環",
    "cost": {
      "power": 80,
      "tech": 110,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "回復量+2pt、基本CT-0.20秒。",
    "effect": {
      "code": "shield_charge_boost",
      "healPoint": 2,
      "baseCtReduction": 0.2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_c20",
    "commentaryTags": [
      "special_ability",
      "blue",
      "c20"
    ]
  },
  {
    "abilityKey": "blue:i01:1",
    "abilityId": "i01",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "号令強化",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "コールのエイム上昇量+1。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i01"
    ]
  },
  {
    "abilityKey": "blue:i01:2",
    "abilityId": "i01",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "号令統率",
    "cost": {
      "power": 0,
      "tech": 90,
      "mental": 120,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "コールのエイムとマインド上昇量+1。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "aim": 1,
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i01"
    ]
  },
  {
    "abilityKey": "blue:i02:1",
    "abilityId": "i02",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "指揮持続",
    "cost": {
      "power": 0,
      "tech": 45,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "コールの持続時間+0.30秒。",
    "effect": {
      "code": "call_duration",
      "seconds": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i02"
    ]
  },
  {
    "abilityKey": "blue:i02:2",
    "abilityId": "i02",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "指揮掌握",
    "cost": {
      "power": 0,
      "tech": 110,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "コールの持続時間+0.60秒。",
    "effect": {
      "code": "call_duration",
      "seconds": 0.6
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i02"
    ]
  },
  {
    "abilityKey": "blue:i03:1",
    "abilityId": "i03",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "開幕指示",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "各戦闘開始時、コール残りCT-0.25秒。",
    "effect": {
      "code": "battle_start_skill_ct",
      "skillId": "igl_battle_call",
      "seconds": 0.25
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i03"
    ]
  },
  {
    "abilityKey": "blue:i03:2",
    "abilityId": "i03",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "開幕統率",
    "cost": {
      "power": 0,
      "tech": 130,
      "mental": 100,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "各戦闘開始時、コール残りCT-0.50秒。",
    "effect": {
      "code": "battle_start_skill_ct",
      "skillId": "igl_battle_call",
      "seconds": 0.5
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i03"
    ]
  },
  {
    "abilityKey": "blue:i04:1",
    "abilityId": "i04",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "緊急号令",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 60,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP40%以下の味方がいる時、コールのマインド上昇量+1。",
    "effect": {
      "code": "call_if_ally_low",
      "hpRate": 0.4,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i04"
    ]
  },
  {
    "abilityKey": "blue:i04:2",
    "abilityId": "i04",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "逆境指揮",
    "cost": {
      "power": 40,
      "tech": 90,
      "mental": 130,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "同条件でコールのエイム・マインド+1、効果中の味方被ダメージ-2%。",
    "effect": {
      "code": "call_if_ally_low",
      "hpRate": 0.4,
      "stats": {
        "aim": 1,
        "mind": 1
      },
      "damageReduction": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i04"
    ]
  },
  {
    "abilityKey": "blue:i05:1",
    "abilityId": "i05",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "射線共有",
    "cost": {
      "power": 0,
      "tech": 0,
      "mental": 50,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "コール効果中、味方全体のエイム+1。",
    "effect": {
      "code": "during_call_stats",
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i05"
    ]
  },
  {
    "abilityKey": "blue:i05:2",
    "abilityId": "i05",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "射線統制",
    "cost": {
      "power": 0,
      "tech": 50,
      "mental": 100,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "コール効果中、味方全体のエイム+1、テクニック+1。",
    "effect": {
      "code": "during_call_stats",
      "stats": {
        "aim": 1,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i05"
    ]
  },
  {
    "abilityKey": "blue:i06:1",
    "abilityId": "i06",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "目標指定",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "IGL攻撃スキル命中後3秒間、同じ敵を狙う優先度+20%。",
    "effect": {
      "code": "mark_target",
      "duration": 3,
      "targetPriority": 0.2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i06"
    ]
  },
  {
    "abilityKey": "blue:i06:2",
    "abilityId": "i06",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "目標固定",
    "cost": {
      "power": 0,
      "tech": 130,
      "mental": 90,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "優先度+35%、指定対象への味方全体与ダメージ+3%。",
    "effect": {
      "code": "mark_target",
      "duration": 3,
      "targetPriority": 0.35,
      "teamDamageRate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i06"
    ]
  },
  {
    "abilityKey": "blue:i07:1",
    "abilityId": "i07",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "戦線再編",
    "cost": {
      "power": 0,
      "tech": 45,
      "mental": 55,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "味方ダウン時、コール残りCT-0.30秒。1戦闘1回。",
    "effect": {
      "code": "ally_down_call_ct",
      "seconds": 0.3,
      "limitPerBattle": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i07"
    ]
  },
  {
    "abilityKey": "blue:i07:2",
    "abilityId": "i07",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "戦線再生",
    "cost": {
      "power": 30,
      "tech": 110,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "味方ダウン時、コール残りCT-0.60秒、自身マインド+1を3秒。1戦闘1回。",
    "effect": {
      "code": "ally_down_call_ct",
      "seconds": 0.6,
      "selfStats": {
        "mind": 1
      },
      "duration": 3,
      "limitPerBattle": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i07"
    ]
  },
  {
    "abilityKey": "blue:i08:1",
    "abilityId": "i08",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "被害整理",
    "cost": {
      "power": 45,
      "tech": 0,
      "mental": 55,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から3秒間、味方全体の被ダメージ-2%。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 3,
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i08"
    ]
  },
  {
    "abilityKey": "blue:i08:2",
    "abilityId": "i08",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "被害統制",
    "cost": {
      "power": 100,
      "tech": 40,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "戦闘開始から4秒間、味方全体の被ダメージ-3%。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 4,
      "rate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i08"
    ]
  },
  {
    "abilityKey": "blue:i09:1",
    "abilityId": "i09",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "再起指揮",
    "cost": {
      "power": 0,
      "tech": 45,
      "mental": 60,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "味方復活時、味方全体のマインド+1を3秒。",
    "effect": {
      "code": "ally_revived_team_stats",
      "duration": 3,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i09"
    ]
  },
  {
    "abilityKey": "blue:i09:2",
    "abilityId": "i09",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "再起統率",
    "cost": {
      "power": 40,
      "tech": 100,
      "mental": 130,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "味方復活時、味方全体のマインド+2、アジリティ+1を4秒。",
    "effect": {
      "code": "ally_revived_team_stats",
      "duration": 4,
      "stats": {
        "mind": 2,
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i09"
    ]
  },
  {
    "abilityKey": "blue:i10:1",
    "abilityId": "i10",
    "color": "blue",
    "target": "IGL",
    "stage": 1,
    "name": "冷静判断",
    "cost": {
      "power": 0,
      "tech": 50,
      "mental": 60,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "対象選択反応-0.20秒、低HP敵の優先度+15%。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.2,
      "lowHpTargetPriority": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i10"
    ]
  },
  {
    "abilityKey": "blue:i10:2",
    "abilityId": "i10",
    "color": "blue",
    "target": "IGL",
    "stage": 2,
    "name": "戦況掌握",
    "cost": {
      "power": 0,
      "tech": 120,
      "mental": 130,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "対象選択反応-0.40秒、低HP敵の優先度+30%。残り1秒以上のコールを重ねない。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.4,
      "lowHpTargetPriority": 0.3,
      "avoidBuffOverwriteSeconds": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_i10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "i10"
    ]
  },
  {
    "abilityKey": "blue:a01:1",
    "abilityId": "a01",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "火力集中",
    "cost": {
      "power": 55,
      "tech": 40,
      "mental": 0,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "攻撃スキルの与ダメージ+2%。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a01"
    ]
  },
  {
    "abilityKey": "blue:a01:2",
    "abilityId": "a01",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "火力支配",
    "cost": {
      "power": 120,
      "tech": 100,
      "mental": 0,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "攻撃スキルの与ダメージ+4%。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a01"
    ]
  },
  {
    "abilityKey": "blue:a02:1",
    "abilityId": "a02",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "単体強撃",
    "cost": {
      "power": 60,
      "tech": 0,
      "mental": 0,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "単体攻撃スキルの与ダメージ+3%。",
    "effect": {
      "code": "single_skill_damage",
      "rate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a02"
    ]
  },
  {
    "abilityKey": "blue:a02:2",
    "abilityId": "a02",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "単体破砕",
    "cost": {
      "power": 140,
      "tech": 80,
      "mental": 0,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "単体攻撃スキルの与ダメージ+6%。",
    "effect": {
      "code": "single_skill_damage",
      "rate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a02"
    ]
  },
  {
    "abilityKey": "blue:a03:1",
    "abilityId": "a03",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "全域砲撃",
    "cost": {
      "power": 55,
      "tech": 45,
      "mental": 0,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "全体攻撃スキルの与ダメージ+2%。",
    "effect": {
      "code": "area_skill_damage",
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a03"
    ]
  },
  {
    "abilityKey": "blue:a03:2",
    "abilityId": "a03",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "全域制圧",
    "cost": {
      "power": 120,
      "tech": 110,
      "mental": 0,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "全体攻撃スキルの与ダメージ+4%。",
    "effect": {
      "code": "area_skill_damage",
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a03"
    ]
  },
  {
    "abilityKey": "blue:a04:1",
    "abilityId": "a04",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "精密攻撃",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 0,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中率+3pt。",
    "effect": {
      "code": "attack_skill_accuracy",
      "points": 3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a04"
    ]
  },
  {
    "abilityKey": "blue:a04:2",
    "abilityId": "a04",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "必中照準",
    "cost": {
      "power": 0,
      "tech": 90,
      "mental": 30,
      "shoot": 130
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中率+6pt。",
    "effect": {
      "code": "attack_skill_accuracy",
      "points": 6
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a04"
    ]
  },
  {
    "abilityKey": "blue:a05:1",
    "abilityId": "a05",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "弱点狙撃",
    "cost": {
      "power": 0,
      "tech": 45,
      "mental": 0,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "HP50%以下の敵への与ダメージ+2%。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.5,
          "rate": 0.02
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a05"
    ]
  },
  {
    "abilityKey": "blue:a05:2",
    "abilityId": "a05",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "弱点破砕",
    "cost": {
      "power": 40,
      "tech": 100,
      "mental": 0,
      "shoot": 120
    },
    "unlockConditions": [],
    "description": "HP50%以下の敵への与ダメージ+4%。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.5,
          "rate": 0.04
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a05"
    ]
  },
  {
    "abilityKey": "blue:a06:1",
    "abilityId": "a06",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "追撃判断",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 0,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "味方攻撃後2秒以内に同じ敵を攻撃すると与ダメージ+2%。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2,
      "damageRate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a06"
    ]
  },
  {
    "abilityKey": "blue:a06:2",
    "abilityId": "a06",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "追撃本能",
    "cost": {
      "power": 0,
      "tech": 120,
      "mental": 40,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "同条件で与ダメージ+4%、同じ敵を狙う優先度+15%。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2,
      "damageRate": 0.04,
      "targetPriority": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a06"
    ]
  },
  {
    "abilityKey": "blue:a07:1",
    "abilityId": "a07",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "決着火力",
    "cost": {
      "power": 55,
      "tech": 0,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "敵生存者が残り1人の時、与ダメージ+3%。",
    "effect": {
      "code": "last_enemy_damage",
      "rate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a07"
    ]
  },
  {
    "abilityKey": "blue:a07:2",
    "abilityId": "a07",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "決着破砕",
    "cost": {
      "power": 130,
      "tech": 0,
      "mental": 40,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "敵生存者が残り1人の時、与ダメージ+6%。",
    "effect": {
      "code": "last_enemy_damage",
      "rate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a07"
    ]
  },
  {
    "abilityKey": "blue:a08:1",
    "abilityId": "a08",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "煙幕強化",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "スモークの命中低下成功率+5pt、持続+0.30秒。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 5,
      "duration": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a08"
    ]
  },
  {
    "abilityKey": "blue:a08:2",
    "abilityId": "a08",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "煙幕支配",
    "cost": {
      "power": 0,
      "tech": 130,
      "mental": 100,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "成功率+10pt、持続+0.70秒。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 10,
      "duration": 0.7
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a08"
    ]
  },
  {
    "abilityKey": "blue:a09:1",
    "abilityId": "a09",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "攻勢維持",
    "cost": {
      "power": 50,
      "tech": 0,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP70%以上の間、与ダメージ+2%。",
    "effect": {
      "code": "high_hp_offense",
      "hpRate": 0.7,
      "damageRate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a09"
    ]
  },
  {
    "abilityKey": "blue:a09:2",
    "abilityId": "a09",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "攻勢支配",
    "cost": {
      "power": 120,
      "tech": 0,
      "mental": 90,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "HP70%以上の間、与ダメージ+3%、エイム+1。",
    "effect": {
      "code": "high_hp_offense",
      "hpRate": 0.7,
      "damageRate": 0.03,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a09"
    ]
  },
  {
    "abilityKey": "blue:a10:1",
    "abilityId": "a10",
    "color": "blue",
    "target": "ATK",
    "stage": 1,
    "name": "装甲貫通",
    "cost": {
      "power": 60,
      "tech": 50,
      "mental": 0,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "敵のダメージ軽減を2%分無視。",
    "effect": {
      "code": "damage_reduction_pierce",
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a10"
    ]
  },
  {
    "abilityKey": "blue:a10:2",
    "abilityId": "a10",
    "color": "blue",
    "target": "ATK",
    "stage": 2,
    "name": "防護破砕",
    "cost": {
      "power": 130,
      "tech": 120,
      "mental": 0,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "敵のダメージ軽減を4%分無視。",
    "effect": {
      "code": "damage_reduction_pierce",
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_a10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "a10"
    ]
  },
  {
    "abilityKey": "blue:s01:1",
    "abilityId": "s01",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "回復出力",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "自身が行う回復量+1pt。",
    "effect": {
      "code": "all_heal_points",
      "points": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s01"
    ]
  },
  {
    "abilityKey": "blue:s01:2",
    "abilityId": "s01",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "回復増幅",
    "cost": {
      "power": 30,
      "tech": 120,
      "mental": 100,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "自身が行う回復量+2pt。",
    "effect": {
      "code": "all_heal_points",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s01",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s01"
    ]
  },
  {
    "abilityKey": "blue:s02:1",
    "abilityId": "s02",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "精密治療",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "最もHP割合が低い味方への回復量+2pt。",
    "effect": {
      "code": "lowest_hp_heal",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s02"
    ]
  },
  {
    "abilityKey": "blue:s02:2",
    "abilityId": "s02",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "救命治療",
    "cost": {
      "power": 30,
      "tech": 120,
      "mental": 110,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "最もHP割合が低い味方への回復量+4pt。",
    "effect": {
      "code": "lowest_hp_heal",
      "points": 4
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s02",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s02"
    ]
  },
  {
    "abilityKey": "blue:s03:1",
    "abilityId": "s03",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "全体治療",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 40,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "ドローンヒールの回復量+1pt。",
    "effect": {
      "code": "skill_heal_points",
      "skillId": "sup_drone_heal",
      "points": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s03"
    ]
  },
  {
    "abilityKey": "blue:s03:2",
    "abilityId": "s03",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "全域治療",
    "cost": {
      "power": 30,
      "tech": 130,
      "mental": 100,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "ドローンヒールの回復量+2pt。",
    "effect": {
      "code": "skill_heal_points",
      "skillId": "sup_drone_heal",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s03",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s03"
    ]
  },
  {
    "abilityKey": "blue:s04:1",
    "abilityId": "s04",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "緊急治療",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP30%以下の味方への回復量+3pt。",
    "effect": {
      "code": "critical_ally_heal",
      "hpRate": 0.3,
      "points": 3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s04"
    ]
  },
  {
    "abilityKey": "blue:s04:2",
    "abilityId": "s04",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "緊急救命",
    "cost": {
      "power": 30,
      "tech": 120,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "HP30%以下の味方への回復量+5pt。",
    "effect": {
      "code": "critical_ally_heal",
      "hpRate": 0.3,
      "points": 5
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s04",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s04"
    ]
  },
  {
    "abilityKey": "blue:s05:1",
    "abilityId": "s05",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "治療効率",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 45,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "ドローンヒールの基本CT-0.15秒。",
    "effect": {
      "code": "skill_base_ct",
      "skillId": "sup_drone_heal",
      "seconds": 0.15
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s05"
    ]
  },
  {
    "abilityKey": "blue:s05:2",
    "abilityId": "s05",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "治療循環",
    "cost": {
      "power": 0,
      "tech": 140,
      "mental": 100,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "ドローンヒールの基本CT-0.30秒。",
    "effect": {
      "code": "skill_base_ct",
      "skillId": "sup_drone_heal",
      "seconds": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s05",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s05"
    ]
  },
  {
    "abilityKey": "blue:s06:1",
    "abilityId": "s06",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "蘇生技術",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "リスポーンフィールドの復活HP+2pt。",
    "effect": {
      "code": "revive_hp_points",
      "skillId": "sup_respawn_field",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s06"
    ]
  },
  {
    "abilityKey": "blue:s06:2",
    "abilityId": "s06",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "蘇生熟練",
    "cost": {
      "power": 30,
      "tech": 130,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "リスポーンフィールドの復活HP+5pt。",
    "effect": {
      "code": "revive_hp_points",
      "skillId": "sup_respawn_field",
      "points": 5
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s06",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s06"
    ]
  },
  {
    "abilityKey": "blue:s07:1",
    "abilityId": "s07",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "蘇生防護",
    "cost": {
      "power": 50,
      "tech": 0,
      "mental": 55,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活した味方が2秒間、被ダメージ-5%。",
    "effect": {
      "code": "revive_guard_other",
      "duration": 2,
      "rate": 0.05
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s07"
    ]
  },
  {
    "abilityKey": "blue:s07:2",
    "abilityId": "s07",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "蘇生装甲",
    "cost": {
      "power": 110,
      "tech": 40,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活した味方が3秒間、被ダメージ-8%。",
    "effect": {
      "code": "revive_guard_other",
      "duration": 3,
      "rate": 0.08
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s07",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s07"
    ]
  },
  {
    "abilityKey": "blue:s08:1",
    "abilityId": "s08",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "救命判断",
    "cost": {
      "power": 0,
      "tech": 40,
      "mental": 60,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活対象がいる時、回復より復活を優先。判断時間-0.30秒。",
    "effect": {
      "code": "revive_ai_priority",
      "priority": "high",
      "reactionReduction": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s08"
    ]
  },
  {
    "abilityKey": "blue:s08:2",
    "abilityId": "s08",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "救命優先",
    "cost": {
      "power": 0,
      "tech": 100,
      "mental": 130,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "復活対象がいる時、最優先で復活。判断時間-0.60秒。",
    "effect": {
      "code": "revive_ai_priority",
      "priority": "highest",
      "reactionReduction": 0.6
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s08",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s08"
    ]
  },
  {
    "abilityKey": "blue:s09:1",
    "abilityId": "s09",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "支援連鎖",
    "cost": {
      "power": 0,
      "tech": 55,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "回復した味方のマインド+1を2秒。",
    "effect": {
      "code": "after_heal_target_stats",
      "duration": 2,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s09"
    ]
  },
  {
    "abilityKey": "blue:s09:2",
    "abilityId": "s09",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "支援循環",
    "cost": {
      "power": 0,
      "tech": 120,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "回復した味方のマインド+1、テクニック+1を3秒。",
    "effect": {
      "code": "after_heal_target_stats",
      "duration": 3,
      "stats": {
        "mind": 1,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s09",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s09"
    ]
  },
  {
    "abilityKey": "blue:s10:1",
    "abilityId": "s10",
    "color": "blue",
    "target": "SUP",
    "stage": 1,
    "name": "状態安定",
    "cost": {
      "power": 0,
      "tech": 60,
      "mental": 50,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "回復時、対象のデバフ残り時間-0.25秒。",
    "effect": {
      "code": "heal_debuff_time",
      "seconds": 0.25
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s10"
    ]
  },
  {
    "abilityKey": "blue:s10:2",
    "abilityId": "s10",
    "color": "blue",
    "target": "SUP",
    "stage": 2,
    "name": "状態浄化",
    "cost": {
      "power": 30,
      "tech": 130,
      "mental": 120,
      "shoot": 0
    },
    "unlockConditions": [],
    "description": "デバフ残り時間-0.50秒。さらに3秒間、次に受けるデバフ時間-10%。",
    "effect": {
      "code": "heal_debuff_time",
      "seconds": 0.5,
      "nextDebuffDurationReduction": 0.1,
      "duration": 3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_blue_s10",
    "commentaryTags": [
      "special_ability",
      "blue",
      "s10"
    ]
  }
]
);

export const GOLD_SPECIAL_ABILITIES = deepFreeze(
  [
  {
    "abilityKey": "gold:cg01",
    "abilityId": "cg01",
    "color": "gold",
    "target": "COMMON",
    "stage": 1,
    "name": "地方覇者",
    "cost": {
      "power": 250,
      "tech": 0,
      "mental": 250,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 3,
        "tier": "local"
      }
    ],
    "description": "Local大会中、最大HP+50。",
    "effect": {
      "code": "tier_max_hp",
      "tier": "local",
      "amount": 50
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_cg01",
    "commentaryTags": [
      "special_ability",
      "gold",
      "cg01"
    ]
  },
  {
    "abilityKey": "gold:cg02",
    "abilityId": "cg02",
    "color": "gold",
    "target": "COMMON",
    "stage": 1,
    "name": "全国常連",
    "cost": {
      "power": 0,
      "tech": 180,
      "mental": 220,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 5,
        "tier": "national"
      }
    ],
    "description": "National大会中、7能力すべて+1。",
    "effect": {
      "code": "tier_all_stats",
      "tier": "national",
      "amount": 1
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_cg02",
    "commentaryTags": [
      "special_ability",
      "gold",
      "cg02"
    ]
  },
  {
    "abilityKey": "gold:cg03",
    "abilityId": "cg03",
    "color": "gold",
    "target": "COMMON",
    "stage": 1,
    "name": "百戦錬磨",
    "cost": {
      "power": 150,
      "tech": 180,
      "mental": 180,
      "shoot": 140
    },
    "unlockConditions": [
      {
        "type": "damage",
        "value": 500000
      },
      {
        "type": "kp",
        "value": 250
      },
      {
        "type": "ap",
        "value": 250
      }
    ],
    "description": "戦闘開始10秒後、与ダメージ+3%、被ダメージ-3%。",
    "effect": {
      "code": "elapsed_offense_defense",
      "after": 10,
      "damageRate": 0.03,
      "damageReduction": 0.03
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_cg03",
    "commentaryTags": [
      "special_ability",
      "gold",
      "cg03"
    ]
  },
  {
    "abilityKey": "gold:cg04",
    "abilityId": "cg04",
    "color": "gold",
    "target": "COMMON",
    "stage": 1,
    "name": "育成結晶",
    "cost": {
      "power": 125,
      "tech": 125,
      "mental": 125,
      "shoot": 125
    },
    "unlockConditions": [
      {
        "type": "training",
        "value": 200
      }
    ],
    "description": "戦闘開始時、最も低い基礎能力1つ+3。",
    "effect": {
      "code": "lowest_stat_bonus",
      "amount": 3,
      "roleTieBreak": true
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_cg04",
    "commentaryTags": [
      "special_ability",
      "gold",
      "cg04"
    ]
  },
  {
    "abilityKey": "gold:cg05",
    "abilityId": "cg05",
    "color": "gold",
    "target": "COMMON",
    "stage": 1,
    "name": "収集眼力",
    "cost": {
      "power": 0,
      "tech": 250,
      "mental": 180,
      "shoot": 120
    },
    "unlockConditions": [
      {
        "type": "cardTypes",
        "value": 150
      },
      {
        "type": "badgeTypes",
        "value": 50
      }
    ],
    "description": "武器の得意距離でエイム+2、テクニック+2。",
    "effect": {
      "code": "preferred_range_stats",
      "stats": {
        "aim": 2,
        "technique": 2
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_cg05",
    "commentaryTags": [
      "special_ability",
      "gold",
      "cg05"
    ]
  },
  {
    "abilityKey": "gold:ig01",
    "abilityId": "ig01",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "戦況統率",
    "cost": {
      "power": 0,
      "tech": 220,
      "mental": 260,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 100
      }
    ],
    "description": "コールの持続時間+0.40秒。",
    "effect": {
      "code": "call_duration",
      "seconds": 0.4
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig01",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig01"
    ]
  },
  {
    "abilityKey": "gold:ig02",
    "abilityId": "ig02",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "号令中枢",
    "cost": {
      "power": 0,
      "tech": 230,
      "mental": 300,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 250
      }
    ],
    "description": "コールのエイムとマインド上昇量+1。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "aim": 1,
        "mind": 1
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig02",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig02"
    ]
  },
  {
    "abilityKey": "gold:ig03",
    "abilityId": "ig03",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "開幕支配",
    "cost": {
      "power": 0,
      "tech": 250,
      "mental": 200,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "local"
      }
    ],
    "description": "各戦闘開始時、コール残りCT-0.50秒。",
    "effect": {
      "code": "battle_start_skill_ct",
      "skillId": "igl_battle_call",
      "seconds": 0.5
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig03",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig03"
    ]
  },
  {
    "abilityKey": "gold:ig04",
    "abilityId": "ig04",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "逆境采配",
    "cost": {
      "power": 80,
      "tech": 180,
      "mental": 260,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "local"
      }
    ],
    "description": "HP40%以下の味方がいる時、コールのエイム・マインド+1、被ダメージ-2%。",
    "effect": {
      "code": "call_if_ally_low",
      "hpRate": 0.4,
      "stats": {
        "aim": 1,
        "mind": 1
      },
      "damageReduction": 0.02
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig04",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig04"
    ]
  },
  {
    "abilityKey": "gold:ig05",
    "abilityId": "ig05",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "目標統制",
    "cost": {
      "power": 0,
      "tech": 230,
      "mental": 180,
      "shoot": 110
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "指定対象への味方全体の与ダメージ+4%、3秒間。",
    "effect": {
      "code": "marked_target_team_damage",
      "duration": 3,
      "rate": 0.04
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig05",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig05"
    ]
  },
  {
    "abilityKey": "gold:ig06",
    "abilityId": "ig06",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "全国指揮",
    "cost": {
      "power": 0,
      "tech": 200,
      "mental": 250,
      "shoot": 100
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "National大会中、コール効果中の味方全体にアジリティ+1、サポート+1。",
    "effect": {
      "code": "tier_during_call_stats",
      "tier": "national",
      "stats": {
        "agility": 1,
        "support": 1
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig06",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig06"
    ]
  },
  {
    "abilityKey": "gold:ig07",
    "abilityId": "ig07",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "勝利設計",
    "cost": {
      "power": 100,
      "tech": 250,
      "mental": 250,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "各戦闘開始時、味方全員の最長残りCT-0.35秒。",
    "effect": {
      "code": "battle_start_team_longest_ct",
      "seconds": 0.35
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig07",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig07"
    ]
  },
  {
    "abilityKey": "gold:ig08",
    "abilityId": "ig08",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "王者采配",
    "cost": {
      "power": 0,
      "tech": 280,
      "mental": 280,
      "shoot": 90
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "コールの基本CT-0.35秒、持続時間+0.50秒。",
    "effect": {
      "code": "call_ct_duration",
      "baseCtReduction": 0.35,
      "duration": 0.5
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig08",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig08"
    ]
  },
  {
    "abilityKey": "gold:ig09",
    "abilityId": "ig09",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "育成指揮",
    "cost": {
      "power": 100,
      "tech": 150,
      "mental": 250,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "training",
        "value": 150
      }
    ],
    "description": "戦闘中、マインド+2、サポート+2。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "mind": 2,
        "support": 2
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig09",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig09"
    ]
  },
  {
    "abilityKey": "gold:ig10",
    "abilityId": "ig10",
    "color": "gold",
    "target": "IGL",
    "stage": 1,
    "name": "連携完成",
    "cost": {
      "power": 0,
      "tech": 280,
      "mental": 280,
      "shoot": 90
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 500
      },
      {
        "type": "mvp",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "コール発動時、味方全員の最長残りCT-0.30秒。",
    "effect": {
      "code": "on_call_team_longest_ct",
      "seconds": 0.3
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ig10",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ig10"
    ]
  },
  {
    "abilityKey": "gold:ag01",
    "abilityId": "ag01",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "決定打撃",
    "cost": {
      "power": 220,
      "tech": 120,
      "mental": 0,
      "shoot": 140
    },
    "unlockConditions": [
      {
        "type": "kp",
        "value": 100
      }
    ],
    "description": "単体攻撃スキルの与ダメージ+5%。",
    "effect": {
      "code": "single_skill_damage",
      "rate": 0.05
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag01",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag01"
    ]
  },
  {
    "abilityKey": "gold:ag02",
    "abilityId": "ag02",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "火力中枢",
    "cost": {
      "power": 220,
      "tech": 180,
      "mental": 0,
      "shoot": 100
    },
    "unlockConditions": [
      {
        "type": "damage",
        "value": 250000
      }
    ],
    "description": "攻撃スキルの与ダメージ+3%。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.03
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag02",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag02"
    ]
  },
  {
    "abilityKey": "gold:ag03",
    "abilityId": "ag03",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "急所破砕",
    "cost": {
      "power": 200,
      "tech": 150,
      "mental": 0,
      "shoot": 200
    },
    "unlockConditions": [
      {
        "type": "kp",
        "value": 250
      }
    ],
    "description": "HP30%以下の敵への与ダメージ+7%。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.3,
          "rate": 0.07
        }
      ]
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag03",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag03"
    ]
  },
  {
    "abilityKey": "gold:ag04",
    "abilityId": "ag04",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "追撃無双",
    "cost": {
      "power": 0,
      "tech": 200,
      "mental": 120,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 100
      }
    ],
    "description": "味方の攻撃後2秒以内に同じ敵を攻撃すると与ダメージ+5%。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2,
      "damageRate": 0.05
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag04",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag04"
    ]
  },
  {
    "abilityKey": "gold:ag05",
    "abilityId": "ag05",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "地方砲手",
    "cost": {
      "power": 170,
      "tech": 100,
      "mental": 0,
      "shoot": 180
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "local"
      }
    ],
    "description": "Local大会中、攻撃スキルの与ダメージ+4%。",
    "effect": {
      "code": "tier_attack_skill_damage",
      "tier": "local",
      "rate": 0.04
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag05",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag05"
    ]
  },
  {
    "abilityKey": "gold:ag06",
    "abilityId": "ag06",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "地方王砲",
    "cost": {
      "power": 250,
      "tech": 150,
      "mental": 0,
      "shoot": 200
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "local"
      },
      {
        "type": "wins",
        "value": 3,
        "tier": "local"
      }
    ],
    "description": "Local大会中、攻撃スキル与ダメージ+6%、命中率+3pt。",
    "effect": {
      "code": "tier_attack_skill",
      "tier": "local",
      "damageRate": 0.06,
      "accuracyPoints": 3
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag06",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag06"
    ]
  },
  {
    "abilityKey": "gold:ag07",
    "abilityId": "ag07",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "全国砲手",
    "cost": {
      "power": 0,
      "tech": 150,
      "mental": 120,
      "shoot": 250
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "National大会中、エイム+2。",
    "effect": {
      "code": "tier_stats",
      "tier": "national",
      "stats": {
        "aim": 2
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag07",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag07"
    ]
  },
  {
    "abilityKey": "gold:ag08",
    "abilityId": "ag08",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "王者弾道",
    "cost": {
      "power": 100,
      "tech": 180,
      "mental": 0,
      "shoot": 280
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "攻撃スキルの命中率+6pt、与ダメージ+2%。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 6,
      "damageRate": 0.02
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag08",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag08"
    ]
  },
  {
    "abilityKey": "gold:ag09",
    "abilityId": "ag09",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "終幕射撃",
    "cost": {
      "power": 240,
      "tech": 0,
      "mental": 120,
      "shoot": 240
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "敵の生存者が残り1人の時、与ダメージ+8%。",
    "effect": {
      "code": "last_enemy_damage",
      "rate": 0.08
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag09",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag09"
    ]
  },
  {
    "abilityKey": "gold:ag10",
    "abilityId": "ag10",
    "color": "gold",
    "target": "ATK",
    "stage": 1,
    "name": "火力完成",
    "cost": {
      "power": 260,
      "tech": 220,
      "mental": 0,
      "shoot": 170
    },
    "unlockConditions": [
      {
        "type": "damage",
        "value": 750000
      },
      {
        "type": "kp",
        "value": 500
      },
      {
        "type": "mvp",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "敵のダメージ軽減を6%分無視。",
    "effect": {
      "code": "damage_reduction_pierce",
      "rate": 0.06
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_ag10",
    "commentaryTags": [
      "special_ability",
      "gold",
      "ag10"
    ]
  },
  {
    "abilityKey": "gold:sg01",
    "abilityId": "sg01",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "救命設計",
    "cost": {
      "power": 50,
      "tech": 220,
      "mental": 210,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 100
      }
    ],
    "description": "HP30%以下の味方への回復量+4pt。",
    "effect": {
      "code": "critical_ally_heal",
      "hpRate": 0.3,
      "points": 4
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg01",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg01"
    ]
  },
  {
    "abilityKey": "gold:sg02",
    "abilityId": "sg02",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "回復中枢",
    "cost": {
      "power": 50,
      "tech": 250,
      "mental": 220,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 250
      }
    ],
    "description": "自身が行う全回復量+3pt。",
    "effect": {
      "code": "all_heal_points",
      "points": 3
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg02",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg02"
    ]
  },
  {
    "abilityKey": "gold:sg03",
    "abilityId": "sg03",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "蘇生名手",
    "cost": {
      "power": 50,
      "tech": 260,
      "mental": 250,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 400
      }
    ],
    "description": "リスポーンフィールドの復活HP+5pt。",
    "effect": {
      "code": "revive_hp_points",
      "skillId": "sup_respawn_field",
      "points": 5
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg03",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg03"
    ]
  },
  {
    "abilityKey": "gold:sg04",
    "abilityId": "sg04",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "全域救護",
    "cost": {
      "power": 60,
      "tech": 220,
      "mental": 200,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "training",
        "value": 100
      }
    ],
    "description": "ドローンヒールの基本CT-0.35秒、回復量+1pt。",
    "effect": {
      "code": "skill_heal_ct",
      "skillId": "sup_drone_heal",
      "baseCtReduction": 0.35,
      "healPoints": 1
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg04",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg04"
    ]
  },
  {
    "abilityKey": "gold:sg05",
    "abilityId": "sg05",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "地方救護",
    "cost": {
      "power": 50,
      "tech": 200,
      "mental": 200,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "local"
      }
    ],
    "description": "Local大会中、自身の回復量+4pt。",
    "effect": {
      "code": "tier_all_heal_points",
      "tier": "local",
      "points": 4
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg05",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg05"
    ]
  },
  {
    "abilityKey": "gold:sg06",
    "abilityId": "sg06",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "地方救星",
    "cost": {
      "power": 90,
      "tech": 250,
      "mental": 260,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "local"
      },
      {
        "type": "wins",
        "value": 3,
        "tier": "local"
      }
    ],
    "description": "Local大会中、復活した味方が4秒間、被ダメージ-10%。",
    "effect": {
      "code": "tier_revive_guard",
      "tier": "local",
      "duration": 4,
      "rate": 0.1
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg06",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg06"
    ]
  },
  {
    "abilityKey": "gold:sg07",
    "abilityId": "sg07",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "全国救護",
    "cost": {
      "power": 80,
      "tech": 220,
      "mental": 220,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "National大会中、サポート+2。",
    "effect": {
      "code": "tier_stats",
      "tier": "national",
      "stats": {
        "support": 2
      }
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg07",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg07"
    ]
  },
  {
    "abilityKey": "gold:sg08",
    "abilityId": "sg08",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "王者蘇生",
    "cost": {
      "power": 50,
      "tech": 260,
      "mental": 250,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "復活HP+5pt。復活成功時、自身の最長残りCT-0.30秒。",
    "effect": {
      "code": "revive_hp_self_ct",
      "points": 5,
      "longestCtReduction": 0.3
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg08",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg08"
    ]
  },
  {
    "abilityKey": "gold:sg09",
    "abilityId": "sg09",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "復帰装甲",
    "cost": {
      "power": 180,
      "tech": 160,
      "mental": 260,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "national"
      }
    ],
    "description": "復活した味方が4秒間、被ダメージ-8%。",
    "effect": {
      "code": "revive_guard_other",
      "duration": 4,
      "rate": 0.08
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg09",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg09"
    ]
  },
  {
    "abilityKey": "gold:sg10",
    "abilityId": "sg10",
    "color": "gold",
    "target": "SUP",
    "stage": 1,
    "name": "支援完成",
    "cost": {
      "power": 70,
      "tech": 300,
      "mental": 280,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "ap",
        "value": 600
      },
      {
        "type": "mvp",
        "value": 3,
        "tier": "national"
      }
    ],
    "description": "回復スキルと復活スキルの基本CT-0.30秒。",
    "effect": {
      "code": "support_skill_base_ct",
      "seconds": 0.3
    },
    "stackRule": "unique",
    "priority": 200,
    "visualEffectId": "special_gold_sg10",
    "commentaryTags": [
      "special_ability",
      "gold",
      "sg10"
    ]
  }
]
);

export const RED_SPECIAL_ABILITIES = deepFreeze(
  [
  {
    "abilityKey": "red:cr01",
    "abilityId": "cr01",
    "color": "red",
    "target": "COMMON",
    "stage": 1,
    "name": "世界常連",
    "cost": {
      "power": 225,
      "tech": 225,
      "mental": 225,
      "shoot": 225
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "world"
      }
    ],
    "description": "World大会中、7能力すべて+1。",
    "effect": {
      "code": "tier_all_stats",
      "tier": "world",
      "amount": 1
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_cr01",
    "commentaryTags": [
      "special_ability",
      "red",
      "cr01"
    ]
  },
  {
    "abilityKey": "red:cr02",
    "abilityId": "cr02",
    "color": "red",
    "target": "COMMON",
    "stage": 1,
    "name": "世界覇道",
    "cost": {
      "power": 300,
      "tech": 200,
      "mental": 350,
      "shoot": 200
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 10,
        "tier": "world"
      }
    ],
    "description": "World大会中、最大HP+40、マインド+2。",
    "effect": {
      "code": "tier_hp_stats",
      "tier": "world",
      "maxHp": 40,
      "stats": {
        "mind": 2
      }
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_cr02",
    "commentaryTags": [
      "special_ability",
      "red",
      "cr02"
    ]
  },
  {
    "abilityKey": "red:cr03",
    "abilityId": "cr03",
    "color": "red",
    "target": "COMMON",
    "stage": 1,
    "name": "世界王者",
    "cost": {
      "power": 400,
      "tech": 200,
      "mental": 350,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "World大会中、最大HP+60。各戦闘開始から5秒間、マインド+3。",
    "effect": {
      "code": "world_champion",
      "maxHp": 60,
      "openingDuration": 5,
      "openingStats": {
        "mind": 3
      }
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_cr03",
    "commentaryTags": [
      "special_ability",
      "red",
      "cr03"
    ]
  },
  {
    "abilityKey": "red:cr04",
    "abilityId": "cr04",
    "color": "red",
    "target": "COMMON",
    "stage": 1,
    "name": "世界連覇",
    "cost": {
      "power": 300,
      "tech": 300,
      "mental": 300,
      "shoot": 300
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 3,
        "tier": "world"
      }
    ],
    "description": "全大会で与ダメージ+2%、被ダメージ-2%。",
    "effect": {
      "code": "always_offense_defense",
      "damageRate": 0.02,
      "damageReduction": 0.02
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_cr04",
    "commentaryTags": [
      "special_ability",
      "red",
      "cr04"
    ]
  },
  {
    "abilityKey": "red:cr05",
    "abilityId": "cr05",
    "color": "red",
    "target": "COMMON",
    "stage": 1,
    "name": "伝説継承",
    "cost": {
      "power": 325,
      "tech": 325,
      "mental": 325,
      "shoot": 325
    },
    "unlockConditions": [
      {
        "type": "championshipWins",
        "value": 1
      }
    ],
    "description": "全大会で最大HP+30、7能力すべて+1。",
    "effect": {
      "code": "always_hp_all_stats",
      "maxHp": 30,
      "allStats": 1
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_cr05",
    "commentaryTags": [
      "special_ability",
      "red",
      "cr05"
    ]
  },
  {
    "abilityKey": "red:ir01",
    "abilityId": "ir01",
    "color": "red",
    "target": "IGL",
    "stage": 1,
    "name": "世界統率",
    "cost": {
      "power": 0,
      "tech": 400,
      "mental": 400,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "world"
      },
      {
        "type": "ap",
        "value": 500
      }
    ],
    "description": "コールのエイムとマインド上昇量+1。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "aim": 1,
        "mind": 1
      }
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ir01",
    "commentaryTags": [
      "special_ability",
      "red",
      "ir01"
    ]
  },
  {
    "abilityKey": "red:ir02",
    "abilityId": "ir02",
    "color": "red",
    "target": "IGL",
    "stage": 1,
    "name": "神速号令",
    "cost": {
      "power": 0,
      "tech": 450,
      "mental": 400,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "コールの基本CT-0.45秒。",
    "effect": {
      "code": "skill_base_ct",
      "skillId": "igl_battle_call",
      "seconds": 0.45
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ir02",
    "commentaryTags": [
      "special_ability",
      "red",
      "ir02"
    ]
  },
  {
    "abilityKey": "red:ir03",
    "abilityId": "ir03",
    "color": "red",
    "target": "IGL",
    "stage": 1,
    "name": "世界采配",
    "cost": {
      "power": 150,
      "tech": 400,
      "mental": 450,
      "shoot": 100
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "コール持続時間+0.80秒。効果中、味方全体の被ダメージ-2%。",
    "effect": {
      "code": "call_duration_guard",
      "duration": 0.8,
      "damageReduction": 0.02
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ir03",
    "commentaryTags": [
      "special_ability",
      "red",
      "ir03"
    ]
  },
  {
    "abilityKey": "red:ir04",
    "abilityId": "ir04",
    "color": "red",
    "target": "IGL",
    "stage": 1,
    "name": "戦況支配",
    "cost": {
      "power": 0,
      "tech": 450,
      "mental": 450,
      "shoot": 300
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "world"
      }
    ],
    "description": "指定対象への味方全体の与ダメージ+6%、4秒間。",
    "effect": {
      "code": "marked_target_team_damage",
      "duration": 4,
      "rate": 0.06
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ir04",
    "commentaryTags": [
      "special_ability",
      "red",
      "ir04"
    ]
  },
  {
    "abilityKey": "red:ir05",
    "abilityId": "ir05",
    "color": "red",
    "target": "IGL",
    "stage": 1,
    "name": "伝説指揮",
    "cost": {
      "power": 200,
      "tech": 450,
      "mental": 500,
      "shoot": 150
    },
    "unlockConditions": [
      {
        "type": "championshipWins",
        "value": 1
      },
      {
        "type": "ap",
        "value": 1000
      }
    ],
    "description": "各戦闘開始時、味方全員の3スキル残りCT-0.50秒。4秒間、味方全体のマインド+2。",
    "effect": {
      "code": "legend_command",
      "allSkillCtReduction": 0.5,
      "duration": 4,
      "teamStats": {
        "mind": 2
      }
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ir05",
    "commentaryTags": [
      "special_ability",
      "red",
      "ir05"
    ]
  },
  {
    "abilityKey": "red:ar01",
    "abilityId": "ar01",
    "color": "red",
    "target": "ATK",
    "stage": 1,
    "name": "世界火力",
    "cost": {
      "power": 350,
      "tech": 250,
      "mental": 0,
      "shoot": 350
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "world"
      },
      {
        "type": "damage",
        "value": 1000000
      }
    ],
    "description": "攻撃スキルの与ダメージ+5%。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.05
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ar01",
    "commentaryTags": [
      "special_ability",
      "red",
      "ar01"
    ]
  },
  {
    "abilityKey": "red:ar02",
    "abilityId": "ar02",
    "color": "red",
    "target": "ATK",
    "stage": 1,
    "name": "神速射撃",
    "cost": {
      "power": 200,
      "tech": 400,
      "mental": 0,
      "shoot": 400
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "基本CTが短い方の攻撃スキルCT-0.40秒。",
    "effect": {
      "code": "shorter_attack_skill_ct",
      "seconds": 0.4
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ar02",
    "commentaryTags": [
      "special_ability",
      "red",
      "ar02"
    ]
  },
  {
    "abilityKey": "red:ar03",
    "abilityId": "ar03",
    "color": "red",
    "target": "ATK",
    "stage": 1,
    "name": "世界弾道",
    "cost": {
      "power": 300,
      "tech": 300,
      "mental": 0,
      "shoot": 500
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "攻撃スキルの命中率+8pt、与ダメージ+4%。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 8,
      "damageRate": 0.04
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ar03",
    "commentaryTags": [
      "special_ability",
      "red",
      "ar03"
    ]
  },
  {
    "abilityKey": "red:ar04",
    "abilityId": "ar04",
    "color": "red",
    "target": "ATK",
    "stage": 1,
    "name": "終幕破砕",
    "cost": {
      "power": 450,
      "tech": 300,
      "mental": 150,
      "shoot": 300
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "world"
      }
    ],
    "description": "敵が残り1人の時、与ダメージ+10%、ダメージ軽減を4%分無視。",
    "effect": {
      "code": "last_enemy_break",
      "damageRate": 0.1,
      "pierceRate": 0.04
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ar04",
    "commentaryTags": [
      "special_ability",
      "red",
      "ar04"
    ]
  },
  {
    "abilityKey": "red:ar05",
    "abilityId": "ar05",
    "color": "red",
    "target": "ATK",
    "stage": 1,
    "name": "伝説砲手",
    "cost": {
      "power": 450,
      "tech": 400,
      "mental": 0,
      "shoot": 450
    },
    "unlockConditions": [
      {
        "type": "championshipWins",
        "value": 1
      },
      {
        "type": "kp",
        "value": 1000
      }
    ],
    "description": "攻撃スキル与ダメージ+3%。敵のダメージ軽減を8%分無視。",
    "effect": {
      "code": "legend_gunner",
      "damageRate": 0.03,
      "pierceRate": 0.08
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_ar05",
    "commentaryTags": [
      "special_ability",
      "red",
      "ar05"
    ]
  },
  {
    "abilityKey": "red:sr01",
    "abilityId": "sr01",
    "color": "red",
    "target": "SUP",
    "stage": 1,
    "name": "世界救護",
    "cost": {
      "power": 150,
      "tech": 400,
      "mental": 400,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "top5",
        "value": 3,
        "tier": "world"
      },
      {
        "type": "ap",
        "value": 600
      }
    ],
    "description": "自身が行う全回復量+4pt。",
    "effect": {
      "code": "all_heal_points",
      "points": 4
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_sr01",
    "commentaryTags": [
      "special_ability",
      "red",
      "sr01"
    ]
  },
  {
    "abilityKey": "red:sr02",
    "abilityId": "sr02",
    "color": "red",
    "target": "SUP",
    "stage": 1,
    "name": "神速治療",
    "cost": {
      "power": 150,
      "tech": 450,
      "mental": 400,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "ドローンヒールの基本CT-0.45秒。",
    "effect": {
      "code": "skill_base_ct",
      "skillId": "sup_drone_heal",
      "seconds": 0.45
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_sr02",
    "commentaryTags": [
      "special_ability",
      "red",
      "sr02"
    ]
  },
  {
    "abilityKey": "red:sr03",
    "abilityId": "sr03",
    "color": "red",
    "target": "SUP",
    "stage": 1,
    "name": "世界蘇生",
    "cost": {
      "power": 200,
      "tech": 450,
      "mental": 450,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "wins",
        "value": 1,
        "tier": "world"
      }
    ],
    "description": "リスポーンフィールドの基本復活HPを35%へ変更。追加回復はその後に加算。",
    "effect": {
      "code": "revive_base_hp",
      "skillId": "sup_respawn_field",
      "rate": 0.35
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_sr03",
    "commentaryTags": [
      "special_ability",
      "red",
      "sr03"
    ]
  },
  {
    "abilityKey": "red:sr04",
    "abilityId": "sr04",
    "color": "red",
    "target": "SUP",
    "stage": 1,
    "name": "全域救命",
    "cost": {
      "power": 200,
      "tech": 500,
      "mental": 500,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "mvp",
        "value": 3,
        "tier": "world"
      }
    ],
    "description": "ドローンヒール回復量+3pt。復活した味方が4秒間、被ダメージ-10%。",
    "effect": {
      "code": "drone_heal_revive_guard",
      "healPoints": 3,
      "duration": 4,
      "rate": 0.1
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_sr04",
    "commentaryTags": [
      "special_ability",
      "red",
      "sr04"
    ]
  },
  {
    "abilityKey": "red:sr05",
    "abilityId": "sr05",
    "color": "red",
    "target": "SUP",
    "stage": 1,
    "name": "伝説支援",
    "cost": {
      "power": 200,
      "tech": 550,
      "mental": 550,
      "shoot": 0
    },
    "unlockConditions": [
      {
        "type": "championshipWins",
        "value": 1
      },
      {
        "type": "ap",
        "value": 1200
      }
    ],
    "description": "基本復活HPを40%へ変更。回復・復活スキルの基本CT-0.35秒。",
    "effect": {
      "code": "legend_support",
      "reviveRate": 0.4,
      "supportSkillCtReduction": 0.35
    },
    "stackRule": "unique",
    "priority": 300,
    "visualEffectId": "special_red_sr05",
    "commentaryTags": [
      "special_ability",
      "red",
      "sr05"
    ]
  }
]
);

export const SPECIAL_ABILITIES = deepFreeze([
  ...BLUE_SPECIAL_ABILITIES,
  ...GOLD_SPECIAL_ABILITIES,
  ...RED_SPECIAL_ABILITIES,
]);

const statDefinitionById = new Map(
  PLAYER_STAT_DEFINITIONS.map((definition) => [
    definition.id,
    definition,
  ]),
);
const weaponDefinitionById = new Map(
  WEAPON_STAT_DEFINITIONS.map((definition) => [
    definition.id,
    definition,
  ]),
);
const weaponUpgradeByRank = new Map(
  WEAPON_UPGRADE_COSTS.map((entry) => [
    entry.currentRank,
    entry,
  ]),
);
const specialAbilityByKey = new Map(
  SPECIAL_ABILITIES.map((ability) => [
    ability.abilityKey,
    ability,
  ]),
);

function getRankBand(rank) {
  if (rank === "MOB") {
    return "MOB";
  }
  const match = /^(SS|[FEDCBAS])[1-9]$/.exec(rank);
  if (!match) {
    throw new RangeError(`Invalid rank: ${rank}`);
  }
  return match[1];
}

export function getPlayerStatDefinition(statId) {
  const definition = statDefinitionById.get(statId);
  if (!definition) {
    throw new RangeError(`Unknown player stat: ${statId}`);
  }
  return definition;
}

export function getStatUpgradeCost(currentValue) {
  if (!Number.isInteger(currentValue) || currentValue < 1 || currentValue > 73) {
    throw new RangeError("Current player stat value must be from 1 to 73.");
  }

  const currentRank = characterValueToRank(currentValue);
  if (currentRank === "MOB") {
    return null;
  }

  const band = getRankBand(currentRank);
  const cost = STAT_UPGRADE_COSTS[band];
  return deepFreeze({
    currentRank,
    nextRank: characterValueToRank(currentValue + 1),
    primary: cost.primary,
    secondary: cost.secondary,
  });
}

export function getWeaponStatDefinition(statId) {
  const definition = weaponDefinitionById.get(statId);
  if (!definition) {
    throw new RangeError(`Unknown weapon stat: ${statId}`);
  }
  return definition;
}

export function getWeaponUpgradeCost(currentRank) {
  if (currentRank === "MOB") {
    return null;
  }
  const entry = weaponUpgradeByRank.get(currentRank);
  if (!entry) {
    throw new RangeError(`Unknown weapon rank: ${currentRank}`);
  }
  return entry;
}

export function getSpecialAbility(abilityKey) {
  const ability = specialAbilityByKey.get(abilityKey);
  if (!ability) {
    throw new RangeError(`Unknown special ability: ${abilityKey}`);
  }
  return ability;
}

export function getSpecialAbilitiesForRole(role, color = null) {
  if (!["IGL", "ATK", "SUP"].includes(role)) {
    throw new RangeError(`Invalid role: ${role}`);
  }
  if (color !== null && !["blue", "gold", "red"].includes(color)) {
    throw new RangeError(`Invalid ability color: ${color}`);
  }

  return deepFreeze(
    SPECIAL_ABILITIES.filter(
      (ability) =>
        (ability.target === "COMMON" || ability.target === role) &&
        (color === null || ability.color === color),
    ),
  );
}

export function calculateAbilityCostTotal(cost) {
  return TRAINING_POINT_IDS.reduce(
    (total, pointId) => total + (cost[pointId] ?? 0),
    0,
  );
}

export function canAffordPointCost(pointPool, cost) {
  if (!pointPool || typeof pointPool !== "object") {
    throw new TypeError("Point pool must be an object.");
  }
  if (!cost || typeof cost !== "object") {
    throw new TypeError("Point cost must be an object.");
  }

  return TRAINING_POINT_IDS.every((pointId) => {
    const owned = pointPool[pointId] ?? 0;
    const required = cost[pointId] ?? 0;
    return (
      Number.isInteger(owned) &&
      owned >= 0 &&
      Number.isInteger(required) &&
      required >= 0 &&
      owned >= required
    );
  });
}

function getProgressValue(progress, condition) {
  const type = condition.type;
  const tier = condition.tier;

  if (tier) {
    return progress[type]?.[tier] ?? 0;
  }
  return progress[type] ?? 0;
}

export function evaluateUnlockConditions(conditions, progress) {
  if (!Array.isArray(conditions)) {
    throw new TypeError("Unlock conditions must be an array.");
  }
  if (!progress || typeof progress !== "object") {
    throw new TypeError("Ability progress must be an object.");
  }

  const details = conditions.map((condition) => {
    const current = getProgressValue(progress, condition);
    const required = condition.value;
    const met =
      Number.isFinite(current) &&
      Number.isFinite(required) &&
      current >= required;

    return deepFreeze({
      condition,
      current,
      required,
      met,
    });
  });

  return deepFreeze({
    unlocked: details.every((detail) => detail.met),
    details,
  });
}

export function validateAbilityMaster() {
  if (PLAYER_STAT_DEFINITIONS.length !== STAT_IDS.length) {
    throw new Error("Player stat definition count must equal seven.");
  }
  if (
    new Set(PLAYER_STAT_DEFINITIONS.map((definition) => definition.id)).size !==
    PLAYER_STAT_DEFINITIONS.length
  ) {
    throw new Error("Duplicate player stat ID detected.");
  }

  if (WEAPON_UPGRADE_COSTS.length !== 72) {
    throw new Error("Weapon upgrade table must contain 72 entries.");
  }
  for (let index = 0; index < WEAPON_UPGRADE_COSTS.length; index += 1) {
    const current = WEAPON_UPGRADE_COSTS[index];
    const next = WEAPON_UPGRADE_COSTS[index + 1];
    if (next && current.nextRank !== next.currentRank) {
      throw new Error(
        `Weapon upgrade rank chain is broken at ${current.currentRank}.`,
      );
    }
  }

  if (BLUE_SPECIAL_ABILITIES.length !== 100) {
    throw new Error("Blue ability count must equal 100 stages.");
  }
  if (GOLD_SPECIAL_ABILITIES.length !== 35) {
    throw new Error("Gold ability count must equal 35.");
  }
  if (RED_SPECIAL_ABILITIES.length !== 20) {
    throw new Error("Red ability count must equal 20.");
  }
  if (SPECIAL_ABILITIES.length !== 155) {
    throw new Error("Total special ability count must equal 155.");
  }

  const keys = new Set();
  for (const ability of SPECIAL_ABILITIES) {
    if (keys.has(ability.abilityKey)) {
      throw new Error(`Duplicate ability key: ${ability.abilityKey}`);
    }
    keys.add(ability.abilityKey);

    if (
      !["COMMON", "IGL", "ATK", "SUP"].includes(ability.target) ||
      !["blue", "gold", "red"].includes(ability.color)
    ) {
      throw new Error(`Invalid ability classification: ${ability.abilityKey}`);
    }

    for (const pointId of TRAINING_POINT_IDS) {
      const value = ability.cost[pointId];
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(
          `Invalid point cost: ${ability.abilityKey}/${pointId}`,
        );
      }
    }
  }

  const blueFamilies = new Map();
  for (const ability of BLUE_SPECIAL_ABILITIES) {
    const stages = blueFamilies.get(ability.abilityId) ?? [];
    stages.push(ability.stage);
    blueFamilies.set(ability.abilityId, stages);
  }
  if (blueFamilies.size !== 50) {
    throw new Error("Blue ability family count must equal 50.");
  }
  for (const [abilityId, stages] of blueFamilies) {
    if (
      stages.length !== 2 ||
      !stages.includes(1) ||
      !stages.includes(2)
    ) {
      throw new Error(`Blue ability stages are invalid: ${abilityId}`);
    }
  }

  return deepFreeze({
    playerStatCount: PLAYER_STAT_DEFINITIONS.length,
    weaponStatCount: WEAPON_STAT_DEFINITIONS.length,
    weaponUpgradeCount: WEAPON_UPGRADE_COSTS.length,
    blueStageCount: BLUE_SPECIAL_ABILITIES.length,
    blueFamilyCount: blueFamilies.size,
    goldCount: GOLD_SPECIAL_ABILITIES.length,
    redCount: RED_SPECIAL_ABILITIES.length,
    totalSpecialAbilityCount: SPECIAL_ABILITIES.length,
    valid: true,
  });
}
