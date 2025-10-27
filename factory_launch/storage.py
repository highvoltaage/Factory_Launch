"""Inventory and storage implementations."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from .constants import CHEST_STACK_LIMIT, PLAYER_STACK_LIMIT


@dataclass
class Inventory:
    """Represents the player's inventory with stack limits."""

    stack_limit: int = PLAYER_STACK_LIMIT
    items: Dict[str, int] = field(default_factory=dict)

    def add(self, resource: str, amount: int) -> int:
        """Add a resource to the inventory.

        Returns the amount that could not be stored due to stack limits.
        """

        if amount < 0:
            raise ValueError("Amount to add must be non-negative")
        current = self.items.get(resource, 0)
        capacity = self.stack_limit
        new_total = min(capacity, current + amount)
        self.items[resource] = new_total
        return amount - (new_total - current)

    def remove(self, resource: str, amount: int) -> int:
        """Remove a resource and return the amount actually removed."""

        if amount < 0:
            raise ValueError("Amount to remove must be non-negative")
        current = self.items.get(resource, 0)
        removed = min(current, amount)
        if removed:
            self.items[resource] = current - removed
        return removed

    def has(self, resource: str, amount: int) -> bool:
        return self.items.get(resource, 0) >= amount


@dataclass
class StorageChest(Inventory):
    """A storage chest with a larger stack limit."""

    stack_limit: int = CHEST_STACK_LIMIT
