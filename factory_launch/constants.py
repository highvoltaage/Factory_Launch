"""Game balance constants."""

COAL_DRILL_COAL_PER_SECOND = 0.1  # 1 coal per 10 seconds
COAL_DRILL_OUTPUT_PER_SECOND = 1.0

SMELTER_COAL_PER_SECOND = 0.2  # 1 coal per 5 seconds
SMELTER_OUTPUT_PER_SECOND = 1.0

PLAYER_STACK_LIMIT = 50
CHEST_STACK_LIMIT = 999

RESOURCE_TYPES = (
    "stone",
    "coal",
    "iron",
    "copper",
    "iron_plates",
    "copper_plates",
)

SMELTER_RECIPES = {
    "stone": {"iron_plates": 1},
    "iron": {"iron_plates": 1},
    "copper": {"copper_plates": 1},
}
