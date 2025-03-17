document.onkeydown = function (e) {
  if (e.key === "Enter") {
    splashText();
  }
};

var says = [];
fetch('https://raw.githubusercontent.com/bendover111222333444/games/refs/heads/main/says.txt')
  .then(response => response.text())
  .then(text => {
    says = text.split('\n').filter(line => line.trim() !== '');
    splashText();
  });

function splashText() {
  if (says.length > 0) {
    document.querySelector(".Index-SplashText").innerHTML =
      says[Math.floor(Math.random() * says.length)];
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  splashText();
  
  fetch("https://ipv4.wtfismyip.com/json")
    .then((response) => response.json())
    .then((data) => {
        proxylocation = data.YourFuckingLocation;
        ipAddress = data.YourFuckingIPAddress;
        isp = data.YourFuckingISP;
        says.push(`Sending missile to ${proxylocation}😈`);
        says.push(`umm your ip is ${ipAddress}`);
        says.push(`nice isp, "${isp}"`);
        splashText();
    });
  fetch("https://discord.com/api/guilds/1288933489818865784/widget.json")
    .then((response) => response.json())
    .then((data) => {
      invite = data.instant_invite;
      says.push(`Join? "${invite}"`);
      splashText();
    });
});


function calculateBrightness(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  return (r*0.2126 + g*0.7152 + b*0.0722);
}

function adjustColor(hex, amount) {
  let color = hex.slice(1);
  let r = parseInt(color.slice(0, 2), 16);
  let g = parseInt(color.slice(2, 4), 16);
  let b = parseInt(color.slice(4, 6), 16);

  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));

  return `#${(1 << 24) + (r << 16) + (g << 8) + b}`.toString(16).slice(1);
}

document.addEventListener('keydown', function(event) {
  if (event.key.toLowerCase() === '`') {
      const gameLinks = document.getElementsByClassName('game-link');
      if (gameLinks.length > 0) {
          const randomIndex = Math.floor(Math.random() * gameLinks.length);
          const randomGame = gameLinks[randomIndex].parentElement.getAttribute('href');
          window.open(randomGame, '_blank');
      }
  }
});

let typedWord = '';
const targetWords = ['sigma','tuah', 'getout', 'skibidi', 'rizz', 'alpha', 'gyatt', 'ohio', 'mewing', 'goon', 'fanum','sus','amongus'];
const secret = ['ilovecats'];
const RAHHHH = ['idontlovecats','ilovedogs','catsuck','catssuck'];
const secretl = '/CAR/secret.html';
const RAHHHHl = 'https://medium.com/writing-in-the-media/cats-are-better-than-dogs-even-science-says-so-ca57e815f6d1';
const link = 'https://www.calm.com/blog/brainrot';
document.addEventListener('keydown', function(event) {
  const key = event.key.toLowerCase();
  typedWord += key;

  console.log(`Typed letter: ${key}`);
  console.log(`Current typedWord: ${typedWord}`);

  if (targetWords.some(word => typedWord.includes(word))) {
      window.open(link, '_blank');
      console.log("Brainroted person detected!");
      typedWord = '';
  }
  else if (secret.some(word => typedWord.includes(word))) {
      window.open(secretl, '_blank');
      console.log("Warping to car place");
      typedWord = '';
  }
  else if (RAHHHH.some(word => typedWord.includes(word))) {
      window.open(RAHHHHl, '_blank');
      console.log("GET OUT");
      typedWord = '';
  }
  const maxLength = Math.max(...targetWords.map(word => word.length), ...secret.map(word => word.length));
  if (typedWord.length > maxLength) {
      typedWord = typedWord.slice(-maxLength);
  }
});
const colorPicker = document.getElementById('background-color');
const resetButton = document.getElementById('reset-color');

document.addEventListener('DOMContentLoaded', () => {
const savedColor = localStorage.getItem('background-color');
if (savedColor) {
  colorPicker.value = savedColor;
  document.documentElement.style.setProperty('--background-color', savedColor);
}
});

colorPicker.addEventListener('input', function(event) {
const backgroundColor = event.target.value;
document.documentElement.style.setProperty('--background-color', backgroundColor);
localStorage.setItem('background-color', backgroundColor);
});

resetButton.addEventListener('click', () => {
localStorage.removeItem('background-color','game-link-bg','game-link-other-bg','game-grid-bg','text-color','game-link-hover');
location.reload();
});

function calculateBrightness(hex) {
const rgb = parseInt(hex.slice(1), 16);
const r = (rgb >> 16) & 0xff;
const g = (rgb >>  8) & 0xff;
const b = (rgb >>  0) & 0xff;
return (r*0.2126 + g*0.7152 + b*0.0722);
}

function adjustColor(hex, amount) {
let color = hex.slice(1);
let r = parseInt(color.slice(0, 2), 16);
let g = parseInt(color.slice(2, 4), 16);
let b = parseInt(color.slice(4, 6), 16);

r = Math.min(255, Math.max(0, r + amount));
g = Math.min(255, Math.max(0, g + amount));
b = Math.min(255, Math.max(0, b + amount));

return `#${(1 << 24) + (r << 16) + (g << 8) + b}`.toString(16).slice(1);
}
