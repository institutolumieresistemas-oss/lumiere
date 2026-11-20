import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
  imports: [CommonModule, FormsModule]
})
export class Menu {
  
  @Input() styleType: 'capsule' | 'neon' | 'playful' | 'liquid' | 'bento' | 'wave' | 'tech' = 'capsule';
  @Input() sinTransparencia: boolean = false;

  @Output() eliminarElemento = new EventEmitter<void>();
  @Output() actualizarProps = new EventEmitter<any>();

  scrolled = false;
  mostrarModal = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;  // 50px de scroll para activar el cambio
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  emitirCambio() {
    this.actualizarProps.emit({ styleType: this.styleType, sinTransparencia: this.sinTransparencia });
  }
}
