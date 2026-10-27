import {
  Component,
  ElementRef,
  NgZone,
  viewChild,
  inject,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';

interface SkyStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  isViolet: boolean;
  hasSpikes: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface StardustParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

interface FallingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  headRadius: number;
  angle: number;
  particles: StardustParticle[];
}

@Component({
  selector: 'app-hero-background',
  templateUrl: './hero-background.component.html',
  styleUrl: './hero-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroBackgroundComponent implements AfterViewInit, OnDestroy {
  readonly starsCanvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('starsCanvas');
  private readonly ngZone = inject(NgZone);

  private isReducedMotion = false;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  private stars: SkyStar[] = [];
  private fallingStars: FallingStar[] = [];
  private lastFallingStarSpawn = 0;
  private nextFallingStarDelay = 1000;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.evaluateMotion();
      this.generateFullSkyStars();
      this.startRenderEngine();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }

    this.resizeDebounceTimer = setTimeout(() => {
      this.ngZone.runOutsideAngular(() => {
        this.evaluateMotion();
        this.generateFullSkyStars();
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }
  }

  private evaluateMotion(): void {
    this.isReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private generateFullSkyStars(): void {
    const canvas = this.starsCanvasRef().nativeElement;
    if (!canvas) return;

    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const count = Math.floor(Math.max(650, Math.min(1250, (width * height) / 1800)));
    this.stars = [];

    for (let i = 0; i < count; i++) {
      const radius = 0.4 + Math.random() * 1.5;
      const isViolet = Math.random() < 0.18;
      const hasSpikes = radius > 1.25 && Math.random() < 0.35;

      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha: 0.35 + Math.random() * 0.65,
        isViolet,
        hasSpikes,
        twinkleSpeed: 0.7 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private spawnFallingStar(width: number, height: number): void {
    const dirType = Math.floor(Math.random() * 5);
    let startX = 0;
    let startY = 0;
    let angle = 0;
    const speed = 16 + Math.random() * 11;
    const length = 170 + Math.random() * 150;
    const headRadius = 1.6 + Math.random() * 1.3;

    switch (dirType) {
      case 0:
        startX = -60 + Math.random() * (width * 0.6);
        startY = -60 + Math.random() * 40;
        angle = 0.58 + Math.random() * 0.36;
        break;

      case 1:
        startX = width * 0.4 + Math.random() * (width * 0.6 + 60);
        startY = -60 + Math.random() * 40;
        angle = 2.18 + Math.random() * 0.36;
        break;

      case 2:
        startX = -60;
        startY = Math.random() * (height * 0.5);
        angle = 0.36 + Math.random() * 0.46;
        break;

      case 3:
        startX = width + 60;
        startY = Math.random() * (height * 0.5);
        angle = 2.32 + Math.random() * 0.46;
        break;

      default:
        startX = 50 + Math.random() * (width - 100);
        startY = -60;
        angle = 1.36 + Math.random() * 0.44;
        break;
    }

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    this.fallingStars.push({
      x: startX,
      y: startY,
      vx,
      vy,
      length,
      headRadius,
      angle,
      particles: []
    });
  }

  private startRenderEngine(): void {
    const canvas = this.starsCanvasRef().nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const render = (time: number) => {
      if (this.isDestroyed) return;

      const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const tSec = time * 0.001;
        for (let i = 0; i < this.stars.length; i++) {
          const s = this.stars[i];
          const twinkle = 0.75 + 0.25 * Math.sin(tSec * s.twinkleSpeed + s.twinklePhase);
          const currentAlpha = Math.min(1, Math.max(0.2, s.baseAlpha * twinkle));

          ctx.save();
          if (s.isViolet) {
            ctx.fillStyle = `rgba(192, 132, 252, ${currentAlpha.toFixed(3)})`;
            ctx.shadowColor = 'rgba(192, 132, 252, 0.9)';
            ctx.shadowBlur = s.radius * 3.8;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(3)})`;
            if (s.radius > 1.1) {
              ctx.shadowColor = 'rgba(255, 255, 255, 0.65)';
              ctx.shadowBlur = s.radius * 2.5;
            }
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();

          if (s.hasSpikes && currentAlpha > 0.55) {
            ctx.strokeStyle = s.isViolet
              ? `rgba(192, 132, 252, ${(currentAlpha * 0.75).toFixed(3)})`
              : `rgba(255, 255, 255, ${(currentAlpha * 0.75).toFixed(3)})`;
            ctx.lineWidth = 0.8;
            const spikeLen = s.radius * 4.5;

            ctx.beginPath();
            ctx.moveTo(s.x - spikeLen, s.y);
            ctx.lineTo(s.x + spikeLen, s.y);
            ctx.moveTo(s.x, s.y - spikeLen);
            ctx.lineTo(s.x, s.y + spikeLen);
            ctx.stroke();
          }

          ctx.restore();
        }

        if (!this.isReducedMotion) {
          if (time - this.lastFallingStarSpawn > this.nextFallingStarDelay && this.fallingStars.length < 4) {
            this.spawnFallingStar(width, height);
            this.lastFallingStarSpawn = time;
            this.nextFallingStarDelay = 850 + Math.random() * 1400;
          }

          for (let i = this.fallingStars.length - 1; i >= 0; i--) {
            const m = this.fallingStars[i];

            m.x += m.vx;
            m.y += m.vy;

            const cos = Math.cos(m.angle);
            const sin = Math.sin(m.angle);
            const tailX = m.x - m.length * cos;
            const tailY = m.y - m.length * sin;

            if (Math.random() < 0.6) {
              const pOffset = Math.random() * (m.length * 0.45);
              m.particles.push({
                x: m.x - pOffset * cos + (Math.random() - 0.5) * 4,
                y: m.y - pOffset * sin + (Math.random() - 0.5) * 4,
                alpha: 0.85,
                size: 0.6 + Math.random() * 1.2
              });
            }

            const trailGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
            trailGrad.addColorStop(0, 'rgba(147, 18, 255, 0)');
            trailGrad.addColorStop(0.3, 'rgba(147, 18, 255, 0.45)');
            trailGrad.addColorStop(0.75, 'rgba(192, 132, 252, 0.85)');
            trailGrad.addColorStop(0.94, 'rgba(255, 255, 255, 0.95)');
            trailGrad.addColorStop(1, '#ffffff');

            ctx.save();
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = m.headRadius * 1.5;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();

            const headGrad = ctx.createRadialGradient(
              m.x,
              m.y,
              0,
              m.x,
              m.y,
              m.headRadius * 3.5
            );
            headGrad.addColorStop(0, '#ffffff');
            headGrad.addColorStop(0.35, '#c084fc');
            headGrad.addColorStop(0.75, 'rgba(147, 18, 255, 0.35)');
            headGrad.addColorStop(1, 'rgba(147, 18, 255, 0)');

            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.headRadius * 3.5, 0, Math.PI * 2);
            ctx.fill();

            for (let j = m.particles.length - 1; j >= 0; j--) {
              const p = m.particles[j];
              p.alpha -= 0.045;
              if (p.alpha <= 0) {
                m.particles.splice(j, 1);
                continue;
              }
              ctx.fillStyle = `rgba(224, 185, 255, ${p.alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();

            const tailReachedEnd =
              (m.vx > 0 && tailX > width + 80) ||
              (m.vx < 0 && tailX < -80) ||
              (m.vy > 0 && tailY > height + 80) ||
              (m.vy < 0 && tailY < -80);

            if (tailReachedEnd) {
              this.fallingStars.splice(i, 1);
            }
          }
        }

        ctx.restore();
      }

      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
  }
}
