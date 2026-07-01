import {content, navigateHtml, loadScripts, injectRaw} from "./public.js";

(async () => {

    await navigateHtml(content, "./pages/main.html", false);
    await navigateHtml(content, "./pages/static.html", true);
    await loadScripts([{script: "./js/main.js", module: true}, {script: "./js/static.js", module: true}]);

})();