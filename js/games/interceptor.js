(async function() {
    const interceptDiv = document.getElementById('intercept');
    if (!interceptDiv) return;

    const targetUrl = interceptDiv.getAttribute('data-src');
    if (!targetUrl) return;

    let user, repo, branch, filePath;
    if (targetUrl.includes("jsdelivr.net/gh/")) {
        const match = targetUrl.match(/jsdelivr\.net\/gh\/([^/]+)\/([^@/]+)(?:@([^/]+))?\/(.*)/);
        if (match) { 
            user = match[1]; 
            repo = match[2]; 
            branch = match[3] || "main"; 
            filePath = match[4]; 
        }
    } else {
        const match = targetUrl.match(/(?:githack\.com|statically\.io\/gh|github\.com)\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)/);
        if (match) { 
            user = match[1]; 
            repo = match[2]; 
            branch = match[3]; 
            filePath = match[4]; 
        }
    }

    if (!user) return;

    const roots = [
        `https://raw.githack.com/${user}/${repo}/${branch}/`,
        `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/`,
        `https://cdn.statically.io/gh/${user}/${repo}/${branch}/`
    ];
    
    const gameDir = filePath.split('/').slice(0, -1).join('/');

    // Inner asset fallback injection script (PROVIDER LOGGING ADDED)
    const fallbackEngineText = `
    <script>
        (function() {
            const roots = ${JSON.stringify(roots)};

            async function handleFallback(url, originalFunc, args) {
                let currentUrl = url;
                let matchingRootIndex = roots.findIndex(root => currentUrl.startsWith(root));
                let attempts = matchingRootIndex !== -1 ? roots.length : 1;
                let rootIndex = matchingRootIndex !== -1 ? matchingRootIndex : 0;

                for (let i = 0; i < attempts; i++) {
                    if (matchingRootIndex !== -1) {
                        console.log("➡️ [REQ]:", currentUrl);
                    }
                    try {
                        let res = await (originalFunc === 'fetch' ? window._realFetch(...args) : window._realXhrFetch(currentUrl));
                        if (res.ok || res.status === 200) {
                            return res;
                        }
                        throw new Error("Status " + res.status);
                    } catch (err) {
                        if (matchingRootIndex !== -1 && i < attempts - 1) {
                            rootIndex = (rootIndex + 1) % roots.length;
                            currentUrl = roots[rootIndex] + currentUrl.replace(roots[matchingRootIndex], '');
                            matchingRootIndex = rootIndex;
                            
                            // CLEAR LOG SHOWING THE SWITCH HAPPENING IN REAL TIME
                            console.warn("🔄 [SWITCHING TO BACKUP CDN]: Falling back to ->", currentUrl);
                        }
                    }
                }
                if (matchingRootIndex === -1) {
                    return { ok: true, status: 200, text: () => '{"status":"ok"}', arrayBuffer: () => new ArrayBuffer() };
                }
            }

            window._realFetch = window.fetch;
            window.fetch = async function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                let fallbackRes = await handleFallback(url, 'fetch', arguments);
                if (fallbackRes) return fallbackRes;
                return window._realFetch(input, init);
            };

            window._realXhrFetch = url => window._realFetch(url);
            const RealXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new RealXHR();
                const realOpen = xhr.open;
                const realSend = xhr.send;
                let targetUrl = '';

                xhr.open = function(method, url) {
                    targetUrl = new URL(url, window.location.href).href;
                    return realOpen.apply(this, arguments);
                };

                xhr.send = async function() {
                    let res = await handleFallback(targetUrl, 'xhr', []);
                    if (res && res.arrayBuffer) {
                        const buffer = await res.arrayBuffer();
                        Object.defineProperty(xhr, 'readyState', { value: 4 });
                        Object.defineProperty(xhr, 'status', { value: 200 });
                        Object.defineProperty(xhr, 'response', { value: buffer });
                        Object.defineProperty(xhr, 'responseText', { value: new TextDecoder().decode(buffer) });
                        if (xhr.onreadystatechange) xhr.onreadystatechange();
                        xhr.dispatchEvent(new Event('load'));
                    } else {
                        realSend.apply(this, arguments);
                    }
                };
                return xhr;
            };
        })();
    <\/script>
    `;

    const iframe = document.createElement('iframe');
    iframe.id = 'game-frame';
    iframe.setAttribute('allow', 'autoplay; fullscreen; gamepad; pointer-lock *');
    document.body.appendChild(iframe);

    for (let i = 0; i < roots.length; i++) {
        const initialFetchUrl = roots[i] + filePath;
        console.log("➡️ [PARENT FETCHING ROUTE] Trying:", initialFetchUrl);
        try {
            const response = await fetch(initialFetchUrl);
            if (response.ok) {
                let htmlText = await response.text();
                
                const baseTag = `<base href="${roots[i]}${gameDir}/">`;
                htmlText = htmlText.replace('<head>', '<head>' + baseTag + fallbackEngineText);
                
                const blob = new Blob([htmlText], { type: 'text/html' });
                iframe.src = URL.createObjectURL(blob);
                console.log("✅ [PARENT PIPELINE COMPLETE] Local Blob execution deployed.");
                return;
            }
        } catch (err) {
            console.error("❌ Route unavailable.");
        }
    }
})();