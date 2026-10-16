/**
 * Cyber Slash - Fast-paced Cyberpunk Arcade Runner
 * Full game loop, physics, parallax renderer, enemy spawning, and start.ng integration.
 */

import { fetchPlayer, submitScore, fetchLeaderboard, redirectToSignIn } from "./startng.js";
import { drawCharacter } from "./character.js";
import * as Audio from "./audio.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player Profile Card DOM Elements
const playerCardEl = document.getElementById("player-card");
const playerFaceEl = document.getElementById("player-face");
const playerNameEl = document.getElementById("player-name");
const playerAccountEl = document.getElementById("player-account");
const playerSignInBtn = document.getElementById("player-sign-in");

// UI Overlay Elements
const hudEl = document.getElementById("hud");
const scoreValEl = document.getElementById("hud-score");
const distanceValEl = document.getElementById("hud-distance");
const slashesValEl = document.getElementById("hud-slashes");
const comboValEl = document.getElementById("hud-combo");
const muteBtn = document.getElementById("mute-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");

// Modals
const gameOverModal = document.getElementById("game-over-modal");
const finalScoreEl = document.getElementById("final-score");
const finalSlashesEl = document.getElementById("final-slashes");
const finalDistanceEl = document.getElementById("final-distance");
const rankNoticeEl = document.getElementById("rank-notice");
const restartBtn = document.getElementById("restart-btn");

const leaderboardModal = document.getElementById("leaderboard-modal");
const leaderboardListEl = document.getElementById("leaderboard-list");
const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");

// Responsive Canvas Size
let width = 0;
let height = 0;
let floorY = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  floorY = height - Math.max(90, Math.floor(height * 0.2));
}
window.addEventListener("resize", resize);
resize();

// Game State
let gameState = "START"; // "START" | "PLAYING" | "GAMEOVER"
let playerInfo = null;
let lastTime = 0;
let globalAnimTime = 0;

// Run Stats
let score = 0;
let distance = 0;
let slashes = 0;
let combo = 1;
let comboTimer = 0;
let baseSpeed = 380;
let currentSpeed = 380;

// Player Entity
const player = {
  x: 120,
  y: 0,
  width: 52,
  height: 70,
  vy: 0,
  isGrounded: false,
  jumpCount: 0,
  maxJumps: 2,
  isSlashing: false,
  slashTime: 0,
  slashDuration: 0.22,
};

// World Entities
let enemies = [];
let orbs = [];
let particles = [];
let spawnTimer = 0;
let orbSpawnTimer = 0;

// Parallax City Buildings
const cityLayers = [
  { speed: 0.1, color: "#130924", buildings: [] },
  { speed: 0.35, color: "#220e42", buildings: [] },
  { speed: 0.7, color: "#36166b", buildings: [] },
];

function initCity() {
  cityLayers.forEach((layer) => {
    layer.buildings = [];
    let x = 0;
    while (x < width + 300) {
      const bWidth = 60 + Math.random() * 80;
      const bHeight = 80 + Math.random() * (floorY * 0.65);
      layer.buildings.push({ x, width: bWidth, height: bHeight });
      x += bWidth + (10 + Math.random() * 20);
    }
  });
}
initCity();

// Initialize Player Identity from start.ng
async function initPlayer() {
  const data = await fetchPlayer();
  playerInfo = data.player;

  if (playerCardEl) {
    if (playerInfo.face) {
      playerFaceEl.src = playerInfo.face;
      playerFaceEl.style.display = "block";
    } else {
      playerFaceEl.style.display = "none";
    }
    playerNameEl.textContent = playerInfo.name || "Runner";
    playerAccountEl.textContent = data.user?.account ? `@${data.user.account}` : "Guest";
    playerSignInBtn.hidden = !data.isGuest;
    playerCardEl.hidden = false;
  }
}
initPlayer();
window.addEventListener("focus", initPlayer);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) initPlayer();
});

if (playerSignInBtn) {
  playerSignInBtn.onclick = () => redirectToSignIn();
}

// Controls
function triggerJump() {
  if (gameState !== "PLAYING") return;
  if (player.jumpCount < player.maxJumps) {
    player.vy = -680;
    player.jumpCount++;
    player.isGrounded = false;
    Audio.playJump();
    createJumpSparks(player.x + player.width / 2, player.y + player.height);
  }
}

function triggerSlash() {
  if (gameState !== "PLAYING") return;
  if (!player.isSlashing) {
    player.isSlashing = true;
    player.slashTime = 0;
    Audio.playSlash();
    checkSlashHits();
  }
}

// Keyboard input
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    e.preventDefault();
    if (gameState === "START") {
      startGame();
    } else if (gameState === "PLAYING") {
      triggerJump();
    } else if (gameState === "GAMEOVER") {
      resetGame();
    }
  } else if (e.code === "KeyJ" || e.code === "KeyZ" || e.code === "KeyX" || e.code === "KeyF") {
    e.preventDefault();
    if (gameState === "PLAYING") {
      triggerSlash();
    }
  }
});

// Touch / Mouse controls
canvas.addEventListener("pointerdown", (e) => {
  if (gameState === "START") {
    startGame();
    return;
  }
  if (gameState === "GAMEOVER") {
    return;
  }

  // Left side of screen = Jump; Right side = Slash
  const touchX = e.clientX;
  if (touchX < width * 0.45) {
    triggerJump();
  } else {
    triggerSlash();
  }
});

// Mute toggle
if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    const muted = !Audio.getMuted();
    Audio.setMuted(muted);
    muteBtn.textContent = muted ? "🔇" : "🔊";
  });
}

// Leaderboard Modal
document.querySelectorAll(".leaderboard-trigger-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    showLeaderboard();
  });
});

const startBtn = document.getElementById("start-btn");
if (startBtn) {
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
  });
}

if (closeLeaderboardBtn) {
  closeLeaderboardBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    leaderboardModal.hidden = true;
  });
}

async function showLeaderboard() {
  leaderboardModal.hidden = false;
  leaderboardListEl.innerHTML = `<li class="loading">Loading top runners…</li>`;
  const entries = await fetchLeaderboard(10);
  if (!entries || entries.length === 0) {
    leaderboardListEl.innerHTML = `<li class="empty">No runs recorded yet. Be the first!</li>`;
    return;
  }
  leaderboardListEl.innerHTML = entries
    .map(
      (e) => `
    <li class="${playerInfo && e.player_id === playerInfo.id ? "current-player" : ""}">
      <span class="rank">#${e.rank}</span>
      <span class="name">${escapeHtml(e.name || "Runner")}</span>
      <span class="stats">${(e.score || 0).toLocaleString()} pts · ${e.stats?.slashes ?? 0} slashes</span>
    </li>
  `,
    )
    .join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
}

// Game Flow
function startGame() {
  gameState = "PLAYING";
  document.getElementById("start-screen").hidden = true;
  hudEl.hidden = false;
  Audio.startMusic();
  resetGameVars();
}

function resetGameVars() {
  score = 0;
  distance = 0;
  slashes = 0;
  combo = 1;
  comboTimer = 0;
  currentSpeed = baseSpeed;
  player.y = floorY - player.height;
  player.vy = 0;
  player.jumpCount = 0;
  player.isGrounded = true;
  player.isSlashing = false;
  enemies = [];
  orbs = [];
  particles = [];
  spawnTimer = 0.8;
  orbSpawnTimer = 0.5;
}

function resetGame() {
  gameOverModal.hidden = true;
  startGame();
}

if (restartBtn) {
  restartBtn.onclick = resetGame;
}

// Slashing mechanics
function checkSlashHits() {
  const slashHitbox = {
    x: player.x,
    y: player.y - 20,
    width: player.width + 75,
    height: player.height + 40,
  };

  let slashedAny = false;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    if (rectOverlap(slashHitbox, en)) {
      slashedAny = true;
      enemies.splice(i, 1);
      slashes++;
      combo = Math.min(10, combo + 1);
      comboTimer = 2.4;
      const pts = 250 * combo;
      score += pts;

      Audio.playHit();
      createExplosion(en.x + en.width / 2, en.y + en.height / 2, en.color);
      createFloatingText(`+${pts} (x${combo})`, en.x, en.y - 10, "#00f0ff");
    }
  }

  if (slashedAny) {
    // Slight air stall on successful slash for cinematic feel
    if (!player.isGrounded) {
      player.vy = -180;
    }
  }
}

// Overlap Helper
function rectOverlap(r1, r2) {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

// Particles & VFX
function createExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 300;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color: color || "#ff007f",
      alpha: 1,
      life: 0.4 + Math.random() * 0.3,
    });
  }
}

function createJumpSparks(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 160,
      vy: -Math.random() * 80,
      size: 2.5,
      color: "#00f0ff",
      alpha: 0.8,
      life: 0.25,
    });
  }
}

let floatingTexts = [];
function createFloatingText(text, x, y, color) {
  floatingTexts.push({ text, x, y, color, vy: -50, alpha: 1, life: 0.8 });
}

// Game Over Handling
async function handleGameOver() {
  gameState = "GAMEOVER";
  Audio.stopMusic();
  Audio.playGameOver();

  finalScoreEl.textContent = Math.floor(score).toLocaleString();
  finalSlashesEl.textContent = slashes.toLocaleString();
  finalDistanceEl.textContent = `${Math.floor(distance)} m`;
  rankNoticeEl.textContent = "Saving your run to start.ng…";
  gameOverModal.hidden = false;

  const runStats = {
    score: Math.floor(score),
    slashes,
    distance: Math.floor(distance),
  };

  const res = await submitScore(runStats);
  if (res.ok && res.result) {
    const r = res.result;
    if (r.improved) {
      rankNoticeEl.innerHTML = `🌟 <strong>New Best!</strong> You are ranked <strong>#${r.rank}</strong> on start.ng!`;
    } else {
      rankNoticeEl.innerHTML = `Great run! Current rank: <strong>#${r.rank}</strong> (Best: ${r.best.toLocaleString()})`;
    }
  } else {
    rankNoticeEl.innerHTML = `<button id="guest-save-btn" class="sign-btn">Sign in with start.ng to join the leaderboard</button>`;
    const btn = document.getElementById("guest-save-btn");
    if (btn) btn.onclick = () => redirectToSignIn();
  }
}

// Main Game Update & Render
function gameLoop(time) {
  requestAnimationFrame(gameLoop);
  if (!lastTime) {
    lastTime = time;
    return;
  }
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  globalAnimTime += dt;

  update(dt);
  render();
}

function update(dt) {
  if (gameState !== "PLAYING") return;

  // Escalate speed over time
  distance += (currentSpeed * dt) / 10;
  score += Math.floor(dt * 30 * combo);
  currentSpeed = baseSpeed + Math.min(450, distance * 0.4);

  // Update combo decay
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 1;
    }
  }

  // Update Player Physics
  player.vy += 1750 * dt; // Gravity
  player.y += player.vy * dt;

  if (player.y >= floorY - player.height) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.isGrounded = true;
    player.jumpCount = 0;
  }

  // Slash timer
  if (player.isSlashing) {
    player.slashTime += dt;
    if (player.slashTime >= player.slashDuration) {
      player.isSlashing = false;
    }
  }

  // Spawning Enemies (Drones & Spires)
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const isFlying = Math.random() > 0.45;
    if (isFlying) {
      // Cyber Drone
      enemies.push({
        type: "drone",
        x: width + 30,
        y: floorY - 60 - Math.random() * 85,
        width: 38,
        height: 32,
        color: "#ff0055",
        pulse: Math.random() * Math.PI,
      });
    } else {
      // Barrier Spire
      enemies.push({
        type: "spire",
        x: width + 30,
        y: floorY - 50,
        width: 26,
        height: 50,
        color: "#ff5500",
      });
    }
    spawnTimer = 1.3 - Math.min(0.7, distance * 0.0006) + Math.random() * 0.5;
  }

  // Spawning Data Orbs
  orbSpawnTimer -= dt;
  if (orbSpawnTimer <= 0) {
    orbs.push({
      x: width + 20,
      y: floorY - 50 - Math.random() * 90,
      radius: 10,
    });
    orbSpawnTimer = 1.5 + Math.random() * 1.8;
  }

  // Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    en.x -= currentSpeed * dt;

    if (en.type === "drone") {
      en.pulse += dt * 5;
      en.y += Math.sin(en.pulse) * 0.6;
    }

    // Player collision with enemy
    if (rectOverlap(player, en)) {
      if (player.isSlashing) {
        // Successful hit
        enemies.splice(i, 1);
        slashes++;
        combo = Math.min(10, combo + 1);
        comboTimer = 2.4;
        const pts = 250 * combo;
        score += pts;
        Audio.playHit();
        createExplosion(en.x + en.width / 2, en.y + en.height / 2, en.color);
        createFloatingText(`+${pts}`, en.x, en.y - 10, "#00f0ff");
      } else {
        // Player hit! Game Over!
        handleGameOver();
        return;
      }
    } else if (en.x + en.width < -50) {
      enemies.splice(i, 1);
    }
  }

  // Update Data Orbs
  const playerCenter = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
  };
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    orb.x -= currentSpeed * dt;

    // Distance to player center
    const dx = orb.x - playerCenter.x;
    const dy = orb.y - playerCenter.y;
    if (Math.hypot(dx, dy) < orb.radius + 30) {
      orbs.splice(i, 1);
      score += 150 * combo;
      Audio.playOrb();
      createFloatingText(`+${150 * combo}`, orb.x, orb.y, "#ffe600");
    } else if (orb.x < -30) {
      orbs.splice(i, 1);
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.alpha = Math.max(0, p.life * 2);
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update Floating Texts
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt;
    ft.alpha = Math.max(0, ft.life / 0.8);
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }

  // Update HUD
  scoreValEl.textContent = score.toLocaleString();
  distanceValEl.textContent = `${Math.floor(distance)}m`;
  slashesValEl.textContent = slashes;
  comboValEl.textContent = `x${combo}`;
  if (combo > 1) {
    comboValEl.classList.add("pulse");
  } else {
    comboValEl.classList.remove("pulse");
  }
}

// Rendering
function render() {
  ctx.clearRect(0, 0, width, height);

  // 1. Sky Gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, floorY);
  skyGradient.addColorStop(0, "#080114");
  skyGradient.addColorStop(0.7, "#1a0833");
  skyGradient.addColorStop(1, "#360e52");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Parallax Synthwave Skyline
  cityLayers.forEach((layer) => {
    ctx.fillStyle = layer.color;
    layer.buildings.forEach((b) => {
      if (gameState === "PLAYING") {
        b.x -= currentSpeed * layer.speed * 0.016;
      }
      if (b.x + b.width < 0) {
        // Wrap to right
        const rightmost = Math.max(...layer.buildings.map((o) => o.x + o.width));
        b.x = rightmost + 15 + Math.random() * 20;
      }
      ctx.fillRect(b.x, floorY - b.height, b.width, b.height);

      // Cyber Windows
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      for (let wy = floorY - b.height + 15; wy < floorY - 15; wy += 22) {
        ctx.fillRect(b.x + 8, wy, b.width - 16, 6);
      }
      ctx.fillStyle = layer.color;
    });
  });

  // 3. Neon Floor Grid
  ctx.fillStyle = "#0c0517";
  ctx.fillRect(0, floorY, width, height - floorY);

  // Glowing Floor Line
  ctx.save();
  ctx.strokeStyle = "#ff007f";
  ctx.shadowColor = "#ff007f";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();
  ctx.restore();

  // Scrolling Grid Horizontal Lines
  const gridOffset = (distance * 10) % 40;
  ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
  ctx.lineWidth = 1;
  for (let x = -gridOffset; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x - 50, height);
    ctx.stroke();
  }

  // 4. Draw Data Orbs
  orbs.forEach((orb) => {
    ctx.save();
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();

    // Core spark
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 5. Draw Enemies
  enemies.forEach((en) => {
    ctx.save();
    if (en.type === "drone") {
      // Flying Cyber Drone
      ctx.fillStyle = en.color;
      ctx.shadowColor = en.color;
      ctx.shadowBlur = 14;

      // Drone hull
      ctx.beginPath();
      ctx.ellipse(en.x + en.width / 2, en.y + en.height / 2, en.width / 2, en.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing core eye
      ctx.fillStyle = "#ffe600";
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(en.x + en.width / 2, en.y + en.height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Barrier Spire
      ctx.fillStyle = en.color;
      ctx.shadowColor = en.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(en.x, en.y + en.height);
      ctx.lineTo(en.x + en.width / 2, en.y);
      ctx.lineTo(en.x + en.width, en.y + en.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });

  // 6. Draw Player Character
  const slashProgress = player.isSlashing ? player.slashTime / player.slashDuration : 0;
  drawCharacter(
    ctx,
    player.x,
    player.y,
    player.width,
    player.height,
    {
      isGrounded: player.isGrounded,
      isSlashing: player.isSlashing,
      slashProgress,
      animTime: globalAnimTime,
    },
    playerInfo?.style,
  );

  // 7. Draw Particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 8. Draw Floating Score Texts
  floatingTexts.forEach((ft) => {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

// Start loop
requestAnimationFrame(gameLoop);
