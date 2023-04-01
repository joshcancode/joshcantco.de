const NEXT_WORD_DELAY = 600;
const NEXT_LETTER_DELAY = 100;

const PHRASES = [
    "youtube.com",
    "soundcloud.com", 
    "tiktok.com", 
    "spotify.com",
    "crunchyroll.com",
    "dropbox.com",
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "newgrounds.com",
    "patreon.com",
    "twitter.com",
    "twitch.com",
    "vimeo.com"
];

let i = 0;
let inputNode = undefined;
let shouldAnimate = true;

const animateLetters = (
    currentLetters,
    remainingLetters
) => {
    if (!shouldAnimate) return;

    if (remainingLetters.length === 0) {
        setTimeout(() => {
            if (i === PHRASES.length - 1)
                i = -1;
            animateLetters([], PHRASES[++i].split(""));
        }, NEXT_WORD_DELAY);
        return;
    }

    currentLetters.push(remainingLetters.shift());

    setTimeout(() => {
        inputNode.setAttribute("placeholder", currentLetters.join(""));
        animateLetters(currentLetters, remainingLetters);
    }, NEXT_LETTER_DELAY);
};

addEventListener("DOMContentLoaded", () => {
    inputNode = document.querySelector("input[name='url']");
    animateLetters([], PHRASES[0].split(""));

    inputNode.addEventListener("input", () => {
        if (inputNode.value.length > 0 && !shouldAnimate)
            animateLetters([], PHRASES[0].split(""));
        shouldAnimate = inputNode.value.length > 0;
    });
});