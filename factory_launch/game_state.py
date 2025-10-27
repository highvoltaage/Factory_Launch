"""Centralised game state for Factory Launch."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .constants import RESOURCE_TYPES
from .machines import CoalDrill, StoneSmelter
from .research import ResearchNode, TechTree
from .storage import Inventory, StorageChest


@dataclass
class GameState:
    """Represents the complete game state."""

    resources: Dict[str, float] = field(default_factory=lambda: {resource: 0.0 for resource in RESOURCE_TYPES})
    player_inventory: Inventory = field(default_factory=Inventory)
    storage_chests: List[StorageChest] = field(default_factory=list)
    drills: List[CoalDrill] = field(default_factory=list)
    smelters: List[StoneSmelter] = field(default_factory=list)
    tech_tree: Optional[TechTree] = None

    def __post_init__(self) -> None:
        self._init_default_storage()
        self._init_starting_machines()
        if self.tech_tree is None:
            self.tech_tree = self._create_default_tech_tree()

    def _init_default_storage(self) -> None:
        """Create empty starting storage chests."""

        self.storage_chests.append(StorageChest())

    def _init_starting_machines(self) -> None:
        for _ in range(2):
            drill = CoalDrill()
            drill.feed_coal(10)
            self.drills.append(drill)
        smelter = StoneSmelter()
        smelter.feed_coal(10)
        self.smelters.append(smelter)

    def _create_default_tech_tree(self) -> TechTree:
        starter_research = ResearchNode(
            key="starter",
            name="Coal Drills & Stone Smelter",
            requirements={"stone": 10, "coal": 10, "iron": 5},
            children=["automation"],
        )
        return TechTree([starter_research])

    def add_drill(self, drill: CoalDrill) -> None:
        self.drills.append(drill)

    def add_smelter(self, smelter: StoneSmelter) -> None:
        self.smelters.append(smelter)

    def total_inventory(self) -> Dict[str, float]:
        totals = defaultdict(float, self.resources)
        for container in [self.player_inventory, *self.storage_chests]:
            for resource, amount in container.items.items():
                totals[resource] += amount
        return dict(totals)

    def feed_coal_to_machines(self, coal_amount: float) -> None:
        per_machine = coal_amount / (len(self.drills) + len(self.smelters) or 1)
        for machine in [*self.drills, *self.smelters]:
            machine.feed_coal(per_machine)

    def _cluster_sizes(self) -> Dict[Optional[int], int]:
        sizes: Dict[Optional[int], int] = defaultdict(int)
        for drill in self.drills:
            if drill.cluster_id is None:
                continue
            sizes[drill.cluster_id] += 1
        return sizes

    def tick(self, seconds: float) -> None:
        cluster_sizes = self._cluster_sizes()
        for drill in self.drills:
            output = drill.tick(seconds, cluster_sizes)
            if output:
                self.resources[drill.resource] += output
        for smelter in self.smelters:
            available_inputs = {resource: self.resources.get(resource, 0.0) for resource in RESOURCE_TYPES}
            outputs, consumed = smelter.tick(seconds, available_inputs)
            if outputs:
                for resource, amount in outputs.items():
                    self.resources[resource] = self.resources.get(resource, 0.0) + amount
                input_resource = smelter.input_resource
                if input_resource:
                    self.resources[input_resource] = max(
                        0.0, self.resources.get(input_resource, 0.0) - consumed
                    )

    def start_research(self, key: str) -> bool:
        if not self.tech_tree:
            return False
        node = self.tech_tree.get(key)
        if not node:
            return False
        inventory = self.total_inventory()
        requirements = dict(node.requirements)
        if node.complete(inventory):
            remaining = dict(requirements)
            for container in [self.player_inventory, *self.storage_chests]:
                for resource, needed in list(remaining.items()):
                    if needed <= 0:
                        continue
                    removed = container.remove(resource, needed)
                    remaining[resource] -= removed
            for resource, needed in remaining.items():
                if needed > 0:
                    available = self.resources.get(resource, 0.0)
                    consumed = min(available, needed)
                    self.resources[resource] = available - consumed
            return True
        return False

    def describe(self) -> str:
        parts = ["Resources:"]
        for resource, amount in sorted(self.resources.items()):
            parts.append(f"  {resource}: {amount:.1f}")
        parts.append("\nDrills:")
        for idx, drill in enumerate(self.drills, start=1):
            parts.append(
                f"  Drill {idx}: resource={drill.resource} coal={drill.coal_buffer:.1f} cluster={drill.cluster_id}"
            )
        parts.append("\nSmelters:")
        for idx, smelter in enumerate(self.smelters, start=1):
            parts.append(
                f"  Smelter {idx}: recipe={smelter.input_resource} coal={smelter.coal_buffer:.1f}"
            )
        parts.append("\nResearch:")
        if self.tech_tree:
            for node in self.tech_tree.nodes.values():
                state = "Unlocked" if node.unlocked else "Locked"
                parts.append(f"  {node.name}: {state}")
        return "\n".join(parts)
