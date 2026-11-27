import Game from '../Game';

/**
 * A couple's event page: their game and nothing else.
 *
 * @param {{ event: import('../events/eventConfig').EventConfig }} props
 */
export default function EventPage({ event }) {
  return <Game event={event} />;
}
