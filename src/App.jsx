import React from 'react';
import { GameContainer } from './components/GameContainer';

export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <div>
          <div className="eyebrow">A WORK & DIGNITY STORY</div>
          <h1>Fair Work Rush</h1>
        </div>
        <p>Live the day. Notice the hidden work. Decide what happens next.</p>
      </header>
      <GameContainer />
    </main>
  );
}
