/**
 * MOB BR CPU flavor presentation master.
 *
 * Every CPU team receives team-specific skill display names while battle
 * calculations continue to use the balanced role-common effect templates.
 */

export const CPU_FLAVOR_DATA_VERSION =
  "mobbr-cpu-flavor-data-1.0.0";

const ROLE_SKILL_FLAVOR =
  Object.freeze({
    IGL: Object.freeze([
      Object.freeze({
        suffix: "ラインコール",
        effectPrefix:
          "味方全体へ判断共有を行い、",
      }),
      Object.freeze({
        suffix: "決断射線",
        effectPrefix:
          "狙いを一本に絞り、",
      }),
      Object.freeze({
        suffix: "ガードリンク",
        effectPrefix:
          "最も危険な味方へ支援を送り、",
      }),
    ]),
    ATK: Object.freeze([
      Object.freeze({
        suffix: "バーストレイン",
        effectPrefix:
          "広い射線へ弾幕を展開し、",
      }),
      Object.freeze({
        suffix: "フィニッシュブレイク",
        effectPrefix:
          "一瞬の隙へ火力を集中し、",
      }),
      Object.freeze({
        suffix: "ガードリンク",
        effectPrefix:
          "攻撃を継続するため、",
      }),
    ]),
    SUP: Object.freeze([
      Object.freeze({
        suffix: "ケアドローン",
        effectPrefix:
          "味方の戦線を維持するため、",
      }),
      Object.freeze({
        suffix: "リカバリーフィールド",
        effectPrefix:
          "倒れた味方へ再起動支援を行い、",
      }),
      Object.freeze({
        suffix: "ガードリンク",
        effectPrefix:
          "危険な味方を優先して、",
      }),
    ]),
  });

function compactTeamName(teamName) {
  const value =
    String(
      teamName ??
      "MOB",
    ).trim();
  return value.length > 11
    ? value.slice(0, 11)
    : value;
}

export function createCpuFlavorSkills({
  teamName,
  playerName,
  role,
  commonSkills,
}) {
  const flavors =
    ROLE_SKILL_FLAVOR[role] ??
    ROLE_SKILL_FLAVOR.ATK;
  const team =
    compactTeamName(teamName);
  const player =
    String(
      playerName ??
      "MOB",
    ).trim();

  return commonSkills.map(
    (skill, index) => {
      const flavor =
        flavors[index] ??
        flavors.at(-1);
      const prefix =
        index === 1
          ? player
          : team;
      return Object.freeze({
        skillId:
          skill.id,
        name:
          `${prefix}・${flavor.suffix}`,
        description:
          `${flavor.effectPrefix}${skill.description}`,
        type:
          skill.type,
        target:
          skill.target,
        baseCt:
          skill.baseCt,
        source:
          "team_flavor_role_common",
        effectMasterId:
          skill.id,
      });
    },
  );
}

export function createCpuFlavorWeaponName({
  playerName,
  role,
  preferredRange,
  explicitWeaponName,
  weaponSource,
}) {
  if (
    weaponSource !==
      "role_template_fallback" &&
    explicitWeaponName &&
    !String(
      explicitWeaponName,
    ).includes("共通武器")
  ) {
    return explicitWeaponName;
  }

  const rangeSuffix = {
    close: "ブレイカー",
    mid: "リンクライフル",
    far: "スカイランサー",
  }[
    preferredRange
  ] ?? "カスタムガン";

  const roleSuffix = {
    IGL: "コール",
    ATK: "ラッシュ",
    SUP: "ケア",
  }[
    role
  ] ?? "MOB";

  return `${playerName}${roleSuffix}・${rangeSuffix}`;
}
