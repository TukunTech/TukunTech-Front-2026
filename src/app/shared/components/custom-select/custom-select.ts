import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';

export interface CustomSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-custom-select',
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.css',
})
export class CustomSelect {
  @Input() options: CustomSelectOption[] = [];
  @Input() placeholder = '';
  @Input() value = '';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  get selectedLabel(): string {
    return this.options.find(option => option.value === this.value)?.label || this.placeholder;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: CustomSelectOption) {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isOpen = false;
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
