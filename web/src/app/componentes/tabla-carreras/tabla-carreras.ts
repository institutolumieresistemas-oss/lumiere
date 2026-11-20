import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CarreraItem {
  carrera: string;
  puntaje: string;
  cupos: string;
  aspirantes: string;
  calendario: string;
}

@Component({
  selector: 'app-tabla-carreras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabla-carreras.html',
  styleUrls: ['./tabla-carreras.css']
})
export class TablaCarreras implements OnInit {
  @Input() props!: {
    centroUniversitario: string;
    titulo?: string;
    colorFondo?: string;
    colorLetra?: string;
    carreras: CarreraItem[];
  };

  ngOnInit() {
    if (!this.props.carreras) {
      this.props.carreras = [];
    }
  }
}
