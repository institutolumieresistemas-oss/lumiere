import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.css',
})
export class Whatsapp {

  @Input() phone: string = '523335893912';
  @Input() message: string = '';
  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  mostrarModal = false;
  urlCopiada = false;

  get waUrl(): string {
    const base = `https://wa.me/${this.phone}`;
    return this.message?.trim()
      ? `${base}?text=${encodeURIComponent(this.message.trim())}`
      : base;
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.urlCopiada = false;
  }

  openWhatsApp() {
    if (!this.phone) return;
    window.open(this.waUrl, '_blank');
  }

  onPropsChange() {
    this.actualizarProps.emit({ phone: this.phone, message: this.message });
  }

  async copiarUrl() {
    try {
      await navigator.clipboard.writeText(this.waUrl);
      this.urlCopiada = true;
      setTimeout(() => (this.urlCopiada = false), 2500);
    } catch {
      // fallback para navegadores sin soporte
      const el = document.createElement('textarea');
      el.value = this.waUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.urlCopiada = true;
      setTimeout(() => (this.urlCopiada = false), 2500);
    }
  }

  eliminar() {
    this.eliminarElemento.emit();
  }
}
