import { navigateHtml, loadScripts } from "./navigate.js";

const content = document.getElementById("content");

let buttons;

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;
    const scripts = event.currentTarget.dataset.scripts;

    if (sendTo) {

        await navigateHtml(content, `./pages/${sendTo}`, false);
        await navigateHtml(content, `./pages/static.html`, true);

        setTimeout(init, 0);

    }

    if (scripts) {

        const scriptObjects = JSON.parse(scripts);
        loadScripts(scriptObjects);

    }    

}

function init() {

    buttons = document.querySelectorAll("[data-send-to]");
    buttons.forEach(button => {

        button.addEventListener("click", buttonFunc);

    });

}

init();