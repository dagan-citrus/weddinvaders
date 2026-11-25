import Game from '../Game';
import { defaultEvent } from '../events';

/** The demo: the default event's game, with no site chrome around it. */
export default function DemoPage() {
  return <Game event={defaultEvent} />;
}
