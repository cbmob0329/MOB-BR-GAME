/**
 * MOB BR WORLD CPU master data.
 *
 * Team names, player names, images, descriptions, and form rank ranges are
 * parsed from CPU.txt. Legacy rank labels ending in 10 are normalized.
 */

import {
  ROLE_IDS,
  normalizeLegacyRank,
  rankToCharacterValue,
} from "./game-data.js";

export const CPU_WORLD_DATA_VERSION = "mobbr-cpu-world-data-1.0.0";
export const CPU_WORLD_MASTER_VERSION = "mobbr-cpu-world-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const CPU_WORLD_SOURCE_NOTES = deepFreeze({
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

export const WORLD_CPU_ALL_TEAMS = deepFreeze(
  [
  {
    "teamId": "W1",
    "teamNumber": 1,
    "sourceNumber": 1,
    "tier": "world",
    "name": "ゴールデンテンペスト",
    "companyName": "ゴールデンテンペスト",
    "logo": "World/W1D.png",
    "description": "世界最強のチーム",
    "members": [
      {
        "id": "W1B",
        "name": "モブミリー",
        "role": "IGL",
        "image": "World/W1B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S8",
          "SS8"
        ],
        "normalRankRange": [
          "SS7",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S8",
            "SS8"
          ],
          "normal": [
            "SS7",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W1A",
        "name": "モブトール",
        "role": "ATK",
        "image": "World/W1A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S8",
          "SS4"
        ],
        "normalRankRange": [
          "SS7",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S8",
            "SS4"
          ],
          "normal": [
            "SS7",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W1C",
        "name": "モブオマー",
        "role": "SUP",
        "image": "World/W1C.png",
        "characterRank": null,
        "slumpRankRange": [
          "S2",
          "S9"
        ],
        "normalRankRange": [
          "SS1",
          "SS7"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S2",
            "S9"
          ],
          "normal": [
            "SS1",
            "SS7"
          ],
          "hot": [
            "SS8",
            "MOB"
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
    "teamId": "W2",
    "teamNumber": 2,
    "sourceNumber": 2,
    "tier": "world",
    "name": "タロアートファッション",
    "companyName": "タロアートファッション",
    "logo": "World/W2D.png",
    "description": "人気の高い世界的チーム",
    "members": [
      {
        "id": "W2B",
        "name": "モブポヨ",
        "role": "IGL",
        "image": "World/W2B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S4",
          "SS2"
        ],
        "normalRankRange": [
          "SS4",
          "SS9"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S4",
            "SS2"
          ],
          "normal": [
            "SS4",
            "SS9"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W2A",
        "name": "モブターロ",
        "role": "ATK",
        "image": "World/W2A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S8",
          "SS7"
        ],
        "normalRankRange": [
          "SS8",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S8",
            "SS7"
          ],
          "normal": [
            "SS8",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W2C",
        "name": "モブチャモロ",
        "role": "SUP",
        "image": "World/W2C.png",
        "characterRank": null,
        "slumpRankRange": [
          "S5",
          "SS6"
        ],
        "normalRankRange": [
          "SS5",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S5",
            "SS6"
          ],
          "normal": [
            "SS5",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
    "teamId": "W3",
    "teamNumber": 3,
    "sourceNumber": 3,
    "tier": "world",
    "name": "シャドウキングダム",
    "companyName": "シャドウキングダム",
    "logo": "World/W3D.png",
    "description": "三姉妹で世界大会常連の強豪チーム",
    "members": [
      {
        "id": "W3B",
        "name": "モブヴェノム",
        "role": "IGL",
        "image": "World/W3B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S7",
          "SS7"
        ],
        "normalRankRange": [
          "SS8",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S7",
            "SS7"
          ],
          "normal": [
            "SS8",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W3A",
        "name": "モブアサ",
        "role": "ATK",
        "image": "World/W3A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S4",
          "SS5"
        ],
        "normalRankRange": [
          "SS5",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S4",
            "SS5"
          ],
          "normal": [
            "SS5",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W3C",
        "name": "モブテラー",
        "role": "SUP",
        "image": "World/W3C.png",
        "characterRank": null,
        "slumpRankRange": [
          "S5",
          "SS6"
        ],
        "normalRankRange": [
          "SS6",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S5",
            "SS6"
          ],
          "normal": [
            "SS6",
            "MOB"
          ],
          "hot": [
            "MOB",
            "MOB"
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
    "teamId": "W4",
    "teamNumber": 4,
    "sourceNumber": 4,
    "tier": "world",
    "name": "アリスカンパニー",
    "companyName": "アリスカンパニー",
    "logo": "World/W4D.png",
    "description": "",
    "members": [
      {
        "id": "W4B",
        "name": "モブクイン",
        "role": "IGL",
        "image": "World/W4B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S8"
        ],
        "normalRankRange": [
          "S7",
          "SS6"
        ],
        "hotRankRange": [
          "SS6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S8"
          ],
          "normal": [
            "S7",
            "SS6"
          ],
          "hot": [
            "SS6",
            "MOB"
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
        "id": "W4A",
        "name": "モブジョーカー",
        "role": "ATK",
        "image": "World/W4A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S2",
          "SS3"
        ],
        "normalRankRange": [
          "SS4",
          "SS9"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S2",
            "SS3"
          ],
          "normal": [
            "SS4",
            "SS9"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W4C",
        "name": "モブキング",
        "role": "SUP",
        "image": "World/W4C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A6",
          "S9"
        ],
        "normalRankRange": [
          "S8",
          "SS5"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A6",
            "S9"
          ],
          "normal": [
            "S8",
            "SS5"
          ],
          "hot": [
            "SS8",
            "MOB"
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
    "teamId": "W5",
    "teamNumber": 5,
    "sourceNumber": 5,
    "tier": "world",
    "name": "アサシンコート",
    "companyName": "アサシンコート",
    "logo": "World/W5D.png",
    "description": "",
    "members": [
      {
        "id": "W5B",
        "name": "モブサイレント",
        "role": "IGL",
        "image": "World/W5B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S2",
          "S9"
        ],
        "normalRankRange": [
          "SS1",
          "SS7"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S2",
            "S9"
          ],
          "normal": [
            "SS1",
            "SS7"
          ],
          "hot": [
            "SS8",
            "MOB"
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
        "id": "W5A",
        "name": "モブタゲ",
        "role": "ATK",
        "image": "World/W5A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A9",
          "SS1"
        ],
        "normalRankRange": [
          "S8",
          "SS6"
        ],
        "hotRankRange": [
          "SS6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A9",
            "S10"
          ],
          "normal": [
            "S8",
            "SS6"
          ],
          "hot": [
            "SS6",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W5C",
        "name": "モブガンド",
        "role": "SUP",
        "image": "World/W5C.png",
        "characterRank": null,
        "slumpRankRange": [
          "S3",
          "S9"
        ],
        "normalRankRange": [
          "SS2",
          "SS6"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S3",
            "S9"
          ],
          "normal": [
            "SS2",
            "SS6"
          ],
          "hot": [
            "SS10",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "SS10",
            "to": "MOB"
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
    "teamId": "W6",
    "teamNumber": 6,
    "sourceNumber": 6,
    "tier": "world",
    "name": "ネコクーバレット",
    "companyName": "ネコクーバレット",
    "logo": "World/W6D.png",
    "description": "",
    "members": [
      {
        "id": "W6B",
        "name": "モブネコクー",
        "role": "IGL",
        "image": "World/W6B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S9"
        ],
        "normalRankRange": [
          "S8",
          "SS5"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S9"
          ],
          "normal": [
            "S8",
            "SS5"
          ],
          "hot": [
            "SS8",
            "MOB"
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
        "id": "W6A",
        "name": "モブククリ",
        "role": "ATK",
        "image": "World/W6A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S2",
          "SS1"
        ],
        "normalRankRange": [
          "SS2",
          "SS7"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S2",
            "SS1"
          ],
          "normal": [
            "SS2",
            "SS7"
          ],
          "hot": [
            "MOB",
            "MOB"
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
        "id": "W6C",
        "name": "モブテイル",
        "role": "SUP",
        "image": "World/W6C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A6",
          "S6"
        ],
        "normalRankRange": [
          "S6",
          "SS3"
        ],
        "hotRankRange": [
          "SS3",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A6",
            "S6"
          ],
          "normal": [
            "S6",
            "SS3"
          ],
          "hot": [
            "SS3",
            "MOB"
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
    "teamId": "W7",
    "teamNumber": 7,
    "sourceNumber": 7,
    "tier": "world",
    "name": "シャーロックターゲット",
    "companyName": "シャーロックターゲット",
    "logo": "World/W7D.png",
    "description": "",
    "members": [
      {
        "id": "W7B",
        "name": "モブホームズ",
        "role": "IGL",
        "image": "World/W7B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S9"
        ],
        "normalRankRange": [
          "S9",
          "SS5"
        ],
        "hotRankRange": [
          "SS7",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S9"
          ],
          "normal": [
            "S9",
            "SS5"
          ],
          "hot": [
            "SS7",
            "MOB"
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
        "id": "W7A",
        "name": "モブワトソン",
        "role": "ATK",
        "image": "World/W7A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S8"
        ],
        "normalRankRange": [
          "S9",
          "SS5"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S8"
          ],
          "normal": [
            "S9",
            "SS5"
          ],
          "hot": [
            "SS8",
            "MOB"
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
        "id": "W7C",
        "name": "モブアーティー",
        "role": "SUP",
        "image": "World/W7C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A9",
          "SS1"
        ],
        "normalRankRange": [
          "SS1",
          "SS8"
        ],
        "hotRankRange": [
          "SS9",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A9",
            "S10"
          ],
          "normal": [
            "S10",
            "SS8"
          ],
          "hot": [
            "SS9",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W8",
    "teamNumber": 8,
    "sourceNumber": 8,
    "tier": "world",
    "name": "ヨミカケノホン",
    "companyName": "ヨミカケノホン",
    "logo": "World/W8D.png",
    "description": "ヒーローにより結成された強豪チーム",
    "members": [
      {
        "id": "W8B",
        "name": "モブブラック",
        "role": "IGL",
        "image": "World/W8B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S1",
          "SS4"
        ],
        "normalRankRange": [
          "SS3",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S1",
            "SS4"
          ],
          "normal": [
            "SS3",
            "SS10"
          ],
          "hot": [
            "MOB",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W8A",
        "name": "モブレッド",
        "role": "ATK",
        "image": "World/W8A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "SS2"
        ],
        "normalRankRange": [
          "SS1",
          "SS9"
        ],
        "hotRankRange": [
          "SS7",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "SS2"
          ],
          "normal": [
            "S10",
            "SS9"
          ],
          "hot": [
            "SS7",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W8C",
        "name": "モブイエロー",
        "role": "SUP",
        "image": "World/W8C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S4"
        ],
        "normalRankRange": [
          "S7",
          "SS2"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S4"
          ],
          "normal": [
            "S7",
            "SS2"
          ],
          "hot": [
            "SS5",
            "MOB"
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
    "teamId": "W9",
    "teamNumber": 9,
    "sourceNumber": 9,
    "tier": "world",
    "name": "ケロノイショウ",
    "companyName": "ケロノイショウ",
    "logo": "World/W9D.png",
    "description": "",
    "members": [
      {
        "id": "W9B",
        "name": "モブミトケロ",
        "role": "IGL",
        "image": "World/W9B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S1",
          "S7"
        ],
        "normalRankRange": [
          "SS1",
          "SS4"
        ],
        "hotRankRange": [
          "SS9",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S1",
            "S7"
          ],
          "normal": [
            "S10",
            "SS4"
          ],
          "hot": [
            "SS9",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W9A",
        "name": "モブグリケロ",
        "role": "ATK",
        "image": "World/W9A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S5",
          "SS2"
        ],
        "normalRankRange": [
          "SS4",
          "MOB"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S5",
            "SS2"
          ],
          "normal": [
            "SS4",
            "SS10"
          ],
          "hot": [
            "MOB",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W9C",
        "name": "モブサポケロ",
        "role": "SUP",
        "image": "World/W9C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A9",
          "S8"
        ],
        "normalRankRange": [
          "S8",
          "SS6"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A9",
            "S8"
          ],
          "normal": [
            "S8",
            "SS6"
          ],
          "hot": [
            "SS8",
            "MOB"
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
    "teamId": "W10",
    "teamNumber": 10,
    "sourceNumber": 10,
    "tier": "world",
    "name": "ラビットスキルボム",
    "companyName": "ラビットスキルボム",
    "logo": "World/W10D.png",
    "description": "圧倒的な人気を誇る機動力チーム",
    "members": [
      {
        "id": "W10B",
        "name": "モブビッツ",
        "role": "IGL",
        "image": "World/W10B.png",
        "characterRank": null,
        "slumpRankRange": [
          "S1",
          "SS1"
        ],
        "normalRankRange": [
          "SS1",
          "SS8"
        ],
        "hotRankRange": [
          "SS8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S1",
            "SS1"
          ],
          "normal": [
            "SS1",
            "SS8"
          ],
          "hot": [
            "SS8",
            "MOB"
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
        "id": "W10A",
        "name": "モブステッピン",
        "role": "ATK",
        "image": "World/W10A.png",
        "characterRank": null,
        "slumpRankRange": [
          "S1",
          "SS1"
        ],
        "normalRankRange": [
          "SS1",
          "SS8"
        ],
        "hotRankRange": [
          "SS9",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S1",
            "S10"
          ],
          "normal": [
            "SS1",
            "SS8"
          ],
          "hot": [
            "SS9",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W10C",
        "name": "モブジャンピン",
        "role": "SUP",
        "image": "World/W10C.png",
        "characterRank": null,
        "slumpRankRange": [
          "S2",
          "SS1"
        ],
        "normalRankRange": [
          "SS2",
          "SS7"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "S2",
            "SS1"
          ],
          "normal": [
            "SS2",
            "SS7"
          ],
          "hot": [
            "SS10",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "SS10",
            "to": "MOB"
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
    "teamId": "W11",
    "teamNumber": 11,
    "sourceNumber": 11,
    "tier": "world",
    "name": "モブメジャーズ",
    "companyName": "モブメジャーズ",
    "logo": "World/W11D.png",
    "description": "",
    "members": [
      {
        "id": "W11B",
        "name": "モブジャイロ",
        "role": "IGL",
        "image": "World/W11B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S3"
        ],
        "normalRankRange": [
          "S3",
          "SS1"
        ],
        "hotRankRange": [
          "SS3",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S3"
          ],
          "normal": [
            "S3",
            "SS1"
          ],
          "hot": [
            "SS3",
            "MOB"
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
        "id": "W11A",
        "name": "モブワイヤー",
        "role": "ATK",
        "image": "World/W11A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A6",
          "S5"
        ],
        "normalRankRange": [
          "S7",
          "SS3"
        ],
        "hotRankRange": [
          "SS7",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A6",
            "S5"
          ],
          "normal": [
            "S7",
            "SS3"
          ],
          "hot": [
            "SS7",
            "MOB"
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
        "id": "W11C",
        "name": "モブルタ",
        "role": "SUP",
        "image": "World/W11C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A3",
          "S4"
        ],
        "normalRankRange": [
          "S4",
          "SS1"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A3",
            "S4"
          ],
          "normal": [
            "S4",
            "S10"
          ],
          "hot": [
            "SS1",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W12",
    "teamNumber": 12,
    "sourceNumber": 12,
    "tier": "world",
    "name": "マスターオブテクニック",
    "companyName": "マスターオブテクニック",
    "logo": "World/W12D.png",
    "description": "",
    "members": [
      {
        "id": "W12B",
        "name": "モブハドウ",
        "role": "IGL",
        "image": "World/W12B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S4"
        ],
        "normalRankRange": [
          "S7",
          "SS2"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S4"
          ],
          "normal": [
            "S7",
            "SS2"
          ],
          "hot": [
            "SS5",
            "MOB"
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
        "id": "W12A",
        "name": "モブカメハ",
        "role": "ATK",
        "image": "World/W12A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S5"
        ],
        "normalRankRange": [
          "S4",
          "SS1"
        ],
        "hotRankRange": [
          "SS3",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S5"
          ],
          "normal": [
            "S4",
            "SS1"
          ],
          "hot": [
            "SS3",
            "MOB"
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
        "id": "W12C",
        "name": "モブドドパ",
        "role": "SUP",
        "image": "World/W12C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A3",
          "S7"
        ],
        "normalRankRange": [
          "S5",
          "SS4"
        ],
        "hotRankRange": [
          "SS4",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A3",
            "S7"
          ],
          "normal": [
            "S5",
            "SS4"
          ],
          "hot": [
            "SS4",
            "MOB"
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
    "teamId": "W13",
    "teamNumber": 13,
    "sourceNumber": 13,
    "tier": "world",
    "name": "レトロシアター",
    "companyName": "レトロシアター",
    "logo": "World/W13D.png",
    "description": "",
    "members": [
      {
        "id": "W13B",
        "name": "モブドワーフ",
        "role": "IGL",
        "image": "World/W13B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S1"
        ],
        "normalRankRange": [
          "S1",
          "S9"
        ],
        "hotRankRange": [
          "S8",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S1"
          ],
          "normal": [
            "S1",
            "S9"
          ],
          "hot": [
            "S8",
            "SS8"
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
        "id": "W13A",
        "name": "モブサッケ",
        "role": "ATK",
        "image": "World/W13A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A9",
          "S6"
        ],
        "normalRankRange": [
          "S8",
          "SS2"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A9",
            "S6"
          ],
          "normal": [
            "S8",
            "SS2"
          ],
          "hot": [
            "SS5",
            "MOB"
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
        "id": "W13C",
        "name": "モブディア",
        "role": "SUP",
        "image": "World/W13C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A3",
          "S1"
        ],
        "normalRankRange": [
          "S2",
          "S8"
        ],
        "hotRankRange": [
          "SS1",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "A3",
            "S1"
          ],
          "normal": [
            "S2",
            "S8"
          ],
          "hot": [
            "S10",
            "SS8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W14",
    "teamNumber": 14,
    "sourceNumber": 14,
    "tier": "world",
    "name": "コミックヒッターズ",
    "companyName": "コミックヒッターズ",
    "logo": "World/W14D.png",
    "description": "",
    "members": [
      {
        "id": "W14B",
        "name": "モブペン",
        "role": "IGL",
        "image": "World/W14B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S4"
        ],
        "normalRankRange": [
          "S5",
          "SS1"
        ],
        "hotRankRange": [
          "SS4",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S4"
          ],
          "normal": [
            "S5",
            "S10"
          ],
          "hot": [
            "SS4",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W14A",
        "name": "モブインク",
        "role": "ATK",
        "image": "World/W14A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S2"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "SS2",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S2"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "SS2",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W14C",
        "name": "モブトーン",
        "role": "SUP",
        "image": "World/W14C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A6",
          "S6"
        ],
        "normalRankRange": [
          "S6",
          "SS3"
        ],
        "hotRankRange": [
          "SS6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A6",
            "S6"
          ],
          "normal": [
            "S6",
            "SS3"
          ],
          "hot": [
            "SS6",
            "MOB"
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
    "teamId": "W15",
    "teamNumber": 15,
    "sourceNumber": 15,
    "tier": "world",
    "name": "ライフナイフクルー",
    "companyName": "ライフナイフクルー",
    "logo": "World/W15D.png",
    "description": "",
    "members": [
      {
        "id": "W15B",
        "name": "モブライフ",
        "role": "IGL",
        "image": "World/W15B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S9"
        ],
        "normalRankRange": [
          "S9",
          "SS5"
        ],
        "hotRankRange": [
          "SS6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S9"
          ],
          "normal": [
            "S9",
            "SS5"
          ],
          "hot": [
            "SS6",
            "MOB"
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
        "id": "W15A",
        "name": "モブブレイド",
        "role": "ATK",
        "image": "World/W15A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S7"
        ],
        "normalRankRange": [
          "S6",
          "SS4"
        ],
        "hotRankRange": [
          "SS4",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S7"
          ],
          "normal": [
            "S6",
            "SS4"
          ],
          "hot": [
            "SS4",
            "MOB"
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
        "id": "W15C",
        "name": "モブシース",
        "role": "SUP",
        "image": "World/W15C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A8"
        ],
        "normalRankRange": [
          "S1",
          "S6"
        ],
        "hotRankRange": [
          "S9",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A8"
          ],
          "normal": [
            "A10",
            "S6"
          ],
          "hot": [
            "S9",
            "SS9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
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
    "teamId": "W16",
    "teamNumber": 16,
    "sourceNumber": 16,
    "tier": "world",
    "name": "ウルフスノーマン",
    "companyName": "ウルフスノーマン",
    "logo": "World/W16D.png",
    "description": "",
    "members": [
      {
        "id": "W16B",
        "name": "モブウルフ",
        "role": "IGL",
        "image": "World/W16B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S5"
        ],
        "normalRankRange": [
          "S3",
          "SS2"
        ],
        "hotRankRange": [
          "SS3",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "S5"
          ],
          "normal": [
            "S3",
            "SS2"
          ],
          "hot": [
            "SS3",
            "MOB"
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
        "id": "W16A",
        "name": "モブブリザ",
        "role": "ATK",
        "image": "World/W16A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S8"
        ],
        "normalRankRange": [
          "SS1",
          "SS5"
        ],
        "hotRankRange": [
          "MOB",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S8"
          ],
          "normal": [
            "S10",
            "SS5"
          ],
          "hot": [
            "SS10",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W16C",
        "name": "モブスノウ",
        "role": "SUP",
        "image": "World/W16C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S3"
        ],
        "normalRankRange": [
          "S4",
          "SS1"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S3"
          ],
          "normal": [
            "S4",
            "SS1"
          ],
          "hot": [
            "SS1",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
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
    "teamId": "W17",
    "teamNumber": 17,
    "sourceNumber": 17,
    "tier": "world",
    "name": "スナノクニ",
    "companyName": "スナノクニ",
    "logo": "World/W17D.png",
    "description": "",
    "members": [
      {
        "id": "W17B",
        "name": "モブファラオ",
        "role": "IGL",
        "image": "World/W17B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S6"
        ],
        "normalRankRange": [
          "S7",
          "SS3"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S6"
          ],
          "normal": [
            "S7",
            "SS3"
          ],
          "hot": [
            "SS5",
            "MOB"
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
        "id": "W17A",
        "name": "モブスフィン",
        "role": "ATK",
        "image": "World/W17A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S4"
        ],
        "normalRankRange": [
          "S4",
          "SS2"
        ],
        "hotRankRange": [
          "SS3",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S4"
          ],
          "normal": [
            "S4",
            "SS2"
          ],
          "hot": [
            "SS3",
            "MOB"
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
        "id": "W17C",
        "name": "モブオアシス",
        "role": "SUP",
        "image": "World/W17C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A9",
          "S6"
        ],
        "normalRankRange": [
          "S8",
          "SS2"
        ],
        "hotRankRange": [
          "SS7",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A9",
            "S6"
          ],
          "normal": [
            "S8",
            "SS2"
          ],
          "hot": [
            "SS7",
            "MOB"
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
    "teamId": "W18",
    "teamNumber": 18,
    "sourceNumber": 18,
    "tier": "world",
    "name": "グラスオリジン",
    "companyName": "グラスオリジン",
    "logo": "World/W18D.png",
    "description": "",
    "members": [
      {
        "id": "W18B",
        "name": "モブグラス",
        "role": "IGL",
        "image": "World/W18B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S4"
        ],
        "normalRankRange": [
          "S4",
          "SS1"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S4"
          ],
          "normal": [
            "S4",
            "SS1"
          ],
          "hot": [
            "SS1",
            "MOB"
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
        "id": "W18A",
        "name": "モブクリア",
        "role": "ATK",
        "image": "World/W18A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A8",
          "S5"
        ],
        "normalRankRange": [
          "S8",
          "SS3"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A8",
            "S5"
          ],
          "normal": [
            "S8",
            "SS3"
          ],
          "hot": [
            "SS5",
            "MOB"
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
        "id": "W18C",
        "name": "モブプリズム",
        "role": "SUP",
        "image": "World/W18C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S3"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S3"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "S10",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W19",
    "teamNumber": 19,
    "sourceNumber": 19,
    "tier": "world",
    "name": "ワールドアトリエ",
    "companyName": "ワールドアトリエ",
    "logo": "World/W19D.png",
    "description": "",
    "members": [
      {
        "id": "W19B",
        "name": "モブモロシャ",
        "role": "IGL",
        "image": "World/W19B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S3"
        ],
        "normalRankRange": [
          "S5",
          "SS1"
        ],
        "hotRankRange": [
          "SS4",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S3"
          ],
          "normal": [
            "S5",
            "SS1"
          ],
          "hot": [
            "SS4",
            "MOB"
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
        "id": "W19A",
        "name": "モブアミレ",
        "role": "ATK",
        "image": "World/W19A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S5"
        ],
        "normalRankRange": [
          "S5",
          "SS1"
        ],
        "hotRankRange": [
          "SS5",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S5"
          ],
          "normal": [
            "S5",
            "SS1"
          ],
          "hot": [
            "SS5",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W19C",
        "name": "モブピンカ",
        "role": "SUP",
        "image": "World/W19C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S8"
        ],
        "normalRankRange": [
          "S6",
          "SS4"
        ],
        "hotRankRange": [
          "SS6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "S8"
          ],
          "normal": [
            "S6",
            "SS4"
          ],
          "hot": [
            "SS6",
            "MOB"
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
    "teamId": "W20",
    "teamNumber": 20,
    "sourceNumber": 20,
    "tier": "world",
    "name": "ヘビィマシンガンズ",
    "companyName": "ヘビィマシンガンズ",
    "logo": "World/W20D.png",
    "description": "",
    "members": [
      {
        "id": "W20B",
        "name": "モブシャボム",
        "role": "IGL",
        "image": "World/W20B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "SS1",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B10",
            "S1"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "S10",
            "SS9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "B10",
            "to": "A1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W20A",
        "name": "モブインバス",
        "role": "ATK",
        "image": "World/W20A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S9"
        ],
        "normalRankRange": [
          "S6",
          "SS5"
        ],
        "hotRankRange": [
          "SS4",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S9"
          ],
          "normal": [
            "S6",
            "SS5"
          ],
          "hot": [
            "SS4",
            "MOB"
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
        "id": "W20C",
        "name": "モブレージ",
        "role": "SUP",
        "image": "World/W20C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "S3",
          "S8"
        ],
        "hotRankRange": [
          "SS2",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "S1"
          ],
          "normal": [
            "S3",
            "S8"
          ],
          "hot": [
            "SS2",
            "SS8"
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
    "teamId": "W21",
    "teamNumber": 21,
    "sourceNumber": 21,
    "tier": "world",
    "name": "ニューパイレーツ",
    "companyName": "ニューパイレーツ",
    "logo": "World/W21D.png",
    "description": "",
    "members": [
      {
        "id": "W21B",
        "name": "モブベアー",
        "role": "IGL",
        "image": "World/W21B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "A9"
        ],
        "normalRankRange": [
          "S1",
          "S5"
        ],
        "hotRankRange": [
          "SS1",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "A9"
          ],
          "normal": [
            "S1",
            "S5"
          ],
          "hot": [
            "SS1",
            "SS6"
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
        "id": "W21A",
        "name": "モブティーロ",
        "role": "ATK",
        "image": "World/W21A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A8"
        ],
        "normalRankRange": [
          "A8",
          "S4"
        ],
        "hotRankRange": [
          "S5",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A8"
          ],
          "normal": [
            "A8",
            "S4"
          ],
          "hot": [
            "S5",
            "SS6"
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
        "id": "W21C",
        "name": "モブバッサ",
        "role": "SUP",
        "image": "World/W21C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "A9",
          "S7"
        ],
        "hotRankRange": [
          "S6",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B10",
            "A10"
          ],
          "normal": [
            "A9",
            "S7"
          ],
          "hot": [
            "S6",
            "SS9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "B10",
            "to": "A1"
          },
          {
            "form": "slump",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
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
    "teamId": "W22",
    "teamNumber": 22,
    "sourceNumber": 22,
    "tier": "world",
    "name": "ダークミュージック",
    "companyName": "ダークミュージック",
    "logo": "World/W22D.png",
    "description": "",
    "members": [
      {
        "id": "W22B",
        "name": "モブスク",
        "role": "IGL",
        "image": "World/W22B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S3"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S3"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "S10",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W22A",
        "name": "モブラッチ",
        "role": "ATK",
        "image": "World/W22A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S2"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S2"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "SS1",
            "MOB"
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
        "id": "W22C",
        "name": "モブラババ",
        "role": "SUP",
        "image": "World/W22C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A3"
        ],
        "normalRankRange": [
          "A6",
          "S1"
        ],
        "hotRankRange": [
          "S6",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A3"
          ],
          "normal": [
            "A6",
            "S1"
          ],
          "hot": [
            "S6",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W23",
    "teamNumber": 23,
    "sourceNumber": 23,
    "tier": "world",
    "name": "レーザーデストロイ",
    "companyName": "レーザーデストロイ",
    "logo": "World/W23D.png",
    "description": "",
    "members": [
      {
        "id": "W23B",
        "name": "モブヒッツメン",
        "role": "IGL",
        "image": "World/W23B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "S1"
        ],
        "normalRankRange": [
          "A9",
          "S7"
        ],
        "hotRankRange": [
          "S6",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "S1"
          ],
          "normal": [
            "A9",
            "S7"
          ],
          "hot": [
            "S6",
            "SS6"
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
        "id": "W23A",
        "name": "モブタクティン",
        "role": "ATK",
        "image": "World/W23A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S2"
        ],
        "normalRankRange": [
          "S3",
          "S9"
        ],
        "hotRankRange": [
          "SS1",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S2"
          ],
          "normal": [
            "S3",
            "S9"
          ],
          "hot": [
            "S10",
            "SS9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W23C",
        "name": "モブディフェル",
        "role": "SUP",
        "image": "World/W23C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A8"
        ],
        "normalRankRange": [
          "S1",
          "S6"
        ],
        "hotRankRange": [
          "S8",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A8"
          ],
          "normal": [
            "A10",
            "S6"
          ],
          "hot": [
            "S8",
            "SS6"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
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
    "teamId": "W24",
    "teamNumber": 24,
    "sourceNumber": 24,
    "tier": "world",
    "name": "ボーンクリエイターズ",
    "companyName": "ボーンクリエイターズ",
    "logo": "World/W24D.png",
    "description": "",
    "members": [
      {
        "id": "W24B",
        "name": "モブウィッシュ",
        "role": "IGL",
        "image": "World/W24B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "S3",
          "S8"
        ],
        "hotRankRange": [
          "SS2",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "S1"
          ],
          "normal": [
            "S3",
            "S8"
          ],
          "hot": [
            "SS2",
            "SS9"
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
        "id": "W24A",
        "name": "モブショル",
        "role": "ATK",
        "image": "World/W24A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A9"
        ],
        "normalRankRange": [
          "S1",
          "S7"
        ],
        "hotRankRange": [
          "SS1",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A9"
          ],
          "normal": [
            "A10",
            "S7"
          ],
          "hot": [
            "S10",
            "SS8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W24C",
        "name": "モブハクリ",
        "role": "SUP",
        "image": "World/W24C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "S2"
        ],
        "normalRankRange": [
          "S1",
          "SS1"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "S2"
          ],
          "normal": [
            "S1",
            "S10"
          ],
          "hot": [
            "SS1",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W25",
    "teamNumber": 25,
    "sourceNumber": 25,
    "tier": "world",
    "name": "ストリートダッシュ",
    "companyName": "ストリートダッシュ",
    "logo": "World/W25D.png",
    "description": "",
    "members": [
      {
        "id": "W25B",
        "name": "モブロード",
        "role": "IGL",
        "image": "World/W25B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A8"
        ],
        "normalRankRange": [
          "A7",
          "S5"
        ],
        "hotRankRange": [
          "S5",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A8"
          ],
          "normal": [
            "A7",
            "S5"
          ],
          "hot": [
            "S5",
            "SS7"
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
        "id": "W25A",
        "name": "モブスプリント",
        "role": "ATK",
        "image": "World/W25A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A5",
          "S1"
        ],
        "normalRankRange": [
          "S4",
          "S8"
        ],
        "hotRankRange": [
          "SS2",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A5",
            "A10"
          ],
          "normal": [
            "S4",
            "S8"
          ],
          "hot": [
            "SS2",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W25C",
        "name": "モブステップ",
        "role": "SUP",
        "image": "World/W25C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A8"
        ],
        "normalRankRange": [
          "A8",
          "S4"
        ],
        "hotRankRange": [
          "S7",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A8"
          ],
          "normal": [
            "A8",
            "S4"
          ],
          "hot": [
            "S7",
            "SS7"
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
    "teamId": "W26",
    "teamNumber": 26,
    "sourceNumber": 26,
    "tier": "world",
    "name": "オンミツサーカス",
    "companyName": "オンミツサーカス",
    "logo": "World/W26D.png",
    "description": "",
    "members": [
      {
        "id": "W26B",
        "name": "モブセレモ",
        "role": "IGL",
        "image": "World/W26B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "A8"
        ],
        "normalRankRange": [
          "S1",
          "S6"
        ],
        "hotRankRange": [
          "SS1",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "A8"
          ],
          "normal": [
            "S1",
            "S6"
          ],
          "hot": [
            "SS1",
            "SS5"
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
        "id": "W26A",
        "name": "モブポンプ",
        "role": "ATK",
        "image": "World/W26A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A7"
        ],
        "normalRankRange": [
          "A8",
          "S5"
        ],
        "hotRankRange": [
          "S5",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A7"
          ],
          "normal": [
            "A8",
            "S5"
          ],
          "hot": [
            "S5",
            "SS4"
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
        "id": "W26C",
        "name": "モブトーク",
        "role": "SUP",
        "image": "World/W26C.png",
        "characterRank": null,
        "slumpRankRange": [
          "A2",
          "S3"
        ],
        "normalRankRange": [
          "S2",
          "S9"
        ],
        "hotRankRange": [
          "S9",
          "SS9"
        ],
        "sourceRankRanges": {
          "slump": [
            "A2",
            "S3"
          ],
          "normal": [
            "S2",
            "S9"
          ],
          "hot": [
            "S9",
            "SS9"
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
    "teamId": "W27",
    "teamNumber": 27,
    "sourceNumber": 27,
    "tier": "world",
    "name": "デンデンオリジナル",
    "companyName": "デンデンオリジナル",
    "logo": "World/W27D.png",
    "description": "キュートで人気の高いチーム",
    "members": [
      {
        "id": "W27B",
        "name": "モブデンブー",
        "role": "IGL",
        "image": "World/W27B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A6"
        ],
        "normalRankRange": [
          "A8",
          "S4"
        ],
        "hotRankRange": [
          "S7",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A6"
          ],
          "normal": [
            "A8",
            "S4"
          ],
          "hot": [
            "S7",
            "SS5"
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
        "id": "W27A",
        "name": "モブデンロック",
        "role": "ATK",
        "image": "World/W27A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S4"
        ],
        "normalRankRange": [
          "S2",
          "SS1"
        ],
        "hotRankRange": [
          "SS1",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "S4"
          ],
          "normal": [
            "S2",
            "S10"
          ],
          "hot": [
            "SS1",
            "MOB"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W27C",
        "name": "モブデンファット",
        "role": "SUP",
        "image": "World/W27C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A5"
        ],
        "normalRankRange": [
          "A6",
          "S2"
        ],
        "hotRankRange": [
          "S6",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A5"
          ],
          "normal": [
            "A6",
            "S2"
          ],
          "hot": [
            "S6",
            "SS3"
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
    "teamId": "W28",
    "teamNumber": 28,
    "sourceNumber": 28,
    "tier": "world",
    "name": "プニプニパーティー",
    "companyName": "プニプニパーティー",
    "logo": "World/W28D.png",
    "description": "",
    "members": [
      {
        "id": "W28B",
        "name": "モブプニグリ",
        "role": "IGL",
        "image": "World/W28B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "S1"
        ],
        "normalRankRange": [
          "A9",
          "S8"
        ],
        "hotRankRange": [
          "S6",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A10"
          ],
          "normal": [
            "A9",
            "S8"
          ],
          "hot": [
            "S6",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W28A",
        "name": "モブプニパー",
        "role": "ATK",
        "image": "World/W28A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A8"
        ],
        "normalRankRange": [
          "A9",
          "S4"
        ],
        "hotRankRange": [
          "S7",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A8"
          ],
          "normal": [
            "A9",
            "S4"
          ],
          "hot": [
            "S7",
            "SS6"
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
        "id": "W28C",
        "name": "モブプニオレ",
        "role": "SUP",
        "image": "World/W28C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "S1"
        ],
        "normalRankRange": [
          "S1",
          "S7"
        ],
        "hotRankRange": [
          "S8",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A10"
          ],
          "normal": [
            "A10",
            "S7"
          ],
          "hot": [
            "S8",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
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
    "teamId": "W29",
    "teamNumber": 29,
    "sourceNumber": 29,
    "tier": "world",
    "name": "マジックショータイム",
    "companyName": "マジックショータイム",
    "logo": "World/W29D.png",
    "description": "",
    "members": [
      {
        "id": "W29B",
        "name": "モブパンド",
        "role": "IGL",
        "image": "World/W29B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S3"
        ],
        "normalRankRange": [
          "S3",
          "S9"
        ],
        "hotRankRange": [
          "SS2",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S3"
          ],
          "normal": [
            "S3",
            "S9"
          ],
          "hot": [
            "SS2",
            "SS8"
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
        "id": "W29A",
        "name": "モブカード",
        "role": "ATK",
        "image": "World/W29A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "S1",
          "S8"
        ],
        "hotRankRange": [
          "SS1",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "S1"
          ],
          "normal": [
            "A10",
            "S8"
          ],
          "hot": [
            "S10",
            "SS7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W29C",
        "name": "モブカット",
        "role": "SUP",
        "image": "World/W29C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A4"
        ],
        "normalRankRange": [
          "A7",
          "S1"
        ],
        "hotRankRange": [
          "S4",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A4"
          ],
          "normal": [
            "A7",
            "S1"
          ],
          "hot": [
            "S4",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W30",
    "teamNumber": 30,
    "sourceNumber": 30,
    "tier": "world",
    "name": "リスタートワールズ",
    "companyName": "リスタートワールズ",
    "logo": "World/W30D.png",
    "description": "",
    "members": [
      {
        "id": "W30B",
        "name": "モブクエ",
        "role": "IGL",
        "image": "World/W30B.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "S1"
        ],
        "normalRankRange": [
          "S1",
          "S7"
        ],
        "hotRankRange": [
          "S8",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B10",
            "S1"
          ],
          "normal": [
            "A10",
            "S7"
          ],
          "hot": [
            "S8",
            "SS7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "B10",
            "to": "A1"
          },
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W30A",
        "name": "モブダクピー",
        "role": "ATK",
        "image": "World/W30A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A4",
          "S2"
        ],
        "normalRankRange": [
          "S4",
          "S9"
        ],
        "hotRankRange": [
          "SS2",
          "MOB"
        ],
        "sourceRankRanges": {
          "slump": [
            "A4",
            "S2"
          ],
          "normal": [
            "S4",
            "S9"
          ],
          "hot": [
            "SS2",
            "SS10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "SS10",
            "to": "MOB"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W30C",
        "name": "モブジャーミン",
        "role": "SUP",
        "image": "World/W30C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A7"
        ],
        "normalRankRange": [
          "A8",
          "S5"
        ],
        "hotRankRange": [
          "S7",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A7"
          ],
          "normal": [
            "A8",
            "S5"
          ],
          "hot": [
            "S7",
            "SS6"
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
    "teamId": "W31",
    "teamNumber": 31,
    "sourceNumber": 31,
    "tier": "world",
    "name": "ゴーレムロボブラスターズ",
    "companyName": "ゴーレムロボブラスターズ",
    "logo": "World/W31D.png",
    "description": "",
    "members": [
      {
        "id": "W31B",
        "name": "モブターミ",
        "role": "IGL",
        "image": "World/W31B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A5"
        ],
        "normalRankRange": [
          "A6",
          "S2"
        ],
        "hotRankRange": [
          "S6",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A5"
          ],
          "normal": [
            "A6",
            "S2"
          ],
          "hot": [
            "S6",
            "SS4"
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
        "id": "W31A",
        "name": "モブシュワ",
        "role": "ATK",
        "image": "World/W31A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A5"
        ],
        "normalRankRange": [
          "A6",
          "S2"
        ],
        "hotRankRange": [
          "S3",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A5"
          ],
          "normal": [
            "A6",
            "S2"
          ],
          "hot": [
            "S3",
            "SS4"
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
        "id": "W31C",
        "name": "モブタイゴン",
        "role": "SUP",
        "image": "World/W31C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A7"
        ],
        "normalRankRange": [
          "A7",
          "S5"
        ],
        "hotRankRange": [
          "S4",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A7"
          ],
          "normal": [
            "A7",
            "S5"
          ],
          "hot": [
            "S4",
            "SS7"
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
    "teamId": "W32",
    "teamNumber": 32,
    "sourceNumber": 32,
    "tier": "world",
    "name": "ユウシャノケイフ",
    "companyName": "ユウシャノケイフ",
    "logo": "World/W32D.png",
    "description": "",
    "members": [
      {
        "id": "W32B",
        "name": "モブユウシャ",
        "role": "IGL",
        "image": "World/W32B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A3"
        ],
        "normalRankRange": [
          "A3",
          "S1"
        ],
        "hotRankRange": [
          "S2",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "A3"
          ],
          "normal": [
            "A3",
            "A10"
          ],
          "hot": [
            "S2",
            "SS3"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W32A",
        "name": "モブシソン",
        "role": "ATK",
        "image": "World/W32A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A8"
        ],
        "normalRankRange": [
          "A7",
          "S6"
        ],
        "hotRankRange": [
          "S6",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A8"
          ],
          "normal": [
            "A7",
            "S6"
          ],
          "hot": [
            "S6",
            "SS5"
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
        "id": "W32C",
        "name": "モブセンゾ",
        "role": "SUP",
        "image": "World/W32C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B2",
          "A3"
        ],
        "normalRankRange": [
          "A4",
          "A9"
        ],
        "hotRankRange": [
          "S4",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "B2",
            "A3"
          ],
          "normal": [
            "A4",
            "A9"
          ],
          "hot": [
            "S4",
            "S8"
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
    "teamId": "W33",
    "teamNumber": 33,
    "sourceNumber": 33,
    "tier": "world",
    "name": "テクノロジーソルジャーズ",
    "companyName": "テクノロジーソルジャーズ",
    "logo": "World/W33D.png",
    "description": "",
    "members": [
      {
        "id": "W33B",
        "name": "モブスコープ",
        "role": "IGL",
        "image": "World/W33B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A4"
        ],
        "normalRankRange": [
          "A7",
          "S1"
        ],
        "hotRankRange": [
          "S4",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A4"
          ],
          "normal": [
            "A7",
            "S1"
          ],
          "hot": [
            "S4",
            "SS1"
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
        "id": "W33A",
        "name": "モブベアブ",
        "role": "ATK",
        "image": "World/W33A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A2"
        ],
        "normalRankRange": [
          "A4",
          "S1"
        ],
        "hotRankRange": [
          "S2",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A2"
          ],
          "normal": [
            "A4",
            "A10"
          ],
          "hot": [
            "S2",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W33C",
        "name": "モブランボル",
        "role": "SUP",
        "image": "World/W33C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A7"
        ],
        "normalRankRange": [
          "A5",
          "S3"
        ],
        "hotRankRange": [
          "S3",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A7"
          ],
          "normal": [
            "A5",
            "S3"
          ],
          "hot": [
            "S3",
            "SS4"
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
    "teamId": "W34",
    "teamNumber": 34,
    "sourceNumber": 34,
    "tier": "world",
    "name": "マウスオブトップ",
    "companyName": "マウスオブトップ",
    "logo": "World/W34D.png",
    "description": "",
    "members": [
      {
        "id": "W34B",
        "name": "モブマイキー",
        "role": "IGL",
        "image": "World/W34B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A1"
        ],
        "normalRankRange": [
          "A1",
          "A8"
        ],
        "hotRankRange": [
          "S1",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "B10"
          ],
          "normal": [
            "A1",
            "A8"
          ],
          "hot": [
            "S1",
            "S9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
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
        "id": "W34A",
        "name": "モブリンキー",
        "role": "ATK",
        "image": "World/W34A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A9"
        ],
        "normalRankRange": [
          "A8",
          "S5"
        ],
        "hotRankRange": [
          "S8",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A9"
          ],
          "normal": [
            "A8",
            "S5"
          ],
          "hot": [
            "S8",
            "SS7"
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
        "id": "W34C",
        "name": "モブロッキー",
        "role": "SUP",
        "image": "World/W34C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B2",
          "A1"
        ],
        "normalRankRange": [
          "A2",
          "A7"
        ],
        "hotRankRange": [
          "A9",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B2",
            "A1"
          ],
          "normal": [
            "A2",
            "A7"
          ],
          "hot": [
            "A9",
            "S9"
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
    "teamId": "W35",
    "teamNumber": 35,
    "sourceNumber": 35,
    "tier": "world",
    "name": "ヤミネコクリティカル",
    "companyName": "ヤミネコクリティカル",
    "logo": "World/W35D.png",
    "description": "",
    "members": [
      {
        "id": "W35B",
        "name": "モブレール",
        "role": "IGL",
        "image": "World/W35B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A5"
        ],
        "normalRankRange": [
          "A5",
          "S3"
        ],
        "hotRankRange": [
          "S3",
          "SS6"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A5"
          ],
          "normal": [
            "A5",
            "S3"
          ],
          "hot": [
            "S3",
            "SS6"
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
        "id": "W35A",
        "name": "モブキャリー",
        "role": "ATK",
        "image": "World/W35A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A2"
        ],
        "normalRankRange": [
          "A2",
          "A8"
        ],
        "hotRankRange": [
          "S1",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "A2"
          ],
          "normal": [
            "A2",
            "A8"
          ],
          "hot": [
            "S1",
            "SS1"
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
        "id": "W35C",
        "name": "モブドリフ",
        "role": "SUP",
        "image": "World/W35C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A5"
        ],
        "normalRankRange": [
          "A6",
          "S2"
        ],
        "hotRankRange": [
          "S5",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A5"
          ],
          "normal": [
            "A6",
            "S2"
          ],
          "hot": [
            "S5",
            "SS1"
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
    "teamId": "W36",
    "teamNumber": 36,
    "sourceNumber": 36,
    "tier": "world",
    "name": "スタイリッシュエージェント",
    "companyName": "スタイリッシュエージェント",
    "logo": "World/W36D.png",
    "description": "全員が高いエイムを誇る強豪チーム",
    "members": [
      {
        "id": "W36B",
        "name": "モブカウボ",
        "role": "IGL",
        "image": "World/W36B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A8"
        ],
        "normalRankRange": [
          "A9",
          "S4"
        ],
        "hotRankRange": [
          "S9",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A8"
          ],
          "normal": [
            "A9",
            "S4"
          ],
          "hot": [
            "S9",
            "SS3"
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
        "id": "W36A",
        "name": "モブリュク",
        "role": "ATK",
        "image": "World/W36A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A7"
        ],
        "normalRankRange": [
          "A6",
          "S3"
        ],
        "hotRankRange": [
          "S3",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A7"
          ],
          "normal": [
            "A6",
            "S3"
          ],
          "hot": [
            "S3",
            "SS3"
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
        "id": "W36C",
        "name": "モブコスコ",
        "role": "SUP",
        "image": "World/W36C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "A2"
        ],
        "normalRankRange": [
          "A1",
          "A9"
        ],
        "hotRankRange": [
          "A8",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "A2"
          ],
          "normal": [
            "B10",
            "A9"
          ],
          "hot": [
            "A8",
            "S9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
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
    "teamId": "W37",
    "teamNumber": 37,
    "sourceNumber": 37,
    "tier": "world",
    "name": "コスモキャットロード",
    "companyName": "コスモキャットロード",
    "logo": "World/W37D.png",
    "description": "テクニックは世界トップクラスのチーム",
    "members": [
      {
        "id": "W37B",
        "name": "モブムク",
        "role": "IGL",
        "image": "World/W37B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A5"
        ],
        "normalRankRange": [
          "A3",
          "S1"
        ],
        "hotRankRange": [
          "S2",
          "SS2"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A5"
          ],
          "normal": [
            "A3",
            "S1"
          ],
          "hot": [
            "S2",
            "SS2"
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
        "id": "W37A",
        "name": "モブヴァル",
        "role": "ATK",
        "image": "World/W37A.png",
        "characterRank": null,
        "slumpRankRange": [
          "A1",
          "A7"
        ],
        "normalRankRange": [
          "S1",
          "S4"
        ],
        "hotRankRange": [
          "S9",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "A1",
            "A7"
          ],
          "normal": [
            "A10",
            "S4"
          ],
          "hot": [
            "S9",
            "SS5"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W37C",
        "name": "モブスタチュ",
        "role": "SUP",
        "image": "World/W37C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A2"
        ],
        "normalRankRange": [
          "A4",
          "S1"
        ],
        "hotRankRange": [
          "S4",
          "SS2"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A2"
          ],
          "normal": [
            "A4",
            "A10"
          ],
          "hot": [
            "S4",
            "SS2"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
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
    "teamId": "W38",
    "teamNumber": 38,
    "sourceNumber": 38,
    "tier": "world",
    "name": "ブラックホールズ",
    "companyName": "ブラックホールズ",
    "logo": "World/W38D.png",
    "description": "",
    "members": [
      {
        "id": "W38B",
        "name": "モブサクル",
        "role": "IGL",
        "image": "World/W38B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A6"
        ],
        "normalRankRange": [
          "A7",
          "S2"
        ],
        "hotRankRange": [
          "S4",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A6"
          ],
          "normal": [
            "A7",
            "S2"
          ],
          "hot": [
            "S4",
            "SS5"
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
        "id": "W38A",
        "name": "モブエンド",
        "role": "ATK",
        "image": "World/W38A.png",
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
          "S2",
          "SS4"
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
            "S2",
            "SS4"
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
        "id": "W38C",
        "name": "モブサイン",
        "role": "SUP",
        "image": "World/W38C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A7"
        ],
        "normalRankRange": [
          "A8",
          "S5"
        ],
        "hotRankRange": [
          "S6",
          "SS8"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A7"
          ],
          "normal": [
            "A8",
            "S5"
          ],
          "hot": [
            "S6",
            "SS8"
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
    "teamId": "W39",
    "teamNumber": 39,
    "sourceNumber": 39,
    "tier": "world",
    "name": "ワンミニッツスプライト",
    "companyName": "ワンミニッツスプライト",
    "logo": "World/W39D.png",
    "description": "",
    "members": [
      {
        "id": "W39B",
        "name": "モブミニット",
        "role": "IGL",
        "image": "World/W39B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "A3"
        ],
        "normalRankRange": [
          "A4",
          "S1"
        ],
        "hotRankRange": [
          "S4",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "A3"
          ],
          "normal": [
            "A4",
            "A10"
          ],
          "hot": [
            "S4",
            "S9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W39A",
        "name": "モブセカンド",
        "role": "ATK",
        "image": "World/W39A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A8"
        ],
        "normalRankRange": [
          "A8",
          "S6"
        ],
        "hotRankRange": [
          "S8",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A8"
          ],
          "normal": [
            "A8",
            "S6"
          ],
          "hot": [
            "S8",
            "SS5"
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
        "id": "W39C",
        "name": "モブスプラ",
        "role": "SUP",
        "image": "World/W39C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A1"
        ],
        "normalRankRange": [
          "A2",
          "A8"
        ],
        "hotRankRange": [
          "A9",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "B10"
          ],
          "normal": [
            "A2",
            "A8"
          ],
          "hot": [
            "A9",
            "S8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
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
    "teamId": "W40",
    "teamNumber": 40,
    "sourceNumber": 40,
    "tier": "world",
    "name": "ナチュラルエイマーズ",
    "companyName": "ナチュラルエイマーズ",
    "logo": "World/W40D.png",
    "description": "",
    "members": [
      {
        "id": "W40B",
        "name": "モブナチュラ",
        "role": "IGL",
        "image": "World/W40B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "A7"
        ],
        "normalRankRange": [
          "A5",
          "S4"
        ],
        "hotRankRange": [
          "S3",
          "SS5"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "A7"
          ],
          "normal": [
            "A5",
            "S4"
          ],
          "hot": [
            "S3",
            "SS5"
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
        "id": "W40A",
        "name": "モブサイト",
        "role": "ATK",
        "image": "World/W40A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "A2"
        ],
        "normalRankRange": [
          "A5",
          "S1"
        ],
        "hotRankRange": [
          "S4",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "A2"
          ],
          "normal": [
            "A5",
            "A10"
          ],
          "hot": [
            "S4",
            "SS1"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "A10",
            "to": "S1"
          }
        ],
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W40C",
        "name": "モブフォーカス",
        "role": "SUP",
        "image": "World/W40C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A7"
        ],
        "normalRankRange": [
          "A6",
          "S3"
        ],
        "hotRankRange": [
          "S5",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A7"
          ],
          "normal": [
            "A6",
            "S3"
          ],
          "hot": [
            "S5",
            "SS4"
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
    "teamId": "W41",
    "teamNumber": 41,
    "sourceNumber": 41,
    "tier": "world",
    "name": "クリスマススリーサンタ",
    "companyName": "クリスマススリーサンタ",
    "logo": "World/W41D.png",
    "description": "",
    "members": [
      {
        "id": "W41B",
        "name": "モブアカサンタ",
        "role": "IGL",
        "image": "World/W41B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "A1"
        ],
        "normalRankRange": [
          "A2",
          "A8"
        ],
        "hotRankRange": [
          "A9",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "B10"
          ],
          "normal": [
            "A2",
            "A8"
          ],
          "hot": [
            "A9",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "W41A",
        "name": "モブピンクサンタ",
        "role": "ATK",
        "image": "World/W41A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B7",
          "A6"
        ],
        "normalRankRange": [
          "A6",
          "S4"
        ],
        "hotRankRange": [
          "S3",
          "SS7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B7",
            "A6"
          ],
          "normal": [
            "A6",
            "S4"
          ],
          "hot": [
            "S3",
            "SS7"
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
        "id": "W41C",
        "name": "モブブルーサンタ",
        "role": "SUP",
        "image": "World/W41C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B4",
          "A1"
        ],
        "normalRankRange": [
          "A3",
          "A7"
        ],
        "hotRankRange": [
          "S1",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "B4",
            "A1"
          ],
          "normal": [
            "A3",
            "A7"
          ],
          "hot": [
            "S1",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
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
    "teamId": "W42",
    "teamNumber": 42,
    "sourceNumber": 42,
    "tier": "world",
    "name": "モブアーティストレジェンド",
    "companyName": "モブアーティストレジェンド",
    "logo": "World/W42D.png",
    "description": "5年目から世界大会に毎回参戦 大人気企業が参入 実力も超一級品",
    "members": [
      {
        "id": "W42B",
        "name": "モブシュガペロ",
        "role": "IGL",
        "image": "World/W42B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A5"
        ],
        "normalRankRange": [
          "A6",
          "S3"
        ],
        "hotRankRange": [
          "S5",
          "SS2"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A5"
          ],
          "normal": [
            "A6",
            "S3"
          ],
          "hot": [
            "S5",
            "SS2"
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
        "id": "W42A",
        "name": "モブカカオ",
        "role": "ATK",
        "image": "World/W42A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "A2"
        ],
        "normalRankRange": [
          "A3",
          "A8"
        ],
        "hotRankRange": [
          "S3",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "A2"
          ],
          "normal": [
            "A3",
            "A8"
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
        "id": "W42C",
        "name": "モブビスケット",
        "role": "SUP",
        "image": "World/W42C.png",
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
          "S4",
          "SS1"
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
            "S4",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 5,
    "unlockCalendarYear": 1993,
    "isExpansionTeam": true,
    "skillProfile": "role_common",
    "teamTrait": null
  },
  {
    "teamId": "W43",
    "teamNumber": 43,
    "sourceNumber": 43,
    "tier": "world",
    "name": "モブアーティストクリエイト",
    "companyName": "モブアーティストクリエイト",
    "logo": "World/W43D.png",
    "description": "5年目から世界大会に毎回参戦 大人気企業2チーム目 もちろん超一級品",
    "members": [
      {
        "id": "W43B",
        "name": "モブバター",
        "role": "IGL",
        "image": "World/W43B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A5"
        ],
        "normalRankRange": [
          "A7",
          "S3"
        ],
        "hotRankRange": [
          "S4",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A5"
          ],
          "normal": [
            "A7",
            "S3"
          ],
          "hot": [
            "S4",
            "SS3"
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
        "id": "W43A",
        "name": "モブミルキー",
        "role": "ATK",
        "image": "World/W43A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A7"
        ],
        "normalRankRange": [
          "A7",
          "S3"
        ],
        "hotRankRange": [
          "S5",
          "SS4"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A7"
          ],
          "normal": [
            "A7",
            "S3"
          ],
          "hot": [
            "S5",
            "SS4"
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
        "id": "W43C",
        "name": "モブマーブル",
        "role": "SUP",
        "image": "World/W43C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A2"
        ],
        "normalRankRange": [
          "A1",
          "A9"
        ],
        "hotRankRange": [
          "S1",
          "SS1"
        ],
        "sourceRankRanges": {
          "slump": [
            "C10",
            "A2"
          ],
          "normal": [
            "A1",
            "A9"
          ],
          "hot": [
            "A10",
            "S10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "C10",
            "to": "B1"
          },
          {
            "form": "hot",
            "boundary": "min",
            "from": "A10",
            "to": "S1"
          },
          {
            "form": "hot",
            "boundary": "max",
            "from": "S10",
            "to": "SS1"
          }
        ],
        "weaponName": "SUP共通武器",
        "preferredRange": "far",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      }
    ],
    "unlockGameYear": 5,
    "unlockCalendarYear": 1993,
    "isExpansionTeam": true,
    "skillProfile": "role_common",
    "teamTrait": null
  }
]
);

const teamById = new Map(
  WORLD_CPU_ALL_TEAMS.map((team) => [team.teamId, team]),
);

export function getWorldCpuTeam(teamId) {
  const team = teamById.get(teamId);
  if (!team) {
    throw new RangeError(`Unknown world CPU team: ${teamId}`);
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

export function validateWorldCpuMaster() {
  if (WORLD_CPU_ALL_TEAMS.length !== 43) {
    throw new Error("world CPU team count must equal 43.");
  }

  const teamIds = new Set();
  const playerIds = new Set();

  for (const team of WORLD_CPU_ALL_TEAMS) {
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

  
  if (WORLD_CPU_TEAMS.length !== 41 || WORLD_CPU_EXPANSION_TEAMS.length !== 2) {
    throw new Error("World formal/expansion counts must be 41/2.");
  }
  if (
    WORLD_CPU_EXPANSION_TEAMS.some(
      (team) =>
        team.unlockGameYear !== 5 ||
        team.unlockCalendarYear !== 1993,
    )
  ) {
    throw new Error("World expansion unlock year is invalid.");
  }


  return deepFreeze({
    teamCount: WORLD_CPU_ALL_TEAMS.length,
    playerCount: playerIds.size,
    valid: true,
  });
}


export const WORLD_CPU_TEAMS = deepFreeze(
  WORLD_CPU_ALL_TEAMS.filter((team) => !team.isExpansionTeam),
);

export const WORLD_CPU_EXPANSION_TEAMS = deepFreeze(
  WORLD_CPU_ALL_TEAMS.filter((team) => team.isExpansionTeam),
);

export function getWorldCpuTeamsForYear(calendarYear) {
  if (!Number.isInteger(calendarYear) || calendarYear < 1989) {
    throw new RangeError("World CPU calendar year must be 1989 or later.");
  }
  return deepFreeze(
    WORLD_CPU_ALL_TEAMS.filter(
      (team) => team.unlockCalendarYear <= calendarYear,
    ),
  );
}

