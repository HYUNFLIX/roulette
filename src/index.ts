import './localization';
import { Roulette } from './roulette';
import options from './options';
import { registerServiceWorker } from './registerServiceWorker';
import { SoundManager } from './audio/SoundManager';
import { victoryAnimation } from './animation/VictoryAnimation';


registerServiceWorker();

const roulette = new Roulette();

// eslint-disable-next-line
(window as any).roulette = roulette;
// eslint-disable-next-line
(window as any).options = options;
// eslint-disable-next-line
(window as any).SoundManager = SoundManager;
// eslint-disable-next-line
(window as any).VictoryAnimation = victoryAnimation;
