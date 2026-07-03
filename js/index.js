import {content, root, navigateIframe, injectPage} from "/js/public.js";

(async () => {

    await navigateIframe(content, "/pages/main.html");
    await injectPage(root, "/pages/inject/static.html", false)

})();