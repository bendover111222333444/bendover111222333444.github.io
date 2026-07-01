export function buttonTemplate(name, html, cover) {

    return `<button class="gameButton" data-html=${html}> 
        <img class="gameImg" src="${cover}" alt="${name}"> 
        <p class="defaultText gameText">${name}</p> 
    </button>`

}

export async function iframeTemplate(url) {

  const html = await fetch(url).then(r => r.text());

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);

  const iframeShell = `
    <iframe
      src="${blobUrl}"
      class="defaultIframe"
      sandbox="allow-scripts allow-same-origin"
    ></iframe>
  `;

  return iframeShell;
  
}