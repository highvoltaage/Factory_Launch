"""Research system for unlocking technologies."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional


@dataclass
class ResearchNode:
    """Represents a research node with resource requirements."""

    key: str
    name: str
    requirements: Dict[str, int]
    unlocked: bool = False
    children: List[str] = field(default_factory=list)

    def can_start(self, inventory: Dict[str, int]) -> bool:
        return all(inventory.get(resource, 0) >= amount for resource, amount in self.requirements.items())

    def complete(self, inventory: Dict[str, int]) -> bool:
        if not self.can_start(inventory):
            return False
        for resource, amount in self.requirements.items():
            inventory[resource] = inventory.get(resource, 0) - amount
        self.unlocked = True
        return True


class TechTree:
    """A simple tech tree managing research nodes."""

    def __init__(self, nodes: Iterable[ResearchNode]):
        self.nodes = {node.key: node for node in nodes}

    def unlocked(self, key: str) -> bool:
        node = self.nodes.get(key)
        return bool(node and node.unlocked)

    def get(self, key: str) -> Optional[ResearchNode]:
        return self.nodes.get(key)

    def available_nodes(self) -> List[ResearchNode]:
        return [node for node in self.nodes.values() if not node.unlocked]
