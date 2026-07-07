(function() {
    // The domains we want to look for and cycle through
    const domains = [
        "cdn.jsdelivr.net",
        "cdn.statically.io",
        "raw.githack.com"
    ];

    // Core fallback swapper: Takes a failed URL and tries the alternative domains
    async function tryFetchWithFallback(url, originalInput, init) {
        // Find which domain the current request is using
        const currentDomainIndex = domains.findIndex(d => url.includes(d));
        if (currentDomainIndex === -1) {
            return window._realFetch(originalInput, init); // Not our targets, pass through
        }

        // Try every domain in our list starting from the current one
        for (let i = 0; i < domains.length; i++) {
            const attemptIndex = (currentDomainIndex + i) % domains.length;
            const targetUrl = url.replace(domains[currentDomainIndex], domains[attemptIndex]);

            console.log("➡️ [NETWORK REQUEST]:", targetUrl);
            try {
                let res = await window._realFetch(targetUrl, init);
                if (res.ok || res.status === 200) {
                    return res; // Success! Return the response
                }
                throw new Error("Status " + res.status);
            } catch (err) {
                console.warn("🔄 [ROUTE FAILURE]: Trying next domain layout...", targetUrl);
            }
        }
        return new Response('{"status":"error"}', { status: 404 });
    }

    // 1. Intercept window.fetch
    window._realFetch = window.fetch;
    window.fetch = async function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        return tryFetchWithFallback(url, input, init);
    };

    // 2. Intercept XMLHttpRequest
    const RealXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new RealXHR();
        const realOpen = xhr.open;
        const realSend = xhr.send;
        let requestUrl = '';

        xhr.open = function(method, url) {
            requestUrl = url;
            return realOpen.apply(this, arguments);
        };

        xhr.send = function(body) {
            // Resolve relative URLs to absolute so domain matching works cleanly
            const absoluteUrl = new URL(requestUrl, document.baseURI).href;
            
            const currentDomainIndex = domains.findIndex(d => absoluteUrl.includes(d));
            if (currentDomainIndex === -1) {
                return realSend.apply(this, arguments); // Pass through normal requests
            }

            // Route through the fallback engine
            tryFetchWithFallback(absoluteUrl, absoluteUrl, {})
                .then(async (res) => {
                    const buffer = await res.arrayBuffer();
                    Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
                    Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
                    Object.defineProperty(xhr, 'response', { value: buffer, configurable: true });
                    Object.defineProperty(xhr, 'responseText', { value: new TextDecoder().decode(buffer), configurable: true });
                    
                    if (xhr.onreadystatechange) xhr.onreadystatechange();
                    xhr.dispatchEvent(new Event('load'));
                })
                .catch(() => {
                    xhr.dispatchEvent(new Event('error'));
                });
        };
        return xhr;
    };
})();