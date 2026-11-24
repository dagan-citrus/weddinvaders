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

// Ammo labels used in HUD / cycling
export const AMMO_ORDER = ['cash', 'invite', 'heart'];
export const AMMO_META  = {
  cash:   { label: '💵', color: '#4caf50',  description: 'Cash — pays for items'              },
  invite: { label: '💌', color: '#e040fb',  description: 'Invite — guests attend & bring gifts' },
  heart:  { label: '💕', color: '#e91e63',  description: 'Heart — family gives big donations'  },
};

// Damage each ammo type does per bullet hit
export const AMMO_DAMAGE = { cash: 100, invite: 1, heart: 1 };

// Timing
export const ROW_ADVANCE_SPEEDUP   = 2.5; // multiplier once all required items are acquired
export const HOURGLASS_SLOW_SECONDS = 15; // real seconds the hourglass item slows row-advance for
