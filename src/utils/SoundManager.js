const sounds = {
    chip1: new Audio('/assets/snd/chips1.ogg'),
    chip2: new Audio('/assets/snd/chips2.ogg'),
    cardSlide1: new Audio('/assets/snd/cardSlide1.ogg'),
    cardSlide2: new Audio('/assets/snd/cardSlide2.ogg'),
    coin: new Audio('/assets/snd/coin1.ogg'),
    button: new Audio('/assets/snd/button.ogg'),
};

// Preload sounds
Object.values(sounds).forEach(sound => {
    sound.load();
    sound.volume = 0.5;
});

export const playSound = (name) => {
    const sound = sounds[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.warn("Audio play failed:", e));
    }
};

export const playRandomChip = () => {
    Math.random() > 0.5 ? playSound('chip1') : playSound('chip2');
};

export const playRandomCardSlide = () => {
    Math.random() > 0.5 ? playSound('cardSlide1') : playSound('cardSlide2');
};

export const playWinSound = () => {
    playSound('coin');
};

export const playButtonSound = () => {
    playSound('button');
};
