// Sprite sheet: each tile is 16px wide × 24px tall.
// The top 12px is the top face; the bottom 12px is the front face.
const SPRITE_W = 16;
const SPRITE_H = 24;
const FACE_H = 12; // height of each "face" (top / front) in source pixels
/** Maps entity type → sprite location (or animation) in the sheet. */
const ENTITY_SPRITES = {
    dirt: { col: 0, row: 1 },
    grass: { col: 1, row: 1 },
    sand: { col: 2, row: 1 },
    water: {
        frames: [
            { col: 4, row: 1 },
            { col: 5, row: 1 },
            { col: 6, row: 1 },
            { col: 7, row: 1 },
        ],
        interval: 250,
    },
};
export class Renderer {
    canvas;
    viewWidth;
    viewHeight;
    scale;
    ctx;
    cameraX = 0;
    cameraY = 0;
    spriteSheet;
    spriteReady = false;
    /** Scaled pixel width of one tile on screen. */
    destW;
    /** Scaled pixel height of one tile on screen. */
    destH;
    /** Scaled row-advance (top-face height) in screen pixels. */
    rowStep;
    constructor(canvas, viewWidth, viewHeight, scale) {
        this.canvas = canvas;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.scale = scale;
        this.destW = SPRITE_W * scale;
        this.destH = SPRITE_H * scale;
        this.rowStep = FACE_H * scale;
        // Canvas: full tile width, but rows overlap by the front-face height.
        canvas.width = viewWidth * this.destW;
        // First row gets full tile height; each subsequent row adds only rowStep.
        canvas.height = this.destH + (viewHeight - 1) * this.rowStep;
        this.ctx = canvas.getContext('2d');
        // Crisp pixel scaling.
        this.ctx.imageSmoothingEnabled = false;
        // Load sprite sheet.
        this.spriteSheet = new Image();
        this.spriteSheet.src = '/sprites/sprites.png';
        this.spriteSheet.onload = () => {
            this.spriteReady = true;
            this.onReady?.();
        };
    }
    /** Callback invoked when the sprite sheet finishes loading. */
    onReady = null;
    setCamera(x, y) {
        this.cameraX = x - Math.floor(this.viewWidth / 2);
        this.cameraY = y - Math.floor(this.viewHeight / 2);
    }
    /** Draw a sprite from the sheet at a screen-tile position. */
    drawSprite(col, row, screenX, screenY) {
        if (!this.spriteReady)
            return;
        this.ctx.drawImage(this.spriteSheet, col * SPRITE_W, row * SPRITE_H, // source x, y
        SPRITE_W, SPRITE_H, // source w, h
        screenX * this.destW, // dest x
        screenY * this.rowStep, // dest y (rows overlap)
        this.destW, this.destH);
    }
    render(world) {
        const { ctx, destW, rowStep, viewWidth, viewHeight, cameraX, cameraY } = this;
        // Clear.
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Collect visible entities into rows for back-to-front drawing.
        const rows = [];
        for (let i = 0; i < viewHeight; i++)
            rows.push([]);
        for (const id of queryEntities(world, 'position', 'entityType')) {
            const pos = getComponent(world, id, 'position');
            const sx = pos.x - cameraX;
            const sy = pos.y - cameraY;
            if (sx < 0 || sx >= viewWidth || sy < 0 || sy >= viewHeight)
                continue;
            rows[sy].push({ id, sx, sy });
        }
        // Draw back-to-front so near rows occlude the front face of far rows.
        for (const row of rows) {
            for (const { id, sx, sy } of row) {
                const typeName = getComponent(world, id, 'entityType').type;
                const sprite = ENTITY_SPRITES[typeName];
                if (sprite) {
                    if ('frames' in sprite) {
                        const offset = (sx + cameraX + sy + cameraY) % sprite.frames.length;
                        const frame = sprite.frames[(Math.floor(performance.now() / sprite.interval) + offset) % sprite.frames.length];
                        this.drawSprite(frame.col, frame.row, sx, sy);
                    }
                    else {
                        this.drawSprite(sprite.col, sprite.row, sx, sy);
                    }
                }
                else {
                    // Fallback glyph for entities with no sprite (e.g. player).
                    const pc = getComponent(world, id, 'playerControlled');
                    if (pc) {
                        ctx.fillStyle = '#ffff00';
                        ctx.font = `bold ${rowStep - 2}px Courier New`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('@', sx * destW + destW / 2, sy * rowStep + rowStep / 2);
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=renderer.js.map