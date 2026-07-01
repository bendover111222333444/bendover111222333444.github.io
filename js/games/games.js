import {navigateHtml, injectRaw} from "../navigate.js";
import createAdBlocker from "./blockads.js";
import gnMathFormatData from "./gn-math.js";

const gamesGridDiv = document.getElementById("gamesGridDiv");
const content = document.getElementById("content"); 

function buttonTemplate(name, html, cover) {

    return `<button class="gameButton" data-html=${html}> 
        <img class="gameImg" src="${cover}" alt="${name}"> 
        <p class="defaultText gameText">${name}</p> 
    </button>`

}

function iframeTemplate(html) {

    return `<iframe src="${html}" style="width:100vh; height:100vw; border:0;"></iframe>`

}

async function buttonFunc(event) {

    const htmlLink = event.currentTarget.dataset.html
    await injectRaw(content, iframeTemplate(htmlLink), false);
    await navigateHtml(content, "./pages/static.html", true);

}

async function getGames(formatFunc) {

    const gameData = await formatFunc();
    let injectHtml = ``
    
    gameData.forEach(game => {
        
        injectHtml += buttonTemplate(game.name, game.html, game.cover);

    });

    await injectRaw(gamesGridDiv, injectHtml, false);
    
    const buttons = Array.from(document.getElementsByClassName("gameButton"));
    buttons.forEach(button => {
        
        button.addEventListener("click", buttonFunc)

    });

}

getGames(gnMathFormatData);