import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DocumentoPdf {
  titulo: string;
  descripcion: string;
  pdfUrl: string;
}

@Component({
  selector: 'app-documentos-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documentos-pdf.html',
  styleUrls: ['./documentos-pdf.css']
})
export class DocumentosPdf implements OnInit {
  @Input() props!: {
    documentos: DocumentoPdf[];
    columnas?: number;
    tituloSeccion?: string;
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  tempProps: any = {};

  ngOnInit() {
    if (!this.props) {
      this.props = { documentos: [] };
    }
    if (!this.props.documentos) {
      this.props.documentos = [];
    }
  }

  abrirConfig() {
    this.tempProps = JSON.parse(JSON.stringify(this.props));
    if (!this.tempProps.documentos) this.tempProps.documentos = [];
    if (!this.tempProps.columnas) this.tempProps.columnas = 3;
    if (!this.tempProps.tituloSeccion) this.tempProps.tituloSeccion = 'Materiales y Guías de Estudio';
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.tempProps };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  agregarDocumento() {
    this.tempProps.documentos.push({
      titulo: 'Nuevo Documento PDF',
      descripcion: 'Breve descripción del archivo PDF.',
      pdfUrl: ''
    });
  }

  eliminarDocumento(index: number) {
    this.tempProps.documentos.splice(index, 1);
  }

  seleccionarPdf(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.tempProps.documentos[index].pdfUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  verPdf(url: string) {
    if (!url) {
      alert('Aún no se ha cargado ningún archivo PDF.');
      return;
    }
    // Abrir directamente en una nueva pestaña
    window.open(url, '_blank');
  }

  trackByFn(index: number) {
    return index;
  }
}
