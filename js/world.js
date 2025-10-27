import { RESOURCE_LIST, WORLD_DIMENSIONS } from "./constants.js";

export const TILE_KIND = Object.freeze({
  EMPTY: "empty",
  DEPOSIT: "deposit",
  MACHINE: "machine"
});

const RESOURCE_PRESETS = [
  { resource: "stone", positions: [
    [1, 1], [2, 1], [1, 2], [2, 2],
    [1, 4], [2, 4]
  ] },
  { resource: "coal", positions: [
    [5, 1], [6, 1], [5, 2], [6, 2],
    [5, 4], [6, 4]
  ] },
  { resource: "iron", positions: [
    [9, 2], [10, 2], [9, 3], [10, 3]
  ] },
  { resource: "copper", positions: [
    [8, 5], [9, 5], [8, 6], [9, 6]
  ] }
];

function createEmptyTile() {
  return { kind: TILE_KIND.EMPTY };
}

function createDepositTile(resource) {
  return { kind: TILE_KIND.DEPOSIT, resource };
}

function createMachineTile(machine, resource) {
  return {
    kind: TILE_KIND.MACHINE,
    machine,
    resource: resource != null ? resource : null
  };
}

export class World {
  constructor(width = WORLD_DIMENSIONS.width, height = WORLD_DIMENSIONS.height) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => createEmptyTile())
    );

    for (const preset of RESOURCE_PRESETS) {
      for (const [x, y] of preset.positions) {
        if (x < this.width && y < this.height) {
          this.grid[y][x] = createDepositTile(preset.resource);
        }
      }
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.grid[y][x];
  }

  gatherResource(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || tile.kind !== TILE_KIND.DEPOSIT) {
      return null;
    }
    return tile.resource;
  }

  canPlaceDrill(x, y) {
    const tile = this.getTile(x, y);
    return Boolean(tile && tile.kind === TILE_KIND.DEPOSIT);
  }

  canPlaceSmelter(x, y) {
    const tile = this.getTile(x, y);
    return Boolean(tile && tile.kind !== TILE_KIND.MACHINE);
  }

  placeMachine(machine, x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    if (tile.kind === TILE_KIND.MACHINE) return false;

    machine.position = { x, y };
    const resource = tile.kind === TILE_KIND.DEPOSIT ? tile.resource : null;
    this.grid[y][x] = createMachineTile(machine, resource);
    return true;
  }

  removeMachine(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || tile.kind !== TILE_KIND.MACHINE) return null;
    const machine = tile.machine;
    tile.machine.position = null;
    const fallback = tile.resource && RESOURCE_LIST.includes(tile.resource)
      ? createDepositTile(tile.resource)
      : createEmptyTile();
    this.grid[y][x] = fallback;
    return machine;
  }

  tiles() {
    const result = [];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        result.push({ x, y, ...this.grid[y][x] });
      }
    }
    return result;
  }
}
