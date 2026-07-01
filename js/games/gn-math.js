const gnMathUrl = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444-new-site@main/games/gn-math/"
const imagesUrl = `${gnMathUrl}/images/`
const pagesUrl = `${gnMathUrl}/pages/`

let gamesPromise = fetch(`${gnMathUrl}/games.json`).then(r => r.json());

export default async function gnMathFormatData() {

    const games = await gamesPromise;

    let data = []

    for (const game of games) {
        
        let special = "None";
        
        if (game.special) {

            special = game.special[0];

        }

        data.push({name: (game.name.toLowerCase().replaceAll(" ", "-")), cover: `${gnMathUrl}images/${game.cover}`, html: `${gnMathUrl}pages/${game.url}`, exInfo: special})

    }

    return data;

}