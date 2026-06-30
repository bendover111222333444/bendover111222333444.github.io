const titleCaption = document.getElementById("titleCaption");

const refreshLength = 10000;
const msgs = [
    "new site lets go",
    "will add proxy just wait!",
    "inspirational quote here",
    "javascript my beloved",
    "please educate yourself",
    "gta6 out yet?",
    "is gaming a waste or is school a waste?",
    "click on one of the buttons already",
    "BOO, did i scare u?",
    "more messages coming soon",
    "remember now.gg?",
    "i will add movies too :)",
    "this site is unblockable",
    "im running out of ideas tbh",
    "no profit no ads :)",  
]

const dynamicMsgs = [
    () => `it is ${new Date().toTimeString().slice(0, 8)}`,
    () => `${Array.from({ length: 20 }, () => Math.round(Math.random())).join("")}`,
]

function msgIndex() {

    return Math.floor(Math.random() * (msgs.length + dynamicMsgs.length));

}

function getMsg() {

    let index = msgIndex();

    if (index < msgs.length) {

        return msgs[index];

    } else {

        return dynamicMsgs[index - msgs.length]();

    }

}

titleCaption.textContent = getMsg();
setInterval(() => {
    
    titleCaption.textContent = getMsg();

}, refreshLength);
