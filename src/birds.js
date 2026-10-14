// A small flock of birds drifting slowly across the sky behind the game.

export function startBirds(canvas) {
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1;
  let flock;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function newFlock(startX) {
    const n = 5 + Math.floor(Math.random() * 5);
    const birds = [];
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const rank = Math.ceil(i / 2);
      birds.push({
        dx: -rank * 26 + (Math.random() - 0.5) * 16,
        dy: side * rank * 13 + (Math.random() - 0.5) * 12,
        phase: Math.random() * Math.PI * 2,
        flap: 0.85 + Math.random() * 0.35,
        size: 0.8 + Math.random() * 0.4,
      });
    }
    return {
      x: startX ?? -120,
      baseY: H * (0.07 + Math.random() * 0.2),
      speed: Math.max(W, 600) / (50 + Math.random() * 20), // crosses the screen in about a minute
      drift: Math.random() * Math.PI * 2,
      birds,
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const s = Math.max(5, Math.min(10, Math.min(W, H) * 0.012));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(48, 34, 42, 0.55)";
    const fy = flock.baseY + Math.sin(t / 7000 + flock.drift) * H * 0.025;
    for (const b of flock.birds) {
      const bx = flock.x + b.dx + Math.sin(t / 1500 + b.phase) * 6;
      const by = fy + b.dy + Math.cos(t / 1800 + b.phase) * 4;
      const f = still ? 0.4 : Math.sin(t / 1000 * 7 * b.flap + b.phase);
      const z = s * b.size;
      ctx.lineWidth = z * 0.24;
      ctx.beginPath();
      ctx.moveTo(bx - z, by - f * z * 0.55);
      ctx.quadraticCurveTo(bx - z * 0.45, by - z * 0.05 - f * z * 0.2, bx, by + z * 0.15);
      ctx.quadraticCurveTo(bx + z * 0.45, by - z * 0.05 - f * z * 0.2, bx + z, by - f * z * 0.55);
      ctx.stroke();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    flock.x += flock.speed * dt;
    if (flock.x > W + 200) flock = newFlock();
    draw(now);
    requestAnimationFrame(frame);
  }

  resize();
  flock = newFlock(W * 0.35);
  window.addEventListener("resize", resize);
  if (still) draw(0);
  else requestAnimationFrame(frame);
}
