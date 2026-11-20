import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-numeros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './numeros.html',
  styleUrls: ['./numeros.css']
})
export class Numeros {

  @Input() props!: {
    titulo: string;
    subtitulo: string;
    stats: { valor: string; texto: string; tipo?: string }[];
    layout?: 'classic' | 'chalkboard' | 'trophy' | 'dashboard' | 'flipcounter';
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;

  actualizarLayout(layout: string) {
    this.props.layout = layout as any;
    this.actualizarProps.emit({ ...this.props });
  }

  abrirConfig() {
    this.configOpen = true;
  }

  cerrar() {
    this.configOpen = false;
  }

  guardar() {
    this.actualizarProps.emit({ ...this.props });
    this.configOpen = false;
  }

  /** Retorna solo los dígitos del valor */
  soloNumero(valor: string): string {
    const match = valor.match(/\d+/);
    return match ? match[0] : '';
  }
}
