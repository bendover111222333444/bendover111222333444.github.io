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
            targetHost: 'raw.githack.com',
            transform: (path) => path.replace(/^\/gh\//, '/') // Redirects failed jsDelivr hits straight to GitHack
        }
    };

    function getFallbackUrl(originalUrlStr) {
        try {
            const url = new URL(originalUrlStr);
            const hostConfig = CDN_MAPPING[url.host];
            if (hostConfig) {
                const newPath = hostConfig.transform(url.pathname);
                return `https://${hostConfig.targetHost}${newPath}${url.search}${url.hash}`;
            }
        } catch (e) {}
        return null;
    }

    // Asset tag failures (Scripts, CSS)
    window.addEventListener('error', function(event) {
        const target = event.target;
        if (!target || !(target.tagName === 'SCRIPT' || target.tagName === 'LINK')) return;

        const originalUrlAttr = target.tagName === 'SCRIPT' ? 'src' : 'href';
        const originalUrlStr = target[originalUrlAttr];
        
        if (!originalUrlStr || target.dataset.fallbackRetried) return;

        const fallbackUrl = getFallbackUrl(originalUrlStr);
        if (fallbackUrl) {
            target.dataset.fallbackRetried = "true";
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
    }, true);

    // Internal engine game files (.data, .wasm, config files)
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = async function(input, init) {
            const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
            try {
                return await originalFetch(input, init);
            } catch (err) {
                const fallbackUrl = getFallbackUrl(urlStr);
                if (fallbackUrl) {
                    console.warn(`Redirecting broken request to fallback: ${fallbackUrl}`);
                    if (typeof input === 'string') {
                        return originalFetch(fallbackUrl, init);
                    } else if (input instanceof Request) {
                        return originalFetch(new Request(fallbackUrl, input), init);
                    }
                }
                throw err;
            }
        };
    }
})();