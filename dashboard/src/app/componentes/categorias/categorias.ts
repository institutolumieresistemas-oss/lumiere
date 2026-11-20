import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PagesService } from '../../servicios/page';

export interface CategoriaCuadro {
  imagen: string;
  tipoEnlace?: 'interna' | 'externa';
  enlace?: string;
  etiqueta?: string;
  colorSplash?: string; // Usado para el marcador/resaltador en notepad
  inclinacion?: number; // Rotación aleatoria simulada para stickerbook
}

export interface CategoriasProps {
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
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class Categorias implements OnInit {

  private pagesService = inject(PagesService);
  private sanitizer = inject(DomSanitizer);

  @Input() props: CategoriasProps = {
    titulo: 'CONOCE NUESTROS CURSOS',
    diseno: 'original',
    cuadros: []
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  abrirConfigModal = false;
  paginas: any[] = [];

  propsTemp: CategoriasProps = {
    titulo: '',
    diseno: 'original',
    cuadros: []
  };

  ngOnInit() {
    this.cargarPaginas();

    if (!this.props.cuadros || this.props.cuadros.length === 0) {
      this.props = {
        titulo: this.props.titulo || 'CONOCE NUESTROS CURSOS',
        diseno: 'original',
        subtitulo: 'Elige tu camino perfecto',
        subtituloResaltado: 'camino',
        colorResalte: '#fed7aa',
        cuadros: [
          {
            imagen: 'https://picsum.photos/250/150?random=1',
            tipoEnlace: 'externa',
            enlace: '',
            etiqueta: 'Preparatoria',
            colorSplash: '#fef08a', // Amarillo resaltador
            inclinacion: -2
          },
          {
            imagen: 'https://picsum.photos/250/150?random=2',
            tipoEnlace: 'externa',
            enlace: '',
            etiqueta: 'Licenciatura',
            colorSplash: '#fbcfe8', // Rosa resaltador
            inclinacion: 3
          },
          {
            imagen: 'https://picsum.photos/250/150?random=3',
            tipoEnlace: 'externa',
            enlace: '',
            etiqueta: 'Ingenierías',
            colorSplash: '#bbf7d0', // Verde resaltador
            inclinacion: -1
          },
          {
            imagen: 'https://picsum.photos/250/150?random=4',
            tipoEnlace: 'externa',
            enlace: '',
            etiqueta: 'Idiomas',
            colorSplash: '#bfdbfe', // Azul resaltador
            inclinacion: 2
          }
        ]
      };
      this.actualizarProps.emit(this.props);
    }
  }

  cargarPaginas() {
    this.pagesService.mostrar().subscribe({
      next: (res: any) => {
        this.paginas = res.data || res;
      },
      error: (err) => {
        console.error('Error al cargar páginas para enlace:', err);
      }
    });
  }

  getSubtituloHtml(): SafeHtml {
    if (!this.props.subtitulo) return '';
    const texto = this.props.subtitulo;
    const resaltado = this.props.subtituloResaltado;
    const color = this.props.colorResalte || '#fef08a';

    if (!resaltado || !texto.includes(resaltado)) {
      return this.sanitizer.bypassSecurityTrustHtml(texto);
    }

    // Estilo marcador resaltador para el subtítulo también
    const html = texto.replace(
      resaltado,
      `<span class="subtitulo-highlight" style="--highlight-color:${color}">${resaltado}</span>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onDisenoChange(nuevoDiseno: any) {
    this.props.diseno = nuevoDiseno;
    this.actualizarProps.emit(this.props);
  }

  openModal() {
    this.propsTemp = JSON.parse(JSON.stringify(this.props));
    if (!this.propsTemp.diseno) {
      this.propsTemp.diseno = 'original';
    }
    this.propsTemp.cuadros.forEach((c, idx) => {
      if (!c.tipoEnlace) c.tipoEnlace = 'externa';
      if (!c.colorSplash) c.colorSplash = '#fef08a';
      if (c.inclinacion === undefined) {
        // Asignar inclinaciones por defecto
        const angles = [-2, 3, -1, 2];
        c.inclinacion = angles[idx % angles.length];
      }
    });
    this.abrirConfigModal = true;
  }

  closeModal() {
    this.abrirConfigModal = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  agregarCuadro() {
    const angles = [-2, 3, -1, 2];
    const incl = angles[this.propsTemp.cuadros.length % angles.length];
    this.propsTemp.cuadros.push({
      imagen: 'https://picsum.photos/250/150?random=' + (this.propsTemp.cuadros.length + 10),
      tipoEnlace: 'externa',
      enlace: '',
      etiqueta: 'Nueva categoría',
      colorSplash: '#fef08a',
      inclinacion: incl
    });
  }

  eliminarCuadro(index: number) {
    this.propsTemp.cuadros.splice(index, 1);
  }

  onImageUpload(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.propsTemp.cuadros[index].imagen = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardar() {
    this.props = JSON.parse(JSON.stringify(this.propsTemp));
    this.actualizarProps.emit(this.props);
    this.abrirConfigModal = false;
  }
}
