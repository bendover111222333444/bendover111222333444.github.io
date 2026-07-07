(function() {
    // Define structural builders for each unique CDN layout
    const cdnBuilders = [
        {
            domain: "cdn.jsdelivr.net",
            build: (user, repo, branch, file) => `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${file}`
        },
        {
            domain: "cdn.statically.io",
            build: (user, repo, branch, file) => `https://cdn.statically.io/gh/${user}/${repo}/${branch}/${file}`
        },
        {
            domain: "raw.githack.com",
            build: (user, repo, branch, file) => `https://raw.githack.com/${user}/${repo}/${branch}/${file}`
        }
    ];

    // Helper to parse any incoming CDN URL into its core components
    function parseCdnUrl(url) {
        let match;
        if (url.includes("jsdelivr.net")) {
            match = url.match(/jsdelivr\.net\/gh\/([^/]+)\/([^@/]+)(?:@([^/]+))?\/(.*)/);
            if (match) return { user: match[1], repo: match[2], branch: match[3] || "main", file: match[4] };
        } else if (url.includes("statically.io")) {
            match = url.match(/statically\.io\/gh\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)/);
            if (match) return { user: match[1], repo: match[2], branch: match[3], file: match[4] };
        } else if (url.includes("githack.com")) {
            match = url.match(/githack\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)/);
            if (match) return { user: match[1], repo: match[2], branch: match[3], file: match[4] };
        }
        return null;
    }

    async function tryFetchWithFallback(url, originalInput, init) {
        // Parse the absolute URL structure
        const absoluteUrl = new URL(url, document.baseURI).href;
        const parsed = parseCdnUrl(absoluteUrl);

        // If it's not a recognized CDN asset path, pass it straight through
        if (!parsed) {
            return window._realFetch(originalInput, init);
        }

        // Find where we are currently starting in our CDN builders sequence
        const currentDomainIndex = cdnBuilders.findIndex(b => absoluteUrl.includes(b.domain));
        const startIndex = currentDomainIndex !== -1 ? currentDomainIndex : 0;

        // Loop through all builders using proper structural routing rules
        for (let i = 0; i < cdnBuilders.length; i++) {
            const attemptIndex = (startIndex + i) % cdnBuilders.length;
            const builder = cdnBuilders[attemptIndex];
            
            // Build a clean, native URL layout specific to this destination CDN
            const targetUrl = builder.build(parsed.user, parsed.repo, parsed.branch, parsed.file);

            console.log("➡️ [NETWORK REQUEST]:", targetUrl);
            try {
                let res = await window._realFetch(targetUrl, init);
                if (res.ok || res.status === 200) {
                    return res;
                }
                throw new Error("Status " + res.status);
            } catch (err) {
                console.warn("🔄 [ROUTE FAILURE]: Rotating layout...", targetUrl);
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
            const absoluteUrl = new URL(requestUrl, document.baseURI).href;
            const parsed = parseCdnUrl(absoluteUrl);
            
            if (!parsed) {
                return realSend.apply(this, arguments);
            }

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