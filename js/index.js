import {navigateHtml, loadScripts, injectRaw} from "./navigate.js";

const content = document.getElementById("content"); 

(async () => {

    await navigateHtml(content, "./pages/main.html", false);
    await navigateHtml(content, "./pages/static.html", true);
    loadScripts([{script: "./js/main.js", module: false}, {script: "./js/static.js", module: true}]);

})();