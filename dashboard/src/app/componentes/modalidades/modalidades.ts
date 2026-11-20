import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagesService } from '../../servicios/page';

interface ModalidadItem {
  imagen: string;
  titulo: string;
  colorTexto: string;
  colorFondo: string;
  btnColor: string;
  btnColorTexto: string;
  btnTexto: string;
  enlace: string;
  tipoEnlace?: 'interna' | 'externa';
}

@Component({
  selector: 'app-modalidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modalidades.html',
  styleUrls: ['./modalidades.css']
})
export class Modalidades implements OnInit {

  private pagesService = inject(PagesService);

  @Input() props: {
    titulo: string;
    subtitulo: string;
    detalle: string;
    modalidades: ModalidadItem[];
  } = {
    titulo: 'SELECCIONA UNA MODALIDAD:',
    subtitulo: 'CURSOS 2027A',
    detalle: 'Examen Admisión UDG: NOVIEMBRE 2026',
    modalidades: []
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  abrirConfig = false;
  propsTemp: any = {};
  paginas: any[] = [];

  // Paleta de colores premium suaves
  paletaColores = [
    '#93c5fd', // Azul suave
    '#fcd34d', // Naranja/Amarillo suave
    '#e9d5ff', // Púrpura suave
    '#99f6e4', // Menta/Teal suave
    '#fbcfe8', // Rosa suave
    '#a7f3d0', // Verde suave
    '#fed7aa', // Naranja pastel
    '#ffffff', // Blanco
    '#f8fafc'  // Gris muy claro
  ];

  ngOnInit() {
    this.cargarPaginas();

    if (!this.props.modalidades || this.props.modalidades.length === 0) {
      this.props = {
        titulo: this.props.titulo || 'SELECCIONA UNA MODALIDAD:',
        subtitulo: this.props.subtitulo || 'CURSOS 2027A',
        detalle: this.props.detalle || 'Examen Admisión UDG: NOVIEMBRE 2026',
        modalidades: [
          {
            imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-easel" viewBox="0 0 16 16"><path d="M8 0a.5.5 0 0 1 .473.337L9.046 2H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1.85l1.323 3.837a.5.5 0 1 1-.946.326L11.092 11H4.908l-1.435 4.163a.5.5 0 1 1-.946-.326L3.85 11H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4.954L7.527.337A.5.5 0 0 1 8 0M2 3v7h12V3z"/></svg>',
            titulo: 'Modalidad Presencial',
            colorTexto: '#07004d',
            colorFondo: '#93c5fd',
            btnColor: '#fb923c',
            btnColorTexto: '#ffffff',
            btnTexto: 'MÁS INFORMACIÓN',
            enlace: 'https://google.com',
            tipoEnlace: 'externa'
          },
          {
            imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-camera-video" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v3.06l2.67-1.6a1 1 0 0 1 1.485.867v4.347a1 1 0 0 1-1.485.867L11.5 10.94V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm11.5 5.16 2.5 1.5V5.34l-2.5 1.5zm-1.5-5.16H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1"/></svg>',
            titulo: 'Modalidad Vía ZOOM',
            colorTexto: '#07004d',
            colorFondo: '#fcd34d',
            btnColor: '#fb923c',
            btnColorTexto: '#ffffff',
            btnTexto: 'MÁS INFORMACIÓN',
            enlace: 'https://google.com',
            tipoEnlace: 'externa'
          },
          {
            imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-laptop" viewBox="0 0 16 16"><path d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2zM0 12.5h16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5"/></svg>',
            titulo: 'Modalidad a tu Ritmo',
            colorTexto: '#07004d',
            colorFondo: '#e9d5ff',
            btnColor: '#fb923c',
            btnColorTexto: '#ffffff',
            btnTexto: 'MÁS INFORMACIÓN',
            enlace: 'https://google.com',
            tipoEnlace: 'externa'
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

  openConfigModal() {
    this.propsTemp = JSON.parse(JSON.stringify(this.props));
    this.propsTemp.modalidades.forEach((m: any) => {
      if (!m.tipoEnlace) {
        m.tipoEnlace = 'externa';
      }
    });
    this.abrirConfig = true;
  }

  closeConfigModal() {
    this.abrirConfig = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  agregarModalidad() {
    if (this.propsTemp.modalidades.length >= 6) {
      alert('Se permite un máximo de 6 recuadros/modalidades.');
      return;
    }
    this.propsTemp.modalidades.push({
      imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-plus-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>',
      titulo: 'Nueva Modalidad',
      colorTexto: '#1e293b',
      colorFondo: '#99f6e4',
      btnColor: '#fb923c',
      btnColorTexto: '#ffffff',
      btnTexto: 'MÁS INFORMACIÓN',
      enlace: '',
      tipoEnlace: 'externa'
    });
  }

  eliminarModalidad(index: number) {
    this.propsTemp.modalidades.splice(index, 1);
  }

  onImageUpload(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.propsTemp.modalidades[index].imagen = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardar() {
    this.props = { ...this.propsTemp };
    this.actualizarProps.emit(this.props);
    this.abrirConfig = false;
  }
}
