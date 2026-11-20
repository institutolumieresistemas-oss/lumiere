import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datos-planteles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datos-planteles.html',
  styleUrls: ['./datos-planteles.css'],
})
export class DatosPlanteles {

  planteles: any[] = [
    {
      nombre: 'Plantel Centro',
      color: '#62A8FF',
      mapaUrl: 'https://www.google.com/maps/embed?...',
      telefono: '555-123-4567',
      celular: '55-7777-8888',
      whatsapp: 'https://wa.me/5277778888'
    },
    {
      nombre: 'Plantel Norte',
      color: '#8AD6A5',
      mapaUrl: 'https://www.google.com/maps/embed?...',
      telefono: '556-222-3333',
      celular: '55-9999-0000',
      whatsapp: 'https://wa.me/5299990000'
    },
    {
      nombre: 'Plantel Sur',
      color: '#FFB870',
      mapaUrl: 'https://www.google.com/maps/embed?...',
      telefono: '557-444-5555',
      celular: '55-1111-2222',
      whatsapp: 'https://wa.me/5211112222'
    }
  ];

  seleccionado = this.planteles[0];

  seleccionarPlantel(i: number) {
    this.seleccionado = this.planteles[i];

    // Activar animación de fade-slide
    const card = document.querySelector('.card-plantel') as HTMLElement;
    if (card) {
      card.classList.remove('animar');
      void card.offsetWidth; // fuerza reflow
      card.classList.add('animar');
    }
  }
}
