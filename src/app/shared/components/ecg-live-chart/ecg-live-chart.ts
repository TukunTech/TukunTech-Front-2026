import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-ecg-live-chart',
  imports: [],
  templateUrl: './ecg-live-chart.html',
  styleUrl: './ecg-live-chart.css',
})
export class EcgLiveChart implements AfterViewInit, OnDestroy {
  @ViewChild('ecgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationId = 0;
  private offset = 0;

  ngAfterViewInit(): void {
    this.resizeCanvas();
    this.animate();

    window.addEventListener('resize', this.resizeCanvas);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeCanvas);
  }

  private resizeCanvas = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;

    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = parent.clientWidth * dpr;
    canvas.height = 170 * dpr;

    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = '170px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  private animate = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    this.drawGrid(ctx, width, height);
    this.drawWave(ctx, width, centerY);
    this.drawScanner(ctx, width, height);

    this.offset += 0.55;

    this.animationId = requestAnimationFrame(this.animate);
  };

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.strokeStyle = 'rgba(63, 162, 146, 0.07)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(63, 162, 146, 0.12)';

    for (let x = 0; x < width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  private drawWave(
    ctx: CanvasRenderingContext2D,
    width: number,
    centerY: number
  ): void {
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const phase = (x + this.offset) % 120;

      let y = centerY;

      if (phase < 18) {
        y += Math.sin(phase / 18 * Math.PI) * -5;
      } else if (phase < 26) {
        y += 0;
      } else if (phase < 30) {
        y -= 44;
      } else if (phase < 35) {
        y += 28;
      } else if (phase < 42) {
        y -= 6;
      } else if (phase < 65) {
        y += Math.sin((phase - 42) / 23 * Math.PI) * -10;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = '#3fa292';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  private drawScanner(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const scannerX = (this.offset * 1) % width;

    const gradient = ctx.createLinearGradient(scannerX - 40, 0, scannerX + 40, 0);

    gradient.addColorStop(0, 'rgba(63, 162, 146, 0)');
    gradient.addColorStop(0.5, 'rgba(63, 162, 146, 0.22)');
    gradient.addColorStop(1, 'rgba(63, 162, 146, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(scannerX - 40, 0, 80, height);

    ctx.strokeStyle = 'rgba(63, 162, 146, 0.35)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(scannerX, 0);
    ctx.lineTo(scannerX, height);
    ctx.stroke();
  }
}
