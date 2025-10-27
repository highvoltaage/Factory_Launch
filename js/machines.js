import {
  DRILL_BASE_OUTPUT_PER_SECOND,
  DRILL_COAL_PER_SECOND,
  SMELT_SECONDS_PER_PLATE,
  SMELTER_COAL_PER_SECOND
} from "./constants.js";

let nextMachineId = 1;

export function clusterMultiplier(clusterSize) {
  const root = Math.round(Math.sqrt(clusterSize));
  if (root * root !== clusterSize) {
    return 1;
  }
  return root;
}

export class CoalDrill {
  constructor({ resource = "stone", clusterSize = 1, position = null } = {}) {
    this.id = `drill-${nextMachineId++}`;
    this.resource = resource;
    this.clusterSize = clusterSize;
    this.fuel = 0;
    this.outputBuffer = 0;
    this.position = position;
  }

  addFuel(amount) {
    this.fuel += amount;
  }

  setResource(resource) {
    this.resource = resource;
  }

  setClusterSize(size) {
    this.clusterSize = size;
  }

  get active() {
    return this.fuel > 0 && Boolean(this.position);
  }

  tick(deltaSeconds, gameState) {
    if (!this.active) {
      return;
    }

    const fuelConsumed = DRILL_COAL_PER_SECOND * deltaSeconds;
    this.fuel = Math.max(0, this.fuel - fuelConsumed);

    const outputRate = DRILL_BASE_OUTPUT_PER_SECOND * clusterMultiplier(this.clusterSize);
    this.outputBuffer += outputRate * deltaSeconds;

    if (this.outputBuffer >= 1) {
      const produced = Math.floor(this.outputBuffer);
      this.outputBuffer -= produced;
      gameState.depositToPlayer(this.resource, produced);
    }
  }
}

export class StoneSmelter {
  constructor({ recipe = "iron", position = null } = {}) {
    this.id = `smelter-${nextMachineId++}`;
    this.recipe = recipe; // "iron" | "copper"
    this.fuel = 0;
    this.progress = 0;
    this.position = position;
  }

  addFuel(amount) {
    this.fuel += amount;
  }

  setRecipe(recipe) {
    this.recipe = recipe;
  }

  get active() {
    return this.fuel > 0 && Boolean(this.position);
  }

  tick(deltaSeconds, gameState) {
    if (!this.active) {
      return;
    }

    const oreResource = this.recipe;
    const plateResource = this.recipe === "iron" ? "ironPlates" : "copperPlates";

    const consumedFuel = SMELTER_COAL_PER_SECOND * deltaSeconds;
    this.fuel = Math.max(0, this.fuel - consumedFuel);

    this.progress += deltaSeconds;
    while (this.progress >= SMELT_SECONDS_PER_PLATE) {
      if (gameState.takeFromPlayer(oreResource, 1) < 1) {
        this.progress = SMELT_SECONDS_PER_PLATE;
        return;
      }
      this.progress -= SMELT_SECONDS_PER_PLATE;
      gameState.depositToPlayer(plateResource, 1);
    }
  }
}
