export const GRID_SIZE = 3;
export const CELL_SIZE = 1.7;
export const GRID_CENTER = Math.floor(GRID_SIZE / 2);
export const GUN_SLOT_COUNT = GRID_SIZE * GRID_SIZE;
export const TIERS = 7;

export const TIER_COLOR: number[] = [
  0xff3030,
  0xff8a0a,
  0xffd400,
  0x40e060,
  0x35d6ff,
  0x4060ff,
  0xc850ff,
];

export const TIER_DAMAGE       = [2, 4, 6, 8, 10, 12, 14] as const;
export const TIER_FIRERATE     = [1.4, 1.8, 2.3, 2.8, 3.5, 4.5, 6.0] as const;
export const TIER_RANGE        = [4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0] as const;
export const TIER_BULLET_SPEED = [10, 11, 13, 15, 17, 20, 24] as const;
export const TIER_HP           = [10, 20, 32, 46, 64, 84, 106] as const;

export const HERO_MAX_HP = 10;

export type WaveEnemyGroup = {
  tier: number;
  count: number;
  isBoss?: boolean;
};

export const WAVE_ENEMY_GROUPS: readonly WaveEnemyGroup[][] = [
  [{ tier: 1, count: 6 }],
  [
    { tier: 1, count: 5 },
    { tier: 2, count: 5 },
  ],
  [
    { tier: 1, count: 4 },
    { tier: 2, count: 5 },
    { tier: 3, count: 5 },
  ],
  [
    { tier: 2, count: 4 },
    { tier: 3, count: 5 },
    { tier: 4, count: 9 },
  ],
  [
    { tier: 2, count: 3 },
    { tier: 3, count: 5 },
    { tier: 4, count: 6 },
    { tier: 5, count: 7 },
    { tier: 5, count: 1, isBoss: true },
  ],
] as const;

export const TOTAL_WAVES = WAVE_ENEMY_GROUPS.length;
export const ENEMY_SPAWN_INTERVAL = 1.15;
export const MAX_ENEMIES = 8;
export const ENEMY_REACH_RADIUS = 0.6;
export const WAVE_NOTICE_VISIBLE_MS = 950;
export const WAVE_NOTICE_CLEAR_MS = 1450;
export const WAVE_POST_NOTICE_DELAY = 1.5;
export const BOSS_SIZE_MULTIPLIER = 1.5;
export const BOSS_HP = 680;
export const BOSS_SPEED = 0.38;

export const STARTING_MONEY = 110;
export const BASE_GUN_COST = 40;
export const GUN_COST_GROWTH = 10;
export const KILL_REWARD_BASE = 30;
export const KILL_REWARD_PER_WAVE = 12;
export const KILL_REWARD_PER_TIER = 14;
export const BOSS_KILL_REWARD = 350;

export const UPGRADE_BASE_COST = 60;
export const UPGRADE_COST_GROWTH = 40;
export const UPGRADE_DAMAGE_PER_LEVEL = 0.10;
export const UPGRADE_SPEED_PER_LEVEL = 0.10;
export const UPGRADE_HP_PER_LEVEL = 5;

export const CAMERA_FOV = 48;
export const CAMERA_POS: [number, number, number] = [0, 7.6, 7.4];
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, -1.4];
export const ENEMY_SPAWN_RADIUS = 16.8;
export const ENEMY_GOAL_X = 0;
export const ENEMY_GOAL_Z = 2.8;

export const ENEMY_TIER_COLOR = [0xff8d8d, 0xffc070, 0xfff080, 0x8df0a8, 0x88e8ff];
