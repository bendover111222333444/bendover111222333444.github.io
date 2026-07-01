const gamesUrl = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444-new-site@main/games"

const gnMathUrl = `${gamesUrl}/gn-math/`
const gnMathImagesUrl = `${gnMathUrl}/images/`
const gnMathPagesUrl = `${gnMathUrl}/pages/`

let gnMathPromise = fetch(`${gnMathUrl}/games.json`).then(r => r.json());

function formatGameName(name) {

    return name.toLowerCase().replaceAll(" ", "-")

}

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