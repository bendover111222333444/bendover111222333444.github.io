import { content, navigateIframe } from "/js/public.js";

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;

    if (sendTo) {

        await navigateIframe(content, `/pages/${sendTo}`);

    }

}

let buttons = document.querySelectorAll("[data-send-to]");
buttons.forEach(button => {

    button.addEventListener("click", buttonFunc);

});
