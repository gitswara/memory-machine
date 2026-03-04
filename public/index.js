document.addEventListener("DOMContentLoaded", () => {
    const buildBtn = document.getElementById("build-btn");
    const joinBtn = document.getElementById("join-btn");
  
    buildBtn.addEventListener("click", () => {
      window.location.href = "build.html";
    });
  
    joinBtn.addEventListener("click", () => {
      window.location.href = "join.html";
    });
  });


const helpButton = document.getElementById("help-button");
const helpText = document.getElementById("help-text");

let helpTimeout;

helpButton.addEventListener("click", () => {
  helpText.style.display = "block";
  helpText.style.opacity = "1";

  clearTimeout(helpTimeout);
  helpTimeout = setTimeout(() => {
    if (!helpText.matches(':hover')) {
      helpText.style.opacity = "0";
      setTimeout(() => helpText.style.display = "none", 500);
    }
  }, 5000);
});

helpText.addEventListener("mouseleave", () => {
  helpText.style.opacity = "0";
  setTimeout(() => helpText.style.display = "none", 500);
});

helpText.addEventListener("mouseenter", () => {
  clearTimeout(helpTimeout);
});
