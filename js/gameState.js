import {
  RESOURCE_LIST,
  RESOURCE_LABELS,
  RESEARCH_REQUIREMENTS,
  RESEARCH_REWARD
} from "./constants.js";
import { CoalDrill, StoneSmelter } from "./machines.js";
import { StorageManager } from "./storage.js";

export class GameState {
  constructor({ onLog } = {}) {
    this.time = 0;
    this.resources = RESOURCE_LIST.reduce((acc, resource) => {
      acc[resource] = 0;
      return acc;
    }, {});
    this.storage = new StorageManager();
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
      const label = RESOURCE_LABELS[resource] ?? resource;
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
    const label = RESOURCE_LABELS[resource] ?? resource;
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
      const available =
        costs?.[resource] ?? this.resources[resource] + this.storage.totalInChests(resource);
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
}
