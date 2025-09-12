const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Images ---
const alienimg = new Image();
alienimg.src = "./media/drunkinalien3.png";
const enemy1Img = new Image();
enemy1Img.src = "./media/insectesolo3-rbg.png";
const enemy2Img = new Image();
enemy2Img.src = "./media/insectesolo2-rbg.png";
const enemy3Img = new Image();
enemy3Img.src = "./media/insectesolo.png";

// --- Flags ---
let mainImgLoaded = false;
let enemy1ImgLoaded = false;
let enemy2ImgLoaded = false;
let enemy3ImgLoaded = false;

alienimg.onload = () => { mainImgLoaded = true; startGameIfReady(); };
enemy1Img.onload = () => { enemy1ImgLoaded = true; startGameIfReady(); };
enemy2Img.onload = () => { enemy2ImgLoaded = true; startGameIfReady(); };
enemy3Img.onload = () => { enemy3ImgLoaded = true; };

// --- General settings ---
let gamePlaying = false;
let gravity = 0.16;
let initialSpeed = 4;
let speed = initialSpeed;
let displaySpeed = speed;
const speedIncreaseAmount = 0.5;

let initialEnemySpeed = 5;
let enemySpeed = initialEnemySpeed;
const enemySpeedIncreaseAmount = 0.1;

const size = [51, 30];
let jump = -5.75;
const cTenth = canvas.width / 20;
let thrustAmount = 0.4;

// Speed-up message
let showSpeedUpAd = false;
let speedUpAdTimer = 0;
const speedUpAdDuration = 60;

// --- Mobile adjustments ---
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
if (isMobile) {
  gravity = 0.046;
  jump = -1.0;
  initialSpeed = 3;
  initialEnemySpeed = 2;
  thrustAmount = 0.2;
  speed = initialSpeed;
  enemySpeed = initialEnemySpeed;
}

// --- Pipe settings ---
const pipeWidth = 50;
const pipeGap = 270;
const pipeLoc = () => Math.random() * (canvas.height - (pipeGap - pipeWidth) - pipeWidth);

// --- Game state ---
let index = 0, bestScore = 0, currentScore = 0, currentKills = 0, bestKills = 0, bossMode = false, bossEntryDelay = 0, pipesEntered = 0, postBossDelayActive = false, bossDefeated = false;
let boss2Mode = false, boss2EntryDelay = 0, postBoss2DelayActive = false, boss2Defeated = false; // New
let boss3Mode = false, boss3EntryDelay = 0, postBoss3DelayActive = false, boss3Defeated = false; // New
let pipes = [], flight, flyHeight, isThrusting = false, enemies = [], shots = [], items = [], particles = [];
const shotSpeed = 10;
let currentPowerUp = 'default';
const powerUpTypes = ['double', 'spread', 'explosive', 'chain', 'bouncing'];
let powerUpStartScore = -1;
let boss = null;
let bossShots = [];
let boss2 = null; // New
let boss2Shots = []; // New
let boss3 = null; // New
let boss3Shots = []; // New

// --- Power-up spawn timer ---
function spawnPowerUp() {
  const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  const y = Math.random() * (canvas.height - 20);
  items.push({ x: canvas.width, y, type, width: 20, height: 20 });
}

// --- Explosion function ---
function createExplosion(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      lifespan: 30,
      size: Math.random() * 3 + 1,
    });
  }
}

// --- Enemy spawn timer ---
let enemySpawnTimer = 0;
const enemyBaseInterval = 120; // frames
const enemyMinInterval = 40;

// Adjust for mobile
const effectiveEnemyBaseInterval = isMobile ? enemyBaseInterval * 2 : enemyBaseInterval;
const effectiveEnemyMinInterval = isMobile ? enemyMinInterval * 2 : enemyMinInterval;

// --- Boss spawn ---
function spawnBoss() {
  boss = {
    x: canvas.width - 150, // Position on the right side
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 3,
    maxHp: 100,
    vy: -1, // Move upwards
    shootTimer: 240, // Shoots every 4 seconds (initial delay)
    enemySpawnTimer: 180, // Spawns enemy every 3 seconds (3 * 60 frames)
    phase: 'entry', // New phase for boss entry
  };
}

// --- Boss 2 spawn ---
function spawnBoss2() {
  boss2 = {
    x: canvas.width, // Start off-screen right
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 5, // Slightly more HP for boss2
    maxHp: 100,
    vx: -2, // Move left during entry
    vy: -1, // Move upwards
    shootTimer: 210, // Initial delay for first shot (90 + 120 frames for 2 seconds)
    enemySpawnTimer: 120, // Spawns enemy2 more frequently
    phase: 'entry',
  };
}

// --- Boss 3 spawn ---
function spawnBoss3() {
  boss3 = {
    x: canvas.width, // Start off-screen right
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 7, // Slightly more HP for boss3
    maxHp: 100,
    vx: -2, // Move left during entry
    vy: -1, // Move upwards
    shootTimer: 210, // Initial delay for first shot (90 + 120 frames for 2 seconds)
    enemySpawnTimer: 120, // Spawns enemy3 more frequently
    phase: 'entry',
  };
}

// --- Setup ---
function setup() {
  currentScore = 0;
  currentKills = 0;
  flight = jump;
  flyHeight = canvas.height / 2 - size[1] / 2 + 100;
  speed = initialSpeed;
  enemySpeed = initialEnemySpeed;
  pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
  enemies = [];
  shots = [];
  items = [];
  particles = [];
  boss = null;
  bossShots = [];
  boss2 = null; // New
  boss2Shots = []; // New
  boss3 = null; // New
  boss3Shots = []; // New
  enemySpawnTimer = effectiveEnemyBaseInterval;
  showSpeedUpAd = false;
  speedUpAdTimer = 0;
  bossMode = false;
  bossEntryDelay = 0;
  pipesEntered = 0;
  postBossDelayActive = false;
  bossDefeated = false;
  boss2Mode = false; // New
  boss2EntryDelay = 0; // New
  postBoss2DelayActive = false; // New
  boss2Defeated = false; // New
  boss3Mode = false; // New
  boss3EntryDelay = 0; // New
  postBoss3DelayActive = false; // New
  boss3Defeated = false; // New
}

// --- Spawn functions ---
function spawnEnemy(type) {
  if (type === 'enemy1') {
    const y = Math.random() * (canvas.height - size[1]);
    const variation = (Math.random() - 0.5) * 1;
    enemies.push({ x: canvas.width, y, type: 'enemy1', speedVariation: variation });
  } else if (type === 'enemy2') {
    const startX = canvas.width + 100;
    const startY = Math.random() < 0.5 ? Math.random() * canvas.height * 0.3 : canvas.height - Math.random() * canvas.height * 0.2 - size[1];
    const vx = -enemySpeed;
    const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1 + 0.5);
    enemies.push({ x: startX, y: startY, vx, vy, rotation: 0, type: 'enemy2' });
  } else if (type === 'enemy3') {
    const vx = -enemySpeed * 0.8;
    const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1.5 + 0.8);
    enemies.push({ x: canvas.width, y: Math.random() * (canvas.height - size[1]), vx, vy, type: 'enemy3' });
  }
}

// --- Probabilistic enemy selection ---
function getEnemyType(score) {
  let r = Math.random() * 100;
  if (score < 80) {
    // Early game: mostly enemy1
    if (r < 90) return 'enemy1';
    else return 'enemy2';
  } else {
    // Mid/high game: introduce enemy3 gradually
    if (r < 60) return 'enemy1';
    else if (r < 85) return 'enemy2';
    else return 'enemy3';
  }
}

// --- Main render loop ---
function render() {
  index++;
  displaySpeed += (speed - displaySpeed) * 0.005;

  // Background
  ctx.drawImage(alienimg, 115, 0, 250, canvas.height, -((index * displaySpeed / 2) % 431) + 431, 0, canvas.width, canvas.height);
  ctx.drawImage(alienimg, 115, 0, 250, canvas.height, -(index * displaySpeed / 2) % 431, 0, canvas.width, canvas.height);

  // Player
  if (gamePlaying) {
    ctx.drawImage(alienimg, 405, Math.floor(index % 1) * size[0], ...size, cTenth, flyHeight, ...size);
    if (isThrusting) flight -= thrustAmount;
    flight += gravity;
    flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
    if (flyHeight <= 0 || flyHeight >= canvas.height - size[1]) {
      gamePlaying = false; setup();
    }

    // Shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];

      shot.x += shot.vx;
      shot.y += shot.vy;

      if (shot.type === 'bouncing') {
        if (shot.y <= 0 || shot.y + shot.height >= canvas.height) {
          shot.vy *= -1;
        }
      }

      if (shot.type === 'double') {
        ctx.fillStyle = 'blue';
      } else if (shot.type === 'spread') {
        ctx.fillStyle = 'green';
      } else if (shot.type === 'explosive') {
        ctx.fillStyle = 'orange';
      } else if (shot.type === 'chain') {
        ctx.fillStyle = 'teal';
      } else if (shot.type === 'bouncing') {
        ctx.fillStyle = 'yellow';
      } else {
        ctx.fillStyle = "red";
      }

      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();

      if (shot.x > canvas.width) {
        shots.splice(i, 1);
        continue;
      }

      // Shot collision with boss
      if (boss && shot.x < boss.x + boss.width && shot.x + shot.width > boss.x && shot.y < boss.y + boss.height && shot.y + shot.height > boss.y) {
        shots.splice(i, 1);
        boss.hp--;
        createExplosion(shot.x, shot.y);

        if (boss.hp <= 0) {
          createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 50);
          boss = null;
          bossMode = false;
          postBossDelayActive = true;
          bossEntryDelay = 5 * 60;
          pipesEntered = 0;
          bossDefeated = true;
        }
        continue;
      }

      // Shot collision with boss2
      if (boss2 && shot.x < boss2.x + boss2.width && shot.x + shot.width > boss2.x && shot.y < boss2.y + boss2.height && shot.y + shot.height > boss2.y) {
        shots.splice(i, 1);
        boss2.hp--;
        createExplosion(shot.x, shot.y);

        if (boss2.hp <= 0) {
          createExplosion(boss2.x + boss2.width / 2, boss2.y + boss2.height / 2, 50);
          boss2 = null;
          boss2Mode = false;
          postBoss2DelayActive = true;
          boss2EntryDelay = 5 * 60; // 5-second delay after boss2 defeat
          pipesEntered = 0; // Reset pipesEntered for next phase
          boss2Defeated = true;
        }
        continue;
      }

      // Shot collision with boss3
      if (boss3 && shot.x < boss3.x + boss3.width && shot.x + shot.width > boss3.x && shot.y < boss3.y + boss3.height && shot.y + shot.height > boss3.y) {
        shots.splice(i, 1);
        boss3.hp--;
        createExplosion(shot.x, shot.y);

        if (boss3.hp <= 0) {
          createExplosion(boss3.x + boss3.width / 2, boss3.y + boss3.height / 2, 50);
          boss3 = null;
          boss3Mode = false;
          postBoss3DelayActive = true;
          boss3EntryDelay = 5 * 60; // 5-second delay after boss3 defeat
          pipesEntered = 0; // Reset pipesEntered for next phase
          boss3Defeated = true;
        }
        continue;
      }

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (
          shot.x < enemy.x + size[0] &&
          shot.x + shot.width > enemy.x &&
          shot.y < enemy.y + size[1] &&
          shot.y + shot.height > enemy.y
        ) {
          createExplosion(enemy.x + size[0] / 2, enemy.y + size[1] / 2);

          if (shot.type === 'explosive') {
            // Explode
            for (let k = enemies.length - 1; k >= 0; k--) {
              const otherEnemy = enemies[k];
              if (k === j) continue;
              const dist = Math.hypot(shot.x - otherEnemy.x, shot.y - otherEnemy.y);
              if (dist < 50) {
                createExplosion(otherEnemy.x + size[0] / 2, otherEnemy.y + size[1] / 2);
                enemies.splice(k, 1);
                currentKills++;
              }
            }
          }

          if (shot.type === 'chain' && shot.jumpsLeft > 0) {
            shot.jumpsLeft--;
            enemies.splice(j, 1);
            currentKills++;

            let nextTarget = null;
            let minDistance = Infinity;
            for (let k = 0; k < enemies.length; k++) {
              const otherEnemy = enemies[k];
              const dist = Math.hypot(shot.x - otherEnemy.x, shot.y - otherEnemy.y);
              if (dist < minDistance) {
                minDistance = dist;
                nextTarget = otherEnemy;
              }
            }

            if (nextTarget) {
              const angle = Math.atan2(nextTarget.y - shot.y, nextTarget.x - shot.x);
              shot.vx = Math.cos(angle) * shotSpeed;
              shot.vy = Math.sin(angle) * shotSpeed;
            } else {
              shots.splice(i, 1);
            }
          } else {
            shots.splice(i, 1);
          }

          enemies.splice(j, 1);
          currentKills++;
          bestKills = Math.max(bestKills, currentKills);

          if (currentKills > 0 && currentKills % 10 === 0) {
            setTimeout(spawnPowerUp, 1000);
          }
          break;
        }
      }
    }

    // Boss
    if (boss) {
      if (boss.phase === 'entry') {
        boss.y += boss.vy;
        if (boss.y <= canvas.height / 2 - boss.height / 2) {
          boss.y = canvas.height / 2 - boss.height / 2;
          boss.vy = 2; // Resume normal vertical movement
          boss.phase = 'active';
        }
      } else if (boss.phase === 'active') {
        boss.y += boss.vy;
        if (boss.y + boss.height > canvas.height || boss.y < 0) {
          boss.vy *= -1;
        }
      }

      ctx.drawImage(enemy1Img, boss.x, boss.y, boss.width, boss.height);

      // Boss health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);
      ctx.fillStyle = 'green';
      ctx.fillRect(boss.x, boss.y - 20, boss.width * (boss.hp / boss.maxHp), 10);

      boss.shootTimer--;
      if (boss.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss.x;
        const bossShotY = boss.y + boss.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeed = 5; // Adjust as needed
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        bossShots.push({ x: boss.x, y: boss.y + boss.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss.shootTimer = 120;
      }

      boss.enemySpawnTimer--;
      if (boss.enemySpawnTimer <= 0) {
        spawnEnemy('enemy1');
        boss.enemySpawnTimer = 180; // Reset for 3 seconds
      }

      // Player collision with boss
      if (cTenth < boss.x + boss.width && cTenth + size[0] > boss.x && flyHeight < boss.y + boss.height && flyHeight + size[1] > boss.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Boss 2
    if (boss2) {
      if (boss2.phase === 'entry') {
        boss2.x += boss2.vx;
        boss2.y += boss2.vy;
        if (boss2.x <= canvas.width - 150) { // Check if boss has reached its target x position
          boss2.x = canvas.width - 150; // Snap to position
          boss2.vx = 0; // Stop horizontal movement
        }
        if (boss2.y <= canvas.height / 2 - boss2.height / 2) {
          boss2.y = canvas.height / 2 - boss2.height / 2;
          boss2.vy = 2; // Resume normal vertical movement
        }
        if (boss2.x === canvas.width - 150 && boss2.y === canvas.height / 2 - boss2.height / 2) {
          boss2.phase = 'active'; // Transition to active phase once both x and y are in place
        }
      } else if (boss2.phase === 'active') {
        boss2.y += boss2.vy;
        if (boss2.y + boss2.height > canvas.height || boss2.y < 0) {
          boss2.vy *= -1;
        }
      }

      ctx.drawImage(enemy2Img, boss2.x, boss2.y, boss2.width, boss2.height); // Use enemy2Img

      // Boss 2 health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss2.x, boss2.y - 20, boss2.width, 10);
      ctx.fillStyle = 'purple'; // Different color for boss2 health bar
      ctx.fillRect(boss2.x, boss2.y - 20, boss2.width * (boss2.hp / boss2.maxHp), 10);

      boss2.shootTimer--;
      if (boss2.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss2.x;
        const bossShotY = boss2.y + boss2.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeed = 6; // Slightly faster shots for boss2
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        boss2Shots.push({ x: boss2.x, y: boss2.y + boss2.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss2.shootTimer = 90; // Reset for 1.5 seconds
      }

      boss2.enemySpawnTimer--;
      if (boss2.enemySpawnTimer <= 0) {
        spawnEnemy('enemy2'); // Spawn enemy2
        boss2.enemySpawnTimer = 120; // Reset for 2 seconds
      }

      // Player collision with boss2
      if (cTenth < boss2.x + boss2.width && cTenth + size[0] > boss2.x && flyHeight < boss2.y + boss2.height && flyHeight + size[1] > boss2.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Boss 3
    if (boss3) {
      if (boss3.phase === 'entry') {
        boss3.x += boss3.vx;
        boss3.y += boss3.vy;
        if (boss3.x <= canvas.width - 150) { // Check if boss has reached its target x position
          boss3.x = canvas.width - 150; // Snap to position
          boss3.vx = 0; // Stop horizontal movement
        }
        if (boss3.y <= canvas.height / 2 - boss3.height / 2) {
          boss3.y = canvas.height / 2 - boss3.height / 2;
          boss3.vy = 2; // Resume normal vertical movement
        }
        if (boss3.x === canvas.width - 150 && boss3.y === canvas.height / 2 - boss3.height / 2) {
          boss3.phase = 'active'; // Transition to active phase once both x and y are in place
        }
      } else if (boss3.phase === 'active') {
        boss3.y += boss3.vy;
        if (boss3.y + boss3.height > canvas.height || boss3.y < 0) {
          boss3.vy *= -1;
        }
      }

      ctx.drawImage(enemy3Img, boss3.x, boss3.y, boss3.width, boss3.height); // Use enemy3Img

      // Boss 3 health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss3.x, boss3.y - 20, boss3.width, 10);
      ctx.fillStyle = 'cyan'; // Different color for boss3 health bar
      ctx.fillRect(boss3.x, boss3.y - 20, boss3.width * (boss3.hp / boss3.maxHp), 10);

      boss3.shootTimer--;
      if (boss3.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss3.x;
        const bossShotY = boss3.y + boss3.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeed = 7; // Slightly faster shots for boss3
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        boss3Shots.push({ x: boss3.x, y: boss3.y + boss3.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss3.shootTimer = 80; // Reset for faster shots
      }

      boss3.enemySpawnTimer--;
      if (boss3.enemySpawnTimer <= 0) {
        spawnEnemy('enemy3'); // Spawn enemy3
        boss3.enemySpawnTimer = 100; // Reset for faster enemy spawn
      }

      // Player collision with boss3
      if (cTenth < boss3.x + boss3.width && cTenth + size[0] > boss3.x && flyHeight < boss3.y + boss3.height && flyHeight + size[1] > boss3.y) {
        gamePlaying = false;
        setup();
      }
    }

    // If bossMode is active and boss is not yet spawned, spawn it or handle post-boss delay
    // Handle initial boss spawn
    if (currentScore === 5 && !bossMode && !postBossDelayActive && !bossDefeated) {
      bossMode = true;
      bossEntryDelay = 60; // Initial boss entry delay
    }

    // Handle initial boss2 spawn
    if (currentScore === 10 && !boss2Mode && !postBoss2DelayActive && !boss2Defeated) {
      boss2Mode = true;
      boss2EntryDelay = 60; // Initial boss2 entry delay
    }

    // Handle initial boss3 spawn
    if (currentScore === 15 && !boss3Mode && !postBoss3DelayActive && !boss3Defeated) {
      boss3Mode = true;
      boss3EntryDelay = 60; // Initial boss3 entry delay
    }

    // Handle boss entry animation
    if (bossMode && !boss && bossEntryDelay > 0) {
      bossEntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (bossEntryDelay === 0) {
        spawnBoss();
      }
    }

    // Handle boss2 entry animation
    if (boss2Mode && !boss2 && boss2EntryDelay > 0) {
      boss2EntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (boss2EntryDelay === 0) {
        spawnBoss2();
      }
    }

    // Handle boss3 entry animation
    if (boss3Mode && !boss3 && boss3EntryDelay > 0) {
      boss3EntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (boss3EntryDelay === 0) {
        spawnBoss3();
      }
    }

    // Handle post-boss delay
    if (postBossDelayActive) {
      if (bossEntryDelay > 0) {
        bossEntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBossDelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
      }
    }

    // Handle post-boss2 delay
    if (postBoss2DelayActive) {
      if (boss2EntryDelay > 0) {
        boss2EntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBoss2DelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]); // Re-initialize pipes
      }
    }

    // Handle post-boss3 delay
    if (postBoss3DelayActive) {
      if (boss3EntryDelay > 0) {
        boss3EntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBoss3DelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]); // Re-initialize pipes
      }
    }

    // Boss shots
    for (let i = bossShots.length - 1; i >= 0; i--) {
      const shot = bossShots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkred';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        bossShots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Boss 2 shots
    for (let i = boss2Shots.length - 1; i >= 0; i--) {
      const shot = boss2Shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'purple'; // Different color for boss2 shots
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkviolet';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        boss2Shots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Boss 3 shots
    for (let i = boss3Shots.length - 1; i >= 0; i--) {
      const shot = boss3Shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'cyan'; // Different color for boss3 shots
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkcyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        boss3Shots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Boss 3 shots
    for (let i = boss3Shots.length - 1; i >= 0; i--) {
      const shot = boss3Shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'cyan'; // Different color for boss3 shots
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkcyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        boss3Shots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        gamePlaying = false;
        setup();
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.lifespan--;

      if (p.lifespan <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(255, 0, 0, ${p.lifespan / 30})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Power-up expiration
    if (powerUpStartScore !== -1 && currentScore - powerUpStartScore >= 30) {
      currentPowerUp = 'default';
      powerUpStartScore = -1;
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.x -= speed;

      if (item.type === 'double') {
        ctx.fillStyle = 'blue';
      } else if (item.type === 'spread') {
        ctx.fillStyle = 'green';
      } else if (item.type === 'explosive') {
        ctx.fillStyle = 'orange';
      } else if (item.type === 'chain') {
        ctx.fillStyle = 'teal';
      } else if (item.type === 'bouncing') {
        ctx.fillStyle = 'yellow';
      }

      ctx.beginPath();
      ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'black';
      ctx.font = "bold 15px courier";
      ctx.textAlign = "center";
      let symbol = '';
      if (item.type === 'double') {
        symbol = 'D';
      } else if (item.type === 'spread') {
        symbol = 'S';
      } else if (item.type === 'explosive') {
        symbol = 'E';
      } else if (item.type === 'chain') {
        symbol = 'C';
      } else if (item.type === 'bouncing') {
        symbol = 'B';
      }
      ctx.fillText(symbol, item.x + item.width / 2, item.y + item.height / 2 + 5);

      if (item.x + item.width < 0) {
        items.splice(i, 1);
        continue;
      }

      if (
        cTenth < item.x + item.width &&
        cTenth + size[0] > item.x &&
        flyHeight < item.y + item.height &&
        flyHeight + size[1] > item.y
      ) {
        items.splice(i, 1);
        currentPowerUp = item.type;
        powerUpStartScore = currentScore;
      }
    }
  } else {
    ctx.drawImage(alienimg, 405, Math.floor(index % 1) * size[0], ...size, cTenth, flyHeight, ...size);
    ctx.textAlign = "center";
    ctx.font = "bold 30px courier";
    ctx.fillStyle = "black";
    ctx.fillText(`Best score : ${bestScore}`, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Best Kills : ${bestKills}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("Click to play", canvas.width / 2, canvas.height / 2 + 90);
  }

  // Pipes
  if (gamePlaying) {
    pipes.forEach((pipe, i) => {
      pipe[0] -= displaySpeed;
      ctx.drawImage(alienimg, 409, 250 - pipe[1], pipeWidth, pipe[1], pipe[0], 0, pipeWidth, pipe[1]);
      ctx.drawImage(alienimg, 413 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap, pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap);

      // Only add new pipes if not in boss mode and less than 5 pipes have entered (or if boss is defeated)
      if (!bossMode && !postBossDelayActive && !boss2Mode && !postBoss2DelayActive && (bossDefeated || boss2Defeated || pipesEntered < 5) && pipe[0] <= -pipeWidth) {
        currentScore++;
        pipesEntered++;
        bestScore = Math.max(bestScore, currentScore);

        if (currentScore === 5 && !bossMode) {
          bossMode = true;
          bossEntryDelay = 60; // 1 second delay (60 frames per second * 1)
        }

        // Spawn power-up every 30 points
        if (currentScore > 0 && currentScore % 30 === 0) {
          setTimeout(spawnPowerUp, 1000);
        }

        // Speed increase every 20 points
        if (currentScore % 20 === 0) {
          speed += speedIncreaseAmount;
          if (currentScore >= 80) enemySpeed += enemySpeedIncreaseAmount;
          showSpeedUpAd = true;
          speedUpAdTimer = speedUpAdDuration;
        }

        pipes = [...pipes.slice(1), [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]];
      }

      if ([pipe[0] <= cTenth + size[0], pipe[0] + pipeWidth >= cTenth, pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1]].every(Boolean)) {
        gamePlaying = false;
        setup();
      }
    });
  }

  // Enemy spawn
  if (gamePlaying && !bossMode && !postBossDelayActive) {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0) {
      spawnEnemy(getEnemyType(currentScore));
      enemySpawnTimer = Math.max(effectiveEnemyMinInterval, effectiveEnemyBaseInterval - currentScore * 0.7);
    }
  }

  // Update enemies
  if (gamePlaying) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.type === 'enemy1') {
        e.x -= (enemySpeed + (e.speedVariation || 0));
        if (enemy1Img.width > 0 && enemy1Img.height > 0) {
          ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
        }
      } else if (e.type === 'enemy2') {
        e.x += e.vx;
        e.y += e.vy;
        if (e.y <= 0 || e.y + size[1] >= canvas.height) e.vy *= -1;
        e.rotation = (e.rotation + 0.05) % (2 * Math.PI);
        ctx.save();
        ctx.translate(e.x + size[0] / 2, e.y + size[1] / 2);
        ctx.rotate(e.rotation);
        ctx.drawImage(enemy2Img, 0, 0, enemy2Img.width, enemy2Img.height, -size[0] / 2, -size[1] / 2, size[0], size[0] * (enemy2Img.height / enemy2Img.width));
        ctx.restore();
      } else if (e.type === 'enemy3') {
        e.x += e.vx;
        e.y += e.vy;
        if (e.y <= 0 || e.y + size[1] >= canvas.height) e.vy *= -1;
        if (enemy3ImgLoaded) {
          ctx.drawImage(enemy3Img, 0, 0, enemy3Img.width, enemy3Img.height, e.x, e.y, size[0], size[0] * (enemy3Img.height / enemy3Img.width));
        } else {
          ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
        }
      }

      // Remove off-screen
      if (e.x + size[0] < 0 || e.y + size[1] < 0 || e.y > canvas.height) {
        enemies.splice(i, 1);
        continue;
      }

      // Collision
      if (cTenth < e.x + size[0] && cTenth + size[0] > e.x && flyHeight < e.y + size[1] && flyHeight + size[1] > e.y) {
        gamePlaying = false;
        setup();
        break;
      }
    }
  }

  // --- HUD ---
  ctx.textAlign = "right";
  ctx.font = "bold 20px courier";
  ctx.fillStyle = "black";
  ctx.fillText(`Score : ${currentScore}`, canvas.width - 10, 50);
  ctx.fillText(`Kills : ${currentKills}`, canvas.width - 10, 80);

  // Speed-up message
  if (showSpeedUpAd && speedUpAdTimer > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "red";
    ctx.font = "bold 40px Arial";
    ctx.fillText("SPEED UP!", canvas.width / 2, canvas.height / 2);
    speedUpAdTimer--;
  }

  requestAnimationFrame(render);
}

// --- Start game if images loaded ---
function startGameIfReady() {
  if (mainImgLoaded && enemy1ImgLoaded && enemy2ImgLoaded) {
    setup();
    render();
  }
}

// --- Controls ---
document.addEventListener("mousedown", () => {
  if (gamePlaying) {
    let shotSpeedValue = shotSpeed;
    let shotType = currentPowerUp;

    const shot = {
      x: cTenth + size[0],
      y: flyHeight + size[1] / 2,
      width: 10,
      height: 10,
      type: shotType,
      vx: shotSpeedValue,
      vy: 0
    };

    if (currentPowerUp === 'default') {
      shots.push(shot);
    } else if (currentPowerUp === 'double') {
      shots.push({ ...shot, y: shot.y - 5 });
      shots.push({ ...shot, y: shot.y + 5 });
    } else if (currentPowerUp === 'spread') {
      shots.push(shot);
      shots.push({ ...shot, y: shot.y - 10, x: shot.x - 5, vx: shotSpeedValue * 0.9 });
      shots.push({ ...shot, y: shot.y + 10, x: shot.x - 5, vx: shotSpeedValue * 0.9 });
    } else if (currentPowerUp === 'explosive') {
      shots.push({ ...shot, type: 'explosive' });
    } else if (currentPowerUp === 'chain') {
      shots.push({ ...shot, type: 'chain', jumpsLeft: 2 });
    } else if (currentPowerUp === 'bouncing') {
      shots.push({ ...shot, type: 'bouncing', vy: (Math.random() - 0.5) * 4 });
    }
  }
  gamePlaying = true;
  isThrusting = true;
});
document.addEventListener("mouseup", () => { isThrusting = false; });
document.addEventListener("touchstart", () => {
  if (gamePlaying) {
    let shotSpeedValue = shotSpeed;
    let shotType = currentPowerUp;

    const shot = {
      x: cTenth + size[0],
      y: flyHeight + size[1] / 2,
      width: 10,
      height: 10,
      type: shotType,
      vx: shotSpeedValue,
      vy: 0
    };

    if (currentPowerUp === 'default') {
      shots.push(shot);
    } else if (currentPowerUp === 'double') {
      shots.push({ ...shot, y: shot.y - 5 });
      shots.push({ ...shot, y: shot.y + 5 });
    } else if (currentPowerUp === 'spread') {
      shots.push(shot);
      shots.push({ ...shot, y: shot.y - 10, x: shot.x - 5, vx: shotSpeedValue * 0.9 });
      shots.push({ ...shot, y: shot.y + 10, x: shot.x - 5, vx: shotSpeedValue * 0.9 });
    } else if (currentPowerUp === 'explosive') {
      shots.push({ ...shot, type: 'explosive' });
    } else if (currentPowerUp === 'chain') {
      shots.push({ ...shot, type: 'chain', jumpsLeft: 2 });
    } else if (currentPowerUp === 'bouncing') {
      shots.push({ ...shot, type: 'bouncing', vy: (Math.random() - 0.5) * 4 });
    }
  }
  gamePlaying = true;
  isThrusting = true;
});
document.addEventListener("touchend", () => { isThrusting = false; });