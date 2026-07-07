export function buttonTemplate(name, html, cover) {

    return `<button class="gameButton" data-html=${html}> 
        <img class="gameImg" src="${cover}" alt="${name}"> 
        <p class="defaultText gameText">${name}</p> 
    </button>`

}

export function tapeTemplate(forward) {

    if (forward === true) {

        return `<div class="tape forwardScroll"></div>`   

    } else {

        return `<div class="tape backwardScroll"></div>`  

    }

}