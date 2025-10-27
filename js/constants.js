export const RESOURCE_LIST = [
  "stone",
  "coal",
  "iron",
  "copper",
  "ironPlates",
  "copperPlates"
];

export const RESOURCE_LABELS = {
  stone: "Stone",
  coal: "Coal",
  iron: "Iron Ore",
  copper: "Copper Ore",
  ironPlates: "Iron Plates",
  copperPlates: "Copper Plates"
};

export const PLAYER_STACK_LIMIT = 50;
export const CHEST_STACK_LIMIT = 999;

export const DRILL_BASE_OUTPUT_PER_SECOND = 0.6;
export const DRILL_COAL_PER_SECOND = 0.1;

export const SMELT_SECONDS_PER_PLATE = 4;
export const SMELTER_COAL_PER_SECOND = 0.2;

export const RESEARCH_REQUIREMENTS = {
  stone: 30,
  coal: 20,
  iron: 20,
  copper: 10
};

export const RESEARCH_REWARD = Object.freeze({
  drillsUnlocked: true,
  smelterUnlocked: true,
  rewardDrills: 2,
  rewardSmelters: 1
});
