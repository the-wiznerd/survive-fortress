import { type World, queryEntities, getComponent } from '@sf/core';

const SPRITE_SIZE = 16; // pixels per tile in the sprite sheet

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cameraX = 0;
  private cameraY = 0;
  private spriteSheet: HTMLImageElement;
  private spriteReady = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private tileSize: number,
  ) {
    canvas.width = viewWidth * tileSize;
    canvas.height = viewHeight * tileSize;
    this.ctx = canvas.getContext('2d')!;

    // Crisp pixel scaling.
    this.ctx.imageSmoothingEnabled = false;

    // Load sprite sheet.
    this.spriteSheet = new Image();
    this.spriteSheet.src = '/sprites/sprites.png';
    this.spriteSheet.onload = () => {
      this.spriteReady = true;
    };
  }

  setCamera(x: number, y: number) {
    this.cameraX = x - Math.floor(this.viewWidth / 2);
    this.cameraY = y - Math.floor(this.viewHeight / 2);
  }

  /** Draw a sprite from the sheet by column and row index. */
  private drawSprite(col: number, row: number, screenX: number, screenY: number) {
    if (!this.spriteReady) return;
    this.ctx.drawImage(
      this.spriteSheet,
      col * SPRITE_SIZE, row * SPRITE_SIZE, // source x, y
      SPRITE_SIZE, SPRITE_SIZE,              // source w, h
      screenX * this.tileSize, screenY * this.tileSize, // dest x, y
      this.tileSize, this.tileSize,          // dest w, h
    );
  }

  render(world: World) {
    const { ctx, tileSize, viewWidth, viewHeight, cameraX, cameraY } = this;

    // Clear.
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw terrain tiles.
    for (const id of queryEntities(world, 'position', 'terrain')) {
      const pos = getComponent(world, id, 'position')!;
      const terrain = getComponent(world, id, 'terrain')!;
      const sx = pos.x - cameraX;
      const sy = pos.y - cameraY;

      if (sx < 0 || sx >= viewWidth || sy < 0 || sy >= viewHeight) continue;
      this.drawSprite(terrain.spriteCol, terrain.spriteRow, sx, sy);
    }

    // Draw entities (player, etc.) on top.
    for (const id of queryEntities(world, 'position', 'playerControlled')) {
      const pos = getComponent(world, id, 'position')!;
      const sx = pos.x - cameraX;
      const sy = pos.y - cameraY;

      if (sx < 0 || sx >= viewWidth || sy < 0 || sy >= viewHeight) continue;

      // Player glyph (placeholder until we have a player sprite).
      ctx.fillStyle = '#ffff00';
      ctx.font = `bold ${tileSize - 4}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '@',
        sx * tileSize + tileSize / 2,
        sy * tileSize + tileSize / 2,
      );
    }
  }
}
