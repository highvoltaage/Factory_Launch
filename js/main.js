import { GameState } from "./gameState.js";
import { UIController } from "./ui.js";

const gameState = new GameState();
const ui = new UIController(gameState);
let placementMode = null;

function getBuildCounts() {
  return {
    drills: gameState.unplacedDrills().length,
    smelters: gameState.unplacedSmelters().length
  };
}

function updatePlacementMode(mode) {
  placementMode = mode;
  ui.updatePlacementButtons(mode);
  const counts = getBuildCounts();
  ui.renderPlacementIndicator(mode, counts);
  ui.renderBuildCounts(counts);
  ui.renderWorld({ placementMode: mode });
}

function refreshInterface() {
  const counts = getBuildCounts();
  ui.renderWorld({ placementMode });
  ui.renderInventory();
  ui.renderStorage();
  ui.renderResearch();
  ui.renderDrills(handleDrillFuel);
  ui.renderSmelters(handleSmelterRecipeChange, handleSmelterFuel);
  ui.renderBuildCounts(counts);
  ui.renderPlacementIndicator(placementMode, counts);
  ui.updatePlacementButtons(placementMode);
  ui.renderLog(gameState.log);
}

function handleTileClick(x, y) {
  let acted = false;
  if (placementMode === "drill") {
    acted = gameState.placeDrillAt(x, y);
    if (acted && gameState.unplacedDrills().length === 0) {
      updatePlacementMode(null);
    }
  } else if (placementMode === "smelter") {
    acted = gameState.placeSmelterAt(x, y);
    if (acted && gameState.unplacedSmelters().length === 0) {
      updatePlacementMode(null);
    }
  } else {
    acted = gameState.gatherFromTile(x, y);
  }

  const tile = gameState.world.getTile(x, y);
  ui.showTileInfo(tile);

  if (acted) {
    refreshInterface();
  } else {
    const counts = getBuildCounts();
    ui.renderPlacementIndicator(placementMode, counts);
    ui.renderBuildCounts(counts);
    ui.renderWorld({ placementMode });
  }
}

function handleSelectBuild(mode) {
  if (placementMode === mode) {
    updatePlacementMode(null);
    return;
  }
  if (mode === "drill" && gameState.unplacedDrills().length === 0) {
    return;
  }
  if (mode === "smelter" && gameState.unplacedSmelters().length === 0) {
    return;
  }
  updatePlacementMode(mode);
}

function handleCancelPlacement() {
  updatePlacementMode(null);
}

function handleDrillFuel(id) {
  const drill = gameState.drills.find((d) => d.id === id);
  if (!drill) return;
  if (gameState.addFuelToMachine(drill, 10)) {
    refreshInterface();
  }
}

function handleSmelterRecipeChange(id, recipe) {
  const smelter = gameState.smelters.find((s) => s.id === id);
  if (!smelter) return;
  smelter.setRecipe(recipe);
  gameState.addLog(`Configured ${id} to craft ${recipe === "iron" ? "Iron" : "Copper"} Plates.`);
  ui.renderLog(gameState.log);
}

function handleSmelterFuel(id) {
  const smelter = gameState.smelters.find((s) => s.id === id);
  if (!smelter) return;
  if (gameState.addFuelToMachine(smelter, 10)) {
    refreshInterface();
  }
}

ui.bindWorldInteractions({
  onTileClick: handleTileClick,
  onSelectBuild: handleSelectBuild,
  onCancel: handleCancelPlacement
});

document.getElementById("contribute-research").addEventListener("click", () => {
  if (gameState.contributeToResearch()) {
    refreshInterface();
  } else {
    ui.renderLog(gameState.log);
  }
});

function tick() {
  gameState.tick(1);
  refreshInterface();
  setTimeout(tick, 1000);
}

refreshInterface();
setTimeout(tick, 1000);
