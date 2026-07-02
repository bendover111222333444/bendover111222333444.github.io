(function() {
  const providers = [
    "https://cdn.jsdelivr.net/gh/",
    "https://raw.githubusercontent.com/",
    "https://statically.io/gh/",
    "https://raw.githack.com/"
  ];

  function getNextFallbackUrl(currentUrl) {
    let matchingIndex = -1;
    let user = "";
    let repo = "";
    let branchOrHash = "main";
    let restOfPath = "";

    if (currentUrl.startsWith("https://cdn.jsdelivr.net/gh/")) {
      matchingIndex = 0;
      const path = currentUrl.replace("https://cdn.jsdelivr.net/gh/", "");
      const parts = path.split('/');
      user = parts[0];
      
      const repoPart = parts[1] || "";
      if (repoPart.includes('@')) {
        const repoSplit = repoPart.split('@');
        repo = repoSplit[0];
        branchOrHash = repoSplit[1];
      } else {
        repo = repoPart;
      }
      restOfPath = parts.slice(2).join('/');
    } 
    else if (currentUrl.startsWith("https://raw.githubusercontent.com/")) {
      matchingIndex = 1;
      const path = currentUrl.replace("https://raw.githubusercontent.com/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      branchOrHash = parts[2];
      restOfPath = parts.slice(3).join('/');
    } 
    else if (currentUrl.startsWith("https://statically.io/gh/")) {
      matchingIndex = 2;
      const path = currentUrl.replace("https://statically.io/gh/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      branchOrHash = parts[2];
      restOfPath = parts.slice(3).join('/');
    } 
    else if (currentUrl.startsWith("https://raw.githack.com/")) {
      matchingIndex = 3;
      const path = currentUrl.replace("https://raw.githack.com/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      branchOrHash = parts[2];
      restOfPath = parts.slice(3).join('/');
    }

    if (matchingIndex === -1 || !user || !repo || !restOfPath) return null;

    const nextIndex = matchingIndex + 1;
    if (nextIndex >= providers.length) return null;

    if (nextIndex === 1) {
      return `https://raw.githubusercontent.com/${user}/${repo}/${branchOrHash}/${restOfPath}`;
    }
    if (nextIndex === 2) {
      return `https://statically.io/gh/${user}/${repo}/${branchOrHash}/${restOfPath}`;
    }
    if (nextIndex === 3) {
      return `https://raw.githack.com/${user}/${repo}/${branchOrHash}/${restOfPath}`;
    }

    return null;
  }

  window.addEventListener('error', function(event) {
    const element = event.target;
    if (!element || (!element.src && !element.href)) return;
    
    const currentUrl = element.src || element.href;
    const nextUrl = getNextFallbackUrl(currentUrl);
    
    if (nextUrl) {
      event.preventDefault();
      if (element.src) {
        element.src = nextUrl;
      } else if (element.href && element.rel === 'stylesheet') {
        element.href = nextUrl;
      }
    }
  }, true);

  window.addEventListener('click', function(event) {
    const anchor = event.target.closest('a');
    if (!anchor || !anchor.href) return;
    const currentUrl = anchor.href;
    if (getNextFallbackUrl(currentUrl)) {
      event.preventDefault();
      attemptNavigation(currentUrl);
    }
  });

  function attemptNavigation(url) {
    fetch(url, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          window.location.href = url;
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        const nextUrl = getNextFallbackUrl(url);
        if (nextUrl) {
          attemptNavigation(nextUrl);
        }
      });
  }

  if (window.location.href.includes("youtube-playables") || document.querySelector('script[src*="ytgame.js"]')) {
    try { delete window.getCurrentSdkUrl; } catch(e) {}
    try { delete window.getLocationHash; } catch(e) {}

    Object.defineProperty(window, 'getCurrentSdkUrl', {
      get: function() {
        return function() {
          const fallbackUrl = new URL("https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@main/bowmasters/ytgame.js");
          fallbackUrl.toString = function() { return this.href; };
          return fallbackUrl;
        };
      },
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(window, 'getLocationHash', {
      get: function() {
        return function() {
          return window.location.hash || "#flags=none";
        };
      },
      configurable: true,
      enumerable: true
    });
  }
})();