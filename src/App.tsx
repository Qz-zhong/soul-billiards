import { useState } from 'react';
import GameScreen from './screens/GameScreen';
import TitleScreen from './screens/TitleScreen';

type Screen = 'title' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');

  return screen === 'game' ? (
    <GameScreen onExit={() => setScreen('title')} />
  ) : (
    <TitleScreen onStart={() => setScreen('game')} />
  );
}
