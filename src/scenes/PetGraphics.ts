/**
 * PetGraphics - Draws all game visuals using Phaser.GameObjects.Graphics
 * and generates textures for use with sprites / images.
 */

const CAT_COLOR = 0xff9944;
const CAT_DARK = 0xcc7722;
const CAT_EYE = 0x333333;
const CAT_PINK = 0xffaaaa;
const DOG_COLOR = 0xcc8833;
const DOG_DARK = 0x995522;
const DOG_EYE = 0x222222;
const DOG_PINK = 0xff9999;
const DOG_TONGUE = 0xff6666;

export function generateAllTextures(scene: Phaser.Scene): void {
  generateCatIdle(scene);
  generateCatAttack(scene);
  generateCatHit(scene);
  generateCatVictory(scene);
  generateCatDefeated(scene);
  generateDogIdle(scene);
  generateDogAttack(scene);
  generateDogHit(scene);
  generateDogVictory(scene);
  generateDogDefeated(scene);
  generateRockIcon(scene);
  generateScissorsIcon(scene);
  generatePaperIcon(scene);
  generateHeartIcon(scene);
}

// ============================================================
// CAT TEXTURES
// ============================================================

function generateCatIdle(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_idle')) return;
  const g = scene.add.graphics();
  // Body (circle)
  g.fillStyle(CAT_COLOR, 1);
  g.fillCircle(40, 50, 24);
  // Head (circle)
  g.fillCircle(40, 22, 18);
  // Ears (triangles)
  g.fillStyle(CAT_DARK, 1);
  g.fillTriangle(24, 12, 20, -2, 32, 6);
  g.fillTriangle(56, 12, 60, -2, 48, 6);
  // Inner ears
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(26, 10, 23, 1, 31, 7);
  g.fillTriangle(54, 10, 57, 1, 49, 7);
  // Eyes
  g.fillStyle(CAT_EYE, 1);
  g.fillCircle(32, 20, 3);
  g.fillCircle(48, 20, 3);
  // Eye shine
  g.fillStyle(0xffffff, 1);
  g.fillCircle(33, 19, 1);
  g.fillCircle(49, 19, 1);
  // Nose
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(38, 26, 42, 26, 40, 28);
  // Mouth
  g.lineStyle(1, CAT_EYE, 1);
  g.lineBetween(40, 28, 36, 32);
  g.lineBetween(40, 28, 44, 32);
  // Whiskers
  g.lineStyle(1, 0xcccccc, 0.6);
  g.lineBetween(22, 24, 10, 20);
  g.lineBetween(22, 26, 10, 26);
  g.lineBetween(22, 28, 10, 32);
  g.lineBetween(58, 24, 70, 20);
  g.lineBetween(58, 26, 70, 26);
  g.lineBetween(58, 28, 70, 32);
  // Legs
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(26, 66, 10, 14);
  g.fillRect(44, 66, 10, 14);
  // Paws
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(31, 80, 4);
  g.fillCircle(49, 80, 4);
  // Tail
  g.lineStyle(4, CAT_DARK, 1);
  g.beginPath();
  g.moveTo(60, 52);
  g.lineTo(72, 42);
  g.lineTo(76, 30);
  g.strokePath();
  g.generateTexture('cat_idle', 80, 84);
  g.destroy();
}

function generateCatAttack(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_attack')) return;
  const g = scene.add.graphics();
  // Body shifted forward
  g.fillStyle(CAT_COLOR, 1);
  g.fillCircle(48, 52, 24);
  // Head
  g.fillCircle(48, 24, 18);
  // Ears
  g.fillStyle(CAT_DARK, 1);
  g.fillTriangle(32, 14, 28, 0, 40, 8);
  g.fillTriangle(64, 14, 68, 0, 56, 8);
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(34, 12, 31, 3, 39, 9);
  g.fillTriangle(62, 12, 65, 3, 57, 9);
  // Eyes (fierce)
  g.fillStyle(CAT_EYE, 1);
  g.fillCircle(40, 22, 3);
  g.fillCircle(56, 22, 3);
  // Nose
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(46, 28, 50, 28, 48, 30);
  // Mouth open
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(48, 34, 3);
  // Extended paw (attacking)
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(60, 50, 20, 8);
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(80, 54, 5);
  // Claws
  g.lineStyle(1, 0xffffff, 0.8);
  g.lineBetween(80, 50, 82, 46);
  g.lineBetween(81, 54, 84, 54);
  g.lineBetween(80, 58, 82, 62);
  // Back legs
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(32, 68, 10, 14);
  g.fillRect(50, 68, 10, 14);
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(37, 82, 4);
  g.fillCircle(55, 82, 4);
  g.generateTexture('cat_attack', 90, 86);
  g.destroy();
}

function generateCatHit(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_hit')) return;
  const g = scene.add.graphics();
  // Body
  g.fillStyle(CAT_COLOR, 1);
  g.fillCircle(32, 54, 24);
  // Head tilted
  g.fillCircle(32, 26, 18);
  // Ears droopy
  g.fillStyle(CAT_DARK, 1);
  g.fillTriangle(16, 16, 10, 4, 24, 10);
  g.fillTriangle(48, 16, 54, 4, 40, 10);
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(18, 14, 13, 6, 23, 11);
  g.fillTriangle(46, 14, 51, 6, 41, 11);
  // X eyes (hurt)
  g.lineStyle(2, CAT_EYE, 1);
  g.lineBetween(24, 22, 30, 28);
  g.lineBetween(30, 22, 24, 28);
  g.lineBetween(38, 22, 44, 28);
  g.lineBetween(44, 22, 38, 28);
  // Sweat drop
  g.fillStyle(0x88ccff, 0.8);
  g.fillCircle(52, 16, 3);
  // Nose
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(30, 30, 34, 30, 32, 32);
  // Wavy mouth
  g.lineStyle(1, CAT_EYE, 1);
  g.beginPath();
  g.moveTo(28, 34);
  g.lineTo(32, 36);
  g.lineTo(36, 34);
  g.strokePath();
  // Legs
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(18, 68, 10, 14);
  g.fillRect(36, 68, 10, 14);
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(23, 82, 4);
  g.fillCircle(41, 82, 4);
  // Impact lines
  g.lineStyle(2, 0xff4444, 0.6);
  g.lineBetween(2, 10, 10, 18);
  g.lineBetween(0, 20, 8, 24);
  g.lineBetween(56, 4, 62, 10);
  g.generateTexture('cat_hit', 66, 86);
  g.destroy();
}

function generateCatVictory(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_victory')) return;
  const g = scene.add.graphics();
  // Body
  g.fillStyle(CAT_COLOR, 1);
  g.fillCircle(40, 48, 22);
  // Head
  g.fillCircle(40, 22, 18);
  // Ears perked
  g.fillStyle(CAT_DARK, 1);
  g.fillTriangle(24, 10, 20, -4, 32, 4);
  g.fillTriangle(56, 10, 60, -4, 48, 4);
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(26, 8, 23, -1, 31, 5);
  g.fillTriangle(54, 8, 57, -1, 49, 5);
  // Happy eyes (closed arcs)
  g.lineStyle(2, CAT_EYE, 1);
  g.beginPath();
  g.arc(32, 20, 4, Math.PI * 0.1, Math.PI * 0.9, false);
  g.strokePath();
  g.beginPath();
  g.arc(48, 20, 4, Math.PI * 0.1, Math.PI * 0.9, false);
  g.strokePath();
  // Nose
  g.fillStyle(CAT_PINK, 1);
  g.fillTriangle(38, 26, 42, 26, 40, 28);
  // Big smile
  g.lineStyle(1.5, CAT_EYE, 1);
  g.beginPath();
  g.arc(40, 30, 6, 0.2, Math.PI - 0.2, false);
  g.strokePath();
  // Arms up (victory)
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(14, 34, 8, 16);
  g.fillRect(58, 34, 8, 16);
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(18, 34, 5);
  g.fillCircle(62, 34, 5);
  // Legs
  g.fillStyle(CAT_COLOR, 1);
  g.fillRect(26, 60, 10, 14);
  g.fillRect(44, 60, 10, 14);
  g.fillStyle(CAT_PINK, 1);
  g.fillCircle(31, 74, 4);
  g.fillCircle(49, 74, 4);
  // Star particles (drawn as simple polygons)
  g.fillStyle(0xffff44, 1);
  g.beginPath();
  g.moveTo(4, 6); g.lineTo(6, 10); g.lineTo(10, 10); g.lineTo(7, 13); g.lineTo(8, 17);
  g.lineTo(4, 14); g.lineTo(0, 17); g.lineTo(1, 13); g.lineTo(-2, 10); g.lineTo(2, 10);
  g.closePath(); g.fillPath();
  g.beginPath();
  g.moveTo(72, 2); g.lineTo(74, 6); g.lineTo(78, 6); g.lineTo(75, 9); g.lineTo(76, 13);
  g.lineTo(72, 10); g.lineTo(68, 13); g.lineTo(69, 9); g.lineTo(66, 6); g.lineTo(70, 6);
  g.closePath(); g.fillPath();
  g.generateTexture('cat_victory', 80, 78);
  g.destroy();
}

function generateCatDefeated(scene: Phaser.Scene): void {
  if (scene.textures.exists('cat_defeated')) return;
  const g = scene.add.graphics();
  // Body slumped
  g.fillStyle(CAT_COLOR, 0.7);
  g.fillEllipse(40, 58, 50, 32);
  // Head down
  g.fillStyle(CAT_COLOR, 0.8);
  g.fillCircle(40, 38, 16);
  // Ears droopy
  g.fillStyle(CAT_DARK, 0.8);
  g.fillTriangle(24, 30, 18, 20, 30, 26);
  g.fillTriangle(56, 30, 62, 20, 50, 26);
  g.fillStyle(CAT_PINK, 0.8);
  g.fillTriangle(26, 28, 21, 22, 29, 26);
  g.fillTriangle(54, 28, 59, 22, 51, 26);
  // X eyes
  g.lineStyle(1.5, CAT_EYE, 0.8);
  g.lineBetween(32, 34, 38, 40);
  g.lineBetween(38, 34, 32, 40);
  g.lineBetween(44, 34, 50, 40);
  g.lineBetween(50, 34, 44, 40);
  // Sad mouth
  g.lineStyle(1, CAT_EYE, 0.8);
  g.beginPath();
  g.arc(40, 44, 4, Math.PI + 0.3, Math.PI * 2 - 0.3, true);
  g.strokePath();
  // Tear
  g.fillStyle(0x88ccff, 0.6);
  g.fillEllipse(30, 42, 2, 4);
  // Legs collapsed
  g.fillStyle(CAT_COLOR, 0.7);
  g.fillRect(24, 68, 14, 6);
  g.fillRect(42, 68, 14, 6);
  g.generateTexture('cat_defeated', 80, 76);
  g.destroy();
}

// ============================================================
// DOG TEXTURES
// ============================================================

function generateDogIdle(scene: Phaser.Scene): void {
  if (scene.textures.exists('dog_idle')) return;
  const g = scene.add.graphics();
  // Body
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(18, 40, 44, 32, 8);
  // Head
  g.fillCircle(40, 24, 20);
  // Floppy ears
  g.fillStyle(DOG_DARK, 1);
  g.fillEllipse(18, 24, 12, 22);
  g.fillEllipse(62, 24, 12, 22);
  // Eyes
  g.fillStyle(DOG_EYE, 1);
  g.fillCircle(32, 22, 3.5);
  g.fillCircle(48, 22, 3.5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(33, 21, 1.5);
  g.fillCircle(49, 21, 1.5);
  // Nose
  g.fillStyle(0x222222, 1);
  g.fillEllipse(40, 30, 8, 5);
  // Mouth
  g.lineStyle(1, DOG_EYE, 1);
  g.lineBetween(40, 33, 36, 36);
  g.lineBetween(40, 33, 44, 36);
  g.fillStyle(DOG_PINK, 1);
  g.fillCircle(38, 36, 2);
  g.fillCircle(42, 36, 2);
  // Legs
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(22, 66, 10, 14, 3);
  g.fillRoundedRect(48, 66, 10, 14, 3);
  g.fillStyle(0xcc8844, 1);
  g.fillEllipse(27, 80, 8, 4);
  g.fillEllipse(53, 80, 8, 4);
  // Tail
  g.lineStyle(4, DOG_COLOR, 1);
  g.beginPath();
  g.moveTo(18, 48);
  g.lineTo(6, 40);
  g.lineTo(4, 28);
  g.strokePath();
  g.generateTexture('dog_idle', 72, 84);
  g.destroy();
}

function generateDogAttack(scene: Phaser.Scene): void {
  if (scene.textures.exists('dog_attack')) return;
  const g = scene.add.graphics();
  // Body shifted forward
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(24, 44, 44, 30, 8);
  // Head forward
  g.fillCircle(50, 26, 20);
  // Ears
  g.fillStyle(DOG_DARK, 1);
  g.fillEllipse(30, 24, 12, 22);
  g.fillEllipse(70, 24, 12, 22);
  // Eyes fierce
  g.fillStyle(DOG_EYE, 1);
  g.fillCircle(42, 24, 3.5);
  g.fillCircle(58, 24, 3.5);
  // Angry eyebrows
  g.lineStyle(2, DOG_DARK, 1);
  g.lineBetween(38, 18, 46, 20);
  g.lineBetween(62, 18, 54, 20);
  // Nose
  g.fillStyle(0x222222, 1);
  g.fillEllipse(50, 32, 8, 5);
  // Mouth open (bark)
  g.fillStyle(DOG_PINK, 1);
  g.fillEllipse(50, 38, 8, 6);
  g.fillStyle(DOG_TONGUE, 1);
  g.fillEllipse(50, 42, 4, 6);
  // Front paws extended
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(58, 52, 16, 8, 3);
  g.fillStyle(0xcc8844, 1);
  g.fillEllipse(74, 56, 8, 4);
  // Back legs
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(28, 70, 10, 14, 3);
  g.fillRoundedRect(50, 70, 10, 14, 3);
  g.fillStyle(0xcc8844, 1);
  g.fillEllipse(33, 84, 8, 4);
  g.fillEllipse(55, 84, 8, 4);
  g.generateTexture('dog_attack', 86, 88);
  g.destroy();
}

function generateDogHit(scene: Phaser.Scene): void {
  if (scene.textures.exists('dog_hit')) return;
  const g = scene.add.graphics();
  // Body
  g.fillStyle(DOG_COLOR, 0.8);
  g.fillRoundedRect(14, 44, 40, 30, 8);
  // Head
  g.fillCircle(34, 26, 18);
  // Ears droopy
  g.fillStyle(DOG_DARK, 0.8);
  g.fillEllipse(14, 30, 10, 20);
  g.fillEllipse(54, 30, 10, 20);
  // X eyes
  g.lineStyle(2, DOG_EYE, 0.9);
  g.lineBetween(26, 22, 32, 28);
  g.lineBetween(32, 22, 26, 28);
  g.lineBetween(38, 22, 44, 28);
  g.lineBetween(44, 22, 38, 28);
  // Nose
  g.fillStyle(0x222222, 0.8);
  g.fillEllipse(34, 32, 7, 4);
  // Wavy mouth
  g.lineStyle(1, DOG_EYE, 0.8);
  g.beginPath();
  g.moveTo(30, 36);
  g.lineTo(34, 38);
  g.lineTo(38, 36);
  g.strokePath();
  // Sweat
  g.fillStyle(0x88ccff, 0.7);
  g.fillCircle(50, 16, 3);
  // Legs
  g.fillStyle(DOG_COLOR, 0.8);
  g.fillRoundedRect(18, 68, 10, 12, 3);
  g.fillRoundedRect(40, 68, 10, 12, 3);
  g.fillStyle(0xcc8844, 0.8);
  g.fillEllipse(23, 80, 8, 4);
  g.fillEllipse(45, 80, 8, 4);
  // Impact stars (drawn as simple polygons)
  g.fillStyle(0xffcc00, 0.7);
  g.beginPath();
  g.moveTo(2, 4); g.lineTo(4, 8); g.lineTo(8, 8); g.lineTo(5, 11); g.lineTo(6, 15);
  g.lineTo(2, 12); g.lineTo(-2, 15); g.lineTo(-1, 11); g.lineTo(-4, 8); g.lineTo(0, 8);
  g.closePath(); g.fillPath();
  g.beginPath();
  g.moveTo(64, 0); g.lineTo(66, 4); g.lineTo(70, 4); g.lineTo(67, 7); g.lineTo(68, 11);
  g.lineTo(64, 8); g.lineTo(60, 11); g.lineTo(61, 7); g.lineTo(58, 4); g.lineTo(62, 4);
  g.closePath(); g.fillPath();
  g.generateTexture('dog_hit', 68, 84);
  g.destroy();
}

function generateDogVictory(scene: Phaser.Scene): void {
  if (scene.textures.exists('dog_victory')) return;
  const g = scene.add.graphics();
  // Body
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(18, 38, 44, 30, 8);
  // Head
  g.fillCircle(40, 20, 20);
  // Ears perked
  g.fillStyle(DOG_DARK, 1);
  g.fillEllipse(18, 16, 10, 20);
  g.fillEllipse(62, 16, 10, 20);
  // Happy eyes (closed arcs)
  g.lineStyle(2, DOG_EYE, 1);
  g.beginPath();
  g.arc(32, 18, 4, Math.PI * 0.1, Math.PI * 0.9, false);
  g.strokePath();
  g.beginPath();
  g.arc(48, 18, 4, Math.PI * 0.1, Math.PI * 0.9, false);
  g.strokePath();
  // Nose
  g.fillStyle(0x222222, 1);
  g.fillEllipse(40, 26, 8, 5);
  // Big open mouth with tongue
  g.fillStyle(DOG_PINK, 1);
  g.fillEllipse(40, 34, 10, 6);
  g.fillStyle(DOG_TONGUE, 1);
  g.fillEllipse(40, 38, 6, 8);
  // Arms up
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(6, 30, 10, 16, 3);
  g.fillRoundedRect(64, 30, 10, 16, 3);
  g.fillStyle(0xcc8844, 1);
  g.fillEllipse(11, 30, 8, 4);
  g.fillEllipse(69, 30, 8, 4);
  // Legs
  g.fillStyle(DOG_COLOR, 1);
  g.fillRoundedRect(22, 60, 10, 14, 3);
  g.fillRoundedRect(48, 60, 10, 14, 3);
  g.fillStyle(0xcc8844, 1);
  g.fillEllipse(27, 74, 8, 4);
  g.fillEllipse(53, 74, 8, 4);
  // Tail wagging up
  g.lineStyle(4, DOG_COLOR, 1);
  g.beginPath();
  g.moveTo(18, 44);
  g.lineTo(4, 32);
  g.lineTo(2, 18);
  g.strokePath();
  g.generateTexture('dog_victory', 80, 78);
  g.destroy();
}

function generateDogDefeated(scene: Phaser.Scene): void {
  if (scene.textures.exists('dog_defeated')) return;
  const g = scene.add.graphics();
  // Body slumped
  g.fillStyle(DOG_COLOR, 0.7);
  g.fillEllipse(36, 56, 52, 30);
  // Head down
  g.fillStyle(DOG_COLOR, 0.8);
  g.fillCircle(36, 38, 17);
  // Ears droopy
  g.fillStyle(DOG_DARK, 0.8);
  g.fillEllipse(18, 40, 10, 18);
  g.fillEllipse(54, 40, 10, 18);
  // X eyes
  g.lineStyle(1.5, DOG_EYE, 0.8);
  g.lineBetween(28, 34, 34, 40);
  g.lineBetween(34, 34, 28, 40);
  g.lineBetween(40, 34, 46, 40);
  g.lineBetween(46, 34, 40, 40);
  // Nose
  g.fillStyle(0x222222, 0.7);
  g.fillEllipse(36, 44, 7, 4);
  // Sad mouth
  g.lineStyle(1.5, DOG_EYE, 0.8);
  g.beginPath();
  g.arc(36, 48, 4, Math.PI + 0.3, Math.PI * 2 - 0.3, true);
  g.strokePath();
  // Tear
  g.fillStyle(0x88ccff, 0.5);
  g.fillEllipse(24, 42, 2, 5);
  // Legs collapsed
  g.fillStyle(DOG_COLOR, 0.7);
  g.fillEllipse(22, 66, 14, 6);
  g.fillEllipse(48, 66, 14, 6);
  g.generateTexture('dog_defeated', 72, 74);
  g.destroy();
}

// ============================================================
// UI TEXTURES
// ============================================================

function generateRockIcon(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Fist
  g.fillStyle(0xddbb88, 1);
  g.fillCircle(20, 20, 16);
  g.fillRoundedRect(4, 12, 32, 22, 6);
  // Knuckle lines
  g.lineStyle(1, 0xbb9966, 0.5);
  g.lineBetween(10, 18, 16, 18);
  g.lineBetween(24, 18, 30, 18);
  g.lineBetween(10, 24, 16, 24);
  g.lineBetween(24, 24, 30, 24);
  // Thumb
  g.fillStyle(0xddbb88, 1);
  g.fillCircle(12, 30, 6);
  g.generateTexture('rock_icon', 40, 40);
  g.destroy();
}

function generateScissorsIcon(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xddbb88, 1);
  // Palm
  g.fillCircle(20, 26, 10);
  // Index finger
  g.fillRoundedRect(16, 4, 8, 22, 4);
  // Middle finger
  g.fillRoundedRect(24, 4, 8, 20, 4);
  // Ring and pinky curled
  g.fillRoundedRect(10, 22, 8, 12, 4);
  g.fillRoundedRect(4, 24, 8, 10, 4);
  g.generateTexture('scissors_icon', 40, 40);
  g.destroy();
}

function generatePaperIcon(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xddbb88, 1);
  // Palm
  g.fillRoundedRect(8, 16, 24, 20, 5);
  // Thumb
  g.fillRoundedRect(4, 16, 8, 14, 4);
  // Fingers spread
  g.fillRoundedRect(8, 0, 6, 20, 3);
  g.fillRoundedRect(15, -2, 6, 22, 3);
  g.fillRoundedRect(22, 0, 6, 20, 3);
  g.fillRoundedRect(28, 8, 6, 16, 3);
  g.generateTexture('paper_icon', 40, 40);
  g.destroy();
}

function generateHeartIcon(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0xff4466, 1);
  g.fillCircle(8, 8, 6);
  g.fillCircle(18, 8, 6);
  g.fillTriangle(2, 12, 24, 12, 13, 24);
  g.generateTexture('heart_icon', 26, 26);
  g.destroy();
}
