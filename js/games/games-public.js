const mainUrl = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/"
const mainImagesUrl = `${mainUrl}images/`
const mainGamesUrl = `${mainUrl}games/`
const noImgUrl = `${mainImagesUrl}noImg.png`

const ubgUrl = `${mainGamesUrl}ubg/`
const ubgImagesUrl = `${ubgUrl}images/`
const ubgPagesUrl = `${ubgUrl}pages/`

const ugsFilesUrl = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/UGS-Files/";
const ugsGamesUrl = `${mainGamesUrl}ugs/`

const gnMathUrl = `${mainGamesUrl}gn-math/`
const gnMathImagesUrl = `${gnMathUrl}images/`
const gnMathPagesUrl = `${gnMathUrl}pages/`

let gnMathPromise = fetch(`${gnMathUrl}games.json`).then(r => r.json());
let ugsPromise = fetch(`${ugsGamesUrl}games.json`).then(r => r.json());
let ubgPromise = fetch(`${ubgUrl}games.json`).then(r => r.json());

function formatGameName(name) {

    return name.toLowerCase().replaceAll(" ", "-")

}

export const sources = {
    
    ubg: ubgFormatData,
    ugs: ugsFormatData,
    gn: gnMathFormatData,

};

export async function gnMathFormatData() {

    const files = await gnMathPromise;

    return files.map(file => {
        
        let special = "None";
        
        if (file.special) {

            special = file.special[0];

        }

        return {
        
            name: formatGameName(file.name), 
            cover: `${gnMathImagesUrl}${file.cover}`, 
            html: `${gnMathPagesUrl}${file.url}`, 
            exInfo: special
        
        }

    });

}

export async function ugsFormatData() {

    const files = await ugsPromise;

    return files.map(file => {
    
        const normalized = file.includes(".") && file.lastIndexOf(".") > 0 ? file : file + ".html";

        return {

            name: formatGameName(normalized),
            cover: noImgUrl,
            html: `${ugsFilesUrl}${encodeURIComponent(normalized)}`,
            exInfo: "None"

        };

    });

}

export async function ubgFormatData() {

    const files = await ubgPromise;

    return files.map(file => {
        
        return {

            name: formatGameName(file.url),
            cover: `${ubgImagesUrl}${file.url}${file.extention}`,
            html: `${ubgPagesUrl}${file.url}.html`,
            exInfo: "None"

        };

    });

}