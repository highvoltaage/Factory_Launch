"""Machine implementations for Factory Launch."""

from __future__ import annotations

from dataclasses import dataclass, field
from math import sqrt
from typing import Dict, Optional, Tuple

from .constants import (
    COAL_DRILL_COAL_PER_SECOND,
    COAL_DRILL_OUTPUT_PER_SECOND,
    SMELTER_COAL_PER_SECOND,
    SMELTER_OUTPUT_PER_SECOND,
    SMELTER_RECIPES,
)


@dataclass
class Machine:
    """Base machine with coal consumption logic."""

    coal_buffer: float = 0.0

    def feed_coal(self, amount: float) -> None:
        if amount < 0:
            raise ValueError("Cannot feed negative coal")
        self.coal_buffer += amount

    def consume_coal(self, amount: float) -> bool:
        if self.coal_buffer >= amount:
            self.coal_buffer -= amount
            return True
        return False


@dataclass
class CoalDrill(Machine):
    """A coal-powered drill that mines a single resource."""

    resource: str = "stone"
    cluster_id: Optional[int] = None
    base_output_per_second: float = COAL_DRILL_OUTPUT_PER_SECOND
    coal_per_second: float = COAL_DRILL_COAL_PER_SECOND

    def effective_output(self, cluster_sizes: Dict[Optional[int], int]) -> float:
        size = cluster_sizes.get(self.cluster_id, 1)
        multiplier = sqrt(size)
        return self.base_output_per_second * multiplier

    def tick(self, seconds: float, cluster_sizes: Dict[Optional[int], int]) -> float:
        required_coal = self.coal_per_second * seconds
        if not self.consume_coal(required_coal):
            return 0.0
        return self.effective_output(cluster_sizes) * seconds


@dataclass
class StoneSmelter(Machine):
    """Processes raw materials into plates using coal."""

    input_resource: Optional[str] = None
    output_buffer: Dict[str, float] = field(default_factory=dict)
    coal_per_second: float = SMELTER_COAL_PER_SECOND
    output_per_second: float = SMELTER_OUTPUT_PER_SECOND

    def set_recipe(self, resource: Optional[str]) -> None:
        if resource is not None and resource not in SMELTER_RECIPES:
            raise ValueError(f"Unsupported resource: {resource}")
        self.input_resource = resource

    def tick(
        self, seconds: float, available_inputs: Dict[str, float]
    ) -> Tuple[Dict[str, float], float]:
        if self.input_resource is None:
            return {}, 0.0
        required_coal = self.coal_per_second * seconds
        if not self.consume_coal(required_coal):
            return {}, 0.0
        recipe = SMELTER_RECIPES.get(self.input_resource)
        if not recipe:
            return {}, 0.0
        total_input_needed = self.output_per_second * seconds
        available_amount = available_inputs.get(self.input_resource, 0.0)
        processed = min(total_input_needed, available_amount)
        if processed <= 0:
            return {}, 0.0
        ratio = processed / total_input_needed if total_input_needed else 0
        outputs: Dict[str, float] = {}
        for product, quantity in recipe.items():
            outputs[product] = quantity * ratio * self.output_per_second * seconds
        return outputs, processed
