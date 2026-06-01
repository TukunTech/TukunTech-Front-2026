import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

export interface RegisterStep {
  number: number;
  key: string;
}

@Component({
  selector: 'app-register-stepper',
  imports: [NgFor, NgClass, TranslatePipe],
  templateUrl: './register-stepper.html',
  styleUrl: './register-stepper.css',
})
export class RegisterStepper {
  @Input() steps: RegisterStep[] = [];
  @Input() currentStep = 1;

  @ViewChild('stepperScroll') stepperScroll!: ElementRef<HTMLDivElement>;

  scrollSteps(direction: 'left' | 'right') {
    this.stepperScroll.nativeElement.scrollBy({
      left: direction === 'right' ? 140 : -140,
      behavior: 'smooth',
    });
  }
}
