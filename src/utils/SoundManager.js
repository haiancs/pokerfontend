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

const primeAudioEntry = async (name) => {
  const soundEntry = getOrCreateSound(name);
  if (!soundEntry || !soundEntry.available) return;

  const { audio } = soundEntry;
  const previousVolume = audio.volume;
  try {
    audio.volume = 0;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // 浏览器策略可能阻止预热，保持静默降级
  } finally {
    audio.volume = previousVolume;
  }
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

export const warmupChipSounds = async () => {
  await Promise.all([primeAudioEntry('chip1'), primeAudioEntry('chip2')]);
};

const playSoundVariant = (name, { volume = 0.2, playbackRate = 1 } = {}) => {
  const soundEntry = getOrCreateSound(name);
  if (!soundEntry || !soundEntry.available) {
    return;
  }

  const source = soundEntry.audio;
  let audioToPlay = source;
  try {
    audioToPlay = source.cloneNode(true);
  } catch {
    audioToPlay = source;
  }

  audioToPlay.currentTime = 0;
  audioToPlay.volume = Math.max(0, Math.min(1, volume));
  audioToPlay.playbackRate = Math.max(0.5, Math.min(1.6, playbackRate));
  audioToPlay.play().catch(() => {});
};

export const playChipDropByDenomination = (denom = 1) => {
  const baseName = Math.random() > 0.5 ? 'chip1' : 'chip2';

  if (denom >= 100) {
    playSoundVariant(baseName, { volume: 0.15, playbackRate: 0.78 });
    return;
  }
  if (denom >= 25) {
    playSoundVariant(baseName, { volume: 0.17, playbackRate: 0.88 });
    return;
  }
  if (denom >= 5) {
    playSoundVariant(baseName, { volume: 0.2, playbackRate: 0.98 });
    return;
  }
  playSoundVariant(baseName, { volume: 0.22, playbackRate: 1.08 });
};
