import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-whatsapp',
  imports: [],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.css',
})
export class Whatsapp {
  @Input({ required: true }) phone!: string;
  @Input() message: string = '';

  get waUrl(): string {
    const base = `https://wa.me/${this.phone}`;
    return this.message?.trim()
      ? `${base}?text=${encodeURIComponent(this.message.trim())}`
      : base;
  }

  openWhatsApp() {
    if (!this.phone) return;
    window.open(this.waUrl, '_blank');
  }
}

