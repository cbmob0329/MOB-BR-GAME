/**
 * MOB BR battle commentary director.
 *
 * Commentary is generated from battle-event tags rather than displayed as a
 * raw combat log. Priority and suppression windows prevent minor events from
 * replacing confirmed-kill, revive, down, and result commentary.
 */

export const COMMENTARY_VERSION = "mobbr-commentary-1.3.0";
export const COMMENTATOR = Object.freeze({
  id: "mob-mic",
  name: "モブマイク",
  image: "icon/mic.png",
});

export const COMMENTARY_PRIORITIES = Object.freeze({
  tournamentChampion: 120,
  battleResult: 110,
  confirmedKill: 100,
  revive: 90,
  down: 80,
  uniqueSkill: 75,
  skill: 70,
  largeDamage: 60,
  reversal: 55,
  critical: 52,
  remainingTeams: 50,
  heal: 42,
  reload: 28,
  distance: 26,
  normalHit: 20,
  miss: 10,
  battleStart: 45,
  barrage: 48,
  movement: 32,
  postReviveRecovery: 94,
});

export const COMMENTARY_PRESENTATION = Object.freeze({
  repeatedTextCooldownSeconds: 0.85,
  defaultSuppressDuration: 0.16,
  highPrioritySuppressDuration: 0.62,
  resultSuppressDuration: 2,
  largeDamageHpRate: 0.2,
});

const TEMPLATES = Object.freeze({
  underdog_momentum: Object.freeze([
    "格上相手ですが、{leftTeamName}に勝負の流れが来ています！",
    "番狂わせの気配！{leftTeamName}が一気に集中力を上げました！",
    "10%の勝機をつかめるか！{leftTeamName}が食らいつきます！",
  ]),
  assist: Object.freeze([
    "連携が決まりました！アシストポイント獲得です！",
    "味方の援護が効いています！見事なアシスト！",
    "単独ではありません。チームで仕留めにかかります！",
  ]),
  reload_complete: Object.freeze([
    "{actorName}、装填完了！再び射撃へ入ります！",
    "8発を補充！{actorName}が攻撃を再開します！",
    "リロード完了、次の射線を狙います！",
  ]),
  battle_start: Object.freeze([
    "{leftTeamName}対{rightTeamName}、戦闘開始です！",
    "両チームが接敵！10秒間の自動戦闘が始まります！",
    "{leftTeamName}と{rightTeamName}、一気に動き出しました！",
  ]),
  normal_hit: Object.freeze([
    "{actorName}の射撃が{targetName}に命中！",
    "{weaponName}が火を噴く！{actorName}が当てました！",
    "{actorName}、正確な射撃です！",
  ]),
  large_damage: Object.freeze([
    "{actorName}が大ダメージ！{damage}を奪いました！",
    "{targetName}に強烈な一撃！ダメージ{damage}！",
    "{weaponName}の一撃が深く刺さりました！",
  ]),
  critical: Object.freeze([
    "クリティカル！{actorName}の会心の一撃です！",
    "{actorName}が急所を捉えました！",
    "鋭い一撃！{targetName}へクリティカル！",
  ]),
  miss: Object.freeze([
    "{actorName}の射撃は外れました！",
    "{targetName}が射線を外しました！",
    "惜しい！{actorName}の弾は届きません！",
  ]),
  close_range: Object.freeze([
    "{actorName}が近距離へ突入！",
    "{actorName}、一気に間合いを詰めます！",
    "近距離戦へ！{actorName}が前へ出ました！",
  ]),
  far_range: Object.freeze([
    "{actorName}が遠距離を確保！",
    "{actorName}、遠距離から制圧を狙います！",
    "射線を広く取った{actorName}！",
  ]),
  reload: Object.freeze([
    "{actorName}がリロードに入ります！",
    "{weaponName}の弾切れ！装填を急ぎます！",
    "{actorName}、次の8発を準備します！",
  ]),
  skill: Object.freeze([
    "{actorName}が「{skillName}」を発動！",
    "スキル発動！{actorName}の{skillName}！",
    "{actorName}が勝負のスキルを切りました！",
  ]),
  area_skill: Object.freeze([
    "{actorName}の全体攻撃「{skillName}」！",
    "{skillName}が敵チーム全体を襲います！",
    "広範囲スキル！{actorName}が一気に攻めます！",
  ]),
  buff: Object.freeze([
    "{actorName}が味方を強化！{skillName}です！",
    "{skillName}でチーム全体を押し上げます！",
    "{actorName}の指揮が味方へ届きました！",
  ]),
  heal: Object.freeze([
    "{actorName}が回復！合計{healing}HPを戻します！",
    "{skillName}で味方のHPを立て直します！",
    "支援が入りました！{actorName}の回復です！",
  ]),
  down: Object.freeze([
    "{targetName}がダウン！まだ確キルではありません！",
    "{actorName}が{targetName}をダウンさせました！",
    "{targetTeamName}にダウン発生！救援が必要です！",
  ]),
  confirmed_kill: Object.freeze([
    "確キル！{actorName}がKPを獲得しました！",
    "{targetName}を確キル！{actorTeamName}にKPです！",
    "{weaponName}で確キル成立！KP獲得！",
  ]),
  squad_wipe: Object.freeze([
    "部隊全滅！倒し切った3人分、3KPが確定します！",
    "完璧なワイプ！最後のダウンまで含めて3キル獲得です！",
  ]),
  mutual_disengage: Object.freeze([
    "初動は決着せず！両チームとも消耗を抑えて引く判断です！",
    "全滅には至らず、お互いに仕切り直しを選択しました！",
  ]),
  burst_fire: Object.freeze([
    "{actorName}が{burstCount}連射！弾幕で{targetName}を押さえ込みます！",
    "銃声が止まりません！{actorName}のバースト射撃です！",
    "{weaponName}から弾丸が一気に飛び出します！",
  ]),
  combat_strafe: Object.freeze([
    "{actorName}が射線をずらしながら撃ち続けます！",
    "止まらない！{actorName}がストレイフで角度を変えます！",
  ]),
  evasive_dodge: Object.freeze([
    "{actorName}が紙一重で弾道を外しました！",
    "高速回避！{actorName}が射線から抜けます！",
  ]),
  post_revive_recovery: Object.freeze([
    "{actorName}が復帰直後にスキル3！HPを立て直します！",
    "戦線復帰から即リカバリー！{actorName}が戻ってきました！",
  ]),

  revive: Object.freeze([
    "{actorName}が{targetName}を復活させました！",
    "リスポーン成功！{targetName}が戦線復帰！",
    "{skillName}でダウン状態から復活です！",
  ]),
  battle_victory: Object.freeze([
    "VICTORY！{winnerTeamName}が戦闘を制しました！",
    "{winnerTeamName}の勝利！見事な戦いでした！",
    "決着！勝者は{winnerTeamName}です！",
  ]),
  battle_defeat: Object.freeze([
    "DEFEAT。{winnerTeamName}がこの戦闘を制しました。",
    "{winnerTeamName}が勝利。次の展開に注目です。",
    "戦闘終了！{winnerTeamName}に軍配が上がりました。",
  ]),
  battle_draw: Object.freeze([
    "DRAW！両チーム譲りませんでした！",
    "時間切れでドロー！次のルールへ進みます！",
    "決着つかず！両チーム生存のまま終了です！",
  ]),
  time_limit: Object.freeze([
    "10秒経過！時間切れ判定に入ります！",
    "タイムアップ！戦闘内容から勝者を決定します！",
    "制限時間終了！判定結果に注目です！",
  ]),
});

function hashText(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function fillTemplate(template, variables) {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key) => {
    const value = variables[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function participantMap(runtime) {
  return new Map(
    runtime.teams.flatMap((team) =>
      team.members.map((member) => [
        member.playerId,
        {
          ...member,
          teamId: team.teamId,
          teamName: team.teamName,
        },
      ]),
    ),
  );
}

function teamMap(runtime) {
  return new Map(
    runtime.teams.map((team) => [team.teamId, team]),
  );
}

export function createCommentaryContext(runtime) {
  if (!runtime || typeof runtime !== "object") {
    throw new TypeError("Tournament runtime must be an object.");
  }
  return Object.freeze({
    playerTeamId: runtime.playerTeamId,
    participants: participantMap(runtime),
    teams: teamMap(runtime),
    tournamentName: runtime.entryData.tournament.tournamentName,
    match: runtime.match,
    round: runtime.round,
  });
}

function eventVariables(event, context) {
  const actor = context.participants.get(event.actorPlayerId);
  const target = context.participants.get(event.targetPlayerId);
  const actorTeam =
    context.teams.get(event.actorTeamId ?? actor?.teamId);
  const targetTeam =
    context.teams.get(event.targetTeamId ?? target?.teamId);
  const winnerTeam = context.teams.get(event.winnerTeamId);

  return {
    actorName: actor?.name ?? "選手",
    targetName: target?.name ?? "相手選手",
    actorTeamName: actorTeam?.teamName ?? "攻撃側",
    targetTeamName: targetTeam?.teamName ?? "防御側",
    leftTeamName:
      context.teams.get(event.leftTeamId)?.teamName ?? "左チーム",
    rightTeamName:
      context.teams.get(event.rightTeamId)?.teamName ?? "右チーム",
    winnerTeamName: winnerTeam?.teamName ?? "勝利チーム",
    weaponName:
      event.weaponName ??
      event.sourceName ??
      actor?.weapon?.weaponName ??
      "武器",
    skillName:
      event.skillName ??
      event.sourceName ??
      "スキル",
    damage: event.damage ?? 0,
    burstCount: event.burstCount ?? 0,
    healing:
      event.totalHealing ??
      event.amount ??
      0,
    hp: event.hp ?? event.currentHp ?? 0,
    kp: event.kp ?? 0,
  };
}

function commentaryDefinition(event, context) {
  const variables = eventVariables(event, context);
  const target = context.participants.get(event.targetPlayerId);
  const targetMaxHp = target?.maxHp ?? 1;
  const damageRate =
    Number(event.damage ?? 0) / Math.max(1, targetMaxHp);

  switch (event.type) {
    case "underdog_momentum":
      return {
        category: "underdog_momentum",
        priority: COMMENTARY_PRIORITIES.reversal,
        tags: ["underdog", "reversal"],
      };
    case "battle_start":
      return {
        category: "battle_start",
        priority: COMMENTARY_PRIORITIES.battleStart,
        tags: ["battle_start", "featured_match"],
      };
    case "burst_fire_start":
      return {
        category: "burst_fire",
        priority: COMMENTARY_PRIORITIES.barrage,
        tags: ["weapon", "burst", "crossfire"],
      };
    case "combat_strafe":
      return {
        category: "combat_strafe",
        priority: COMMENTARY_PRIORITIES.movement,
        tags: ["movement", "strafe"],
      };
    case "evasive_dodge":
      return {
        category: "evasive_dodge",
        priority: COMMENTARY_PRIORITIES.movement,
        tags: ["movement", "dodge"],
      };
    case "post_revive_recovery":
      return {
        category: "post_revive_recovery",
        priority: COMMENTARY_PRIORITIES.postReviveRecovery,
        tags: ["revive", "skill3", "recovery"],
      };
    case "normal_attack_hit":
      if (event.critical === true) {
        return {
          category: "critical",
          priority: COMMENTARY_PRIORITIES.critical,
          tags: ["normal_hit", "critical"],
        };
      }
      if (damageRate >= COMMENTARY_PRESENTATION.largeDamageHpRate) {
        return {
          category: "large_damage",
          priority: COMMENTARY_PRIORITIES.largeDamage,
          tags: ["normal_hit", "large_damage"],
        };
      }
      return {
        category: "normal_hit",
        priority: COMMENTARY_PRIORITIES.normalHit,
        tags: ["normal_hit"],
      };
    case "normal_attack_miss":
      return {
        category: "miss",
        priority: COMMENTARY_PRIORITIES.miss,
        tags: ["miss"],
      };
    case "distance_changed":
      if (event.currentDistance === "close") {
        return {
          category: "close_range",
          priority: COMMENTARY_PRIORITIES.distance,
          tags: ["distance", "close"],
        };
      }
      if (event.currentDistance === "far") {
        return {
          category: "far_range",
          priority: COMMENTARY_PRIORITIES.distance,
          tags: ["distance", "far"],
        };
      }
      return null;
    case "reload_complete":
      return {
        category: "reload_complete",
        priority: COMMENTARY_PRIORITIES.reload,
        tags: ["reload", "complete"],
      };
    case "assist":
      return {
        category: "assist",
        priority: COMMENTARY_PRIORITIES.heal,
        tags: ["assist", "teamplay"],
      };
    case "reload_start":
      return {
        category: "reload",
        priority: COMMENTARY_PRIORITIES.reload,
        tags: ["reload"],
      };
    case "skill_area_attack":
    case "skill_area_debuff":
      return {
        category: "area_skill",
        priority: COMMENTARY_PRIORITIES.skill,
        tags: ["skill", "area_attack"],
      };
    case "skill_buff":
      return {
        category: "buff",
        priority: COMMENTARY_PRIORITIES.skill,
        tags: ["skill", "buff"],
      };
    case "skill_heal":
    case "skill_team_heal":
      return {
        category: "heal",
        priority: COMMENTARY_PRIORITIES.heal,
        tags: ["skill", "heal"],
      };
    case "skill_revive":
      return {
        category: "revive",
        priority: COMMENTARY_PRIORITIES.revive,
        tags: ["skill", "revive"],
      };
    case "skill_attack_hit":
    case "skill_attack_miss":
      return {
        category: "skill",
        priority: COMMENTARY_PRIORITIES.skill,
        tags: [
          "skill",
          event.type.endsWith("_hit") ? "hit" : "miss",
        ],
      };
    case "down":
      return {
        category: "down",
        priority: COMMENTARY_PRIORITIES.down,
        tags: ["down"],
      };
    case "confirmed_kill":
      return {
        category: "confirmed_kill",
        priority: COMMENTARY_PRIORITIES.confirmedKill,
        tags: ["confirmed_kill", "kp"],
      };
    case "squad_wipe":
      return {
        category: "squad_wipe",
        priority: 100,
        tags: ["squad_wipe", "kp"],
        variables: {},
      };
    case "mutual_disengage":
      return {
        category: "mutual_disengage",
        priority: 78,
        tags: ["opening", "withdraw"],
        variables: {},
      };

    case "revive":
      return {
        category: "revive",
        priority: COMMENTARY_PRIORITIES.revive,
        tags: ["revive"],
      };
    case "battle_draw":
      return {
        category: "battle_draw",
        priority: COMMENTARY_PRIORITIES.battleResult,
        tags: ["battle_result", "draw"],
      };
    case "battle_complete": {
      const category =
        event.winnerTeamId === context.playerTeamId
          ? "battle_victory"
          : "battle_defeat";
      return {
        category,
        priority: COMMENTARY_PRIORITIES.battleResult,
        tags: [
          "battle_result",
          category === "battle_victory" ? "victory" : "defeat",
        ],
      };
    }
    default:
      return null;
  }
}

function chooseTemplate(category, eventId, avoidText = null) {
  const templates = TEMPLATES[category] ?? [];
  if (templates.length === 0) {
    return "";
  }
  const start = hashText(`${category}:${eventId}`) % templates.length;
  for (let offset = 0; offset < templates.length; offset += 1) {
    const candidate = templates[(start + offset) % templates.length];
    if (candidate !== avoidText) {
      return candidate;
    }
  }
  return templates[start];
}

export function createCommentaryEvent(
  battleEvent,
  context,
  {
    previousTemplate = null,
  } = {},
) {
  if (!battleEvent || typeof battleEvent !== "object") {
    throw new TypeError("Battle event must be an object.");
  }
  const definition = commentaryDefinition(battleEvent, context);
  if (!definition) {
    return null;
  }

  const template = chooseTemplate(
    definition.category,
    battleEvent.eventId,
    previousTemplate,
  );
  const variables = eventVariables(battleEvent, context);
  const suppressDuration =
    definition.priority >= COMMENTARY_PRIORITIES.battleResult
      ? COMMENTARY_PRESENTATION.resultSuppressDuration
      : definition.priority >= COMMENTARY_PRIORITIES.down
        ? COMMENTARY_PRESENTATION.highPrioritySuppressDuration
        : COMMENTARY_PRESENTATION.defaultSuppressDuration;

  return Object.freeze({
    eventId: `commentary:${battleEvent.eventId}`,
    sourceEventId: battleEvent.eventId,
    timestamp: battleEvent.time,
    phase: "BATTLE",
    priority: definition.priority,
    tags: Object.freeze([...definition.tags]),
    teamId: battleEvent.actorTeamId ?? battleEvent.winnerTeamId ?? null,
    actorId: battleEvent.actorPlayerId ?? null,
    targetId: battleEvent.targetPlayerId ?? null,
    weaponId: battleEvent.sourceId ?? null,
    skillId: battleEvent.skillId ?? null,
    itemId: null,
    damage: battleEvent.damage ?? 0,
    hp: battleEvent.hp ?? battleEvent.currentHp ?? null,
    placement: null,
    templateVariables: Object.freeze(variables),
    template,
    text: fillTemplate(template, variables),
    suppressDuration,
  });
}

export function createCommentaryDirector({
  repeatedTextCooldownSeconds =
    COMMENTARY_PRESENTATION.repeatedTextCooldownSeconds,
} = {}) {
  let activePriority = -1;
  let activeUntil = -1;
  let lastText = "";
  let lastTemplate = "";
  const recentTextTimes = new Map();

  function consumeBattleEvent(battleEvent, context) {
    const candidate = createCommentaryEvent(
      battleEvent,
      context,
      { previousTemplate: lastTemplate },
    );
    if (!candidate) {
      return Object.freeze({
        displayed: false,
        reason: "not_commentary_event",
        commentary: null,
      });
    }

    if (
      candidate.timestamp < activeUntil &&
      candidate.priority < activePriority
    ) {
      return Object.freeze({
        displayed: false,
        reason: "lower_priority_suppressed",
        commentary: candidate,
      });
    }

    const previousTime = recentTextTimes.get(candidate.text);
    if (
      previousTime !== undefined &&
      candidate.timestamp - previousTime <
        repeatedTextCooldownSeconds
    ) {
      return Object.freeze({
        displayed: false,
        reason: "repeated_text_suppressed",
        commentary: candidate,
      });
    }

    activePriority = candidate.priority;
    activeUntil =
      candidate.timestamp + candidate.suppressDuration;
    lastText = candidate.text;
    lastTemplate = candidate.template;
    recentTextTimes.set(candidate.text, candidate.timestamp);

    for (const [text, timestamp] of recentTextTimes) {
      if (
        candidate.timestamp - timestamp >
        repeatedTextCooldownSeconds * 3
      ) {
        recentTextTimes.delete(text);
      }
    }

    return Object.freeze({
      displayed: true,
      reason: "displayed",
      commentary: candidate,
    });
  }

  return Object.freeze({
    consumeBattleEvent,
    getState: () =>
      Object.freeze({
        activePriority,
        activeUntil,
        lastText,
        lastTemplate,
      }),
  });
}

export function compileCommentaryTimeline(
  battleEvents,
  context,
) {
  if (!Array.isArray(battleEvents)) {
    throw new TypeError("Battle events must be an array.");
  }
  const director = createCommentaryDirector();
  const timeline = [];

  const orderedEvents = battleEvents
    .map((event, sourceIndex) => ({ event, sourceIndex }))
    .sort((left, right) => {
      if (left.event.time !== right.event.time) {
        return left.event.time - right.event.time;
      }
      return left.sourceIndex - right.sourceIndex;
    })
    .map((entry) => entry.event);

  for (const event of orderedEvents) {
    const result = director.consumeBattleEvent(event, context);
    if (result.displayed) {
      timeline.push(result.commentary);
    }
  }

  return Object.freeze(timeline);
}

export function createBattleOutcomeCommentary(runtime) {
  const result = runtime.lastBattleResult;
  if (!result) {
    return "戦闘結果を確認できません。";
  }
  if (result.endReason === "mutual_disengage") {
    return "初動は全滅に至らず！両チームとも消耗を抑えて引く判断です！";
  }
  if (result.draw) {
    return "DRAW！両チーム譲らない戦いになりました！";
  }
  const winner = runtime.teams.find(
    (team) => team.teamId === result.winnerTeamId,
  );
  if (result.winnerTeamId === runtime.playerTeamId) {
    return result.endReason === "squad_wipe"
      ? `SQUAD WIPE！${winner?.teamName ?? "プレイヤーチーム"}が3KPを確定しました！`
      : `VICTORY！${winner?.teamName ?? "プレイヤーチーム"}が戦闘を制しました！`;
  }
  return `DEFEAT。${winner?.teamName ?? "対戦チーム"}がこの戦闘を制しました。`;
}
