/**
 * MOB BR casual cup presentation and trophy master.
 */

export const CASUAL_DATA_VERSION =
  "mobbr-casual-data-1.1.0";

export const CASUAL_CUP_MASTER =
  Object.freeze({
    casual_denden: Object.freeze({
      tournamentType:
        "casual_denden",
      cupId: "denden",
      tournamentName:
        "デンデンカップ",
      backgroundImage:
        "back/denden.png",
      logoImage:
        "icon/brden.png",
      visible:
        true,
      trophyImages:
        Object.freeze({
          1: "prize/02.png",
          2: "prize/03.png",
          3: "prize/04.png",
        }),
    }),
    casual_mobutetsu:
      Object.freeze({
        tournamentType:
          "casual_mobutetsu",
        cupId: "mobutetsu",
        tournamentName:
          "モブテツカップ",
        backgroundImage:
          "back/tetsu.png",
        logoImage:
          "icon/brtetsu.png",
        visible:
          false,
        trophyImages:
          Object.freeze({
            1: "prize/05.png",
            2: "prize/06.png",
            3: "prize/07.png",
          }),
      }),
    casual_rockets:
      Object.freeze({
        tournamentType:
          "casual_rockets",
        cupId: "rockets",
        tournamentName:
          "ジョーダンロケッツカップ",
        backgroundImage:
          "back/rokets.png",
        logoImage:
          "icon/rokets.png",
        visible:
          false,
        trophyImages:
          Object.freeze({
            1: "prize/08.png",
            2: "prize/09.png",
            3: "prize/10.png",
          }),
      }),
    casual_tempest:
      Object.freeze({
        tournamentType:
          "casual_tempest",
        cupId: "tempest",
        tournamentName:
          "ゴールデンテンペストカップ",
        backgroundImage:
          "back/tenpest.png",
        logoImage:
          "icon/tenpest.png",
        visible:
          false,
        trophyImages:
          Object.freeze({
            1: "prize/10.png",
            2: "prize/11.png",
            3: "prize/12.png",
          }),
      }),
  });

export const CASUAL_TROPHY_MASTER =
  Object.freeze(
    Object.values(
      CASUAL_CUP_MASTER,
    ).flatMap(
      (cup) =>
        [1, 2, 3].map(
          (place) =>
            Object.freeze({
              trophyTypeId:
                `${cup.cupId}-${place}`,
              tournamentType:
                cup.tournamentType,
              cupId:
                cup.cupId,
              cupName:
                cup.tournamentName,
              place,
              medal:
                place === 1
                  ? "GOLD"
                  : place === 2
                    ? "SILVER"
                    : "BRONZE",
              image:
                cup.trophyImages[
                  place
                ],
            }),
        ),
    ),
  );

export function getCasualCup(
  tournamentType,
) {
  return (
    CASUAL_CUP_MASTER[
      tournamentType
    ] ?? null
  );
}

export function createCasualTrophy({
  tournamentType,
  finalPlace,
  tournamentId,
  resultId,
  year,
  month,
  week,
}) {
  const cup =
    getCasualCup(
      tournamentType,
    );
  if (
    !cup ||
    ![1, 2, 3].includes(
      finalPlace,
    )
  ) {
    return null;
  }

  const medal =
    finalPlace === 1
      ? "ゴールド"
      : finalPlace === 2
        ? "シルバー"
        : "ブロンズ";

  return Object.freeze({
    trophyId:
      `trophy:${resultId}:${cup.cupId}:${finalPlace}`,
    trophyTypeId:
      `${cup.cupId}-${finalPlace}`,
    tournamentType,
    tournamentId,
    resultId,
    cupId:
      cup.cupId,
    cupName:
      cup.tournamentName,
    name:
      `${cup.tournamentName} ${medal}トロフィー`,
    place:
      finalPlace,
    image:
      cup.trophyImages[
        finalPlace
      ],
    acquiredAt: {
      year,
      month,
      week,
    },
  });
}
