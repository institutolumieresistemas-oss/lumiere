import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonios.html',
  styleUrls: ['./testimonios.css']
})
export class Testimonios {

  @Input() props!: {
    titulo: string;
    layout?: 'classic' | 'chat' | 'notebook' | 'report';
    testimonios: {
      nombre: string;
      texto: string;
      imagen: string;
      calificacion: number;
    }[];
  };

}
