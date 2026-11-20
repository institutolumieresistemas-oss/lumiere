import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-examen-gratis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examen-gratis.html',
  styleUrls: ['./examen-gratis.css']
})
export class ExamenGratis implements OnInit {

  @Input() props: any = {};
  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  ngOnInit() {
    if (!this.props || !this.props.titulo) {
      this.props = {
        titulo: 'Examen de Diagnóstico Gratuito',
        subtitulo: 'Pon a prueba tus conocimientos de Español y Matemáticas'
      };
      this.actualizarProps.emit(this.props);
    }
  }

  eliminar() {
    this.eliminarElemento.emit();
  }
}
