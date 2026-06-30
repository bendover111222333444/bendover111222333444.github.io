import {navigate, inject, loadScripts} from "./navigate.js";

const content = document.getElementById("content"); 

(async () => {

    await navigate(content, "./pages/main.html");
    await inject(content, "./pages/static.html");
    loadScripts([{script: "./js/main.js", module: false}, {script: "./js/static.js", module: true}], true);

})();