const SOUND_FILES = {
  chip1: 'assets/snd/chips1.ogg',
  chip2: 'assets/snd/chips2.ogg',
  cardSlide1: 'assets/snd/cardSlide1.ogg',
  cardSlide2: 'assets/snd/cardSlide2.ogg',
  coin: 'assets/snd/coin1.ogg',
  button: 'assets/snd/button.ogg',
};

const soundRegistry = new Map();

const resolveAssetUrl = (relativePath) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${relativePath.replace(/^\/+/, '')}`;
};

const getOrCreateSound = (name) => {
  if (soundRegistry.has(name)) {
    return soundRegistry.get(name);
  }

  const relativePath = SOUND_FILES[name];
  if (!relativePath) {
    return null;
  }

  const audio = new Audio(resolveAssetUrl(relativePath));
  audio.volume = 0.5;

  const entry = { audio, available: true };
  audio.addEventListener('error', () => {
    entry.available = false;
    console.warn(`[SoundManager] audio unavailable: ${relativePath}`);
  });

  soundRegistry.set(name, entry);
  return entry;
};

export const playSound = (name) => {
  const soundEntry = getOrCreateSound(name);
  if (!soundEntry || !soundEntry.available) {
    return;
  }

  const { audio } = soundEntry;
  audio.currentTime = 0;
  audio.play().catch((error) => {
    console.warn('Audio play failed:', error);
  });
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
