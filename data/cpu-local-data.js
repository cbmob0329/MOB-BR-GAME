/**
 * MOB BR LOCAL CPU master data.
 *
 * Team names, player names, images, descriptions, and form rank ranges are
 * parsed from CPU.txt. Legacy rank labels ending in 10 are normalized.
 */

import {
  ROLE_IDS,
  normalizeLegacyRank,
  rankToCharacterValue,
} from "./game-data.js";

export const CPU_LOCAL_DATA_VERSION = "mobbr-cpu-local-data-1.0.0";
export const CPU_LOCAL_MASTER_VERSION = "mobbr-cpu-local-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const CPU_LOCAL_SOURCE_NOTES = deepFreeze({
  sourceFile: "CPU.txt",
  rankNormalization: {
    F10: "E1",
    E10: "D1",
    D10: "C1",
    C10: "B1",
    B10: "A1",
    A10: "S1",
    S10: "SS1",
    SS10: "MOB",
  },
  missingWeaponPolicy:
    "CPU.txt has no weapon names or preferred ranges. Role-template fallback values are marked by weaponSource.",
  normalSkillPolicy:
    "All players use role_common unless an explicit strong-enemy definition exists.",
});

export const LOCAL_CPU_TEAMS = deepFreeze(
  [
  {
    "teamId": "L1",
    "teamNumber": 1,
    "sourceNumber": 1,
    "tier": "local",
    "name": "プリズンハンマーズ",
    "companyName": "プリズンハンマーズ",
    "logo": "Local/L1D.png",
    "description": "ローカル最強クラス 世界大会でも優勝を狙える実力を持つチーム",
    "members": [
      {
        "id": "L1B",
        "name": "モブモッチ",
        "role": "IGL",
        "image": "Local/L1B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A5"
        ],
        "normalRankRange": [
          "A4",
          "S2"
        ],
        "hotRankRange": [
          "S3",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A5"
          ],
          "normal": [
            "A4",
            "S2"
          ],
          "hot": [
            "S3",
            "S7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "プリズンコール",
        "preferredRange": "mid",
        "weaponSource": "explicit_spec_example",
        "skillProfile": "unique",
        "uniqueSkillIds": [
          "prison_breaker",
          "igl_precise_strike",
          "shield_charge"
        ]
      },
      {
        "id": "L1A",
        "name": "モブテツ",
        "role": "ATK",
        "image": "Local/L1A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A1"
        ],
        "normalRankRange": [
          "A4",
          "A8"
        ],
        "hotRankRange": [
          "S4",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A1"
          ],
          "normal": [
            "A4",
            "A8"
          ],
          "hot": [
            "S4",
            "S7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L1C",
        "name": "モブファトメン",
        "role": "SUP",
        "image": "Local/L1C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C9",
          "B6"
        ],
        "normalRankRange": [
          "B8",
          "A4"
        ],
        "hotRankRange": [
          "A5",
          "S5"
        ],
        "sourceRankRanges": {
          "slump": [
            "C9",
            "B6"
          ],
          "normal": [
            "B8",
            "A4"
          ],
          "hot": [
            "A5",
            "S5"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L2",
    "teamNumber": 2,
    "sourceNumber": 2,
    "tier": "local",
    "name": "フシギノハナ",
    "companyName": "フシギノハナ",
    "logo": "Local/L2D.png",
    "description": "ローカル上位常連チーム",
    "members": [
      {
        "id": "L2B",
        "name": "モブシンリョク",
        "role": "IGL",
        "image": "Local/L2B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "C8"
        ],
        "normalRankRange": [
          "B1",
          "B5"
        ],
        "hotRankRange": [
          "B8",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "C8"
          ],
          "normal": [
            "C10",
            "B5"
          ],
          "hot": [
            "B8",
            "A7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L2A",
        "name": "モブカッター",
        "role": "ATK",
        "image": "Local/L2A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B3"
        ],
        "normalRankRange": [
          "B4",
          "A1"
        ],
        "hotRankRange": [
          "A2",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B3"
          ],
          "normal": [
            "B4",
            "A1"
          ],
          "hot": [
            "A2",
            "A9"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L2C",
        "name": "モブノムチ",
        "role": "SUP",
        "image": "Local/L2C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B2"
        ],
        "normalRankRange": [
          "B1",
          "B8"
        ],
        "hotRankRange": [
          "A1",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "B2"
          ],
          "normal": [
            "B1",
            "B8"
          ],
          "hot": [
            "B10",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L3",
    "teamNumber": 3,
    "sourceNumber": 3,
    "tier": "local",
    "name": "レッドカラミーズ",
    "companyName": "レッドカラミーズ",
    "logo": "Local/L3D.png",
    "description": "ローカル上位常連チーム",
    "members": [
      {
        "id": "L3B",
        "name": "モブハーバ",
        "role": "IGL",
        "image": "Local/L3B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B3"
        ],
        "normalRankRange": [
          "B4",
          "A1"
        ],
        "hotRankRange": [
          "A4",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B3"
          ],
          "normal": [
            "B4",
            "B10"
          ],
          "hot": [
            "A4",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L3A",
        "name": "モブネーロ",
        "role": "ATK",
        "image": "Local/L3A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
        ],
        "normalRankRange": [
          "B1",
          "B9"
        ],
        "hotRankRange": [
          "B8",
          "A8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "B1"
          ],
          "normal": [
            "B1",
            "B9"
          ],
          "hot": [
            "B8",
            "A8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L3C",
        "name": "モブトガラ",
        "role": "SUP",
        "image": "Local/L3C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B2"
        ],
        "normalRankRange": [
          "B2",
          "B8"
        ],
        "hotRankRange": [
          "B9",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "B2"
          ],
          "normal": [
            "B2",
            "B8"
          ],
          "hot": [
            "B9",
            "A7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L4",
    "teamNumber": 4,
    "sourceNumber": 4,
    "tier": "local",
    "name": "ジュラッシクヤベージャンズ",
    "companyName": "ジュラッシクヤベージャンズ",
    "logo": "Local/L4D.png",
    "description": "近距離戦を得意とするローカル上位チーム",
    "members": [
      {
        "id": "L4B",
        "name": "モブティラ",
        "role": "IGL",
        "image": "Local/L4B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D6",
          "C9"
        ],
        "normalRankRange": [
          "C8",
          "B7"
        ],
        "hotRankRange": [
          "B7",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D6",
            "C9"
          ],
          "normal": [
            "C8",
            "B7"
          ],
          "hot": [
            "B7",
            "A7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L4A",
        "name": "モブサウルス",
        "role": "ATK",
        "image": "Local/L4A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B4"
        ],
        "normalRankRange": [
          "B5",
          "A1"
        ],
        "hotRankRange": [
          "A4",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B4"
          ],
          "normal": [
            "B5",
            "B10"
          ],
          "hot": [
            "A4",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L4C",
        "name": "モブラプチー",
        "role": "SUP",
        "image": "Local/L4C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "B1"
        ],
        "normalRankRange": [
          "C9",
          "B6"
        ],
        "hotRankRange": [
          "B9",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C10"
          ],
          "normal": [
            "C9",
            "B6"
          ],
          "hot": [
            "B9",
            "A7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L5",
    "teamNumber": 5,
    "sourceNumber": 5,
    "tier": "local",
    "name": "エンドゾーンズ",
    "companyName": "エンドゾーンズ",
    "logo": "Local/L5D.png",
    "description": "高い耐久力を誇るローカル上位チーム",
    "members": [
      {
        "id": "L5B",
        "name": "モブクォーター",
        "role": "IGL",
        "image": "Local/L5B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B1"
        ],
        "normalRankRange": [
          "B2",
          "B8"
        ],
        "hotRankRange": [
          "B9",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "C10"
          ],
          "normal": [
            "B2",
            "B8"
          ],
          "hot": [
            "B9",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L5A",
        "name": "モブランニング",
        "role": "ATK",
        "image": "Local/L5A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
        ],
        "normalRankRange": [
          "C9",
          "B7"
        ],
        "hotRankRange": [
          "B7",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "B1"
          ],
          "normal": [
            "C9",
            "B7"
          ],
          "hot": [
            "B7",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L5C",
        "name": "モブライン",
        "role": "SUP",
        "image": "Local/L5C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B1"
        ],
        "normalRankRange": [
          "B3",
          "B7"
        ],
        "hotRankRange": [
          "A1",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "C10"
          ],
          "normal": [
            "B3",
            "B7"
          ],
          "hot": [
            "A1",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L6",
    "teamNumber": 6,
    "sourceNumber": 6,
    "tier": "local",
    "name": "カイジュウランナーズ",
    "companyName": "カイジュウランナーズ",
    "logo": "Local/L6D.png",
    "description": "素早い展開と高い機動力が武器のチーム",
    "members": [
      {
        "id": "L6B",
        "name": "モブナマズン",
        "role": "IGL",
        "image": "Local/L6B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "B1"
        ],
        "normalRankRange": [
          "C9",
          "B6"
        ],
        "hotRankRange": [
          "B9",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C10"
          ],
          "normal": [
            "C9",
            "B6"
          ],
          "hot": [
            "B9",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L6A",
        "name": "モブボウボウ",
        "role": "ATK",
        "image": "Local/L6A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B2"
        ],
        "normalRankRange": [
          "B3",
          "B8"
        ],
        "hotRankRange": [
          "A3",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B2"
          ],
          "normal": [
            "B3",
            "B8"
          ],
          "hot": [
            "A3",
            "A9"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L6C",
        "name": "モブスーイ",
        "role": "SUP",
        "image": "Local/L6C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "C7"
        ],
        "normalRankRange": [
          "C7",
          "B4"
        ],
        "hotRankRange": [
          "B4",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C7"
          ],
          "normal": [
            "C7",
            "B4"
          ],
          "hot": [
            "B4",
            "A3"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L7",
    "teamNumber": 7,
    "sourceNumber": 7,
    "tier": "local",
    "name": "ミステリーシャンパン",
    "companyName": "ミステリーシャンパン",
    "logo": "Local/L7D.png",
    "description": "相手を翻弄するトリッキーなチーム",
    "members": [
      {
        "id": "L7B",
        "name": "モブイッパイ",
        "role": "IGL",
        "image": "Local/L7B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "B1"
        ],
        "normalRankRange": [
          "B1",
          "B6"
        ],
        "hotRankRange": [
          "B8",
          "A6"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C10"
          ],
          "normal": [
            "C10",
            "B6"
          ],
          "hot": [
            "B8",
            "A6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L7A",
        "name": "モブビール",
        "role": "ATK",
        "image": "Local/L7A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "C9"
        ],
        "normalRankRange": [
          "B1",
          "B6"
        ],
        "hotRankRange": [
          "B9",
          "A6"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C9"
          ],
          "normal": [
            "C10",
            "B6"
          ],
          "hot": [
            "B9",
            "A6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L7C",
        "name": "モブショーチュー",
        "role": "SUP",
        "image": "Local/L7C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
        ],
        "normalRankRange": [
          "B1",
          "B9"
        ],
        "hotRankRange": [
          "A1",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "B1"
          ],
          "normal": [
            "B1",
            "B9"
          ],
          "hot": [
            "B10",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L8",
    "teamNumber": 8,
    "sourceNumber": 8,
    "tier": "local",
    "name": "モブストリートクルー",
    "companyName": "モブストリートクルー",
    "logo": "Local/L8D.png",
    "description": "初動の速さと高い連携力を持つチーム",
    "members": [
      {
        "id": "L8B",
        "name": "モブビーボーイ",
        "role": "IGL",
        "image": "Local/L8B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C2",
          "B5"
        ],
        "normalRankRange": [
          "B4",
          "A1"
        ],
        "hotRankRange": [
          "A4",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C2",
            "B5"
          ],
          "normal": [
            "B4",
            "A1"
          ],
          "hot": [
            "A4",
            "A9"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L8A",
        "name": "モブディージェイ",
        "role": "ATK",
        "image": "Local/L8A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "B3"
        ],
        "normalRankRange": [
          "B1",
          "A1"
        ],
        "hotRankRange": [
          "B8",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "B3"
          ],
          "normal": [
            "B1",
            "B10"
          ],
          "hot": [
            "B8",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L8C",
        "name": "モブエムシー",
        "role": "SUP",
        "image": "Local/L8C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D6",
          "C5"
        ],
        "normalRankRange": [
          "C8",
          "B3"
        ],
        "hotRankRange": [
          "B6",
          "A5"
        ],
        "sourceRankRanges": {
          "slump": [
            "D6",
            "C5"
          ],
          "normal": [
            "C8",
            "B3"
          ],
          "hot": [
            "B6",
            "A5"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L9",
    "teamNumber": 9,
    "sourceNumber": 9,
    "tier": "local",
    "name": "ミズタマポポチ",
    "companyName": "ミズタマポポチ",
    "logo": "Local/L9D.png",
    "description": "ローカル中堅チーム",
    "members": [
      {
        "id": "L9B",
        "name": "モブブルタマ",
        "role": "IGL",
        "image": "Local/L9B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "D9"
        ],
        "normalRankRange": [
          "C2",
          "C6"
        ],
        "hotRankRange": [
          "B1",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "D9"
          ],
          "normal": [
            "C2",
            "C6"
          ],
          "hot": [
            "B1",
            "B9"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L9A",
        "name": "モブアカタマ",
        "role": "ATK",
        "image": "Local/L9A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "C4"
        ],
        "normalRankRange": [
          "C6",
          "B2"
        ],
        "hotRankRange": [
          "B5",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C4"
          ],
          "normal": [
            "C6",
            "B2"
          ],
          "hot": [
            "B5",
            "A1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L9C",
        "name": "モブウスタマ",
        "role": "SUP",
        "image": "Local/L9C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C1",
          "C8"
        ],
        "hotRankRange": [
          "B1",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "D10"
          ],
          "normal": [
            "D10",
            "C8"
          ],
          "hot": [
            "C10",
            "A1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L10",
    "teamNumber": 10,
    "sourceNumber": 10,
    "tier": "local",
    "name": "ディグダグディグクルー",
    "companyName": "ディグダグディグクルー",
    "logo": "Local/L10D.png",
    "description": "ローカル中堅チーム",
    "members": [
      {
        "id": "L10B",
        "name": "モブディグ",
        "role": "IGL",
        "image": "Local/L10B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C3"
        ],
        "normalRankRange": [
          "C3",
          "B1"
        ],
        "hotRankRange": [
          "B1",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "C3"
          ],
          "normal": [
            "C3",
            "C10"
          ],
          "hot": [
            "C10",
            "B9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L10A",
        "name": "モブツチ",
        "role": "ATK",
        "image": "Local/L10A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C2"
        ],
        "normalRankRange": [
          "C3",
          "B1"
        ],
        "hotRankRange": [
          "B1",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "C2"
          ],
          "normal": [
            "C3",
            "C10"
          ],
          "hot": [
            "B1",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L10C",
        "name": "モブザクザク",
        "role": "SUP",
        "image": "Local/L10C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C3"
        ],
        "normalRankRange": [
          "C4",
          "C9"
        ],
        "hotRankRange": [
          "B2",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C3"
          ],
          "normal": [
            "C4",
            "C9"
          ],
          "hot": [
            "B2",
            "B9"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L11",
    "teamNumber": 11,
    "sourceNumber": 11,
    "tier": "local",
    "name": "テーブルスイートスワット",
    "companyName": "テーブルスイートスワット",
    "logo": "Local/L11D.png",
    "description": "ローカル中堅チーム",
    "members": [
      {
        "id": "L11B",
        "name": "モブシュガ",
        "role": "IGL",
        "image": "Local/L11B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E9",
          "C1"
        ],
        "normalRankRange": [
          "C1",
          "C8"
        ],
        "hotRankRange": [
          "B1",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "E9",
            "D10"
          ],
          "normal": [
            "D10",
            "C8"
          ],
          "hot": [
            "C10",
            "B9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L11A",
        "name": "モブミント",
        "role": "ATK",
        "image": "Local/L11A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C2"
        ],
        "normalRankRange": [
          "C4",
          "B1"
        ],
        "hotRankRange": [
          "B4",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "C2"
          ],
          "normal": [
            "C4",
            "C10"
          ],
          "hot": [
            "B4",
            "A1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L11C",
        "name": "モブカカオ",
        "role": "SUP",
        "image": "Local/L11C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C1",
          "C7"
        ],
        "hotRankRange": [
          "C8",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C1"
          ],
          "normal": [
            "C1",
            "C7"
          ],
          "hot": [
            "C8",
            "B9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L12",
    "teamNumber": 12,
    "sourceNumber": 12,
    "tier": "local",
    "name": "ポリスサバイバーガンズ",
    "companyName": "ポリスサバイバーガンズ",
    "logo": "Local/L12D.png",
    "description": "ローカル中堅チーム",
    "members": [
      {
        "id": "L12B",
        "name": "モブピック",
        "role": "IGL",
        "image": "Local/L12B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D2",
          "C1"
        ],
        "normalRankRange": [
          "C4",
          "C9"
        ],
        "hotRankRange": [
          "B2",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D2",
            "C1"
          ],
          "normal": [
            "C4",
            "C9"
          ],
          "hot": [
            "B2",
            "A1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L12A",
        "name": "モブミナモ",
        "role": "ATK",
        "image": "Local/L12A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E9",
          "C2"
        ],
        "normalRankRange": [
          "C1",
          "C8"
        ],
        "hotRankRange": [
          "B1",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E9",
            "C2"
          ],
          "normal": [
            "C1",
            "C8"
          ],
          "hot": [
            "C10",
            "A1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L12C",
        "name": "モブコモレ",
        "role": "SUP",
        "image": "Local/L12C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C4"
        ],
        "normalRankRange": [
          "C2",
          "B1"
        ],
        "hotRankRange": [
          "B1",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C4"
          ],
          "normal": [
            "C2",
            "B1"
          ],
          "hot": [
            "B1",
            "A1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L13",
    "teamNumber": 13,
    "sourceNumber": 13,
    "tier": "local",
    "name": "エリートサラリーマンズ",
    "companyName": "エリートサラリーマンズ",
    "logo": "Local/L13D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L13B",
        "name": "モブシャチョー",
        "role": "IGL",
        "image": "Local/L13B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E1",
          "E9"
        ],
        "normalRankRange": [
          "E9",
          "D7"
        ],
        "hotRankRange": [
          "D6",
          "C6"
        ],
        "sourceRankRanges": {
          "slump": [
            "F10",
            "E9"
          ],
          "normal": [
            "E9",
            "D7"
          ],
          "hot": [
            "D6",
            "C6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "F10",
            "to": "E1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L13A",
        "name": "モブセンム",
        "role": "ATK",
        "image": "Local/L13A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D4"
        ],
        "normalRankRange": [
          "D6",
          "C1"
        ],
        "hotRankRange": [
          "C3",
          "C9"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D4"
          ],
          "normal": [
            "D6",
            "D10"
          ],
          "hot": [
            "C3",
            "C9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L13C",
        "name": "モブジョウム",
        "role": "SUP",
        "image": "Local/L13C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E1",
          "E9"
        ],
        "normalRankRange": [
          "D1",
          "D6"
        ],
        "hotRankRange": [
          "D8",
          "C6"
        ],
        "sourceRankRanges": {
          "slump": [
            "E1",
            "E9"
          ],
          "normal": [
            "E10",
            "D6"
          ],
          "hot": [
            "D8",
            "C6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L14",
    "teamNumber": 14,
    "sourceNumber": 14,
    "tier": "local",
    "name": "ハタケノヤサイ",
    "companyName": "ハタケノヤサイ",
    "logo": "Local/L14D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L14B",
        "name": "モブダイチ",
        "role": "IGL",
        "image": "Local/L14B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E3",
          "D2"
        ],
        "normalRankRange": [
          "D3",
          "D8"
        ],
        "hotRankRange": [
          "C2",
          "C8"
        ],
        "sourceRankRanges": {
          "slump": [
            "E3",
            "D2"
          ],
          "normal": [
            "D3",
            "D8"
          ],
          "hot": [
            "C2",
            "C8"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L14A",
        "name": "モブホウサク",
        "role": "ATK",
        "image": "Local/L14A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E1",
          "D1"
        ],
        "normalRankRange": [
          "D1",
          "D7"
        ],
        "hotRankRange": [
          "C1",
          "C8"
        ],
        "sourceRankRanges": {
          "slump": [
            "F10",
            "E10"
          ],
          "normal": [
            "E10",
            "D7"
          ],
          "hot": [
            "D10",
            "C8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "F10",
            "to": "E1"
          },
          {
            "form": "slump",
            "boundary": "max",
            "from": "E10",
            "to": "D1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L14C",
        "name": "モブミノリ",
        "role": "SUP",
        "image": "Local/L14C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E4",
          "D4"
        ],
        "normalRankRange": [
          "D4",
          "C1"
        ],
        "hotRankRange": [
          "C4",
          "B2"
        ],
        "sourceRankRanges": {
          "slump": [
            "E4",
            "D4"
          ],
          "normal": [
            "D4",
            "C1"
          ],
          "hot": [
            "C4",
            "B2"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L15",
    "teamNumber": 15,
    "sourceNumber": 15,
    "tier": "local",
    "name": "スリーブルー",
    "companyName": "スリーブルー",
    "logo": "Local/L15D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L15B",
        "name": "モブアオジ",
        "role": "IGL",
        "image": "Local/L15B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E6",
          "D7"
        ],
        "normalRankRange": [
          "D7",
          "C3"
        ],
        "hotRankRange": [
          "C4",
          "B5"
        ],
        "sourceRankRanges": {
          "slump": [
            "E6",
            "D7"
          ],
          "normal": [
            "D7",
            "C3"
          ],
          "hot": [
            "C4",
            "B5"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L15A",
        "name": "モブコンジョー",
        "role": "ATK",
        "image": "Local/L15A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E3",
          "D5"
        ],
        "normalRankRange": [
          "D4",
          "C2"
        ],
        "hotRankRange": [
          "C2",
          "B4"
        ],
        "sourceRankRanges": {
          "slump": [
            "E3",
            "D5"
          ],
          "normal": [
            "D4",
            "C2"
          ],
          "hot": [
            "C2",
            "B4"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L15C",
        "name": "モブセイラン",
        "role": "SUP",
        "image": "Local/L15C.png",
        "characterRank": null,
        "slumpRankRange": [
          "F7",
          "E6"
        ],
        "normalRankRange": [
          "E8",
          "D4"
        ],
        "hotRankRange": [
          "D7",
          "C7"
        ],
        "sourceRankRanges": {
          "slump": [
            "F7",
            "E6"
          ],
          "normal": [
            "E8",
            "D4"
          ],
          "hot": [
            "D7",
            "C7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L16",
    "teamNumber": 16,
    "sourceNumber": 16,
    "tier": "local",
    "name": "ミドリラバーズ",
    "companyName": "ミドリラバーズ",
    "logo": "Local/L16D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L16B",
        "name": "モブミドリ",
        "role": "IGL",
        "image": "Local/L16B.png",
        "characterRank": null,
        "slumpRankRange": [
          "F9",
          "D3"
        ],
        "normalRankRange": [
          "D1",
          "C1"
        ],
        "hotRankRange": [
          "C1",
          "C9"
        ],
        "sourceRankRanges": {
          "slump": [
            "F9",
            "D3"
          ],
          "normal": [
            "D1",
            "D10"
          ],
          "hot": [
            "C1",
            "C9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L16A",
        "name": "モブリョク",
        "role": "ATK",
        "image": "Local/L16A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E6",
          "D6"
        ],
        "normalRankRange": [
          "D8",
          "C3"
        ],
        "hotRankRange": [
          "C8",
          "B2"
        ],
        "sourceRankRanges": {
          "slump": [
            "E6",
            "D6"
          ],
          "normal": [
            "D8",
            "C3"
          ],
          "hot": [
            "C8",
            "B2"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L16C",
        "name": "モブワカバ",
        "role": "SUP",
        "image": "Local/L16C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E1",
          "D1"
        ],
        "normalRankRange": [
          "D2",
          "D9"
        ],
        "hotRankRange": [
          "D9",
          "C8"
        ],
        "sourceRankRanges": {
          "slump": [
            "F10",
            "D1"
          ],
          "normal": [
            "D2",
            "D9"
          ],
          "hot": [
            "D9",
            "C8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "F10",
            "to": "E1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L17",
    "teamNumber": 17,
    "sourceNumber": 17,
    "tier": "local",
    "name": "ピンクサバイバー",
    "companyName": "ピンクサバイバー",
    "logo": "Local/L17D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L17B",
        "name": "モブモモ",
        "role": "IGL",
        "image": "Local/L17B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E6",
          "D4"
        ],
        "normalRankRange": [
          "D5",
          "C1"
        ],
        "hotRankRange": [
          "C3",
          "B1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E6",
            "D4"
          ],
          "normal": [
            "D5",
            "C1"
          ],
          "hot": [
            "C3",
            "B1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L17A",
        "name": "モブサクラ",
        "role": "ATK",
        "image": "Local/L17A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E3",
          "D2"
        ],
        "normalRankRange": [
          "D2",
          "C1"
        ],
        "hotRankRange": [
          "C1",
          "B1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E3",
            "D2"
          ],
          "normal": [
            "D2",
            "D10"
          ],
          "hot": [
            "C1",
            "C10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L17C",
        "name": "モブベニ",
        "role": "SUP",
        "image": "Local/L17C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D4"
        ],
        "normalRankRange": [
          "D6",
          "C1"
        ],
        "hotRankRange": [
          "C5",
          "B1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D4"
          ],
          "normal": [
            "D6",
            "D10"
          ],
          "hot": [
            "C5",
            "B1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L18",
    "teamNumber": 18,
    "sourceNumber": 18,
    "tier": "local",
    "name": "パレットカラーズ",
    "companyName": "パレットカラーズ",
    "logo": "Local/L18D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L18B",
        "name": "モブシキサイ",
        "role": "IGL",
        "image": "Local/L18B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E2",
          "D2"
        ],
        "normalRankRange": [
          "D2",
          "D9"
        ],
        "hotRankRange": [
          "D9",
          "B1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E2",
            "D2"
          ],
          "normal": [
            "D2",
            "D9"
          ],
          "hot": [
            "D9",
            "B1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L18A",
        "name": "モブニジ",
        "role": "ATK",
        "image": "Local/L18A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E6",
          "D3"
        ],
        "normalRankRange": [
          "D6",
          "C1"
        ],
        "hotRankRange": [
          "C3",
          "B3"
        ],
        "sourceRankRanges": {
          "slump": [
            "E6",
            "D3"
          ],
          "normal": [
            "D6",
            "C1"
          ],
          "hot": [
            "C3",
            "B3"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L18C",
        "name": "モブイロドリ",
        "role": "SUP",
        "image": "Local/L18C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E1",
          "D1"
        ],
        "normalRankRange": [
          "D1",
          "D7"
        ],
        "hotRankRange": [
          "D8",
          "C9"
        ],
        "sourceRankRanges": {
          "slump": [
            "F10",
            "D1"
          ],
          "normal": [
            "E10",
            "D7"
          ],
          "hot": [
            "D8",
            "C9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "F10",
            "to": "E1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L19",
    "teamNumber": 19,
    "sourceNumber": 19,
    "tier": "local",
    "name": "エブリトツゲキパワーズ",
    "companyName": "エブリトツゲキパワーズ",
    "logo": "Local/L19D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L19B",
        "name": "モブゲキシン",
        "role": "IGL",
        "image": "Local/L19B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E2",
          "D1"
        ],
        "normalRankRange": [
          "D3",
          "D9"
        ],
        "hotRankRange": [
          "C2",
          "B2"
        ],
        "sourceRankRanges": {
          "slump": [
            "E2",
            "D1"
          ],
          "normal": [
            "D3",
            "D9"
          ],
          "hot": [
            "C2",
            "B2"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L19A",
        "name": "モブトッシン",
        "role": "ATK",
        "image": "Local/L19A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E2",
          "D3"
        ],
        "normalRankRange": [
          "D3",
          "D9"
        ],
        "hotRankRange": [
          "C3",
          "C8"
        ],
        "sourceRankRanges": {
          "slump": [
            "E2",
            "D3"
          ],
          "normal": [
            "D3",
            "D9"
          ],
          "hot": [
            "C3",
            "C8"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L19C",
        "name": "モブシンゲキ",
        "role": "SUP",
        "image": "Local/L19C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E3",
          "D6"
        ],
        "normalRankRange": [
          "D4",
          "C2"
        ],
        "hotRankRange": [
          "C4",
          "B1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E3",
            "D6"
          ],
          "normal": [
            "D4",
            "C2"
          ],
          "hot": [
            "C4",
            "B1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L20",
    "teamNumber": 20,
    "sourceNumber": 20,
    "tier": "local",
    "name": "アタックシッソウランク",
    "companyName": "アタックシッソウランク",
    "logo": "Local/L20D.png",
    "description": "ローカル下位チーム",
    "members": [
      {
        "id": "L20B",
        "name": "モブシュンソク",
        "role": "IGL",
        "image": "Local/L20B.png",
        "characterRank": null,
        "slumpRankRange": [
          "F8",
          "E9"
        ],
        "normalRankRange": [
          "D1",
          "D7"
        ],
        "hotRankRange": [
          "D8",
          "C7"
        ],
        "sourceRankRanges": {
          "slump": [
            "F8",
            "E9"
          ],
          "normal": [
            "E10",
            "D7"
          ],
          "hot": [
            "D8",
            "C7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L20A",
        "name": "モブライソウ",
        "role": "ATK",
        "image": "Local/L20A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E2",
          "D7"
        ],
        "normalRankRange": [
          "D4",
          "C3"
        ],
        "hotRankRange": [
          "C2",
          "B3"
        ],
        "sourceRankRanges": {
          "slump": [
            "E2",
            "D7"
          ],
          "normal": [
            "D4",
            "C3"
          ],
          "hot": [
            "C2",
            "B3"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L20C",
        "name": "モブハヤテ",
        "role": "SUP",
        "image": "Local/L20C.png",
        "characterRank": null,
        "slumpRankRange": [
          "F9",
          "E9"
        ],
        "normalRankRange": [
          "D1",
          "D6"
        ],
        "hotRankRange": [
          "C1",
          "C6"
        ],
        "sourceRankRanges": {
          "slump": [
            "F9",
            "E9"
          ],
          "normal": [
            "D1",
            "D6"
          ],
          "hot": [
            "D10",
            "C6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L21",
    "teamNumber": 21,
    "sourceNumber": 21,
    "tier": "local",
    "name": "モブバトルクラブ",
    "companyName": "モブバトルクラブ",
    "logo": "Local/L21D.png",
    "description": "ローカル中堅チーム",
    "members": [
      {
        "id": "L21B",
        "name": "モブリバイブ",
        "role": "IGL",
        "image": "Local/L21B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C1"
        ],
        "normalRankRange": [
          "C3",
          "C7"
        ],
        "hotRankRange": [
          "B3",
          "B8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C1"
          ],
          "normal": [
            "C3",
            "C7"
          ],
          "hot": [
            "B3",
            "B8"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L21A",
        "name": "モブリカバー",
        "role": "ATK",
        "image": "Local/L21A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C1",
          "C6"
        ],
        "hotRankRange": [
          "C7",
          "B8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "D10"
          ],
          "normal": [
            "D10",
            "C6"
          ],
          "hot": [
            "C7",
            "B8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "D10",
            "to": "C1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L21C",
        "name": "モブリスタート",
        "role": "SUP",
        "image": "Local/L21C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D2",
          "C2"
        ],
        "normalRankRange": [
          "C1",
          "C9"
        ],
        "hotRankRange": [
          "C8",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D2",
            "C2"
          ],
          "normal": [
            "C1",
            "C9"
          ],
          "hot": [
            "C8",
            "A1"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L22",
    "teamNumber": 22,
    "sourceNumber": 22,
    "tier": "local",
    "name": "ミラモブスナイパーズ",
    "companyName": "ミラモブスナイパーズ",
    "logo": "Local/L22D.png",
    "description": "ローカル最強クラス 世界大会で4位に入賞した実績を持つチーム",
    "members": [
      {
        "id": "L22B",
        "name": "ミラモブ",
        "role": "IGL",
        "image": "Local/L22B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A5"
        ],
        "normalRankRange": [
          "A4",
          "S1"
        ],
        "hotRankRange": [
          "S2",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A5"
          ],
          "normal": [
            "A4",
            "S1"
          ],
          "hot": [
            "S2",
            "S7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L22A",
        "name": "モブミラーノ",
        "role": "ATK",
        "image": "Local/L22A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A4"
        ],
        "normalRankRange": [
          "A4",
          "S1"
        ],
        "hotRankRange": [
          "S3",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A4"
          ],
          "normal": [
            "A4",
            "S1"
          ],
          "hot": [
            "S3",
            "S7"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L22C",
        "name": "モブピラミドン",
        "role": "SUP",
        "image": "Local/L22C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B5"
        ],
        "normalRankRange": [
          "B8",
          "A3"
        ],
        "hotRankRange": [
          "A8",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B5"
          ],
          "normal": [
            "B8",
            "A3"
          ],
          "hot": [
            "A8",
            "S2"
          ]
        },
        "legacyRankCorrections": [],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "L23",
    "teamNumber": 23,
    "sourceNumber": 23,
    "tier": "local",
    "name": "ポータルレーシング",
    "companyName": "ポータルレーシング",
    "logo": "Local/L23D.png",
    "description": "ローカル上位常連チーム",
    "members": [
      {
        "id": "L23B",
        "name": "モブランエボ",
        "role": "IGL",
        "image": "Local/L23B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "B2"
        ],
        "normalRankRange": [
          "B1",
          "B8"
        ],
        "hotRankRange": [
          "B7",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "B2"
          ],
          "normal": [
            "C10",
            "B8"
          ],
          "hot": [
            "B7",
            "A7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L23A",
        "name": "モブゼッツー",
        "role": "ATK",
        "image": "Local/L23A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B3"
        ],
        "normalRankRange": [
          "B4",
          "A1"
        ],
        "hotRankRange": [
          "A1",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B3"
          ],
          "normal": [
            "B4",
            "B10"
          ],
          "hot": [
            "A1",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "L23C",
        "name": "モブランボル",
        "role": "SUP",
        "image": "Local/L23C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "C9"
        ],
        "normalRankRange": [
          "B1",
          "B7"
        ],
        "hotRankRange": [
          "B9",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "C9"
          ],
          "normal": [
            "B1",
            "B7"
          ],
          "hot": [
            "B9",
            "A7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "D10",
            "to": "C1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 1,
    "unlockCalendarYear": 1989,
    "isExpansionTeam": false,
    "skillProfile": "role_common",
    "teamTrait": null
  }
]
);

const teamById = new Map(
  LOCAL_CPU_TEAMS.map((team) => [team.teamId, team]),
);

export function getLocalCpuTeam(teamId) {
  const team = teamById.get(teamId);
  if (!team) {
    throw new RangeError(`Unknown local CPU team: ${teamId}`);
  }
  return team;
}

function validateRankRange(rankRange, label) {
  if (!Array.isArray(rankRange) || rankRange.length !== 2) {
    throw new Error(`${label} must contain two ranks.`);
  }
  for (const rank of rankRange) {
    if (normalizeLegacyRank(rank) !== rank || /10$/.test(rank)) {
      throw new Error(`${label} contains a legacy rank: ${rank}`);
    }
  }
  if (
    rankToCharacterValue(rankRange[0]) >
    rankToCharacterValue(rankRange[1])
  ) {
    throw new Error(`${label} is reversed.`);
  }
}

export function validateLocalCpuMaster() {
  if (LOCAL_CPU_TEAMS.length !== 23) {
    throw new Error("local CPU team count must equal 23.");
  }

  const teamIds = new Set();
  const playerIds = new Set();

  for (const team of LOCAL_CPU_TEAMS) {
    if (teamIds.has(team.teamId)) {
      throw new Error(`Duplicate team ID: ${team.teamId}`);
    }
    teamIds.add(team.teamId);

    if (!Array.isArray(team.members) || team.members.length !== 3) {
      throw new Error(`CPU team must contain three players: ${team.teamId}`);
    }

    const roles = team.members.map((member) => member.role);
    if (
      new Set(roles).size !== 3 ||
      ROLE_IDS.some((role) => !roles.includes(role))
    ) {
      throw new Error(`CPU roles are invalid: ${team.teamId}`);
    }

    for (const member of team.members) {
      if (playerIds.has(member.id)) {
        throw new Error(`Duplicate player ID: ${member.id}`);
      }
      playerIds.add(member.id);

      const expectedSuffix =
        member.role === "ATK" ? "A" : member.role === "IGL" ? "B" : "C";
      if (
        member.id !== `${team.teamId}${expectedSuffix}` ||
        !member.image.endsWith(`/${member.id}.png`)
      ) {
        throw new Error(`CPU image/role mapping is invalid: ${member.id}`);
      }

      validateRankRange(member.slumpRankRange, `${member.id} slumpRankRange`);
      validateRankRange(member.normalRankRange, `${member.id} normalRankRange`);
      validateRankRange(member.hotRankRange, `${member.id} hotRankRange`);

      if (
        typeof member.weaponName !== "string" ||
        !member.weaponName ||
        !["close", "mid", "far"].includes(member.preferredRange)
      ) {
        throw new Error(`CPU weapon fallback is invalid: ${member.id}`);
      }
      if (!["role_common", "unique"].includes(member.skillProfile)) {
        throw new Error(`CPU skill profile is invalid: ${member.id}`);
      }
    }

    if (!team.logo.endsWith(`/${team.teamId}D.png`)) {
      throw new Error(`CPU team logo is invalid: ${team.teamId}`);
    }
  }

  

  return deepFreeze({
    teamCount: LOCAL_CPU_TEAMS.length,
    playerCount: playerIds.size,
    valid: true,
  });
}


