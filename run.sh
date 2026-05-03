#!/bin/bash
# =============================================================================
# Run OpenGame Agent for 心口不一 (Bluffing RPS Battle Game)
# =============================================================================
set -e
cd /Users/yuminghao/Work/bluffing

# Load API config
set -a
source .env
set +a

# Print provider status
echo "=== OpenGame Configuration ==="
echo "Agent LLM:   ${OPENAI_MODEL} @ ${OPENAI_BASE_URL}"
echo "Reasoning:   ${OPENGAME_REASONING_MODEL} @ ${OPENGAME_REASONING_BASE_URL}"
echo "Image Gen:   ${OPENGAME_IMAGE_PROVIDER:-DISABLED (procedural placeholders)}"
echo "Templates:   ${GAME_TEMPLATES_DIR}"
echo "Docs:        ${GAME_DOCS_DIR}"
echo "==============================="
echo ""

# Run the agent
opengame \
  -m "deepseek-chat" \
  --yolo \
  -p "Create a 2D bluffing battle game called 'Heart vs Mouth' (心口不一). Two cute pixel-art pets face each other in a rock-paper-scissors duel with a psychological twist.

CORE MECHANIC:
- Each round has two phases: DECLARE (宣称) and REVEAL (出招)
- DECLARE phase: Player selects what move they CLAIM they'll play (Rock/Scissors/Paper). The AI opponent also shows a declaration bubble.
- REVEAL phase: Player selects what move they ACTUALLY play. This CAN differ from the declaration - that's the bluff!
- Win/loss is based on ACTUAL moves using standard RPS rules: Rock > Scissors > Paper > Rock
- AI opponent also bluffs with varying strategies (sometimes honest, sometimes fake)

VISUALS:
- Two cute animal characters (cat vs dog) facing each other from left and right on screen
- Each pet has animated states: idle (breathing), taunt/declare (bouncing), attack (lunging forward), hit (flinching), win (celebrating), lose (sad)
- Health bars above each pet (5 HP each)
- Score counter at top

UI:
- Phase indicator text at top center
- Three large buttons at bottom for selecting moves: Rock ✊, Scissors ✌️, Paper ✋
- Opponent's declaration shown in a speech bubble above the opponent character
- After reveal: dramatic countdown 3..2..1.. before both moves are shown
- Result popup showing both declared and actual moves

GAME FEEL:
- Screen shake when a pet takes damage
- Particle burst effect on victory
- Sound effects for: button click, declaration, countdown, hit, victory
- The pets should have simple but expressive Spine-like 2D skeletal animation (use tweens on body parts: head bob, arm swing, tail wag)

GAME FLOW:
1. Title screen with game name and Start button
2. DECLARE phase: Player picks their declared move
3. AI picks and shows its declaration in speech bubble
4. REVEAL phase: Player picks their actual move
5. Countdown 3-2-1
6. Both actual moves revealed, damage dealt
7. Repeat until one pet reaches 0 HP
8. Victory/Defeat screen with score summary"

echo ""
echo "=== Agent finished ==="
