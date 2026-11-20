import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mensaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensaje.html',
  styleUrls: ['./mensaje.css']
})
export class Mensaje {

  @Input() props!: {
    texto: string;
    layout?: 'classic' | 'postit' | 'highlighter' | 'push' | 'comic' | 'gamer';
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  editar = false;

  actualizarLayout(layout: 'classic' | 'postit' | 'highlighter' | 'push' | 'comic' | 'gamer') {
    this.props.layout = layout;
    this.actualizarProps.emit({ 
      texto: this.props.texto,
      layout: this.props.layout
    });
  }

  guardar() {
    this.actualizarProps.emit({ 
      texto: this.props.texto,
      layout: this.props.layout
    });
    this.editar = false;
  }
}
