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

    // 1. jsDelivr Parsing
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
    // 2. Raw GitHub User Content Parsing
    else if (currentUrl.startsWith("https://raw.githubusercontent.com/")) {
      matchingIndex = 1;
      const path = currentUrl.replace("https://raw.githubusercontent.com/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      branchOrHash = parts[2];
      restOfPath = parts.slice(3).join('/');
    } 
    // 3. Statically Parsing
    else if (currentUrl.startsWith("https://statically.io/gh/")) {
      matchingIndex = 2;
      const path = currentUrl.replace("https://statically.io/gh/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      branchOrHash = parts[2];
      restOfPath = parts.slice(3).join('/');
    } 
    // 4. GitHack Parsing
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

  const originalPostMessage = Window.prototype.postMessage;
  Window.prototype.postMessage = function(message, targetOrigin, transfer) {
    if (!targetOrigin || targetOrigin === "''" || targetOrigin === "") {
      targetOrigin = '*';
    }
    if (typeof targetOrigin === 'object' && targetOrigin.origin) {
      targetOrigin = targetOrigin.origin;
    }
    try {
      if (transfer) {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      } else {
        return originalPostMessage.call(this, message, targetOrigin);
      }
    } catch (e) {
      if (e.name === 'SyntaxError') {
        return originalPostMessage.call(this, message, '*');
      }
      throw e;
    }
  };

  window.getCurrentSdkUrl = function() {
    try {
      const fallbackUrl = new URL("https://jsdelivr.net/");
      fallbackUrl.toString = function() { return "https://jsdelivr.net/"; };
      fallbackUrl.valueOf = function() { return "https://jsdelivr.net/"; };
      return fallbackUrl;
    } catch (e) {
      return "https://jsdelivr.net/";
    }
  };

  window.getLocationHash = function() {
    return "#flags=none";
  };
})();