'use strict';

/**
 * MOB BR - cpu-national-data.js
 * National 40チーム・120選手の短縮版。
 * 通常は役職別標準スキル2つ＋シールドチャージ。
 * 固有スキル・特殊能力・カード・バッジだけ上書きする。
 */
(function initializeNationalCpuData(global){
  const MOBBR=global.MOBBR=global.MOBBR||{};
  const CPU=MOBBR.API?.cpu;

  if(!CPU?.registerTeams){
    throw new Error(
      'cpu-national-data.jsより先にcpu-data.jsを読み込んでください。'
    );
  }

  const NATIONAL_RULES=Object.freeze({
    registeredCpuTeams:40,
    tournamentTeams:40,
    localQualifierSlots:10,
    nativeNationalSlots:30,

    groups:[
      'A',
      'B',
      'C',
      'D'
    ],

    teamsPerGroup:10,
    playerGroup:'A',

    dedicatedSkillsPerPlayer:2,
    commonSkillAddedByCpuData:1,
    ultimateEnabled:false,
    weaponMagazine:8
  });

  const ROLE_SLOT={
    IGL:'B',
    ATK:'A',
    SUP:'C'
  };

  const RANGE={
    'ショットガン':'close',
    'ハンドガン':'mid',
    'リボルバー':'mid',
    'アサルトライフル':'mid',
    'スナイパーライフル':'far',
    'マシンガン':'mid'
  };

  /*
   * N1Bのように、固有設定がある選手だけ追加する。
   *
   * 例:
   *
   * N1B:[
   *   CPU.skill.buff(
   *     'マックスコール',
   *     {
   *       mind:5,
   *       technique:4
   *     },
   *     6
   *   ),
   *
   *   CPU.skill.ct(
   *     'ロケットタクティクス',
   *     0.18,
   *     7
   *   )
   * ]
   */
  const CUSTOM_SKILLS={};

  /*
   * 固有特殊能力がある選手だけ追加する。
   */
  const CUSTOM_PASSIVES={};

  /*
   * 選手カード上書き例:
   *
   * N1B:{
   *   rarity:'SSR',
   *   description:'ナショナル最強チームを率いるIGL。',
   *   packId:'vol3'
   * }
   */
  const CARD_OVERRIDES={};

  /*
   * チームバッジ上書き例:
   *
   * N1:{
   *   rarity:'UR',
   *   description:'ジョーダンロケッツの企業バッジ。',
   *   packId:'nb'
   * }
   */
  const BADGE_OVERRIDES={};

  /*
   * 選手紹介文がある選手だけ追加する。
   *
   * N1B:'ナショナル最高峰のIGL。'
   */
  const PLAYER_DESCRIPTIONS={};

  function W(
    type,
    attack,
    accuracy,
    speed,
    performance
  ){
    const values=
      String(
        performance||
        ''
      )
        .trim()
        .split(
          /[\s,]+/
        );

    return{
      type,

      preferredRange:
        RANGE[type]||
        'mid',

      magazine:
        NATIONAL_RULES
          .weaponMagazine,

      attack,
      accuracy,
      speed,

      performance:{
        close:
          values[0]||
          'F1',

        mid:
          values[1]||
          values[0]||
          'F1',

        far:
          values[2]||
          values[0]||
          'F1',

        rapid:
          values[3]||
          values[0]||
          'F1',

        reload:
          values[4]||
          values[0]||
          'F1'
      }
    };
  }

  function P(
    role,
    name,
    weapon,
    bad,
    normal,
    hot,
    stats
  ){
    return{
      role,
      name,

      rank:{
        bad,
        normal,
        hot
      },

      stats:
        String(stats)
          .trim()
          .split(
            /[\s,]+/
          ),

      weapon
    };
  }

  function teamRange(
    members,
    condition
  ){
    const ranges=
      members.map(
        (member)=>
          CPU.normalizeRankRange(
            member.rank[
              condition
            ]
          )
      );

    const minimum=
      Math.min(
        ...ranges.map(
          (range)=>
            CPU.rankToOrdinal(
              range.min
            )
        )
      );

    const maximum=
      Math.max(
        ...ranges.map(
          (range)=>
            CPU.rankToOrdinal(
              range.max
            )
        )
      );

    return(
      `${CPU.ordinalToRank(minimum)}～`+
      `${CPU.ordinalToRank(maximum)}`
    );
  }

  function T(
    number,
    name,
    description,
    strengthClass,
    style,
    rows
  ){
    const teamCode=
      `N${number}`;

    const group=
      NATIONAL_RULES
        .groups[
          Math.floor(
            (
              number-
              1
            )/
            NATIONAL_RULES
              .teamsPerGroup
          )
        ];

    const members=
      rows.map(
        (member)=>{
          const code=
            `${teamCode}`+
            `${ROLE_SLOT[member.role]}`;

          const skills=
            CUSTOM_SKILLS[
              code
            ];

          const passive=
            CUSTOM_PASSIVES[
              code
            ];

          return{
            ...member,

            code,

            description:
              PLAYER_DESCRIPTIONS[
                code
              ]||
              '',

            ...(
              skills
                ?{
                    skills
                  }
                :{}
            ),

            ...(
              passive
                ?{
                    passive
                  }
                :{}
            ),

            card:
              CARD_OVERRIDES[
                code
              ]||
              {},

            battleAI:{
              badRank:
                member.rank.bad,

              normalRank:
                member.rank.normal,

              hotRank:
                member.rank.hot,

              preferredStyle:
                style,

              ultimateEnabled:
                false
            }
          };
        }
      );

    return{
      number,
      name,
      description,

      teamRank:{
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

      strength:{
        class:
          strengthClass,

        style,

        groupSeed:
          group,

        nativeNationalTeam:
          true
      },

      badge:
        BADGE_OVERRIDES[
          teamCode
        ]||
        {},

      mandatory:
        false,

      tags:[
        'National',
        `GROUP_${group}`,
        strengthClass,
        style
      ]
    };
  }

  /*
   * stats順:
   *
   * STAMINA
   * MIND
   * PHYSICAL
   * AIM
   * AGILITY
   * TECHNIQUE
   * SUPPORT
   *
   * 各値は「通常/好調」。
   */
  const NATIONAL_TEAMS=[
    T(
      1,
      'ジョーダンロケッツ',
      'ナショナル最強のチーム。世界大会で優勝を狙えるほどの実力を持つ。',
      'legend',
      'balanced',
      [
        P(
          'IGL',
          'モブマックス',

          W(
            'アサルトライフル',
            75,
            81,
            75,
            'S1 S6 A9 S2 S2'
          ),

          'A2～S1',
          'A9～S6',
          'S4～SS1',

          'S2/S7 S7/SS3 S1/S6 S2/S7 S1/S6 S5/SS1 S5/SS1'
        ),

        P(
          'ATK',
          'モブトラックス',

          W(
            'アサルトライフル',
            83,
            75,
            75,
            'S1 S6 A9 S2 S2'
          ),

          'A2～S1',
          'A9～S6',
          'S4～SS1',

          'S3/S8 S2/S7 S5/SS1 S7/SS3 S4/S9 S4/S9 A8/S4'
        ),

        P(
          'SUP',
          'モブスワイプ',

          W(
            'ハンドガン',
            75,
            75,
            75,
            'S1 S6 A9 S2 S5'
          ),

          'A1～A9',
          'A8～S5',
          'S3～S9',

          'S3/S8 S4/S9 A8/S4 A9/S5 S3/S8 S5/SS1 S6/SS2'
        )
      ]
    ),

    T(
      2,
      'ブラックオーダーズ',
      '妨害と状況判断で戦闘を支配する。',
      'elite',
      'control',
      [
        P(
          'IGL',
          'モブエンピン',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S6/SS2 A5/S1 A9/S5 A8/S4 S4/S9 S2/S7'
        ),

        P(
          'ATK',
          'モブミッドナイト',
          W(
            'リボルバー',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 A8/S4 S2/S7 S3/S8 A9/S5 S4/S9 A5/S1'
        ),

        P(
          'SUP',
          'モブマウマウ',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A8/S4 S4/S9 A5/S1 A6/S2 A6/S2 S4/S9 S4/S9'
        )
      ]
    ),

    T(
      3,
      'ハイスピードヨーヨー',
      '高い機動力とCT回転で先手を取る。',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブファイン',
          W(
            'ハンドガン',
            69,
            75,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S1/S6 A6/S2 A8/S4 S1/S6 S4/S9 S1/S6'
        ),

        P(
          'ATK',
          'モブループ',
          W(
            'マシンガン',
            77,
            69,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 A5/S1 S1/S6 S3/S8 S5/SS1 S1/S6 A3/A8'
        ),

        P(
          'SUP',
          'モブロンス',
          W(
            'ハンドガン',
            69,
            69,
            77,
            'A6 S2 A5 S2 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A6/S2 A9/S5 A4/A9 A7/S3 S2/S7 S2/S7 S2/S7'
        )
      ]
    ),

    T(
      4,
      'パティシエグルーブ',
      '回復と味方強化を軸に安定して戦う。',
      'elite',
      'support',
      [
        P(
          'IGL',
          'モブサラダ',
          W(
            'ハンドガン',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S3/S8 A5/S1 A7/S3 A7/S3 S2/S7 S5/SS1'
        ),

        P(
          'ATK',
          'モブホイコー',
          W(
            'アサルトライフル',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 A8/S4 S2/S7 S3/S8 S1/S6 S1/S6 A7/S3'
        ),

        P(
          'SUP',
          'モブスイッツ',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A9/S5 S3/S8 A2/A7 A6/S2 A8/S4 S1/S6 S6/SS2'
        )
      ]
    ),

    T(
      5,
      'ニンジャライト',
      '高い機動力とCT回転で先手を取る。',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブノミツ',
          W(
            'ハンドガン',
            69,
            75,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S2/S7 A6/S2 A9/S5 S2/S7 S2/S7 S1/S6'
        ),

        P(
          'ATK',
          'モブクナイ',
          W(
            'マシンガン',
            77,
            69,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 A6/S2 S1/S6 S2/S7 S4/S9 S3/S8 A5/S1'
        ),

        P(
          'SUP',
          'モブノイチ',
          W(
            'ハンドガン',
            69,
            69,
            77,
            'A6 S2 A5 S2 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A7/S3 S1/S6 A4/A9 A7/S3 S1/S6 S1/S6 S2/S7'
        )
      ]
    ),

    T(
      6,
      'ボムボムブラザーズ',
      '高火力スキルで短時間に決着を狙う。',
      'elite',
      'burst',
      [
        P(
          'IGL',
          'モブボンバー',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 S1/S6 A9/S5 S1/S6 A9/S5 S1/S6 A8/S4'
        ),

        P(
          'ATK',
          'モブスローボム',
          W(
            'ショットガン',
            77,
            69,
            69,
            'S2 A7 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A8/S4 A5/S1 S5/SS1 S3/S8 A9/S5 S1/S6 A4/A9'
        ),

        P(
          'SUP',
          'モブボマー',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A9/S5 S1/S6 A9/S5 A7/S3 A7/S3 A9/S5 S3/S8'
        )
      ]
    ),

    T(
      7,
      'キンミライセカイ',
      '高い技術と特殊効果で相手を崩す。',
      'elite',
      'technical',
      [
        P(
          'IGL',
          'モブサーティーン',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S5/SS1 A6/S2 A8/S4 A8/S4 S4/S9 A8/S4'
        ),

        P(
          'ATK',
          'モブアキンボ',
          W(
            'リボルバー',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A8/S4 A9/S5 S2/S7 S2/S7 S1/S6 S4/S9 A4/A9'
        ),

        P(
          'SUP',
          'モブゴウ',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A9/S5 S4/S9 A5/S1 A8/S4 A6/S2 S3/S8 S4/S9'
        )
      ]
    ),

    T(
      8,
      'ナショナルトレーニングファイヤーズ',
      '近・中距離から一気に攻める。',
      'elite',
      'assault',
      [
        P(
          'IGL',
          'モブアッチー',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 S2/S7 A8/S4 S2/S7 A9/S5 A9/S5 A9/S5'
        ),

        P(
          'ATK',
          'モブネップウ',
          W(
            'ショットガン',
            77,
            69,
            69,
            'S2 A7 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 A7/S3 S5/SS1 S3/S8 S1/S6 A8/S4 A4/A9'
        ),

        P(
          'SUP',
          'モブアツ',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A9/S5 S1/S6 A6/S2 A9/S5 A8/S4 A8/S4 S3/S8'
        )
      ]
    ),

    T(
      9,
      'ナショナルトレーニングブリザード',
      '妨害と状況判断で戦闘を支配する。',
      'elite',
      'control',
      [
        P(
          'IGL',
          'モブサッミー',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 S5/SS1 A6/S2 A8/S4 A8/S4 S5/SS1 S2/S7'
        ),

        P(
          'ATK',
          'モブレイフウ',
          W(
            'リボルバー',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A8/S4 S1/S6 S2/S7 S1/S6 A9/S5 S3/S8 A4/A9'
        ),

        P(
          'SUP',
          'モブヒエ',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A8/S4 S5/SS1 A4/A9 A7/S3 A7/S3 S2/S7 S4/S9'
        )
      ]
    ),

    T(
      10,
      'トマトケチャップテイルズ',
      '攻守と連携のバランスに優れる。',
      'elite',
      'balanced',
      [
        P(
          'IGL',
          'モブトマティー',
          W(
            'アサルトライフル',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A8/S4 S3/S8 A5/S1 A8/S4 A7/S3 S2/S7 A9/S5'
        ),

        P(
          'ATK',
          'モブオムレツ',
          W(
            'アサルトライフル',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 A6/S2 S3/S8 S2/S7 S1/S6 A9/S5 A3/A8'
        ),

        P(
          'SUP',
          'モブトマジュー',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A7/S3 S2/S7 A5/S1 A7/S3 A8/S4 A8/S4 S2/S7'
        )
      ]
    ),

    T(
      11,
      'ホワイトピンク',
      '回復と味方強化を軸に安定して戦う。',
      'elite',
      'support',
      [
        P(
          'IGL',
          'モブアルバ',
          W(
            'ハンドガン',
            69,
            75,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 S5/SS1 A5/S1 A9/S5 A7/S3 S1/S6 S3/S8'
        ),

        P(
          'ATK',
          'モブロゼッタ',
          W(
            'アサルトライフル',
            77,
            69,
            69,
            'A6 S2 A5 A7 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 A7/S3 S2/S7 S2/S7 A8/S4 A9/S5 A9/S5'
        ),

        P(
          'SUP',
          'モブパール',
          W(
            'ハンドガン',
            69,
            69,
            69,
            'A6 S2 A5 A7 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A9/S5 S3/S8 A3/A8 A5/S1 A6/S2 S2/S7 S7/SS3'
        )
      ]
    ),

    T(
      12,
      'パルクールクルー',
      '高い機動力とCT回転で先手を取る。',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブヴォルト',
          W(
            'ハンドガン',
            69,
            75,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 S2/S7 A5/S1 A8/S4 S3/S8 S2/S7 A9/S5'
        ),

        P(
          'ATK',
          'モブランダー',
          W(
            'マシンガン',
            77,
            69,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A7/S3 A7/S3 S1/S6 S3/S8 S4/S9 S1/S6 A5/S1'
        ),

        P(
          'SUP',
          'モブフリーラン',
          W(
            'ハンドガン',
            69,
            69,
            77,
            'A6 S2 A5 S2 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A8/S4 A9/S5 A3/A8 A5/S1 S1/S6 S2/S7 S3/S8'
        )
      ]
    ),

    T(
      13,
      'スピーディートライアングル',
      '高い機動力とCT回転で先手を取る。',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブデルタ',
          W(
            'ハンドガン',
            69,
            75,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A5/S1 S1/S6 A4/A9 A7/S3 S2/S7 S3/S8 A8/S4'
        ),

        P(
          'ATK',
          'モブベクトル',
          W(
            'マシンガン',
            77,
            69,
            77,
            'A6 S2 A5 S2 A7'
          ),
          'B6～A6',
          'A3～S2',
          'A9～S8',
          'A6/S2 A7/S3 S2/S7 S1/S6 S4/S9 S1/S6 A4/A9'
        ),

        P(
          'SUP',
          'モブトライ',
          W(
            'ハンドガン',
            69,
            69,
            77,
            'A6 S2 A5 S2 S1'
          ),
          'B5～A5',
          'A2～S1',
          'A8～S7',
          'A7/S3 S1/S6 A4/A9 A6/S2 S1/S6 S2/S7 S4/S9'
        )
      ]
    ),

    T(
      14,
      'セカイノイルカエル',
      '攻守と連携のバランスに優れる。',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブイルカエル',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A5/S2 B8/A5 A3/A9 A3/A9 A6/S3 A3/A9'
        ),

        P(
          'ATK',
          'モブレッドイル',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 B9/A6 A5/S2 A6/S3 A4/S1 A5/S2 B8/A5'
        ),

        P(
          'SUP',
          'モブグリゲコ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A4/S1 A4/S1 B8/A5 B9/A6 A3/A9 A3/A9 A7/S4'
        )
      ]
    ),

    T(
      15,
      'ネオンストリートクラブ',
      '高い技術と特殊効果で相手を崩す。',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブゴールド',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A9/S6 B9/A6 A3/A9 A1/A7 A8/S5 A3/A9'
        ),

        P(
          'ATK',
          'モブネオン',
          W(
            'リボルバー',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A3/A9 A7/S4 A8/S5 A5/S2 A7/S4 B7/A4'
        ),

        P(
          'SUP',
          'モブシルバー',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A3/A9 A8/S5 B8/A5 A1/A7 A1/A7 A7/S4 A7/S4'
        )
      ]
    ),

    T(
      16,
      'ヨルノサクセンカイギ',
      '妨害と状況判断で戦闘を支配する。',
      'high',
      'control',
      [
        P(
          'IGL',
          'モブナイト',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A1/A7 A9/S6 A1/A7 A4/S1 A2/A8 A8/S5 A4/S1'
        ),

        P(
          'ATK',
          'モブシャドウ',
          W(
            'リボルバー',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A3/A9 A5/S2 A6/S3 A3/A9 A6/S3 A1/A7'
        ),

        P(
          'SUP',
          'モブシーク',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A3/A9 A7/S4 B9/A6 A2/A8 A3/A9 A7/S4 A9/S6'
        )
      ]
    ),

    T(
      17,
      'イロノハジマリ',
      '高い技術と特殊効果で相手を崩す。',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブオリジン',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A8/S5 B8/A5 A5/S2 A1/A7 A9/S6 A3/A9'
        ),

        P(
          'ATK',
          'モブクロマ',
          W(
            'リボルバー',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A3/A9 A5/S2 A6/S3 A5/S2 A8/S5 B7/A4'
        ),

        P(
          'SUP',
          'モブルーツ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A4/S1 A7/S4 B7/A4 A2/A8 A3/A9 A8/S5 A7/S4'
        )
      ]
    ),

    T(
      18,
      'ヨロイルカエル',
      '高い耐久力と防護能力で長期戦を制する。',
      'high',
      'guard',
      [
        P(
          'IGL',
          'モブアーマ',
          W(
            'ショットガン',
            63,
            69,
            63,
            'A6 A2 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A6/S3 A7/S4 A2/A8 A4/S1 A1/A7 A5/S2 A6/S3'
        ),

        P(
          'ATK',
          'モブシールド',
          W(
            'ショットガン',
            71,
            63,
            63,
            'A6 A2 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A6/S3 A1/A7 S1/S7 A5/S2 A3/A9 A5/S2 B8/A5'
        ),

        P(
          'SUP',
          'モブガード',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A7/S4 A5/S2 A1/A7 B9/A6 B8/A5 A3/A9 A7/S4'
        )
      ]
    ),

    T(
      19,
      'フリーズマスターズ',
      '妨害と状況判断で戦闘を支配する。',
      'high',
      'control',
      [
        P(
          'IGL',
          'モブフロスト',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 S1/S7 B8/A5 A4/S1 A3/A9 A8/S5 A6/S3'
        ),

        P(
          'ATK',
          'モブアイサー',
          W(
            'リボルバー',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A4/S1 A5/S2 A5/S2 A3/A9 A7/S4 B9/A6'
        ),

        P(
          'SUP',
          'モブグレイシ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A2/A8 A8/S5 B8/A5 B9/A6 A3/A9 A6/S3 A9/S6'
        )
      ]
    ),

    T(
      20,
      'アサルトゴサンケ',
      '近・中距離から一気に攻める。',
      'high',
      'assault',
      [
        P(
          'IGL',
          'モブレンジ',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A6/S3 A3/A9 A6/S3 A4/S1 A5/S2 A4/S1'
        ),

        P(
          'ATK',
          'モブラッシュ',
          W(
            'ショットガン',
            71,
            63,
            63,
            'A6 A2 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A1/A7 S1/S7 A9/S6 A6/S3 A4/S1 B8/A5'
        ),

        P(
          'SUP',
          'モブカバー',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A3/A9 A6/S3 A3/A9 A4/S1 A4/S1 A4/S1 A7/S4'
        )
      ]
    ),

    T(
      21,
      'ティーチャーズ',
      '回復と味方強化を軸に安定して戦う。',
      'high',
      'support',
      [
        P(
          'IGL',
          'モブホーム',
          W(
            'ハンドガン',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A1/A7 A8/S5 B8/A5 A3/A9 A1/A7 A5/S2 A8/S5'
        ),

        P(
          'ATK',
          'モブチャイム',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A2/A8 A6/S3 A7/S4 A4/S1 A4/S1 A2/A8'
        ),

        P(
          'SUP',
          'モブノート',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A2/A8 A7/S4 B6/A3 A2/A8 A1/A7 A6/S3 S3/S9'
        )
      ]
    ),

    T(
      22,
      'トザンポイント',
      'スタミナと回復力を活かして粘り強く戦う。',
      'high',
      'survival',
      [
        P(
          'IGL',
          'モブピーク',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A4/S1 A8/S5 B9/A6 A2/A8 A2/A8 A4/S1 A6/S3'
        ),

        P(
          'ATK',
          'モブリッジ',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A4/S1 A3/A9 A7/S4 A7/S4 A3/A9 A4/S1 A2/A8'
        ),

        P(
          'SUP',
          'モブルート',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A6/S3 A8/S5 B7/A4 B9/A6 A3/A9 A5/S2 S1/S7'
        )
      ]
    ),

    T(
      23,
      'ダイビングクリーチャーズ',
      'スタミナと回復力を活かして粘り強く戦う。',
      'high',
      'survival',
      [
        P(
          'IGL',
          'モブダイブ',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A5/S2 A7/S4 A1/A7 A3/A9 A1/A7 A4/S1 A7/S4'
        ),

        P(
          'ATK',
          'モブマリン',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A6/S3 A4/S1 A6/S3 A5/S2 A4/S1 A3/A9 A2/A8'
        ),

        P(
          'SUP',
          'モブコーラル',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A6/S3 A8/S5 B9/A6 A2/A8 A1/A7 A4/S1 A8/S5'
        )
      ]
    ),

    T(
      24,
      'ドクターモブオール',
      '回復と味方強化を軸に安定して戦う。',
      'high',
      'support',
      [
        P(
          'IGL',
          'モブカルテ',
          W(
            'ハンドガン',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A8/S5 B8/A5 A2/A8 A2/A8 A7/S4 A7/S4'
        ),

        P(
          'ATK',
          'モブメディク',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A1/A7 A4/S1 A4/S1 A6/S3 A5/S2 A6/S3 A3/A9'
        ),

        P(
          'SUP',
          'モブオペラ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A2/A8 A8/S5 B8/A5 B9/A6 A3/A9 A6/S3 S1/S7'
        )
      ]
    ),

    T(
      25,
      'ワノココロ',
      '攻守と連携のバランスに優れる。',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブミカド',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A7/S4 B8/A5 A3/A9 A3/A9 A4/S1 A5/S2'
        ),

        P(
          'ATK',
          'モブカゲロウ',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A1/A7 A7/S4 A5/S2 A4/S1 A3/A9 B9/A6'
        ),

        P(
          'SUP',
          'モブナギ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A4/S1 A4/S1 B8/A5 A1/A7 A3/A9 A4/S1 A8/S5'
        )
      ]
    ),

    T(
      26,
      'ダンゴサンニンシュウ',
      '攻守と連携のバランスに優れる。',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブミタラ',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A2/A8 A5/S2 A1/A7 A3/A9 A3/A9 A6/S3 A3/A9'
        ),

        P(
          'ATK',
          'モブゴマ',
          W(
            'アサルトライフル',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A1/A7 A2/A8 A6/S3 A7/S4 A5/S2 A3/A9 B7/A4'
        ),

        P(
          'SUP',
          'モブキナコ',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A2/A8 A6/S3 B9/A6 B9/A6 A3/A9 A4/S1 A8/S5'
        )
      ]
    ),

    T(
      27,
      'モリノハンドガン',
      '高いエイムと技術で遠距離を制圧する。',
      'high',
      'sniper',
      [
        P(
          'IGL',
          'モブフォレス',
          W(
            'スナイパーライフル',
            63,
            69,
            63,
            'A1 A2 A6 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'B9/A6 A7/S4 B8/A5 A7/S4 A3/A9 A7/S4 A3/A9'
        ),

        P(
          'ATK',
          'モブリーフ',
          W(
            'スナイパーライフル',
            71,
            63,
            63,
            'A1 A2 A6 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'B9/A6 A2/A8 A3/A9 A9/S6 A4/S1 A6/S3 B9/A6'
        ),

        P(
          'SUP',
          'モブウッド',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A2/A8 A6/S3 B6/A3 A5/S2 A1/A7 A6/S3 A8/S5'
        )
      ]
    ),

    T(
      28,
      'コードケーブル',
      '高い技術と特殊効果で相手を崩す。',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブリンク',
          W(
            'アサルトライフル',
            63,
            69,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A1/A7 A8/S5 A1/A7 A5/S2 A3/A9 A8/S5 A4/S1'
        ),

        P(
          'ATK',
          'モブワイヤ',
          W(
            'リボルバー',
            71,
            63,
            63,
            'A1 A6 B9 A2 A2'
          ),
          'B1～A1',
          'B7～A8',
          'A4～S3',
          'A3/A9 A3/A9 A5/S2 A6/S3 A3/A9 A9/S6 B9/A6'
        ),

        P(
          'SUP',
          'モブコネクト',
          W(
            'ハンドガン',
            63,
            63,
            63,
            'A1 A6 B9 A2 A5'
          ),
          'C9～B9',
          'B6～A7',
          'A3～S2',
          'A4/S1 A7/S4 B9/A6 A1/A7 A2/A8 A7/S4 A7/S4'
        )
      ]
    ),

    T(
      29,
      'ウラノヒットクルー',
      '近・中距離から一気に攻める。',
      'standard',
      'assault',
      [
        P(
          'IGL',
          'モブバック',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B6/A3 A1/A7 B7/A4 A2/A8 B9/A6 A2/A8 B8/A5'
        ),

        P(
          'ATK',
          'モブヒッター',
          W(
            'ショットガン',
            65,
            57,
            57,
            'A2 B7 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B6/A3 A5/S2 A3/A9 A1/A7 A1/A7 B2/B8'
        ),

        P(
          'SUP',
          'モブトレース',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 A2/A8 B6/A3 B8/A5 B7/A4 B8/A5 A3/A9'
        )
      ]
    ),

    T(
      30,
      'フラワーゼロカエル',
      '回復と味方強化を軸に安定して戦う。',
      'standard',
      'support',
      [
        P(
          'IGL',
          'モブブルーム',
          W(
            'ハンドガン',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 A4/S1 B5/A2 B8/A5 B6/A3 A2/A8 A5/S2'
        ),

        P(
          'ATK',
          'モブペタル',
          W(
            'アサルトライフル',
            65,
            57,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B8/A5 B9/A6 A1/A7 B8/A5 B9/A6 B8/A5'
        ),

        P(
          'SUP',
          'モブリリィ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B7/A4 A4/S1 B2/B8 B5/A2 B8/A5 B9/A6 A8/S5'
        )
      ]
    ),

    T(
      31,
      'パーティーオブオマツリ',
      '高火力スキルで短時間に決着を狙う。',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブタイコ',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B6/A3 A1/A7 B8/A5 A1/A7 B7/A4 A1/A7 B8/A5'
        ),

        P(
          'ATK',
          'モブハッピ',
          W(
            'ショットガン',
            65,
            57,
            57,
            'A2 B7 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 B6/A3 A5/S2 A3/A9 A2/A8 A1/A7 B4/A1'
        ),

        P(
          'SUP',
          'モブヨイサ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 B9/A6 B7/A4 B7/A4 B9/A6 B8/A5 A4/S1'
        )
      ]
    ),

    T(
      32,
      'ウミヲカケルワタリアシ',
      '高い機動力とCT回転で先手を取る。',
      'standard',
      'speed',
      [
        P(
          'IGL',
          'モブシーラン',
          W(
            'ハンドガン',
            57,
            63,
            65,
            'B6 A2 B5 A2 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B5/A2 A3/A9 B6/A3 B9/A6 A2/A8 A4/S1 B9/A6'
        ),

        P(
          'ATK',
          'モブウェーブ',
          W(
            'マシンガン',
            65,
            57,
            65,
            'B6 A2 B5 A2 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B6/A3 B7/A4 A2/A8 A2/A8 A3/A9 A1/A7 B4/A1'
        ),

        P(
          'SUP',
          'モブタイド',
          W(
            'ハンドガン',
            57,
            57,
            65,
            'B6 A2 B5 A2 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B7/A4 A2/A8 B5/A2 B5/A2 A3/A9 A1/A7 A4/S1'
        )
      ]
    ),

    T(
      33,
      'フレイムタイタンズ',
      '高火力スキルで短時間に決着を狙う。',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブブレイズ',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B9/A6 A1/A7 B9/A6 B7/A4 B9/A6 B9/A6'
        ),

        P(
          'ATK',
          'モブヴァルガ',
          W(
            'ショットガン',
            65,
            57,
            57,
            'A2 B7 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 B5/A2 A5/S2 A5/S2 B9/A6 B8/A5 B5/A2'
        ),

        P(
          'SUP',
          'モブレグナ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B9/A6 A1/A7 B7/A4 B7/A4 B8/A5 B9/A6 A3/A9'
        )
      ]
    ),

    T(
      34,
      'サイエンスジャムズ',
      '高い技術と特殊効果で相手を崩す。',
      'standard',
      'technical',
      [
        P(
          'IGL',
          'モブラボ',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 A3/A9 B5/A2 B9/A6 B8/A5 A6/S3 B9/A6'
        ),

        P(
          'ATK',
          'モブリアクト',
          W(
            'リボルバー',
            65,
            57,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B8/A5 A1/A7 A2/A8 A1/A7 A3/A9 B4/A1'
        ),

        P(
          'SUP',
          'モブアトム',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B7/A4 A4/S1 B4/A1 B7/A4 B8/A5 A4/S1 A2/A8'
        )
      ]
    ),

    T(
      35,
      'サバクノトロッコ',
      'スタミナと回復力を活かして粘り強く戦う。',
      'standard',
      'survival',
      [
        P(
          'IGL',
          'モブレール',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B9/A6 A4/S1 B6/A3 B7/A4 B8/A5 B9/A6 A2/A8'
        ),

        P(
          'ATK',
          'モブキャリー',
          W(
            'アサルトライフル',
            65,
            57,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B9/A6 B9/A6 A2/A8 A2/A8 A1/A7 B8/A5 B5/A2'
        ),

        P(
          'SUP',
          'モブドリフ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'A2/A8 A2/A8 B3/B9 B5/A2 B8/A5 B9/A6 A6/S3'
        )
      ]
    ),

    T(
      36,
      'アングラボマーズ',
      '高火力スキルで短時間に決着を狙う。',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブボンバー',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 A1/A7 B8/A5 A2/A8 B7/A4 A2/A8 B8/A5'
        ),

        P(
          'ATK',
          'モブタック',
          W(
            'ショットガン',
            65,
            57,
            57,
            'A2 B7 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B6/A3 B4/A1 A7/S4 A4/S1 A1/A7 B9/A6 B3/B9'
        ),

        P(
          'SUP',
          'モブバズーカ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 B8/A5 B9/A6 B9/A6 B9/A6 B8/A5 A3/A9'
        )
      ]
    ),

    T(
      37,
      'タイムストーン',
      '妨害と状況判断で戦闘を支配する。',
      'standard',
      'control',
      [
        P(
          'IGL',
          'モブクロノ',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B6/A3 A5/S2 B4/A1 B7/A4 B7/A4 A3/A9 A1/A7'
        ),

        P(
          'ATK',
          'モブエポック',
          W(
            'リボルバー',
            65,
            57,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 A1/A7 A2/A8 A3/A9 A1/A7 A4/S1 B5/A2'
        ),

        P(
          'SUP',
          'モブクォーツ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B7/A4 A4/S1 B3/B9 B6/A3 B6/A3 A3/A9 A3/A9'
        )
      ]
    ),

    T(
      38,
      'マジックフュージョンズ',
      '高い技術と特殊効果で相手を崩す。',
      'standard',
      'technical',
      [
        P(
          'IGL',
          'モブルーン',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 A4/S1 B5/A2 B8/A5 B6/A3 A5/S2 B9/A6'
        ),

        P(
          'ATK',
          'モブアルカナ',
          W(
            'リボルバー',
            65,
            57,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B8/A5 B8/A5 A2/A8 A2/A8 A1/A7 A4/S1 B3/B9'
        ),

        P(
          'SUP',
          'モブミスティ',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 A2/A8 B5/A2 B6/A3 B7/A4 A5/S2 A2/A8'
        )
      ]
    ),

    T(
      39,
      'カゼノナクソラ',
      '高い機動力とCT回転で先手を取る。',
      'standard',
      'speed',
      [
        P(
          'IGL',
          'モブスカイ',
          W(
            'ハンドガン',
            57,
            63,
            65,
            'B6 A2 B5 A2 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 A3/A9 B6/A3 B9/A6 A1/A7 A3/A9 B9/A6'
        ),

        P(
          'ATK',
          'モブゲイル',
          W(
            'マシンガン',
            65,
            57,
            65,
            'B6 A2 B5 A2 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B5/A2 A3/A9 A2/A8 A4/S1 A3/A9 B4/A1'
        ),

        P(
          'SUP',
          'モブブリーズ',
          W(
            'ハンドガン',
            57,
            57,
            65,
            'B6 A2 B5 A2 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 A2/A8 B4/A1 B5/A2 A1/A7 A1/A7 A3/A9'
        )
      ]
    ),

    T(
      40,
      'ライデンカンパニー',
      '近・中距離から一気に攻める。',
      'standard',
      'assault',
      [
        P(
          'IGL',
          'モブカオセン',
          W(
            'アサルトライフル',
            57,
            63,
            57,
            'B6 A2 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 A1/A7 B8/A5 B9/A6 B8/A5 A2/A8 B7/A4'
        ),

        P(
          'ATK',
          'モブライデン',
          W(
            'ショットガン',
            65,
            57,
            57,
            'A2 B7 B5 B7 B7'
          ),
          'C6～B6',
          'B2～A3',
          'B9～A9',
          'B7/A4 B5/A2 A4/S1 A4/S1 A1/A7 B8/A5 B3/B9'
        ),

        P(
          'SUP',
          'モブフリグー',
          W(
            'ハンドガン',
            57,
            57,
            57,
            'B6 A2 B5 B7 A1'
          ),
          'C5～B5',
          'B1～A2',
          'B8～A8',
          'B8/A5 A1/A7 B7/A4 B7/A4 B9/A6 B8/A5 A1/A7'
        )
      ]
    )
  ];

  if(
    MOBBR.DATA.cpu
      ?.expectedTeamCounts
  ){
    MOBBR.DATA.cpu
      .expectedTeamCounts
      .national=
      NATIONAL_RULES
        .registeredCpuTeams;
  }

  const registration=
    CPU.registerTeams(
      'national',
      NATIONAL_TEAMS,
      {
        replaceTier:true,
        source:
          'cpu-national-data.js'
      }
    );

  const validation=
    CPU.validate(
      'national'
    );

  if(
    !validation.valid
  ){
    throw new Error(
      validation.reports
        .flatMap(
          (report)=>
            report.errors
        )
        .join(
          '\n'
        )
    );
  }

  const NATIONAL_API=
    Object.freeze({
      getNationalTeams:
        ()=>
          CPU.getTeams(
            'national'
          ),

      getNationalTeam:
        (teamIdOrCode)=>{
          const team=
            CPU.getTeam(
              teamIdOrCode
            );

          return(
            team?.tier===
            'national'
          )
            ?team
            :null;
        },

      selectNativeTeams:
        ({
          count=
            NATIONAL_RULES
              .nativeNationalSlots,

          excludeTeamIds=[],

          random=
            Math.random
        }={})=>
          CPU.selectTeams(
            'national',
            {
              count,
              excludeTeamIds,
              random
            }
          )
    });

  const NATIONAL_DATA=
    Object.freeze({
      version:
        '2.2.0-compact-role-skills',

      rules:
        NATIONAL_RULES,

      teams:
        NATIONAL_TEAMS,

      customSkills:
        CUSTOM_SKILLS,

      customPassives:
        CUSTOM_PASSIVES,

      cardOverrides:
        CARD_OVERRIDES,

      badgeOverrides:
        BADGE_OVERRIDES,

      playerDescriptions:
        PLAYER_DESCRIPTIONS,

      validation
    });

  MOBBR.DATA.cpuNational=
    NATIONAL_DATA;

  MOBBR.DATA.cpu
    .nationalRules=
    NATIONAL_RULES;

  MOBBR.DATA.cpu
    .nationalSource=
    NATIONAL_DATA;

  MOBBR.API.cpuNational=
    NATIONAL_API;

  global.MOBBR_NATIONAL_CPU_TEAMS=
    NATIONAL_TEAMS;

  global.MOBBR_NATIONAL_CPU_RULES=
    NATIONAL_RULES;

  global.MOBBR_NATIONAL_CPU_API=
    NATIONAL_API;

  global.MOBBR_NATIONAL_CPU_REGISTRATION=
    registration;
})(
  typeof window!==
  'undefined'
    ?window
    :globalThis
);
