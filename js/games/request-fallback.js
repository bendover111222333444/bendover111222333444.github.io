(function() {
  const providers = [
    "https://cdn.jsdelivr.net/gh/",
    "https://",
    "https://raw.githubusercontent.com/",
    "https://statically.io",
    "https://githack.com"
  ];

  function getNextFallbackUrl(currentUrl) {
    let matchingIndex = -1;
    let user = "";
    let repo = "";
    let restOfPath = "";

    if (currentUrl.startsWith("https://cdn.jsdelivr.net/gh/")) {
      matchingIndex = 0;
      const path = currentUrl.replace("https://cdn.jsdelivr.net/gh/", "");
      const parts = path.split('/');
      user = parts[0];
      let repoWithBranch = parts[1];
      repo = repoWithBranch.split('@')[0];
      restOfPath = parts.slice(2).join('/');
    } else if (currentUrl.includes(".github.io/")) {
      matchingIndex = 1;
      const match = currentUrl.match(/https?:\/\/([^.]+)\.github\.io\/([^/]+)\/(.+)/);
      if (match) {
        user = match[1];
        repo = match[2];
        restOfPath = match[3];
      }
    } else if (currentUrl.startsWith("https://raw.githubusercontent.com/")) {
      matchingIndex = 2;
      const path = currentUrl.replace("https://raw.githubusercontent.com/", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      restOfPath = parts.slice(3).join('/');
    } else if (currentUrl.startsWith("https://statically.io")) {
      matchingIndex = 3;
      const path = currentUrl.replace("https://statically.io", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      restOfPath = parts.slice(2).join('/');
    } else if (currentUrl.startsWith("https://githack.com")) {
      matchingIndex = 4;
      const path = currentUrl.replace("https://githack.com", "");
      const parts = path.split('/');
      user = parts[0];
      repo = parts[1];
      restOfPath = parts.slice(2).join('/');
    }

    if (matchingIndex === -1 || !user || !repo || !restOfPath) return null;

    const nextIndex = matchingIndex + 1;
    if (nextIndex >= providers.length) return null;

    // Fixed: Resolved missing slashes and incorrect domain naming conventions
    if (nextIndex === 1) return `https://${user}.github.io/${repo}/${restOfPath}`;
    if (nextIndex === 2) return `https://githubusercontent.com{user}/${repo}/main/${restOfPath}`;
    if (nextIndex === 3) return `https://statically.io${user}/${repo}@main/${restOfPath}`;
    if (nextIndex === 4) return `https://githack.com${user}/${repo}/main/${restOfPath}`;

    return null;
  }

  // --- Global Event Listener Overrides ---
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

  window.getCurrentSdkUrl = function() {
    return new URL("https://jsdelivr.net");
  };

  window.getLocationHash = function() {
    return "#flags=none";
  };
})();
