import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-testimonios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testimonios.html',
  styleUrls: ['./testimonios.css']
})
export class Testimonios {

  @Input() props!: {
    titulo: string;
    layout?: 'classic' | 'chat' | 'notebook' | 'report';
    testimonios: {
      nombre: string;
      texto: string;
      imagen: string;
      calificacion: number;
    }[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  actualizarLayout(layout: 'classic' | 'chat' | 'notebook' | 'report') {
    this.props.layout = layout;
    this.actualizarProps.emit({ ...this.props });
  }

  configOpen = false;
  testimonioSeleccionado: any = null;
  testimonioIndex: number | null = null;

  abrirConfig(testimonio: any, index: number) {
    this.testimonioSeleccionado = testimonio; // editamos directamente
    this.testimonioIndex = index;
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
    this.testimonioSeleccionado = null;
    this.testimonioIndex = null;
  }

  guardarConfig() {
    if (this.testimonioIndex !== null) {
      this.actualizarProps.emit({ ...this.props });
    }
    this.configOpen = false;
    this.testimonioSeleccionado = null;
    this.testimonioIndex = null;
  }

  eliminarTestimonio(index: number) {
    this.props.testimonios.splice(index, 1);
    this.actualizarProps.emit({ ...this.props });
  }

  agregarTestimonio() {
    this.props.testimonios.push({
      nombre: 'Nuevo Alumno',
      texto: '',
      imagen: '',
      calificacion: 5
    });
    this.actualizarProps.emit({ ...this.props });
  }

  onFileChange(event: any, testimonio: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      testimonio.imagen = reader.result as string;
      this.actualizarProps.emit({ ...this.props });
    };
    reader.readAsDataURL(file);
  }

}
