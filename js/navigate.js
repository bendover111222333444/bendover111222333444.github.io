let injectedScripts = new Set()

export async function navigate(main, page) {

    const html = await fetch(page).then(r => r.text());
    main.replaceChildren();
    main.insertAdjacentHTML("beforeend", `\n<!-- Replaced HTML --!>${html}\n`);

}

export async function inject(main, page) {

    const html = await fetch(page).then(r => r.text());
    main.insertAdjacentHTML("beforeend", `\n<!-- Injected HTML --!>${html}\n`);

}

export function loadScripts(scripts, checkIfExist) {

    scripts.forEach(script => {
        
        if (checkIfExist === true && injectedScripts.has(script.script)) { return }

        const newScript = document.createElement("script");
        newScript.src = script.script;

        if (script.module === true) {

            newScript.type = "module"

        }

        injectedScripts.add(script.script);
        
        newScript.onerror = () => {
            injectedScripts.delete(script.script);
        };

        document.body.appendChild(newScript);

    });

}