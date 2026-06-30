import { navigate, inject, loadScripts } from "./navigate.js";

const content = document.getElementById("content");

let buttons;

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;
    const scripts = event.currentTarget.dataset.scripts;

    if (sendTo) {
    
        reset();

        await navigate(content, `./pages/${sendTo}`);
        await inject(content, `./pages/static.html`);

        setTimeout(init, 0);

    }

    if (scripts) {

        const scriptObjects = JSON.parse(scripts);
        loadScripts(scriptObjects, true);

    }    

}

function init() {

    buttons = document.querySelectorAll("[data-send-to]");
    buttons.forEach(button => {

        button.addEventListener("click", buttonFunc);

    });

}

function reset() {

    buttons.forEach(button => {

        button.removeEventListener("click", buttonFunc);

    });

}

init();