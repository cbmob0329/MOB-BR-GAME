/**
 * MOB BR battle presentation and event playback.
 *
 * The battle result is calculated before presentation. This module replays
 * the serialized event stream without changing combat calculations.
 */

import { assetPath } from "../assets.js";
import {
  COMMENTATOR,
  COMMENTARY_VERSION,
  createBattleOutcomeCommentary,
  createCommentaryContext,
  createCommentaryDirector,
} from "./commentary.js";

export const BATTLE_UI_VERSION = "mobbr-battle-ui-1.8.0";
export const BATTLE_REPLAY_SCHEMA_VERSION =
  "mobbr-battle-replay-1.0.0";

const ROLE_ORDER = Object.freeze(["IGL", "ATK", "SUP"]);
const DISTANCE_LABELS = Object.freeze({
  close: "CLOSE",
  mid: "MID",
  far: "FAR",
});

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function getTeam(runtime, teamId) {
  const team = runtime.teams.find(
    (candidate) => candidate.teamId === teamId,
  );
  if (!team) {
    throw new RangeError(`Battle UI team is missing: ${teamId}`);
  }
  return team;
}

function initialStatesFromRuntime(runtime) {
  const result = runtime.lastBattleResult;
  if (!result) {
    throw new RangeError("Completed battle result is required.");
  }

  const initial = result.initialParticipantStates;
  if (!initial || typeof initial !== "object") {
    throw new RangeError(
      "Battle result does not contain initialParticipantStates.",
    );
  }

  return Object.fromEntries(
    Object.entries(initial).map(([playerId, state]) => [
      playerId,
      {
        playerId,
        teamId: state.teamId,
        name: state.name,
        role: state.role,
        image: state.image,
        weaponName: state.weaponName,
        maxHp: state.maxHp,
        hp: state.hp,
        combatState: state.combatState,
        ammoMax: state.ammoMax,
        ammo: state.ammo,
        reloadRemaining: state.reloadRemaining,
        distance: state.distance,
        preferredDistance: state.preferredDistance,
        skillCharge: deepClone(state.skillCharge),
        skills: deepClone(state.skills ?? []),
        actionState: "idle",
      },
    ]),
  );
}

export function createBattleReplayModel(runtime) {
  if (!runtime || typeof runtime !== "object") {
    throw new TypeError("Tournament runtime must be an object.");
  }
  const result = runtime.lastBattleResult;
  const events = runtime.lastBattleEvents;
  if (!result || result.status !== "complete") {
    throw new RangeError("Completed battle result is required.");
  }
  if (!Array.isArray(events) || events.length === 0) {
    throw new RangeError("Battle event stream is required.");
  }

  const leftTeam = getTeam(runtime, result.leftTeamId);
  const rightTeam = getTeam(runtime, result.rightTeamId);
  const participants = initialStatesFromRuntime(runtime);

  return deepFreeze({
    schemaVersion: BATTLE_REPLAY_SCHEMA_VERSION,
    battleId: result.battleId,
    match: runtime.match,
    round: runtime.round,
    playerTeamId: runtime.playerTeamId,
    leftTeamId: result.leftTeamId,
    rightTeamId: result.rightTeamId,
    durationSeconds: result.durationSeconds ?? 10,
    elapsedSeconds: 0,
    eventIndex: 0,
    status: "ready",
    winnerTeamId: null,
    draw: false,
    teams: {
      [leftTeam.teamId]: {
        teamId: leftTeam.teamId,
        teamName: leftTeam.teamName,
        teamLogo: leftTeam.teamLogo,
        isPlayer: leftTeam.teamId === runtime.playerTeamId,
        members: [...leftTeam.members]
          .sort(
            (left, right) =>
              ROLE_ORDER.indexOf(left.role) -
              ROLE_ORDER.indexOf(right.role),
          )
          .map((member) => member.playerId),
      },
      [rightTeam.teamId]: {
        teamId: rightTeam.teamId,
        teamName: rightTeam.teamName,
        teamLogo: rightTeam.teamLogo,
        isPlayer: rightTeam.teamId === runtime.playerTeamId,
        members: [...rightTeam.members]
          .sort(
            (left, right) =>
              ROLE_ORDER.indexOf(left.role) -
              ROLE_ORDER.indexOf(right.role),
          )
          .map((member) => member.playerId),
      },
    },
    participants,
    events: events
      .map((event, sourceIndex) => ({ event, sourceIndex }))
      .sort((left, right) => {
        if (left.event.time !== right.event.time) {
          return left.event.time - right.event.time;
        }
        return left.sourceIndex - right.sourceIndex;
      })
      .map((entry) => entry.event),
    commentary: {
      name: COMMENTATOR.name,
      image: COMMENTATOR.image,
      text: `${leftTeam.teamName}対${rightTeam.teamName}、まもなく戦闘開始です！`,
      priority: 0,
      eventId: null,
    },
    commentaryHistory: [
      `${leftTeam.teamName}対${rightTeam.teamName}、まもなく戦闘開始です！`,
    ],
    transient: null,
  });
}

function clearActionStates(model) {
  for (const participant of Object.values(model.participants)) {
    participant.actionState = "idle";
  }
}

function transientForEvent(event, model) {
  const actor = model.participants[event.actorPlayerId];
  const target = model.participants[event.targetPlayerId];
  const base = {
    type: event.type,
    actorPlayerId: event.actorPlayerId ?? null,
    targetPlayerId: event.targetPlayerId ?? null,
    actorSide:
      actor?.teamId === model.leftTeamId ? "left" : "right",
    targetSide:
      target?.teamId === model.leftTeamId ? "left" : "right",
    actorOrder: actor
      ? model.teams[actor.teamId].members.indexOf(actor.playerId)
      : -1,
    targetOrder: target
      ? model.teams[target.teamId].members.indexOf(target.playerId)
      : -1,
    damage: event.damage ?? 0,
    healing:
      event.totalHealing ??
      event.amount ??
      0,
    critical: event.critical === true,
    skillName: event.skillName ?? event.sourceName ?? null,
    actorName: actor?.name ?? null,
    actorImage: actor?.image ?? null,
    targetImage: target?.image ?? null,
    actorRole: actor?.role ?? null,
    targetRole: target?.role ?? null,
    burstCount: event.burstCount ?? 1,
    burstIndex: event.burstIndex ?? 1,
    direction: event.direction ?? null,
    actorDistance: actor?.distance ?? null,
    previousDistance: event.previousDistance ?? null,
    currentDistance: event.currentDistance ?? actor?.distance ?? null,
    actorTeamName: actor ? model.teams[actor.teamId]?.teamName ?? null : null,
    targetName: target?.name ?? null,
    targetTeamName: target ? model.teams[target.teamId]?.teamName ?? null : null,
  };

  if (event.type === "distance_changed") {
    return {
      ...base,
      effect: "range_shift",
    };
  }
  if (event.type === "burst_fire_start") {
    return {
      ...base,
      effect: "projectile_barrage",
    };
  }
  if (
    event.type === "combat_strafe" ||
    event.type === "evasive_dodge"
  ) {
    return {
      ...base,
      effect: event.type,
    };
  }
  if (event.type === "post_revive_recovery") {
    return {
      ...base,
      effect: "post_revive_recovery",
    };
  }
  if (
    [
      "normal_attack_hit",
      "normal_attack_miss",
      "skill_attack_hit",
      "skill_attack_miss",
      "skill_area_attack",
    ].includes(event.type)
  ) {
    return { ...base, effect: "projectile" };
  }
  if (event.type === "damage") {
    return { ...base, effect: "damage" };
  }
  if (event.type === "heal") {
    return { ...base, effect: "heal" };
  }
  if (
    event.type.startsWith("skill_") &&
    event.type !== "skill_heal" &&
    event.type !== "skill_team_heal"
  ) {
    return { ...base, effect: "skill_cutin" };
  }
  if (event.type === "down") {
    return { ...base, effect: "down" };
  }
  if (event.type === "confirmed_kill") {
    return { ...base, effect: "confirmed_kill" };
  }
  if (event.type === "revive") {
    return { ...base, effect: "revive" };
  }
  if (event.type === "squad_wipe") {
    return { ...base, effect: "squad_wipe" };
  }
  if (event.type === "mutual_disengage") {
    return { ...base, effect: "mutual_disengage" };
  }
  return base;
}

export function applyBattleReplayEvent(model, event) {
  if (!model || typeof model !== "object") {
    throw new TypeError("Battle replay model must be an object.");
  }
  if (!event || typeof event !== "object") {
    throw new TypeError("Battle replay event must be an object.");
  }

  const next = deepClone(model);
  clearActionStates(next);
  const elapsedDelta = Math.max(
    0,
    event.time - next.elapsedSeconds,
  );
  for (const participant of Object.values(next.participants)) {
    if (participant.combatState !== "alive") continue;
    for (const skill of participant.skills ?? []) {
      participant.skillCharge[skill.skillId] = Math.min(
        skill.baseCt,
        (participant.skillCharge[skill.skillId] ?? 0) + elapsedDelta,
      );
    }
  }
  next.elapsedSeconds = event.time;
  next.eventIndex += 1;
  next.transient = transientForEvent(event, next);

  const actor = next.participants[event.actorPlayerId];
  const target = next.participants[event.targetPlayerId];

  if (
    actor &&
    event.skillId &&
    (
      event.type.startsWith("skill_") ||
      event.type === "skill_buff"
    )
  ) {
    actor.skillCharge[event.skillId] = 0;
  }

  if (actor) {
    if (
      event.type.includes("attack") ||
      event.type === "skill_area_attack" ||
      event.type === "burst_fire_start" ||
      event.type === "burst_fire_end"
    ) {
      actor.actionState = "attack";
    }
    if (
      event.type === "combat_strafe" ||
      event.type === "evasive_dodge"
    ) {
      actor.actionState = "move";
      actor.motionDirection =
        event.direction ?? "up";
    }
    if (event.type === "post_revive_recovery") {
      actor.actionState = "heal";
    }
    if (
      event.type.startsWith("skill_") ||
      event.type === "skill_buff"
    ) {
      actor.actionState = "skill";
    }
  }

  switch (event.type) {
    case "normal_attack_hit":
    case "normal_attack_miss":
      if (actor && Number.isInteger(event.ammo)) {
        actor.ammo = event.ammo;
      }
      break;
    case "damage":
      if (target) {
        target.hp = Math.max(0, event.remainingHp ?? target.hp);
        target.actionState = "hit";
      }
      break;
    case "heal":
      if (target) {
        target.hp = Math.min(
          target.maxHp,
          event.currentHp ?? target.hp,
        );
        target.actionState = "heal";
      }
      break;
    case "down":
      if (target) {
        target.hp = 0;
        target.combatState = "down";
        target.actionState = "down";
      }
      break;
    case "confirmed_kill":
      if (target) {
        target.hp = 0;
        target.combatState = "dead";
        target.actionState = "dead";
      }
      break;
    case "revive":
      if (target) {
        target.hp = event.hp ?? Math.floor(target.maxHp * 0.3);
        target.combatState = "alive";
        target.actionState = "revive";
      }
      break;
    case "post_revive_recovery":
      if (actor) {
        actor.hp = Math.min(
          actor.maxHp,
          actor.hp + Number(event.healing ?? 0),
        );
        actor.combatState = "alive";
        actor.actionState = "heal";
      }
      break;
    case "squad_wipe":
      next.actionBanner = "SQUAD WIPE / 3 KP";
      break;
    case "mutual_disengage":
      next.actionBanner = "DISENGAGE / お互い引く判断";
      break;
    case "reload_start":
      if (actor) {
        actor.reloadRemaining = event.duration ?? 0;
        actor.actionState = "reload";
      }
      break;
    case "reload_complete":
      if (actor) {
        actor.reloadRemaining = 0;
        actor.ammo = event.ammo ?? actor.ammoMax;
      }
      break;
    case "distance_changed":
      if (actor) {
        actor.distance = event.currentDistance;
        actor.actionState = "move";
      }
      break;
    case "battle_complete":
      next.status = "complete";
      next.winnerTeamId = event.winnerTeamId;
      next.draw = false;
      break;
    case "battle_draw":
      next.status = "complete";
      next.winnerTeamId = null;
      next.draw = true;
      break;
    default:
      break;
  }

  return deepFreeze(next);
}

export function createBattleReplayFrames(runtime) {
  let model = createBattleReplayModel(runtime);
  const frames = [model];
  for (const event of model.events) {
    model = applyBattleReplayEvent(model, event);
    frames.push(model);
  }
  return deepFreeze(frames);
}

function statusHeaderTemplate(runtime, model) {
  return `
    <header class="tournament-status battle-status">
      <div class="tournament-status__main">
        <div class="tournament-status__title">
          <strong>${escapeHtml(runtime.entryData.tournament.tournamentName)}</strong>
          <span>${escapeHtml(runtime.entryData.tournament.stageName)}</span>
        </div>
        <div class="tournament-status__phase">戦闘</div>
      </div>
      <div class="tournament-status__metrics">
        <span>MATCH <strong>${runtime.match}</strong></span>
        <span>ROUND <strong>${runtime.round}</strong></span>
        <span>TIME <strong>${model.elapsedSeconds.toFixed(1)}</strong></span>
      </div>
      <div class="battle-time-bar" aria-label="戦闘時間">
        <span style="width:${Math.min(100, model.elapsedSeconds / model.durationSeconds * 100).toFixed(2)}%"></span>
      </div>
    </header>
  `;
}

function ammoTemplate(participant) {
  return `
    <div class="battle-ammo" aria-label="残弾${participant.ammo}">
      ${Array.from({ length: participant.ammoMax }, (_value, index) => `
        <i class="${index < participant.ammo ? "is-loaded" : ""}"></i>
      `).join("")}
    </div>
  `;
}


function skillCtTemplate(participant) {
  const skills =
    (participant.skills ?? []).slice(0, 3);
  return `
    <div class="battle-skill-rings" aria-label="スキルCT">
      ${Array.from({ length: 3 }, (_value, index) => {
        const skill = skills[index] ?? null;
        if (!skill) {
          return `
            <span class="is-empty" aria-hidden="true">
              <i>${index + 1}</i>
            </span>
          `;
        }
        const charge = Math.min(
          skill.baseCt,
          participant.skillCharge?.[
            skill.skillId
          ] ?? 0,
        );
        const ready =
          charge >= skill.baseCt - 0.001;
        const remaining =
          Math.max(0, skill.baseCt - charge);
        const chargeRate =
          skill.baseCt > 0
            ? Math.min(
                1,
                charge / skill.baseCt,
              )
            : 1;
        return `
          <span
            class="${ready ? "is-ready" : ""}"
            style="--ct-charge:${(chargeRate * 360).toFixed(1)}deg"
            title="${escapeAttribute(`${skill.name} LV${skill.level ?? 1}`)}"
          >
            <i>${ready ? "OK" : remaining.toFixed(0)}</i>
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function participantTemplate(
  participant,
  side,
) {
  const hpRate =
    participant.maxHp <= 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            participant.hp /
              participant.maxHp,
          ),
        );
  return `
    <article
      class="battle-fighter battle-fighter--${side} battle-fighter--${escapeAttribute(participant.actionState)}"
      data-player-id="${escapeAttribute(participant.playerId)}"
      data-state="${escapeAttribute(participant.combatState)}"
      data-distance="${escapeAttribute(participant.distance)}"
    >
      <div class="battle-fighter__label">
        <span>${escapeHtml(participant.role)}</span>
        <strong>${escapeHtml(participant.name)}</strong>
        <small>
          ${escapeHtml(DISTANCE_LABELS[participant.distance] ?? participant.distance)}
          / AMMO ${participant.ammo}
        </small>
      </div>
      <div class="battle-fighter__portrait">
        <img
          src="${escapeAttribute(participant.combatState === "dead" ? "icon/deth.png" : participant.image)}"
          alt=""
          data-role="${escapeAttribute(participant.role)}"
        >
        ${
          participant.combatState === "dead"
            ? `<b class="death-box-label">DEATH BOX</b>`
            : ""
        }
      </div>
      <div class="battle-fighter__hud">
        <div class="battle-hp-line">
          <div class="battle-hp-bar">
            <span style="width:${(hpRate * 100).toFixed(2)}%"></span>
          </div>
          <b>${participant.hp}/${participant.maxHp}</b>
        </div>
        ${skillCtTemplate(participant)}
      </div>
    </article>
  `;
}

function teamColumnTemplate(model, teamId, side) {
  const team = model.teams[teamId];
  return `
    <section class="battle-team-column battle-team-column--${side} ${team.isPlayer ? "is-player" : "is-enemy"}">
      <header>
        <img src="${escapeAttribute(team.teamLogo)}" alt="">
        <strong>${escapeHtml(team.teamName)}</strong>
        <span>${team.isPlayer ? "PLAYER" : "CPU"}</span>
      </header>
      <div class="battle-team-column__members">
        ${team.members.map((playerId) =>
          participantTemplate(model.participants[playerId], side)
        ).join("")}
      </div>
    </section>
  `;
}

function ambientCrossfireTemplate(model) {
  if (model.status === "complete") {
    return "";
  }
  return `
    <div class="battle-crossfire-field" aria-hidden="true">
      ${Array.from({ length: 18 }, (_value, index) => `
        <i
          class="${index % 2 === 0 ? "is-left-to-right" : "is-right-to-left"}"
          style="--cross-y:${8 + (index * 17) % 86}%;--cross-delay:${(index % 9) * -0.11}s;--cross-duration:${0.44 + (index % 5) * 0.055}s"
        ></i>
      `).join("")}
    </div>
  `;
}

function projectileBurstTemplate(
  transient,
  {
    count = 4,
    barrage = false,
  } = {},
) {
  const fromY =
    transient.actorOrder < 0
      ? 50
      : 20 + transient.actorOrder * 30;
  const toY =
    transient.targetOrder < 0
      ? 50
      : 20 + transient.targetOrder * 30;
  const fromX =
    transient.actorSide === "left"
      ? 24
      : 76;
  const toX =
    transient.targetSide === "left"
      ? 24
      : 76;
  return `
    <div class="battle-bullet-burst ${barrage ? "is-barrage" : ""}">
      ${Array.from({ length: count }, (_value, index) => {
        const spread =
          (index - (count - 1) / 2) *
          (barrage ? 2.1 : 1.35);
        return `
          <i
            class="battle-projectile ${transient.critical ? "is-critical" : ""}"
            style="--from-x:${fromX}%;--from-y:${fromY + spread}%;--to-x:${toX}%;--to-y:${toY - spread * .55}%;--bullet-delay:${index * 22}ms;--bullet-scale:${1 - index * .035}"
          ></i>
        `;
      }).join("")}
      <b class="battle-muzzle battle-muzzle--burst" style="left:${fromX}%;top:${fromY}%"></b>
      <span class="battle-impact-spark" style="left:${toX}%;top:${toY}%">
        ${Array.from({ length: 7 }, (_value, index) => `<i style="--spark-index:${index}"></i>`).join("")}
      </span>
    </div>
  `;
}

function fxLayerTemplate(transient) {
  if (!transient) {
    return `<div class="battle-fx-layer" aria-hidden="true"></div>`;
  }
  const toY =
    transient.targetOrder < 0
      ? 50
      : 20 + transient.targetOrder * 30;
  const toX =
    transient.targetSide === "left"
      ? 24
      : 76;

  let effect = "";
  if (transient.effect === "projectile_barrage") {
    effect = projectileBurstTemplate(
      transient,
      {
        count: Math.max(
          7,
          Math.min(
            12,
            Number(transient.burstCount ?? 3) * 3,
          ),
        ),
        barrage: true,
      },
    );
  } else if (transient.effect === "projectile") {
    effect = projectileBurstTemplate(
      transient,
      {
        count:
          transient.burstCount > 1
            ? 4
            : 3,
      },
    );
  } else if (transient.effect === "damage") {
    effect = `
      <div class="battle-hit-flash" style="left:${toX}%;top:${toY}%"></div>
      <div class="battle-hit-shards" style="left:${toX}%;top:${toY}%">
        ${Array.from({ length: 9 }, (_value, index) => `<i style="--shard-index:${index}"></i>`).join("")}
      </div>
      <strong
        class="battle-floating-number battle-floating-number--damage ${transient.critical ? "is-critical" : ""}"
        style="left:${toX}%;top:${toY}%"
      >-${formatNumber(transient.damage)}</strong>
    `;
  } else if (transient.effect === "heal") {
    effect = `
      <strong
        class="battle-floating-number battle-floating-number--heal"
        style="left:${toX}%;top:${toY}%"
      >+${formatNumber(transient.healing)}</strong>
    `;
  } else if (transient.effect === "post_revive_recovery") {
    effect = `
      <div class="battle-recovery-pulse" style="left:${toX}%;top:${toY}%"></div>
      <div class="battle-recovery-cut">
        <span>RETURN SKILL 3</span>
        <strong>${escapeHtml(transient.skillName ?? "復帰リカバリー")}</strong>
        <small>${escapeHtml(transient.actorName ?? "選手")}がHPを立て直します</small>
      </div>
    `;
  } else if (
    transient.effect === "combat_strafe" ||
    transient.effect === "evasive_dodge"
  ) {
    effect = `
      <div class="battle-motion-slash battle-motion-slash--${escapeAttribute(transient.actorSide)}" style="top:${toY}%">
        <i></i><i></i><i></i>
      </div>
      ${transient.effect === "evasive_dodge" ? `<strong class="battle-dodge-label" style="left:${toX}%;top:${toY}%">DODGE!</strong>` : ""}
    `;
  } else if (transient.effect === "skill_cutin") {
    const roleClass =
      String(transient.actorRole ?? "atk")
        .toLowerCase();
    const distanceClass =
      String(transient.actorDistance ?? "mid")
        .toLowerCase();
    effect = `
      <div class="battle-skill-cutin battle-skill-cutin--${escapeAttribute(roleClass)} battle-skill-cutin--${escapeAttribute(distanceClass)}">
        <div class="battle-skill-cutin__speed" aria-hidden="true"></div>
        <img src="${escapeAttribute(transient.actorImage ?? "")}" alt="">
        <div>
          <span>SKILL ACTIVATE / ${escapeHtml((transient.actorDistance ?? "MID").toUpperCase())}</span>
          <strong>${escapeHtml(transient.skillName ?? "SPECIAL SKILL")}</strong>
          <small>${escapeHtml(transient.actorRole ?? "")} ${escapeHtml(transient.actorName ?? "")}</small>
        </div>
      </div>
    `;
  } else if (transient.effect === "range_shift") {
    effect = `
      <div class="battle-range-shift battle-range-shift--${escapeAttribute(transient.actorSide)}">
        <img src="${escapeAttribute(transient.actorImage ?? "")}" alt="">
        <div>
          <span>RANGE SHIFT</span>
          <strong>
            ${escapeHtml((transient.previousDistance ?? "MID").toUpperCase())}
            →
            ${escapeHtml((transient.currentDistance ?? "MID").toUpperCase())}
          </strong>
          <small>${escapeHtml(transient.actorName ?? "")}</small>
        </div>
      </div>
    `;
  } else if (
    ["squad_wipe", "mutual_disengage"].includes(transient.effect)
  ) {
    const wipe = transient.effect === "squad_wipe";
    effect = `
      <div class="battle-decision-cut battle-decision-cut--${escapeAttribute(transient.effect)}">
        <span>${wipe ? "SQUAD WIPE" : "DISENGAGE"}</span>
        <strong>${wipe ? "3 KP CONFIRMED" : "お互い引く判断"}</strong>
        <small>${wipe ? "最後のダウンまで確キルとして集計" : "両チーム生存のためROUND生存枠へ保護"}</small>
      </div>
    `;
  } else if (
    ["down", "confirmed_kill", "revive"].includes(transient.effect)
  ) {
    const stateLabel =
      transient.effect === "down"
        ? "DOWN"
        : transient.effect === "confirmed_kill"
          ? "CONFIRMED KILL"
          : "REVIVE";
    const stateCommentary =
      transient.effect === "down"
        ? `${transient.targetName ?? "選手"}がダウン！救援か確キルか、一瞬の判断です！`
        : transient.effect === "confirmed_kill"
          ? `${transient.targetName ?? "選手"}を確キル！${transient.actorTeamName ?? "攻撃側"}にKP！`
          : `${transient.targetName ?? "選手"}が戦線復帰！`;
    effect = `
      <div class="battle-state-shock battle-state-shock--${escapeAttribute(transient.effect)}"></div>
      <div class="battle-state-cut battle-state-cut--${escapeAttribute(transient.effect)}">
        <img class="battle-state-cut__target" src="${escapeAttribute(transient.targetImage ?? "icon/mic.png")}" alt="">
        <div>
          <strong>${escapeHtml(stateLabel)}</strong>
          <span>${escapeHtml(stateCommentary)}</span>
        </div>
      </div>
    `;
  }

  return `<div class="battle-fx-layer" aria-hidden="true">${effect}</div>`;
}

function commentaryPanelTemplate(
  commentary,
  history = [],
) {
  return `
    <aside class="battle-commentary-panel battle-commentary-panel--live">
      <div class="battle-commentary-panel__speaker">
        <img src="${escapeAttribute(COMMENTATOR.image)}" alt="${escapeAttribute(COMMENTATOR.name)}">
        <span>LIVE</span>
      </div>
      <div class="battle-commentary-panel__body">
        <strong>${escapeHtml(COMMENTATOR.name)}</strong>
        <p>${escapeHtml(commentary.text)}</p>
        <div class="battle-commentary-feed">
          ${history
            .filter((text) => text !== commentary.text)
            .slice(-2)
            .reverse()
            .map((text) => `<small>${escapeHtml(text)}</small>`)
            .join("")}
        </div>
        <i class="battle-commentary-wave" aria-hidden="true">
          <b></b><b></b><b></b><b></b><b></b>
        </i>
      </div>
    </aside>
  `;
}

function resultCutTemplate(model) {
  if (model.status !== "complete") {
    return "";
  }
  const label = model.draw
    ? "DRAW"
    : model.winnerTeamId === model.playerTeamId
      ? "VICTORY"
      : "DEFEAT";
  const winnerName =
    model.winnerTeamId === null
      ? "両チーム"
      : model.teams[model.winnerTeamId]?.teamName ?? model.winnerTeamId;
  return `
    <div class="battle-result-cut battle-result-cut--${label.toLowerCase()}">
      <span>${label}</span>
      <strong>${escapeHtml(winnerName)}</strong>
    </div>
  `;
}

export function renderBattleReplayScreen(runtime, model) {
  const impactClass =
    model.transient?.effect === "damage"
      ? "is-impact"
      : model.transient?.effect === "down"
        ? "is-down-impact"
        : model.transient?.effect === "confirmed_kill"
          ? "is-kill-impact"
          : "";
  return `
    <main class="tournament-screen tournament-screen--battle-replay ${impactClass}" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      ${statusHeaderTemplate(runtime, model)}
      <section class="battle-arena">
        ${ambientCrossfireTemplate(model)}
        <div class="battle-combat-haze" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="battle-distance-guide" aria-hidden="true">
          <span>FAR</span><span>MID</span><span>CLOSE</span><span>MID</span><span>FAR</span>
        </div>
        <div class="battle-swipe-guide">
          <span>PLAYER FORMATION</span>
          <strong>← SWIPE →</strong>
          <small>表示隊形を移動</small>
        </div>
        ${teamColumnTemplate(model, model.leftTeamId, "left")}
        <div class="battle-versus-line"><span>VS</span></div>
        ${teamColumnTemplate(model, model.rightTeamId, "right")}
        ${fxLayerTemplate(model.transient)}
        ${resultCutTemplate(model)}
      </section>
      <div class="battle-bottom-area">
        ${commentaryPanelTemplate(model.commentary, model.commentaryHistory)}
        <button
          type="button"
          class="tournament-button tournament-button--ghost battle-skip-button"
          data-action="battle-playback-skip"
        >
          演出をスキップ
        </button>
      </div>
    </main>
  `;
}

export function renderBattleOutcomeScreen(runtime) {
  const result = runtime.lastBattleResult;
  if (!result) {
    throw new RangeError("Battle result is required.");
  }
  const playerWon = result.winnerTeamId === runtime.playerTeamId;
  const label = result.draw ? "DRAW" : playerWon ? "VICTORY" : "DEFEAT";
  const winner = result.winnerTeamId
    ? getTeam(runtime, result.winnerTeamId)
    : null;
  const members = result.participantResults
    .filter((member) => member.teamId === runtime.playerTeamId)
    .sort(
      (left, right) =>
        ROLE_ORDER.indexOf(left.role) -
        ROLE_ORDER.indexOf(right.role),
    );

  return `
    <main class="tournament-screen tournament-screen--battle-outcome-full">
      <section class="battle-outcome-cut battle-outcome-cut--${label.toLowerCase()}">
        <span>${label}</span>
        <h1>${escapeHtml(winner?.teamName ?? "両チーム")}</h1>
        <p>
          ${result.elapsedSeconds.toFixed(1)}秒 /
          ${escapeHtml(result.endReason)} /
          ${escapeHtml(result.tieBreaker ?? "判定なし")}
        </p>
      </section>
      <section class="battle-survivor-grid">
        ${members.map((member) => `
          <article data-state="${escapeAttribute(member.combatState)}">
            <img src="${escapeAttribute(
              runtime.teams
                .flatMap((team) => team.members)
                .find((source) => source.playerId === member.playerId)?.image ?? ""
            )}" alt="">
            <strong>${escapeHtml(member.role)} ${escapeHtml(member.name)}</strong>
            <span>${escapeHtml(member.combatState.toUpperCase())}</span>
            <small>
              HP ${member.hp}/${member.maxHp}<br>
              DMG ${formatNumber(member.stats.damage)} /
              K ${member.stats.kills} /
              A ${member.stats.assists}
            </small>
          </article>
        `).join("")}
      </section>
      <div class="battle-outcome-bottom">
        ${commentaryPanelTemplate({
          text: createBattleOutcomeCommentary(runtime),
        })}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="battle-outcome-next"
        >
          ROUND RESULT
        </button>
      </div>
    </main>
  `;
}

export function createBattlePlaybackController({
  root,
  runtime,
  onComplete,
  onError = (error) => console.error(error),
  playbackRate =
    Number(runtime?.entryData?.settings?.commentarySpeed) || 1,
  reducedMotion =
    runtime?.entryData?.settings?.reducedMotion === true,
  timer = globalThis,
} = {}) {
  if (!root || typeof root !== "object") {
    throw new TypeError("Battle playback root is required.");
  }
  if (typeof onComplete !== "function") {
    throw new TypeError("Battle playback onComplete is required.");
  }

  const context = createCommentaryContext(runtime);
  const director = createCommentaryDirector();
  let model = deepClone(createBattleReplayModel(runtime));
  let eventIndex = 0;
  let timeoutId = null;
  let destroyed = false;
  let completed = false;
  let generation = 0;
  let swipeStartX = null;
  let swipeStartY = null;
  let manualFormationShift = 0;

  const safeRate =
    Number.isFinite(playbackRate) && playbackRate > 0
      ? playbackRate
      : 1;

  function render() {
    if (!destroyed) {
      root.innerHTML =
        renderBattleReplayScreen(
          runtime,
          model,
        );
      root.dataset.battleManualShift =
        String(manualFormationShift);
      const guide =
        root.querySelector(
          ".battle-swipe-guide strong",
        );
      if (guide) {
        guide.textContent =
          manualFormationShift < 0
            ? "FAR VIEW"
            : manualFormationShift > 0
              ? "CLOSE VIEW"
              : "← SWIPE →";
      }
    }
  }

  function clearTimer() {
    if (timeoutId !== null) {
      timer.clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function finish({ skipped = false } = {}) {
    if (destroyed || completed) {
      return;
    }
    completed = true;
    clearTimer();
    onComplete({
      skipped,
      model: deepFreeze(deepClone(model)),
    });
  }

  function processEvent(event) {
    model = deepClone(applyBattleReplayEvent(model, event));
    const commentary = director.consumeBattleEvent(event, context);
    if (commentary.displayed) {
      model.commentary = {
        name: COMMENTATOR.name,
        image: COMMENTATOR.image,
        text: commentary.commentary.text,
        priority: commentary.commentary.priority,
        eventId: commentary.commentary.eventId,
      };
      model.commentaryHistory = [
        ...(model.commentaryHistory ?? []),
        commentary.commentary.text,
      ].slice(-5);
    }
    render();
  }

  function scheduleNext() {
    if (destroyed || completed) {
      return;
    }
    if (eventIndex >= model.events.length) {
      const hold = reducedMotion ? 40 : 900 / safeRate;
      const token = generation;
      timeoutId = timer.setTimeout(() => {
        if (token === generation) {
          finish();
        }
      }, hold);
      return;
    }

    const event = model.events[eventIndex];
    const previousTime =
      eventIndex === 0
        ? 0
        : model.events[eventIndex - 1].time;
    const eventDelay = Math.max(0, event.time - previousTime) * 1000;
    const previousEvent = eventIndex > 0 ? model.events[eventIndex - 1] : null;
    const previousPresentationHold = !reducedMotion && previousEvent
      ? previousEvent.type === "skill_cutin"
        ? 280
        : ["down", "confirmed_kill", "revive", "squad_wipe"].includes(previousEvent.type)
          ? 440
          : previousEvent.type === "distance_changed"
            ? 110
            : previousEvent.type === "underdog_momentum"
              ? 320
              : 0
      : 0;
    const delay = reducedMotion
      ? Math.min(25, eventDelay / safeRate)
      : Math.max(
          6,
          eventDelay * 0.56 / safeRate +
          previousPresentationHold / safeRate,
        );
    const token = generation;

    timeoutId = timer.setTimeout(() => {
      if (destroyed || token !== generation) {
        return;
      }
      try {
        processEvent(event);
        eventIndex += 1;
        scheduleNext();
      } catch (error) {
        onError(error);
      }
    }, delay);
  }

  function handleClick(event) {
    const action = event.target?.closest?.("[data-action]")?.dataset?.action;
    if (action === "battle-playback-skip") {
      skip();
    }
  }


  function handlePointerDown(event) {
    if (
      !event.target?.closest?.(
        ".battle-team-column.is-player",
      )
    ) {
      return;
    }
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
  }

  function handlePointerUp(event) {
    if (
      swipeStartX === null ||
      swipeStartY === null
    ) {
      return;
    }
    const deltaX =
      event.clientX - swipeStartX;
    const deltaY =
      event.clientY - swipeStartY;
    swipeStartX = null;
    swipeStartY = null;

    if (
      Math.abs(deltaX) < 34 ||
      Math.abs(deltaX) <=
        Math.abs(deltaY)
    ) {
      return;
    }

    manualFormationShift =
      Math.max(
        -1,
        Math.min(
          1,
          manualFormationShift +
            (deltaX > 0 ? 1 : -1),
        ),
      );
    root.dataset.battleManualShift =
      String(manualFormationShift);

    const guide =
      root.querySelector(
        ".battle-swipe-guide strong",
      );
    if (guide) {
      guide.textContent =
        manualFormationShift < 0
          ? "FAR VIEW"
          : manualFormationShift > 0
            ? "CLOSE VIEW"
            : "MID VIEW";
    }
  }

  function handlePointerCancel() {
    swipeStartX = null;
    swipeStartY = null;
  }

  function start() {
    if (destroyed) {
      throw new Error("Destroyed battle playback cannot start.");
    }
    root.addEventListener?.("click", handleClick);
    root.addEventListener?.(
      "pointerdown",
      handlePointerDown,
    );
    root.addEventListener?.(
      "pointerup",
      handlePointerUp,
    );
    root.addEventListener?.(
      "pointercancel",
      handlePointerCancel,
    );
    model.status = "playing";
    render();
    scheduleNext();
    return controller;
  }

  function skip() {
    if (destroyed || completed) {
      return;
    }
    generation += 1;
    clearTimer();
    while (eventIndex < model.events.length) {
      processEvent(model.events[eventIndex]);
      eventIndex += 1;
    }
    finish({ skipped: true });
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    generation += 1;
    clearTimer();
    root.removeEventListener?.("click", handleClick);
    root.removeEventListener?.(
      "pointerdown",
      handlePointerDown,
    );
    root.removeEventListener?.(
      "pointerup",
      handlePointerUp,
    );
    root.removeEventListener?.(
      "pointercancel",
      handlePointerCancel,
    );
    delete root.dataset.battleManualShift;
  }

  const controller = Object.freeze({
    start,
    skip,
    destroy,
    getModel: () => deepFreeze(deepClone(model)),
    getEventIndex: () => eventIndex,
    versions: Object.freeze({
      ui: BATTLE_UI_VERSION,
      commentary: COMMENTARY_VERSION,
    }),
  });
  return controller;
}
