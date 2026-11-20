import { 
  Component, 
  EventEmitter, 
  Input, 
  Output, 
  ViewChild, 
  ElementRef, 
  AfterViewInit, 
  OnDestroy, 
  ViewEncapsulation 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import videojs from 'video.js';

@Component({
  selector: 'app-streaming',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './streaming.html',
  styleUrl: './streaming.css',
  encapsulation: ViewEncapsulation.None // Necesario para que los estilos de Video.js se apliquen al reproductor
})
export class Streaming implements AfterViewInit, OnDestroy {
  
  @Input() props: any;
  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  // Referencia al elemento <video> en el HTML
  @ViewChild('videoTarget') videoTarget!: ElementRef;
  
  // Usamos ReturnType para obtener el tipo exacto del reproductor sin errores de importación
  player?: ReturnType<typeof videojs>;

  constructor() {}

  ngAfterViewInit() {
    this.initPlayer();
  }

  /**
   * Inicializa el reproductor de Video.js con las propiedades actuales
   */
  private initPlayer() {
    if (!this.videoTarget) return;

    const options = {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'auto',
      sources: [{
        src: this.props.url || '',
        // Detecta si es HLS (.m3u8) o un archivo de video estándar
        type: this.getStreamType(this.props.url)
      }]
    };

    // Inicializar Video.js
    this.player = videojs(this.videoTarget.nativeElement, options, () => {
      console.log('Video.js Player Inicializado correctamente');
    });
  }

  /**
   * Actualiza la URL y notifica al Builder
   */
  updateUrl(newUrl: string) {
    // Notificar al servicio Builder para persistencia en BD
    this.actualizarProps.emit({ ...this.props, url: newUrl });

    // Actualizar la fuente del reproductor en tiempo real
    if (this.player) {
      this.player.src({
        src: newUrl,
        type: this.getStreamType(newUrl)
      });
      this.player.load();
    }
  }

  /**
   * Determina el tipo de contenido basado en la extensión de la URL
   */
  private getStreamType(url: string): string {
    if (!url) return 'video/mp4';
    return url.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
  }

  /**
   * Limpieza de memoria al destruir el componente
   */
  ngOnDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  }
}