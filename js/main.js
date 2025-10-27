import { RESOURCE_LABELS } from "./constants.js";
import { GameState } from "./gameState.js";
import { UIController } from "./ui.js";

const gameState = new GameState();
const ui = new UIController(gameState);

gameState.onLog = () => ui.renderLog(gameState.log);

ui.bindGatherButtons((resource) => {
  gameState.gather(resource);
  ui.renderInventory();
  ui.renderResearch();
  ui.renderStorage();
  ui.renderLog(gameState.log);
});

const contributeButton = document.getElementById("contribute-research");
contributeButton.addEventListener("click", () => {
  gameState.contributeToResearch();
  ui.renderInventory();
  ui.renderResearch();
  ui.renderDrills(handleDrillResourceChange, handleDrillFuel, handleDrillClusterChange);
  ui.renderSmelters(handleSmelterRecipeChange, handleSmelterFuel);
  ui.renderLog(gameState.log);
});

function handleDrillResourceChange(id, resource) {
  const drill = gameState.drills.find((d) => d.id === id);
  if (!drill) return;
  drill.setResource(resource);
  gameState.addLog(`Configured ${id} to mine ${RESOURCE_LABELS[resource] ?? resource}.`);
  ui.renderLog(gameState.log);
}

function handleDrillClusterChange(id, clusterSize) {
  const drill = gameState.drills.find((d) => d.id === id);
  if (!drill) return;
  drill.setClusterSize(clusterSize);
  const size = Math.sqrt(clusterSize);
  gameState.addLog(`Updated ${id} cluster to ${size}x${size}.`);
  ui.renderLog(gameState.log);
}

function handleDrillFuel(id) {
  const drill = gameState.drills.find((d) => d.id === id);
  if (!drill) return;
  if (gameState.addFuelToMachine(drill, 10)) {
    ui.renderDrills(handleDrillResourceChange, handleDrillFuel, handleDrillClusterChange);
    ui.renderInventory();
    ui.renderLog(gameState.log);
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
    ui.renderSmelters(handleSmelterRecipeChange, handleSmelterFuel);
    ui.renderInventory();
    ui.renderLog(gameState.log);
  }
}

function tick() {
  gameState.tick(1);
  ui.renderInventory();
  ui.renderStorage();
  ui.renderDrills(handleDrillResourceChange, handleDrillFuel, handleDrillClusterChange);
  ui.renderSmelters(handleSmelterRecipeChange, handleSmelterFuel);
  setTimeout(tick, 1000);
}

ui.renderInventory();
ui.renderStorage();
ui.renderResearch();
ui.renderDrills(handleDrillResourceChange, handleDrillFuel, handleDrillClusterChange);
ui.renderSmelters(handleSmelterRecipeChange, handleSmelterFuel);
ui.renderLog(gameState.log);

setTimeout(tick, 1000);
