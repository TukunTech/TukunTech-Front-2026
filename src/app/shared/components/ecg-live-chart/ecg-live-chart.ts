import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ecg-live-chart',
  imports: [NgIf],
  templateUrl: './ecg-live-chart.html',
  styleUrl: './ecg-live-chart.css',
})
export class EcgLiveChart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() active = true;
  @Input() heartRate = 74;
  @Input() inactiveMessage = '';

  @ViewChild('ecgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationId = 0;
  private offset = 0;
  private viewReady = false;

  get isChartActive(): boolean {
    return this.active && this.heartRate > 0;
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.resizeCanvas();
    this.renderChart();

    window.addEventListener('resize', this.resizeCanvas);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady || (!changes['active'] && !changes['heartRate'])) {
      return;
    }

    this.renderChart();
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

    this.renderChart();
  };

  private renderChart(): void {
    cancelAnimationFrame(this.animationId);

    if (this.isChartActive) {
      this.animate();
      return;
    }

    this.drawInactiveChart();
  }

  private animate = (): void => {
    if (!this.isChartActive) {
      this.drawInactiveChart();
      return;
    }

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

  private drawInactiveChart(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    this.drawGrid(ctx, width, height, true);

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = '#aeb8bd';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    muted = false
  ): void {
    ctx.strokeStyle = muted
      ? 'rgba(123, 135, 144, 0.08)'
      : 'rgba(63, 162, 146, 0.07)';
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

    ctx.strokeStyle = muted
      ? 'rgba(123, 135, 144, 0.13)'
      : 'rgba(63, 162, 146, 0.12)';

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

    const beatSpacing = this.getBeatSpacing();

    for (let x = 0; x < width; x++) {
      const phase = (x + this.offset) % beatSpacing;

      let y = centerY;

      if (phase < 18) {
        y += Math.sin(phase / 18 * Math.PI) * -5;
      } else if (phase < 30) {
        y += 0;
      } else if (phase < 34) {
        y -= 44;
      } else if (phase < 39) {
        y += 28;
      } else if (phase < 46) {
        y -= 6;
      } else if (phase < 74) {
        y += Math.sin((phase - 46) / 28 * Math.PI) * -10;
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

  private getBeatSpacing(): number {
    const pixelsPerMinute = 10600;
    const spacing = pixelsPerMinute / this.heartRate;

    return Math.max(82, Math.min(2200, spacing));
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
