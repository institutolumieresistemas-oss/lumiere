import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-espacio-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './espacio-menu.html',
  styleUrls: ['./espacio-menu.css']
})
export class EspacioMenu implements OnInit {
  @Input() props!: {
    altura: number;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  propsEdit: any = {};

  ngOnInit() {
    if (!this.props) {
      this.props = { altura: 90 };
    }
  }

  abrirConfig() {
    this.propsEdit = { ...this.props };
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.propsEdit };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }
}
