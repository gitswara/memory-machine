window.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById("playBtn");
    const dropBtn = document.getElementById("dropBtn");
    const claw = document.getElementById("claw");
    const playSound = document.getElementById("playSound");
    const resetBtn = document.getElementById("reset-btn");
    const creditsBox = document.getElementById("credits-box");

    

    const ballPositions = {
      205: "red-ball",
      280: "blue-ball",
      170: "green-ball",
      245: "yellow-ball"
    };

    const originalBallPositions = {
        350: "red-ball",
        420: "blue-ball",
        310: "green-ball",
        380: "yellow-ball"
    };

  
    let gameLocked = false;
    
    const TOLERANCE = 3;


    const memories = [
        {
          date: "Jan 10, 2023",
          image: "assets/concert_pic.jpeg",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a vulputate dui. Maecenas suscipit blandit maximus. Quisque in egestas dui, pharetra vulputate leo. Aenean eget nibh at quam aliquet condimentum ac sit amet lorem."
        },
        {
          date: "Feb 14, 2023",
          image: "assets/picnic_pic.jpg",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a vulputate dui. Maecenas suscipit blandit maximus. Quisque in egestas dui, pharetra vulputate leo. Aenean eget nibh at quam aliquet condimentum ac sit amet lorem."
        },
        {
          date: "Apr 8, 2023",
          image: "assets/hike_pic.jpeg",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a vulputate dui. Maecenas suscipit blandit maximus. Quisque in egestas dui, pharetra vulputate leo. Aenean eget nibh at quam aliquet condimentum ac sit amet lorem."
        }
    ];

    creditsBox.innerText = memories.length; 

    let memoryIndex = 0;

    resetBtn.addEventListener("click", () => {
        memoryIndex = 0;
        creditsBox.innerText = `${memories.length}`;
        document.getElementById("reset-btn").style.display = "none";
        document.getElementById("memory-container").style.display = "none";
        gameLocked = false;
    });
  
    let moving = false;
    let clawDirection = 1;
    let clawInterval;
    
  
    // PLAY button: start claw movement
    playBtn.addEventListener("click", () => {
      if (moving || gameLocked) return;
        
      document.getElementById("memory-container").style.display = "none";
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
      if (!moving || gameLocked) return;
  
      playBtn.src = "assets/play0_cropped.png";
      dropBtn.src = "assets/button1.png";
      clearInterval(clawInterval);

      moving = false;
  
      const clawX = parseInt(claw.style.left || "100");
      console.log("Stopped at ", clawX);
      const caughtBall = getCaughtBall(clawX);
      let initialBallX = 0;
  
      if (caughtBall) {
        // Get true initial X position of caught ball
        initialBallX = parseInt(caughtBall.style.left || "0");
      }
  
      // Drop down claw
      await cycleFrames(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100);
  
      if (caughtBall) {
        document.getElementById("won-msg").style.display = "block";

        await liftClawWithBall(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100, caughtBall);
  
        await moveClawAndBallLeftUntil(115, caughtBall);
  
        await dropClawWithBall(["claw1.png", "claw2.png", "claw3.png", "claw4.png", "claw5.png", "claw6.png"], 100, caughtBall);
        
        caughtBall.style.display = "none";


        await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
        claw.src = "assets/claw0.png";

        const caughtBallId = caughtBall.id;
        const prizeId = `${caughtBallId}-prize`;

        const prizeElement = document.getElementById(prizeId);
        if (prizeElement) {
          prizeElement.style.display = "block";
        }
        


        prizeElement.onclick = () => {
            prizeElement.style.display = "none"; // hide prize ball
                
            if (memoryIndex < memories.length) {
                const memory = memories[memoryIndex];

                document.getElementById("memory-date").innerText = memory.date;
                document.getElementById("memory-image").src = memory.image;
                document.getElementById("memory-text").innerText = memory.text;
                document.getElementById("memory-container").style.display = "block";

                memoryIndex++; // move to next memory

                const creditsLeft = memories.length - memoryIndex;
                creditsBox.innerText = `${creditsLeft}`;

            }

            // If last memory shown, show reset button
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
        // no ball caught
        document.getElementById("missed-msg").style.display = "block";
        await cycleFrames(["claw6.png", "claw5.png", "claw4.png", "claw3.png", "claw2.png", "claw1.png"], 100);
        await moveClawLeftUntil(115);
        claw.src = "assets/claw0.png";
        document.getElementById("missed-msg").style.display = "none";
      }



    });
  
    // Frame animation utility
    async function cycleFrames(frameList, delay = 100) {
      for (let src of frameList) {
        claw.src = `assets/${src}`;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    async function liftClawWithBall(frameList, delay = 100, ball, stepY = 16) {
      for (let src of frameList) {
        claw.src = `assets/${src}`;
        if (ball) {
          const currentTop = parseInt(ball.style.top || "300");
          ball.style.top = (currentTop - stepY) + "px";
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    async function dropClawWithBall(frameList, delay = 100, ball, stepY = 16) {
      for (let src of frameList) {
        claw.src = `assets/${src}`;
        if (ball) {
          const currentTop = parseInt(ball.style.top || "300");
          ball.style.top = (currentTop + stepY) + "px";
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    function getCaughtBall(clawX) {
      for (let pos in ballPositions) {
        const position = parseInt(pos);
        if (Math.abs(clawX -pos)<= TOLERANCE) {
          const ballId = ballPositions[pos];
          console.log(ballId,"ball caught at ",clawX)
          return document.getElementById(ballId);
        }

      }
      return null;
    }
  
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
  
    function moveClawAndBallLeftUntil(minX, ball) {
      return new Promise(resolve => {
        const offset = parseInt(claw.style.left || "100") - parseInt(ball.style.left || "100");
  
        const interval = setInterval(() => {
          const currentClawLeft = parseInt(claw.style.left || "100");
          const nextClawLeft = currentClawLeft - 5;
          claw.style.left = nextClawLeft + "px";
  
          if (ball) {
            ball.style.left = (nextClawLeft - offset) + "px";
          }
  
          if (nextClawLeft <= minX) {
            clearInterval(interval);
            resolve();
          }
        }, 40);
      });
    }
  
  });
  