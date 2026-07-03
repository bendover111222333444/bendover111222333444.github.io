export function buttonTemplate(name, html, cover) {

    return `<button class="gameButton" data-html=${html}> 
        <img class="gameImg" src="${cover}" alt="${name}"> 
        <p class="defaultText gameText">${name}</p> 
    </button>`

}