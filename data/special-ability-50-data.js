/**
 * MOB BR Generation 50 special ability master.
 * 54 ability families, each with level 1 and level 2.
 */

export const SPECIAL_ABILITY_50_VERSION =
  "mobbr-special-ability-50-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const SPECIAL_ABILITY_STAGE_MASTER = deepFreeze(
  [
  {
    "abilityKey": "ability:01:1",
    "abilityId": "01",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "前線奮闘",
    "image": "ability/01.png",
    "cost": {
      "power": 15,
      "tech": 10,
      "mental": 8,
      "shoot": 15
    },
    "unlockConditions": [],
    "description": "HPが高い間、攻撃ダメージが上昇します。",
    "effect": {
      "code": "high_hp_offense",
      "hpRate": 0.7,
      "damageRate": 0.025
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_01",
    "commentaryTags": [
      "special_ability",
      "normal",
      "01"
    ]
  },
  {
    "abilityKey": "ability:01:2",
    "abilityId": "01",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "前線奮闘",
    "image": "ability/01.png",
    "cost": {
      "power": 30,
      "tech": 15,
      "mental": 9,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "HPが高い間、攻撃ダメージが上昇します。 効果が強化されています。",
    "effect": {
      "code": "high_hp_offense",
      "hpRate": 0.65,
      "damageRate": 0.045
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_01",
    "commentaryTags": [
      "special_ability",
      "normal",
      "01"
    ]
  },
  {
    "abilityKey": "ability:02:1",
    "abilityId": "02",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "援護連携",
    "image": "ability/02.png",
    "cost": {
      "power": 5,
      "tech": 15,
      "mental": 16,
      "shoot": 15
    },
    "unlockConditions": [],
    "description": "味方が狙った敵への追撃性能が上昇します。",
    "effect": {
      "code": "follow_ally_target",
      "window": 2.2,
      "damageRate": 0.025,
      "targetPriority": 0.12
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_02",
    "commentaryTags": [
      "special_ability",
      "normal",
      "02"
    ]
  },
  {
    "abilityKey": "ability:02:2",
    "abilityId": "02",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "援護連携",
    "image": "ability/02.png",
    "cost": {
      "power": 5,
      "tech": 20,
      "mental": 44,
      "shoot": 20
    },
    "unlockConditions": [],
    "description": "味方が狙った敵への追撃性能が上昇します。 効果が強化されています。",
    "effect": {
      "code": "follow_ally_target",
      "window": 3.0,
      "damageRate": 0.045,
      "targetPriority": 0.2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_02",
    "commentaryTags": [
      "special_ability",
      "normal",
      "02"
    ]
  },
  {
    "abilityKey": "ability:03:1",
    "abilityId": "03",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "弾薬管理",
    "image": "ability/03.png",
    "cost": {
      "power": 5,
      "tech": 20,
      "mental": 19,
      "shoot": 10
    },
    "unlockConditions": [],
    "description": "戦闘開始時に全スキルのCTを短縮します。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.12
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_03",
    "commentaryTags": [
      "special_ability",
      "normal",
      "03"
    ]
  },
  {
    "abilityKey": "ability:03:2",
    "abilityId": "03",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "弾薬管理",
    "image": "ability/03.png",
    "cost": {
      "power": 5,
      "tech": 35,
      "mental": 34,
      "shoot": 20
    },
    "unlockConditions": [],
    "description": "戦闘開始時に全スキルのCTを短縮します。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.28
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_03",
    "commentaryTags": [
      "special_ability",
      "normal",
      "03"
    ]
  },
  {
    "abilityKey": "ability:04:1",
    "abilityId": "04",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "集中視察",
    "image": "ability/04.png",
    "cost": {
      "power": 5,
      "tech": 20,
      "mental": 22,
      "shoot": 10
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中性能を上昇させます。",
    "effect": {
      "code": "attack_skill_accuracy",
      "points": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_04",
    "commentaryTags": [
      "special_ability",
      "normal",
      "04"
    ]
  },
  {
    "abilityKey": "ability:04:2",
    "abilityId": "04",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "集中視察",
    "image": "ability/04.png",
    "cost": {
      "power": 5,
      "tech": 35,
      "mental": 40,
      "shoot": 20
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中性能を上昇させます。 効果が強化されています。",
    "effect": {
      "code": "attack_skill_accuracy",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_04",
    "commentaryTags": [
      "special_ability",
      "normal",
      "04"
    ]
  },
  {
    "abilityKey": "ability:05:1",
    "abilityId": "05",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "回復技術",
    "image": "ability/05.png",
    "cost": {
      "power": 5,
      "tech": 15,
      "mental": 25,
      "shoot": 15
    },
    "unlockConditions": [],
    "description": "すべての回復効果を強化します。",
    "effect": {
      "code": "all_heal_points",
      "points": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_05",
    "commentaryTags": [
      "special_ability",
      "normal",
      "05"
    ]
  },
  {
    "abilityKey": "ability:05:2",
    "abilityId": "05",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "回復技術",
    "image": "ability/05.png",
    "cost": {
      "power": 5,
      "tech": 25,
      "mental": 50,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "すべての回復効果を強化します。 効果が強化されています。",
    "effect": {
      "code": "all_heal_points",
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_05",
    "commentaryTags": [
      "special_ability",
      "normal",
      "05"
    ]
  },
  {
    "abilityKey": "ability:06:1",
    "abilityId": "06",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "支援強化",
    "image": "ability/06.png",
    "cost": {
      "power": 15,
      "tech": 20,
      "mental": 18,
      "shoot": 20
    },
    "unlockConditions": [],
    "description": "指揮・支援中の味方連携を強化します。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "support": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_06",
    "commentaryTags": [
      "special_ability",
      "normal",
      "06"
    ]
  },
  {
    "abilityKey": "ability:06:2",
    "abilityId": "06",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "支援強化",
    "image": "ability/06.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 33,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "指揮・支援中の味方連携を強化します。 効果が強化されています。",
    "effect": {
      "code": "call_buff",
      "stats": {
        "support": 2,
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_06",
    "commentaryTags": [
      "special_ability",
      "normal",
      "06"
    ]
  },
  {
    "abilityKey": "ability:07:1",
    "abilityId": "07",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "反射行動",
    "image": "ability/07.png",
    "cost": {
      "power": 25,
      "tech": 15,
      "mental": 1,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "攻撃を外した後、次の射撃精度が上昇します。",
    "effect": {
      "code": "after_miss_aim",
      "aim": 1,
      "appliesTo": "all"
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_07",
    "commentaryTags": [
      "special_ability",
      "normal",
      "07"
    ]
  },
  {
    "abilityKey": "ability:07:2",
    "abilityId": "07",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "反射行動",
    "image": "ability/07.png",
    "cost": {
      "power": 40,
      "tech": 25,
      "mental": 11,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "攻撃を外した後、次の射撃精度が上昇します。 効果が強化されています。",
    "effect": {
      "code": "after_miss_aim",
      "aim": 2,
      "appliesTo": "all"
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_07",
    "commentaryTags": [
      "special_ability",
      "normal",
      "07"
    ]
  },
  {
    "abilityKey": "ability:08:1",
    "abilityId": "08",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "軽快歩法",
    "image": "ability/08.png",
    "cost": {
      "power": 25,
      "tech": 15,
      "mental": 4,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "アジリティを常時上昇させます。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_08",
    "commentaryTags": [
      "special_ability",
      "normal",
      "08"
    ]
  },
  {
    "abilityKey": "ability:08:2",
    "abilityId": "08",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "軽快歩法",
    "image": "ability/08.png",
    "cost": {
      "power": 40,
      "tech": 25,
      "mental": 16,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "アジリティを常時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "agility": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_08",
    "commentaryTags": [
      "special_ability",
      "normal",
      "08"
    ]
  },
  {
    "abilityKey": "ability:09:1",
    "abilityId": "09",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "ATK"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "俊足装填",
    "image": "ability/09.png",
    "cost": {
      "power": 15,
      "tech": 20,
      "mental": 22,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "戦闘開始時のスキル準備を早めます。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_09",
    "commentaryTags": [
      "special_ability",
      "normal",
      "09"
    ]
  },
  {
    "abilityKey": "ability:09:2",
    "abilityId": "09",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "ATK"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "俊足装填",
    "image": "ability/09.png",
    "cost": {
      "power": 30,
      "tech": 35,
      "mental": 34,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "戦闘開始時のスキル準備を早めます。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.24
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_09",
    "commentaryTags": [
      "special_ability",
      "normal",
      "09"
    ]
  },
  {
    "abilityKey": "ability:10:1",
    "abilityId": "10",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "演舞射撃",
    "image": "ability/10.png",
    "cost": {
      "power": 25,
      "tech": 15,
      "mental": 10,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "連続命中後に射撃能力が上昇します。",
    "effect": {
      "code": "hit_streak",
      "hits": 3,
      "duration": 2.5,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_10",
    "commentaryTags": [
      "special_ability",
      "normal",
      "10"
    ]
  },
  {
    "abilityKey": "ability:10:2",
    "abilityId": "10",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "演舞射撃",
    "image": "ability/10.png",
    "cost": {
      "power": 45,
      "tech": 25,
      "mental": 16,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "連続命中後に射撃能力が上昇します。 効果が強化されています。",
    "effect": {
      "code": "hit_streak",
      "hits": 3,
      "duration": 3.5,
      "stats": {
        "aim": 2,
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_10",
    "commentaryTags": [
      "special_ability",
      "normal",
      "10"
    ]
  },
  {
    "abilityKey": "ability:11:1",
    "abilityId": "11",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "円陣一発",
    "image": "ability/11.png",
    "cost": {
      "power": 20,
      "tech": 20,
      "mental": 23,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "戦闘開始直後、味方全体の被ダメージを軽減します。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 2.5,
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_11",
    "commentaryTags": [
      "special_ability",
      "normal",
      "11"
    ]
  },
  {
    "abilityKey": "ability:11:2",
    "abilityId": "11",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "円陣一発",
    "image": "ability/11.png",
    "cost": {
      "power": 30,
      "tech": 40,
      "mental": 39,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "戦闘開始直後、味方全体の被ダメージを軽減します。 効果が強化されています。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 3.5,
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_11",
    "commentaryTags": [
      "special_ability",
      "normal",
      "11"
    ]
  },
  {
    "abilityKey": "ability:12:1",
    "abilityId": "12",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "SUP"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "弾心一体",
    "image": "ability/12.png",
    "cost": {
      "power": 20,
      "tech": 25,
      "mental": 21,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中と威力を同時に強化します。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 1,
      "damageRate": 0.015
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_12",
    "commentaryTags": [
      "special_ability",
      "normal",
      "12"
    ]
  },
  {
    "abilityKey": "ability:12:2",
    "abilityId": "12",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "SUP"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "弾心一体",
    "image": "ability/12.png",
    "cost": {
      "power": 30,
      "tech": 40,
      "mental": 39,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中と威力を同時に強化します。 効果が強化されています。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 2,
      "damageRate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_12",
    "commentaryTags": [
      "special_ability",
      "normal",
      "12"
    ]
  },
  {
    "abilityKey": "ability:13:1",
    "abilityId": "13",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "勝機察知",
    "image": "ability/13.png",
    "cost": {
      "power": 20,
      "tech": 25,
      "mental": 19,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "HPが減った敵へのダメージが上昇します。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.3,
          "rate": 0.03
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_13",
    "commentaryTags": [
      "special_ability",
      "normal",
      "13"
    ]
  },
  {
    "abilityKey": "ability:13:2",
    "abilityId": "13",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "勝機察知",
    "image": "ability/13.png",
    "cost": {
      "power": 35,
      "tech": 40,
      "mental": 39,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "HPが減った敵へのダメージが上昇します。 効果が強化されています。",
    "effect": {
      "code": "enemy_low_hp_damage",
      "thresholds": [
        {
          "hpRate": 0.4,
          "rate": 0.025
        },
        {
          "hpRate": 0.2,
          "rate": 0.055
        }
      ]
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_13",
    "commentaryTags": [
      "special_ability",
      "normal",
      "13"
    ]
  },
  {
    "abilityKey": "ability:14:1",
    "abilityId": "14",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "補給判断",
    "image": "ability/14.png",
    "cost": {
      "power": 5,
      "tech": 20,
      "mental": 42,
      "shoot": 20
    },
    "unlockConditions": [],
    "description": "戦闘終了時のHP回復量を増加させます。",
    "effect": {
      "code": "battle_end_recovery",
      "healRate": 0.025
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_14",
    "commentaryTags": [
      "special_ability",
      "normal",
      "14"
    ]
  },
  {
    "abilityKey": "ability:14:2",
    "abilityId": "14",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "補給判断",
    "image": "ability/14.png",
    "cost": {
      "power": 10,
      "tech": 40,
      "mental": 62,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "戦闘終了時のHP回復量を増加させます。 効果が強化されています。",
    "effect": {
      "code": "battle_end_recovery",
      "healRate": 0.05
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_14",
    "commentaryTags": [
      "special_ability",
      "normal",
      "14"
    ]
  },
  {
    "abilityKey": "ability:15:1",
    "abilityId": "15",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "逆転本能",
    "image": "ability/15.png",
    "cost": {
      "power": 30,
      "tech": 20,
      "mental": 10,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "低HP時に攻撃能力が上昇します。",
    "effect": {
      "code": "low_hp_stats",
      "hpRate": 0.35,
      "stats": {
        "physical": 1,
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_15",
    "commentaryTags": [
      "special_ability",
      "normal",
      "15"
    ]
  },
  {
    "abilityKey": "ability:15:2",
    "abilityId": "15",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "逆転本能",
    "image": "ability/15.png",
    "cost": {
      "power": 55,
      "tech": 30,
      "mental": 18,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "低HP時に攻撃能力が上昇します。 効果が強化されています。",
    "effect": {
      "code": "low_hp_stats",
      "hpRate": 0.4,
      "stats": {
        "physical": 2,
        "aim": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_15",
    "commentaryTags": [
      "special_ability",
      "normal",
      "15"
    ]
  },
  {
    "abilityKey": "ability:16:1",
    "abilityId": "16",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "支援強化",
    "image": "ability/16.png",
    "cost": {
      "power": 5,
      "tech": 25,
      "mental": 38,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "SUP専用スキルの基本CTを短縮します。",
    "effect": {
      "code": "support_skill_base_ct",
      "seconds": 0.12
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_16",
    "commentaryTags": [
      "special_ability",
      "normal",
      "16"
    ]
  },
  {
    "abilityKey": "ability:16:2",
    "abilityId": "16",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "支援強化",
    "image": "ability/16.png",
    "cost": {
      "power": 10,
      "tech": 40,
      "mental": 73,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "SUP専用スキルの基本CTを短縮します。 効果が強化されています。",
    "effect": {
      "code": "support_skill_base_ct",
      "seconds": 0.28
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_16",
    "commentaryTags": [
      "special_ability",
      "normal",
      "16"
    ]
  },
  {
    "abilityKey": "ability:17:1",
    "abilityId": "17",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "心の強さ",
    "image": "ability/17.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 24,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "妨害効果の時間と強さを軽減します。",
    "effect": {
      "code": "debuff_resist",
      "durationReduction": 0.04,
      "valueReduction": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_17",
    "commentaryTags": [
      "special_ability",
      "normal",
      "17"
    ]
  },
  {
    "abilityKey": "ability:17:2",
    "abilityId": "17",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "心の強さ",
    "image": "ability/17.png",
    "cost": {
      "power": 40,
      "tech": 50,
      "mental": 50,
      "shoot": 60
    },
    "unlockConditions": [],
    "description": "妨害効果の時間と強さを軽減します。 効果が強化されています。",
    "effect": {
      "code": "debuff_resist",
      "durationReduction": 0.08,
      "valueReduction": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_17",
    "commentaryTags": [
      "special_ability",
      "normal",
      "17"
    ]
  },
  {
    "abilityKey": "ability:18:1",
    "abilityId": "18",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "一弾入魂",
    "image": "ability/18.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 27,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "攻撃スキルのダメージを上昇させます。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_18",
    "commentaryTags": [
      "special_ability",
      "normal",
      "18"
    ]
  },
  {
    "abilityKey": "ability:18:2",
    "abilityId": "18",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "一弾入魂",
    "image": "ability/18.png",
    "cost": {
      "power": 40,
      "tech": 50,
      "mental": 55,
      "shoot": 60
    },
    "unlockConditions": [],
    "description": "攻撃スキルのダメージを上昇させます。 効果が強化されています。",
    "effect": {
      "code": "attack_skill_damage",
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_18",
    "commentaryTags": [
      "special_ability",
      "normal",
      "18"
    ]
  },
  {
    "abilityKey": "ability:19:1",
    "abilityId": "19",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "逆境強化",
    "image": "ability/19.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 30,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "低HP時に受けるダメージを軽減します。",
    "effect": {
      "code": "low_hp_damage_reduction",
      "hpRate": 0.3,
      "rate": 0.025
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_19",
    "commentaryTags": [
      "special_ability",
      "normal",
      "19"
    ]
  },
  {
    "abilityKey": "ability:19:2",
    "abilityId": "19",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "逆境強化",
    "image": "ability/19.png",
    "cost": {
      "power": 40,
      "tech": 50,
      "mental": 55,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "低HP時に受けるダメージを軽減します。 効果が強化されています。",
    "effect": {
      "code": "low_hp_damage_reduction",
      "hpRate": 0.4,
      "rate": 0.045
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_19",
    "commentaryTags": [
      "special_ability",
      "normal",
      "19"
    ]
  },
  {
    "abilityKey": "ability:20:1",
    "abilityId": "20",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "警戒心",
    "image": "ability/20.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 33,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "戦闘開始直後の判断力を高めます。",
    "effect": {
      "code": "opening_stats",
      "duration": 3,
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_20",
    "commentaryTags": [
      "special_ability",
      "normal",
      "20"
    ]
  },
  {
    "abilityKey": "ability:20:2",
    "abilityId": "20",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "警戒心",
    "image": "ability/20.png",
    "cost": {
      "power": 45,
      "tech": 55,
      "mental": 50,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "戦闘開始直後の判断力を高めます。 効果が強化されています。",
    "effect": {
      "code": "opening_stats",
      "duration": 4,
      "stats": {
        "mind": 2,
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_20",
    "commentaryTags": [
      "special_ability",
      "normal",
      "20"
    ]
  },
  {
    "abilityKey": "ability:21:1",
    "abilityId": "21",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "初動集中",
    "image": "ability/21.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 31,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "戦闘開始直後のエイムを上昇させます。",
    "effect": {
      "code": "opening_stats",
      "duration": 3,
      "stats": {
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_21",
    "commentaryTags": [
      "special_ability",
      "normal",
      "21"
    ]
  },
  {
    "abilityKey": "ability:21:2",
    "abilityId": "21",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "初動集中",
    "image": "ability/21.png",
    "cost": {
      "power": 45,
      "tech": 55,
      "mental": 55,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "戦闘開始直後のエイムを上昇させます。 効果が強化されています。",
    "effect": {
      "code": "opening_stats",
      "duration": 4,
      "stats": {
        "aim": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_21",
    "commentaryTags": [
      "special_ability",
      "normal",
      "21"
    ]
  },
  {
    "abilityKey": "ability:22:1",
    "abilityId": "22",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "平常心",
    "image": "ability/22.png",
    "cost": {
      "power": 25,
      "tech": 30,
      "mental": 34,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "マインドを常時上昇させます。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_22",
    "commentaryTags": [
      "special_ability",
      "normal",
      "22"
    ]
  },
  {
    "abilityKey": "ability:22:2",
    "abilityId": "22",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "平常心",
    "image": "ability/22.png",
    "cost": {
      "power": 45,
      "tech": 55,
      "mental": 56,
      "shoot": 70
    },
    "unlockConditions": [],
    "description": "マインドを常時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "mind": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_22",
    "commentaryTags": [
      "special_ability",
      "normal",
      "22"
    ]
  },
  {
    "abilityKey": "ability:23:1",
    "abilityId": "23",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "初動掌握",
    "image": "ability/23.png",
    "cost": {
      "power": 25,
      "tech": 35,
      "mental": 32,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "戦闘開始直後の射撃と技術を強化します。",
    "effect": {
      "code": "opening_stats",
      "duration": 3,
      "stats": {
        "aim": 1,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_23",
    "commentaryTags": [
      "special_ability",
      "normal",
      "23"
    ]
  },
  {
    "abilityKey": "ability:23:2",
    "abilityId": "23",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "初動掌握",
    "image": "ability/23.png",
    "cost": {
      "power": 45,
      "tech": 60,
      "mental": 56,
      "shoot": 70
    },
    "unlockConditions": [],
    "description": "戦闘開始直後の射撃と技術を強化します。 効果が強化されています。",
    "effect": {
      "code": "opening_stats",
      "duration": 5,
      "stats": {
        "aim": 2,
        "technique": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_23",
    "commentaryTags": [
      "special_ability",
      "normal",
      "23"
    ]
  },
  {
    "abilityKey": "ability:24:1",
    "abilityId": "24",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "弾薬収集",
    "image": "ability/24.png",
    "cost": {
      "power": 5,
      "tech": 30,
      "mental": 52,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "戦闘開始時に支援準備を早めます。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.08
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_24",
    "commentaryTags": [
      "special_ability",
      "normal",
      "24"
    ]
  },
  {
    "abilityKey": "ability:24:2",
    "abilityId": "24",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "弾薬収集",
    "image": "ability/24.png",
    "cost": {
      "power": 10,
      "tech": 50,
      "mental": 95,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "戦闘開始時に支援準備を早めます。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.2
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_24",
    "commentaryTags": [
      "special_ability",
      "normal",
      "24"
    ]
  },
  {
    "abilityKey": "ability:25:1",
    "abilityId": "25",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "戦場視察",
    "image": "ability/25.png",
    "cost": {
      "power": 5,
      "tech": 40,
      "mental": 50,
      "shoot": 25
    },
    "unlockConditions": [],
    "description": "反応速度と敵選択の判断を改善します。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.03,
      "lowHpTargetPriority": 0.05
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_25",
    "commentaryTags": [
      "special_ability",
      "normal",
      "25"
    ]
  },
  {
    "abilityKey": "ability:25:2",
    "abilityId": "25",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "戦場視察",
    "image": "ability/25.png",
    "cost": {
      "power": 10,
      "tech": 75,
      "mental": 85,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "反応速度と敵選択の判断を改善します。 効果が強化されています。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.07,
      "lowHpTargetPriority": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_25",
    "commentaryTags": [
      "special_ability",
      "normal",
      "25"
    ]
  },
  {
    "abilityKey": "ability:26:1",
    "abilityId": "26",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "回復指南",
    "image": "ability/26.png",
    "cost": {
      "power": 5,
      "tech": 30,
      "mental": 58,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "ドローン回復の効果を強化します。",
    "effect": {
      "code": "skill_heal_points",
      "skillId": "sup_drone_heal",
      "points": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_26",
    "commentaryTags": [
      "special_ability",
      "normal",
      "26"
    ]
  },
  {
    "abilityKey": "ability:26:2",
    "abilityId": "26",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "回復指南",
    "image": "ability/26.png",
    "cost": {
      "power": 10,
      "tech": 55,
      "mental": 95,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "ドローン回復の効果を強化します。 効果が強化されています。",
    "effect": {
      "code": "skill_heal_points",
      "skillId": "sup_drone_heal",
      "points": 3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_26",
    "commentaryTags": [
      "special_ability",
      "normal",
      "26"
    ]
  },
  {
    "abilityKey": "ability:27:1",
    "abilityId": "27",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "装填心得",
    "image": "ability/27.png",
    "cost": {
      "power": 25,
      "tech": 35,
      "mental": 36,
      "shoot": 40
    },
    "unlockConditions": [],
    "description": "各戦闘開始時のスキル準備を短縮します。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.14
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_27",
    "commentaryTags": [
      "special_ability",
      "normal",
      "27"
    ]
  },
  {
    "abilityKey": "ability:27:2",
    "abilityId": "27",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "装填心得",
    "image": "ability/27.png",
    "cost": {
      "power": 50,
      "tech": 60,
      "mental": 58,
      "shoot": 70
    },
    "unlockConditions": [],
    "description": "各戦闘開始時のスキル準備を短縮します。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_27",
    "commentaryTags": [
      "special_ability",
      "normal",
      "27"
    ]
  },
  {
    "abilityKey": "ability:28:1",
    "abilityId": "28",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "守備射撃",
    "image": "ability/28.png",
    "cost": {
      "power": 5,
      "tech": 30,
      "mental": 64,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "支援力と射撃精度を常時上昇させます。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "support": 1,
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_28",
    "commentaryTags": [
      "special_ability",
      "normal",
      "28"
    ]
  },
  {
    "abilityKey": "ability:28:2",
    "abilityId": "28",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "守備射撃",
    "image": "ability/28.png",
    "cost": {
      "power": 10,
      "tech": 55,
      "mental": 106,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "支援力と射撃精度を常時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "support": 2,
        "aim": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_28",
    "commentaryTags": [
      "special_ability",
      "normal",
      "28"
    ]
  },
  {
    "abilityKey": "ability:29:1",
    "abilityId": "29",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "援護疾走",
    "image": "ability/29.png",
    "cost": {
      "power": 5,
      "tech": 35,
      "mental": 57,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "回復した味方のアジリティを一時上昇させます。",
    "effect": {
      "code": "after_heal_target_stats",
      "duration": 2.5,
      "stats": {
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_29",
    "commentaryTags": [
      "special_ability",
      "normal",
      "29"
    ]
  },
  {
    "abilityKey": "ability:29:2",
    "abilityId": "29",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "援護疾走",
    "image": "ability/29.png",
    "cost": {
      "power": 10,
      "tech": 60,
      "mental": 101,
      "shoot": 60
    },
    "unlockConditions": [],
    "description": "回復した味方のアジリティを一時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "after_heal_target_stats",
      "duration": 4,
      "stats": {
        "agility": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_29",
    "commentaryTags": [
      "special_ability",
      "normal",
      "29"
    ]
  },
  {
    "abilityKey": "ability:30:1",
    "abilityId": "30",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "草隠戦法",
    "image": "ability/30.png",
    "cost": {
      "power": 5,
      "tech": 35,
      "mental": 60,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "煙幕系妨害の成功率と継続時間を強化します。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 1,
      "duration": 0.25
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_30",
    "commentaryTags": [
      "special_ability",
      "normal",
      "30"
    ]
  },
  {
    "abilityKey": "ability:30:2",
    "abilityId": "30",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "草隠戦法",
    "image": "ability/30.png",
    "cost": {
      "power": 10,
      "tech": 60,
      "mental": 106,
      "shoot": 60
    },
    "unlockConditions": [],
    "description": "煙幕系妨害の成功率と継続時間を強化します。 効果が強化されています。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 2,
      "duration": 0.55
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_30",
    "commentaryTags": [
      "special_ability",
      "normal",
      "30"
    ]
  },
  {
    "abilityKey": "ability:31:1",
    "abilityId": "31",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "終盤一撃",
    "image": "ability/31.png",
    "cost": {
      "power": 30,
      "tech": 40,
      "mental": 41,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "敵が残り1人の時、与えるダメージが上昇します。",
    "effect": {
      "code": "last_enemy_damage",
      "rate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_31",
    "commentaryTags": [
      "special_ability",
      "normal",
      "31"
    ]
  },
  {
    "abilityKey": "ability:31:2",
    "abilityId": "31",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "終盤一撃",
    "image": "ability/31.png",
    "cost": {
      "power": 55,
      "tech": 70,
      "mental": 68,
      "shoot": 80
    },
    "unlockConditions": [],
    "description": "敵が残り1人の時、与えるダメージが上昇します。 効果が強化されています。",
    "effect": {
      "code": "last_enemy_damage",
      "rate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_31",
    "commentaryTags": [
      "special_ability",
      "normal",
      "31"
    ]
  },
  {
    "abilityKey": "ability:32:1",
    "abilityId": "32",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "近距離戦",
    "image": "ability/32.png",
    "cost": {
      "power": 50,
      "tech": 30,
      "mental": 11,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "近距離戦でフィジカルとエイムが上昇します。",
    "effect": {
      "code": "range_bonus",
      "range": "close",
      "stats": {
        "physical": 1,
        "aim": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_32",
    "commentaryTags": [
      "special_ability",
      "normal",
      "32"
    ]
  },
  {
    "abilityKey": "ability:32:2",
    "abilityId": "32",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "近距離戦",
    "image": "ability/32.png",
    "cost": {
      "power": 85,
      "tech": 50,
      "mental": 27,
      "shoot": 85
    },
    "unlockConditions": [],
    "description": "近距離戦でフィジカルとエイムが上昇します。 効果が強化されています。",
    "effect": {
      "code": "range_bonus",
      "range": "close",
      "stats": {
        "physical": 2,
        "aim": 2
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_32",
    "commentaryTags": [
      "special_ability",
      "normal",
      "32"
    ]
  },
  {
    "abilityKey": "ability:33:1",
    "abilityId": "33",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "隠密行動",
    "image": "ability/33.png",
    "cost": {
      "power": 5,
      "tech": 35,
      "mental": 69,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "戦闘開始直後、味方全体の被ダメージを軽減します。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 2.5,
      "rate": 0.02
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_33",
    "commentaryTags": [
      "special_ability",
      "normal",
      "33"
    ]
  },
  {
    "abilityKey": "ability:33:2",
    "abilityId": "33",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "隠密行動",
    "image": "ability/33.png",
    "cost": {
      "power": 15,
      "tech": 65,
      "mental": 107,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "戦闘開始直後、味方全体の被ダメージを軽減します。 効果が強化されています。",
    "effect": {
      "code": "opening_team_guard",
      "duration": 4,
      "rate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_33",
    "commentaryTags": [
      "special_ability",
      "normal",
      "33"
    ]
  },
  {
    "abilityKey": "ability:34:1",
    "abilityId": "34",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "冷静指揮",
    "image": "ability/34.png",
    "cost": {
      "power": 5,
      "tech": 50,
      "mental": 62,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "指揮効果の時間を延ばし、効果中の被ダメージを軽減します。",
    "effect": {
      "code": "call_duration_guard",
      "duration": 0.35,
      "damageReduction": 0.015
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_34",
    "commentaryTags": [
      "special_ability",
      "normal",
      "34"
    ]
  },
  {
    "abilityKey": "ability:34:2",
    "abilityId": "34",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "冷静指揮",
    "image": "ability/34.png",
    "cost": {
      "power": 15,
      "tech": 90,
      "mental": 102,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "指揮効果の時間を延ばし、効果中の被ダメージを軽減します。 効果が強化されています。",
    "effect": {
      "code": "call_duration_guard",
      "duration": 0.75,
      "damageReduction": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_34",
    "commentaryTags": [
      "special_ability",
      "normal",
      "34"
    ]
  },
  {
    "abilityKey": "ability:35:1",
    "abilityId": "35",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "指揮判断",
    "image": "ability/35.png",
    "cost": {
      "power": 10,
      "tech": 50,
      "mental": 60,
      "shoot": 30
    },
    "unlockConditions": [],
    "description": "指揮判断を改善し、行動の遅れを減らします。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.04,
      "lowHpTargetPriority": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_35",
    "commentaryTags": [
      "special_ability",
      "normal",
      "35"
    ]
  },
  {
    "abilityKey": "ability:35:2",
    "abilityId": "35",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "指揮判断",
    "image": "ability/35.png",
    "cost": {
      "power": 15,
      "tech": 90,
      "mental": 107,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "指揮判断を改善し、行動の遅れを減らします。 効果が強化されています。",
    "effect": {
      "code": "ai_decision",
      "reactionReduction": 0.09,
      "lowHpTargetPriority": 0.09
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_35",
    "commentaryTags": [
      "special_ability",
      "normal",
      "35"
    ]
  },
  {
    "abilityKey": "ability:36:1",
    "abilityId": "36",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "自由歩行",
    "image": "ability/36.png",
    "cost": {
      "power": 55,
      "tech": 30,
      "mental": 13,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "得意距離での移動と技術を強化します。",
    "effect": {
      "code": "preferred_range_stats",
      "stats": {
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_36",
    "commentaryTags": [
      "special_ability",
      "normal",
      "36"
    ]
  },
  {
    "abilityKey": "ability:36:2",
    "abilityId": "36",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "自由歩行",
    "image": "ability/36.png",
    "cost": {
      "power": 95,
      "tech": 55,
      "mental": 23,
      "shoot": 95
    },
    "unlockConditions": [],
    "description": "得意距離での移動と技術を強化します。 効果が強化されています。",
    "effect": {
      "code": "preferred_range_stats",
      "stats": {
        "agility": 2,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_36",
    "commentaryTags": [
      "special_ability",
      "normal",
      "36"
    ]
  },
  {
    "abilityKey": "ability:37:1",
    "abilityId": "37",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "平常運転",
    "image": "ability/37.png",
    "cost": {
      "power": 35,
      "tech": 40,
      "mental": 41,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "戦闘開始時のスキルCTを安定して短縮します。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_37",
    "commentaryTags": [
      "special_ability",
      "normal",
      "37"
    ]
  },
  {
    "abilityKey": "ability:37:2",
    "abilityId": "37",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "IGL",
      "SUP"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "平常運転",
    "image": "ability/37.png",
    "cost": {
      "power": 60,
      "tech": 70,
      "mental": 75,
      "shoot": 85
    },
    "unlockConditions": [],
    "description": "戦闘開始時のスキルCTを安定して短縮します。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.22
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_37",
    "commentaryTags": [
      "special_ability",
      "normal",
      "37"
    ]
  },
  {
    "abilityKey": "ability:38:1",
    "abilityId": "38",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "SUP"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "俊敏開花",
    "image": "ability/38.png",
    "cost": {
      "power": 35,
      "tech": 40,
      "mental": 44,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "アジリティを中心に常時能力を強化します。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "agility": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_38",
    "commentaryTags": [
      "special_ability",
      "normal",
      "38"
    ]
  },
  {
    "abilityKey": "ability:38:2",
    "abilityId": "38",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "SUP"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "俊敏開花",
    "image": "ability/38.png",
    "cost": {
      "power": 60,
      "tech": 75,
      "mental": 71,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "アジリティを中心に常時能力を強化します。 効果が強化されています。",
    "effect": {
      "code": "always_stats",
      "stats": {
        "agility": 2,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_38",
    "commentaryTags": [
      "special_ability",
      "normal",
      "38"
    ]
  },
  {
    "abilityKey": "ability:39:1",
    "abilityId": "39",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 1,
    "maxStage": 2,
    "name": "高速装填",
    "image": "ability/39.png",
    "cost": {
      "power": 35,
      "tech": 45,
      "mental": 45,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "全スキルの初期CTを大きく短縮します。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.18
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_39",
    "commentaryTags": [
      "special_ability",
      "normal",
      "39"
    ]
  },
  {
    "abilityKey": "ability:39:2",
    "abilityId": "39",
    "color": "blue",
    "rarity": "normal",
    "roles": [
      "ATK",
      "IGL",
      "SUP"
    ],
    "target": "COMMON",
    "stage": 2,
    "maxStage": 2,
    "name": "高速装填",
    "image": "ability/39.png",
    "cost": {
      "power": 65,
      "tech": 80,
      "mental": 75,
      "shoot": 95
    },
    "unlockConditions": [],
    "description": "全スキルの初期CTを大きく短縮します。 効果が強化されています。",
    "effect": {
      "code": "battle_start_all_ct",
      "seconds": 0.38
    },
    "stackRule": "replace_lower_stage",
    "priority": 100,
    "visualEffectId": "special_ability_39",
    "commentaryTags": [
      "special_ability",
      "normal",
      "39"
    ]
  },
  {
    "abilityKey": "ability:40:1",
    "abilityId": "40",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "心眼開放",
    "image": "ability/40.png",
    "cost": {
      "power": 10,
      "tech": 65,
      "mental": 70,
      "shoot": 35
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中と威力を大きく強化します。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 2,
      "damageRate": 0.025
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_40",
    "commentaryTags": [
      "special_ability",
      "gold",
      "40"
    ]
  },
  {
    "abilityKey": "ability:40:2",
    "abilityId": "40",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "心眼開放",
    "image": "ability/40.png",
    "cost": {
      "power": 15,
      "tech": 110,
      "mental": 125,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "攻撃スキルの命中と威力を大きく強化します。 効果が強化されています。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 4,
      "damageRate": 0.05
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_40",
    "commentaryTags": [
      "special_ability",
      "gold",
      "40"
    ]
  },
  {
    "abilityKey": "ability:41:1",
    "abilityId": "41",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "一撃葬送",
    "image": "ability/41.png",
    "cost": {
      "power": 65,
      "tech": 40,
      "mental": 18,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "敵が残り1人の時、防御を貫く大ダメージを与えます。",
    "effect": {
      "code": "last_enemy_break",
      "damageRate": 0.06,
      "pierceRate": 0.04
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_41",
    "commentaryTags": [
      "special_ability",
      "gold",
      "41"
    ]
  },
  {
    "abilityKey": "ability:41:2",
    "abilityId": "41",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "一撃葬送",
    "image": "ability/41.png",
    "cost": {
      "power": 115,
      "tech": 65,
      "mental": 34,
      "shoot": 115
    },
    "unlockConditions": [],
    "description": "敵が残り1人の時、防御を貫く大ダメージを与えます。 効果が強化されています。",
    "effect": {
      "code": "last_enemy_break",
      "damageRate": 0.11,
      "pierceRate": 0.08
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_41",
    "commentaryTags": [
      "special_ability",
      "gold",
      "41"
    ]
  },
  {
    "abilityKey": "ability:42:1",
    "abilityId": "42",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "神速反応",
    "image": "ability/42.png",
    "cost": {
      "power": 10,
      "tech": 50,
      "mental": 86,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "SUP専用スキルのCTを大きく短縮します。",
    "effect": {
      "code": "support_skill_base_ct",
      "seconds": 0.3
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_42",
    "commentaryTags": [
      "special_ability",
      "gold",
      "42"
    ]
  },
  {
    "abilityKey": "ability:42:2",
    "abilityId": "42",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "神速反応",
    "image": "ability/42.png",
    "cost": {
      "power": 15,
      "tech": 85,
      "mental": 158,
      "shoot": 85
    },
    "unlockConditions": [],
    "description": "SUP専用スキルのCTを大きく短縮します。 効果が強化されています。",
    "effect": {
      "code": "support_skill_base_ct",
      "seconds": 0.55
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_42",
    "commentaryTags": [
      "special_ability",
      "gold",
      "42"
    ]
  },
  {
    "abilityKey": "ability:43:1",
    "abilityId": "43",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "光速装填",
    "image": "ability/43.png",
    "cost": {
      "power": 70,
      "tech": 40,
      "mental": 24,
      "shoot": 70
    },
    "unlockConditions": [],
    "description": "短い攻撃スキルのCTをさらに短縮します。",
    "effect": {
      "code": "shorter_attack_skill_ct",
      "seconds": 0.25
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_43",
    "commentaryTags": [
      "special_ability",
      "gold",
      "43"
    ]
  },
  {
    "abilityKey": "ability:43:2",
    "abilityId": "43",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "光速装填",
    "image": "ability/43.png",
    "cost": {
      "power": 125,
      "tech": 70,
      "mental": 37,
      "shoot": 125
    },
    "unlockConditions": [],
    "description": "短い攻撃スキルのCTをさらに短縮します。 効果が強化されています。",
    "effect": {
      "code": "shorter_attack_skill_ct",
      "seconds": 0.5
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_43",
    "commentaryTags": [
      "special_ability",
      "gold",
      "43"
    ]
  },
  {
    "abilityKey": "ability:44:1",
    "abilityId": "44",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "幽鬼進撃",
    "image": "ability/44.png",
    "cost": {
      "power": 10,
      "tech": 55,
      "mental": 92,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "妨害の成功率と継続時間を大きく強化します。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 2,
      "duration": 0.65
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_44",
    "commentaryTags": [
      "special_ability",
      "gold",
      "44"
    ]
  },
  {
    "abilityKey": "ability:44:2",
    "abilityId": "44",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "幽鬼進撃",
    "image": "ability/44.png",
    "cost": {
      "power": 20,
      "tech": 95,
      "mental": 161,
      "shoot": 95
    },
    "unlockConditions": [],
    "description": "妨害の成功率と継続時間を大きく強化します。 効果が強化されています。",
    "effect": {
      "code": "smoke_debuff",
      "successPoints": 4,
      "duration": 1.1
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_44",
    "commentaryTags": [
      "special_ability",
      "gold",
      "44"
    ]
  },
  {
    "abilityKey": "ability:45:1",
    "abilityId": "45",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "第三心眼",
    "image": "ability/45.png",
    "cost": {
      "power": 10,
      "tech": 75,
      "mental": 90,
      "shoot": 45
    },
    "unlockConditions": [],
    "description": "重要な敵を見抜き、味方全体の集中攻撃を促します。",
    "effect": {
      "code": "mark_target",
      "duration": 3.5,
      "targetPriority": 0.16,
      "teamDamageRate": 0.025
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_45",
    "commentaryTags": [
      "special_ability",
      "gold",
      "45"
    ]
  },
  {
    "abilityKey": "ability:45:2",
    "abilityId": "45",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "第三心眼",
    "image": "ability/45.png",
    "cost": {
      "power": 20,
      "tech": 135,
      "mental": 155,
      "shoot": 75
    },
    "unlockConditions": [],
    "description": "重要な敵を見抜き、味方全体の集中攻撃を促します。 効果が強化されています。",
    "effect": {
      "code": "mark_target",
      "duration": 5,
      "targetPriority": 0.28,
      "teamDamageRate": 0.05
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_45",
    "commentaryTags": [
      "special_ability",
      "gold",
      "45"
    ]
  },
  {
    "abilityKey": "ability:46:1",
    "abilityId": "46",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "黒鉄防壁",
    "image": "ability/46.png",
    "cost": {
      "power": 10,
      "tech": 55,
      "mental": 108,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "常時受けるダメージを大きく軽減します。",
    "effect": {
      "code": "always_offense_defense",
      "damageRate": 0,
      "damageReduction": 0.035
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_46",
    "commentaryTags": [
      "special_ability",
      "gold",
      "46"
    ]
  },
  {
    "abilityKey": "ability:46:2",
    "abilityId": "46",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "黒鉄防壁",
    "image": "ability/46.png",
    "cost": {
      "power": 20,
      "tech": 100,
      "mental": 179,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "常時受けるダメージを大きく軽減します。 効果が強化されています。",
    "effect": {
      "code": "always_offense_defense",
      "damageRate": 0.015,
      "damageReduction": 0.065
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_46",
    "commentaryTags": [
      "special_ability",
      "gold",
      "46"
    ]
  },
  {
    "abilityKey": "ability:47:1",
    "abilityId": "47",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "黒弾覚醒",
    "image": "ability/47.png",
    "cost": {
      "power": 85,
      "tech": 45,
      "mental": 21,
      "shoot": 85
    },
    "unlockConditions": [],
    "description": "攻撃スキルの威力と防御貫通を強化します。",
    "effect": {
      "code": "legend_gunner",
      "damageRate": 0.045,
      "pierceRate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_47",
    "commentaryTags": [
      "special_ability",
      "gold",
      "47"
    ]
  },
  {
    "abilityKey": "ability:47:2",
    "abilityId": "47",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "黒弾覚醒",
    "image": "ability/47.png",
    "cost": {
      "power": 145,
      "tech": 85,
      "mental": 38,
      "shoot": 145
    },
    "unlockConditions": [],
    "description": "攻撃スキルの威力と防御貫通を強化します。 効果が強化されています。",
    "effect": {
      "code": "legend_gunner",
      "damageRate": 0.08,
      "pierceRate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_47",
    "commentaryTags": [
      "special_ability",
      "gold",
      "47"
    ]
  },
  {
    "abilityKey": "ability:48:1",
    "abilityId": "48",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "戦鬼覚醒",
    "image": "ability/48.png",
    "cost": {
      "power": 10,
      "tech": 85,
      "mental": 99,
      "shoot": 50
    },
    "unlockConditions": [],
    "description": "戦闘開始時、味方全体を強力に指揮します。",
    "effect": {
      "code": "legend_command",
      "allSkillCtReduction": 0.18,
      "duration": 3.5,
      "teamStats": {
        "mind": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_48",
    "commentaryTags": [
      "special_ability",
      "gold",
      "48"
    ]
  },
  {
    "abilityKey": "ability:48:2",
    "abilityId": "48",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "戦鬼覚醒",
    "image": "ability/48.png",
    "cost": {
      "power": 20,
      "tech": 150,
      "mental": 172,
      "shoot": 85
    },
    "unlockConditions": [],
    "description": "戦闘開始時、味方全体を強力に指揮します。 効果が強化されています。",
    "effect": {
      "code": "legend_command",
      "allSkillCtReduction": 0.36,
      "duration": 5,
      "teamStats": {
        "mind": 2,
        "technique": 1
      }
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_48",
    "commentaryTags": [
      "special_ability",
      "gold",
      "48"
    ]
  },
  {
    "abilityKey": "ability:49:1",
    "abilityId": "49",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "命運支配",
    "image": "ability/49.png",
    "cost": {
      "power": 15,
      "tech": 65,
      "mental": 107,
      "shoot": 65
    },
    "unlockConditions": [],
    "description": "危険な味方への回復効果を大きく強化します。",
    "effect": {
      "code": "critical_ally_heal",
      "hpRate": 0.3,
      "points": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_49",
    "commentaryTags": [
      "special_ability",
      "gold",
      "49"
    ]
  },
  {
    "abilityKey": "ability:49:2",
    "abilityId": "49",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "命運支配",
    "image": "ability/49.png",
    "cost": {
      "power": 20,
      "tech": 110,
      "mental": 201,
      "shoot": 110
    },
    "unlockConditions": [],
    "description": "危険な味方への回復効果を大きく強化します。 効果が強化されています。",
    "effect": {
      "code": "critical_ally_heal",
      "hpRate": 0.4,
      "points": 4
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_49",
    "commentaryTags": [
      "special_ability",
      "gold",
      "49"
    ]
  },
  {
    "abilityKey": "ability:50:1",
    "abilityId": "50",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "零秒射撃",
    "image": "ability/50.png",
    "cost": {
      "power": 90,
      "tech": 50,
      "mental": 30,
      "shoot": 90
    },
    "unlockConditions": [],
    "description": "攻撃スキルの初弾性能を大きく強化します。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 3,
      "damageRate": 0.035
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_50",
    "commentaryTags": [
      "special_ability",
      "gold",
      "50"
    ]
  },
  {
    "abilityKey": "ability:50:2",
    "abilityId": "50",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "零秒射撃",
    "image": "ability/50.png",
    "cost": {
      "power": 160,
      "tech": 90,
      "mental": 45,
      "shoot": 160
    },
    "unlockConditions": [],
    "description": "攻撃スキルの初弾性能を大きく強化します。 効果が強化されています。",
    "effect": {
      "code": "attack_skill_accuracy_damage",
      "accuracyPoints": 5,
      "damageRate": 0.065
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_50",
    "commentaryTags": [
      "special_ability",
      "gold",
      "50"
    ]
  },
  {
    "abilityKey": "ability:51:1",
    "abilityId": "51",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "天眼照準",
    "image": "ability/51.png",
    "cost": {
      "power": 15,
      "tech": 95,
      "mental": 103,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "敵の弱点を見抜き、味方の集中攻撃を強化します。",
    "effect": {
      "code": "mark_target",
      "duration": 4,
      "targetPriority": 0.2,
      "teamDamageRate": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_51",
    "commentaryTags": [
      "special_ability",
      "gold",
      "51"
    ]
  },
  {
    "abilityKey": "ability:51:2",
    "abilityId": "51",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "天眼照準",
    "image": "ability/51.png",
    "cost": {
      "power": 25,
      "tech": 165,
      "mental": 184,
      "shoot": 95
    },
    "unlockConditions": [],
    "description": "敵の弱点を見抜き、味方の集中攻撃を強化します。 効果が強化されています。",
    "effect": {
      "code": "mark_target",
      "duration": 6,
      "targetPriority": 0.34,
      "teamDamageRate": 0.06
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_51",
    "commentaryTags": [
      "special_ability",
      "gold",
      "51"
    ]
  },
  {
    "abilityKey": "ability:52:1",
    "abilityId": "52",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 1,
    "maxStage": 2,
    "name": "支援仙人",
    "image": "ability/52.png",
    "cost": {
      "power": 15,
      "tech": 70,
      "mental": 121,
      "shoot": 70
    },
    "unlockConditions": [],
    "description": "蘇生HPとSUP専用スキルの回転を強化します。",
    "effect": {
      "code": "legend_support",
      "reviveRate": 0.34,
      "supportSkillCtReduction": 0.2
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_52",
    "commentaryTags": [
      "special_ability",
      "gold",
      "52"
    ]
  },
  {
    "abilityKey": "ability:52:2",
    "abilityId": "52",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "SUP"
    ],
    "target": "SUP",
    "stage": 2,
    "maxStage": 2,
    "name": "支援仙人",
    "image": "ability/52.png",
    "cost": {
      "power": 25,
      "tech": 120,
      "mental": 218,
      "shoot": 120
    },
    "unlockConditions": [],
    "description": "蘇生HPとSUP専用スキルの回転を強化します。 効果が強化されています。",
    "effect": {
      "code": "legend_support",
      "reviveRate": 0.38,
      "supportSkillCtReduction": 0.42
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_52",
    "commentaryTags": [
      "special_ability",
      "gold",
      "52"
    ]
  },
  {
    "abilityKey": "ability:53:1",
    "abilityId": "53",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 1,
    "maxStage": 2,
    "name": "天空視野",
    "image": "ability/53.png",
    "cost": {
      "power": 15,
      "tech": 100,
      "mental": 114,
      "shoot": 55
    },
    "unlockConditions": [],
    "description": "最大HPと全能力を常時上昇させます。",
    "effect": {
      "code": "always_hp_all_stats",
      "maxHp": 20,
      "allStats": 1
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_53",
    "commentaryTags": [
      "special_ability",
      "gold",
      "53"
    ]
  },
  {
    "abilityKey": "ability:53:2",
    "abilityId": "53",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "IGL"
    ],
    "target": "IGL",
    "stage": 2,
    "maxStage": 2,
    "name": "天空視野",
    "image": "ability/53.png",
    "cost": {
      "power": 25,
      "tech": 175,
      "mental": 197,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "最大HPと全能力を常時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "always_hp_all_stats",
      "maxHp": 45,
      "allStats": 2
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_53",
    "commentaryTags": [
      "special_ability",
      "gold",
      "53"
    ]
  },
  {
    "abilityKey": "ability:54:1",
    "abilityId": "54",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 1,
    "maxStage": 2,
    "name": "本能開放",
    "image": "ability/54.png",
    "cost": {
      "power": 100,
      "tech": 60,
      "mental": 32,
      "shoot": 100
    },
    "unlockConditions": [],
    "description": "攻撃力と耐久力を常時上昇させます。",
    "effect": {
      "code": "always_offense_defense",
      "damageRate": 0.035,
      "damageReduction": 0.015
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_54",
    "commentaryTags": [
      "special_ability",
      "gold",
      "54"
    ]
  },
  {
    "abilityKey": "ability:54:2",
    "abilityId": "54",
    "color": "gold",
    "rarity": "gold",
    "roles": [
      "ATK"
    ],
    "target": "ATK",
    "stage": 2,
    "maxStage": 2,
    "name": "本能開放",
    "image": "ability/54.png",
    "cost": {
      "power": 180,
      "tech": 100,
      "mental": 51,
      "shoot": 180
    },
    "unlockConditions": [],
    "description": "攻撃力と耐久力を常時上昇させます。 効果が強化されています。",
    "effect": {
      "code": "always_offense_defense",
      "damageRate": 0.07,
      "damageReduction": 0.03
    },
    "stackRule": "replace_lower_stage",
    "priority": 140,
    "visualEffectId": "special_ability_54",
    "commentaryTags": [
      "special_ability",
      "gold",
      "54"
    ]
  }
]
);

export const SPECIAL_ABILITIES = SPECIAL_ABILITY_STAGE_MASTER;
export const SPECIAL_ABILITY_FAMILIES = deepFreeze(
  SPECIAL_ABILITIES.filter((entry) => entry.stage === 1),
);
export const NORMAL_SPECIAL_ABILITIES = deepFreeze(
  SPECIAL_ABILITY_FAMILIES.filter((entry) => entry.rarity === "normal"),
);
export const GOLD_SPECIAL_ABILITIES = deepFreeze(
  SPECIAL_ABILITY_FAMILIES.filter((entry) => entry.rarity === "gold"),
);

const byKey = new Map(
  SPECIAL_ABILITIES.map((entry) => [entry.abilityKey, entry]),
);
const familyStageOne = new Map(
  SPECIAL_ABILITIES
    .filter((entry) => entry.stage === 1)
    .map((entry) => [entry.abilityId, entry]),
);

export function getSpecialAbility(abilityKey) {
  const value = byKey.get(abilityKey);
  if (!value) throw new RangeError(`Unknown special ability: ${abilityKey}`);
  return value;
}

export function getSpecialAbilityStage(abilityId, stage) {
  return getSpecialAbility(`ability:${String(abilityId).padStart(2, "0")}:${stage}`);
}

export function getSpecialAbilitiesForRole(role, color = null) {
  if (!["IGL", "ATK", "SUP"].includes(role)) {
    throw new RangeError(`Invalid role: ${role}`);
  }
  const normalizedColor =
    color === "normal" ? "blue" :
    color === "blue" || color === "gold" ? color : null;
  return deepFreeze(
    [...familyStageOne.values()].filter(
      (ability) =>
        ability.roles.includes(role) &&
        (normalizedColor === null || ability.color === normalizedColor),
    ),
  );
}

export function normalizeGeneration50SpecialAbilities(entries, role) {
  const source = Array.isArray(entries) ? entries : [];
  const result = [];
  const used = new Set();
  for (const entry of source) {
    const family = [...familyStageOne.values()].find(
      (candidate) =>
        candidate.roles.includes(role) &&
        (
          candidate.name === entry?.name ||
          candidate.abilityId === entry?.abilityId ||
          candidate.abilityKey === entry?.abilityKey
        ),
    );
    if (!family || used.has(family.abilityId)) continue;
    const stage = Number(entry?.stage) >= 2 ? 2 : 1;
    const master = getSpecialAbilityStage(family.abilityId, stage);
    result.push({
      abilityKey: master.abilityKey,
      abilityId: master.abilityId,
      color: master.color,
      rarity: master.rarity,
      stage: master.stage,
      name: master.name,
      image: master.image,
      description: master.description,
      effectType: master.effect.code,
      effectValue: master.effect,
      target: master.target,
      roles: master.roles,
      stackRule: master.stackRule,
      priority: master.priority,
      visualEffectId: master.visualEffectId,
      commentaryTags: master.commentaryTags,
      learnedAt: entry?.learnedAt ?? new Date(0).toISOString(),
    });
    used.add(family.abilityId);
  }
  return result;
}

export function validateSpecialAbility50Master() {
  const families = new Map();
  for (const ability of SPECIAL_ABILITIES) {
    const stages = families.get(ability.abilityId) ?? [];
    stages.push(ability.stage);
    families.set(ability.abilityId, stages);
    if (!ability.roles.length || !ability.roles.every((role) => ["IGL","ATK","SUP"].includes(role))) {
      throw new Error(`Invalid roles: ${ability.abilityKey}`);
    }
    if (!/^ability\/\d{2}\.png$/.test(ability.image)) {
      throw new Error(`Invalid ability image: ${ability.abilityKey}`);
    }
  }
  if (families.size !== 54 || SPECIAL_ABILITIES.length !== 108) {
    throw new Error("Generation 50 special ability count mismatch.");
  }
  for (const [id, stages] of families) {
    if (stages.length !== 2 || !stages.includes(1) || !stages.includes(2)) {
      throw new Error(`Invalid stages: ${id}`);
    }
  }
  return Object.freeze({
    familyCount: families.size,
    stageCount: SPECIAL_ABILITIES.length,
    normalFamilyCount: 39,
    goldFamilyCount: 15,
    valid: true,
  });
}
