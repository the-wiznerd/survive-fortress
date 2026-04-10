import { type World, queryEntities, getComponent } from '@sf/core';

const TILE_COLORS: Record<string, string> = {
  grass: '#2d5a1e',
  default: '#1a1a1a',
};

const ENTITY_GLYPHS: Record<string, { char: string; color: string }> = {
  player: { char: '@', color: '#ffff00' },
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cameraX = 0;
  private cameraY = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private tileSize: number,
  ) {
    canvas.width = viewWidth * tileSize;
    canvas.height = viewHeight * tileSize;
    this.ctx = canvas.getContext('2d')!;
  }

  setCamera(x: number, y: number) {
    this.cameraX = x - Math.floor(this.viewWidth / 2);
    this.cameraY = y - Math.floor(this.viewHeight / 2);
  }

  render(world: World) {
    const { ctx, tileSize, viewWidth, viewHeight, cameraX, cameraY } = this;

    // Clear.
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw terrain (placeholder: all grass for now).
    for (let vy = 0; vy < viewHeight; vy++) {
      for (let vx = 0; vx < viewWidth; vx++) {
        ctx.fillStyle = TILE_COLORS.grass;
        ctx.fillRect(vx * tileSize, vy * tileSize, tileSize - 1, tileSize - 1);
      }
    }

    // Draw entities with positions.
    for (const id of queryEntities(world, 'position')) {
      const pos = getComponent(world, id, 'position')!;
      const screenX = pos.x - cameraX;
      const screenY = pos.y - cameraY;

      if (screenX < 0 || screenX >= viewWidth || screenY < 0 || screenY >= viewHeight) {
        continue;
      }

      const isPlayer = getComponent(world, id, 'playerControlled') !== undefined;
      const glyph = isPlayer ? ENTITY_GLYPHS.player : { char: '?', color: '#aaa' };

      ctx.fillStyle = glyph.color;
      ctx.font = `bold ${tileSize - 4}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        glyph.char,
        screenX * tileSize + tileSize / 2,
        screenY * tileSize + tileSize / 2,
      );
    }
  }
}
