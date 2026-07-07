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

    // Updated Priority Order: 1. jsDelivr, 2. Statically, 3. GitHack
    const roots = [
        `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/`,
        `https://cdn.statically.io/gh/${user}/${repo}/${branch}/`,
        `https://raw.githack.com/${user}/${repo}/${branch}/`
    ];
    
    const pathSegments = filePath.split('/');
    const gameDir = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') + '/' : '';

    const fallbackEngineText = `
    <script>
        (function() {
            const roots = ${JSON.stringify(roots)};
            let currentRootIndex = 0; // Starts at jsDelivr (index 0)

            function parseTargetAsset(url) {
                let absoluteUrl = new URL(url, document.baseURI).href;
                
                for (const root of roots) {
                    if (absoluteUrl.startsWith(root)) {
                        if (absoluteUrl.startsWith(root + "${gameDir}")) {
                            return { bypass: false, path: absoluteUrl.replace(root + "${gameDir}", '') };
                        }
                        return { bypass: false, path: absoluteUrl.replace(root, '') };
                    }
                }
                
                const genericMatch = absoluteUrl.match(/(?:jsdelivr\\.net\\/gh|githack\\.com|statically\\.io\\/gh)\/[^/]+\/[^/]+\/[^/]+\/(.*)/);
                if (genericMatch) {
                    return { bypass: false, path: genericMatch[1] };
                }
                
                if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
                    return { bypass: false, path: url };
                }
                
                if (absoluteUrl.startsWith(window.location.origin)) {
                    return { bypass: false, path: new URL(absoluteUrl).pathname.replace(/^\\//, '') };
                }

                return { bypass: true, path: null };
            }

            async function tryFetchWithFallback(rawPath) {
                let attempts = roots.length;
                
                for (let i = 0; i < attempts; i++) {
                    const activeRoot = roots[currentRootIndex];
                    const targetUrl = activeRoot + "${gameDir}" + rawPath;
                    
                    console.log("➡️ [INTERCEPTED REQ]:", targetUrl);
                    try {
                        let res = await window._realFetch(targetUrl);
                        if (res.ok || res.status === 200) {
                            return res;
                        }
                        throw new Error("Status " + res.status);
                    } catch (err) {
                        console.warn("🔄 [CDN FAILURE]: Rotating away from ->", targetUrl);
                        currentRootIndex = (currentRootIndex + 1) % roots.length;
                    }
                }
                return new Response('{"status":"error"}', { status: 404 });
            }

            window._realFetch = window.fetch;
            window.fetch = async function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                const decision = parseTargetAsset(url);
                
                if (decision.bypass) {
                    return window._realFetch(input, init);
                }
                
                return tryFetchWithFallback(decision.path);
            };

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
                    const decision = parseTargetAsset(requestUrl);
                    
                    if (decision.bypass) {
                        return realSend.apply(this, arguments);
                    }
                    
                    window._realFetch(requestUrl)
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
    <\/script>
    `;

    // Try parent fetch loop to grab index.html using priority order
    for (let i = 0; i < roots.length; i++) {
        const initialFetchUrl = roots[i] + filePath;
        console.log("➡️ [PARENT FETCHING ROUTE] Trying:", initialFetchUrl);
        try {
            const response = await fetch(initialFetchUrl);
            if (response.ok) {
                let htmlText = await response.text();
                
                // CRITICAL FIX: Strip hardcoded absolute repo links inside HTML tags (src="..." or href="...")
                // This forces elements to resolve relatively against the <base> tag instead.
                const cdnEscapeRegex = new RegExp(`href=["'](?:https?:)?//(?:cdn\\.jsdelivr\\.net/gh|cdn\\.statically\\.io/gh|raw\\.githack\\.com)/${user}/${repo}[^"']*?/${gameDir}([^"']+)["']|src=["'](?:https?:)?//(?:cdn\\.jsdelivr\\.net/gh|cdn\\.statically\\.io/gh|raw\\.githack\\.com)/${user}/${repo}[^"']*?/${gameDir}([^"']+)["']`, 'gi');
                
                htmlText = htmlText.replace(cdnEscapeRegex, (match, p1, p2) => {
                    const relativePath = p1 || p2;
                    return match.startsWith('href') ? `href="${relativePath}"` : `src="${relativePath}"`;
                });

                const baseTag = `<base href="${roots[i]}${gameDir}">`;
                
                if (htmlText.includes('<head>')) {
                    htmlText = htmlText.replace('<head>', '<head>' + baseTag + fallbackEngineText);
                } else {
                    htmlText = baseTag + fallbackEngineText + htmlText;
                }
                
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