'use strict';

/**
 * MOB BR - cpu-local-data.js
 * Local 23チーム・69選手の短縮版。
 *
 * 通常選手:
 *   役職別標準スキル2つ + シールドチャージ
 *   役職別標準特殊能力
 *
 * 例外選手:
 *   CUSTOM_SKILLS / CUSTOM_PASSIVESで上書き
 */
(function initializeLocalCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  const CPU = MOBBR.API?.cpu;

  if (!CPU?.registerTeams) {
    throw new Error(
      'cpu-local-data.jsより先にcpu-data.jsを読み込んでください。'
    );
  }

  const S = CPU.skill;

  const ROLE_SLOT = {
    IGL: 'B',
    ATK: 'A',
    SUP: 'C'
  };

  const RANGE = {
    'ショットガン': 'close',
    'ハンドガン': 'mid',
    'リボルバー': 'mid',
    'アサルトライフル': 'mid',
    'スナイパーライフル': 'far',
    'マシンガン': 'mid'
  };

  const LOCAL_RULES = Object.freeze({
    registeredCpuTeams: 23,
    tournamentTeams: 20,
    playerTeamSlots: 1,
    cpuEntrySlots: 19,
    dedicatedSkillsPerPlayer: 2,
    commonSkillAddedByCpuData: 1,
    ultimateEnabled: false
  });

  /* =========================================================
     固有スキル

     キー:
     L{チーム番号}{A=ATK / B=IGL / C=SUP}

     未登録なら役職別標準スキルを使用。
  ========================================================= */

  const RAW = (
    name,
    description,
    type,
    target,
    ct,
    effect
  ) => ({
    name,
    description,
    type,
    target,
    ct,
    effect
  });

  const SELF_BUFF = (
    name,
    description,
    baseStats,
    ct = 6
  ) => RAW(
    name,
    description,
    'BUFF',
    '自分',
    ct,
    {
      code: 'self_stat_buff',
      baseStats
    }
  );

  const ENEMY_CT = (
    name,
    description,
    rate,
    ct = 6
  ) => RAW(
    name,
    description,
    'DEBUFF',
    '敵全体',
    ct,
    {
      code: 'enemy_team_ct_increase',
      rate
    }
  );

  const ALL_DAMAGE_CT = (
    name,
    description,
    power,
    ctIncreaseRate,
    ct = 7
  ) => RAW(
    name,
    description,
    'DAMAGE_DEBUFF',
    '敵全体',
    ct,
    {
      code: 'enemy_all_damage_and_ct_increase',
      power,
      ctIncreaseRate
    }
  );

  const ALL_DAMAGE_HEAL = (
    name,
    description,
    power,
    healRate,
    ct = 7
  ) => RAW(
    name,
    description,
    'DAMAGE_HEAL',
    '敵全体・味方全体',
    ct,
    {
      code: 'enemy_all_damage_and_team_heal',
      power,
      healRate
    }
  );

  const CUSTOM_SKILLS = {
    /* Team1 プリズンハンマーズ */

    L1B: [
      ENEMY_CT(
        'プリズンブレイカー',
        '敵全体のCTを15%増加。',
        0.15,
        6
      ),

      RAW(
        'クールヘッド',
        '味方全体のMIND・SUPPORTを10%アップ。',
        'BUFF',
        '味方全体',
        6,
        {
          code: 'team_stat_rate_buff',

          rates: {
            mind: 0.10,
            support: 0.10
          }
        }
      )
    ],

    L1A: [
      ALL_DAMAGE_HEAL(
        'テツの雨',
        '敵全体へ攻撃し、味方全体のHPを回復する。',
        1.35,
        0.12,
        7
      ),

      S.damage(
        'フルメタルバレット',
        3.20,
        0.84,
        6.5
      )
    ],

    L1C: [
      S.ct(
        'ファットプリズン',
        0.25,
        6
      ),

      S.buff(
        'ヘビーガード',
        {
          physical: 4
        },
        6
      )
    ],

    /* Team22 ミラモブスナイパーズ */

    L22B: [
      ALL_DAMAGE_CT(
        'ミラージュボム',
        '敵全体へ攻撃し、CTを延長する。',
        1.25,
        0.12,
        7
      ),

      S.buff(
        'ミラージュコール',
        {
          aim: 5,
          technique: 5
        },
        6
      )
    ],

    L22A: [
      S.damage(
        'ミラスナイプ',
        3.40,
        1,
        7
      ),

      SELF_BUFF(
        'ロングレンジ',
        '自身のAIMをアップする。',
        {
          aim: 6
        },
        6
      )
    ],

    L22C: [
      S.ct(
        'ミラピラミッド',
        0.18,
        6
      ),

      S.heal(
        'デザートヒール',
        0.18,
        6
      )
    ],

    /* Team23 ポータルレーシング */

    L23B: [
      S.ct(
        'ポータルコール',
        0.16,
        6
      ),

      S.buff(
        'ワープサイン',
        {
          agility: 5
        },
        6
      )
    ],

    L23A: [
      S.damage(
        'ポータルバースト',
        2.70,
        0.84,
        6
      ),

      SELF_BUFF(
        'ハイスピードシュート',
        '自身のAGILITY・AIMをアップする。',
        {
          agility: 5,
          aim: 5
        },
        6
      )
    ],

    L23C: [
      S.ct(
        'ポータルゲート',
        0.22,
        6
      ),

      S.heal(
        'エマージェンシーリカバー',
        0.17,
        6
      )
    ]
  };

  /*
   * 固有特殊能力の追加例:
   *
   * L1B: CPU.passive.team(
   *   '世界級の指揮',
   *   '味方全体のMINDをアップ。',
   *   {
   *     mind: 4
   *   }
   * )
   */
  const CUSTOM_PASSIVES = {};

  /*
   * カード追加例:
   *
   * L1B: {
   *   rarity: 'SSR',
   *   description: 'プリズンハンマーズを率いるIGL。',
   *   packId: 'vol1'
   * }
   */
  const CARD_OVERRIDES = {};

  /*
   * バッジ追加例:
   *
   * L1: {
   *   rarity: 'UR',
   *   description: 'プリズンハンマーズの企業バッジ。',
   *   packId: 'lb'
   * }
   */
  const BADGE_OVERRIDES = {};

  /* =========================================================
     短縮記法

     stats順:
     STAMINA
     MIND
     PHYSICAL
     AIM
     AGILITY
     TECHNIQUE
     SUPPORT
  ========================================================= */

  function P(
    role,
    name,
    weaponType,
    bad,
    normal,
    hot,
    stats
  ) {
    return {
      role,
      name,

      rank: {
        bad,
        normal,
        hot
      },

      stats: String(stats)
        .trim()
        .split(/[\s,]+/),

      weapon: {
        type: weaponType,

        preferredRange:
          RANGE[weaponType] ||
          'mid',

        magazine: 8
      }
    };
  }

  function teamRange(
    members,
    condition
  ) {
    const ranges = members.map(
      (member) =>
        CPU.normalizeRankRange(
          member.rank[condition]
        )
    );

    const minimum = Math.min(
      ...ranges.map(
        (range) =>
          CPU.rankToOrdinal(
            range.min
          )
      )
    );

    const maximum = Math.max(
      ...ranges.map(
        (range) =>
          CPU.rankToOrdinal(
            range.max
          )
      )
    );

    return (
      `${CPU.ordinalToRank(minimum)}～` +
      `${CPU.ordinalToRank(maximum)}`
    );
  }

  function T(
    number,
    name,
    description,
    rows
  ) {
    const teamCode =
      `L${number}`;

    const members = rows.map(
      (member) => {
        const code =
          `${teamCode}${ROLE_SLOT[member.role]}`;

        const skills =
          CUSTOM_SKILLS[code];

        const passive =
          CUSTOM_PASSIVES[code];

        return {
          ...member,
          code,

          ...(skills
            ? {
                skills
              }
            : {}),

          ...(passive
            ? {
                passive
              }
            : {}),

          card:
            CARD_OVERRIDES[code] ||
            {}
        };
      }
    );

    return {
      number,
      name,
      description,

      teamRank: {
        bad:
          teamRange(
            members,
            'bad'
          ),

        normal:
          teamRange(
            members,
            'normal'
          ),

        hot:
          teamRange(
            members,
            'hot'
          )
      },

      members,

      badge:
        BADGE_OVERRIDES[teamCode] ||
        {},

      mandatory: false,

      tags: [
        'Local'
      ]
    };
  }

  /*
   * 画像はcpu-data.jsが自動設定:
   *
   * ATK  = Local/L{番号}A.png
   * IGL  = Local/L{番号}B.png
   * SUP  = Local/L{番号}C.png
   * LOGO = Local/L{番号}D.png
   */

  const LOCAL_TEAMS = [
    T(
      1,
      'プリズンハンマーズ',
      'Local最強クラス（World FINAL常連）',
      [
        P(
          'IGL',
          'モブモッチ',
          'アサルトライフル',
          'B9～A5',
          'A2～S4',
          'A8～S8',
          'A4 S3 A3 S1 A6 S2 S4'
        ),

        P(
          'ATK',
          'モブテツ',
          'アサルトライフル',
          'B9～A5',
          'A4～S4',
          'S1～S8',
          'S1 A7 S2 S4 A8 S3 A3'
        ),

        P(
          'SUP',
          'モブファトメン',
          'ショットガン',
          'B9～A5',
          'A1～S3',
          'A8～S7',
          'S2 A9 S1 A3 S1 A7 S3'
        )
      ]
    ),

    T(
      2,
      'フシギノハナ',
      'Local上位',
      [
        P(
          'IGL',
          'モブシンリョク',
          'アサルトライフル',
          'D9～C9',
          'C9～B8',
          'B9～A4',
          'B2 A1 C9 B6 B3 B8 A2'
        ),

        P(
          'ATK',
          'モブカッター',
          'アサルトライフル',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          'B1 C9 B2 A2 B8 A1 C9'
        ),

        P(
          'SUP',
          'モブノムチ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          'B4 A2 C8 B2 B5 B8 A4'
        )
      ]
    ),

    T(
      3,
      'レッドカラミーズ',
      'Local上位',
      [
        P(
          'IGL',
          'モブハーバ',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          'B3 B8 B2 A2 B6 A1 B8'
        ),

        P(
          'ATK',
          'モブネーロ',
          'リボルバー',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          'B3 B3 B7 A4 A1 B9 C8'
        ),

        P(
          'SUP',
          'モブトガラ',
          'ハンドガン',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          'B4 B9 B1 B3 B8 B7 A2'
        )
      ]
    ),

    T(
      4,
      'ジュラッシクヤベージャンズ',
      'Local上位（近距離特化）',
      [
        P(
          'IGL',
          'モブティラ',
          'ショットガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'A1 B1 A2 B3 B7 B1 B5'
        ),

        P(
          'ATK',
          'モブサウルス',
          'ショットガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          'A2 B2 A4 B4 A1 B2 C9'
        ),

        P(
          'SUP',
          'モブラプチー',
          'ショットガン',
          'D9～C9',
          'C9～B8',
          'B9～A4',
          'B9 B2 A1 B1 A2 B3 B7'
        )
      ]
    ),

    T(
      5,
      'エンドゾーンズ',
      'Local上位（超耐久）',
      [
        P(
          'IGL',
          'モブクォーター',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'A3 A1 A2 B8 B2 B5 A2'
        ),

        P(
          'ATK',
          'モブランニング',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'A4 B7 A1 B8 B8 B4 C9'
        ),

        P(
          'SUP',
          'モブライン',
          'ハンドガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          'A5 A1 A4 B2 B3 B5 A3'
        )
      ]
    ),

    T(
      6,
      'カイジュウランナーズ',
      'Local上位クラス。素早い展開と機動力が武器。',
      [
        P(
          'IGL',
          'モブナマズン',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'A2 B5 B7 B5 A1 B6 B4'
        ),

        P(
          'ATK',
          'モブボウボウ',
          'ショットガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'B8 B2 A2 B8 A3 B6 C9'
        ),

        P(
          'SUP',
          'モブスーイ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          'B8 B9 B3 B2 A2 B8 A3'
        )
      ]
    ),

    T(
      7,
      'ミステリーシャンパン',
      'Local上位候補。相手を翻弄するトリッキーなチーム。',
      [
        P(
          'IGL',
          'モブイッパイ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          'B3 A2 B1 B7 B8 A1 A2'
        ),

        P(
          'ATK',
          'モブビール',
          'リボルバー',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'B5 B2 B6 A1 A2 B9 C8'
        ),

        P(
          'SUP',
          'モブショーチュー',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          'B5 A1 B2 B4 B7 A2 A3'
        )
      ]
    ),

    T(
      8,
      'モブストリートクルー',
      'Local上位常連。初動の速さと連携が武器。',
      [
        P(
          'IGL',
          'モブビーボーイ',
          'ショットガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          'B9 A1 A1 B7 A4 A3 B9'
        ),

        P(
          'ATK',
          'モブディージェイ',
          'アサルトライフル',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          'B8 B8 B9 A3 A4 A2 B4'
        ),

        P(
          'SUP',
          'モブエムシー',
          'ハンドガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          'B8 A2 B5 B8 A2 A1 A4'
        )
      ]
    ),

    T(
      9,
      'ミズタマポポチ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブブルタマ',
          'アサルトライフル',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          'D9 C3 D8 C5 C4 C3 C5'
        ),

        P(
          'ATK',
          'モブアカタマ',
          'リボルバー',
          'E6～D8',
          'D1～C4',
          'D9～C9',
          'D8 D5 C5 C3 C2 C3 D9'
        ),

        P(
          'SUP',
          'モブウスタマ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          'D9 C2 D8 D9 C3 C4 C5'
        )
      ]
    ),

    T(
      10,
      'ディグダグディグクルー',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブディグ',
          'ショットガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C4 C3 C2 D9 C4 C5 C3'
        ),

        P(
          'ATK',
          'モブツチ',
          'ショットガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C3 D9 C2 C5 C3 D9 D8'
        ),

        P(
          'SUP',
          'モブザクザク',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          'C2 C2 D9 D9 C4 C4 C5'
        )
      ]
    ),

    T(
      11,
      'テーブルスイートスワット',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブシュガ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'D9 C2 D9 C4 C4 C3 C5'
        ),

        P(
          'ATK',
          'モブミント',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'D8 D8 C4 C2 C3 C3 D9'
        ),

        P(
          'SUP',
          'モブカカオ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          'D9 C3 D9 D9 C4 C4 C5'
        )
      ]
    ),

    T(
      12,
      'ポリスサバイバーガンズ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブピック',
          'ハンドガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C5 C2 D9 C4 C3 C4 C2'
        ),

        P(
          'ATK',
          'モブミナモ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C4 D9 C4 C2 C4 C3 D9'
        ),

        P(
          'SUP',
          'モブコモレ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          'C3 C2 D9 D9 C4 C5 C2'
        )
      ]
    ),

    T(
      13,
      'エリートサラリーマンズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシャチョー',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D9 E8 D8 D5 D2 C2'
        ),

        P(
          'ATK',
          'モブセンム',
          'リボルバー',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D8 D5 D8 D3 D5 D5 E9'
        ),

        P(
          'SUP',
          'モブジョウム',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 E9 D8 D5 D4 C3'
        )
      ]
    ),

    T(
      14,
      'ハタケノヤサイ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブダイチ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D4 D8 D8 D5 D3'
        ),

        P(
          'ATK',
          'モブホウサク',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D4 D8 C2 D5 D8 D7 E9'
        ),

        P(
          'SUP',
          'モブミノリ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D8 E9 D8 D5 C2'
        )
      ]
    ),

    T(
      15,
      'スリーブルー',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブアオジ',
          'スナイパーライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D7 D3 E9 C2 D6 D2 D3'
        ),

        P(
          'ATK',
          'モブコンジョー',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'C3 D5 D3 D3 D7 D8 F9'
        ),

        P(
          'SUP',
          'モブセイラン',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 C2 D8 E9 D7 D2 C2'
        )
      ]
    ),

    T(
      16,
      'ミドリラバーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブミドリ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D3 D5 D8 D6 D5 C2'
        ),

        P(
          'ATK',
          'モブリョク',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D8 D4 D3 C2 D5 E9'
        ),

        P(
          'SUP',
          'モブワカバ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D9 E9 D6 D4 C2'
        )
      ]
    ),

    T(
      17,
      'ピンクサバイバー',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブモモ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D7 D9 D6 D6 D2'
        ),

        P(
          'ATK',
          'モブサクラ',
          'リボルバー',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D7 D7 D5 D3 D4 D5 E9'
        ),

        P(
          'SUP',
          'モブベニ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D8 E9 D5 D5 C2'
        )
      ]
    ),

    T(
      18,
      'パレットカラーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシキサイ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D6 D5 D5 D3 C2'
        ),

        P(
          'ATK',
          'モブニジ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D8 D5 D2 D3 D5 E9'
        ),

        P(
          'SUP',
          'モブイロドリ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D5 D2 D8 E9 D5 D4 C2'
        )
      ]
    ),

    T(
      19,
      'エブリトツゲキパワーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブゲキシン',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D4 D8 C3 D8 D5 D8 D6'
        ),

        P(
          'ATK',
          'モブトッシン',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D4 D9 C2 D7 D4 D9 E9'
        ),

        P(
          'SUP',
          'モブシンゲキ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D6 D4 D7 E9 D6 D5 C3'
        )
      ]
    ),

    T(
      20,
      'アタックシッソウランク',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシュンソク',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D7 D6 D8 D5 C2 D6 D5'
        ),

        P(
          'ATK',
          'モブライソウ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D6 D8 D5 D2 C3 D5 E9'
        ),

        P(
          'SUP',
          'モブハヤテ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          'D6 D4 D8 E9 D4 D5 C2'
        )
      ]
    ),

    T(
      21,
      'モブバトルクラブ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブリバイブ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C5 C2 D8 C5 C4 C3 C2'
        ),

        P(
          'ATK',
          'モブリカバー',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C4 D8 C4 C2 C4 C4 D8'
        ),

        P(
          'SUP',
          'モブリスタート',
          'ハンドガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          'C4 C2 D8 D9 C4 C5 C2'
        )
      ]
    ),

    T(
      22,
      'ミラモブスナイパーズ',
      'Local最強クラス（World FINAL 4位）',
      [
        P(
          'IGL',
          'ミラモブ',
          'スナイパーライフル',
          'B9～A5',
          'A2～S4',
          'A8～S8',
          'A5 S2 A3 S4 A8 S4 S2'
        ),

        P(
          'ATK',
          'モブミラーノ',
          'スナイパーライフル',
          'B9～A5',
          'A3～S4',
          'S1～S8',
          'A5 A8 A2 S4 A8 S3 A2'
        ),

        P(
          'SUP',
          'モブピラミドン',
          'スナイパーライフル',
          'B9～A5',
          'A2～S3',
          'A8～S7',
          'A5 S1 A2 A8 A6 S2 S4'
        )
      ]
    ),

    T(
      23,
      'ポータルレーシング',
      'Local上位常連',
      [
        P(
          'IGL',
          'モブリバイブ',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'B5 A1 B5 B8 A3 A2 A2'
        ),

        P(
          'ATK',
          'モブリカバー',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'B5 B5 B8 A2 A4 A1 C9'
        ),

        P(
          'SUP',
          'モブリスタート',
          'ハンドガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          'B6 A2 B5 B8 A2 A2 A3'
        )
      ]
    )
  ];

  if (
    MOBBR.DATA.cpu
      ?.expectedTeamCounts
  ) {
    MOBBR.DATA.cpu
      .expectedTeamCounts
      .local =
      LOCAL_RULES
        .registeredCpuTeams;
  }

  const registration =
    CPU.registerTeams(
      'local',
      LOCAL_TEAMS,
      {
        replaceTier: true,
        source:
          'cpu-local-data.js'
      }
    );

  const validation =
    CPU.validate(
      'local'
    );

  if (!validation.valid) {
    throw new Error(
      validation.reports
        .flatMap(
          (report) =>
            report.errors
        )
        .join('\n')
    );
  }

  const LOCAL_API =
    Object.freeze({
      getLocalTeams:
        () =>
          CPU.getTeams(
            'local'
          ),

      getLocalTeam:
        (teamIdOrCode) => {
          const team =
            CPU.getTeam(
              teamIdOrCode
            );

          return (
            team?.tier ===
            'local'
          )
            ? team
            : null;
        },

      selectLocalCpuTeams:
        ({
          count =
            LOCAL_RULES
              .cpuEntrySlots,

          excludeTeamIds = [],

          random =
            Math.random
        } = {}) =>
          CPU.selectTeams(
            'local',
            {
              count,
              excludeTeamIds,
              random
            }
          )
    });

  const LOCAL_DATA =
    Object.freeze({
      version:
        '2.1.0-compact-role-skills',

      rules:
        LOCAL_RULES,

      teams:
        LOCAL_TEAMS,

      customSkills:
        CUSTOM_SKILLS,

      customPassives:
        CUSTOM_PASSIVES,

      cardOverrides:
        CARD_OVERRIDES,

      badgeOverrides:
        BADGE_OVERRIDES,

      validation
    });

  MOBBR.DATA.cpuLocal =
    LOCAL_DATA;

  MOBBR.DATA.cpu.localRules =
    LOCAL_RULES;

  MOBBR.DATA.cpu.localSource =
    LOCAL_DATA;

  MOBBR.API.cpuLocal =
    LOCAL_API;

  global.MOBBR_LOCAL_CPU_TEAMS =
    LOCAL_TEAMS;

  global.MOBBR_LOCAL_CPU_RULES =
    LOCAL_RULES;

  global.MOBBR_LOCAL_CPU_API =
    LOCAL_API;

  global.MOBBR_LOCAL_CPU_REGISTRATION =
    registration;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
