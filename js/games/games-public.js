const mainUrl = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444-new-site@main/"
const mainImagesUrl = `${mainUrl}images/`
const mainGamesUrl = `${mainUrl}games/`

const ugsFilesUrl = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";
const ugsGamesUrl = `${mainGamesUrl}ugs/`
const noImgUrl = `${mainImagesUrl}noImg.png`

const gnMathUrl = `${mainGamesUrl}gn-math/`
const gnMathImagesUrl = `${gnMathUrl}images/`
const gnMathPagesUrl = `${gnMathUrl}pages/`

let gnMathPromise = fetch(`${gnMathUrl}games.json`).then(r => r.json());
let ugsPromise = fetch(`${ugsGamesUrl}games.json`).then(r => r.json());

function formatGameName(name) {

    return name.toLowerCase().replaceAll(" ", "-")

}

export const sources = {
    
  gn: gnMathFormatData,
  ugs: ugsFormatData

};

export async function gnMathFormatData() {

    const games = await gnMathPromise;

    let data = []

    for (const game of games) {
        
        let special = "None";
        
        if (game.special) {

            special = game.special[0];

        }

        data.push({name: formatGameName(game.name), cover: `${gnMathImagesUrl}${game.cover}`, html: `${gnMathPagesUrl}${game.url}`, exInfo: special})

    }

    return data;

}

export async function ugsFormatData() {

    const files = await ugsPromise;

    return files.map(file => {
    
        const normalized = file.includes(".") && file.lastIndexOf(".") > 0 ? file : file + ".html";

        return {

            name: file,
            cover: noImgUrl,
            html: `${ugsFilesUrl}${encodeURIComponent(normalized)}`,
            exInfo: "None"

        };

    });

}