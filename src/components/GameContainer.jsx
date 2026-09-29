import React from 'react';
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';

const initialHud = {
  stamina: 100,
  wellbeing: 95,
  householdTrust: 55,
  boundaryPressure: 20,
  confidence: 45,
  stress: 15,
  shiftHours: 0,
  earnings: 0,
  reputation: 100,
  clock: '5:30 AM',
  monthlySalary: 100000,
  additionalMinutes: 0,
  personalMinutes: 0,
  sleepMinutes: 0,
  status: 'Starting day…'
};

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m ? `${m}m` : ''}`.trim();
}

export function GameContainer() {
  const rootRef = useRef(null);
  const gameRef = useRef(null);
  const [hud, setHud] = useState(initialHud);
  const [error, setError] = useState('');

  useEffect(() => {
    const root = rootRef.current;
    if (!root || gameRef.current) return;
    let disposed = false;
    root.replaceChildren();

    try {
      const game = new Phaser.Game(createGameConfig(root));
      gameRef.current = game;
      const updateHud = (data) => {
        if (!disposed) setHud((previous) => ({ ...previous, ...data }));
      };
      game.events.on('UPDATE_HUD', updateHud);
      game.events.once('boot', () => { if (!disposed) setError(''); });
      return () => {
        disposed = true;
        game.events.off('UPDATE_HUD', updateHud);
        if (gameRef.current === game) {
          gameRef.current = null;
          game.destroy(true);
        }
        root.replaceChildren();
      };
    } catch (err) {
      console.error('Fair Work Rush failed to initialize:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return (
    <section className="game-shell">
      <div className="hud">
        <div className="stat"><div className="label">Household clock</div><div className="value">{hud.clock}</div></div>
        <div className="stat">
          <div className="label">Energy</div><div className="value">{Math.round(hud.stamina)}%</div>
          <div className="bar"><div className="fill energy" style={{ width: `${hud.stamina}%` }} /></div>
        </div>
        <div className="stat">
          <div className="label">Wellbeing · stress {Math.round(hud.stress)}%</div><div className="value">{hud.wellbeing}%</div>
          <div className="bar"><div className="fill wellbeing" style={{ width: `${hud.wellbeing}%` }} /></div>
        </div>
        <div className="stat">
          <div className="label">Household trust</div><div className="value">{Math.round(hud.householdTrust)}%</div>
          <div className="bar"><div className="fill trust" style={{ width: `${hud.householdTrust}%` }} /></div>
        </div>
        <div className="stat">
          <div className="label">Boundary pressure</div><div className="value">{Math.round(hud.boundaryPressure)}%</div>
          <div className="bar"><div className="fill pressure" style={{ width: `${hud.boundaryPressure}%` }} /></div>
        </div>
        <div className="stat">
          <div className="label">Worker confidence</div><div className="value">{Math.round(hud.confidence)}%</div>
          <div className="bar"><div className="fill confidence" style={{ width: `${hud.confidence}%` }} /></div>
        </div>
        <div className="stat"><div className="label">Monthly salary</div><div className="value">₦{hud.monthlySalary.toLocaleString()}</div></div>
        <div className="stat"><div className="label">Active work</div><div className="value">{hud.shiftHours.toFixed(1)}h</div></div>
        <div className="stat"><div className="label">Extra requests</div><div className="value">{fmt(hud.additionalMinutes)}</div></div>
        <div className="stat"><div className="label">Personal time</div><div className="value">{fmt(hud.personalMinutes)}</div></div>
      </div>

      <div className="canvas">
        <div ref={rootRef} className="phaser-root" />
        {error && <div className="game-error"><strong>Game failed to start</strong><span>{error}</span></div>}
      </div>
      <div className="footer">{hud.status}</div>
    </section>
  );
}
