
export const content = document.getElementById("content");
export const root = document.documentElement

const rootCSS = "/css/index.css";

async function injectScripts(scripts) {

    for (const oldScript of scripts) {

        const newScript = document.createElement("script");

        for (const attr of oldScript.attributes) {

            newScript.setAttribute(attr.name, attr.value);

        }

        if (oldScript.src) {

            if (oldScript.type === "module") {

                oldScript.before(newScript);
                oldScript.remove();

            } else {

                await new Promise((resolve, reject) => {
                    newScript.onload = resolve;
                    newScript.onerror = reject;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

            }

        } else {

            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);

        }

    }

}

export async function navigateIframeInIframe(page) {

    window.frameElement.src = page;

}

export async function navigateIframe(iframe = content, page) {

    iframe.onload = () => {

        const transparentStyle = iframe.contentDocument.createElement('style');
        transparentStyle.textContent = 'body { background-color: transparent !important; }';
        iframe.contentDocument.head.appendChild(transparentStyle);

    };
    
    iframe.src = page;

}

export async function injectPage(root = document.documentElement, page) {

    const response = await fetch(page);
    if (!response.ok) {

        throw new Error(`HTTP error! status: ${response.status}`);

    }

    const html = await response.text();

    root.insertAdjacentHTML("beforeend", html);

    const scripts = root.querySelectorAll("script");

    await injectScripts(scripts)

}

export async function injectRaw(root = document.documentElement, html) {

    root.insertAdjacentHTML("beforeend", html);

    const scripts = root.querySelectorAll("script");

    await injectScripts(scripts)

}