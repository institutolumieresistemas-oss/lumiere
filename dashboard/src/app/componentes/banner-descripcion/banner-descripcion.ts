import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-banner-descripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-descripcion.html',
  styleUrls: ['./banner-descripcion.css']
})
export class BannerDescripcion implements OnInit, OnDestroy {
  @Input() props!: {
    nombre: string;
    direccion: string;
    mapaUrl: string;
    descripcion: string;
    galeria: string[];
    galleryPosition?: 'left' | 'right';
    autoPlayInterval?: number;
    diseno?: 'playful' | 'serious' | 'minimal' | 'modern';
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  activeImageIndex = 0;
  private intervalId: any;
  configOpen = false;

  activeTab: 'datos' | 'imagenes' = 'datos';

  // Cloned object for modal configuration
  tempProps: any = {};

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.stopAutoPlay();
    const ms = this.props?.autoPlayInterval || 3000;
    this.intervalId = setInterval(() => {
      if (this.props?.galeria && this.props.galeria.length > 0) {
        this.activeImageIndex = (this.activeImageIndex + 1) % this.props.galeria.length;
      }
    }, ms);
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  abrirConfig() {
    this.tempProps = JSON.parse(JSON.stringify(this.props));
    if (!this.tempProps.galeria) this.tempProps.galeria = [];
    if (!this.tempProps.galleryPosition) this.tempProps.galleryPosition = 'left';
    if (!this.tempProps.autoPlayInterval) this.tempProps.autoPlayInterval = 3000;
    if (!this.tempProps.diseno) this.tempProps.diseno = 'playful';
    this.activeTab = 'datos';
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.tempProps };
    this.actualizarProps.emit(this.props);
    this.startAutoPlay();
    this.cerrarConfig();
  }

  cambiarPosicion(pos: 'left' | 'right') {
    this.tempProps.galleryPosition = pos;
  }

  agregarImagen() {
    this.tempProps.galeria = [...this.tempProps.galeria, 'https://picsum.photos/600/400?random=' + Math.floor(Math.random() * 100)];
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (e.target.result) {
        this.tempProps.galeria = [...this.tempProps.galeria, e.target.result];
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  eliminarImagen(index: number) {
    this.tempProps.galeria = this.tempProps.galeria.filter((_: any, i: number) => i !== index);
  }

  trackByFn(index: number, item: any) {
    return index;
  }
}
