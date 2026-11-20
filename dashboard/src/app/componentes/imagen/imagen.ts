import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-imagen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagen.html',
  styleUrls: ['./imagen.css']
})
export class ImagenComponent {
  @Input() props!: {
    imageUrl: string;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  tempProps: any = {};

  abrirConfig() {
    this.tempProps = JSON.parse(JSON.stringify(this.props));
    if (this.tempProps.marginTop === undefined) this.tempProps.marginTop = 0;
    if (this.tempProps.marginBottom === undefined) this.tempProps.marginBottom = 0;
    if (this.tempProps.marginLeft === undefined) this.tempProps.marginLeft = 0;
    if (this.tempProps.marginRight === undefined) this.tempProps.marginRight = 0;
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.tempProps };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.tempProps.imageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
