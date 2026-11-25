import { defaultEvent } from '../events';

/** Items shown flying across the preview, top row first. */
const PREVIEW_ITEM_IDS = ['rings', 'cake', 'flowers', 'guest', 'catering', 'officiant'];

const PREVIEW_ITEMS = PREVIEW_ITEM_IDS
  .map((id) => defaultEvent.items.find((item) => item.id === id))
  .filter(Boolean);

const GROOM_EMOJI = '🤵';
const BRIDE_EMOJI = '👰';

/**
 * A static, CSS-only illustration of the game screen built from the default
 * event's item emoji. It is not the game: no canvas, no game loop.
 *
 * @param {{ label: string }} props  `label` describes the picture to assistive technology.
 */
export default function GameplayPreview({ label }) {
  return (
    <div className="home-preview" role="img" aria-label={label} data-testid="gameplay-preview">
      <div className="home-preview-screen" aria-hidden="true">
        <span className="home-preview-player home-preview-groom">{GROOM_EMOJI}</span>
        {PREVIEW_ITEMS.map((item, index) => (
          <span
            key={item.id}
            className="home-preview-item"
            data-item={item.id}
            style={{ '--wv-i': index }}
          >
            {item.emoji}
          </span>
        ))}
        <span className="home-preview-player home-preview-bride">{BRIDE_EMOJI}</span>
      </div>
    </div>
  );
}
