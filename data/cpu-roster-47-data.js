/**
 * MOB BR Generation 47 CPU roster.
 *
 * - Twenty former pro teams move to the Denden Cup roster as D1-D20.
 * - Twenty new LN/NN/WN teams occupy the vacated formal-pro slots.
 * - Denden teams retain their existing artwork paths but receive new logical IDs.
 * - New pro teams use Local/LN**, National/NN**, World/WN** artwork paths.
 */

import {
  LOCAL_CPU_TEAMS as LEGACY_LOCAL_CPU_TEAMS,
} from "./cpu-local-data.js";
import {
  NATIONAL_CPU_TEAMS as LEGACY_NATIONAL_CPU_TEAMS,
} from "./cpu-national-data.js";
import {
  WORLD_CPU_ALL_TEAMS as LEGACY_WORLD_CPU_TEAMS,
} from "./cpu-world-data.js";

export const CPU_ROSTER_47_DATA_VERSION =
  "mobbr-cpu-roster-47-1.0.0";

function deepFreeze(value) {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export const DENDEN_TEAM_SOURCE_MAP =
  deepFreeze([
  {
    "dendenTeamId": "D1",
    "legacyTeamId": "L11",
    "slumpRank": "F3",
    "normalRank": "F6",
    "hotRank": "E2",
    "host": false
  },
  {
    "dendenTeamId": "D2",
    "legacyTeamId": "L12",
    "slumpRank": "F2",
    "normalRank": "F4",
    "hotRank": "E4",
    "host": false
  },
  {
    "dendenTeamId": "D3",
    "legacyTeamId": "L13",
    "slumpRank": "F1",
    "normalRank": "F3",
    "hotRank": "F6",
    "host": false
  },
  {
    "dendenTeamId": "D4",
    "legacyTeamId": "L15",
    "slumpRank": "F5",
    "normalRank": "F7",
    "hotRank": "E1",
    "host": false
  },
  {
    "dendenTeamId": "D5",
    "legacyTeamId": "L16",
    "slumpRank": "F6",
    "normalRank": "F8",
    "hotRank": "E2",
    "host": false
  },
  {
    "dendenTeamId": "D6",
    "legacyTeamId": "L17",
    "slumpRank": "F7",
    "normalRank": "F9",
    "hotRank": "E1",
    "host": false
  },
  {
    "dendenTeamId": "D7",
    "legacyTeamId": "L18",
    "slumpRank": "F9",
    "normalRank": "E1",
    "hotRank": "E3",
    "host": false
  },
  {
    "dendenTeamId": "D8",
    "legacyTeamId": "L19",
    "slumpRank": "F8",
    "normalRank": "E3",
    "hotRank": "E8",
    "host": false
  },
  {
    "dendenTeamId": "D9",
    "legacyTeamId": "L20",
    "slumpRank": "E3",
    "normalRank": "E6",
    "hotRank": "D1",
    "host": false
  },
  {
    "dendenTeamId": "D10",
    "legacyTeamId": "N11",
    "slumpRank": "E3",
    "normalRank": "E5",
    "hotRank": "D2",
    "host": false
  },
  {
    "dendenTeamId": "D11",
    "legacyTeamId": "N12",
    "slumpRank": "E3",
    "normalRank": "E6",
    "hotRank": "D2",
    "host": false
  },
  {
    "dendenTeamId": "D12",
    "legacyTeamId": "N13",
    "slumpRank": "E1",
    "normalRank": "E9",
    "hotRank": "D3",
    "host": false
  },
  {
    "dendenTeamId": "D13",
    "legacyTeamId": "N20",
    "slumpRank": "E3",
    "normalRank": "E6",
    "hotRank": "D2",
    "host": false
  },
  {
    "dendenTeamId": "D14",
    "legacyTeamId": "N21",
    "slumpRank": "E1",
    "normalRank": "D1",
    "hotRank": "D1",
    "host": false
  },
  {
    "dendenTeamId": "D15",
    "legacyTeamId": "N25",
    "slumpRank": "F7",
    "normalRank": "F9",
    "hotRank": "D4",
    "host": false
  },
  {
    "dendenTeamId": "D16",
    "legacyTeamId": "N26",
    "slumpRank": "E2",
    "normalRank": "E3",
    "hotRank": "E4",
    "host": false
  },
  {
    "dendenTeamId": "D17",
    "legacyTeamId": "W15",
    "slumpRank": "E9",
    "normalRank": "D3",
    "hotRank": "D6",
    "host": false
  },
  {
    "dendenTeamId": "D18",
    "legacyTeamId": "W20",
    "slumpRank": "F9",
    "normalRank": "E6",
    "hotRank": "E9",
    "host": false
  },
  {
    "dendenTeamId": "D19",
    "legacyTeamId": "W25",
    "slumpRank": "D1",
    "normalRank": "D6",
    "hotRank": "C2",
    "host": false
  },
  {
    "dendenTeamId": "D20",
    "legacyTeamId": "W27",
    "slumpRank": "D3",
    "normalRank": "C6",
    "hotRank": "SS2",
    "host": true
  }
]);

export const PRO_TEAM_REPLACEMENT_SPECS =
  deepFreeze([
  {
    "teamId": "LN11",
    "legacyTeamId": "L11",
    "league": "local",
    "leagueSlot": 11,
    "name": "ブイアールカンパニー",
    "description": "上位に食い込むことは多いが、決定力に欠けるチーム。",
    "teamTrait": "placement_control",
    "ranks": {
      "slump": [
        "E2",
        "E5"
      ],
      "normal": [
        "E7",
        "D3"
      ],
      "hot": [
        "D5",
        "C3"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブワーハイ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 3,
          "technique": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブランケ―",
        "preferredRange": "mid",
        "statBias": {
          "aim": 2,
          "physical": 1
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブブイアール",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "mind": 2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN12",
    "legacyTeamId": "L12",
    "league": "local",
    "leagueSlot": 12,
    "name": "ピッグスリーズ",
    "description": "初動ファイトに特化したチーム。",
    "teamTrait": "opening_fight",
    "ranks": {
      "slump": [
        "E1",
        "E5"
      ],
      "normal": [
        "E6",
        "D2"
      ],
      "hot": [
        "D4",
        "C2"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブコブタ",
        "preferredRange": "close",
        "statBias": {
          "mind": 2,
          "agility": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブピッグ",
        "preferredRange": "close",
        "statBias": {
          "aim": 4,
          "agility": 4,
          "physical": 3,
          "stamina": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブピーゾー",
        "preferredRange": "mid",
        "statBias": {
          "support": 2,
          "agility": 2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN13",
    "legacyTeamId": "L13",
    "league": "local",
    "leagueSlot": 13,
    "name": "ウォールストリート",
    "description": "可もなく不可もなく、全体のバランスを重視するチーム。",
    "teamTrait": "balanced",
    "ranks": {
      "slump": [
        "F9",
        "E4"
      ],
      "normal": [
        "E5",
        "D1"
      ],
      "hot": [
        "D2",
        "D7"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブルー",
        "preferredRange": "mid",
        "statBias": {
          "mind": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブウォー",
        "preferredRange": "close",
        "statBias": {
          "physical": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブスー",
        "preferredRange": "far",
        "statBias": {
          "support": 2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN15",
    "legacyTeamId": "L15",
    "league": "local",
    "leagueSlot": 15,
    "name": "ソラアマガッパ",
    "description": "ムラがあるが、調子が良ければそこそこ強いチーム。",
    "teamTrait": "high_variance",
    "ranks": {
      "slump": [
        "F8",
        "E5"
      ],
      "normal": [
        "E6",
        "D3"
      ],
      "hot": [
        "D6",
        "C4"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブナガッツ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 3,
          "agility": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブクモリ",
        "preferredRange": "close",
        "statBias": {
          "aim": 3,
          "agility": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブタマリ",
        "preferredRange": "far",
        "statBias": {
          "support": 3,
          "agility": 2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN16",
    "legacyTeamId": "L16",
    "league": "local",
    "leagueSlot": 16,
    "name": "ナインティーズ",
    "description": "ローカルではかなりの実力派。妨害とテンポ操作を得意とする。",
    "teamTrait": "ct_disruption",
    "ranks": {
      "slump": [
        "E8",
        "D3"
      ],
      "normal": [
        "D5",
        "C3"
      ],
      "hot": [
        "C5",
        "B3"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブロスキ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 4,
          "technique": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブスリッキー",
        "preferredRange": "close",
        "statBias": {
          "aim": 5,
          "agility": 4,
          "technique": 5
        },
        "uniqueSkillIds": [
          "air_ninety",
          null,
          null
        ]
      },
      {
        "role": "SUP",
        "name": "モブスピン",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "mind": 2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN17",
    "legacyTeamId": "L17",
    "league": "local",
    "leagueSlot": 17,
    "name": "フレッシュコドラクルー",
    "description": "火力が高く、やられる前にやることを信条とするチーム。",
    "teamTrait": "glass_cannon",
    "ranks": {
      "slump": [
        "E5",
        "D2"
      ],
      "normal": [
        "D4",
        "C2"
      ],
      "hot": [
        "C4",
        "B2"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブブルコドラ",
        "preferredRange": "close",
        "statBias": {
          "mind": 2,
          "physical": 3,
          "stamina": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブコドラ",
        "preferredRange": "close",
        "statBias": {
          "aim": 5,
          "physical": 6,
          "agility": 3,
          "stamina": -3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブグリコドラ",
        "preferredRange": "mid",
        "statBias": {
          "support": 2,
          "physical": 3,
          "stamina": -2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN18",
    "legacyTeamId": "L18",
    "league": "local",
    "leagueSlot": 18,
    "name": "トライデントアール",
    "description": "中距離に特化した戦いを好むチーム。",
    "teamTrait": "mid_range_specialist",
    "ranks": {
      "slump": [
        "E6",
        "D2"
      ],
      "normal": [
        "D4",
        "C2"
      ],
      "hot": [
        "C3",
        "B1"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブペンタ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 3,
          "technique": 4,
          "aim": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブカーブ",
        "preferredRange": "mid",
        "statBias": {
          "aim": 4,
          "technique": 4
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブクーゲ",
        "preferredRange": "mid",
        "statBias": {
          "support": 3,
          "technique": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN19",
    "legacyTeamId": "L19",
    "league": "local",
    "leagueSlot": 19,
    "name": "イレブンショット",
    "description": "全距離を得意とし、目まぐるしく動いて相手をかく乱するナショナル常連チーム。",
    "teamTrait": "all_range_rotation",
    "ranks": {
      "slump": [
        "D5",
        "C3"
      ],
      "normal": [
        "C5",
        "B3"
      ],
      "hot": [
        "B5",
        "A2"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブベロ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 4,
          "agility": 5,
          "technique": 4
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブショット",
        "preferredRange": "close",
        "statBias": {
          "aim": 5,
          "agility": 5,
          "technique": 4
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブカミュ",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "agility": 5,
          "technique": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "LN20",
    "legacyTeamId": "L20",
    "league": "local",
    "leagueSlot": 20,
    "name": "ゴーグルソルジャーズ",
    "description": "安定感のあるチームだが、火力不足が課題。",
    "teamTrait": "stable_low_damage",
    "ranks": {
      "slump": [
        "E3",
        "E9"
      ],
      "normal": [
        "D1",
        "D7"
      ],
      "hot": [
        "D8",
        "C5"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブサングラ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 4,
          "stamina": 3,
          "physical": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブゴーグル",
        "preferredRange": "mid",
        "statBias": {
          "aim": 1,
          "stamina": 3,
          "physical": -3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブアイグル",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "stamina": 4,
          "physical": -2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN11",
    "legacyTeamId": "N11",
    "league": "national",
    "leagueSlot": 11,
    "name": "グラディウスシュート",
    "description": "ATKのグラディモブは世界大会MVP経験者。ナショナルNo.1 ATKを擁する。",
    "teamTrait": "ace_atk",
    "ranks": {
      "slump": [
        "B8",
        "A5"
      ],
      "normal": [
        "A3",
        "S2"
      ],
      "hot": [
        "S5",
        "SS2"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "ソルジャモブ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 5,
          "technique": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "グラディモブ",
        "preferredRange": "close",
        "statBias": {
          "aim": 8,
          "physical": 7,
          "technique": 6,
          "agility": 4
        },
        "uniqueSkillIds": [],
        "ranks": {
          "slump": [
            "A5",
            "S2"
          ],
          "normal": [
            "S2",
            "SS1"
          ],
          "hot": [
            "SS3",
            "MOB"
          ]
        }
      },
      {
        "role": "SUP",
        "name": "ジンズモブ",
        "preferredRange": "far",
        "statBias": {
          "support": 5,
          "mind": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN12",
    "legacyTeamId": "N12",
    "league": "national",
    "leagueSlot": 12,
    "name": "ネコクーブラザーズ",
    "description": "非常に人気があり、安定感も高い。世界大会での活躍が期待される。",
    "teamTrait": "stable_popular",
    "ranks": {
      "slump": [
        "B3",
        "A1"
      ],
      "normal": [
        "B8",
        "A8"
      ],
      "hot": [
        "S1",
        "S8"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブアニネコクー",
        "preferredRange": "mid",
        "statBias": {
          "mind": 5,
          "stamina": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブネコクー",
        "preferredRange": "close",
        "statBias": {
          "aim": 4,
          "physical": 4,
          "stamina": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブアネネコクー",
        "preferredRange": "far",
        "statBias": {
          "support": 6,
          "mind": 3,
          "stamina": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN13",
    "legacyTeamId": "N13",
    "league": "national",
    "leagueSlot": 13,
    "name": "オールドスタイルモブロック",
    "description": "地味だが崩れにくく、安定感のあるチーム。",
    "teamTrait": "old_style_stable",
    "ranks": {
      "slump": [
        "C8",
        "B6"
      ],
      "normal": [
        "B2",
        "A2"
      ],
      "hot": [
        "A5",
        "S3"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブレトイエロー",
        "preferredRange": "mid",
        "statBias": {
          "mind": 5,
          "stamina": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブレトグリ",
        "preferredRange": "mid",
        "statBias": {
          "aim": 3,
          "stamina": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブレトピンク",
        "preferredRange": "far",
        "statBias": {
          "support": 5,
          "stamina": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN20",
    "legacyTeamId": "N20",
    "league": "national",
    "leagueSlot": 20,
    "name": "プテラスカイズ",
    "description": "スピード感のある戦いと素早い位置変更を得意とする。",
    "teamTrait": "speed_rotation",
    "ranks": {
      "slump": [
        "B7",
        "A5"
      ],
      "normal": [
        "A1",
        "S1"
      ],
      "hot": [
        "S4",
        "SS1"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブスカイ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 4,
          "agility": 7,
          "technique": 4
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブプテラ",
        "preferredRange": "close",
        "statBias": {
          "aim": 5,
          "agility": 8,
          "physical": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブニューロ",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "agility": 7
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN21",
    "legacyTeamId": "N21",
    "league": "national",
    "leagueSlot": 21,
    "name": "プリンカップボム",
    "description": "調子の良い時は一気にキルを取り切る、人気の高いチーム。",
    "teamTrait": "burst_finish",
    "ranks": {
      "slump": [
        "C9",
        "B7"
      ],
      "normal": [
        "B5",
        "A8"
      ],
      "hot": [
        "S1",
        "S9"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブカスタード",
        "preferredRange": "mid",
        "statBias": {
          "mind": 4,
          "aim": 2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブプリン",
        "preferredRange": "close",
        "statBias": {
          "aim": 6,
          "physical": 5,
          "agility": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブカラメル",
        "preferredRange": "far",
        "statBias": {
          "support": 4,
          "technique": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN25",
    "legacyTeamId": "N25",
    "league": "national",
    "leagueSlot": 25,
    "name": "スナイパーマスターズ",
    "description": "ナショナル屈指の遠距離チーム。被弾を抑えながら狙撃する。",
    "teamTrait": "sniper",
    "ranks": {
      "slump": [
        "B8",
        "A6"
      ],
      "normal": [
        "A4",
        "S2"
      ],
      "hot": [
        "S5",
        "SS2"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブメート",
        "preferredRange": "far",
        "statBias": {
          "mind": 5,
          "aim": 6,
          "technique": 6,
          "physical": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブロング",
        "preferredRange": "far",
        "statBias": {
          "aim": 9,
          "technique": 8,
          "agility": 3,
          "physical": -3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブセンチ",
        "preferredRange": "far",
        "statBias": {
          "support": 5,
          "aim": 6,
          "technique": 6,
          "physical": -2
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "NN26",
    "legacyTeamId": "N26",
    "league": "national",
    "leagueSlot": 26,
    "name": "ワンダーユニティズ",
    "description": "全員がMVP経験者の実力派チーム。",
    "teamTrait": "all_mvp",
    "ranks": {
      "slump": [
        "A5",
        "S4"
      ],
      "normal": [
        "S1",
        "SS2"
      ],
      "hot": [
        "SS4",
        "MOB"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブマキシー",
        "preferredRange": "mid",
        "statBias": {
          "mind": 6,
          "technique": 4,
          "stamina": 3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブワンダ",
        "preferredRange": "close",
        "statBias": {
          "aim": 6,
          "physical": 5,
          "agility": 4
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブステイ",
        "preferredRange": "far",
        "statBias": {
          "support": 6,
          "mind": 4,
          "stamina": 3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "WN15",
    "legacyTeamId": "W15",
    "league": "world",
    "leagueSlot": 15,
    "name": "モブショットボスチーム",
    "description": "全員が高いHPを誇り、なかなかダウンしない耐久型チーム。",
    "teamTrait": "high_hp",
    "ranks": {
      "slump": [
        "A8",
        "S6"
      ],
      "normal": [
        "S4",
        "SS4"
      ],
      "hot": [
        "SS6",
        "MOB"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブホーク",
        "preferredRange": "mid",
        "statBias": {
          "stamina": 10,
          "mind": 5,
          "agility": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "ドラゴンモブ",
        "preferredRange": "close",
        "statBias": {
          "stamina": 11,
          "physical": 6,
          "aim": 4,
          "agility": -2
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブガーディアン",
        "preferredRange": "far",
        "statBias": {
          "stamina": 12,
          "support": 6,
          "agility": -3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "WN20",
    "legacyTeamId": "W20",
    "league": "world",
    "leagueSlot": 20,
    "name": "デジタルブレインズ",
    "description": "戦闘を避けながら順位を伸ばす判断力に優れたチーム。",
    "teamTrait": "placement_avoidance",
    "ranks": {
      "slump": [
        "A2",
        "S1"
      ],
      "normal": [
        "A8",
        "S8"
      ],
      "hot": [
        "SS1",
        "SS8"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブクール",
        "preferredRange": "mid",
        "statBias": {
          "mind": 8,
          "agility": 5,
          "technique": 5,
          "physical": -3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブリベル",
        "preferredRange": "far",
        "statBias": {
          "aim": 5,
          "agility": 5,
          "mind": 4,
          "physical": -3
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブドックスナイプ",
        "preferredRange": "far",
        "statBias": {
          "support": 6,
          "mind": 7,
          "agility": 4,
          "physical": -3
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "WN25",
    "legacyTeamId": "W25",
    "league": "world",
    "leagueSlot": 25,
    "name": "ネプチューンキングダム",
    "description": "機動力とエイムを高水準で兼ね備えるチーム。",
    "teamTrait": "mobility_aim",
    "ranks": {
      "slump": [
        "A9",
        "S7"
      ],
      "normal": [
        "S2",
        "SS3"
      ],
      "hot": [
        "SS5",
        "MOB"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブディープ",
        "preferredRange": "mid",
        "statBias": {
          "mind": 6,
          "agility": 7,
          "aim": 5
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブネプ",
        "preferredRange": "close",
        "statBias": {
          "aim": 8,
          "agility": 8,
          "technique": 5
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブリバー",
        "preferredRange": "far",
        "statBias": {
          "support": 6,
          "agility": 7,
          "aim": 5
        },
        "uniqueSkillIds": []
      }
    ]
  },
  {
    "teamId": "WN27",
    "legacyTeamId": "W27",
    "league": "world",
    "leagueSlot": 27,
    "name": "ミリーキャットフット",
    "description": "近距離戦では世界最高峰の実力を持つチーム。",
    "teamTrait": "world_best_close",
    "ranks": {
      "slump": [
        "S7",
        "SS4"
      ],
      "normal": [
        "SS4",
        "MOB"
      ],
      "hot": [
        "MOB",
        "MOB"
      ]
    },
    "members": [
      {
        "role": "IGL",
        "name": "モブミール",
        "preferredRange": "close",
        "statBias": {
          "mind": 6,
          "physical": 7,
          "agility": 6
        },
        "uniqueSkillIds": []
      },
      {
        "role": "ATK",
        "name": "モブネイブ",
        "preferredRange": "close",
        "statBias": {
          "aim": 9,
          "physical": 10,
          "agility": 8,
          "technique": 5
        },
        "uniqueSkillIds": []
      },
      {
        "role": "SUP",
        "name": "モブグランド",
        "preferredRange": "close",
        "statBias": {
          "support": 6,
          "physical": 7,
          "agility": 5
        },
        "uniqueSkillIds": []
      }
    ]
  }
]);

export const RETIRED_PRO_TEAM_IDS =
  deepFreeze(
    DENDEN_TEAM_SOURCE_MAP.map(
      (entry) => entry.legacyTeamId,
    ),
  );

export const PRO_REPLACEMENT_ID_BY_LEGACY_ID =
  deepFreeze(
    Object.fromEntries(
      PRO_TEAM_REPLACEMENT_SPECS.map(
        (entry) => [
          entry.legacyTeamId,
          entry.teamId,
        ],
      ),
    ),
  );

const LEGACY_ALL_TEAMS = [
  ...LEGACY_LOCAL_CPU_TEAMS,
  ...LEGACY_NATIONAL_CPU_TEAMS,
  ...LEGACY_WORLD_CPU_TEAMS,
];

const LEGACY_TEAM_BY_ID =
  new Map(
    LEGACY_ALL_TEAMS.map(
      (team) => [
        team.teamId,
        team,
      ],
    ),
  );

const ROLE_SLOT = Object.freeze({
  ATK: "A",
  IGL: "B",
  SUP: "C",
});

const LEAGUE_DIRECTORY =
  Object.freeze({
    local: "Local",
    national: "National",
    world: "World",
  });

function fixedRange(rank) {
  return [rank, rank];
}

function createDendenMember(
  sourceMember,
  dendenTeamId,
  rankAnchor,
) {
  const slot =
    ROLE_SLOT[
      sourceMember.role
    ];
  return {
    ...deepClone(sourceMember),
    id:
      `${dendenTeamId}${slot}`,
    teamId:
      dendenTeamId,
    slumpRankRange:
      fixedRange(
        rankAnchor.slumpRank,
      ),
    normalRankRange:
      fixedRange(
        rankAnchor.normalRank,
      ),
    hotRankRange:
      fixedRange(
        rankAnchor.hotRank,
      ),
    sourceRankRanges: {
      slump:
        fixedRange(
          rankAnchor.slumpRank,
        ),
      normal:
        fixedRange(
          rankAnchor.normalRank,
        ),
      hot:
        fixedRange(
          rankAnchor.hotRank,
        ),
    },
    legacyPlayerId:
      sourceMember.id,
    cardEligible:
      false,
  };
}

function createDendenTeam(
  sourceMap,
  index,
) {
  const source =
    LEGACY_TEAM_BY_ID.get(
      sourceMap.legacyTeamId,
    );
  if (!source) {
    throw new RangeError(
      `Denden source team not found: ${sourceMap.legacyTeamId}`,
    );
  }
  return {
    ...deepClone(source),
    teamId:
      sourceMap.dendenTeamId,
    teamNumber:
      index + 1,
    sourceNumber:
      source.sourceNumber ??
      source.teamNumber,
    leagueSlot:
      index + 1,
    tier:
      "denden",
    league:
      "denden",
    originalTeamId:
      source.teamId,
    description:
      sourceMap.host
        ? `${source.description} デンデンカップ主催チーム。非常にムラがあるが、好調時はプロリーグのゲストチームすら圧倒する。`
        : `${source.description} プロリーグ外で経験を積み、デンデンカップへ挑むチーム。`,
    members:
      source.members.map(
        (member) =>
          createDendenMember(
            member,
            sourceMap.dendenTeamId,
            sourceMap,
          ),
      ),
    rankModel:
      "explicit_form_anchor",
    cardEligible:
      false,
    badgeEligible:
      false,
    isDendenHost:
      sourceMap.host === true,
    isExpansionTeam:
      false,
  };
}

export const DENDEN_CPU_TEAMS =
  deepFreeze(
    DENDEN_TEAM_SOURCE_MAP.map(
      createDendenTeam,
    ),
  );

function memberRanks(
  teamSpec,
  memberSpec,
) {
  return (
    memberSpec.ranks ??
    teamSpec.ranks
  );
}

function createNewProMember(
  teamSpec,
  memberSpec,
) {
  const slot =
    ROLE_SLOT[
      memberSpec.role
    ];
  const directory =
    LEAGUE_DIRECTORY[
      teamSpec.league
    ];
  const ranks =
    memberRanks(
      teamSpec,
      memberSpec,
    );
  return {
    id:
      `${teamSpec.teamId}${slot}`,
    name:
      memberSpec.name,
    role:
      memberSpec.role,
    image:
      `${directory}/${teamSpec.teamId}${slot}.png`,
    characterRank:
      null,
    slumpRankRange:
      deepClone(
        ranks.slump,
      ),
    normalRankRange:
      deepClone(
        ranks.normal,
      ),
    hotRankRange:
      deepClone(
        ranks.hot,
      ),
    sourceRankRanges: {
      slump:
        deepClone(
          ranks.slump,
        ),
      normal:
        deepClone(
          ranks.normal,
        ),
      hot:
        deepClone(
          ranks.hot,
        ),
    },
    legacyRankCorrections:
      [],
    weaponName:
      `${memberSpec.role}共通武器`,
    preferredRange:
      memberSpec.preferredRange,
    weaponSource:
      "role_template_fallback",
    skillProfile:
      memberSpec.uniqueSkillIds
        ?.some(Boolean)
        ? "unique"
        : "role_common",
    uniqueSkillIds:
      deepClone(
        memberSpec.uniqueSkillIds ??
        [],
      ),
    statBias:
      deepClone(
        memberSpec.statBias ??
        {},
      ),
    cardEligible:
      true,
  };
}

function createNewProTeam(
  teamSpec,
) {
  const directory =
    LEAGUE_DIRECTORY[
      teamSpec.league
    ];
  return {
    teamId:
      teamSpec.teamId,
    teamNumber:
      teamSpec.leagueSlot,
    sourceNumber:
      teamSpec.leagueSlot,
    leagueSlot:
      teamSpec.leagueSlot,
    tier:
      teamSpec.league,
    league:
      teamSpec.league,
    name:
      teamSpec.name,
    companyName:
      teamSpec.name,
    logo:
      `${directory}/${teamSpec.teamId}D.png`,
    description:
      teamSpec.description,
    members:
      teamSpec.members.map(
        (member) =>
          createNewProMember(
            teamSpec,
            member,
          ),
      ),
    unlockGameYear:
      1,
    unlockCalendarYear:
      1989,
    isExpansionTeam:
      false,
    skillProfile:
      "team_concept",
    teamTrait:
      teamSpec.teamTrait,
    replacesLegacyTeamId:
      teamSpec.legacyTeamId,
    cardEligible:
      true,
    badgeEligible:
      true,
  };
}

export const NEW_PRO_CPU_TEAMS =
  deepFreeze(
    PRO_TEAM_REPLACEMENT_SPECS.map(
      createNewProTeam,
    ),
  );

export const PRO_REPLACEMENT_TEAM_BY_LEGACY_ID =
  deepFreeze(
    Object.fromEntries(
      NEW_PRO_CPU_TEAMS.map(
        (team) => [
          team.replacesLegacyTeamId,
          team,
        ],
      ),
    ),
  );

function formalTeamsForLeague(
  legacyTeams,
  league,
) {
  const retired =
    new Set(
      RETIRED_PRO_TEAM_IDS,
    );
  const retained =
    legacyTeams
      .filter(
        (team) =>
          !retired.has(
            team.teamId,
          ),
      )
      .map(
        (team) => ({
          ...deepClone(team),
          league,
          leagueSlot:
            team.teamNumber ??
            team.sourceNumber,
        }),
      );
  const replacements =
    NEW_PRO_CPU_TEAMS.filter(
      (team) =>
        team.league ===
        league,
    );
  return [
    ...retained,
    ...replacements,
  ].sort(
    (left, right) =>
      Number(
        left.leagueSlot ??
        left.teamNumber,
      ) -
      Number(
        right.leagueSlot ??
        right.teamNumber,
      ),
  );
}

export const PRO_LOCAL_CPU_TEAMS =
  deepFreeze(
    formalTeamsForLeague(
      LEGACY_LOCAL_CPU_TEAMS,
      "local",
    ),
  );

export const PRO_NATIONAL_CPU_TEAMS =
  deepFreeze(
    formalTeamsForLeague(
      LEGACY_NATIONAL_CPU_TEAMS,
      "national",
    ),
  );

export const PRO_WORLD_CPU_TEAMS =
  deepFreeze(
    formalTeamsForLeague(
      LEGACY_WORLD_CPU_TEAMS,
      "world",
    ),
  );

export const ALL_GENERATION_47_CPU_TEAMS =
  deepFreeze([
    ...PRO_LOCAL_CPU_TEAMS,
    ...PRO_NATIONAL_CPU_TEAMS,
    ...PRO_WORLD_CPU_TEAMS,
    ...DENDEN_CPU_TEAMS,
  ]);

export function getProReplacementTeamByLegacyId(
  legacyTeamId,
) {
  return (
    PRO_REPLACEMENT_TEAM_BY_LEGACY_ID[
      String(
        legacyTeamId ??
        "",
      )
    ] ??
    null
  );
}

export function getGeneration47CpuTeamById(
  teamId,
) {
  const normalized =
    String(
      teamId ??
      "",
    );
  return (
    ALL_GENERATION_47_CPU_TEAMS.find(
      (team) =>
        team.teamId ===
        normalized,
    ) ??
    null
  );
}

export function validateGeneration47CpuRoster() {
  const ids =
    ALL_GENERATION_47_CPU_TEAMS.map(
      (team) => team.teamId,
    );
  if (
    new Set(ids).size !==
    ids.length
  ) {
    throw new Error(
      "Generation 47 CPU team IDs must be unique.",
    );
  }
  if (
    DENDEN_CPU_TEAMS.length !==
    20
  ) {
    throw new Error(
      "Generation 47 Denden roster must contain 20 supplied teams.",
    );
  }
  if (
    PRO_LOCAL_CPU_TEAMS.length !==
      LEGACY_LOCAL_CPU_TEAMS.length ||
    PRO_NATIONAL_CPU_TEAMS.length !==
      LEGACY_NATIONAL_CPU_TEAMS.length ||
    PRO_WORLD_CPU_TEAMS.length !==
      LEGACY_WORLD_CPU_TEAMS.length
  ) {
    throw new Error(
      "Formal league team counts must remain unchanged.",
    );
  }
  for (
    const team
    of ALL_GENERATION_47_CPU_TEAMS
  ) {
    if (
      !Array.isArray(
        team.members,
      ) ||
      team.members.length !==
        3
    ) {
      throw new Error(
        `CPU team ${team.teamId} must contain three members.`,
      );
    }
  }
  return {
    local:
      PRO_LOCAL_CPU_TEAMS.length,
    national:
      PRO_NATIONAL_CPU_TEAMS.length,
    world:
      PRO_WORLD_CPU_TEAMS.length,
    denden:
      DENDEN_CPU_TEAMS.length,
    all:
      ALL_GENERATION_47_CPU_TEAMS.length,
  };
}

validateGeneration47CpuRoster();
