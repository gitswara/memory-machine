// game.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let memories = [];
let memoryIndex = 0;
let nextImage = null;

const firebaseConfig = window.__FIREBASE_CONFIG__;
if (!firebaseConfig) {
  throw new Error("Missing Firebase config. Run: node scripts/generate-firebase-config.mjs");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (!code) {
    alert("No machine code found in URL.");
    window.location.href = "join.html";
    return;
  }

  try {
    const machineQuery = query(collection(db, "machines"), where("code", "==", code));
    const machineSnapshot = await getDocs(machineQuery);

    if (machineSnapshot.empty) {
      alert("Invalid machine code.");
      window.location.href = "join.html";
      return;
    }

    const machineDoc = machineSnapshot.docs[0];
    const machineId = machineDoc.id;

    const memoriesSnapshot = await getDocs(collection(db, `machines/${machineId}/memories`));
    
    memories = memoriesSnapshot.docs.map(doc => ({
      memoryId: doc.id,
      machineId,
      date: doc.data().date || "",
      story: doc.data().story || ""
    }));
  
    await preloadNextMemoryImage();
    startGame(); // each memory has memoryId and machineId for later fetch
  } catch (err) {
    console.error("Error loading game data:", err);
    alert("Something went wrong loading the machine. Please try again later.");
    window.location.href = "join.html";
  }
});

function preloadImages(imagePaths) {
  return Promise.all(
    imagePaths.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.src = src;
        })
    )
  );
}




async function startGame() {
  const imageAssets = [
    "assets/claw0.png",
    "assets/claw1.png",
    "assets/claw2.png",
    "assets/claw3.png",
    "assets/claw4.png",
    "assets/claw5.png",
    "assets/claw6.png",
    "assets/red_ball_cropped.png",
    "assets/blue_ball_cropped.png",
    "assets/green_ball_cropped.png",
    "assets/yellow_ball_cropped.png",
    "assets/play0_cropped.png",
    "assets/play1_cropped.png",
    "assets/button0.png",
    "assets/button1.png",
    "assets/won.png",
    "assets/missed.png",
    "assets/frame.png",
  ];

  await preloadImages(imageAssets);

  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("machine-screen").style.display = "block";
  
  const playBtn = document.getElementById("playBtn");
  const dropBtn = document.getElementById("dropBtn");
  const claw = document.getElementById("claw");
  const playSound = document.getElementById("playSound");
  const resetBtn = document.getElementById("reset-btn");
  const creditsBox = document.getElementById("credits-box");
  const buildBtn = document.getElementById("build-btn");
  const joinBtn = document.getElementById("join-btn");

  const ballPositions = {
    205: "red-ball",
    280: "blue-ball",
    170: "green-ball",
    240: "yellow-ball"
  };

  const originalBallPositions = {
    350: "red-ball",
    420: "blue-ball",
    310: "green-ball",
    380: "yellow-ball"
  };

  let gameLocked = false;
  const TOLERANCE = 5;

  creditsBox.innerText = String(memories.length).padStart(2, '0');
  
  resetBtn.addEventListener("click", async () => {
    memoryIndex = 0;
    creditsBox.innerText = String(memories.length).padStart(2, '0');
    document.getElementById("reset-btn").style.display = "none";
    document.getElementById("memory-container").style.display = "none";
    gameLocked = false;
  
    // ✅ Preload first memory image again
    await preloadNextMemoryImage();
  });
  

  let moving = false;
  let clawDirection = 1;
  let clawInterval;

  playBtn.addEventListener("click", () => {
    if (moving || gameLocked) return;

    document.getElementById("memory-container").style.display = "none";
    playBtn.src = "assets/play1_cropped.png";
    playSound.currentTime = 0;
    playSound.play();
    moving = true;

    clawInterval = setInterval(() => {
      const currentLeft = parseInt(claw.style.left || "100");
      let nextLeft = currentLeft + 5 * clawDirection;
      if (nextLeft > 300 || nextLeft < 105) clawDirection *= -1;
      claw.style.left = nextLeft + "px";
    }, 60);
  });

  dropBtn.addEventListener("click", async () => {
    if (!moving || gameLocked) return;
    playBtn.src = "assets/play0_cropped.png";
    dropBtn.src = "assets/button1.png";
    clearInterval(clawInterval);
    moving = false;

    const clawX = parseInt(claw.style.left || "100");
    const caughtBall = getCaughtBall(clawX);
    let initialBallX = caughtBall ? parseInt(caughtBall.style.left || "0") : 0;

    await cycleFrames(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100);

    if (caughtBall) {
      document.getElementById("won-msg").style.display = "block";
      await liftClawWithBall(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100, caughtBall);
      await moveClawAndBallLeftUntil(115, caughtBall);
      await dropClawWithBall(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100, caughtBall);

      caughtBall.style.display = "none";
      await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
      claw.src = "assets/claw0.png";

      const prizeId = `${caughtBall.id}-prize`;
      const prizeElement = document.getElementById(prizeId);
      if (prizeElement) prizeElement.style.display = "block";

      prizeElement.onclick = async () => {
        prizeElement.style.display = "none";
      
        if (memoryIndex < memories.length) {
          const m = memories[memoryIndex];
          document.getElementById("memory-date").innerText = m.date;
          document.getElementById("memory-text").innerText = m.story || m.text;
      
          // ✅ Use already-preloaded image
          document.getElementById("memory-image").src = nextImage;
      
          // ✅ Preload next memory's image (background)
          memoryIndex++;
          await preloadNextMemoryImage();
      
          document.getElementById("memory-container").style.display = "block";
          creditsBox.innerText = String(memories.length - memoryIndex).padStart(2, '0');
        }
      
        if (memoryIndex >= memories.length) {
          gameLocked = true;
          document.getElementById("reset-btn").style.display = "inline-block";
        }
      };
      
      
      for (let x in originalBallPositions) {
        if (originalBallPositions[x] === caughtBall.id) {
          caughtBall.style.display = "block";
          caughtBall.style.left = `${x}px`;
          caughtBall.style.top = "300px";
          break;
        }
      }
      document.getElementById("won-msg").style.display = "none";
    } else {
      document.getElementById("missed-msg").style.display = "block";
      await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
      await moveClawLeftUntil(115);
      claw.src = "assets/claw0.png";
      document.getElementById("missed-msg").style.display = "none";
    }
    dropBtn.src = "assets/button0.png";
  });

  function getCaughtBall(clawX) {
    for (let pos in ballPositions) {
      if (Math.abs(clawX - pos) <= TOLERANCE) return document.getElementById(ballPositions[pos]);
    }
    return null;
  }

  async function cycleFrames(frames, delay) {
    for (let src of frames) {
      claw.src = `assets/${src}`;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  async function liftClawWithBall(frames, delay, ball, stepY = 16) {
    for (let src of frames) {
      claw.src = `assets/${src}`;
      if (ball) ball.style.top = `${parseInt(ball.style.top) - stepY}px`;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  async function dropClawWithBall(frames, delay, ball, stepY = 16) {
    for (let src of frames) {
      claw.src = `assets/${src}`;
      if (ball) ball.style.top = `${parseInt(ball.style.top) + stepY}px`;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  function moveClawLeftUntil(minX) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        const curr = parseInt(claw.style.left || "100");
        claw.style.left = `${curr - 5}px`;
        if (curr <= minX) {
          clearInterval(interval);
          resolve();
        }
      }, 40);
    });
  }

  function moveClawAndBallLeftUntil(minX, ball) {
    return new Promise(resolve => {
      const offset = parseInt(claw.style.left) - parseInt(ball.style.left);
      const interval = setInterval(() => {
        const curr = parseInt(claw.style.left);
        claw.style.left = `${curr - 5}px`;
        if (ball) ball.style.left = `${curr - 5 - offset}px`;
        if (curr <= minX) {
          clearInterval(interval);
          resolve();
        }
      }, 40);
    });
  }
  await preloadNextMemoryImage();

}

async function preloadNextMemoryImage() {
  if (memoryIndex >= memories.length) {
    nextImage = null;
    return;
  }

  const m = memories[memoryIndex];
  const chunksSnapshot = await getDocs(
    collection(db, `machines/${m.machineId}/memories/${m.memoryId}/chunks`)
  );
  
  const chunks = chunksSnapshot.docs
    .map(doc => doc.data())
    .sort((a, b) => a.index - b.index)
    .map(chunk => chunk.data);

  nextImage = chunks.join(""); // Preloaded base64 image
}


// Help button logic for game.html
const helpBtn = document.getElementById("help-button-2");
const helpText = document.getElementById("help-text-2");
let helpFadeTimeout;

helpBtn.addEventListener("click", () => {
  if (helpText.style.display !== "block") {
    helpText.style.display = "block";
    helpText.style.opacity = "1";
    helpText.style.pointerEvents = "auto";

    // Auto-fade after 5 seconds if not hovered
    if (helpFadeTimeout) clearTimeout(helpFadeTimeout);
    helpFadeTimeout = setTimeout(() => {
      if (!helpText.matches(":hover")) {
        helpText.style.opacity = "0";
        setTimeout(() => {
          helpText.style.display = "none";
        }, 500);
      }
    }, 5000);
  } else {
    // Hide immediately if already visible
    helpText.style.opacity = "0";
    setTimeout(() => {
      helpText.style.display = "none";
    }, 500);
  }
});

// If user hovers over the box, pause the fade
helpText.addEventListener("mouseenter", () => {
  if (helpFadeTimeout) clearTimeout(helpFadeTimeout);
});
helpText.addEventListener("mouseleave", () => {
  helpFadeTimeout = setTimeout(() => {
    helpText.style.opacity = "0";
    setTimeout(() => {
      helpText.style.display = "none";
    }, 500);
  }, 3000);
});
