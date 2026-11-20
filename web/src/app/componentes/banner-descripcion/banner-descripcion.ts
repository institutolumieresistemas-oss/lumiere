import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner-descripcion',
  standalone: true,
  imports: [CommonModule],
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

  activeImageIndex = 0;
  private intervalId: any;

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
}
