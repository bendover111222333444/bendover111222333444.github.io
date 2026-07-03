(function() {
    const CDN_MAPPING = {
        'unpkg.com': {
            targetHost: 'cdn.jsdelivr.net',
            transform: (path) => `/npm${path}`
        },
        'raw.githubusercontent.com': {
            targetHost: 'cdn.jsdelivr.net',
            transform: (path) => `/gh${path.replace('/master/', '@master/').replace('/main/', '@main/')}`
        },
        'cdn.jsdelivr.net': {
            targetHost: 'unpkg.com',
            transform: (path) => path.replace(/^\/npm/, '')
        }
    };

    window.addEventListener('error', function(event) {
        const target = event.target;
        
        if (!target || !(target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
            return;
        }

        const originalUrlAttr = target.tagName === 'SCRIPT' ? 'src' : 'href';
        const originalUrlStr = target[originalUrlAttr];
        
        if (!originalUrlStr || target.dataset.fallbackRetried) return;

        try {
            const url = new URL(originalUrlStr);
            const hostConfig = CDN_MAPPING[url.host];

            if (hostConfig) {
                target.dataset.fallbackRetried = "true";

                const newPath = hostConfig.transform(url.pathname);
                const fallbackUrl = `https://${hostConfig.targetHost}${newPath}${url.search}${url.hash}`;

                const newElement = document.createElement(target.tagName);
                
                if (target.tagName === 'LINK') {
                    newElement.rel = target.rel || 'stylesheet';
                    newElement.type = target.type || 'text/css';
                    if (target.media) newElement.media = target.media;
                } else {
                    if (target.type) newElement.type = target.type;
                    if (target.defer) newElement.defer = target.defer;
                    if (target.async) newElement.async = target.async;
                }
                
                newElement[originalUrlAttr] = fallbackUrl;
                newElement.dataset.fallbackRetried = "true";

                target.parentNode.insertBefore(newElement, target.nextSibling);
                target.remove();
            }
        } catch (e) {}
    }, true);
})();