import {content, navigateHtml, injectRaw, initBtns} from "../public.js";
import {gnMathFormatData} from "./games-public.js";
import {iframeTemplate, buttonTemplate} from "../templates.js";

const gamesGridDiv = document.getElementById("gamesGridDiv");

async function buttonFunc(event) {

    const htmlLink = event.currentTarget.dataset.html;
    await injectRaw(content, await iframeTemplate(htmlLink), false);
    await navigateHtml(content, `./pages/static.html`, true);
    initBtns();

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