import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-badge-flotante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './badge-flotante.html',
  styleUrls: ['./badge-flotante.css']
})
export class BadgeFlotante {
  @Input() props!: {
    text: string;
    color: string;
    position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    rotation: number;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  mostrarModal = false;

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    this.actualizarProps.emit(this.props);
    this.cerrarModal();
  }

  eliminar() {
    this.eliminarElemento.emit();
  }
}
