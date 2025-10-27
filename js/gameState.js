import {
  RESOURCE_LIST,
  RESOURCE_LABELS,
  RESEARCH_REQUIREMENTS,
  RESEARCH_REWARD
} from "./constants.js";
import { CoalDrill, StoneSmelter } from "./machines.js";
import { StorageManager } from "./storage.js";
import { World, TILE_KIND } from "./world.js";

export class GameState {
  constructor({ onLog } = {}) {
    this.time = 0;
    this.resources = RESOURCE_LIST.reduce((acc, resource) => {
      acc[resource] = 0;
      return acc;
    }, {});
    this.storage = new StorageManager();
    this.world = new World();
    this.drills = [];
    this.smelters = [];
    this.research = {
      completed: false,
      progress: RESOURCE_LIST.reduce((acc, resource) => {
        if (RESEARCH_REQUIREMENTS[resource] !== undefined) {
          acc[resource] = 0;
        }
        return acc;
      }, {})
    };
    this.log = [];
    this.onLog = onLog;
  }

  addLog(message) {
    const entry = { time: this.time, message };
    this.log.unshift(entry);
    if (typeof this.onLog === "function") {
      this.onLog(entry);
    }
    this.log = this.log.slice(0, 40);
  }

  depositToPlayer(resource, amount) {
    if (amount <= 0) {
      return;
    }
    let remaining = this.storage.playerInventory.add(resource, amount);
    const storedInInventory = amount - remaining;
    if (storedInInventory > 0) {
      this.resources[resource] += storedInInventory;
    }
    if (remaining > 0) {
      const leftover = this.storage.depositToChests(resource, remaining);
      const storedInChests = remaining - leftover;
      const label = RESOURCE_LABELS[resource] ? RESOURCE_LABELS[resource] : resource;
      if (storedInChests > 0) {
        this.addLog(`Inventory full. Routed ${storedInChests} ${label} to storage.`);
      }
      if (leftover > 0) {
        this.addLog(`No space for ${leftover} ${label}.`);
      }
    }
  }

  takeFromPlayer(resource, amount) {
    if (this.resources[resource] < amount) {
      const needed = amount - this.resources[resource];
      const pulled = this.storage.takeFromChests(resource, needed);
      if (pulled > 0) {
        this.storage.playerInventory.add(resource, pulled);
        this.resources[resource] += pulled;
      }
    }

    const available = this.resources[resource];
    const taken = Math.min(available, amount);
    this.resources[resource] -= taken;
    this.storage.playerInventory.remove(resource, taken);
    return taken;
  }

  gather(resource, amount = 1) {
    let remaining = this.storage.playerInventory.add(resource, amount);
    const gained = amount - remaining;
    const label = RESOURCE_LABELS[resource] ? RESOURCE_LABELS[resource] : resource;
    if (gained > 0) {
      this.resources[resource] += gained;
      this.addLog(`Gathered ${gained} ${label}.`);
    } else {
      this.addLog(`Inventory full. Unable to carry ${label}.`);
    }
    if (remaining > 0) {
      const leftover = this.storage.depositToChests(resource, remaining);
      const storedInChests = remaining - leftover;
      if (storedInChests > 0) {
        this.addLog(`Routed ${storedInChests} ${label} to storage.`);
      }
      if (leftover > 0) {
        this.addLog(`Storage full. Lost ${leftover} ${label}.`);
      }
    }
  }

  contributeToResearch(costs) {
    if (this.research.completed) {
      return false;
    }
    let contributedAny = false;
    for (const [resource, required] of Object.entries(RESEARCH_REQUIREMENTS)) {
      const remaining = required - this.research.progress[resource];
      if (remaining <= 0) continue;
      const hasOverride = costs && Object.prototype.hasOwnProperty.call(costs, resource);
      const baseAvailable = this.resources[resource] + this.storage.totalInChests(resource);
      const available = hasOverride ? costs[resource] : baseAvailable;
      const toSpend = Math.min(remaining, available);
      if (toSpend > 0) {
        this.takeFromPlayer(resource, toSpend);
        this.research.progress[resource] += toSpend;
        contributedAny = true;
      }
    }
    if (contributedAny) {
      this.addLog("Contributed resources to research.");
    }
    const completed = Object.entries(RESEARCH_REQUIREMENTS).every(
      ([resource, required]) => this.research.progress[resource] >= required
    );
    if (completed) {
      this.research.completed = true;
      this.addLog("Research completed! Coal drills and smelters unlocked.");
      this.unlockStartingMachines();
    }
    return contributedAny;
  }

  unlockStartingMachines() {
    for (let i = 0; i < RESEARCH_REWARD.rewardDrills; i += 1) {
      this.drills.push(new CoalDrill());
    }
    for (let i = 0; i < RESEARCH_REWARD.rewardSmelters; i += 1) {
      this.smelters.push(new StoneSmelter());
    }
    this.addLog(
      `Received ${RESEARCH_REWARD.rewardDrills} coal drills and ${RESEARCH_REWARD.rewardSmelters} smelter${
        RESEARCH_REWARD.rewardSmelters === 1 ? "" : "s"
      }.`
    );
  }

  addFuelToMachine(machine, amount) {
    if (this.takeFromPlayer("coal", amount) < amount) {
      this.addLog("Not enough coal to fuel the machine.");
      return false;
    }
    machine.addFuel(amount);
    this.addLog(`Added ${amount} coal to ${machine.id}.`);
    return true;
  }

  tick(deltaSeconds) {
    this.time += deltaSeconds;
    for (const drill of this.drills) {
      drill.tick(deltaSeconds, this);
    }
    for (const smelter of this.smelters) {
      smelter.tick(deltaSeconds, this);
    }
  }

  unplacedDrills() {
    return this.drills.filter((drill) => !drill.position);
  }

  unplacedSmelters() {
    return this.smelters.filter((smelter) => !smelter.position);
  }

  getMachineAt(x, y) {
    const tile = this.world.getTile(x, y);
    if (!tile || tile.kind !== TILE_KIND.MACHINE) return null;
    return tile.machine;
  }

  gatherFromTile(x, y) {
    const resource = this.world.gatherResource(x, y);
    if (!resource) {
      return false;
    }
    this.gather(resource, 1);
    return true;
  }

  placeDrillAt(x, y) {
    if (!this.research.completed) {
      this.addLog("Research the starter tech to place drills.");
      return false;
    }
    const available = this.drills.find((drill) => !drill.position);
    if (!available) {
      this.addLog("No available drills to place.");
      return false;
    }
    if (!this.world.canPlaceDrill(x, y)) {
      this.addLog("Drills must be placed on a resource deposit.");
      return false;
    }
    const tile = this.world.getTile(x, y);
    available.setResource(tile.resource);
    available.setClusterSize(1);
    if (this.world.placeMachine(available, x, y)) {
      this.addLog(`Placed a coal drill on ${RESOURCE_LABELS[tile.resource]}.`);
      return true;
    }
    return false;
  }

  placeSmelterAt(x, y) {
    if (!this.research.completed) {
      this.addLog("Research the starter tech to place smelters.");
      return false;
    }
    const available = this.smelters.find((smelter) => !smelter.position);
    if (!available) {
      this.addLog("No available smelters to place.");
      return false;
    }
    if (!this.world.canPlaceSmelter(x, y)) {
      this.addLog("That tile is already occupied.");
      return false;
    }
    if (this.world.placeMachine(available, x, y)) {
      this.addLog("Placed a stone smelter.");
      return true;
    }
    return false;
  }
}
