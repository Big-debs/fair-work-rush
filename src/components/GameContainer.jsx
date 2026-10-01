import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';
import { getTimelineModel } from '../game/LayoutModel.js';

const ThreeActivity = lazy(() => import('./activities/ThreeActivity.jsx'));

class ActivityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="activity-loading activity-failed" role="alert">
        <strong>The interactive scene could not load.</strong>
        <button type="button" onClick={this.props.onFallback}>Continue in simple mode</button>
      </div>
    );
  }
}

const initialHud = {
  stamina: 100,
  wellbeing: 95,
  householdTrust: 55,
  boundaryPressure: 20,
  confidence: 45,
  stress: 15,
  shiftHours: 0,
  clock: '—',
  clockMinutes: 5 * 60 + 30,
  monthlySalary: 100000,
  additionalMinutes: 0,
  personalMinutes: 0,
  totalWorkMinutes: 0,
  expectedMinutes: 480,
  scenarioTitle: 'Choose a situation',
  profileName: 'Worker',
  status: 'Choose a situation to begin.'
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function fmt(minutes) {
  const safeMinutes = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

function Meter({ label, value, tone }) {
  const rounded = Math.round(value);
  return (
    <div className="meter-card">
      <div className="meter-copy"><span>{label}</span><strong>{rounded}%</strong></div>
      <div className="meter-track" aria-hidden="true">
        <div className={`meter-fill ${tone}`} style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}

function WorkTimeline({ hud }) {
  const timeline = getTimelineModel(hud);

  return (
    <section className="work-timeline" aria-label="Agreement compared with today">
      <div className="timeline-heading">
        <div><span>AGREEMENT / REALITY</span><strong>{hud.scenarioTitle}</strong></div>
        <div className="timeline-time">{hud.clock}</div>
      </div>
      <div className="timeline-row">
        <span>Agreed</span>
        <div className="timeline-track"><i className="timeline-fill agreed" style={{ width: `${timeline.expectedPercent}%` }} /></div>
        <b>{fmt(hud.expectedMinutes)}</b>
      </div>
      <div className="timeline-row">
        <span>Counted</span>
        <div className="timeline-track actual-track">
          <i className="timeline-fill actual" style={{ width: `${timeline.actualPercent}%` }} />
          <i className="time-marker" style={{ left: `${timeline.elapsedPercent}%` }} />
        </div>
        <b>{fmt(hud.totalWorkMinutes)}</b>
      </div>
    </section>
  );
}

export function GameContainer() {
  const rootRef = useRef(null);
  const gameRef = useRef(null);
  const logCounter = useRef(0);
  const [hud, setHud] = useState(initialHud);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(true);
  const [threeActivity, setThreeActivity] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ));

  useEffect(() => {
    const root = rootRef.current;
    if (!root || gameRef.current) return;
    let disposed = false;
    root.replaceChildren();

    try {
      const game = new Phaser.Game(createGameConfig(root));
      gameRef.current = game;
      game.registry.set('reducedMotion', reducedMotion);
      game.registry.set('interactiveActivities', interactiveMode);

      const updateHud = (data) => {
        if (!disposed) setHud((previous) => ({ ...previous, ...data }));
      };
      const logActivity = (entry) => {
        if (disposed) return;
        const item = {
          id: ++logCounter.current,
          time: entry.time || '',
          message: entry.message,
          tone: entry.tone || 'neutral'
        };
        setActivity((previous) => [item, ...previous].slice(0, 8));
      };
      const resetActivity = () => {
        if (!disposed) setActivity([]);
      };
      const openThreeActivity = (payload) => {
        if (!disposed) setThreeActivity({ ...payload, acknowledgedStep: payload.acknowledgedStep ?? -1, visible: true });
      };
      const pauseThreeActivity = ({ sessionId } = {}) => {
        if (disposed) return;
        setThreeActivity((previous) => previous?.sessionId === sessionId
          ? { ...previous, visible: false }
          : previous);
      };
      const acknowledgeThreeActivity = ({ sessionId, stepIndex } = {}) => {
        if (disposed) return;
        setThreeActivity((previous) => previous?.sessionId === sessionId
          ? { ...previous, acknowledgedStep: stepIndex, visible: true }
          : previous);
      };
      const closeThreeActivity = ({ sessionId } = {}) => {
        if (disposed) return;
        setThreeActivity((previous) => !sessionId || previous?.sessionId === sessionId ? null : previous);
      };

      game.events.on('UPDATE_HUD', updateHud);
      game.events.on('LOG_ACTIVITY', logActivity);
      game.events.on('RESET_ACTIVITY_LOG', resetActivity);
      game.events.on('OPEN_3D_ACTIVITY', openThreeActivity);
      game.events.on('PAUSE_3D_ACTIVITY', pauseThreeActivity);
      game.events.on('ACK_3D_ACTIVITY_STEP', acknowledgeThreeActivity);
      game.events.on('CLOSE_3D_ACTIVITY', closeThreeActivity);
      game.events.once('boot', () => { if (!disposed) setError(''); });

      return () => {
        disposed = true;
        game.events.off('UPDATE_HUD', updateHud);
        game.events.off('LOG_ACTIVITY', logActivity);
        game.events.off('RESET_ACTIVITY_LOG', resetActivity);
        game.events.off('OPEN_3D_ACTIVITY', openThreeActivity);
        game.events.off('PAUSE_3D_ACTIVITY', pauseThreeActivity);
        game.events.off('ACK_3D_ACTIVITY_STEP', acknowledgeThreeActivity);
        game.events.off('CLOSE_3D_ACTIVITY', closeThreeActivity);
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

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.registry.set('reducedMotion', reducedMotion);
    game.events.emit('ACCESSIBILITY_SETTINGS', { reducedMotion });
  }, [reducedMotion]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.registry.set('interactiveActivities', interactiveMode);
    if (!interactiveMode && threeActivity) {
      game.events.emit('THREE_ACTIVITY_FALLBACK', { sessionId: threeActivity.sessionId });
    }
  }, [interactiveMode, threeActivity]);

  return (
    <section className={`game-shell${largeText ? ' large-text' : ''}${reducedMotion ? ' reduced-motion' : ''}`}>
      <div className="control-bar">
        <div className="scenario-kicker"><span>{hud.profileName}</span><strong>{hud.scenarioTitle}</strong></div>
        <div className="accessibility-controls" aria-label="Display settings">
          <button type="button" aria-pressed={largeText} onClick={() => setLargeText((value) => !value)}>Aa</button>
          <button type="button" aria-pressed={reducedMotion} onClick={() => setReducedMotion((value) => !value)}>Calm motion</button>
          <button type="button" aria-pressed={interactiveMode} onClick={() => setInteractiveMode((value) => !value)}>3D activities</button>
        </div>
      </div>

      <div className="priority-hud">
        <div className="clock-card"><span>HOUSEHOLD CLOCK</span><strong>{hud.clock}</strong></div>
        <Meter label="Wellbeing" value={hud.wellbeing} tone="wellbeing" />
        <Meter label="Trust" value={hud.householdTrust} tone="trust" />
        <Meter label="Pressure" value={hud.boundaryPressure} tone="pressure" />
      </div>

      <button className="details-toggle" type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((value) => !value)}>
        {detailsOpen ? 'Hide day details' : 'Show day details'}
      </button>
      <div className={`secondary-hud${detailsOpen ? ' open' : ''}`}>
        <span><small>Energy</small><b>{Math.round(hud.stamina)}%</b></span>
        <span><small>Confidence</small><b>{Math.round(hud.confidence)}%</b></span>
        <span><small>Stress</small><b>{Math.round(hud.stress)}%</b></span>
        <span><small>Salary</small><b>₦{hud.monthlySalary.toLocaleString()}</b></span>
        <span><small>Extra requests</small><b>{fmt(hud.additionalMinutes)}</b></span>
        <span><small>Personal time</small><b>{fmt(hud.personalMinutes)}</b></span>
      </div>

      <WorkTimeline hud={hud} />

      <div className="game-stage">
        <div className="canvas" aria-label="Fair Work Rush game">
          <div ref={rootRef} className="phaser-root" />
          {threeActivity && (
            <ActivityErrorBoundary
              key={threeActivity.sessionId}
              onFallback={() => gameRef.current?.events.emit('THREE_ACTIVITY_FALLBACK', { sessionId: threeActivity.sessionId })}
            >
              <Suspense fallback={<div className="activity-loading" role="status">Preparing the activity…</div>}>
                <ThreeActivity
                  activity={threeActivity.definition}
                  acknowledgedStep={threeActivity.acknowledgedStep}
                  visible={threeActivity.visible}
                  reducedMotion={reducedMotion}
                  onStep={(stepIndex) => gameRef.current?.events.emit('THREE_ACTIVITY_STEP', {
                    sessionId: threeActivity.sessionId,
                    stepIndex
                  })}
                  onFinish={() => gameRef.current?.events.emit('THREE_ACTIVITY_FINISH', { sessionId: threeActivity.sessionId })}
                  onAbandon={() => gameRef.current?.events.emit('THREE_ACTIVITY_ABANDON', { sessionId: threeActivity.sessionId })}
                  onFallback={() => gameRef.current?.events.emit('THREE_ACTIVITY_FALLBACK', { sessionId: threeActivity.sessionId })}
                />
              </Suspense>
            </ActivityErrorBoundary>
          )}
          {error && <div className="game-error"><strong>Game failed to start</strong><span>{error}</span></div>}
        </div>
        <aside className="activity-panel" aria-live="polite">
          <div className="activity-heading"><span>TODAY’S RECORD</span><b>{activity.length}</b></div>
          {activity.length === 0 ? (
            <p className="empty-log">Choices, interruptions, and completed work will collect here.</p>
          ) : (
            <ol>{activity.map((item) => (
              <li key={item.id} className={item.tone}>
                <time>{item.time}</time><span>{item.message}</span>
              </li>
            ))}</ol>
          )}
        </aside>
      </div>

      <div className="status-line"><span aria-hidden="true" />{hud.status}</div>
    </section>
  );
}
