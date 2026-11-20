import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocumentoPdf {
  titulo: string;
  descripcion: string;
  pdfUrl: string;
}

@Component({
  selector: 'app-documentos-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentos-pdf.html',
  styleUrls: ['./documentos-pdf.css']
})
export class DocumentosPdf implements OnInit {
  @Input() props!: {
    documentos: DocumentoPdf[];
    columnas?: number;
    tituloSeccion?: string;
  };

  ngOnInit() {
    if (!this.props) {
      this.props = { documentos: [] };
    }
    if (!this.props.documentos) {
      this.props.documentos = [];
    }
  }

  verPdf(url: string) {
    if (!url) {
      alert('Aún no se ha cargado ningún archivo PDF.');
      return;
    }
    // Abrir directamente en una nueva pestaña
    window.open(url, '_blank');
  }
}
