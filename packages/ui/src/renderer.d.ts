export declare class Renderer {
    private canvas;
    private viewWidth;
    private viewHeight;
    private scale;
    private ctx;
    private cameraX;
    private cameraY;
    private spriteSheet;
    private spriteReady;
    /** Scaled pixel width of one tile on screen. */
    private destW;
    /** Scaled pixel height of one tile on screen. */
    private destH;
    /** Scaled row-advance (top-face height) in screen pixels. */
    private rowStep;
    constructor(canvas: HTMLCanvasElement, viewWidth: number, viewHeight: number, scale: number);
    /** Callback invoked when the sprite sheet finishes loading. */
    onReady: (() => void) | null;
    setCamera(x: number, y: number): void;
    /** Draw a sprite from the sheet at a screen-tile position. */
    private drawSprite;
    render(world: World): void;
}
//# sourceMappingURL=renderer.d.ts.map