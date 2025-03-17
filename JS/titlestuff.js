let intervalId;

window.addEventListener("keydown", function (e) {
  if (e.key === "q" || e.key === "Q") {
    document.title = "Inbox (4)";
    window.location.href = "https://drive.google.com";
    
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = 'images/gmail-logo.png?';
    document.getElementsByTagName('head')[0].appendChild(link);

    clearInterval(intervalId); 
  }
});

const siteNames = [
    "N", 
    "Ni", 
    "Nig", 
    "Nigg", 
    "Niggg", 
    "Ninten", 
    "Nintend", 
    "Nintendo", 
    "Nintendob", 
    "Nintendobo", 
    "Nintendoboi", 
    "Nintendoboi2", 
    "Nintendoboi22",
    "Nintendoboi222", 
    "Nintendoboi2222",
    "Nintendoboi22222",
    "Nintendoboi222222",
    "Nintendoboi2222222",
    "Nintendoboi22222222",
    "Nintendoboi222222222",
    "Nintendoboi2222222222",
    "Nintendoboi22222222222",
    "Nintendoboi222222222222",
    "Nintendoboi2222222222222",
    "Nintendoboi22222222222222",
    "Nintendoboi222222222222222",
    "Nintendoboi2222222222222222",
    "Nah just kidding bendover111222333444"
];

let currentIndex = 0;
let goingForward = true;

function changeSiteName() {
  document.title = siteNames[currentIndex];
  
  if (goingForward) {
    currentIndex++;
    if (currentIndex >= siteNames.length - 1) {
      goingForward = false;
    }
  } else {
    currentIndex--;
    if (currentIndex <= 0) {
      goingForward = true;
    }
  }
}

intervalId = setInterval(changeSiteName, 1000);
