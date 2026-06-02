import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [NgIf],
  templateUrl: './app-toast.html',
  styleUrl: './app-toast.css',
})
export class AppToast {
  @Input() show = false;
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
}
