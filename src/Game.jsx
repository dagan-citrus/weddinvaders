import { useEffect, useRef, useCallback } from 'react';
import { useGameState } from './useGameState';
import { useAssets }    from './useAssets';
import { render }       from './renderer';
import { GAME_WIDTH, GAME_HEIGHT, CANVAS_WIDTH, AMMO_ORDER, AMMO_META } from './constants';
import './Game.css';

/**
 * The game for one event. Switching to an event with a different slug starts
 * a fresh session (state, images, listeners and loop).
 *
 * @param {{ event: import('./events/eventConfig').EventConfig }} props
 */
export default function Game({ event }) {
  return <GameSession key={event.slug} event={event} />;
}

function GameSession({ event }) {
  const canvasRef = useRef(null);
  const assetsRef = useAssets(event.images);
  const { getState, startLoop, stopLoop, setRenderCallback, handleAction } = useGameState(event);

  useEffect(() => {
    setRenderCallback((state) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      render(ctx, state, assetsRef.current, event);
    });
    startLoop();
    return () => stopLoop();
  }, [startLoop, stopLoop, setRenderCallback, assetsRef, event]);

  const handleCanvasClick = useCallback(() => {
    const { phase } = getState();
    if (phase === 'title')         handleAction({ type: 'START' });
    if (phase === 'meeting')       handleAction({ type: 'NEXT_LEVEL' });
    if (phase === 'levelComplete') handleAction({ type: 'NEXT_LEVEL' });
    if (phase === 'gameComplete')  handleAction({ type: 'RESTART' });
    if (phase === 'lost')          handleAction({ type: 'RESTART' });
  }, [getState, handleAction]);

  // ── mobile / on-screen controls ──────────────────────────────────────────
  const ammoKeys = AMMO_ORDER.map(id => ({ id, ...AMMO_META[id] }));

  return (
    <div className="game-wrapper">
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={GAME_HEIGHT}
          onClick={handleCanvasClick}
          className="game-canvas"
        />

        {/* On-screen buttons (visible on touch devices) */}
        <div className="mobile-controls">
          <div className="mobile-player bride-controls">
            <div className="ammo-buttons">
              {ammoKeys.map(a => (
                <button
                  key={a.id}
                  className="ammo-btn"
                  style={{ '--ammo-color': a.color }}
                  onClick={() => handleAction({ type: 'SELECT_AMMO', role: 'bride', ammoType: a.id })}
                  title={a.description}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button
              className="shoot-btn bride-shoot"
              onPointerDown={() => handleAction({ type: 'SHOOT', role: 'bride' })}
            >
              👰 SHOOT
            </button>
          </div>

          <div className="mobile-player groom-controls">
            <div className="ammo-buttons">
              {ammoKeys.map(a => (
                <button
                  key={a.id}
                  className="ammo-btn"
                  style={{ '--ammo-color': a.color }}
                  onClick={() => handleAction({ type: 'SELECT_AMMO', role: 'groom', ammoType: a.id })}
                  title={a.description}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button
              className="shoot-btn groom-shoot"
              onPointerDown={() => handleAction({ type: 'SHOOT', role: 'groom' })}
            >
              🤵 SHOOT
            </button>
          </div>
        </div>

        <div className="key-legend">
          <span>{`👰 ${event.names.bride} — A/D move · S ammo · W shoot`}</span>
          <span>{`🤵 ${event.names.groom} — ←/→ move · ↑/↓ ammo · Space shoot`}</span>
        </div>
      </div>
    </div>
  );
}
