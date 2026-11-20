import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule, RouterLink } from '@angular/router';

interface CategoriaCuadro {
  imagen: string;
  tipoEnlace?: 'externa' | 'interna';
  enlace?: string;
  linkPageSlug?: string;
  etiqueta?: string;
  colorSplash?: string;
  inclinacion?: number;
}

interface CategoriasProps {
  titulo: string;
  diseno: 'original' | 'stickerbook' | 'polaroid' | 'notepad';
  subtitulo?: string;
  subtituloResaltado?: string;
  colorResalte?: string;
  cuadros: CategoriaCuadro[];
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class Categorias implements OnInit {

  private sanitizer = inject(DomSanitizer);

  @Input() props: CategoriasProps = {
    titulo: 'CONOCE NUESTROS CURSOS',
    diseno: 'original',
    cuadros: []
  };

  ngOnInit() {
    if (!this.props.cuadros || this.props.cuadros.length === 0) {
      this.props = {
        titulo: this.props.titulo || 'CONOCE NUESTROS CURSOS',
        diseno: 'original',
        cuadros: [
          { imagen: 'https://picsum.photos/250/150?random=1', tipoEnlace: 'externa', enlace: '' },
          { imagen: 'https://picsum.photos/250/150?random=2', tipoEnlace: 'externa', enlace: '' }
        ]
      };
    }
  }

  getCleanSlug(enlace: string | undefined): string {
    if (!enlace) return '';
    return enlace.replace(/^[\/]+/, '');
  }

  getSubtituloHtml(): SafeHtml {
    if (!this.props.subtitulo) return '';
    const texto = this.props.subtitulo;
    const resaltado = this.props.subtituloResaltado;
    const color = this.props.colorResalte || '#fef08a';

    if (!resaltado || !texto.includes(resaltado)) {
      return this.sanitizer.bypassSecurityTrustHtml(texto);
    }

    const html = texto.replace(
      resaltado,
      `<span class="subtitulo-highlight" style="--highlight-color:${color}">${resaltado}</span>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
