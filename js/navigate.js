export async function navigateHtml(root, page, addTo) {

    const html = await fetch(page).then(r => r.text());
    if(addTo === false) {

        root.replaceChildren();

    }

    root.insertAdjacentHTML("beforeend", `\n<!-- Injected Html -->${html}\n`);

}

export async function injectRaw(root, html, addTo) {

    if(addTo === false) {

        root.replaceChildren();

    }

    root.insertAdjacentHTML("beforeend", `\n<!-- Added Html -->${html}\n`);

}

export function loadScripts(scripts) {

    scripts.forEach(script => {
        
        const old = document.querySelector(`script[src="${script.script}"]`);
        if (old) old.remove();

        const newScript = document.createElement("script");
        newScript.src = `${script.script}?t=${Date.now()}`;

        if (script.module === true) {

            newScript.type = "module"

        }

        document.body.appendChild(newScript);

    });

}