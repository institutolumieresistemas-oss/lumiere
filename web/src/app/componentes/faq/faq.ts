import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrls: ['./faq.css'],
})
export class FAQ implements OnInit {

  @Input() props!: {
    layout?: 'notebook' | 'chat' | 'discord';
    faqs: { pregunta: string; respuesta: string }[];
  };

  faqs: { pregunta: string; respuesta: string }[] = [];
  layout: 'notebook' | 'chat' | 'discord' = 'notebook';

  defaultFaqs = [
    {
      pregunta: "¿Qué horarios de clase manejan para UDG?",
      respuesta: "Contamos con dos modalidades principales: Sabatino intensivo (9:00 AM a 2:00 PM) y Semanal por las tardes (4:00 PM a 7:00 PM). ¡Ideal para que no interfiera con tu prepa!"
    },
    {
      pregunta: "¿Cómo calculo si tengo posibilidades de entrar a Medicina o Ingenierías?",
      respuesta: "Recuerda que en UDG tu promedio de prepa vale el 50% y tu examen PAA el otro 50%. En nuestro Simulador arriba puedes proyectar tu puntaje mínimo y ver estadísticas reales."
    },
    {
      pregunta: "¿Qué pasa si no alcanzo el puntaje mínimo de mi carrera?",
      respuesta: "¡No te desanimes! Contamos con garantía de aprobación. Si por algún motivo no eres admitido, puedes recursar el siguiente ciclo con nosotros sin costo adicional."
    }
  ];

  faqReactions: { [key: number]: { [emoji: string]: number } } = {};

  ngOnInit() {
    this.layout = this.props?.layout || 'notebook';
    this.faqs = this.props?.faqs && this.props.faqs.length > 0 
      ? this.props.faqs 
      : this.defaultFaqs;
  }

  abierto: number | null = null;

  toggle(i: number) {
    this.abierto = this.abierto === i ? null : i;
  }

  getPostItColor(index: number): string {
    const colors = ['sticky-yellow', 'sticky-pink', 'sticky-blue', 'sticky-green', 'sticky-orange'];
    return colors[index % colors.length];
  }

  react(faqIdx: number, emoji: string) {
    if (!this.faqReactions[faqIdx]) {
      this.faqReactions[faqIdx] = { '🔥': 14, '🤯': 9, '🙌': 18 };
    }
    this.faqReactions[faqIdx][emoji]++;
  }

  getReactions(faqIdx: number) {
    if (!this.faqReactions[faqIdx]) {
      this.faqReactions[faqIdx] = {
        '🔥': Math.floor(Math.random() * 15) + 5,
        '🤯': Math.floor(Math.random() * 10) + 2,
        '🙌': Math.floor(Math.random() * 20) + 8
      };
    }
    return this.faqReactions[faqIdx];
  }
}
