import { RESOURCE_LIST, PLAYER_STACK_LIMIT, CHEST_STACK_LIMIT } from "./constants.js";

class Inventory {
  constructor(stackLimit) {
    this.stackLimit = stackLimit;
    this.items = new Map();
  }

  get(resource) {
    return this.items.get(resource) ?? 0;
  }

  set(resource, value) {
    this.items.set(resource, Math.max(0, value));
  }

  add(resource, amount) {
    if (amount <= 0) return 0;
    const current = this.get(resource);
    const capacity = this.stackLimit;
    const space = Math.max(0, capacity - current);
    const toStore = Math.min(space, amount);
    if (toStore > 0) {
      this.items.set(resource, current + toStore);
    }
    return amount - toStore;
  }

  remove(resource, amount) {
    const current = this.get(resource);
    const next = Math.max(0, current - amount);
    this.items.set(resource, next);
    return current - next;
  }

  toJSON() {
    const result = {};
    for (const res of RESOURCE_LIST) {
      result[res] = this.get(res);
    }
    return result;
  }

  stackCount(resource) {
    const qty = this.get(resource);
    if (qty === 0) return 0;
    return Math.ceil(qty / this.stackLimit);
  }
}

export class StorageManager {
  constructor() {
    this.playerInventory = new Inventory(PLAYER_STACK_LIMIT);
    this.chests = [new Inventory(CHEST_STACK_LIMIT), new Inventory(CHEST_STACK_LIMIT)];
  }

  takeFromChests(resource, amount) {
    let remaining = amount;
    for (const chest of this.chests) {
      if (remaining <= 0) break;
      const removed = chest.remove(resource, remaining);
      remaining -= removed;
    }
    return amount - remaining;
  }

  depositToChests(resource, amount) {
    let remaining = amount;
    for (const chest of this.chests) {
      if (remaining <= 0) break;
      remaining = chest.add(resource, remaining);
    }
    return remaining;
  }

  totalInChests(resource) {
    return this.chests.reduce((sum, chest) => sum + chest.get(resource), 0);
  }

  toJSON() {
    return {
      player: this.playerInventory.toJSON(),
      chests: this.chests.map((chest) => chest.toJSON())
    };
  }
}
