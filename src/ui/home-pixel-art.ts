/** 11×11 dot sprites — 0 = empty, 1 = filled (shape pixel) */

export const HOME_PIXEL_GRID_SIZE = 11;
export const HOME_PIXEL_BLOCK_COUNT = 4;

export type HomePixelBlock = {
  id: string;
  title: string;
  /** Row-major — 1 = part of the image */
  pixels: readonly (0 | 1)[];
};

const SMILEY: HomePixelBlock = {
  id: 'smiley',
  title: 'Smiley face',
  pixels: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

const HEART: HomePixelBlock = {
  id: 'heart',
  title: 'Heart',
  pixels: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

/** Regular 5-point star — symmetric arms, single top point, matched lower points. */
const STAR: HomePixelBlock = {
  id: 'star',
  title: 'Star',
  pixels: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0,
    0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

export const HOME_PIXEL_BLOCKS: readonly HomePixelBlock[] = [HEART, HEART, HEART, HEART];

export function homePixelFilled(blockIndex: number, dotIndex: number): boolean {
  const block = HOME_PIXEL_BLOCKS[blockIndex];
  if (!block) return false;
  return block.pixels[dotIndex] === 1;
}

/** Positive rowOffset shifts the sprite down within the grid (heart appears lower). */
export function homePixelFilledAtRowOffset(
  blockIndex: number,
  dotIndex: number,
  rowOffset: number,
): boolean {
  const sourceIndex = dotIndex - rowOffset * HOME_PIXEL_GRID_SIZE;
  if (sourceIndex < 0 || sourceIndex >= HOME_PIXEL_GRID_SIZE * HOME_PIXEL_GRID_SIZE) return false;
  return homePixelFilled(blockIndex, sourceIndex);
}
