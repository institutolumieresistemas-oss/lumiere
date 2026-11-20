import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-video-texto',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
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

  safeUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (!this.props) {
      this.props = this.getDefaultProps();
    }
    this.updateSafeUrl();
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

  private getDefaultProps() {
    return {
      titulo: 'Título de la Sección',
      descripcion: 'Esta es una breve descripción del video donde puedes explicar de qué trata o agregar información complementaria relevante.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoDerecha: false,
      botonTexto: 'MÁS INFORMACIÓN',
      botonEnlace: ''
    };
  }
}
