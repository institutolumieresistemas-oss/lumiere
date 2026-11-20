import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageCropperComponent
  ],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.css']
})
export class Profesores {

  @Input() props!: {
    mostrarRedes?: boolean;
    layout?: 'scroll' | 'polaroid' | 'stories' | 'flashcard' | 'deck';
    profesores: {
      nombre: string;
      especialidad: string;
      descripcion: string;
      foto: string;
      tiktok?: string;
      instagram?: string;
      facebook?: string;
      youtube?: string;
    }[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  profesorSeleccionado: any = null;
  profesorIndex: number = 0;
  activeDeckIndex = 0;

  // Detalle modal
  detalleOpen = false;
  detalleProfesor: any = null;

  imageChangedEvent: any = '';
  croppedImage: any;

  actualizarLayout(layout: 'scroll' | 'polaroid' | 'stories' | 'flashcard' | 'deck') {
    this.props.layout = layout;
    this.actualizarProps.emit({ ...this.props });
  }

  abrirConfig(profesor: any, index: number) {
    this.profesorSeleccionado = {
      ...profesor,
      tiktok: profesor.tiktok || '',
      instagram: profesor.instagram || '',
      facebook: profesor.facebook || '',
      youtube: profesor.youtube || ''
    };
    this.profesorIndex = index;

    // precargar imagen existente
    this.croppedImage = profesor.foto || '';
    this.imageChangedEvent = '';

    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
    this.profesorSeleccionado = null;
    this.profesorIndex = 0;
    this.imageChangedEvent = '';
    this.croppedImage = '';
  }

  guardarConfig() {
    const p = this.props.profesores[this.profesorIndex];
    p.nombre = this.profesorSeleccionado.nombre;
    p.especialidad = this.profesorSeleccionado.especialidad;
    p.descripcion = this.profesorSeleccionado.descripcion;
    p.tiktok = this.profesorSeleccionado.tiktok;
    p.instagram = this.profesorSeleccionado.instagram;
    p.facebook = this.profesorSeleccionado.facebook;
    p.youtube = this.profesorSeleccionado.youtube;

    if (!this.croppedImage) {
      this.actualizarProps.emit({ ...this.props });
      this.cerrarConfig();
      return;
    }
  
    this.convertBlobToBase64(this.croppedImage).then(base64 => {
      p.foto = base64;
      this.actualizarProps.emit({ ...this.props });
      this.cerrarConfig();
    });
  }

  eliminarProfesor(index: number) {
    this.props.profesores.splice(index, 1);
    this.actualizarProps.emit({ ...this.props });
  }

  agregarProfesor() {
    if (!this.props.profesores) {
      this.props.profesores = [];
    }
    this.props.profesores.push({
      nombre: 'Nuevo Profesor',
      especialidad: '',
      descripcion: '',
      foto: '',
      tiktok: '',
      instagram: '',
      facebook: '',
      youtube: ''
    });
    this.actualizarProps.emit({ ...this.props });
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.croppedImage = '';
  }

  imageCropped(event: ImageCroppedEvent) {
    if (!event.blob) return;
    this.croppedImage = event.blob;
  }

  abrirModalDetalle(profesor: any) {
    this.detalleProfesor = profesor;
    this.detalleOpen = true;
  }

  cerrarModalDetalle() {
    this.detalleOpen = false;
    this.detalleProfesor = null;
  }
  
  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
  
      reader.readAsDataURL(blob);
    });
  }

}
