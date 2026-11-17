/**
 * Shared gameplay tuning, so feel can be adjusted in one place. Times are in ticks (60 per second).
 * A constant used by only one module lives beside the code that uses it.
 */

export const TICKS_PER_SECOND = 60;
export const SCREEN_W = 384;
export const SCREEN_H = 224;

// Movement and physics
export const GRAVITY = 0.42;
export const AIR_CONTROL = 1.1;
export const HURT_FRICTION = 0.8;
export const BOUNCE_MIN_SPEED = 2;
export const BOUNCE_VY = 2.4;
export const BOUNCE_VX_KEEP = 0.5;
export const PLAYER_EDGE_MARGIN = 10;
export const ENEMY_EDGE_MARGIN = 24;
export const BOSS_EDGE_INSET = 18;
export const CAMERA_LEAD = 0.4;
export const CAMERA_MAX_STEP = 3;

// Input leniency
export const COMBO_BUFFER = 14;
export const SPECIAL_WINDOW = 4;
export const DOUBLE_TAP_WINDOW = 14;
export const DASH_MIN_TICKS = 10;
export const DASH_MAX_TICKS = 44;

// Knockdown cycle
export const DOWN_TICKS = 36;
export const GETUP_TICKS = 16;
export const DEAD_TICKS = 56;
export const WAKE_INVULN_PLAYER = 45;
export const WAKE_INVULN_ENEMY = 6;
export const FLASH_TICKS = 6;
export const MIN_KO_LAUNCH_VY = 3.4;
export const KO_LAUNCH_VX = 2.6;

// Grabs and throws
export const GRAB_RANGE_X = 16;
export const GRAB_RANGE_Z = 6;
export const GRAB_OFFSET = 15;
export const GRAB_HOLD_TICKS = 110;
export const GRAB_MAX_HITS = 3;
export const GRAB_HIT_DAMAGE = 7;
export const GRAB_HITSTOP = 5;
export const THROW_VX = 4.2;
export const THROW_VY = 4.6;
export const THROW_START_Y = 22;
export const THROW_LAND_DAMAGE = 14;
export const THROW_BODY_DAMAGE = 12;
export const THROWN_BODY_HALF_WIDTH = 14;
export const THROWN_BODY_HEIGHT = 30;

// Player lifecycle
export const START_LIVES = 3;
export const RESPAWN_TICKS = 100;
export const RESPAWN_INVULN = 150;
export const RESPAWN_DROP_HEIGHT = 130;
export const RESPAWN_BLAST_RANGE = 120;
export const CONTINUE_SECONDS = 9;
export const CLEAR_DELAY_TICKS = 170;
export const SPECIAL_MIN_HP = 1;

// Scoring
export const SCORE_PER_DAMAGE = 10;
export const SCORE_GOLD = 500;
export const SCORE_FOOD = 100;

// Pickups and props
export const PICKUP_RANGE_X = 14;
export const PICKUP_RANGE_Z = 9;
export const PICKUP_TTL = 720;
export const PICKUP_HOP_VY = 3;
export const HEAL_BUN = 30;
export const HEAL_CHICKEN = 70;
export const PROP_HALF_WIDTH = 9;
export const PROP_HEIGHT = 22;
export const BARREL_BLAST_RADIUS = 46;
export const BARREL_BLAST_DAMAGE = 22;

// Projectiles and hazards
export const ARROW_SPEED = 3.6;
export const ARROW_DAMAGE = 7;
export const ARROW_HEIGHT = 30;
export const ARROW_TTL = 150;
export const ARROW_Z_RANGE = 7;
export const FIRE_DAMAGE = 8;
export const FIRE_MAX_HEIGHT = 6;
export const STRIKE_LINGER_TICKS = 40;
export const MAST_DAMAGE = 20;
export const RAIN_DAMAGE = 9;

// Stage director
export const WAVE_GAP_TICKS = 40;
export const SPAWN_OFFSCREEN = 30;
export const GO_PROMPT_TICKS = 150;

// AI director
export const MAX_MELEE_TOKENS = 2;
export const MAX_MELEE_TOKENS_BOSS = 1;
export const MAX_RANGED_TOKENS = 1;
export const TOKEN_COOLDOWN_MIN = 24;
export const TOKEN_COOLDOWN_SPREAD = 40;
export const TOKEN_TIMEOUT = 240;
export const REBALANCE_INTERVAL = 90;
export const AI_RETHINK_MIN = 60;
export const AI_RETHINK_SPREAD = 90;
export const AI_Z_SPREAD = 44;
export const AI_DEADZONE = 5;
export const AI_ONSCREEN_MARGIN = 14;

// Boss
export const BOSS_PHASE_2 = 0.6;
export const BOSS_PHASE_3 = 0.3;
export const BOSS_FINAL_PHASE = 3;
export const BOSS_FLINCH_LIMIT = 4;
export const BOSS_FLINCH_WINDOW = 100;
export const BOSS_PLAN_TIMEOUT = 150;
export const BOSS_MAX_REPEATS = 2;
export const BOSS_WAKE_INVULN = 40;
export const BOSS_LEAP_VY = 6.6;
export const BOSS_LEAP_MAX_VX = 4.2;
