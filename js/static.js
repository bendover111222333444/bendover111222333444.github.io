import { content, navigateIframe } from "/js/public.js";

const cloaker = document.getElementById("cloaker")

const afterCloakLink = 'https://google.com'

let buttons = document.querySelectorAll("[data-send-to]");

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

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;

    if (sendTo) {

        await navigateIframe(content, `/pages/${sendTo}`);

    }

}

buttons.forEach(button => {

    button.addEventListener("click", buttonFunc);

});

cloaker.addEventListener("click", () => {

    openPopup();

}) 