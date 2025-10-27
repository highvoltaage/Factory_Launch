import { RESOURCE_LIST, RESOURCE_LABELS, RESEARCH_REQUIREMENTS } from "./constants.js";

export class UIController {
  constructor(gameState) {
    this.gameState = gameState;
    this.inventoryGrid = document.getElementById("inventory-grid");
    this.storageContainer = document.getElementById("storage-chests");
    this.drillContainer = document.getElementById("drills");
    this.smelterContainer = document.getElementById("smelters");
    this.researchStatus = document.getElementById("research-status");
    this.logContainer = document.getElementById("event-log");
  }

  bindGatherButtons(onGather) {
    document.querySelectorAll(".gather-buttons button").forEach((button) => {
      button.addEventListener("click", () => onGather(button.dataset.resource));
    });
  }

  renderInventory() {
    this.inventoryGrid.innerHTML = "";
    for (const resource of RESOURCE_LIST) {
      const amount = this.gameState.storage.playerInventory.get(resource);
      if (amount === 0) continue;
      const item = document.createElement("div");
      item.className = "inventory-item";
      item.innerHTML = `
        <h3>${RESOURCE_LABELS[resource] ?? resource}</h3>
        <div class="meta">${amount} items</div>
      `;
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
      const contents = [];
      for (const resource of RESOURCE_LIST) {
        const amount = chest.get(resource);
        if (amount > 0) {
          contents.push(`<span class="badge">${RESOURCE_LABELS[resource] ?? resource}: ${amount}</span>`);
        }
      }
      card.innerHTML = `
        <h3>Chest ${index + 1}</h3>
        <div class="meta">${contents.join(" ") || "Empty"}</div>
      `;
      this.storageContainer.appendChild(card);
    });
  }

  renderResearch() {
    const status = this.gameState.research;
    const lines = Object.entries(RESEARCH_REQUIREMENTS).map(([resource, required]) => {
      const progress = status.progress[resource] ?? 0;
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
    document.getElementById("contribute-research").disabled = status.completed;
  }

  renderDrills(onResourceChange, onFuel, onClusterChange) {
    const active = document.activeElement;
    if (
      active &&
      active.tagName === "SELECT" &&
      this.drillContainer.contains(active)
    ) {
      this.refreshDrillStatuses();
      return;
    }

    this.drillContainer.innerHTML = "";
    if (!this.gameState.drills.length) {
      const hint = document.createElement("p");
      hint.textContent = "Complete the first research to unlock coal-powered drills.";
      hint.className = "meta";
      this.drillContainer.appendChild(hint);
      return;
    }

    for (const drill of this.gameState.drills) {
      const card = document.createElement("div");
      card.className = "machine-card";
      card.dataset.id = drill.id;
      card.innerHTML = `
        <header>
          <h3>Coal Drill</h3>
          <span class="badge">${drill.id}</span>
        </header>
        <label>
          Mining:
          <select data-id="${drill.id}" data-role="resource">
            <option value="stone" ${drill.resource === "stone" ? "selected" : ""}>Stone</option>
            <option value="coal" ${drill.resource === "coal" ? "selected" : ""}>Coal</option>
            <option value="iron" ${drill.resource === "iron" ? "selected" : ""}>Iron Ore</option>
            <option value="copper" ${drill.resource === "copper" ? "selected" : ""}>Copper Ore</option>
          </select>
        </label>
        <label>
          Cluster:
          <select data-id="${drill.id}" data-role="cluster">
            <option value="1" ${drill.clusterSize === 1 ? "selected" : ""}>1x1</option>
            <option value="4" ${drill.clusterSize === 4 ? "selected" : ""}>2x2</option>
            <option value="9" ${drill.clusterSize === 9 ? "selected" : ""}>3x3</option>
          </select>
        </label>
        <div class="status">
          <span class="${drill.active ? "active" : "inactive"}">
            ${drill.active ? "Active" : "Idle"} — Fuel ${drill.fuel.toFixed(1)}
          </span>
        </div>
        <button data-id="${drill.id}" data-role="fuel">Refuel with 10 Coal</button>
      `;
      this.drillContainer.appendChild(card);
    }

    this.drillContainer.querySelectorAll("select[data-role='resource']").forEach((el) => {
      el.addEventListener("change", (event) => onResourceChange(event.target.dataset.id, event.target.value));
    });
    this.drillContainer.querySelectorAll("select[data-role='cluster']").forEach((el) => {
      el.addEventListener("change", (event) => onClusterChange(event.target.dataset.id, Number(event.target.value)));
    });
    this.drillContainer.querySelectorAll("button[data-role='fuel']").forEach((button) => {
      button.addEventListener("click", (event) => onFuel(event.target.dataset.id));
    });
  }

  renderSmelters(onRecipeChange, onFuel) {
    const active = document.activeElement;
    if (
      active &&
      active.tagName === "SELECT" &&
      this.smelterContainer.contains(active)
    ) {
      this.refreshSmelterStatuses();
      return;
    }

    this.smelterContainer.innerHTML = "";
    if (!this.gameState.smelters.length) {
      const hint = document.createElement("p");
      hint.textContent = "Complete the first research to unlock the stone smelter.";
      hint.className = "meta";
      this.smelterContainer.appendChild(hint);
      return;
    }

    for (const smelter of this.gameState.smelters) {
      const card = document.createElement("div");
      card.className = "machine-card";
      card.dataset.id = smelter.id;
      card.innerHTML = `
        <header>
          <h3>Stone Smelter</h3>
          <span class="badge">${smelter.id}</span>
        </header>
        <label>
          Recipe:
          <select data-id="${smelter.id}" data-role="recipe">
            <option value="iron" ${smelter.recipe === "iron" ? "selected" : ""}>Iron Plates</option>
            <option value="copper" ${smelter.recipe === "copper" ? "selected" : ""}>Copper Plates</option>
          </select>
        </label>
        <div class="status">
          <span class="${smelter.active ? "active" : "inactive"}">
            ${smelter.active ? "Active" : "Idle"} — Fuel ${smelter.fuel.toFixed(1)}
          </span>
        </div>
        <button data-id="${smelter.id}" data-role="fuel">Refuel with 10 Coal</button>
      `;
      this.smelterContainer.appendChild(card);
    }

    this.smelterContainer.querySelectorAll("select[data-role='recipe']").forEach((el) => {
      el.addEventListener("change", (event) => onRecipeChange(event.target.dataset.id, event.target.value));
    });
    this.smelterContainer.querySelectorAll("button[data-role='fuel']").forEach((button) => {
      button.addEventListener("click", (event) => onFuel(event.target.dataset.id));
    });
  }

  refreshDrillStatuses() {
    this.drillContainer.querySelectorAll(".machine-card").forEach((card) => {
      const id = card.dataset.id;
      const drill = this.gameState.drills.find((d) => d.id === id);
      if (!drill) return;
      const status = card.querySelector(".status span");
      if (status) {
        status.className = drill.active ? "active" : "inactive";
        status.textContent = `${drill.active ? "Active" : "Idle"} — Fuel ${drill.fuel.toFixed(1)}`;
      }
    });
  }

  refreshSmelterStatuses() {
    this.smelterContainer.querySelectorAll(".machine-card").forEach((card) => {
      const id = card.dataset.id;
      const smelter = this.gameState.smelters.find((s) => s.id === id);
      if (!smelter) return;
      const status = card.querySelector(".status span");
      if (status) {
        status.className = smelter.active ? "active" : "inactive";
        status.textContent = `${smelter.active ? "Active" : "Idle"} — Fuel ${smelter.fuel.toFixed(1)}`;
      }
    });
  }

  renderLog(entries) {
    this.logContainer.innerHTML = "";
    entries.slice(0, 20).forEach((entry) => {
      const li = document.createElement("li");
      li.className = "event-log-item";
      li.textContent = `t=${entry.time.toFixed(1)}s • ${entry.message}`;
      this.logContainer.appendChild(li);
    });
  }
}
