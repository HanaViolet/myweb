/** One presentation signal for opacity, focus and input readiness.
 * Only foreground frame time advances the fail-safe; background tabs cannot
 * consume the opening animation. Reading never regresses during file paging.
 */
export class DetailPresentation {
  private elapsed = 0;
  private visibility = 0;
  private active = false;
  open(immediate = false) {
    this.active = true;
    this.elapsed = 0;
    this.visibility = immediate ? 1 : 0;
  }
  close() { this.active = false; this.visibility = 0; this.elapsed = 0; }
  update(deltaMs: number, sceneVisibility: number) {
    if (!this.active) return { visibility: 0, interactive: false, fallback: false };
    this.elapsed += Math.max(0, Math.min(deltaMs, 64));
    const fallback = Math.min(1, Math.max(0, (this.elapsed - 1800) / 260));
    const scene = Number.isFinite(sceneVisibility) ? Math.min(1, Math.max(0, sceneVisibility)) : 0;
    this.visibility = Math.max(this.visibility, scene, fallback);
    return { visibility: this.visibility, interactive: this.visibility >= 0.1, fallback: fallback > 0 };
  }
}
