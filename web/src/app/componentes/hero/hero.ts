import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class Hero {
  @Input() badge = '¡Convocatoria Abierta!';
  @Input() titleStart = 'Asegura tu lugar en la';
  @Input() titleHighlight = 'Universidad de Guadalajara';
  @Input() titleMiddle = 'con el mejor';
  @Input() titleCircle = 'Curso PAA';
  @Input() description = 'Te preparamos con exámenes de simulación reales, asesorías personalizadas con profesores del más alto nivel y el método de estudio más efectivo de la ZMG.';
  
  @Input() stats = [
    { value: '94.6%', label: 'De Aprobación', tag: '¡Súper alto! 📈' },
    { value: '+15k', label: 'Alumnos Admitidos' },
    { value: '+35 pts', label: 'Promedio de Incremento' }
  ];

  @Input() stickyNoteTitle = '¡Ojo! 📝';
  @Input() stickyNoteText = 'El examen PAA es por tiempo. ¡Te enseñamos a contestar en segundos!';

  @Input() floatingTitle = '¡Inscripciones Abiertas!';
  @Input() floatingSubtitle = 'Siguientes Calendarios 2026B y 2027A';
  @Input() floatingAvatar = 'UDG';

  @Input() heroImage = 'assets/hero.jpg';

  @Input() btn1Text = 'Explorar Cursos';
  @Input() btn1LinkType: 'url' | 'page' = 'url';
  @Input() btn1Url = '';
  @Input() btn1PageSlug = '';
  @Input() btn2Text = 'Calcular Mi Puntaje';
  @Input() btn2LinkType: 'url' | 'page' = 'url';
  @Input() btn2Url = '';
  @Input() btn2PageSlug = '';
}
