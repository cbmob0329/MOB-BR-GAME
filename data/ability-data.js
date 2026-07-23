'use strict';

/**
 * MOB BR - ability-data.js
 * game-data.js の後に読み込む。
 *
 * データ追加:
 *   青特は BLUE 配列へ B(...) を追加。
 *   金特・赤特は GOLD / RED 配列へ L(...) を追加。
 */
(function initializeAbilityData(global){
  const MOBBR=global.MOBBR=global.MOBBR||{};
  MOBBR.DATA=MOBBR.DATA||{};
  MOBBR.API=MOBBR.API||{};

  if(!MOBBR.DATA.game||!MOBBR.API.game){
    throw new Error('ability-data.js より先に game-data.js を読み込んでください。');
  }

  const GAME=MOBBR.DATA.game;
  const GAME_API=MOBBR.API.game;
  const clone=GAME_API.clone;
  const ROLES=GAME.roleOrder;
  const POINT_KEYS=GAME.trainingPointOrder;

  const clamp=(value,min,max)=>{
    const number=Number(value);
    return Number.isFinite(number)
      ? Math.max(min,Math.min(max,number))
      : min;
  };

  const freeze=(value)=>{
    if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  };

  const normalizeRole=(value)=>{
    let role=String(value||'').trim().toUpperCase();
    if(role==='SAP') role='SUP';
    return ROLES.includes(role)?role:'IGL';
  };

  const readPath=(source,path,fallback=0)=>{
    if(!source||!path) return fallback;

    const value=String(path)
      .split('.')
      .reduce((current,key)=>{
        return current!=null&&Object.prototype.hasOwnProperty.call(current,key)
          ? current[key]
          : undefined;
      },source);

    return value==null?fallback:value;
  };

  const P=(power=0,tech=0,mental=0,shoot=0)=>({
    power,
    tech,
    mental,
    shoot
  });

  const E=(code,params={})=>({
    code,
    ...params
  });

  const S=(name,cost,effects,description)=>({
    name,
    cost,
    effects,
    description
  });

  const B=(id,role,base,advanced)=>({
    id,
    frame:'blue',
    role,
    maxStage:2,
    base:{
      stage:1,
      ...base
    },
    advanced:{
      stage:2,
      ...advanced
    }
  });

  const L=(
    id,
    frame,
    role,
    name,
    unlock,
    cost,
    effects,
    description
  )=>({
    id,
    frame,
    role,
    name,
    unlock,
    cost,
    effects,
    description
  });

  const C={
    damage:(value)=>({
      type:'playerDamage',
      value
    }),

    kp:(value)=>({
      type:'playerKp',
      value
    }),

    ap:(value)=>({
      type:'playerAp',
      value
    }),

    training:(value)=>({
      type:'playerTraining',
      value
    }),

    mvp:(tier,value)=>({
      type:'playerMvp',
      tier,
      value
    }),

    top5:(tier,value)=>({
      type:'companyTop5',
      tier,
      value
    }),

    wins:(tier,value)=>({
      type:'companyWins',
      tier,
      value
    }),

    champWins:(value)=>({
      type:'championshipWins',
      value
    }),

    cards:(value)=>({
      type:'cardKinds',
      value
    }),

    badges:(value)=>({
      type:'badgeKinds',
      value
    }),

    all:(...conditions)=>({
      type:'all',
      conditions
    })
  };

  const EFFECT_CODES={
    START_STAT_BUFF:'戦闘開始時の能力上昇',
    DELAYED_STAT_BUFF:'一定時間経過後の能力上昇',
    CONDITIONAL_STAT_BUFF:'条件中の能力上昇',
    EVENT_STAT_BUFF:'イベント発生時の能力上昇',
    TEAM_STAT_BUFF:'味方全体の能力上昇',

    DAMAGE_MODIFIER:'与ダメージ補正',
    DAMAGE_REDUCTION:'被ダメージ軽減',
    HIT_RATE_POINTS:'命中率ポイント補正',

    DEBUFF_SUCCESS_POINTS:'デバフ成功率ポイント補正',
    DEBUFF_DURATION_ADD:'デバフ持続時間延長',
    DEBUFF_DURATION_REDUCTION:'デバフ持続時間短縮',
    DEBUFF_VALUE_REDUCTION:'デバフ効果量軽減',

    CT_FLAT_REDUCTION:'基本CT短縮',
    CT_REMAINING_REDUCTION:'残りCT短縮',
    CT_PROGRESS_RATE:'CT進行速度補正',

    HEAL_RATE_POINTS:'最大HP割合回復への加算',
    REVIVE_HP_POINTS:'復活HP割合への加算',
    REVIVE_HP_BASE:'復活HP基本値の変更',
    POST_BATTLE_HEAL:'戦闘終了後回復',

    TARGET_PRIORITY:'対象選択優先度補正',
    DECISION_DELAY_REDUCTION:'自動判断時間短縮',
    IGNORE_DAMAGE_REDUCTION:'ダメージ軽減無視',
    RANGE_PENALTY_REDUCTION:'不得意距離ペナルティ軽減',

    COLLECTION_BONUS:'コレクション条件効果',
    LOWEST_STAT_BUFF:'最低能力の上昇',
    ALL_STATS_BUFF:'全能力上昇',
    MAX_HP_ADD:'最大HP加算',

    HEAL_TARGET_BUFF:'回復対象への能力上昇',
    REVIVE_PROTECTION:'復活後の被ダメージ軽減',
    SKILL_TARGET_RULE:'スキル対象ルール変更',

    ATTACK_UNAVOIDABLE:'回避不能攻撃',
    ATTACK_DAMAGE_FORMULA:'攻撃スキル威力計算',
    TEAM_HEAL_FORMULA:'味方全体回復計算',
    SINGLE_HEAL_FORMULA:'味方単体回復計算',
    REVIVE_ALL:'ダウン中の味方全員を復活'
  };

  const PLAYER_SKILLS={
    IGL:[
      {
        id:'igl_hot_call',
        slot:1,
        role:'IGL',
        name:'熱戦を制するコール',
        shortName:'熱戦コール',
        type:'teamBuff',
        baseCt:5,
        target:'味方全体',
        autoCondition:'常時発動可能',
        description:'味方全体のエイムとマインドを上げる。',
        scalingStats:[
          'mind',
          'support'
        ],
        effects:[
          {
            code:'TEAM_STAT_BUFF',
            stats:{
              aim:2,
              mind:2
            },
            durationSeconds:4,
            formula:{
              extraStatMax:3,
              extraDurationMaxSeconds:2,
              sourceStats:[
                'mind',
                'support'
              ]
            }
          }
        ]
      },
      {
        id:'igl_precise_strike',
        slot:2,
        role:'IGL',
        name:'正確無比の一撃',
        shortName:'正確無比',
        type:'singleAttack',
        baseCt:8,
        target:'敵単体',
        autoCondition:'HP割合が最も低い敵を優先',
        description:'回避されない強力な一撃を与える。',
        scalingStats:[
          'technique',
          'aim',
          'mind'
        ],
        effects:[
          {
            code:'ATTACK_UNAVOIDABLE'
          },
          {
            code:'ATTACK_DAMAGE_FORMULA',
            baseMultiplier:1.55,
            techniqueBonusMax:0.25,
            mindBonusMax:0.10,
            targetRule:'lowestHpEnemy'
          }
        ]
      }
    ],

    ATK:[
      {
        id:'atk_smoke_launcher',
        slot:1,
        role:'ATK',
        name:'降り注ぐスモークランチャー',
        shortName:'煙幕砲撃',
        type:'areaAttackDebuff',
        baseCt:7,
        target:'敵全体',
        autoCondition:'敵が1人以上生存',
        description:'敵全体へダメージを与え、確率で命中率を下げる。',
        scalingStats:[
          'technique',
          'aim',
          'mind'
        ],
        effects:[
          {
            code:'ATTACK_DAMAGE_FORMULA',
            baseMultiplier:0.75,
            techniqueBonusMax:0.25,
            area:true
          },
          {
            code:'DEBUFF_SUCCESS_POINTS',
            baseChance:0.45,
            maximumChance:0.75,
            sourceStats:[
              'mind',
              'technique'
            ],
            debuff:{
              stat:'hitRate',
              value:-10,
              durationSeconds:4
            }
          }
        ]
      },
      {
        id:'atk_ace_strike',
        slot:2,
        role:'ATK',
        name:'エースの心得',
        shortName:'エース心得',
        type:'singleAttack',
        baseCt:5.5,
        target:'敵単体',
        autoCondition:'HP割合が最も低い敵を優先',
        description:'敵単体へ強力な一撃を与える。',
        scalingStats:[
          'technique',
          'aim',
          'physical'
        ],
        effects:[
          {
            code:'ATTACK_DAMAGE_FORMULA',
            baseMultiplier:1.35,
            techniqueBonusMax:0.30,
            physicalBonusMax:0.15,
            targetRule:'lowestHpEnemy',
            avoidable:true
          }
        ]
      }
    ],

    SUP:[
      {
        id:'sup_drone_heal',
        slot:1,
        role:'SUP',
        name:'冷静なドローンヒール',
        shortName:'ドローンヒール',
        type:'teamHeal',
        baseCt:6.5,
        target:'生存中の味方全体',
        autoCondition:'味方の誰かがHP85％以下',
        description:'生存中の味方全体を少し回復する。',
        scalingStats:[
          'support'
        ],
        effects:[
          {
            code:'TEAM_HEAL_FORMULA',
            baseRate:0.08,
            maximumRate:0.15,
            supportBonusMax:0.07,
            activationThreshold:0.85
          }
        ]
      },
      {
        id:'sup_respawn_field',
        slot:2,
        role:'SUP',
        name:'リスポーンフィールド',
        shortName:'リスポーン',
        type:'reviveAll',
        baseCt:9,
        target:'ダウン中の味方全員',
        autoCondition:'ダウン中の味方が1人以上。対象がいない時は使わない',
        description:'ダウン中の味方を全員復活させ、HPを30％回復する。',
        scalingStats:[],
        effects:[
          {
            code:'REVIVE_ALL',
            reviveHpRate:0.30,
            includeSelf:false,
            excludeFinished:true,
            waitAtFullCtWhenNoTarget:true
          }
        ]
      }
    ]
  };

  const SHIELD_CHARGE={
    id:'shield_charge',
    slot:3,
    name:'シールドチャージ',
    shortName:'シールド',
    type:'singleHeal',
    target:'自分を含む生存中の味方1人',
    autoCondition:'最もHP割合が低い味方を優先。全員HP85％超なら待機',
    description:'味方1人のHPを20％回復する。サポートで最大30％まで増加する。',
    scalingStats:[
      'agility',
      'support'
    ],

    baseCtByRole:{
      IGL:7,
      ATK:7.5,
      SUP:6.5
    },

    agilityCtReductionMax:0.15,
    baseHealRate:0.20,
    supportHealBonusMax:0.10,
    maximumHealRate:0.30,
    activationThreshold:0.85,

    effects:[
      {
        code:'SINGLE_HEAL_FORMULA',
        targetRule:'lowestHpAliveAllyIncludingSelf',
        waitAtFullCtWhenNoTarget:true
      }
    ]
  };

  const COMMON_BLUE=[
    B(
      'CB01',
      'COMMON',
      S(
        '初動集中',
        P(0,0,25,35),
        [
          E('START_STAT_BUFF',{
            durationSeconds:3,
            stats:{
              aim:1
            }
          })
        ],
        '戦闘開始から3秒間、エイム+1。'
      ),
      S(
        '初動掌握',
        P(0,60,40,90),
        [
          E('START_STAT_BUFF',{
            durationSeconds:4,
            stats:{
              aim:2,
              mind:1
            }
          })
        ],
        '戦闘開始から4秒間、エイム+2、マインド+1。'
      )
    ),

    B(
      'CB02',
      'COMMON',
      S(
        '平常維持',
        P(0,0,60,0),
        [
          E('START_STAT_BUFF',{
            durationSeconds:5,
            stats:{
              mind:1
            }
          })
        ],
        '戦闘開始から5秒間、マインド+1。'
      ),
      S(
        '平常支配',
        P(0,60,120,0),
        [
          E('START_STAT_BUFF',{
            durationSeconds:6,
            stats:{
              mind:2
            }
          }),
          E('DEBUFF_DURATION_REDUCTION',{
            rate:0.10,
            condition:'battleStartBuffActive'
          })
        ],
        '戦闘開始から6秒間、マインド+2。効果中のデバフ時間-10％。'
      )
    ),

    B(
      'CB03',
      'COMMON',
      S(
        '先行充填',
        P(0,40,30,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'battleStart',
            target:'allSkills',
            seconds:0.15
          })
        ],
        '各戦闘開始時、3スキルの残りCTを0.15秒短縮。'
      ),
      S(
        '高速充填',
        P(0,120,80,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'battleStart',
            target:'allSkills',
            seconds:0.30
          })
        ],
        '各戦闘開始時、3スキルの残りCTを0.30秒短縮。'
      )
    ),

    B(
      'CB04',
      'COMMON',
      S(
        '長期設計',
        P(35,0,35,0),
        [
          E('DELAYED_STAT_BUFF',{
            afterSeconds:10,
            stats:{
              physical:1,
              mind:1
            }
          })
        ],
        '戦闘開始から10秒後、フィジカル+1、マインド+1。'
      ),
      S(
        '持久戦略',
        P(90,50,80,0),
        [
          E('DELAYED_STAT_BUFF',{
            afterSeconds:8,
            stats:{
              physical:2,
              mind:2
            }
          })
        ],
        '戦闘開始から8秒後、フィジカル+2、マインド+2。'
      )
    ),

    B(
      'CB05',
      'COMMON',
      S(
        '終盤加速',
        P(0,40,35,0),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'selfHpLte',
            threshold:0.35,
            stats:{
              agility:1
            }
          })
        ],
        '自身のHPが35％以下の間、アジリティ+1。'
      ),
      S(
        '極限加速',
        P(0,110,90,0),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'selfHpLte',
            threshold:0.35,
            stats:{
              agility:2
            }
          }),
          E('CT_PROGRESS_RATE',{
            condition:'selfHpLte',
            threshold:0.35,
            rate:0.03
          })
        ],
        '自身のHPが35％以下の間、アジリティ+2、CT進行速度+3％。'
      )
    )    ,

    B(
      'CB06',
      'COMMON',
      S(
        '背水照準',
        P(0,0,30,45),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'selfHpLte',
            threshold:0.30,
            stats:{
              aim:1
            }
          })
        ],
        '自身のHPが30％以下の間、エイム+1。'
      ),
      S(
        '極限照準',
        P(0,50,70,120),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'selfHpLte',
            threshold:0.30,
            stats:{
              aim:2,
              technique:1
            }
          })
        ],
        '自身のHPが30％以下の間、エイム+2、テクニック+1。'
      )
    ),

    B(
      'CB07',
      'COMMON',
      S(
        '不屈姿勢',
        P(45,0,35,0),
        [
          E('DAMAGE_REDUCTION',{
            condition:'selfHpLte',
            threshold:0.30,
            rate:0.02
          })
        ],
        '自身のHPが30％以下の間、被ダメージ-2％。'
      ),
      S(
        '不倒闘志',
        P(120,40,80,0),
        [
          E('DAMAGE_REDUCTION',{
            condition:'selfHpLte',
            threshold:0.30,
            rate:0.04
          })
        ],
        '自身のHPが30％以下の間、被ダメージ-4％。'
      )
    ),

    B(
      'CB08',
      'COMMON',
      S(
        '復帰防護',
        P(40,0,40,0),
        [
          E('REVIVE_PROTECTION',{
            durationSeconds:3,
            damageReductionRate:0.06
          })
        ],
        '復活後3秒間、被ダメージ-6％。'
      ),
      S(
        '再起装甲',
        P(110,50,70,0),
        [
          E('REVIVE_PROTECTION',{
            durationSeconds:4,
            damageReductionRate:0.10
          })
        ],
        '復活後4秒間、被ダメージ-10％。'
      )
    ),

    B(
      'CB09',
      'COMMON',
      S(
        '戦後整備',
        P(30,40,0,0),
        [
          E('POST_BATTLE_HEAL',{
            rate:0.01
          })
        ],
        '戦闘終了時、最大HPの1％を回復。'
      ),
      S(
        '継戦整備',
        P(80,100,30,0),
        [
          E('POST_BATTLE_HEAL',{
            rate:0.02
          }),
          E('CT_REMAINING_REDUCTION',{
            trigger:'battleEnd',
            target:'longestRemainingSkill',
            seconds:0.15
          })
        ],
        '戦闘終了時、最大HPの2％を回復し、最長残りCTを0.15秒短縮。'
      )
    ),

    B(
      'CB10',
      'COMMON',
      S(
        '再戦準備',
        P(0,30,45,0),
        [
          E('START_STAT_BUFF',{
            condition:'previousBattleEndHpLte',
            threshold:0.50,
            durationSeconds:4,
            stats:{
              mind:1
            }
          })
        ],
        '前戦終了時のHPが50％以下なら、次戦開始から4秒間マインド+1。'
      ),
      S(
        '再戦適応',
        P(50,70,90,0),
        [
          E('START_STAT_BUFF',{
            condition:'previousBattleEndHpLte',
            threshold:0.50,
            durationSeconds:5,
            stats:{
              mind:2
            }
          }),
          E('DAMAGE_REDUCTION',{
            condition:'previousBattleEndHpLte',
            threshold:0.50,
            durationSeconds:5,
            rate:0.02
          })
        ],
        '前戦終了時のHPが50％以下なら、次戦開始から5秒間マインド+2、被ダメージ-2％。'
      )
    ),

    B(
      'CB11',
      'COMMON',
      S(
        '接近感覚',
        P(30,0,0,35),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'close',
            stats:{
              aim:1
            }
          })
        ],
        '近距離にいる間、エイム+1。'
      ),
      S(
        '接近支配',
        P(80,40,0,90),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'close',
            stats:{
              aim:2
            }
          }),
          E('DAMAGE_MODIFIER',{
            condition:'distance',
            distance:'close',
            rate:0.02
          })
        ],
        '近距離にいる間、エイム+2、与ダメージ+2％。'
      )
    ),

    B(
      'CB12',
      'COMMON',
      S(
        '中域感覚',
        P(0,25,0,40),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'mid',
            stats:{
              aim:1
            }
          })
        ],
        '中距離にいる間、エイム+1。'
      ),
      S(
        '中域支配',
        P(0,100,20,90),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'mid',
            stats:{
              aim:2,
              technique:1
            }
          })
        ],
        '中距離にいる間、エイム+2、テクニック+1。'
      )
    ),

    B(
      'CB13',
      'COMMON',
      S(
        '遠隔感覚',
        P(0,0,25,45),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'far',
            stats:{
              aim:1
            }
          })
        ],
        '遠距離にいる間、エイム+1。'
      ),
      S(
        '遠隔支配',
        P(0,40,70,110),
        [
          E('CONDITIONAL_STAT_BUFF',{
            condition:'distance',
            distance:'far',
            stats:{
              aim:2,
              mind:1
            }
          })
        ],
        '遠距離にいる間、エイム+2、マインド+1。'
      )
    ),

    B(
      'CB14',
      'COMMON',
      S(
        '距離適応',
        P(0,40,30,0),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'laneMoved',
            durationSeconds:2,
            stats:{
              mind:1
            }
          })
        ],
        '距離移動後2秒間、マインド+1。'
      ),
      S(
        '射程適応',
        P(0,110,50,60),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'laneMoved',
            durationSeconds:3,
            stats:{
              mind:2
            }
          }),
          E('RANGE_PENALTY_REDUCTION',{
            rate:0.15
          })
        ],
        '距離移動後3秒間マインド+2。不得意距離の命中ペナルティを15％軽減。'
      )
    ),

    B(
      'CB15',
      'COMMON',
      S(
        '修正射撃',
        P(0,0,25,45),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'attackMissed',
            consumeOn:'nextNormalAttack',
            stats:{
              aim:2
            }
          })
        ],
        '攻撃を外した後、次の通常攻撃時にエイム+2。'
      ),
      S(
        '照準補正',
        P(0,70,40,110),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'attackMissed',
            consumeOn:'nextAttackOrAttackSkill',
            stats:{
              aim:3
            }
          })
        ],
        '攻撃を外した後、次の通常攻撃または攻撃スキル時にエイム+3。'
      )
    ),

    B(
      'CB16',
      'COMMON',
      S(
        '安定射撃',
        P(0,25,0,50),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'consecutiveHits',
            count:3,
            durationSeconds:3,
            stats:{
              aim:1
            }
          })
        ],
        '3回連続命中すると3秒間、エイム+1。'
      ),
      S(
        '精密射撃',
        P(0,80,30,120),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'consecutiveHits',
            count:3,
            durationSeconds:4,
            stats:{
              aim:2
            }
          })
        ],
        '3回連続命中すると4秒間、エイム+2。'
      )
    ),

    B(
      'CB17',
      'COMMON',
      S(
        '弱点観察',
        P(0,40,0,35),
        [
          E('DAMAGE_MODIFIER',{
            condition:'targetHpLte',
            threshold:0.50,
            rate:0.02
          })
        ],
        'HP50％以下の敵への与ダメージ+2％。'
      ),
      S(
        '弱点解析',
        P(0,100,30,100),
        [
          E('DAMAGE_MODIFIER',{
            condition:'targetHpThresholds',
            thresholds:[
              {
                lte:0.25,
                rate:0.05
              },
              {
                lte:0.50,
                rate:0.03
              }
            ]
          })
        ],
        'HP50％以下の敵へ+3％、HP25％以下なら+5％。'
      )
    ),

    B(
      'CB18',
      'COMMON',
      S(
        '連携射線',
        P(0,45,0,30),
        [
          E('DAMAGE_MODIFIER',{
            condition:'sameTargetAfterAllyAttack',
            windowSeconds:2,
            rate:0.02
          })
        ],
        '味方の攻撃後2秒以内に同じ敵を攻撃すると、与ダメージ+2％。'
      ),
      S(
        '交差射線',
        P(0,110,40,80),
        [
          E('DAMAGE_MODIFIER',{
            condition:'sameTargetAfterAllyAttack',
            windowSeconds:2,
            rate:0.04
          }),
          E('TARGET_PRIORITY',{
            condition:'sameTargetAsAlly',
            points:15
          })
        ],
        '同条件で与ダメージ+4％。同じ敵を狙う優先度+15％。'
      )
    ),

    B(
      'CB19',
      'COMMON',
      S(
        '状態耐性',
        P(0,30,50,0),
        [
          E('DEBUFF_DURATION_REDUCTION',{
            rate:0.08
          })
        ],
        '自身が受けるデバフ時間-8％。'
      ),
      S(
        '状態制御',
        P(30,100,110,0),
        [
          E('DEBUFF_DURATION_REDUCTION',{
            rate:0.15
          }),
          E('DEBUFF_VALUE_REDUCTION',{
            rate:0.10
          })
        ],
        'デバフ時間-15％、デバフ効果量-10％。'
      )
    ),

    B(
      'CB20',
      'COMMON',
      S(
        '防護循環',
        P(30,45,0,0),
        [
          E('HEAL_RATE_POINTS',{
            skillId:'shield_charge',
            points:1
          }),
          E('CT_FLAT_REDUCTION',{
            skillId:'shield_charge',
            seconds:0.10
          })
        ],
        'シールドチャージの回復量+1pt、基本CT-0.10秒。'
      ),
      S(
        '装甲循環',
        P(80,110,40,0),
        [
          E('HEAL_RATE_POINTS',{
            skillId:'shield_charge',
            points:2
          }),
          E('CT_FLAT_REDUCTION',{
            skillId:'shield_charge',
            seconds:0.20
          })
        ],
        'シールドチャージの回復量+2pt、基本CT-0.20秒。'
      )
    )
  ];

  const IGL_BLUE=[
    B(
      'IB01',
      'IGL',
      S(
        '号令強化',
        P(0,40,50,0),
        [
          E('TEAM_STAT_BUFF',{
            skillId:'igl_hot_call',
            addStats:{
              aim:1
            }
          })
        ],
        'コールのエイム上昇量+1。'
      ),
      S(
        '号令統率',
        P(0,90,120,40),
        [
          E('TEAM_STAT_BUFF',{
            skillId:'igl_hot_call',
            addStats:{
              aim:1,
              mind:1
            }
          })
        ],
        'コールのエイムとマインド上昇量+1。'
      )
    ),

    B(
      'IB02',
      'IGL',
      S(
        '指揮持続',
        P(0,45,50,0),
        [
          E('DEBUFF_DURATION_ADD',{
            skillId:'igl_hot_call',
            seconds:0.30
          })
        ],
        'コールの持続時間+0.30秒。'
      ),
      S(
        '指揮掌握',
        P(0,110,120,0),
        [
          E('DEBUFF_DURATION_ADD',{
            skillId:'igl_hot_call',
            seconds:0.60
          })
        ],
        'コールの持続時間+0.60秒。'
      )
    )    ,

    B(
      'IB03',
      'IGL',
      S(
        '開幕指示',
        P(0,55,40,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'battleStart',
            skillId:'igl_hot_call',
            seconds:0.25
          })
        ],
        '各戦闘開始時、コールの残りCT-0.25秒。'
      ),
      S(
        '開幕統率',
        P(0,130,100,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'battleStart',
            skillId:'igl_hot_call',
            seconds:0.50
          })
        ],
        '各戦闘開始時、コールの残りCT-0.50秒。'
      )
    ),

    B(
      'IB04',
      'IGL',
      S(
        '緊急号令',
        P(0,40,60,0),
        [
          E('TEAM_STAT_BUFF',{
            skillId:'igl_hot_call',
            condition:'allyHpLte',
            threshold:0.40,
            addStats:{
              mind:1
            }
          })
        ],
        'HP40％以下の味方がいる時、コールのマインド上昇量+1。'
      ),
      S(
        '逆境統率',
        P(40,90,130,0),
        [
          E('TEAM_STAT_BUFF',{
            skillId:'igl_hot_call',
            condition:'allyHpLte',
            threshold:0.40,
            addStats:{
              aim:1,
              mind:1
            }
          }),
          E('DAMAGE_REDUCTION',{
            condition:'iglCallActiveAndAllyHpLte',
            threshold:0.40,
            rate:0.02,
            target:'team'
          })
        ],
        '味方低HP時、コールのエイムとマインド+1。効果中の味方被ダメージ-2％。'
      )
    ),

    B(
      'IB05',
      'IGL',
      S(
        '射線共有',
        P(0,0,50,45),
        [
          E('TEAM_STAT_BUFF',{
            condition:'iglCallActive',
            stats:{
              aim:1
            }
          })
        ],
        'コール効果中、味方全体のエイム+1。'
      ),
      S(
        '射線統制',
        P(0,50,100,100),
        [
          E('TEAM_STAT_BUFF',{
            condition:'iglCallActive',
            stats:{
              aim:1,
              technique:1
            }
          })
        ],
        'コール効果中、味方全体のエイム+1、テクニック+1。'
      )
    ),

    B(
      'IB06',
      'IGL',
      S(
        '目標指定',
        P(0,60,40,0),
        [
          E('TARGET_PRIORITY',{
            trigger:'iglAttackSkillHit',
            durationSeconds:3,
            points:20,
            target:'sameEnemyForTeam'
          })
        ],
        'IGLの攻撃スキル命中後3秒間、味方が同じ敵を狙う優先度+20％。'
      ),
      S(
        '目標固定',
        P(0,130,90,40),
        [
          E('TARGET_PRIORITY',{
            trigger:'iglAttackSkillHit',
            durationSeconds:3,
            points:35,
            target:'sameEnemyForTeam'
          }),
          E('DAMAGE_MODIFIER',{
            trigger:'iglAttackSkillHit',
            durationSeconds:3,
            rate:0.03,
            target:'teamVsMarkedEnemy'
          })
        ],
        '優先度+35％。指定対象への味方全体の与ダメージ+3％。'
      )
    ),

    B(
      'IB07',
      'IGL',
      S(
        '戦線再編',
        P(0,45,55,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'allyDowned',
            skillId:'igl_hot_call',
            seconds:0.30,
            limitPerBattle:1
          })
        ],
        '味方ダウン時、コールの残りCT-0.30秒。1戦闘1回。'
      ),
      S(
        '戦線再生',
        P(30,110,120,0),
        [
          E('CT_REMAINING_REDUCTION',{
            trigger:'allyDowned',
            skillId:'igl_hot_call',
            seconds:0.60,
            limitPerBattle:1
          }),
          E('EVENT_STAT_BUFF',{
            trigger:'allyDowned',
            durationSeconds:3,
            stats:{
              mind:1
            },
            limitPerBattle:1
          })
        ],
        '味方ダウン時、コールCT-0.60秒。自身のマインド+1、3秒。1戦闘1回。'
      )
    ),

    B(
      'IB08',
      'IGL',
      S(
        '被害整理',
        P(45,0,55,0),
        [
          E('DAMAGE_REDUCTION',{
            trigger:'battleStart',
            durationSeconds:3,
            rate:0.02,
            target:'team'
          })
        ],
        '戦闘開始から3秒間、味方全体の被ダメージ-2％。'
      ),
      S(
        '被害統制',
        P(100,40,120,0),
        [
          E('DAMAGE_REDUCTION',{
            trigger:'battleStart',
            durationSeconds:4,
            rate:0.03,
            target:'team'
          })
        ],
        '戦闘開始から4秒間、味方全体の被ダメージ-3％。'
      )
    ),

    B(
      'IB09',
      'IGL',
      S(
        '再起指揮',
        P(0,45,60,0),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'allyRevived',
            durationSeconds:3,
            target:'team',
            stats:{
              mind:1
            }
          })
        ],
        '味方復活時、味方全体のマインド+1、3秒。'
      ),
      S(
        '再起統率',
        P(40,100,130,0),
        [
          E('EVENT_STAT_BUFF',{
            trigger:'allyRevived',
            durationSeconds:4,
            target:'team',
            stats:{
              mind:2,
              agility:1
            }
          })
        ],
        '味方復活時、味方全体のマインド+2、アジリティ+1、4秒。'
      )
    ),

    B(
      'IB10',
      'IGL',
      S(
        '冷静判断',
        P(0,50,60,0),
        [
          E('DECISION_DELAY_REDUCTION',{
            seconds:0.20
          }),
          E('TARGET_PRIORITY',{
            condition:'lowestHpEnemy',
            points:15
          })
        ],
        'スキル対象の判断時間-0.20秒。低HPの敵を狙う優先度+15％。'
      ),
      S(
        '戦況掌握',
        P(0,120,130,30),
        [
          E('DECISION_DELAY_REDUCTION',{
            seconds:0.40
          }),
          E('TARGET_PRIORITY',{
            condition:'lowestHpEnemy',
            points:30
          }),
          E('SKILL_TARGET_RULE',{
            rule:'doNotRefreshIglCallIfMoreThanOneSecondRemains'
          })
        ],
        '判断時間-0.40秒、低HP優先+30％。コール残り1秒以上なら重ねない。'
      )
    )
  ];

  const ATK_BLUE=[
    B(
      'AB01',
      'ATK',
      S(
        '火力集中',
        P(55,40,0,0),
        [
          E('DAMAGE_MODIFIER',{
            target:'attackSkills',
            rate:0.02
          })
        ],
        '攻撃スキルの与ダメージ+2％。'
      ),
      S(
        '火力支配',
        P(120,100,0,40),
        [
          E('DAMAGE_MODIFIER',{
            target:'attackSkills',
            rate:0.04
          })
        ],
        '攻撃スキルの与ダメージ+4％。'
      )
    ),

    B(
      'AB02',
      'ATK',
      S(
        '単体強撃',
        P(60,0,0,40),
        [
          E('DAMAGE_MODIFIER',{
            target:'singleAttackSkills',
            rate:0.03
          })
        ],
        '単体攻撃スキルの与ダメージ+3％。'
      ),
      S(
        '単体破砕',
        P(140,80,0,40),
        [
          E('DAMAGE_MODIFIER',{
            target:'singleAttackSkills',
            rate:0.06
          })
        ],
        '単体攻撃スキルの与ダメージ+6％。'
      )
    ),

    B(
      'AB03',
      'ATK',
      S(
        '全域砲撃',
        P(55,45,0,0),
        [
          E('DAMAGE_MODIFIER',{
            target:'areaAttackSkills',
            rate:0.02
          })
        ],
        '全体攻撃スキルの与ダメージ+2％。'
      ),
      S(
        '全域制圧',
        P(120,110,0,30),
        [
          E('DAMAGE_MODIFIER',{
            target:'areaAttackSkills',
            rate:0.04
          })
        ],
        '全体攻撃スキルの与ダメージ+4％。'
      )
    ),

    B(
      'AB04',
      'ATK',
      S(
        '精密攻撃',
        P(0,40,0,55),
        [
          E('HIT_RATE_POINTS',{
            target:'attackSkills',
            points:3
          })
        ],
        '攻撃スキルの命中率+3pt。'
      ),
      S(
        '必中照準',
        P(0,90,30,130),
        [
          E('HIT_RATE_POINTS',{
            target:'attackSkills',
            points:6
          })
        ],
        '攻撃スキルの命中率+6pt。'
      )
    ),

    B(
      'AB05',
      'ATK',
      S(
        '弱点狙撃',
        P(0,45,0,50),
        [
          E('DAMAGE_MODIFIER',{
            condition:'targetHpLte',
            threshold:0.50,
            rate:0.02
          })
        ],
        'HP50％以下の敵への与ダメージ+2％。'
      ),
      S(
        '急所破砕',
        P(40,100,0,120),
        [
          E('DAMAGE_MODIFIER',{
            condition:'targetHpLte',
            threshold:0.50,
            rate:0.04
          })
        ],
        'HP50％以下の敵への与ダメージ+4％。'
      )
    ),

    B(
      'AB06',
      'ATK',
      S(
        '追撃判断',
        P(0,55,0,40),
        [
          E('DAMAGE_MODIFIER',{
            condition:'sameTargetAfterAllyAttack',
            windowSeconds:2,
            rate:0.02
          })
        ],
        '味方の攻撃後2秒以内に同じ敵を攻撃すると、与ダメージ+2％。'
      ),
      S(
        '追撃連鎖',
        P(0,120,40,100),
        [
          E('DAMAGE_MODIFIER',{
            condition:'sameTargetAfterAllyAttack',
            windowSeconds:2,
            rate:0.04
          }),
          E('TARGET_PRIORITY',{
            condition:'sameTargetAsAlly',
            points:15
          })
        ],
        '同条件で与ダメージ+4％。同じ敵を狙う優先度+15％。'
      )
    )    ,

    B(
      'AB07',
      'ATK',
      S(
        '決着火力',
        P(55,0,45,0),
        [
          E('DAMAGE_MODIFIER',{
            condition:'oneEnemyAlive',
            rate:0.03
          })
        ],
        '敵の生存者が残り1人の時、与ダメージ+3％。'
      ),
      S(
        '終幕火力',
        P(130,0,40,90),
        [
          E('DAMAGE_MODIFIER',{
            condition:'oneEnemyAlive',
            rate:0.06
          })
        ],
        '敵の生存者が残り1人の時、与ダメージ+6％。'
      )
    ),

    B(
      'AB08',
      'ATK',
      S(
        '煙幕強化',
        P(0,55,45,0),
        [
          E('DEBUFF_SUCCESS_POINTS',{
            skillId:'atk_smoke_launcher',
            points:5
          }),
          E('DEBUFF_DURATION_ADD',{
            skillId:'atk_smoke_launcher',
            seconds:0.30
          })
        ],
        '煙幕の成功率+5pt、持続時間+0.30秒。'
      ),
      S(
        '煙幕支配',
        P(0,130,100,30),
        [
          E('DEBUFF_SUCCESS_POINTS',{
            skillId:'atk_smoke_launcher',
            points:10
          }),
          E('DEBUFF_DURATION_ADD',{
            skillId:'atk_smoke_launcher',
            seconds:0.70
          })
        ],
        '煙幕の成功率+10pt、持続時間+0.70秒。'
      )
    ),

    B(
      'AB09',
      'ATK',
      S(
        '攻勢維持',
        P(50,0,45,0),
        [
          E('DAMAGE_MODIFIER',{
            condition:'selfHpGte',
            threshold:0.70,
            rate:0.02
          })
        ],
        'HP70％以上の間、与ダメージ+2％。'
      ),
      S(
        '攻勢支配',
        P(120,0,90,40),
        [
          E('DAMAGE_MODIFIER',{
            condition:'selfHpGte',
            threshold:0.70,
            rate:0.03
          }),
          E('CONDITIONAL_STAT_BUFF',{
            condition:'selfHpGte',
            threshold:0.70,
            stats:{
              aim:1
            }
          })
        ],
        'HP70％以上の間、与ダメージ+3％、エイム+1。'
      )
    ),

    B(
      'AB10',
      'ATK',
      S(
        '装甲貫通',
        P(60,50,0,0),
        [
          E('IGNORE_DAMAGE_REDUCTION',{
            rate:0.02
          })
        ],
        '敵のダメージ軽減を2％分無視。'
      ),
      S(
        '防護破砕',
        P(130,120,0,30),
        [
          E('IGNORE_DAMAGE_REDUCTION',{
            rate:0.04
          })
        ],
        '敵のダメージ軽減を4％分無視。'
      )
    )
  ];

  const SUP_BLUE=[
    B(
      'SB01',
      'SUP',
      S(
        '回復出力',
        P(0,55,40,0),
        [
          E('HEAL_RATE_POINTS',{
            target:'allHeals',
            points:1
          })
        ],
        '自身が行う回復量+1pt。'
      ),
      S(
        '回復増幅',
        P(30,120,100,0),
        [
          E('HEAL_RATE_POINTS',{
            target:'allHeals',
            points:2
          })
        ],
        '自身が行う回復量+2pt。'
      )
    ),

    B(
      'SB02',
      'SUP',
      S(
        '精密治療',
        P(0,55,45,0),
        [
          E('HEAL_RATE_POINTS',{
            condition:'targetIsLowestHpAlly',
            points:2
          })
        ],
        '最もHP割合が低い味方への回復量+2pt。'
      ),
      S(
        '救命治療',
        P(30,120,110,0),
        [
          E('HEAL_RATE_POINTS',{
            condition:'targetIsLowestHpAlly',
            points:4
          })
        ],
        '最もHP割合が低い味方への回復量+4pt。'
      )
    ),

    B(
      'SB03',
      'SUP',
      S(
        '全体治療',
        P(0,60,40,0),
        [
          E('HEAL_RATE_POINTS',{
            skillId:'sup_drone_heal',
            points:1
          })
        ],
        'ドローンヒールの回復量+1pt。'
      ),
      S(
        '全域治療',
        P(30,130,100,0),
        [
          E('HEAL_RATE_POINTS',{
            skillId:'sup_drone_heal',
            points:2
          })
        ],
        'ドローンヒールの回復量+2pt。'
      )
    ),

    B(
      'SB04',
      'SUP',
      S(
        '緊急治療',
        P(0,55,50,0),
        [
          E('HEAL_RATE_POINTS',{
            condition:'targetHpLte',
            threshold:0.30,
            points:3
          })
        ],
        'HP30％以下の味方への回復量+3pt。'
      ),
      S(
        '緊急救命',
        P(30,120,120,0),
        [
          E('HEAL_RATE_POINTS',{
            condition:'targetHpLte',
            threshold:0.30,
            points:5
          })
        ],
        'HP30％以下の味方への回復量+5pt。'
      )
    ),

    B(
      'SB05',
      'SUP',
      S(
        '治療効率',
        P(0,60,45,0),
        [
          E('CT_FLAT_REDUCTION',{
            skillId:'sup_drone_heal',
            seconds:0.15
          })
        ],
        'ドローンヒールの基本CT-0.15秒。'
      ),
      S(
        '治療循環',
        P(0,140,100,0),
        [
          E('CT_FLAT_REDUCTION',{
            skillId:'sup_drone_heal',
            seconds:0.30
          })
        ],
        'ドローンヒールの基本CT-0.30秒。'
      )
    ),

    B(
      'SB06',
      'SUP',
      S(
        '蘇生技術',
        P(0,60,50,0),
        [
          E('REVIVE_HP_POINTS',{
            skillId:'sup_respawn_field',
            points:2
          })
        ],
        'リスポーンフィールドの復活HP+2pt。'
      ),
      S(
        '蘇生熟練',
        P(30,130,120,0),
        [
          E('REVIVE_HP_POINTS',{
            skillId:'sup_respawn_field',
            points:5
          })
        ],
        'リスポーンフィールドの復活HP+5pt。'
      )
    ),

    B(
      'SB07',
      'SUP',
      S(
        '蘇生防護',
        P(50,0,55,0),
        [
          E('REVIVE_PROTECTION',{
            durationSeconds:2,
            damageReductionRate:0.05,
            source:'supRevive'
          })
        ],
        '復活した味方が2秒間、被ダメージ-5％。'
      ),
      S(
        '蘇生装甲',
        P(110,40,120,0),
        [
          E('REVIVE_PROTECTION',{
            durationSeconds:3,
            damageReductionRate:0.08,
            source:'supRevive'
          })
        ],
        '復活した味方が3秒間、被ダメージ-8％。'
      )
    ),

    B(
      'SB08',
      'SUP',
      S(
        '救命判断',
        P(0,40,60,0),
        [
          E('SKILL_TARGET_RULE',{
            rule:'prioritizeReviveOverHealWhenTargetExists'
          }),
          E('DECISION_DELAY_REDUCTION',{
            condition:'reviveTargetExists',
            seconds:0.30
          })
        ],
        '復活対象がいる時は回復より復活を優先。判断時間-0.30秒。'
      ),
      S(
        '救命優先',
        P(0,100,130,0),
        [
          E('SKILL_TARGET_RULE',{
            rule:'reviveIsHighestPriorityWhenTargetExists'
          }),
          E('DECISION_DELAY_REDUCTION',{
            condition:'reviveTargetExists',
            seconds:0.60
          })
        ],
        '復活対象がいる時は最優先で復活。判断時間-0.60秒。'
      )
    ),

    B(
      'SB09',
      'SUP',
      S(
        '支援連鎖',
        P(0,55,50,0),
        [
          E('HEAL_TARGET_BUFF',{
            durationSeconds:2,
            stats:{
              mind:1
            }
          })
        ],
        '回復した味方のマインド+1、2秒。'
      ),
      S(
        '支援循環',
        P(0,120,120,0),
        [
          E('HEAL_TARGET_BUFF',{
            durationSeconds:3,
            stats:{
              mind:1,
              technique:1
            }
          })
        ],
        '回復した味方のマインド+1、テクニック+1、3秒。'
      )
    ),

    B(
      'SB10',
      'SUP',
      S(
        '状態安定',
        P(0,60,50,0),
        [
          E('DEBUFF_DURATION_REDUCTION',{
            trigger:'healedBySelf',
            target:'healedAlly',
            flatSeconds:0.25
          })
        ],
        '味方を回復した時、対象のデバフ残り時間-0.25秒。'
      ),
      S(
        '状態浄化',
        P(30,130,120,0),
        [
          E('DEBUFF_DURATION_REDUCTION',{
            trigger:'healedBySelf',
            target:'healedAlly',
            flatSeconds:0.50
          }),
          E('DEBUFF_DURATION_REDUCTION',{
            trigger:'healedBySelf',
            target:'healedAlly',
            durationSeconds:3,
            rate:0.10,
            appliesToNextDebuff:true
          })
        ],
        '回復時にデバフ残り時間-0.50秒。3秒間、次のデバフ時間-10％。'
      )
    )
  ];

  const COMMON_GOLD=[
    L(
      'CG01',
      'gold',
      'COMMON',
      '地方覇者',
      C.wins('local',3),
      P(250,0,250,0),
      [
        E('MAX_HP_ADD',{
          tournamentTier:'local',
          value:50
        })
      ],
      'Local大会中、最大HP+50。'
    ),

    L(
      'CG02',
      'gold',
      'COMMON',
      '全国常連',
      C.top5('national',5),
      P(0,180,220,150),
      [
        E('ALL_STATS_BUFF',{
          tournamentTier:'national',
          value:1
        })
      ],
      'National大会中、7能力すべて+1。'
    ),

    L(
      'CG03',
      'gold',
      'COMMON',
      '百戦錬磨',
      C.all(
        C.damage(500000),
        C.kp(250),
        C.ap(250)
      ),
      P(150,180,180,140),
      [
        E('DAMAGE_MODIFIER',{
          afterSeconds:10,
          rate:0.03
        }),
        E('DAMAGE_REDUCTION',{
          afterSeconds:10,
          rate:0.03
        })
      ],
      '戦闘開始10秒後、与ダメージ+3％、被ダメージ-3％。'
    ),

    L(
      'CG04',
      'gold',
      'COMMON',
      '育成結晶',
      C.training(200),
      P(125,125,125,125),
      [
        E('LOWEST_STAT_BUFF',{
          value:3,
          tiePriorityByRole:{
            IGL:'mind',
            ATK:'aim',
            SUP:'support'
          }
        })
      ],
      '戦闘開始時、最も低い基礎能力1つ+3。'
    ),

    L(
      'CG05',
      'gold',
      'COMMON',
      '収集眼力',
      C.all(
        C.cards(150),
        C.badges(50)
      ),
      P(0,250,180,120),
      [
        E('CONDITIONAL_STAT_BUFF',{
          condition:'weaponPreferredDistance',
          stats:{
            aim:2,
            technique:2
          }
        })
      ],
      '武器の得意距離にいる間、エイム+2、テクニック+2。'
    )
  ];
  const IGL_GOLD=[
    L(
      'IG01',
      'gold',
      'IGL',
      '戦況統率',
      C.ap(100),
      P(0,220,260,0),
      [
        E('DEBUFF_DURATION_ADD',{
          skillId:'igl_hot_call',
          seconds:0.40
        })
      ],
      'コールの持続時間+0.40秒。'
    ),

    L(
      'IG02',
      'gold',
      'IGL',
      '号令中枢',
      C.ap(250),
      P(0,230,300,0),
      [
        E('TEAM_STAT_BUFF',{
          skillId:'igl_hot_call',
          addStats:{
            aim:1,
            mind:1
          }
        })
      ],
      'コールのエイムとマインド上昇量+1。'
    ),

    L(
      'IG03',
      'gold',
      'IGL',
      '開幕支配',
      C.mvp('local',1),
      P(0,250,200,0),
      [
        E('CT_REMAINING_REDUCTION',{
          trigger:'battleStart',
          skillId:'igl_hot_call',
          seconds:0.50
        })
      ],
      '各戦闘開始時、コールの残りCT-0.50秒。'
    ),

    L(
      'IG04',
      'gold',
      'IGL',
      '逆転号令',
      C.mvp('local',3),
      P(80,180,260,0),
      [
        E('TEAM_STAT_BUFF',{
          skillId:'igl_hot_call',
          condition:'allyHpLte',
          threshold:0.40,
          addStats:{
            aim:1,
            mind:1
          }
        }),
        E('DAMAGE_REDUCTION',{
          condition:'iglCallActiveAndAllyHpLte',
          threshold:0.40,
          target:'team',
          rate:0.02
        })
      ],
      '味方低HP時、コールのエイムとマインド+1、被ダメージ-2％。'
    ),

    L(
      'IG05',
      'gold',
      'IGL',
      '目標統制',
      C.top5('national',3),
      P(0,230,180,110),
      [
        E('DAMAGE_MODIFIER',{
          trigger:'iglAttackSkillHit',
          durationSeconds:3,
          target:'teamVsMarkedEnemy',
          rate:0.04
        })
      ],
      '指定対象への味方全体の与ダメージ+4％、3秒。'
    ),

    L(
      'IG06',
      'gold',
      'IGL',
      '全国指揮',
      C.mvp('national',1),
      P(0,200,250,100),
      [
        E('TEAM_STAT_BUFF',{
          tournamentTier:'national',
          condition:'iglCallActive',
          stats:{
            agility:1,
            support:1
          }
        })
      ],
      'National大会中、コール効果中の味方全体にアジリティ+1、サポート+1。'
    ),

    L(
      'IG07',
      'gold',
      'IGL',
      '勝利設計',
      C.wins('national',1),
      P(100,250,250,0),
      [
        E('CT_REMAINING_REDUCTION',{
          trigger:'battleStart',
          target:'teamLongestRemainingSkill',
          seconds:0.35
        })
      ],
      '各戦闘開始時、味方全員の最長残りCT-0.35秒。'
    ),

    L(
      'IG08',
      'gold',
      'IGL',
      '王者采配',
      C.wins('national',3),
      P(0,280,280,90),
      [
        E('CT_FLAT_REDUCTION',{
          skillId:'igl_hot_call',
          seconds:0.35
        }),
        E('DEBUFF_DURATION_ADD',{
          skillId:'igl_hot_call',
          seconds:0.50
        })
      ],
      'コールの基本CT-0.35秒、持続時間+0.50秒。'
    ),

    L(
      'IG09',
      'gold',
      'IGL',
      '育成指揮',
      C.training(150),
      P(100,150,250,0),
      [
        E('CONDITIONAL_STAT_BUFF',{
          condition:'always',
          stats:{
            mind:2,
            support:2
          }
        })
      ],
      '戦闘中、マインド+2、サポート+2。'
    ),

    L(
      'IG10',
      'gold',
      'IGL',
      '連携完成',
      C.all(
        C.ap(500),
        C.mvp('national',3)
      ),
      P(0,280,280,90),
      [
        E('CT_REMAINING_REDUCTION',{
          trigger:'iglHotCallActivated',
          target:'teamLongestRemainingSkill',
          seconds:0.30
        })
      ],
      'コール発動時、味方全員の最長残りCT-0.30秒。'
    )
  ];

  const ATK_GOLD=[
    L(
      'AG01',
      'gold',
      'ATK',
      '決定打撃',
      C.kp(100),
      P(220,120,0,140),
      [
        E('DAMAGE_MODIFIER',{
          target:'singleAttackSkills',
          rate:0.05
        })
      ],
      '単体攻撃スキルの与ダメージ+5％。'
    ),

    L(
      'AG02',
      'gold',
      'ATK',
      '火力中枢',
      C.damage(250000),
      P(220,180,0,100),
      [
        E('DAMAGE_MODIFIER',{
          target:'attackSkills',
          rate:0.03
        })
      ],
      '攻撃スキルの与ダメージ+3％。'
    ),

    L(
      'AG03',
      'gold',
      'ATK',
      '弱点看破',
      C.kp(250),
      P(200,150,0,200),
      [
        E('DAMAGE_MODIFIER',{
          condition:'targetHpLte',
          threshold:0.30,
          rate:0.07
        })
      ],
      'HP30％以下の敵への与ダメージ+7％。'
    ),

    L(
      'AG04',
      'gold',
      'ATK',
      '追撃極意',
      C.ap(100),
      P(0,200,120,150),
      [
        E('DAMAGE_MODIFIER',{
          condition:'sameTargetAfterAllyAttack',
          windowSeconds:2,
          rate:0.05
        })
      ],
      '味方の攻撃後2秒以内に同じ敵を攻撃すると、与ダメージ+5％。'
    ),

    L(
      'AG05',
      'gold',
      'ATK',
      '地方砲手',
      C.mvp('local',1),
      P(170,100,0,180),
      [
        E('DAMAGE_MODIFIER',{
          tournamentTier:'local',
          target:'attackSkills',
          rate:0.04
        })
      ],
      'Local大会中、攻撃スキルの与ダメージ+4％。'
    ),

    L(
      'AG06',
      'gold',
      'ATK',
      '地方王砲',
      C.all(
        C.mvp('local',3),
        C.wins('local',3)
      ),
      P(250,150,0,200),
      [
        E('DAMAGE_MODIFIER',{
          tournamentTier:'local',
          target:'attackSkills',
          rate:0.06
        }),
        E('HIT_RATE_POINTS',{
          tournamentTier:'local',
          target:'attackSkills',
          points:3
        })
      ],
      'Local大会中、攻撃スキルの与ダメージ+6％、命中率+3pt。'
    ),

    L(
      'AG07',
      'gold',
      'ATK',
      '全国砲手',
      C.top5('national',3),
      P(0,150,120,250),
      [
        E('CONDITIONAL_STAT_BUFF',{
          tournamentTier:'national',
          condition:'always',
          stats:{
            aim:2
          }
        })
      ],
      'National大会中、エイム+2。'
    ),

    L(
      'AG08',
      'gold',
      'ATK',
      '王者弾道',
      C.mvp('national',1),
      P(100,180,0,280),
      [
        E('HIT_RATE_POINTS',{
          target:'attackSkills',
          points:6
        }),
        E('DAMAGE_MODIFIER',{
          target:'attackSkills',
          rate:0.02
        })
      ],
      '攻撃スキルの命中率+6pt、与ダメージ+2％。'
    ),

    L(
      'AG09',
      'gold',
      'ATK',
      '終幕射撃',
      C.wins('national',1),
      P(240,0,120,240),
      [
        E('DAMAGE_MODIFIER',{
          condition:'oneEnemyAlive',
          rate:0.08
        })
      ],
      '敵の生存者が残り1人の時、与ダメージ+8％。'
    ),

    L(
      'AG10',
      'gold',
      'ATK',
      '火力完成',
      C.all(
        C.damage(750000),
        C.kp(500),
        C.mvp('national',3)
      ),
      P(260,220,0,170),
      [
        E('IGNORE_DAMAGE_REDUCTION',{
          rate:0.06
        })
      ],
      '敵のダメージ軽減を6％分無視。'
    )
  ];

  const SUP_GOLD=[
    L(
      'SG01',
      'gold',
      'SUP',
      '救命設計',
      C.ap(100),
      P(50,220,210,0),
      [
        E('HEAL_RATE_POINTS',{
          condition:'targetHpLte',
          threshold:0.30,
          points:4
        })
      ],
      'HP30％以下の味方への回復量+4pt。'
    ),

    L(
      'SG02',
      'gold',
      'SUP',
      '回復中枢',
      C.ap(250),
      P(50,250,220,0),
      [
        E('HEAL_RATE_POINTS',{
          target:'allHeals',
          points:3
        })
      ],
      '自身が行う全回復量+3pt。'
    ),

    L(
      'SG03',
      'gold',
      'SUP',
      '蘇生名手',
      C.ap(400),
      P(50,260,250,0),
      [
        E('REVIVE_HP_POINTS',{
          skillId:'sup_respawn_field',
          points:5
        })
      ],
      'リスポーンフィールドの復活HP+5pt。'
    ),

    L(
      'SG04',
      'gold',
      'SUP',
      '全域救護',
      C.training(100),
      P(60,220,200,0),
      [
        E('CT_FLAT_REDUCTION',{
          skillId:'sup_drone_heal',
          seconds:0.35
        }),
        E('HEAL_RATE_POINTS',{
          skillId:'sup_drone_heal',
          points:1
        })
      ],
      'ドローンヒールの基本CT-0.35秒、回復量+1pt。'
    ),

    L(
      'SG05',
      'gold',
      'SUP',
      '地方救護',
      C.mvp('local',1),
      P(50,200,200,0),
      [
        E('HEAL_RATE_POINTS',{
          tournamentTier:'local',
          target:'allHeals',
          points:4
        })
      ],
      'Local大会中、自身の回復量+4pt。'
    ),

    L(
      'SG06',
      'gold',
      'SUP',
      '地方救星',
      C.all(
        C.mvp('local',3),
        C.wins('local',3)
      ),
      P(90,250,260,0),
      [
        E('REVIVE_PROTECTION',{
          tournamentTier:'local',
          durationSeconds:4,
          damageReductionRate:0.10,
          source:'supRevive'
        })
      ],
      'Local大会中、復活した味方が4秒間、被ダメージ-10％。'
    ),

    L(
      'SG07',
      'gold',
      'SUP',
      '全国救護',
      C.top5('national',3),
      P(80,220,220,0),
      [
        E('CONDITIONAL_STAT_BUFF',{
          tournamentTier:'national',
          condition:'always',
          stats:{
            support:2
          }
        })
      ],
      'National大会中、サポート+2。'
    )
    ,

    L(
      'SG08',
      'gold',
      'SUP',
      '王者蘇生',
      C.mvp('national',1),
      P(50,260,250,0),
      [
        E('REVIVE_HP_POINTS',{
          skillId:'sup_respawn_field',
          points:5
        }),
        E('CT_REMAINING_REDUCTION',{
          trigger:'reviveSucceeded',
          target:'selfLongestRemainingSkill',
          seconds:0.30
        })
      ],
      '復活HP+5pt。復活成功時、自身の最長残りCT-0.30秒。'
    ),

    L(
      'SG09',
      'gold',
      'SUP',
      '復帰装甲',
      C.wins('national',1),
      P(180,160,260,0),
      [
        E('REVIVE_PROTECTION',{
          durationSeconds:4,
          damageReductionRate:0.08,
          source:'supRevive'
        })
      ],
      '復活した味方が4秒間、被ダメージ-8％。'
    ),

    L(
      'SG10',
      'gold',
      'SUP',
      '支援完成',
      C.all(
        C.ap(600),
        C.mvp('national',3)
      ),
      P(70,300,280,0),
      [
        E('CT_FLAT_REDUCTION',{
          target:[
            'sup_drone_heal',
            'sup_respawn_field'
          ],
          seconds:0.30
        })
      ],
      '回復スキルと復活スキルの基本CT-0.30秒。'
    )
  ];

  const COMMON_RED=[
    L(
      'CR01',
      'redGold',
      'COMMON',
      '世界常連',
      C.top5('world',3),
      P(225,225,225,225),
      [
        E('ALL_STATS_BUFF',{
          tournamentTier:'world',
          value:1
        })
      ],
      'World大会中、7能力すべて+1。'
    ),

    L(
      'CR02',
      'redGold',
      'COMMON',
      '世界覇道',
      C.top5('world',10),
      P(300,200,350,200),
      [
        E('MAX_HP_ADD',{
          tournamentTier:'world',
          value:40
        }),
        E('CONDITIONAL_STAT_BUFF',{
          tournamentTier:'world',
          condition:'always',
          stats:{
            mind:2
          }
        })
      ],
      'World大会中、最大HP+40、マインド+2。'
    ),

    L(
      'CR03',
      'redGold',
      'COMMON',
      '世界王者',
      C.wins('world',1),
      P(400,200,350,150),
      [
        E('MAX_HP_ADD',{
          tournamentTier:'world',
          value:60
        }),
        E('START_STAT_BUFF',{
          tournamentTier:'world',
          durationSeconds:5,
          stats:{
            mind:3
          }
        })
      ],
      'World大会中、最大HP+60。各戦闘開始から5秒間、マインド+3。'
    ),

    L(
      'CR04',
      'redGold',
      'COMMON',
      '世界連覇',
      C.wins('world',3),
      P(300,300,300,300),
      [
        E('DAMAGE_MODIFIER',{
          tournamentTier:'all',
          rate:0.02
        }),
        E('DAMAGE_REDUCTION',{
          tournamentTier:'all',
          rate:0.02
        })
      ],
      '全大会で与ダメージ+2％、被ダメージ-2％。'
    ),

    L(
      'CR05',
      'redGold',
      'COMMON',
      '伝説継承',
      C.champWins(1),
      P(325,325,325,325),
      [
        E('MAX_HP_ADD',{
          tournamentTier:'all',
          value:30
        }),
        E('ALL_STATS_BUFF',{
          tournamentTier:'all',
          value:1
        })
      ],
      '全大会で最大HP+30、7能力すべて+1。'
    )
  ];

  const IGL_RED=[
    L(
      'IR01',
      'redGold',
      'IGL',
      '世界統率',
      C.all(
        C.top5('world',3),
        C.ap(500)
      ),
      P(0,400,400,150),
      [
        E('TEAM_STAT_BUFF',{
          skillId:'igl_hot_call',
          addStats:{
            aim:1,
            mind:1
          }
        })
      ],
      'コールのエイムとマインド上昇量+1。'
    ),

    L(
      'IR02',
      'redGold',
      'IGL',
      '神速号令',
      C.mvp('world',1),
      P(0,450,400,150),
      [
        E('CT_FLAT_REDUCTION',{
          skillId:'igl_hot_call',
          seconds:0.45
        })
      ],
      'コールの基本CT-0.45秒。'
    ),

    L(
      'IR03',
      'redGold',
      'IGL',
      '世界采配',
      C.wins('world',1),
      P(150,400,450,100),
      [
        E('DEBUFF_DURATION_ADD',{
          skillId:'igl_hot_call',
          seconds:0.80
        }),
        E('DAMAGE_REDUCTION',{
          condition:'iglCallActive',
          target:'team',
          rate:0.02
        })
      ],
      'コールの持続時間+0.80秒。効果中、味方全体の被ダメージ-2％。'
    ),

    L(
      'IR04',
      'redGold',
      'IGL',
      '戦況支配',
      C.mvp('world',3),
      P(0,450,450,300),
      [
        E('DAMAGE_MODIFIER',{
          trigger:'iglAttackSkillHit',
          durationSeconds:4,
          target:'teamVsMarkedEnemy',
          rate:0.06
        })
      ],
      '指定対象への味方全体の与ダメージ+6％、4秒。'
    ),

    L(
      'IR05',
      'redGold',
      'IGL',
      '伝説指揮',
      C.all(
        C.champWins(1),
        C.ap(1000)
      ),
      P(200,450,500,150),
      [
        E('CT_REMAINING_REDUCTION',{
          trigger:'battleStart',
          target:'teamAllSkills',
          seconds:0.50
        }),
        E('START_STAT_BUFF',{
          durationSeconds:4,
          target:'team',
          stats:{
            mind:2
          }
        })
      ],
      '各戦闘開始時、味方全員の3スキル残りCT-0.50秒。4秒間マインド+2。'
    )
  ];

  const ATK_RED=[
    L(
      'AR01',
      'redGold',
      'ATK',
      '世界火力',
      C.all(
        C.top5('world',3),
        C.damage(1000000)
      ),
      P(350,250,0,350),
      [
        E('DAMAGE_MODIFIER',{
          target:'attackSkills',
          rate:0.05
        })
      ],
      '攻撃スキルの与ダメージ+5％。'
    ),

    L(
      'AR02',
      'redGold',
      'ATK',
      '神速射撃',
      C.mvp('world',1),
      P(200,400,0,400),
      [
        E('CT_FLAT_REDUCTION',{
          target:'shorterAttackSkill',
          seconds:0.40
        })
      ],
      '基本CTが短い方の攻撃スキルCT-0.40秒。'
    ),

    L(
      'AR03',
      'redGold',
      'ATK',
      '世界弾道',
      C.wins('world',1),
      P(300,300,0,500),
      [
        E('HIT_RATE_POINTS',{
          target:'attackSkills',
          points:8
        }),
        E('DAMAGE_MODIFIER',{
          target:'attackSkills',
          rate:0.04
        })
      ],
      '攻撃スキルの命中率+8pt、与ダメージ+4％。'
    ),

    L(
      'AR04',
      'redGold',
      'ATK',
      '終幕破砕',
      C.mvp('world',3),
      P(450,300,150,300),
      [
        E('DAMAGE_MODIFIER',{
          condition:'oneEnemyAlive',
          rate:0.10
        }),
        E('IGNORE_DAMAGE_REDUCTION',{
          condition:'oneEnemyAlive',
          rate:0.04
        })
      ],
      '敵の生存者が残り1人の時、与ダメージ+10％、軽減を4％分無視。'
    ),

    L(
      'AR05',
      'redGold',
      'ATK',
      '伝説砲手',
      C.all(
        C.champWins(1),
        C.kp(1000)
      ),
      P(450,400,0,450),
      [
        E('DAMAGE_MODIFIER',{
          target:'attackSkills',
          rate:0.03
        }),
        E('IGNORE_DAMAGE_REDUCTION',{
          rate:0.08
        })
      ],
      '攻撃スキルの与ダメージ+3％。敵の軽減を8％分無視。'
    )
  ];

  const SUP_RED=[
    L(
      'SR01',
      'redGold',
      'SUP',
      '世界救護',
      C.all(
        C.top5('world',3),
        C.ap(600)
      ),
      P(150,400,400,0),
      [
        E('HEAL_RATE_POINTS',{
          target:'allHeals',
          points:4
        })
      ],
      '自身が行う全回復量+4pt。'
    ),

    L(
      'SR02',
      'redGold',
      'SUP',
      '神速治療',
      C.mvp('world',1),
      P(150,450,400,0),
      [
        E('CT_FLAT_REDUCTION',{
          skillId:'sup_drone_heal',
          seconds:0.45
        })
      ],
      'ドローンヒールの基本CT-0.45秒。'
    ),

    L(
      'SR03',
      'redGold',
      'SUP',
      '世界蘇生',
      C.wins('world',1),
      P(200,450,450,0),
      [
        E('REVIVE_HP_BASE',{
          skillId:'sup_respawn_field',
          rate:0.35
        })
      ],
      'リスポーンフィールドの基本復活HPを35％へ変更。追加効果は後から加算。'
    ),

    L(
      'SR04',
      'redGold',
      'SUP',
      '全域救命',
      C.mvp('world',3),
      P(200,500,500,0),
      [
        E('HEAL_RATE_POINTS',{
          skillId:'sup_drone_heal',
          points:3
        }),
        E('REVIVE_PROTECTION',{
          durationSeconds:4,
          damageReductionRate:0.10,
          source:'supRevive'
        })
      ],
      'ドローンヒールの回復量+3pt。復活した味方が4秒間、被ダメージ-10％。'
    ),

    L(
      'SR05',
      'redGold',
      'SUP',
      '伝説支援',
      C.all(
        C.champWins(1),
        C.ap(1200)
      ),
      P(200,550,550,0),
      [
        E('REVIVE_HP_BASE',{
          skillId:'sup_respawn_field',
          rate:0.40
        }),
        E('CT_FLAT_REDUCTION',{
          target:[
            'sup_drone_heal',
            'sup_respawn_field'
          ],
          seconds:0.35
        })
      ],
      '基本復活HPを40％へ変更。回復・復活スキルの基本CT-0.35秒。'
    )
  ];

  const ROLE_BLUE={
    IGL:IGL_BLUE,
    ATK:ATK_BLUE,
    SUP:SUP_BLUE
  };

  const ROLE_GOLD={
    IGL:IGL_GOLD,
    ATK:ATK_GOLD,
    SUP:SUP_GOLD
  };

  const ROLE_RED={
    IGL:IGL_RED,
    ATK:ATK_RED,
    SUP:SUP_RED
  };

  const BLUE_BY_ID={};
  const LOCKED_BY_ID={};

  [
    ...COMMON_BLUE,
    ...IGL_BLUE,
    ...ATK_BLUE,
    ...SUP_BLUE
  ].forEach((ability)=>{
    BLUE_BY_ID[ability.id]=ability;
  });

  [
    ...COMMON_GOLD,
    ...IGL_GOLD,
    ...ATK_GOLD,
    ...SUP_GOLD,
    ...COMMON_RED,
    ...IGL_RED,
    ...ATK_RED,
    ...SUP_RED
  ].forEach((ability)=>{
    LOCKED_BY_ID[ability.id]=ability;
  });

  const STAT_TIERS=[
    'F',
    'E',
    'D',
    'C',
    'B',
    'A',
    'S',
    'SS'
  ];

  function statRatio(value){
    if(typeof value==='number'){
      return value<=1
        ? clamp(value,0,1)
        : clamp(value/100,0,1);
    }

    const text=String(value||'')
      .trim()
      .toUpperCase();

    if(text==='MOB'){
      return 1;
    }

    const match=text.match(
      /^(SS|S|A|B|C|D|E|F)(10|[1-9])$/
    );

    if(!match){
      return 0;
    }

    const ordinal=
      (STAT_TIERS.indexOf(match[1])*10)+
      (Number(match[2])-1);

    return clamp(
      ordinal/79,
      0,
      1
    );
  }
  function calculateShieldCharge(role,stats={}){
    const normalizedRole=normalizeRole(role);

    const baseCt=
      SHIELD_CHARGE
        .baseCtByRole[normalizedRole];

    const agilityReduction=
      statRatio(stats.agility)*
      SHIELD_CHARGE.agilityCtReductionMax;

    const supportBonus=
      statRatio(stats.support)*
      SHIELD_CHARGE.supportHealBonusMax;

    return {
      baseCt,

      agilityReductionRate:
        agilityReduction,

      actualCt:Number(
        (
          baseCt*
          (1-agilityReduction)
        ).toFixed(2)
      ),

      baseHealRate:
        SHIELD_CHARGE.baseHealRate,

      supportBonusRate:
        supportBonus,

      actualHealRate:Number(
        clamp(
          SHIELD_CHARGE.baseHealRate+
          supportBonus,

          SHIELD_CHARGE.baseHealRate,
          SHIELD_CHARGE.maximumHealRate
        ).toFixed(4)
      ),

      activationThreshold:
        SHIELD_CHARGE.activationThreshold
    };
  }

  function calculateSkillRuntime(
    skill,
    role,
    stats={}
  ){
    const runtime=clone(skill);
    runtime.actualCt=skill.baseCt;

    if(skill.id===SHIELD_CHARGE.id){
      const shield=
        calculateShieldCharge(
          role,
          stats
        );

      runtime.baseCt=shield.baseCt;
      runtime.actualCt=shield.actualCt;
      runtime.actualHealRate=
        shield.actualHealRate;
      runtime.runtime=shield;

      return runtime;
    }

    if(skill.id==='igl_hot_call'){
      const ratio=
        (
          statRatio(stats.mind)+
          statRatio(stats.support)
        )/2;

      runtime.runtime={
        aimBuff:
          2+
          Math.floor(ratio*3),

        mindBuff:
          2+
          Math.floor(ratio*3),

        durationSeconds:Number(
          (
            4+
            (ratio*2)
          ).toFixed(2)
        )
      };
    }

    if(skill.id==='igl_precise_strike'){
      runtime.runtime={
        damageMultiplier:Number(
          (
            1.55+
            (
              statRatio(stats.technique)*
              0.25
            )+
            (
              statRatio(stats.mind)*
              0.10
            )
          ).toFixed(3)
        ),

        unavoidable:true
      };
    }

    if(skill.id==='atk_smoke_launcher'){
      const controlRatio=
        (
          statRatio(stats.mind)+
          statRatio(stats.technique)
        )/2;

      runtime.runtime={
        damageMultiplier:Number(
          (
            0.75+
            (
              statRatio(stats.technique)*
              0.25
            )
          ).toFixed(3)
        ),

        debuffChance:Number(
          clamp(
            0.45+
            (controlRatio*0.30),

            0.45,
            0.75
          ).toFixed(4)
        ),

        hitRateDebuffPoints:10,
        durationSeconds:4
      };
    }

    if(skill.id==='atk_ace_strike'){
      runtime.runtime={
        damageMultiplier:Number(
          (
            1.35+
            (
              statRatio(stats.technique)*
              0.30
            )+
            (
              statRatio(stats.physical)*
              0.15
            )
          ).toFixed(3)
        ),

        avoidable:true
      };
    }

    if(skill.id==='sup_drone_heal'){
      runtime.runtime={
        healRate:Number(
          clamp(
            0.08+
            (
              statRatio(stats.support)*
              0.07
            ),

            0.08,
            0.15
          ).toFixed(4)
        ),

        activationThreshold:0.85
      };
    }

    if(skill.id==='sup_respawn_field'){
      runtime.runtime={
        reviveHpRate:0.30,
        waitAtFullCtWhenNoTarget:true
      };
    }

    return runtime;
  }

  function getPlayerSkills(role,stats={}){
    const normalizedRole=
      normalizeRole(role);

    return [
      ...PLAYER_SKILLS[normalizedRole],
      {
        ...SHIELD_CHARGE,
        role:normalizedRole
      }
    ].map((skill)=>{
      return calculateSkillRuntime(
        skill,
        normalizedRole,
        stats
      );
    });
  }

  function createPlayerAbilityState(role){
    return {
      role:normalizeRole(role),
      blue:{},
      gold:[],
      red:[]
    };
  }

  function normalizePlayerAbilityState(
    state,
    role
  ){
    const normalized=
      createPlayerAbilityState(
        role||state?.role
      );

    if(
      state?.blue&&
      typeof state.blue==='object'
    ){
      Object.entries(
        state.blue
      ).forEach(([id,stage])=>{
        if(BLUE_BY_ID[id]){
          normalized.blue[id]=
            Math.floor(
              clamp(
                stage,
                0,
                2
              )
            );
        }
      });
    }

    if(Array.isArray(state?.gold)){
      normalized.gold=[
        ...new Set(
          state.gold.filter((id)=>{
            return (
              LOCKED_BY_ID[id]?.frame===
              'gold'
            );
          })
        )
      ];
    }

    if(Array.isArray(state?.red)){
      normalized.red=[
        ...new Set(
          state.red.filter((id)=>{
            return (
              LOCKED_BY_ID[id]?.frame===
              'redGold'
            );
          })
        )
      ];
    }

    return normalized;
  }

  function getBlueStage(state,id){
    return Math.floor(
      clamp(
        state?.blue?.[id]||0,
        0,
        2
      )
    );
  }

  function getBlueNextDefinition(
    state,
    id
  ){
    const ability=BLUE_BY_ID[id];

    if(!ability){
      return null;
    }

    const stage=
      getBlueStage(state,id);

    if(stage>=2){
      return null;
    }

    return stage===0
      ? ability.base
      : ability.advanced;
  }

  function getAbilityById(id){
    return (
      BLUE_BY_ID[id]||
      LOCKED_BY_ID[id]||
      null
    );
  }

  function getAvailableBlue(role){
    const normalizedRole=
      normalizeRole(role);

    return [
      ...COMMON_BLUE,
      ...ROLE_BLUE[normalizedRole]
    ].map(clone);
  }

  function getAvailableGold(role){
    const normalizedRole=
      normalizeRole(role);

    return [
      ...COMMON_GOLD,
      ...ROLE_GOLD[normalizedRole]
    ].map(clone);
  }

  function getAvailableRed(role){
    const normalizedRole=
      normalizeRole(role);

    return [
      ...COMMON_RED,
      ...ROLE_RED[normalizedRole]
    ].map(clone);
  }

  function normalizePoints(points){
    return Object.fromEntries(
      POINT_KEYS.map((key)=>[
        key,
        Math.max(
          0,
          Math.floor(
            Number(points?.[key])||0
          )
        )
      ])
    );
  }

  function canAfford(
    points,
    abilityCost
  ){
    const owned=
      normalizePoints(points);

    return POINT_KEYS.every((key)=>{
      return (
        owned[key]>=
        (abilityCost?.[key]||0)
      );
    });
  }

  function subtractCost(
    points,
    abilityCost
  ){
    if(
      !canAfford(
        points,
        abilityCost
      )
    ){
      return null;
    }

    const result=
      normalizePoints(points);

    POINT_KEYS.forEach((key)=>{
      result[key]-=
        abilityCost?.[key]||0;
    });

    return result;
  }

  function getPlayerCareer(context){
    if(context?.playerCareer){
      return context.playerCareer;
    }

    const state=
      context?.state||
      context;

    const playerId=
      context?.playerId||
      state?.ui?.selectedPlayerId;

    return readPath(
      state,
      `records.playerCareer.${playerId}`,
      {}
    );
  }

  function getCompanyTournamentStats(
    context
  ){
    const state=
      context?.state||
      context;

    return readPath(
      state,
      'records.companyTournamentStats',
      {}
    );
  }

  function getCollectionKindCount(
    context,
    type
  ){
    const state=
      context?.state||
      context;

    const direct=
      readPath(
        state,
        `collection.${type}Kinds`,
        null
      );

    if(direct!=null){
      return Number(direct)||0;
    }

    const collection=
      readPath(
        state,
        `collection.${type}`,
        {}
      );

    return Object.values(
      collection||{}
    ).filter((entry)=>{
      return (
        entry&&
        entry.owned!==false
      );
    }).length;
  }

  function conditionCurrentValue(
    condition,
    context
  ){
    const career=
      getPlayerCareer(context);

    const company=
      getCompanyTournamentStats(context);

    switch(condition.type){
      case 'playerDamage':
        return Number(
          career.damage||
          career.totalDamage||
          0
        );

      case 'playerKp':
        return Number(
          career.kp||
          career.killPoints||
          0
        );

      case 'playerAp':
        return Number(
          career.ap||
          career.assistPoints||
          0
        );

      case 'playerTraining':
        return Number(
          career.trainingCount||
          career.trainings||
          0
        );

      case 'playerMvp':
        return Number(
          readPath(
            career,
            `mvp.${condition.tier}`,
            readPath(
              career,
              `tournaments.${condition.tier}.mvp`,
              0
            )
          )
        );

      case 'companyTop5':
        return Number(
          readPath(
            company,
            `${condition.tier}.top5`,
            0
          )
        );

      case 'companyWins':
        return Number(
          readPath(
            company,
            `${condition.tier}.wins`,
            0
          )
        );

      case 'championshipWins':
        return Number(
          readPath(
            company,
            'championship.wins',
            0
          )
        );

      case 'cardKinds':
        return getCollectionKindCount(
          context,
          'cards'
        );

      case 'badgeKinds':
        return getCollectionKindCount(
          context,
          'badges'
        );

      default:
        return 0;
    }
  }

  function evaluateCondition(
    condition,
    context
  ){
    if(!condition){
      return {
        unlocked:true,
        current:1,
        required:1,
        details:[]
      };
    }

    if(condition.type==='all'){
      const details=
        condition.conditions.map(
          (child)=>{
            return evaluateCondition(
              child,
              context
            );
          }
        );

      return {
        unlocked:
          details.every((entry)=>{
            return entry.unlocked;
          }),

        current:
          details.filter((entry)=>{
            return entry.unlocked;
          }).length,

        required:details.length,
        details
      };
    }

    const current=
      conditionCurrentValue(
        condition,
        context
      );

    return {
      unlocked:
        current>=condition.value,

      current,
      required:condition.value,
      condition:clone(condition),
      details:[]
    };
  }

  function capitalizeTier(tier){
    const value=
      String(tier||'');

    return value
      ? (
          value.charAt(0).toUpperCase()+
          value.slice(1)
        )
      : '';
  }

  function conditionLabel(condition){
    if(!condition){
      return '条件なし';
    }

    if(condition.type==='all'){
      return condition.conditions
        .map(conditionLabel)
        .join('／');
    }

    const labels={
      playerDamage:
        `累計ダメージ${
          Number(
            condition.value
          ).toLocaleString('ja-JP')
        }`,

      playerKp:
        `累計KP${condition.value}`,

      playerAp:
        `累計AP${condition.value}`,

      playerTraining:
        `トレーニング${condition.value}回`,

      playerMvp:
        `${
          capitalizeTier(condition.tier)
        } MVP${condition.value}回`,

      companyTop5:
        `${
          capitalizeTier(condition.tier)
        } Top5 ${condition.value}回`,

      companyWins:
        `${
          capitalizeTier(condition.tier)
        }優勝${condition.value}回`,

      championshipWins:
        `Championship優勝${condition.value}回`,

      cardKinds:
        `カード${condition.value}種類`,

      badgeKinds:
        `バッジ${condition.value}種類`
    };

    return (
      labels[condition.type]||
      condition.type
    );
  }
  function canLearnBlue(
    playerAbilityState,
    abilityId,
    points
  ){
    const ability=
      BLUE_BY_ID[abilityId];

    if(!ability){
      return {
        ok:false,
        reason:'能力が見つかりません。'
      };
    }

    const next=
      getBlueNextDefinition(
        playerAbilityState,
        abilityId
      );

    if(!next){
      return {
        ok:false,
        reason:'すでに上位段階まで習得済みです。'
      };
    }

    if(
      !canAfford(
        points,
        next.cost
      )
    ){
      return {
        ok:false,
        reason:'能力ポイントが不足しています。'
      };
    }

    return {
      ok:true,
      ability,
      next,
      cost:clone(next.cost)
    };
  }

  function canLearnLocked(
    playerAbilityState,
    abilityId,
    points,
    context
  ){
    const ability=
      LOCKED_BY_ID[abilityId];

    if(!ability){
      return {
        ok:false,
        reason:'能力が見つかりません。'
      };
    }

    const ownedList=
      ability.frame==='gold'
        ? playerAbilityState.gold
        : playerAbilityState.red;

    if(
      ownedList.includes(abilityId)
    ){
      return {
        ok:false,
        reason:'すでに習得済みです。'
      };
    }

    const unlock=
      evaluateCondition(
        ability.unlock,
        context
      );

    if(!unlock.unlocked){
      return {
        ok:false,
        reason:'解除条件を満たしていません。',
        unlock
      };
    }

    if(
      !canAfford(
        points,
        ability.cost
      )
    ){
      return {
        ok:false,
        reason:'能力ポイントが不足しています。',
        unlock
      };
    }

    return {
      ok:true,
      ability,
      unlock,
      cost:clone(ability.cost)
    };
  }

  function learnBlue(
    playerAbilityState,
    abilityId,
    points
  ){
    const state=
      normalizePlayerAbilityState(
        playerAbilityState,
        playerAbilityState?.role
      );

    const check=
      canLearnBlue(
        state,
        abilityId,
        points
      );

    if(!check.ok){
      return {
        ok:false,
        reason:check.reason,
        state,
        points:normalizePoints(points)
      };
    }

    const nextStage=
      getBlueStage(
        state,
        abilityId
      )+1;

    state.blue[abilityId]=
      nextStage;

    return {
      ok:true,
      state,

      points:
        subtractCost(
          points,
          check.cost
        ),

      learned:{
        id:abilityId,
        stage:nextStage,

        name:
          nextStage===1
            ? check.ability.base.name
            : check.ability.advanced.name,

        frame:'blue'
      }
    };
  }

  function learnLocked(
    playerAbilityState,
    abilityId,
    points,
    context
  ){
    const state=
      normalizePlayerAbilityState(
        playerAbilityState,
        playerAbilityState?.role
      );

    const check=
      canLearnLocked(
        state,
        abilityId,
        points,
        context
      );

    if(!check.ok){
      return {
        ok:false,
        reason:check.reason,
        unlock:check.unlock,
        state,
        points:normalizePoints(points)
      };
    }

    if(check.ability.frame==='gold'){
      state.gold.push(abilityId);
    }else{
      state.red.push(abilityId);
    }

    return {
      ok:true,
      state,

      points:
        subtractCost(
          points,
          check.cost
        ),

      learned:{
        id:abilityId,
        stage:1,
        name:check.ability.name,
        frame:check.ability.frame
      }
    };
  }

  function compileActiveAbilities(
    playerAbilityState,
    role
  ){
    const normalizedRole=
      normalizeRole(
        role||
        playerAbilityState?.role
      );

    const state=
      normalizePlayerAbilityState(
        playerAbilityState,
        normalizedRole
      );

    const active=[];

    Object.entries(
      state.blue
    ).forEach(([id,stage])=>{
      const ability=
        BLUE_BY_ID[id];

      if(
        !ability||
        stage<=0||
        (
          ability.role!=='COMMON'&&
          ability.role!==normalizedRole
        )
      ){
        return;
      }

      const definition=
        stage>=2
          ? ability.advanced
          : ability.base;

      active.push({
        id,
        frame:'blue',
        stage:stage>=2?2:1,
        role:ability.role,
        name:definition.name,
        description:
          definition.description,
        effects:
          clone(definition.effects)
      });
    });

    state.gold.forEach((id)=>{
      const ability=
        LOCKED_BY_ID[id];

      if(
        !ability||
        ability.frame!=='gold'||
        (
          ability.role!=='COMMON'&&
          ability.role!==normalizedRole
        )
      ){
        return;
      }

      active.push({
        id,
        frame:'gold',
        stage:1,
        role:ability.role,
        name:ability.name,
        description:
          ability.description,
        effects:
          clone(ability.effects)
      });
    });

    state.red.forEach((id)=>{
      const ability=
        LOCKED_BY_ID[id];

      if(
        !ability||
        ability.frame!=='redGold'||
        (
          ability.role!=='COMMON'&&
          ability.role!==normalizedRole
        )
      ){
        return;
      }

      active.push({
        id,
        frame:'redGold',
        stage:1,
        role:ability.role,
        name:ability.name,
        description:
          ability.description,
        effects:
          clone(ability.effects)
      });
    });

    return active;
  }

  function createBattleAbilityPayload(
    player,
    role
  ){
    const normalizedRole=
      normalizeRole(
        role||
        player?.role
      );

    return {
      role:normalizedRole,

      skills:
        getPlayerSkills(
          normalizedRole,
          player?.stats||{}
        ),

      specialAbilityState:
        normalizePlayerAbilityState(
          player?.specialAbilities,
          normalizedRole
        ),

      activeSpecialAbilities:
        compileActiveAbilities(
          player?.specialAbilities,
          normalizedRole
        ),

      rules:{
        ultimateEnabled:false,
        skillCount:3,
        automaticActivationByCt:true,
        ctCarriesAcrossBattlesInTournament:true,
        ctPausesWhileDown:true
      }
    };
  }

  function validateAbilityData(){
    const actual=[
      COMMON_BLUE.length,
      IGL_BLUE.length,
      ATK_BLUE.length,
      SUP_BLUE.length,

      COMMON_GOLD.length,
      IGL_GOLD.length,
      ATK_GOLD.length,
      SUP_GOLD.length,

      COMMON_RED.length,
      IGL_RED.length,
      ATK_RED.length,
      SUP_RED.length
    ];

    const expected=[
      20,
      10,
      10,
      10,

      5,
      10,
      10,
      10,

      5,
      5,
      5,
      5
    ];

    if(
      actual.some(
        (value,index)=>{
          return (
            value!==
            expected[index]
          );
        }
      )
    ){
      throw new Error(
        '特殊能力件数が不正です。'
      );
    }

    const ids=[
      ...Object.keys(BLUE_BY_ID),
      ...Object.keys(LOCKED_BY_ID)
    ];

    if(
      new Set(ids).size!==
      ids.length
    ){
      throw new Error(
        '特殊能力IDが重複しています。'
      );
    }

    return true;
  }

  validateAbilityData();

  const ABILITY_DATA=
    freeze({
      version:'1.0.0',

      effectCodes:
        EFFECT_CODES,

      playerSkills:
        PLAYER_SKILLS,

      shieldCharge:
        SHIELD_CHARGE,

      blue:{
        common:
          COMMON_BLUE,

        role:
          ROLE_BLUE
      },

      gold:{
        common:
          COMMON_GOLD,

        role:
          ROLE_GOLD
      },

      redGold:{
        common:
          COMMON_RED,

        role:
          ROLE_RED
      },

      counts:{
        blueStagesTotal:100,
        goldTotal:35,
        redGoldTotal:20
      }
    });

  const ABILITY_API=
    Object.freeze({
      normalizeRole,
      statRatio,

      calculateShieldCharge,
      calculateSkillRuntime,
      getPlayerSkills,

      createPlayerAbilityState,
      normalizePlayerAbilityState,

      getBlueStage,
      getBlueNextDefinition,
      getAbilityById,

      getAvailableBlue,
      getAvailableGold,
      getAvailableRed,

      normalizePoints,
      canAfford,
      subtractCost,

      evaluateCondition,
      conditionLabel,

      canLearnBlue,
      canLearnLocked,
      learnBlue,
      learnLocked,

      compileActiveAbilities,
      createBattleAbilityPayload,

      validateAbilityData
    });

  MOBBR.DATA.ability=
    ABILITY_DATA;

  MOBBR.API.ability=
    ABILITY_API;

  global.MOBBR_ABILITY_DATA=
    ABILITY_DATA;

  global.MOBBR_ABILITY_API=
    ABILITY_API;
})(
  typeof window!=='undefined'
    ? window
    : globalThis
);
