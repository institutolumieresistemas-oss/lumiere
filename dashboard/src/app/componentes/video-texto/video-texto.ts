import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PagesService } from '../../servicios/page';

@Component({
  selector: 'app-video-texto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-texto.html',
  styleUrls: ['./video-texto.css']
})
export class VideoTexto implements OnInit, OnChanges {
  @Input() props!: {
    titulo: string;
    descripcion: string;
    youtubeUrl: string;
    videoDerecha: boolean;
    botonTexto?: string;
    botonLinkType?: 'url' | 'page';
    botonEnlace?: string;
    botonPageSlug?: string;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  safeUrl: SafeResourceUrl | null = null;
  propsEdit: any = {};
  pagesList: any[] = [];

  private pagesService = inject(PagesService);

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (!this.props) {
      this.props = this.getDefaultProps();
    }
    this.updateSafeUrl();
    this.pagesService.mostrar().subscribe((res: any) => {
      this.pagesList = res.data || res;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['props']) {
      this.updateSafeUrl();
    }
  }

  updateSafeUrl() {
    if (!this.props?.youtubeUrl) {
      this.safeUrl = null;
      return;
    }
    const videoId = this.extractYoutubeId(this.props.youtubeUrl);
    if (!videoId) {
      this.safeUrl = null;
      return;
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  private extractYoutubeId(url: string): string {
    // watch?v=ID
    let m = url.match(/[?&]v=([^&#]{11})/);
    if (m) return m[1];
    // youtu.be/ID
    m = url.match(/youtu\.be\/([^?&#]{11})/);
    if (m) return m[1];
    // /live/ID  — YouTube Live
    m = url.match(/\/live\/([^?&#]{11})/);
    if (m) return m[1];
    // /shorts/ID
    m = url.match(/\/shorts\/([^?&#]{11})/);
    if (m) return m[1];
    // /embed/ID
    m = url.match(/\/embed\/([^?&#]{11})/);
    if (m) return m[1];
    // Si es directamente un ID de 11 chars
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    return '';
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
    this.updateSafeUrl();
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  private getDefaultProps() {
    return {
      titulo: 'Título de la Sección',
      descripcion: 'Esta es una breve descripción del video donde puedes explicar de qué trata o agregar información complementaria relevante.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoDerecha: false,
      botonTexto: 'MÁS INFORMACIÓN',
      botonLinkType: 'url' as const,
      botonEnlace: '',
      botonPageSlug: ''
    };
  }
}
