import { content, navigateIframe, injectRaw } from "/js/public.js";
import { tapeTemplate } from "/js/templates.js";

const cloaker = document.getElementById("cloaker")
const loadingDiv = document.getElementById("loadingDiv")
const loadingTape = document.getElementById("loadingTape")

const afterCloakLink = 'https://google.com'

const tape = new Image();
tape.src = "/images/tape.png";

const tapeAmount = Math.ceil(tape.naturalWidth / tape.naturalHeight);

let buttons = document.querySelectorAll("[data-send-to]");
let templates = ""
let forward = true;

function openPopup() {

    const currentUrl = window.location.href;
    const popup = window.open('about:blank', '_blank');

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        alert("Pop-up blocked! Please enable pop-ups for this site to work.");
        return;
    }

    const doc = popup.document;
    doc.body.style.margin = '0';
    doc.body.style.height = '100vh';
    doc.body.style.overflow = 'hidden';

    const iframe = doc.createElement('iframe');
    iframe.src = currentUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    doc.body.appendChild(iframe);

    window.location.href = afterCloakLink; 

}

function fadeIn() {

    loadingDiv.style.display = "block";
    loadingDiv.classList.add("fadeInClass")

    loadingDiv.addEventListener("animationend", (event) => {

        if (event.animationName === "fadeIn") {

            loadingDiv.classList.remove("fadeInClass")
            loadingDiv.style.pointerEvents = "auto";

        }

    });

}

function fadeOut() {

    loadingDiv.style.pointerEvents = "none";
    loadingDiv.classList.add("fadeOutClass")

    loadingDiv.addEventListener("animationend", (event) => {

        if (event.animationName === "fadeOut") {

            loadingDiv.classList.remove("fadeOutClass")
            loadingDiv.style.display = "none";

        }

    });

}

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;

    if (sendTo) {

        fadeIn();

        await navigateIframe(content, `/pages/${sendTo}`);

    }

}

(async () => {

    fadeOut();

    for (let tapeIndex = 0; tapeIndex < tapeAmount; tapeIndex++) {

        templates += tapeTemplate(forward);
        
        if (forward === true) {

            forward = false;

        } else if (forward === false) {

            forward = true;

        }

    }

    await injectRaw(loadingTape, templates);

    content.addEventListener("load", () => {

        fadeOut()

    });

    buttons.forEach(button => {

        button.addEventListener("click", buttonFunc);

    });

    cloaker.addEventListener("click", () => {

        openPopup();

    }) 

})();