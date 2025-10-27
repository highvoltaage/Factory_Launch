import {
  RESOURCE_LIST,
  RESOURCE_LABELS,
  RESEARCH_REQUIREMENTS,
  RESOURCE_IMAGES,
  MACHINE_IMAGES
} from "./constants.js";
import { TILE_KIND } from "./world.js";

function createImageElement(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.draggable = false;
  return img;
}

export class UIController {
  constructor(gameState) {
    this.gameState = gameState;
    this.worldGrid = document.getElementById("world-grid");
    this.inventoryGrid = document.getElementById("inventory-grid");
    this.storageContainer = document.getElementById("storage-chests");
    this.drillContainer = document.getElementById("drills");
    this.smelterContainer = document.getElementById("smelters");
    this.researchStatus = document.getElementById("research-status");
    this.logContainer = document.getElementById("event-log");
    this.placementIndicator = document.getElementById("placement-indicator");
    this.tileInfo = document.getElementById("tile-info");
    this.buildButtons = Array.from(document.querySelectorAll("[data-build]"));
    this.cancelBuildButton = document.getElementById("cancel-placement");
  }

  bindWorldInteractions({ onTileClick, onSelectBuild, onCancel }) {
    if (this.worldGrid) {
      this.worldGrid.addEventListener("click", (event) => {
        const target = event.target.closest("[data-x]");
        if (!target) return;
        const x = Number(target.dataset.x);
        const y = Number(target.dataset.y);
        onTileClick(x, y);
      });
    }
    this.buildButtons.forEach((button) => {
      button.addEventListener("click", () => {
        onSelectBuild(button.dataset.build);
      });
    });
    if (this.cancelBuildButton) {
      this.cancelBuildButton.addEventListener("click", () => onCancel());
    }
  }

  updatePlacementButtons(mode) {
    this.buildButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.build === mode);
    });
    if (this.cancelBuildButton) {
      this.cancelBuildButton.disabled = !mode;
    }
  }

  renderWorld({ placementMode }) {
    if (!this.worldGrid) return;
    const { width, height } = this.gameState.world;
    this.worldGrid.style.gridTemplateColumns = `repeat(${width}, minmax(52px, 1fr))`;
    this.worldGrid.style.gridTemplateRows = `repeat(${height}, minmax(52px, 1fr))`;
    this.worldGrid.innerHTML = "";

    for (const tile of this.gameState.world.tiles()) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `world-tile world-tile--${tile.kind}`;
      cell.dataset.x = tile.x;
      cell.dataset.y = tile.y;
      cell.setAttribute("aria-label", this.describeTile(tile));
      cell.setAttribute("role", "gridcell");

      if (tile.kind === TILE_KIND.DEPOSIT) {
        const img = createImageElement(
          RESOURCE_IMAGES[tile.resource],
          RESOURCE_LABELS[tile.resource]
        );
        cell.appendChild(img);
        const label = document.createElement("span");
        label.className = "tile-label";
        label.textContent = RESOURCE_LABELS[tile.resource];
        cell.appendChild(label);
        if (placementMode === "drill") {
          cell.classList.add("world-tile--eligible");
        }
      } else if (tile.kind === TILE_KIND.MACHINE) {
        const machine = tile.machine;
        const type = machine.id.startsWith("drill") ? "drill" : "smelter";
        const imageSrc = type === "drill" ? MACHINE_IMAGES.drill : MACHINE_IMAGES.smelter;
        const img = createImageElement(imageSrc, type === "drill" ? "Coal Drill" : "Stone Smelter");
        cell.appendChild(img);
        const label = document.createElement("span");
        label.className = "tile-label";
        label.textContent = type === "drill" ? "Drill" : "Smelter";
        cell.appendChild(label);
      } else if (placementMode === "smelter") {
        cell.classList.add("world-tile--eligible");
      }

      this.worldGrid.appendChild(cell);
    }
  }

  describeTile(tile) {
    if (!tile) return "Unknown";
    if (tile.kind === TILE_KIND.DEPOSIT) {
      return `${RESOURCE_LABELS[tile.resource]} deposit at ${tile.x}, ${tile.y}`;
    }
    if (tile.kind === TILE_KIND.MACHINE) {
      const machine = tile.machine;
      return `${machine.id} at ${tile.x}, ${tile.y}`;
    }
    return `Empty tile at ${tile.x}, ${tile.y}`;
  }

  renderPlacementIndicator(mode, { drills, smelters }) {
    if (!this.placementIndicator) return;
    if (!mode) {
      this.placementIndicator.textContent = "Select a machine to place.";
      return;
    }
    const label = mode === "drill" ? "drill" : "smelter";
    const remaining = mode === "drill" ? drills : smelters;
    this.placementIndicator.textContent = `Placing ${label}s — ${remaining} available`;
  }

  renderBuildCounts({ drills, smelters }) {
    this.buildButtons.forEach((button) => {
      const target = button.querySelector("[data-count]");
      if (!target) return;
      if (button.dataset.build === "drill") {
        target.textContent = drills;
        button.disabled = drills === 0;
      } else if (button.dataset.build === "smelter") {
        target.textContent = smelters;
        button.disabled = smelters === 0;
      }
    });
  }

  showTileInfo(tile) {
    if (!this.tileInfo) return;
    this.tileInfo.innerHTML = "";
    if (!tile) {
      this.tileInfo.textContent = "Select a tile to see details.";
      return;
    }
    if (tile.kind === TILE_KIND.DEPOSIT) {
      this.tileInfo.innerHTML = `
        <h3>${RESOURCE_LABELS[tile.resource]} Deposit</h3>
        <p class="meta">Click to gather resources manually or place a drill for automation.</p>
      `;
      return;
    }
    if (tile.kind === TILE_KIND.MACHINE) {
      const machine = tile.machine;
      const type = machine.id.startsWith("drill") ? "drill" : "smelter";
      const container = document.createElement("div");
      const header = document.createElement("h3");
      header.textContent = machine.id;
      const coords = document.createElement("p");
      coords.className = "meta";
      coords.textContent = `Location: (${tile.x}, ${tile.y})`;
      const status = document.createElement("p");
      status.className = "meta";
      status.textContent = `Fuel: ${machine.fuel.toFixed(1)}`;
      container.append(header, coords, status);
      if (type === "drill" && tile.resource) {
        const mining = document.createElement("p");
        mining.className = "meta";
        const drillLabel = RESOURCE_LABELS[tile.resource]
          ? RESOURCE_LABELS[tile.resource]
          : tile.resource;
        mining.textContent = `Mining ${drillLabel}`;
        container.append(mining);
      }
      this.tileInfo.append(container);
      return;
    }
    this.tileInfo.textContent = "Empty ground. Place a smelter here after research.";
  }

  renderInventory() {
    this.inventoryGrid.innerHTML = "";
    for (const resource of RESOURCE_LIST) {
      const amount = this.gameState.storage.playerInventory.get(resource);
      if (amount === 0) continue;
      const item = document.createElement("div");
      item.className = "inventory-item";
      const title = document.createElement("div");
      title.className = "inventory-title";
      const resourceLabel = RESOURCE_LABELS[resource] ? RESOURCE_LABELS[resource] : resource;
      const img = createImageElement(RESOURCE_IMAGES[resource], resourceLabel);
      title.appendChild(img);
      const text = document.createElement("span");
      text.textContent = resourceLabel;
      title.appendChild(text);
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${amount} items`;
      item.append(title, meta);
      this.inventoryGrid.appendChild(item);
    }
    if (!this.inventoryGrid.children.length) {
      const empty = document.createElement("p");
      empty.textContent = "Inventory is empty. Gather resources to begin.";
      empty.className = "meta";
      this.inventoryGrid.appendChild(empty);
    }
  }

  renderStorage() {
    this.storageContainer.innerHTML = "";
    this.gameState.storage.chests.forEach((chest, index) => {
      const card = document.createElement("div");
      card.className = "storage-item";
      const header = document.createElement("h3");
      header.textContent = `Chest ${index + 1}`;
      const contents = document.createElement("div");
      contents.className = "meta";
      const parts = [];
      for (const resource of RESOURCE_LIST) {
        const amount = chest.get(resource);
        if (amount > 0) {
          const label = RESOURCE_LABELS[resource] ? RESOURCE_LABELS[resource] : resource;
          parts.push(`${label}: ${amount}`);
        }
      }
      contents.textContent = parts.join(" · ") || "Empty";
      card.append(header, contents);
      this.storageContainer.appendChild(card);
    });
  }

  renderResearch() {
    const status = this.gameState.research;
    const lines = Object.entries(RESEARCH_REQUIREMENTS).map(([resource, required]) => {
      const progress = status.progress[resource] !== undefined ? status.progress[resource] : 0;
      const percent = Math.min(100, Math.round((progress / required) * 100));
      return `
        <div>
          <div class="row">
            <strong>${RESOURCE_LABELS[resource]}</strong>
            <span class="meta">${progress}/${required}</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    });
    const completeLine = status.completed
      ? '<span class="badge">Research complete!</span>'
      : '<span class="badge">Awaiting resources</span>';
    this.researchStatus.innerHTML = `${lines.join("")}${completeLine}`;
    const contributeButton = document.getElementById("contribute-research");
    if (contributeButton) {
      contributeButton.disabled = status.completed;
    }
  }

  renderDrills(onFuel) {
    this.drillContainer.innerHTML = "";
    if (!this.gameState.drills.length) {
      const hint = document.createElement("p");
      hint.className = "meta";
      hint.textContent = "Complete research to receive drills.";
      this.drillContainer.appendChild(hint);
      return;
    }

    const unplaced = this.gameState.unplacedDrills();
    if (unplaced.length) {
      const notice = document.createElement("p");
      notice.className = "meta";
      notice.textContent = `${unplaced.length} drill${unplaced.length > 1 ? "s" : ""} awaiting placement.`;
      this.drillContainer.appendChild(notice);
    }

    const placed = this.gameState.drills.filter((drill) => drill.position);
    placed.forEach((drill) => {
      const card = document.createElement("div");
      card.className = "machine-card";
      card.innerHTML = `
        <header>
          <h3>${drill.id}</h3>
          <span class="badge">${drill.position.x},${drill.position.y}</span>
        </header>
        <div class="status">
          Mining ${RESOURCE_LABELS[drill.resource] ? RESOURCE_LABELS[drill.resource] : drill.resource}<br>
          Fuel: ${drill.fuel.toFixed(1)}
        </div>
        <button data-id="${drill.id}" data-role="fuel">Refuel with 10 Coal</button>
      `;
      this.drillContainer.appendChild(card);
    });

    this.drillContainer.querySelectorAll("button[data-role='fuel']").forEach((button) => {
      button.addEventListener("click", (event) => onFuel(event.currentTarget.dataset.id));
    });
  }

  renderSmelters(onRecipeChange, onFuel) {
    this.smelterContainer.innerHTML = "";
    if (!this.gameState.smelters.length) {
      const hint = document.createElement("p");
      hint.className = "meta";
      hint.textContent = "Complete research to receive a smelter.";
      this.smelterContainer.appendChild(hint);
      return;
    }

    const unplaced = this.gameState.unplacedSmelters();
    if (unplaced.length) {
      const notice = document.createElement("p");
      notice.className = "meta";
      notice.textContent = `${unplaced.length} smelter${unplaced.length > 1 ? "s" : ""} awaiting placement.`;
      this.smelterContainer.appendChild(notice);
    }

    const placed = this.gameState.smelters.filter((smelter) => smelter.position);
    placed.forEach((smelter) => {
      const card = document.createElement("div");
      card.className = "machine-card";
      card.dataset.id = smelter.id;
      card.innerHTML = `
        <header>
          <h3>${smelter.id}</h3>
          <span class="badge">${smelter.position.x},${smelter.position.y}</span>
        </header>
        <label>
          Recipe:
          <select data-id="${smelter.id}" data-role="recipe">
            <option value="iron" ${smelter.recipe === "iron" ? "selected" : ""}>Iron Plates</option>
            <option value="copper" ${smelter.recipe === "copper" ? "selected" : ""}>Copper Plates</option>
          </select>
        </label>
        <div class="status">
          Fuel: ${smelter.fuel.toFixed(1)}
        </div>
        <button data-id="${smelter.id}" data-role="fuel">Refuel with 10 Coal</button>
      `;
      this.smelterContainer.appendChild(card);
    });

    this.smelterContainer.querySelectorAll("select[data-role='recipe']").forEach((select) => {
      select.addEventListener("change", (event) => onRecipeChange(event.currentTarget.dataset.id, event.currentTarget.value));
    });
    this.smelterContainer.querySelectorAll("button[data-role='fuel']").forEach((button) => {
      button.addEventListener("click", (event) => onFuel(event.currentTarget.dataset.id));
    });
  }

  renderLog(log) {
    this.logContainer.innerHTML = "";
    log.slice(0, 8).forEach((entry) => {
      const item = document.createElement("div");
      item.className = "event-log-item";
      item.textContent = `t+${entry.time.toFixed(0)}s — ${entry.message}`;
      this.logContainer.appendChild(item);
    });
  }
}
