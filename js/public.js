const scriptMemory = new Map();
let currentScriptTracker = null;

const originalAddEvent = EventTarget.prototype.addEventListener;
const originalSetInterval = window.setInterval;
const originalSetTimeout = window.setTimeout;
const originalRequestAnimationFrame = window.requestAnimationFrame;
const OriginalMutationObserver = window.MutationObserver;
const OriginalWebSocket = window.WebSocket;

EventTarget.prototype.addEventListener = function(type, listener, options) {
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).listeners.push({ target: this, type, listener, options });
  }
  return originalAddEvent.apply(this, arguments);
};

window.setInterval = function(callback, delay) {
  const id = originalSetInterval.apply(this, arguments);
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).intervals.push(id);
  }
  return id;
};

window.setTimeout = function(callback, delay) {
  const id = originalSetTimeout.apply(this, arguments);
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).timeouts.push(id);
  }
  return id;
};

window.requestAnimationFrame = function(callback) {
  const id = originalRequestAnimationFrame.apply(this, arguments);
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).frames.push(id);
  }
  return id;
};

window.MutationObserver = function(callback) {
  const instance = new OriginalMutationObserver(callback);
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).observers.push(instance);
  }
  return instance;
};
window.MutationObserver.prototype = OriginalMutationObserver.prototype;

window.WebSocket = function(url, protocols) {
  const instance = new OriginalWebSocket(url, protocols);
  if (currentScriptTracker && scriptMemory.has(currentScriptTracker)) {
    scriptMemory.get(currentScriptTracker).sockets.push(instance);
  }
  return instance;
};
window.WebSocket.prototype = OriginalWebSocket.prototype;

export const content = document.getElementById("content");

async function buttonFunc(event) {

    const sendTo = event.currentTarget.dataset.sendTo;
    const scripts = event.currentTarget.dataset.scripts;

    if (sendTo) {

        await navigateHtml(content, `./pages/${sendTo}`, false);
        await navigateHtml(content, `./pages/static.html`, true);

        setTimeout(initBtns, 0);

    }

    if (scripts) {

        const scriptObjects = JSON.parse(scripts);
        await loadScripts(scriptObjects);

    }    

}

export function initBtns() {

    let buttons = document.querySelectorAll("[data-send-to]");
    buttons.forEach(button => {

        button.addEventListener("click", buttonFunc);

    });

}

export async function navigateHtml(root, page, addTo) {

    const html = await fetch(page).then(r => r.text());
    if(addTo === false) {

        root.replaceChildren();

    }

    root.insertAdjacentHTML("beforeend", `\n<!-- Injected Html -->${html}\n`);

}

export async function injectRaw(root, html, addTo) {

    if(addTo === false) {

        root.replaceChildren();

    }

    root.insertAdjacentHTML("beforeend", `\n<!-- Added Html -->${html}\n`);

}

export async function loadScripts(scripts) {

  for (const script of scripts) {

    const old = document.querySelector(`script[data-src="${script.script}"]`);

    if (old) {

      old.remove();
      const previousSrc = old.getAttribute('src');

      if (scriptMemory.has(previousSrc)) {

        const memory = scriptMemory.get(previousSrc);
        memory.listeners.forEach(({ target, type, listener, options }) => {
          target.removeEventListener(type, listener, options);
        });
        memory.intervals.forEach(id => clearInterval(id));
        memory.timeouts.forEach(id => clearTimeout(id));
        memory.frames.forEach(id => cancelAnimationFrame(id));
        memory.observers.forEach(obs => obs.disconnect());
        memory.sockets.forEach(ws => { if (ws.readyState <= 1) ws.close(); });
        scriptMemory.delete(previousSrc);

      }

    }

    const currentSrc = `${script.script}?t=${Date.now()}`;
    scriptMemory.set(currentSrc, { listeners: [], intervals: [], timeouts: [], frames: [], observers: [], sockets: [] });
    
    currentScriptTracker = currentSrc;

    const newScript = document.createElement("script");
    newScript.setAttribute('data-src', script.script);
    newScript.setAttribute('src', currentSrc);

    if (script.module === true) {

      newScript.type = "module";
      document.body.appendChild(newScript);
      
      await new Promise(resolve => {

        newScript.onload = newScript.onerror = () => {

          currentScriptTracker = null;
          resolve();

        };

      });

    } else {

      const code = await fetch(currentSrc).then(r => r.text());
      
      newScript.textContent = `{\n${code}\n}`;
      document.body.appendChild(newScript);
      currentScriptTracker = null;

    }

  }

}
