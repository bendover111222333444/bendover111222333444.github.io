const gnMathUrl = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444-new-site/games/gn-math"
const imagesUrl = `${gnMathUrl}/images/`
const pagesUrl = `${gnMathUrl}/pages/`

let games;

(async () => {

    const res = await fetch(`${gnMathUrl}/games.json`);
    games = await res.json();

})();

export default function gnMathFormatData() {

    let data = []

    for (const game of games) {
        
        let special = "None";
        
        if (game.special) {

            special = game.special[0];

        }

        data.push({name: game.name, cover: `${gnMathUrl}${game.cover}`, html: `${gnMathUrl}${game.html}`, exInfo: special})

    }

    return data;

}