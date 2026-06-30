export default function createAdBlocker(root) {
    if (!root || !(root instanceof Element)) return null;

    const originalOpen = window.open;

    window.open = function (url, name, specs) {
        if (document.activeElement && root.contains(document.activeElement)) {
            console.log("[AdBlock] popup blocked:", url);
            return null;
        }
        return originalOpen.apply(window, arguments);
    };

    function isAdLike(str = "") {
        str = String(str).toLowerCase();

        const patterns = [
            "doubleclick",
            "googlesyndication",
            "googletagmanager",
            "adservice",
            "taboola",
            "outbrain",
            "popunder",
            "popup",
            "banner",
            "sponsor",
            "ads",
            "redirect",
            "click"
        ];

        return patterns.some(p => str.includes(p));
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!node || node.nodeType !== 1) continue;
                if (!root.contains(node)) continue;

                const tag = node.tagName?.toLowerCase();

                if (tag === "iframe") {
                    if (isAdLike(node.src)) {
                        console.log("[AdBlock] iframe blocked:", node.src);
                        node.remove();
                        continue;
                    }
                }

                if (tag === "script") {
                    if (isAdLike(node.src) || isAdLike(node.innerHTML)) {
                        console.log("[AdBlock] script blocked");
                        node.remove();
                        continue;
                    }
                }

                if (tag === "div") {
                    const blob =
                        (node.id || "") + " " +
                        (node.className || "") + " " +
                        (node.innerText || "");

                    if (isAdLike(blob)) {
                        console.log("[AdBlock] div blocked:", node);
                        node.remove();
                    }
                }
            }
        }
    });

    observer.observe(root, {
        childList: true,
        subtree: true
    });

    return {
        stop() {
            observer.disconnect();
            window.open = originalOpen;
            console.log("[AdBlock] stopped");
        }
    };
}