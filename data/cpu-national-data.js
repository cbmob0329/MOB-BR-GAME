/**
 * MOB BR NATIONAL CPU master data.
 *
 * Team names, player names, images, descriptions, and form rank ranges are
 * parsed from CPU.txt. Legacy rank labels ending in 10 are normalized.
 */

import {
  ROLE_IDS,
  normalizeLegacyRank,
  rankToCharacterValue,
} from "./game-data.js";

export const CPU_NATIONAL_DATA_VERSION = "mobbr-cpu-national-data-1.0.0";
export const CPU_NATIONAL_MASTER_VERSION = "mobbr-cpu-national-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const CPU_NATIONAL_SOURCE_NOTES = deepFreeze({
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

export const NATIONAL_CPU_TEAMS = deepFreeze(
  [
  {
    "teamId": "N1",
    "teamNumber": 1,
    "sourceNumber": 1,
    "tier": "national",
    "name": "ジョーダンロケッツ",
    "companyName": "ジョーダンロケッツ",
    "logo": "National/N1D.png",
    "description": "ナショナル最強のチーム 世界大会で優勝を狙えるほどの実力を持つ",
    "members": [
      {
        "id": "N1B",
        "name": "モブマックス",
        "role": "IGL",
        "image": "National/N1B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A9"
        ],
        "normalRankRange": [
          "A8",
          "S5"
        ],
        "hotRankRange": [
          "S7",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A9"
          ],
          "normal": [
            "A8",
            "S5"
          ],
          "hot": [
            "S7",
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
        "id": "N1A",
        "name": "モブトラックス",
        "role": "ATK",
        "image": "National/N1A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A5"
        ],
        "normalRankRange": [
          "A8",
          "S2"
        ],
        "hotRankRange": [
          "S8",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A5"
          ],
          "normal": [
            "A8",
            "S2"
          ],
          "hot": [
            "S8",
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
        "id": "N1C",
        "name": "モブスワイプ",
        "role": "SUP",
        "image": "National/N1C.png",
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
          "S9"
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
    "teamId": "N2",
    "teamNumber": 2,
    "sourceNumber": 2,
    "tier": "national",
    "name": "ブラックオーダーズ",
    "companyName": "ブラックオーダーズ",
    "logo": "National/N2D.png",
    "description": "ナショナル上位常連のチーム",
    "members": [
      {
        "id": "N2B",
        "name": "モブエンピン",
        "role": "IGL",
        "image": "National/N2B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A3"
        ],
        "normalRankRange": [
          "A5",
          "S1"
        ],
        "hotRankRange": [
          "S3",
          "SS2"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A3"
          ],
          "normal": [
            "A5",
            "A10"
          ],
          "hot": [
            "S3",
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N2A",
        "name": "モブミッドナイト",
        "role": "ATK",
        "image": "National/N2A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B9",
          "A8"
        ],
        "normalRankRange": [
          "A9",
          "S5"
        ],
        "hotRankRange": [
          "S7",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B9",
            "A8"
          ],
          "normal": [
            "A9",
            "S5"
          ],
          "hot": [
            "S7",
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
        "id": "N2C",
        "name": "モブマウマウ",
        "role": "SUP",
        "image": "National/N2C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B6",
          "A7"
        ],
        "normalRankRange": [
          "A6",
          "S3"
        ],
        "hotRankRange": [
          "S5",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B6",
            "A7"
          ],
          "normal": [
            "A6",
            "S3"
          ],
          "hot": [
            "S5",
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
    "teamId": "N3",
    "teamNumber": 3,
    "sourceNumber": 3,
    "tier": "national",
    "name": "ファイヤーボール",
    "companyName": "ファイヤーボール",
    "logo": "National/N3D.png",
    "description": "",
    "members": [
      {
        "id": "N3B",
        "name": "モブファイン",
        "role": "IGL",
        "image": "National/N3B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A8"
        ],
        "normalRankRange": [
          "A9",
          "S5"
        ],
        "hotRankRange": [
          "S9",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A8"
          ],
          "normal": [
            "A9",
            "S5"
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
        "id": "N3A",
        "name": "モブループ",
        "role": "ATK",
        "image": "National/N3A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A6"
        ],
        "normalRankRange": [
          "A6",
          "S4"
        ],
        "hotRankRange": [
          "S3",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A6"
          ],
          "normal": [
            "A6",
            "S4"
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
        "id": "N3C",
        "name": "モブロンス",
        "role": "SUP",
        "image": "National/N3C.png",
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
          "S4",
          "SS2"
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
            "S4",
            "SS2"
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
    "teamId": "N4",
    "teamNumber": 4,
    "sourceNumber": 4,
    "tier": "national",
    "name": "パティシエグルーブ",
    "companyName": "パティシエグルーブ",
    "logo": "National/N4D.png",
    "description": "",
    "members": [
      {
        "id": "N4B",
        "name": "モブサラダ",
        "role": "IGL",
        "image": "National/N4B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A4"
        ],
        "normalRankRange": [
          "A3",
          "S2"
        ],
        "hotRankRange": [
          "S2",
          "SS2"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "A4"
          ],
          "normal": [
            "A3",
            "S2"
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
        "id": "N4A",
        "name": "モブホイコー",
        "role": "ATK",
        "image": "National/N4A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B8",
          "A9"
        ],
        "normalRankRange": [
          "S1",
          "S5"
        ],
        "hotRankRange": [
          "S9",
          "SS3"
        ],
        "sourceRankRanges": {
          "slump": [
            "B8",
            "A9"
          ],
          "normal": [
            "A10",
            "S5"
          ],
          "hot": [
            "S9",
            "SS3"
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
        "id": "N4C",
        "name": "モブスイッツ",
        "role": "SUP",
        "image": "National/N4C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B2",
          "A5"
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
            "B2",
            "A5"
          ],
          "normal": [
            "A4",
            "S1"
          ],
          "hot": [
            "S4",
            "SS2"
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
    "teamId": "N5",
    "teamNumber": 5,
    "sourceNumber": 5,
    "tier": "national",
    "name": "ニンジャライト",
    "companyName": "ニンジャライト",
    "logo": "National/N5D.png",
    "description": "",
    "members": [
      {
        "id": "N5B",
        "name": "モブノミツ",
        "role": "IGL",
        "image": "National/N5B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B2",
          "B9"
        ],
        "normalRankRange": [
          "A1",
          "A7"
        ],
        "hotRankRange": [
          "A8",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B2",
            "B9"
          ],
          "normal": [
            "A1",
            "A7"
          ],
          "hot": [
            "A8",
            "S9"
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
        "id": "N5A",
        "name": "モブクナイ",
        "role": "ATK",
        "image": "National/N5A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C9",
          "A1"
        ],
        "normalRankRange": [
          "B8",
          "A6"
        ],
        "hotRankRange": [
          "A6",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "C9",
            "B10"
          ],
          "normal": [
            "B8",
            "A6"
          ],
          "hot": [
            "A6",
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
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N5C",
        "name": "モブノイチ",
        "role": "SUP",
        "image": "National/N5C.png",
        "characterRank": null,
        "slumpRankRange": [
          "B3",
          "B9"
        ],
        "normalRankRange": [
          "A2",
          "A6"
        ],
        "hotRankRange": [
          "S1",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "B3",
            "B9"
          ],
          "normal": [
            "A2",
            "A6"
          ],
          "hot": [
            "A10",
            "S8"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
    "teamId": "N6",
    "teamNumber": 6,
    "sourceNumber": 6,
    "tier": "national",
    "name": "ボムボムブラザーズ",
    "companyName": "ボムボムブラザーズ",
    "logo": "National/N6D.png",
    "description": "",
    "members": [
      {
        "id": "N6B",
        "name": "モブボンバー",
        "role": "IGL",
        "image": "National/N6B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B9"
        ],
        "normalRankRange": [
          "B8",
          "A5"
        ],
        "hotRankRange": [
          "A8",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B9"
          ],
          "normal": [
            "B8",
            "A5"
          ],
          "hot": [
            "A8",
            "S8"
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
        "id": "N6A",
        "name": "モブスローボム",
        "role": "ATK",
        "image": "National/N6A.png",
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
          "S2",
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
            "S2",
            "S9"
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
        "id": "N6C",
        "name": "モブボマー",
        "role": "SUP",
        "image": "National/N6C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C6",
          "B6"
        ],
        "normalRankRange": [
          "B6",
          "A3"
        ],
        "hotRankRange": [
          "A3",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C6",
            "B6"
          ],
          "normal": [
            "B6",
            "A3"
          ],
          "hot": [
            "A3",
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
    "teamId": "N7",
    "teamNumber": 7,
    "sourceNumber": 7,
    "tier": "national",
    "name": "キンミライセカイ",
    "companyName": "キンミライセカイ",
    "logo": "National/N7D.png",
    "description": "",
    "members": [
      {
        "id": "N7B",
        "name": "モブサーティーン",
        "role": "IGL",
        "image": "National/N7B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B9"
        ],
        "normalRankRange": [
          "B9",
          "A5"
        ],
        "hotRankRange": [
          "A7",
          "S5"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B9"
          ],
          "normal": [
            "B9",
            "A5"
          ],
          "hot": [
            "A7",
            "S5"
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
        "id": "N7A",
        "name": "モブアキンボ",
        "role": "ATK",
        "image": "National/N7A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B8"
        ],
        "normalRankRange": [
          "B9",
          "A5"
        ],
        "hotRankRange": [
          "A8",
          "S5"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B8"
          ],
          "normal": [
            "B9",
            "A5"
          ],
          "hot": [
            "A8",
            "S5"
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
        "id": "N7C",
        "name": "モブゴウ",
        "role": "SUP",
        "image": "National/N7C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C9",
          "A1"
        ],
        "normalRankRange": [
          "A1",
          "A8"
        ],
        "hotRankRange": [
          "A9",
          "S8"
        ],
        "sourceRankRanges": {
          "slump": [
            "C9",
            "B10"
          ],
          "normal": [
            "B10",
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
          },
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
    "teamId": "N8",
    "teamNumber": 8,
    "sourceNumber": 8,
    "tier": "national",
    "name": "ナショナルトレーニングファイヤーズ",
    "companyName": "ナショナルトレーニングファイヤーズ",
    "logo": "National/N8D.png",
    "description": "ナショナル常連チーム",
    "members": [
      {
        "id": "N8B",
        "name": "モブアッチー",
        "role": "IGL",
        "image": "National/N8B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "A4"
        ],
        "normalRankRange": [
          "A3",
          "A9"
        ],
        "hotRankRange": [
          "S3",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "A4"
          ],
          "normal": [
            "A3",
            "A9"
          ],
          "hot": [
            "S3",
            "S9"
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
        "id": "N8A",
        "name": "モブネップウ",
        "role": "ATK",
        "image": "National/N8A.png",
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
          "A7",
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
            "A7",
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
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N8C",
        "name": "モブアツ",
        "role": "SUP",
        "image": "National/N8C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C5",
          "B4"
        ],
        "normalRankRange": [
          "B7",
          "A2"
        ],
        "hotRankRange": [
          "A5",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C5",
            "B4"
          ],
          "normal": [
            "B7",
            "A2"
          ],
          "hot": [
            "A5",
            "S4"
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
    "teamId": "N9",
    "teamNumber": 9,
    "sourceNumber": 9,
    "tier": "national",
    "name": "ナショナルトレーニングブリザード",
    "companyName": "ナショナルトレーニングブリザード",
    "logo": "National/N9D.png",
    "description": "ナショナル常連チーム",
    "members": [
      {
        "id": "N9B",
        "name": "モブサッミー",
        "role": "IGL",
        "image": "National/N9B.png",
        "characterRank": null,
        "slumpRankRange": [
          "B1",
          "B7"
        ],
        "normalRankRange": [
          "A1",
          "A4"
        ],
        "hotRankRange": [
          "A9",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "B7"
          ],
          "normal": [
            "B10",
            "A4"
          ],
          "hot": [
            "A9",
            "S7"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N9A",
        "name": "モブレイフウ",
        "role": "ATK",
        "image": "National/N9A.png",
        "characterRank": null,
        "slumpRankRange": [
          "B5",
          "A2"
        ],
        "normalRankRange": [
          "A4",
          "A9"
        ],
        "hotRankRange": [
          "S3",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "B5",
            "A2"
          ],
          "normal": [
            "A4",
            "A9"
          ],
          "hot": [
            "S3",
            "S9"
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
        "id": "N9C",
        "name": "モブヒエ",
        "role": "SUP",
        "image": "National/N9C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C9",
          "B8"
        ],
        "normalRankRange": [
          "B8",
          "A6"
        ],
        "hotRankRange": [
          "A8",
          "S9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C9",
            "B8"
          ],
          "normal": [
            "B8",
            "A6"
          ],
          "hot": [
            "A8",
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
    "teamId": "N10",
    "teamNumber": 10,
    "sourceNumber": 10,
    "tier": "national",
    "name": "トマトケチャップテイルズ",
    "companyName": "トマトケチャップテイルズ",
    "logo": "National/N10D.png",
    "description": "",
    "members": [
      {
        "id": "N10B",
        "name": "モブトマティー",
        "role": "IGL",
        "image": "National/N10B.png",
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
          "A8",
          "S7"
        ],
        "sourceRankRanges": {
          "slump": [
            "B1",
            "A1"
          ],
          "normal": [
            "A1",
            "A8"
          ],
          "hot": [
            "A8",
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
        "id": "N10A",
        "name": "モブオムレツ",
        "role": "ATK",
        "image": "National/N10A.png",
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
          "A9",
          "S8"
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
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N10C",
        "name": "モブトマジュー",
        "role": "SUP",
        "image": "National/N10C.png",
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
          "S1",
          "S7"
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
            "A10",
            "S7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
    "teamId": "N11",
    "teamNumber": 11,
    "sourceNumber": 11,
    "tier": "national",
    "name": "ホワイトピンクウォーターズ",
    "companyName": "ホワイトピンクウォーターズ",
    "logo": "National/N11D.png",
    "description": "",
    "members": [
      {
        "id": "N11B",
        "name": "モブアルバ",
        "role": "IGL",
        "image": "National/N11B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B2"
        ],
        "normalRankRange": [
          "B2",
          "A1"
        ],
        "hotRankRange": [
          "A2",
          "S1"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "B2"
          ],
          "normal": [
            "B2",
            "B10"
          ],
          "hot": [
            "A2",
            "S1"
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
        "id": "N11A",
        "name": "モブロゼッタ",
        "role": "ATK",
        "image": "National/N11A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C5",
          "B4"
        ],
        "normalRankRange": [
          "B6",
          "A2"
        ],
        "hotRankRange": [
          "A6",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C5",
            "B4"
          ],
          "normal": [
            "B6",
            "A2"
          ],
          "hot": [
            "A6",
            "S3"
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
        "id": "N11C",
        "name": "モブパール",
        "role": "SUP",
        "image": "National/N11C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C2",
          "B3"
        ],
        "normalRankRange": [
          "B3",
          "B9"
        ],
        "hotRankRange": [
          "A1",
          "S1"
        ],
        "sourceRankRanges": {
          "slump": [
            "C2",
            "B3"
          ],
          "normal": [
            "B3",
            "B9"
          ],
          "hot": [
            "B10",
            "S1"
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
    "teamId": "N12",
    "teamNumber": 12,
    "sourceNumber": 12,
    "tier": "national",
    "name": "パルクールクルー",
    "companyName": "パルクールクルー",
    "logo": "National/N12D.png",
    "description": "",
    "members": [
      {
        "id": "N12B",
        "name": "モブヴォルト",
        "role": "IGL",
        "image": "National/N12B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B3"
        ],
        "normalRankRange": [
          "B6",
          "A1"
        ],
        "hotRankRange": [
          "A4",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B3"
          ],
          "normal": [
            "B6",
            "A1"
          ],
          "hot": [
            "A4",
            "S3"
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
        "id": "N12A",
        "name": "モブランダー",
        "role": "ATK",
        "image": "National/N12A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B4"
        ],
        "normalRankRange": [
          "B3",
          "A1"
        ],
        "hotRankRange": [
          "A2",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "B4"
          ],
          "normal": [
            "B3",
            "B10"
          ],
          "hot": [
            "A2",
            "S3"
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
        "id": "N12C",
        "name": "モブフリーラン",
        "role": "SUP",
        "image": "National/N12C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C2",
          "B6"
        ],
        "normalRankRange": [
          "B4",
          "A3"
        ],
        "hotRankRange": [
          "A3",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C2",
            "B6"
          ],
          "normal": [
            "B4",
            "A3"
          ],
          "hot": [
            "A3",
            "S4"
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
    "teamId": "N13",
    "teamNumber": 13,
    "sourceNumber": 13,
    "tier": "national",
    "name": "スピーディートライアングル",
    "companyName": "スピーディートライアングル",
    "logo": "National/N13D.png",
    "description": "",
    "members": [
      {
        "id": "N13B",
        "name": "モブデルタ",
        "role": "IGL",
        "image": "National/N13B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
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
            "C1",
            "C10"
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
        "id": "N13A",
        "name": "モブベクトル",
        "role": "ATK",
        "image": "National/N13A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B5"
        ],
        "normalRankRange": [
          "B7",
          "A1"
        ],
        "hotRankRange": [
          "A4",
          "S1"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B5"
          ],
          "normal": [
            "B7",
            "A1"
          ],
          "hot": [
            "A4",
            "A10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
        "id": "N13C",
        "name": "モブトライ",
        "role": "SUP",
        "image": "National/N13C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C2",
          "B1"
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
            "C2",
            "C10"
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
    "teamId": "N14",
    "teamNumber": 14,
    "sourceNumber": 14,
    "tier": "national",
    "name": "セカイノイルカエル",
    "companyName": "セカイノイルカエル",
    "logo": "National/N14D.png",
    "description": "ナショナルでは上位常連、最高の連携力を持つチーム",
    "members": [
      {
        "id": "N14B",
        "name": "モブイルカエル",
        "role": "IGL",
        "image": "National/N14B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B3"
        ],
        "normalRankRange": [
          "B4",
          "B9"
        ],
        "hotRankRange": [
          "A3",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B3"
          ],
          "normal": [
            "B4",
            "B9"
          ],
          "hot": [
            "A3",
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
        "id": "N14A",
        "name": "モブレッドイル",
        "role": "ATK",
        "image": "National/N14A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
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
            "B1"
          ],
          "normal": [
            "B1",
            "B8"
          ],
          "hot": [
            "A1",
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
        "id": "N14C",
        "name": "モブグリゲコ",
        "role": "SUP",
        "image": "National/N14C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C5",
          "B5"
        ],
        "normalRankRange": [
          "B5",
          "A2"
        ],
        "hotRankRange": [
          "A5",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C5",
            "B5"
          ],
          "normal": [
            "B5",
            "A2"
          ],
          "hot": [
            "A5",
            "S3"
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
    "teamId": "N15",
    "teamNumber": 15,
    "sourceNumber": 15,
    "tier": "national",
    "name": "ネオンストリートクラブ",
    "companyName": "ネオンストリートクラブ",
    "logo": "National/N15D.png",
    "description": "",
    "members": [
      {
        "id": "N15B",
        "name": "モブゴールド",
        "role": "IGL",
        "image": "National/N15B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C7",
          "B8"
        ],
        "normalRankRange": [
          "B8",
          "A3"
        ],
        "hotRankRange": [
          "A5",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C7",
            "B8"
          ],
          "normal": [
            "B8",
            "A3"
          ],
          "hot": [
            "A5",
            "S4"
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
        "id": "N15A",
        "name": "モブネオン",
        "role": "ATK",
        "image": "National/N15A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B6"
        ],
        "normalRankRange": [
          "B5",
          "A3"
        ],
        "hotRankRange": [
          "A3",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B6"
          ],
          "normal": [
            "B5",
            "A3"
          ],
          "hot": [
            "A3",
            "S4"
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
        "id": "N15C",
        "name": "モブシルバー",
        "role": "SUP",
        "image": "National/N15C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D8",
          "C7"
        ],
        "normalRankRange": [
          "C9",
          "B5"
        ],
        "hotRankRange": [
          "B8",
          "A8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D8",
            "C7"
          ],
          "normal": [
            "C9",
            "B5"
          ],
          "hot": [
            "B8",
            "A8"
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
    "teamId": "N16",
    "teamNumber": 16,
    "sourceNumber": 16,
    "tier": "national",
    "name": "ヨルノサクセンカイギ",
    "companyName": "ヨルノサクセンカイギ",
    "logo": "National/N16D.png",
    "description": "",
    "members": [
      {
        "id": "N16B",
        "name": "モブナイト",
        "role": "IGL",
        "image": "National/N16B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B4"
        ],
        "normalRankRange": [
          "B2",
          "A1"
        ],
        "hotRankRange": [
          "A2",
          "S1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "B4"
          ],
          "normal": [
            "B2",
            "A1"
          ],
          "hot": [
            "A2",
            "A10"
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
        "id": "N16A",
        "name": "モブシャドウ",
        "role": "ATK",
        "image": "National/N16A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C7",
          "B7"
        ],
        "normalRankRange": [
          "B9",
          "A3"
        ],
        "hotRankRange": [
          "A9",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C7",
            "B7"
          ],
          "normal": [
            "B9",
            "A3"
          ],
          "hot": [
            "A9",
            "S3"
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
        "id": "N16C",
        "name": "モブシーク",
        "role": "SUP",
        "image": "National/N16C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B2"
        ],
        "normalRankRange": [
          "B3",
          "A1"
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
            "B3",
            "B10"
          ],
          "hot": [
            "B10",
            "A9"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
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
    "teamId": "N17",
    "teamNumber": 17,
    "sourceNumber": 17,
    "tier": "national",
    "name": "イロノハジマリ",
    "companyName": "イロノハジマリ",
    "logo": "National/N17D.png",
    "description": "",
    "members": [
      {
        "id": "N17B",
        "name": "モブオリジン",
        "role": "IGL",
        "image": "National/N17B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C7",
          "B5"
        ],
        "normalRankRange": [
          "B6",
          "A2"
        ],
        "hotRankRange": [
          "A4",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C7",
            "B5"
          ],
          "normal": [
            "B6",
            "A2"
          ],
          "hot": [
            "A4",
            "S2"
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
        "id": "N17A",
        "name": "モブクロマ",
        "role": "ATK",
        "image": "National/N17A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B3"
        ],
        "normalRankRange": [
          "B3",
          "A1"
        ],
        "hotRankRange": [
          "A2",
          "S1"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B3"
          ],
          "normal": [
            "B3",
            "A1"
          ],
          "hot": [
            "A2",
            "S1"
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
        "id": "N17C",
        "name": "モブルーツ",
        "role": "SUP",
        "image": "National/N17C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C8",
          "B5"
        ],
        "normalRankRange": [
          "B7",
          "A1"
        ],
        "hotRankRange": [
          "A6",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C8",
            "B5"
          ],
          "normal": [
            "B7",
            "A1"
          ],
          "hot": [
            "A6",
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
    "teamId": "N18",
    "teamNumber": 18,
    "sourceNumber": 18,
    "tier": "national",
    "name": "ヨロイルカエル",
    "companyName": "ヨロイルカエル",
    "logo": "National/N18D.png",
    "description": "ナショナルでは上位常連のチーム",
    "members": [
      {
        "id": "N18B",
        "name": "モブアーマ",
        "role": "IGL",
        "image": "National/N18B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B3"
        ],
        "normalRankRange": [
          "B3",
          "A1"
        ],
        "hotRankRange": [
          "A1",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B3"
          ],
          "normal": [
            "B3",
            "B10"
          ],
          "hot": [
            "B10",
            "S2"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "normal",
            "boundary": "max",
            "from": "B10",
            "to": "A1"
          },
          {
            "form": "hot",
            "boundary": "min",
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
        "id": "N18A",
        "name": "モブシールド",
        "role": "ATK",
        "image": "National/N18A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C7",
          "B4"
        ],
        "normalRankRange": [
          "B7",
          "A2"
        ],
        "hotRankRange": [
          "A4",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C7",
            "B4"
          ],
          "normal": [
            "B7",
            "A2"
          ],
          "hot": [
            "A4",
            "S4"
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
        "id": "N18C",
        "name": "モブガード",
        "role": "SUP",
        "image": "National/N18C.png",
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
          "B9",
          "S1"
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
            "B9",
            "A10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
    "teamId": "N19",
    "teamNumber": 19,
    "sourceNumber": 19,
    "tier": "national",
    "name": "フリーズマスターズ",
    "companyName": "フリーズマスターズ",
    "logo": "National/N19D.png",
    "description": "",
    "members": [
      {
        "id": "N19B",
        "name": "モブフロスト",
        "role": "IGL",
        "image": "National/N19B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B2"
        ],
        "normalRankRange": [
          "B4",
          "A1"
        ],
        "hotRankRange": [
          "A3",
          "S3"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B2"
          ],
          "normal": [
            "B4",
            "B10"
          ],
          "hot": [
            "A3",
            "S3"
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
        "id": "N19A",
        "name": "モブアイサー",
        "role": "ATK",
        "image": "National/N19A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B4"
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
            "B4"
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
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N19C",
        "name": "モブグレイシ",
        "role": "SUP",
        "image": "National/N19C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C4",
          "B7"
        ],
        "normalRankRange": [
          "B5",
          "A3"
        ],
        "hotRankRange": [
          "A5",
          "S2"
        ],
        "sourceRankRanges": {
          "slump": [
            "C4",
            "B7"
          ],
          "normal": [
            "B5",
            "A3"
          ],
          "hot": [
            "A5",
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
    "teamId": "N20",
    "teamNumber": 20,
    "sourceNumber": 20,
    "tier": "national",
    "name": "アサルトゴサンケ",
    "companyName": "アサルトゴサンケ",
    "logo": "National/N20D.png",
    "description": "",
    "members": [
      {
        "id": "N20B",
        "name": "モブレンジ",
        "role": "IGL",
        "image": "National/N20B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "B1"
        ],
        "normalRankRange": [
          "B1",
          "B8"
        ],
        "hotRankRange": [
          "B9",
          "A8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C10"
          ],
          "normal": [
            "B1",
            "B8"
          ],
          "hot": [
            "B9",
            "A8"
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
        "id": "N20A",
        "name": "モブラッシュ",
        "role": "ATK",
        "image": "National/N20A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C3",
          "B8"
        ],
        "normalRankRange": [
          "B5",
          "A3"
        ],
        "hotRankRange": [
          "A3",
          "S4"
        ],
        "sourceRankRanges": {
          "slump": [
            "C3",
            "B8"
          ],
          "normal": [
            "B5",
            "A3"
          ],
          "hot": [
            "A3",
            "S4"
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
        "id": "N20C",
        "name": "モブカバー",
        "role": "SUP",
        "image": "National/N20C.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
        ],
        "normalRankRange": [
          "B2",
          "B7"
        ],
        "hotRankRange": [
          "A1",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D10",
            "C10"
          ],
          "normal": [
            "B2",
            "B7"
          ],
          "hot": [
            "A1",
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
    "teamId": "N21",
    "teamNumber": 21,
    "sourceNumber": 21,
    "tier": "national",
    "name": "ティーチャーズ",
    "companyName": "ティーチャーズ",
    "logo": "National/N21D.png",
    "description": "",
    "members": [
      {
        "id": "N21B",
        "name": "モブホーム",
        "role": "IGL",
        "image": "National/N21B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "C6"
        ],
        "normalRankRange": [
          "C8",
          "B2"
        ],
        "hotRankRange": [
          "B8",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C6"
          ],
          "normal": [
            "C8",
            "B2"
          ],
          "hot": [
            "B8",
            "A3"
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
        "id": "N21A",
        "name": "モブチャイム",
        "role": "ATK",
        "image": "National/N21A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D6",
          "C5"
        ],
        "normalRankRange": [
          "C5",
          "B1"
        ],
        "hotRankRange": [
          "B2",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D6",
            "C5"
          ],
          "normal": [
            "C5",
            "B1"
          ],
          "hot": [
            "B2",
            "A3"
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
        "id": "N21C",
        "name": "モブノート",
        "role": "SUP",
        "image": "National/N21C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "C7"
        ],
        "normalRankRange": [
          "C6",
          "B4"
        ],
        "hotRankRange": [
          "B3",
          "A6"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C7"
          ],
          "normal": [
            "C6",
            "B4"
          ],
          "hot": [
            "B3",
            "A6"
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
    "teamId": "N22",
    "teamNumber": 22,
    "sourceNumber": 22,
    "tier": "national",
    "name": "トザンポイント",
    "companyName": "トザンポイント",
    "logo": "National/N22D.png",
    "description": "",
    "members": [
      {
        "id": "N22B",
        "name": "モブピーク",
        "role": "IGL",
        "image": "National/N22B.png",
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
          "B7",
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
            "B7",
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
        "id": "N22A",
        "name": "モブリッジ",
        "role": "ATK",
        "image": "National/N22A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D9",
          "C9"
        ],
        "normalRankRange": [
          "C9",
          "B6"
        ],
        "hotRankRange": [
          "B8",
          "A9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D9",
            "C9"
          ],
          "normal": [
            "C9",
            "B6"
          ],
          "hot": [
            "B8",
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
        "id": "N22C",
        "name": "モブルート",
        "role": "SUP",
        "image": "National/N22C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C1"
        ],
        "normalRankRange": [
          "C3",
          "C8"
        ],
        "hotRankRange": [
          "B3",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "D10"
          ],
          "normal": [
            "C3",
            "C8"
          ],
          "hot": [
            "B3",
            "B7"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
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
    "teamId": "N23",
    "teamNumber": 23,
    "sourceNumber": 23,
    "tier": "national",
    "name": "ダイビングクリーチャーズ",
    "companyName": "ダイビングクリーチャーズ",
    "logo": "National/N23D.png",
    "description": "",
    "members": [
      {
        "id": "N23B",
        "name": "モブダイブ",
        "role": "IGL",
        "image": "National/N23B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C8"
        ],
        "normalRankRange": [
          "C6",
          "B4"
        ],
        "hotRankRange": [
          "B3",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C8"
          ],
          "normal": [
            "C6",
            "B4"
          ],
          "hot": [
            "B3",
            "A3"
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
        "id": "N23A",
        "name": "モブマリン",
        "role": "ATK",
        "image": "National/N23A.png",
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
          "B7",
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
            "B7",
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
        "id": "N23C",
        "name": "モブコーラル",
        "role": "SUP",
        "image": "National/N23C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D6",
          "C5"
        ],
        "normalRankRange": [
          "C7",
          "B3"
        ],
        "hotRankRange": [
          "B5",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D6",
            "C5"
          ],
          "normal": [
            "C7",
            "B3"
          ],
          "hot": [
            "B5",
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
    "teamId": "N24",
    "teamNumber": 24,
    "sourceNumber": 24,
    "tier": "national",
    "name": "ドクターモブオール",
    "companyName": "ドクターモブオール",
    "logo": "National/N24D.png",
    "description": "",
    "members": [
      {
        "id": "N24B",
        "name": "モブカルテ",
        "role": "IGL",
        "image": "National/N24B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D8",
          "C8"
        ],
        "normalRankRange": [
          "B1",
          "B5"
        ],
        "hotRankRange": [
          "B9",
          "A6"
        ],
        "sourceRankRanges": {
          "slump": [
            "D8",
            "C8"
          ],
          "normal": [
            "C10",
            "B5"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N24A",
        "name": "モブメディク",
        "role": "ATK",
        "image": "National/N24A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C6"
        ],
        "normalRankRange": [
          "C7",
          "B4"
        ],
        "hotRankRange": [
          "B7",
          "A5"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C6"
          ],
          "normal": [
            "C7",
            "B4"
          ],
          "hot": [
            "B7",
            "A5"
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
        "id": "N24C",
        "name": "モブオペラ",
        "role": "SUP",
        "image": "National/N24C.png",
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
          "B8",
          "A9"
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
            "B8",
            "A9"
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
    "teamId": "N25",
    "teamNumber": 25,
    "sourceNumber": 25,
    "tier": "national",
    "name": "ワノココロ",
    "companyName": "ワノココロ",
    "logo": "National/N25D.png",
    "description": "",
    "members": [
      {
        "id": "N25B",
        "name": "モブミカド",
        "role": "IGL",
        "image": "National/N25B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C5"
        ],
        "normalRankRange": [
          "C4",
          "B2"
        ],
        "hotRankRange": [
          "B2",
          "A4"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C5"
          ],
          "normal": [
            "C4",
            "B2"
          ],
          "hot": [
            "B2",
            "A4"
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
        "id": "N25A",
        "name": "モブカゲロウ",
        "role": "ATK",
        "image": "National/N25A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C2",
          "C7"
        ],
        "normalRankRange": [
          "B1",
          "B5"
        ],
        "hotRankRange": [
          "B9",
          "A8"
        ],
        "sourceRankRanges": {
          "slump": [
            "C2",
            "C7"
          ],
          "normal": [
            "B1",
            "B5"
          ],
          "hot": [
            "B9",
            "A8"
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
        "id": "N25C",
        "name": "モブナギ",
        "role": "SUP",
        "image": "National/N25C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D6",
          "C5"
        ],
        "normalRankRange": [
          "C5",
          "B1"
        ],
        "hotRankRange": [
          "B4",
          "A4"
        ],
        "sourceRankRanges": {
          "slump": [
            "D6",
            "C5"
          ],
          "normal": [
            "C5",
            "B1"
          ],
          "hot": [
            "B4",
            "A4"
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
    "teamId": "N26",
    "teamNumber": 26,
    "sourceNumber": 26,
    "tier": "national",
    "name": "ダンゴサンニンシュウ",
    "companyName": "ダンゴサンニンシュウ",
    "logo": "National/N26D.png",
    "description": "",
    "members": [
      {
        "id": "N26B",
        "name": "モブミタラ",
        "role": "IGL",
        "image": "National/N26B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D8",
          "C5"
        ],
        "normalRankRange": [
          "C8",
          "B3"
        ],
        "hotRankRange": [
          "B8",
          "A2"
        ],
        "sourceRankRanges": {
          "slump": [
            "D8",
            "C5"
          ],
          "normal": [
            "C8",
            "B3"
          ],
          "hot": [
            "B8",
            "A2"
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
        "id": "N26A",
        "name": "モブゴマ",
        "role": "ATK",
        "image": "National/N26A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C4"
        ],
        "normalRankRange": [
          "C5",
          "B2"
        ],
        "hotRankRange": [
          "B2",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C4"
          ],
          "normal": [
            "C5",
            "B2"
          ],
          "hot": [
            "B2",
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
        "id": "N26C",
        "name": "モブキナコ",
        "role": "SUP",
        "image": "National/N26C.png",
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
          "B6",
          "A6"
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
            "B6",
            "A6"
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
    "teamId": "N27",
    "teamNumber": 27,
    "sourceNumber": 27,
    "tier": "national",
    "name": "モリノハンドガン",
    "companyName": "モリノハンドガン",
    "logo": "National/N27D.png",
    "description": "",
    "members": [
      {
        "id": "N27B",
        "name": "モブフォレス",
        "role": "IGL",
        "image": "National/N27B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C3"
        ],
        "normalRankRange": [
          "C5",
          "B1"
        ],
        "hotRankRange": [
          "B4",
          "A2"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C3"
          ],
          "normal": [
            "C5",
            "B1"
          ],
          "hot": [
            "B4",
            "A2"
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
        "id": "N27A",
        "name": "モブリーフ",
        "role": "ATK",
        "image": "National/N27A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D8",
          "B1"
        ],
        "normalRankRange": [
          "C9",
          "B7"
        ],
        "hotRankRange": [
          "B8",
          "A8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D8",
            "B1"
          ],
          "normal": [
            "C9",
            "B7"
          ],
          "hot": [
            "B8",
            "A8"
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
        "id": "N27C",
        "name": "モブウッド",
        "role": "SUP",
        "image": "National/N27C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D2",
          "C2"
        ],
        "normalRankRange": [
          "C3",
          "C9"
        ],
        "hotRankRange": [
          "B3",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D2",
            "C2"
          ],
          "normal": [
            "C3",
            "C9"
          ],
          "hot": [
            "B3",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
    "teamId": "N28",
    "teamNumber": 28,
    "sourceNumber": 28,
    "tier": "national",
    "name": "コードケーブル",
    "companyName": "コードケーブル",
    "logo": "National/N28D.png",
    "description": "",
    "members": [
      {
        "id": "N28B",
        "name": "モブリンク",
        "role": "IGL",
        "image": "National/N28B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C7"
        ],
        "normalRankRange": [
          "C6",
          "B5"
        ],
        "hotRankRange": [
          "B3",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C7"
          ],
          "normal": [
            "C6",
            "B5"
          ],
          "hot": [
            "B3",
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
        "id": "N28A",
        "name": "モブワイヤ",
        "role": "ATK",
        "image": "National/N28A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C5"
        ],
        "normalRankRange": [
          "C6",
          "B1"
        ],
        "hotRankRange": [
          "B4",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C5"
          ],
          "normal": [
            "C6",
            "B1"
          ],
          "hot": [
            "B4",
            "A3"
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
        "id": "N28C",
        "name": "モブコネクト",
        "role": "SUP",
        "image": "National/N28C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C7"
        ],
        "normalRankRange": [
          "C7",
          "B4"
        ],
        "hotRankRange": [
          "B5",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C7"
          ],
          "normal": [
            "C7",
            "B4"
          ],
          "hot": [
            "B5",
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
    "teamId": "N29",
    "teamNumber": 29,
    "sourceNumber": 29,
    "tier": "national",
    "name": "ウラノヒットクルー",
    "companyName": "ウラノヒットクルー",
    "logo": "National/N29D.png",
    "description": "背後からの奇襲と追撃を得意とするナショナル上位候補",
    "members": [
      {
        "id": "N29B",
        "name": "モブバック",
        "role": "IGL",
        "image": "National/N29B.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "B1"
        ],
        "normalRankRange": [
          "B1",
          "B6"
        ],
        "hotRankRange": [
          "B9",
          "A5"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "C10"
          ],
          "normal": [
            "C10",
            "B6"
          ],
          "hot": [
            "B9",
            "A5"
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
        "id": "N29A",
        "name": "モブヒッター",
        "role": "ATK",
        "image": "National/N29A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D8",
          "C8"
        ],
        "normalRankRange": [
          "C7",
          "B5"
        ],
        "hotRankRange": [
          "B7",
          "A4"
        ],
        "sourceRankRanges": {
          "slump": [
            "D8",
            "C8"
          ],
          "normal": [
            "C7",
            "B5"
          ],
          "hot": [
            "B7",
            "A4"
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
        "id": "N29C",
        "name": "モブトレース",
        "role": "SUP",
        "image": "National/N29C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C1"
        ],
        "normalRankRange": [
          "C4",
          "C8"
        ],
        "hotRankRange": [
          "B1",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C1"
          ],
          "normal": [
            "C4",
            "C8"
          ],
          "hot": [
            "B1",
            "B7"
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
    "teamId": "N30",
    "teamNumber": 30,
    "sourceNumber": 30,
    "tier": "national",
    "name": "フラワーゼロカエル",
    "companyName": "フラワーゼロカエル",
    "logo": "National/N30D.png",
    "description": "",
    "members": [
      {
        "id": "N30B",
        "name": "モブブルーム",
        "role": "IGL",
        "image": "National/N30B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "C8"
        ],
        "normalRankRange": [
          "C7",
          "B4"
        ],
        "hotRankRange": [
          "B5",
          "A4"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C8"
          ],
          "normal": [
            "C7",
            "B4"
          ],
          "hot": [
            "B5",
            "A4"
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
        "id": "N30A",
        "name": "モブペタル",
        "role": "ATK",
        "image": "National/N30A.png",
        "characterRank": null,
        "slumpRankRange": [
          "C1",
          "C9"
        ],
        "normalRankRange": [
          "B1",
          "B6"
        ],
        "hotRankRange": [
          "B9",
          "A7"
        ],
        "sourceRankRanges": {
          "slump": [
            "C1",
            "C9"
          ],
          "normal": [
            "B1",
            "B6"
          ],
          "hot": [
            "B9",
            "A7"
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
        "id": "N30C",
        "name": "モブリリィ",
        "role": "SUP",
        "image": "National/N30C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D5",
          "C4"
        ],
        "normalRankRange": [
          "C5",
          "B2"
        ],
        "hotRankRange": [
          "B4",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D5",
            "C4"
          ],
          "normal": [
            "C5",
            "B2"
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
    "teamId": "N31",
    "teamNumber": 31,
    "sourceNumber": 31,
    "tier": "national",
    "name": "パーティーオブオマツリ",
    "companyName": "パーティーオブオマツリ",
    "logo": "National/N31D.png",
    "description": "",
    "members": [
      {
        "id": "N31B",
        "name": "モブタイコ",
        "role": "IGL",
        "image": "National/N31B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C2",
          "C8"
        ],
        "hotRankRange": [
          "B2",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "C1"
          ],
          "normal": [
            "C2",
            "C8"
          ],
          "hot": [
            "B2",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
        "id": "N31A",
        "name": "モブハッピ",
        "role": "ATK",
        "image": "National/N31A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C2",
          "C8"
        ],
        "hotRankRange": [
          "C9",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "C1"
          ],
          "normal": [
            "C2",
            "C8"
          ],
          "hot": [
            "C9",
            "B10"
          ]
        },
        "legacyRankCorrections": [
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
        "id": "N31C",
        "name": "モブヨイサ",
        "role": "SUP",
        "image": "National/N31C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D2",
          "C3"
        ],
        "normalRankRange": [
          "C3",
          "B1"
        ],
        "hotRankRange": [
          "B1",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D2",
            "C3"
          ],
          "normal": [
            "C3",
            "B1"
          ],
          "hot": [
            "C10",
            "A3"
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
    "teamId": "N32",
    "teamNumber": 32,
    "sourceNumber": 32,
    "tier": "national",
    "name": "ウミヲカケルワタリアシ",
    "companyName": "ウミヲカケルワタリアシ",
    "logo": "National/N32D.png",
    "description": "",
    "members": [
      {
        "id": "N32B",
        "name": "モブシーラン",
        "role": "IGL",
        "image": "National/N32B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D9"
        ],
        "normalRankRange": [
          "D9",
          "C6"
        ],
        "hotRankRange": [
          "C8",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D9"
          ],
          "normal": [
            "D9",
            "C6"
          ],
          "hot": [
            "C8",
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
        "id": "N32A",
        "name": "モブウェーブ",
        "role": "ATK",
        "image": "National/N32A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C4"
        ],
        "normalRankRange": [
          "C3",
          "B2"
        ],
        "hotRankRange": [
          "B2",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "C4"
          ],
          "normal": [
            "C3",
            "B2"
          ],
          "hot": [
            "B2",
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
        "id": "N32C",
        "name": "モブタイド",
        "role": "SUP",
        "image": "National/N32C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E8",
          "D9"
        ],
        "normalRankRange": [
          "C1",
          "C5"
        ],
        "hotRankRange": [
          "B1",
          "B4"
        ],
        "sourceRankRanges": {
          "slump": [
            "E8",
            "D9"
          ],
          "normal": [
            "D10",
            "C5"
          ],
          "hot": [
            "C10",
            "B4"
          ]
        },
        "legacyRankCorrections": [
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
    "teamId": "N33",
    "teamNumber": 33,
    "sourceNumber": 33,
    "tier": "national",
    "name": "フレイムタイタンズ",
    "companyName": "フレイムタイタンズ",
    "logo": "National/N33D.png",
    "description": "",
    "members": [
      {
        "id": "N33B",
        "name": "モブブレイズ",
        "role": "IGL",
        "image": "National/N33B.png",
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
          "B1",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "D10"
          ],
          "normal": [
            "C3",
            "C7"
          ],
          "hot": [
            "C10",
            "B7"
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
        "id": "N33A",
        "name": "モブヴァルガ",
        "role": "ATK",
        "image": "National/N33A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "D8"
        ],
        "normalRankRange": [
          "C1",
          "C6"
        ],
        "hotRankRange": [
          "C8",
          "B6"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "D8"
          ],
          "normal": [
            "D10",
            "C6"
          ],
          "hot": [
            "C8",
            "B6"
          ]
        },
        "legacyRankCorrections": [
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
        "id": "N33C",
        "name": "モブレグナ",
        "role": "SUP",
        "image": "National/N33C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D2",
          "C3"
        ],
        "normalRankRange": [
          "C1",
          "C9"
        ],
        "hotRankRange": [
          "C9",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D2",
            "C3"
          ],
          "normal": [
            "C1",
            "C9"
          ],
          "hot": [
            "C9",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "hot",
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
    "teamId": "N34",
    "teamNumber": 34,
    "sourceNumber": 34,
    "tier": "national",
    "name": "サイエンスジャムズ",
    "companyName": "サイエンスジャムズ",
    "logo": "National/N34D.png",
    "description": "",
    "members": [
      {
        "id": "N34B",
        "name": "モブラボ",
        "role": "IGL",
        "image": "National/N34B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D6"
        ],
        "normalRankRange": [
          "D7",
          "C4"
        ],
        "hotRankRange": [
          "C7",
          "B5"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D6"
          ],
          "normal": [
            "D7",
            "C4"
          ],
          "hot": [
            "C7",
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
        "id": "N34A",
        "name": "モブリアクト",
        "role": "ATK",
        "image": "National/N34A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C5"
        ],
        "normalRankRange": [
          "C4",
          "B1"
        ],
        "hotRankRange": [
          "B4",
          "A3"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C5"
          ],
          "normal": [
            "C4",
            "B1"
          ],
          "hot": [
            "B4",
            "A3"
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
        "id": "N34C",
        "name": "モブアトム",
        "role": "SUP",
        "image": "National/N34C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E8",
          "D7"
        ],
        "normalRankRange": [
          "D8",
          "C3"
        ],
        "hotRankRange": [
          "C5",
          "B5"
        ],
        "sourceRankRanges": {
          "slump": [
            "E8",
            "D7"
          ],
          "normal": [
            "D8",
            "C3"
          ],
          "hot": [
            "C5",
            "B5"
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
    "teamId": "N35",
    "teamNumber": 35,
    "sourceNumber": 35,
    "tier": "national",
    "name": "サバクノトロッコ",
    "companyName": "サバクノトロッコ",
    "logo": "National/N35D.png",
    "description": "",
    "members": [
      {
        "id": "N35B",
        "name": "モブレール",
        "role": "IGL",
        "image": "National/N35B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C1",
          "C9"
        ],
        "hotRankRange": [
          "C9",
          "A2"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C1"
          ],
          "normal": [
            "C1",
            "C9"
          ],
          "hot": [
            "C9",
            "A2"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N35A",
        "name": "モブキャリー",
        "role": "ATK",
        "image": "National/N35A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D8"
        ],
        "normalRankRange": [
          "D8",
          "C4"
        ],
        "hotRankRange": [
          "C7",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D8"
          ],
          "normal": [
            "D8",
            "C4"
          ],
          "hot": [
            "C7",
            "B7"
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
        "id": "N35C",
        "name": "モブドリフ",
        "role": "SUP",
        "image": "National/N35C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "C2",
          "C8"
        ],
        "hotRankRange": [
          "B1",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "C1"
          ],
          "normal": [
            "C2",
            "C8"
          ],
          "hot": [
            "B1",
            "B7"
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
    "teamId": "N36",
    "teamNumber": 36,
    "sourceNumber": 36,
    "tier": "national",
    "name": "アングラボマーズ",
    "companyName": "アングラボマーズ",
    "logo": "National/N36D.png",
    "description": "",
    "members": [
      {
        "id": "N36B",
        "name": "モブボンバー",
        "role": "IGL",
        "image": "National/N36B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C4"
        ],
        "normalRankRange": [
          "C5",
          "B1"
        ],
        "hotRankRange": [
          "B5",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "C4"
          ],
          "normal": [
            "C5",
            "C10"
          ],
          "hot": [
            "B5",
            "B9"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N36A",
        "name": "モブタック",
        "role": "ATK",
        "image": "National/N36A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C3"
        ],
        "normalRankRange": [
          "C2",
          "C9"
        ],
        "hotRankRange": [
          "C9",
          "B9"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C3"
          ],
          "normal": [
            "C2",
            "C9"
          ],
          "hot": [
            "C9",
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
        "weaponName": "ATK共通武器",
        "preferredRange": "close",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N36C",
        "name": "モブバズーカ",
        "role": "SUP",
        "image": "National/N36C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E4",
          "D8"
        ],
        "normalRankRange": [
          "D6",
          "C5"
        ],
        "hotRankRange": [
          "C4",
          "B5"
        ],
        "sourceRankRanges": {
          "slump": [
            "E4",
            "D8"
          ],
          "normal": [
            "D6",
            "C5"
          ],
          "hot": [
            "C4",
            "B5"
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
    "teamId": "N37",
    "teamNumber": 37,
    "sourceNumber": 37,
    "tier": "national",
    "name": "タイムストーン",
    "companyName": "タイムストーン",
    "logo": "National/N37D.png",
    "description": "",
    "members": [
      {
        "id": "N37B",
        "name": "モブクロノ",
        "role": "IGL",
        "image": "National/N37B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C1"
        ],
        "normalRankRange": [
          "D9",
          "C7"
        ],
        "hotRankRange": [
          "C8",
          "B8"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C1"
          ],
          "normal": [
            "D9",
            "C7"
          ],
          "hot": [
            "C8",
            "B8"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N37A",
        "name": "モブエポック",
        "role": "ATK",
        "image": "National/N37A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D7",
          "C3"
        ],
        "normalRankRange": [
          "C6",
          "B1"
        ],
        "hotRankRange": [
          "B5",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D7",
            "C3"
          ],
          "normal": [
            "C6",
            "C10"
          ],
          "hot": [
            "B5",
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
        "id": "N37C",
        "name": "モブクォーツ",
        "role": "SUP",
        "image": "National/N37C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "D8"
        ],
        "normalRankRange": [
          "C1",
          "C6"
        ],
        "hotRankRange": [
          "B1",
          "B8"
        ],
        "sourceRankRanges": {
          "slump": [
            "D1",
            "D8"
          ],
          "normal": [
            "D10",
            "C6"
          ],
          "hot": [
            "C10",
            "B8"
          ]
        },
        "legacyRankCorrections": [
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
    "teamId": "N38",
    "teamNumber": 38,
    "sourceNumber": 38,
    "tier": "national",
    "name": "マジックフュージョンズ",
    "companyName": "マジックフュージョンズ",
    "logo": "National/N38D.png",
    "description": "",
    "members": [
      {
        "id": "N38B",
        "name": "モブルーン",
        "role": "IGL",
        "image": "National/N38B.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C2"
        ],
        "normalRankRange": [
          "C3",
          "C8"
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N38A",
        "name": "モブアルカナ",
        "role": "ATK",
        "image": "National/N38A.png",
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
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "D10"
          ],
          "normal": [
            "D10",
            "C7"
          ],
          "hot": [
            "C8",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          },
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
        "id": "N38C",
        "name": "モブミスティ",
        "role": "SUP",
        "image": "National/N38C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D4",
          "C3"
        ],
        "normalRankRange": [
          "C4",
          "B1"
        ],
        "hotRankRange": [
          "B2",
          "A4"
        ],
        "sourceRankRanges": {
          "slump": [
            "D4",
            "C3"
          ],
          "normal": [
            "C4",
            "B1"
          ],
          "hot": [
            "B2",
            "A4"
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
    "teamId": "N39",
    "teamNumber": 39,
    "sourceNumber": 39,
    "tier": "national",
    "name": "カゼノナクソラ",
    "companyName": "カゼノナクソラ",
    "logo": "National/N39D.png",
    "description": "",
    "members": [
      {
        "id": "N39B",
        "name": "モブスカイ",
        "role": "IGL",
        "image": "National/N39B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E9",
          "D9"
        ],
        "normalRankRange": [
          "C1",
          "C6"
        ],
        "hotRankRange": [
          "B1",
          "B5"
        ],
        "sourceRankRanges": {
          "slump": [
            "E9",
            "D9"
          ],
          "normal": [
            "D10",
            "C6"
          ],
          "hot": [
            "C10",
            "B5"
          ]
        },
        "legacyRankCorrections": [
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
        "id": "N39A",
        "name": "モブゲイル",
        "role": "ATK",
        "image": "National/N39A.png",
        "characterRank": null,
        "slumpRankRange": [
          "D3",
          "C4"
        ],
        "normalRankRange": [
          "C4",
          "B2"
        ],
        "hotRankRange": [
          "B4",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "D3",
            "C4"
          ],
          "normal": [
            "C4",
            "B2"
          ],
          "hot": [
            "B4",
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
        "id": "N39C",
        "name": "モブブリーズ",
        "role": "SUP",
        "image": "National/N39C.png",
        "characterRank": null,
        "slumpRankRange": [
          "E7",
          "D6"
        ],
        "normalRankRange": [
          "D8",
          "C4"
        ],
        "hotRankRange": [
          "C5",
          "B4"
        ],
        "sourceRankRanges": {
          "slump": [
            "E7",
            "D6"
          ],
          "normal": [
            "D8",
            "C4"
          ],
          "hot": [
            "C5",
            "B4"
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
    "teamId": "N40",
    "teamNumber": 40,
    "sourceNumber": 40,
    "tier": "national",
    "name": "ライデンカンパニー",
    "companyName": "ライデンカンパニー",
    "logo": "National/N40D.png",
    "description": "",
    "members": [
      {
        "id": "N40B",
        "name": "モブカオセン",
        "role": "IGL",
        "image": "National/N40B.png",
        "characterRank": null,
        "slumpRankRange": [
          "E9",
          "C3"
        ],
        "normalRankRange": [
          "C1",
          "B1"
        ],
        "hotRankRange": [
          "C9",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E9",
            "C3"
          ],
          "normal": [
            "C1",
            "C10"
          ],
          "hot": [
            "C9",
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
        "weaponName": "IGL共通武器",
        "preferredRange": "mid",
        "weaponSource": "role_template_fallback",
        "skillProfile": "role_common",
        "uniqueSkillIds": []
      },
      {
        "id": "N40A",
        "name": "モブライデン",
        "role": "ATK",
        "image": "National/N40A.png",
        "characterRank": null,
        "slumpRankRange": [
          "E9",
          "D8"
        ],
        "normalRankRange": [
          "C1",
          "C6"
        ],
        "hotRankRange": [
          "B1",
          "B7"
        ],
        "sourceRankRanges": {
          "slump": [
            "E9",
            "D8"
          ],
          "normal": [
            "C1",
            "C6"
          ],
          "hot": [
            "C10",
            "B7"
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
        "id": "N40C",
        "name": "モブフリグー",
        "role": "SUP",
        "image": "National/N40C.png",
        "characterRank": null,
        "slumpRankRange": [
          "D1",
          "C3"
        ],
        "normalRankRange": [
          "C2",
          "C9"
        ],
        "hotRankRange": [
          "B1",
          "A1"
        ],
        "sourceRankRanges": {
          "slump": [
            "E10",
            "C3"
          ],
          "normal": [
            "C2",
            "C9"
          ],
          "hot": [
            "B1",
            "B10"
          ]
        },
        "legacyRankCorrections": [
          {
            "form": "slump",
            "boundary": "min",
            "from": "E10",
            "to": "D1"
          },
          {
            "form": "hot",
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
  }
]
);

const teamById = new Map(
  NATIONAL_CPU_TEAMS.map((team) => [team.teamId, team]),
);

export function getNationalCpuTeam(teamId) {
  const team = teamById.get(teamId);
  if (!team) {
    throw new RangeError(`Unknown national CPU team: ${teamId}`);
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

export function validateNationalCpuMaster() {
  if (NATIONAL_CPU_TEAMS.length !== 40) {
    throw new Error("national CPU team count must equal 40.");
  }

  const teamIds = new Set();
  const playerIds = new Set();

  for (const team of NATIONAL_CPU_TEAMS) {
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
    teamCount: NATIONAL_CPU_TEAMS.length,
    playerCount: playerIds.size,
    valid: true,
  });
}


