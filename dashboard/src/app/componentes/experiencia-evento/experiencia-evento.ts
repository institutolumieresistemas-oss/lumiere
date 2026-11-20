import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ImageCropperComponent,
  ImageCroppedEvent
} from 'ngx-image-cropper';

@Component({
  selector: 'app-experiencia-evento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageCropperComponent
  ],
  templateUrl: './experiencia-evento.html',
  styleUrls: ['./experiencia-evento.css']
})
export class ExperienciaEvento {

  @Input() props!: {
    titulo: string;
    subtitulo: string;
    layout?: 'classic' | 'timeline' | 'ticket' | 'polaroid';
    colorFondo?: string;
    colorTexto?: string;
    cards: {
      titulo: string;
      descripcion: string;
      imagen: string;
    }[];
  };

  @Output() actualizarProps =
    new EventEmitter<any>();

  @Output() eliminarElemento =
    new EventEmitter<void>();

  configOpen = false;

  actualizarLayout(layout: string) {
    this.props.layout = layout as any;
    this.actualizarProps.emit({ ...this.props });
  }

  cardSeleccionada: any = null;

  cardIndex = 0;

  imageChangedEvent: any = '';

  croppedImage: any = '';

  abrirConfig(card: any, index: number) {

    this.cardSeleccionada = {
      ...card
    };

    this.cardIndex = index;

    this.croppedImage = card.imagen || '';

    this.imageChangedEvent = '';

    this.configOpen = true;

  }

  cerrarConfig() {

    this.configOpen = false;

    this.cardSeleccionada = null;

    this.cardIndex = 0;

    this.imageChangedEvent = '';

    this.croppedImage = '';

  }

  guardarConfig() {

    const card =
      this.props.cards[this.cardIndex];

    card.titulo =
      this.cardSeleccionada.titulo;

    card.descripcion =
      this.cardSeleccionada.descripcion;

    if (!this.croppedImage) {

      this.actualizarProps.emit({
        ...this.props
      });

      this.cerrarConfig();

      return;

    }

    this.convertBlobToBase64(
      this.croppedImage
    ).then(base64 => {

      card.imagen = base64;

      this.actualizarProps.emit({
        ...this.props
      });

      this.cerrarConfig();

    });

  }

  agregarCard() {

    this.props.cards.push({
      titulo: 'Nuevo Card',
      descripcion: 'Descripción',
      imagen: ''
    });

    this.actualizarProps.emit({
      ...this.props
    });

  }

  eliminarCard(index: number) {

    this.props.cards.splice(index, 1);

    this.actualizarProps.emit({
      ...this.props
    });

  }

  fileChangeEvent(event: any): void {

    this.imageChangedEvent = event;

    this.croppedImage = '';

  }

  imageCropped(event: ImageCroppedEvent) {

    if (!event.blob) return;

    this.croppedImage = event.blob;

  }

  convertBlobToBase64(
    blob: Blob
  ): Promise<string> {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            reader.result as string
          );

        reader.onerror = reject;

        reader.readAsDataURL(blob);

      }
    );

  }

}