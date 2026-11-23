export const GAME_WIDTH   = 800;
export const PANEL_WIDTH  = 110;               // side checklist panel
export const CANVAS_WIDTH = GAME_WIDTH + PANEL_WIDTH; // 910
export const GAME_HEIGHT  = 600; // 540 play area + 60 HUD

export const TOTAL_ROWS   = 9;   // rows 0-8
export const ROW_HEIGHT   = 60;  // each row is 60px tall
export const PLAY_HEIGHT  = TOTAL_ROWS * ROW_HEIGHT; // 540
export const HUD_HEIGHT   = GAME_HEIGHT - PLAY_HEIGHT; // 60

// Player sizes and starting rows
export const PLAYER_WIDTH  = 62;
export const PLAYER_HEIGHT = 50;
export const PLAYER_SPEED  = 5;

export const GROOM_START_ROW = 0;                 // top
export const BRIDE_START_ROW = TOTAL_ROWS - 1;    // bottom = row 8

// Groom starts top-right corner, bride starts bottom-left
export const GROOM_START_X = GAME_WIDTH - PLAYER_WIDTH - 20;
export const BRIDE_START_X = 20;

// Projectiles
export const BULLET_SPEED  = 8;
export const BULLET_WIDTH  = 10;
export const BULLET_HEIGHT = 6;

// Flying items
export const ITEM_WIDTH  = 68;
export const ITEM_HEIGHT = 56; // fits in ROW_HEIGHT with 2px margin top+bottom
export const ITEM_SPEED  = 1.5;

// Ammo labels used in HUD / cycling
export const AMMO_ORDER = ['cash', 'invite', 'heart'];
export const AMMO_META  = {
  cash:   { label: '💵', color: '#4caf50',  description: 'Cash — pays for items'              },
  invite: { label: '💌', color: '#e040fb',  description: 'Invite — guests attend & bring gifts' },
  heart:  { label: '💕', color: '#e91e63',  description: 'Heart — family gives big donations'  },
};

// Item definitions
// spawnWeight controls relative spawn probability — higher = more common.
export const WEDDING_ITEMS = [
  // ── essentials (bought with cash) ──
  { id: 'rings',        emoji: '💍', label: 'Rings',          price: 500, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  { id: 'officiant',    emoji: '⛪', label: 'Officiant',       price: 300, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  { id: 'catering',     emoji: '🍽️', label: 'Catering',        price: 800, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  // ── income items ──
  { id: 'guest',        emoji: '👥', label: 'Guest',       price: 0, essential: false, exclusiveTo: null,    incomeType: 'income', incomeAmount: 150, ammoRequired: 'invite', spawnWeight: 5 },
  { id: 'parent_bride', emoji: '👩‍👧', label: 'Her Family',  price: 0, essential: false, exclusiveTo: 'bride', incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
  { id: 'parent_groom', emoji: '👨‍👦', label: 'His Family',  price: 0, essential: false, exclusiveTo: 'groom', incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
  // ── special ──
  { id: 'discount',     emoji: '🎀', label: 'Organizer',       price: 200, essential: false, exclusiveTo: null,    incomeType: 'discount', discountPct: 0.3,  ammoRequired: 'cash',  spawnWeight: 3 },
  { id: 'mine',         emoji: '💣', label: 'Trap',            price: 0,   essential: false, exclusiveTo: null,    incomeType: 'mine',     ammoRequired: null,                       spawnWeight: 3 },
  { id: 'hourglass',    emoji: '⏳', label: 'More Time',       price: 150, essential: false, exclusiveTo: null,    incomeType: 'time',     ammoRequired: 'cash',                     spawnWeight: 2 },
  // ── optional purchases ──
  { id: 'flowers',      emoji: '💐', label: 'Flowers',         price: 200, essential: false, exclusiveTo: 'bride', incomeType: null,       spawnWeight: 10 },
  { id: 'suit',         emoji: '🤵', label: 'Suit',            price: 250, essential: false, exclusiveTo: 'groom', incomeType: null,       spawnWeight: 10 },
  { id: 'cake',         emoji: '🎂', label: 'Cake',            price: 350, essential: false, exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
];

// Damage each ammo type does per bullet hit
export const AMMO_DAMAGE = { cash: 100, invite: 1, heart: 1 };

// Starting resources
export const INITIAL_MONEY  = 2000; // cash is both ammo and money
export const INITIAL_INVITE = 8;
export const INITIAL_HEART  = 4;

// Timing
export const GAME_DURATION         = 90;  // seconds
export const ROW_ADVANCE_INTERVAL  = 18;  // seconds between each row advance
export const ROW_ADVANCE_SPEEDUP   = 2.5; // multiplier once all required items are acquired
export const HOURGLASS_SLOW_SECONDS = 15; // real seconds the hourglass item slows row-advance for
