window.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById("playBtn");
    const dropBtn = document.getElementById("dropBtn");
    const claw = document.getElementById("claw");
    const playSound = document.getElementById("playSound");
  
    let moving = false;
    let clawDirection = 1;
    let clawInterval;
  
    // PLAY button: start claw movement
    playBtn.addEventListener("click", () => {
      if (moving) return;
  
      playBtn.src = "assets/play1_cropped.png";
      playSound.currentTime = 0;
      playSound.play();
  
      moving = true;
  
      clawInterval = setInterval(() => {
        const currentLeft = parseInt(claw.style.left || "100");
        let nextLeft = currentLeft + (5 * clawDirection);
  
        if (nextLeft > 300 || nextLeft < 105) {
          clawDirection *= -1;
          nextLeft = currentLeft + (5 * clawDirection);
        }
  
        claw.style.left = nextLeft + "px";
      }, 60);
    });
  
    // DROP button: run claw animation sequence
    dropBtn.addEventListener("click", async () => {
      if (!moving) return;
  
      playBtn.src = "assets/play0_cropped.png";

      dropBtn.src = "assets/button1.png";
      clearInterval(clawInterval);
      moving = false;
  
      //Drop
      await cycleFrames(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100);
  
      //Lift
      await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
  
      // Move to left boundary
      await moveClawLeftUntil(115);
      
      //Drop
      await cycleFrames(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100);
      
      //Lift
      await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
    
      claw.src = "assets/claw0.png";
    });
  
    //Frame animation function
    async function cycleFrames(frameList, delay = 100) {
      for (let src of frameList) {
        claw.src = `assets/${src}`;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    //Move claw to a target X (e.g. 105)
    function moveClawLeftUntil(minX) {
      return new Promise(resolve => {
        const interval = setInterval(() => {
          const currentLeft = parseInt(claw.style.left || "100");
          const nextLeft = currentLeft - 5;
          claw.style.left = nextLeft + "px";
  
          if (nextLeft <= minX) {
            clearInterval(interval);
            resolve();
          }
        }, 40);
      });
    }


  });
  