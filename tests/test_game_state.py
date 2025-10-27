import math

from factory_launch import GameState
from factory_launch.constants import (
    COAL_DRILL_OUTPUT_PER_SECOND,
    PLAYER_STACK_LIMIT,
)
from factory_launch.machines import CoalDrill, StoneSmelter


def test_initial_state_has_resources_and_machines():
    state = GameState()
    assert len(state.drills) == 2
    assert len(state.smelters) == 1
    chest = state.storage_chests[0]
    for resource in ("stone", "coal", "iron", "copper"):
        assert chest.items[resource] == 100
    for product in ("iron_plates", "copper_plates"):
        assert chest.items[product] == 50


def test_drill_output_scales_with_cluster():
    state = GameState()
    drill = CoalDrill(resource="iron", cluster_id=1)
    drill.feed_coal(10)
    state.drills = [drill]
    state.tick(1.0)
    assert state.resources["iron"] == COAL_DRILL_OUTPUT_PER_SECOND

    # Add 3 more drills to form a 2x2 cluster (size 4) doubling output
    for _ in range(3):
        extra = CoalDrill(resource="iron", cluster_id=1)
        extra.feed_coal(10)
        state.add_drill(extra)
    state.resources["iron"] = 0
    state.tick(1.0)
    expected_total = COAL_DRILL_OUTPUT_PER_SECOND * math.sqrt(4) * 4
    assert math.isclose(state.resources["iron"], expected_total)


def test_smelter_consumes_inputs_and_produces_outputs():
    state = GameState()
    smelter = StoneSmelter()
    smelter.set_recipe("stone")
    smelter.feed_coal(10)
    state.smelters = [smelter]
    state.drills = []
    state.resources["stone"] = 10
    state.tick(5.0)
    assert state.resources["stone"] < 10
    assert state.resources["iron_plates"] > 0


def test_research_consumes_required_resources():
    state = GameState()
    # move required resources into inventory to simplify accounting
    chest = state.storage_chests[0]
    for resource, amount in {"stone": 10, "coal": 10, "iron": 5}.items():
        chest.remove(resource, amount)
        state.player_inventory.add(resource, amount)
    assert state.start_research("starter")
    assert state.tech_tree.unlocked("starter")
    for resource in ("stone", "coal", "iron"):
        assert not state.player_inventory.has(resource, 1)


def test_inventory_stack_limit():
    state = GameState()
    overflow = state.player_inventory.add("stone", PLAYER_STACK_LIMIT + 25)
    assert state.player_inventory.items["stone"] == PLAYER_STACK_LIMIT
    assert overflow == 25
