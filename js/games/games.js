import {root, navigateIframeInIframe, injectRaw} from "/js/public.js";
import {sources, gnMathFormatData, ugsFormatData, ubgFormatData} from "/js/games/games-public.js";
import {buttonTemplate} from "/js/templates.js";

const gamesGridDiv = document.getElementById("gamesGridDiv");

async function buttonFunc(event) {

    const htmlLink = event.currentTarget.dataset.html;
    const response = await fetch(htmlLink);
    const htmlText = await response.text();

    const blob = new Blob([htmlText], { type: 'text/html' });

    const blobURL = URL.createObjectURL(blob);
    navigateIframeInIframe(blobURL);
    
}

async function getGames(formatFunc) {

    const buttonsRemove = Array.from(document.getElementsByClassName("gameButton"));
    buttonsRemove.forEach(button => {
        
        button.removeEventListener("click", buttonFunc)
        button.remove();

    });

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

getGames(ubgFormatData); // default
document.querySelectorAll("button[data-provider]").forEach(button => {

    button.addEventListener("click", async () => {
        
        const provider = button.dataset.provider;
        await getGames(sources[provider]);
    
    });

});