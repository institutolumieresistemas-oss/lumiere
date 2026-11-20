import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BanorteService } from '../../servicios/banorte.service';

export interface CursoProps {
  id?: number | string;
  idAltacurso?: string;
  titulo: string;
  imagen: string;
  modalidad: string;
  duracion?: string;
  duracionSemanas?: number;
  descuento?: number;
  precio: number;
  precioLista?: number;
  precioPromo: number;
  ahorro: number;
  semanas?: number;
  limiteLiquidar: string;
  textoLiquidar: string;
  textoMeses: string;
  horas?: number;
  simulacros?: string;
  inicio?: string;
  termina?: string;
  apartado?: number;
  urlComprar?: string;
  urlApartar?: string;
  horarios?: string[];
}

@Component({
  selector: 'app-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso.html',
  styleUrls: ['./curso.css']
})
export class Curso {
  // Datos dinámicos usando Angular 17+ signal inputs
  data = input.required<CursoProps>();
  mostrarHorarios = signal(false);

  constructor(private banorteService: BanorteService) {}

  pagar(tipo: 'comprar' | 'apartar') {
    const d = this.data();
    const monto = tipo === 'comprar'
      ? (d.precioPromo || d.precio || d.precioLista || 0)
      : (d.apartado || 1000);

    this.banorteService.solicitarPago({
      curso: d.titulo,
      modalidad: d.modalidad,
      tipo,
      monto,
      concepto: `${tipo === 'comprar' ? 'Inscripción' : 'Apartado'} Curso ${d.titulo} (${d.modalidad})`,
      idAltaCurso: d.idAltacurso || d.id,
      imagen: d.imagen
    });
  }

  toggleHorarios() {
    this.mostrarHorarios.update(v => !v);
  }


  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const cleaned = dateStr.trim();

    // 1. Try matching standard YYYY-MM-DD
    const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})/;
    const matchYMD = cleaned.match(yyyymmddRegex);
    if (matchYMD) {
      const monthNum = parseInt(matchYMD[2], 10);
      const dayNum = parseInt(matchYMD[3], 10);
      const dayStr = dayNum.toString().padStart(2, '0');
      const monthName = meses[monthNum - 1] || '';
      return `${dayStr} de ${monthName}`;
    }

    // 2. Try matching DD/MM/YYYY or DD-MM-YYYY
    const ddSplitsRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const matchDMY = cleaned.match(ddSplitsRegex);
    if (matchDMY) {
      const dayNum = parseInt(matchDMY[1], 10);
      const monthNum = parseInt(matchDMY[2], 10);
      const dayStr = dayNum.toString().padStart(2, '0');
      const monthName = meses[monthNum - 1] || '';
      return `${dayStr} de ${monthName}`;
    }

    // 3. Try matching text formats like "31 de Enero 2026" or "15 de Febrero"
    const textRegex = /^(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)/i;
    const matchText = cleaned.match(textRegex);
    if (matchText) {
      const dayNum = parseInt(matchText[1], 10);
      const dayStr = dayNum.toString().padStart(2, '0');
      const monthInput = matchText[2].toLowerCase();
      return `${dayStr} de ${monthInput}`;
    }

    return dateStr;
  }
}
