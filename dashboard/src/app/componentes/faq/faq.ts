import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.html',
  styleUrls: ['./faq.css']
})
export class FAQ implements OnInit {

  @Input() props!: {
    layout?: 'notebook' | 'chat' | 'discord';
    faqs: { pregunta: string; respuesta: string }[];
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  abierto: number | null = null;
  abrirConfigModal = false;

  // temporal para editar
  faqsTemp: { pregunta: string; respuesta: string }[] = [];
  layoutTemp: 'notebook' | 'chat' | 'discord' = 'notebook';

  faqReactions: { [key: number]: { [emoji: string]: number } } = {};

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

  ngOnInit() {
    if (!this.props) {
      this.props = {
        layout: 'notebook',
        faqs: [...this.defaultFaqs]
      };
    }
    if (!this.props.layout) {
      this.props.layout = 'notebook';
    }
    if (!this.props.faqs || this.props.faqs.length === 0) {
      this.props.faqs = [...this.defaultFaqs];
    }
  }

  toggle(i: number) {
    this.abierto = this.abierto === i ? null : i;
  }

  openModal() {
    this.faqsTemp = JSON.parse(JSON.stringify(this.props.faqs || this.defaultFaqs));
    this.layoutTemp = this.props.layout || 'notebook';
    this.abrirConfigModal = true;
  }

  closeModal() {
    this.abrirConfigModal = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  agregarFaq() {
    this.faqsTemp.push({
      pregunta: 'Nueva pregunta',
      respuesta: 'Nueva respuesta'
    });
  }

  eliminarFaq(index: number) {
    this.faqsTemp.splice(index, 1);
  }

  guardar() {
    const updated = {
      layout: this.layoutTemp,
      faqs: [...this.faqsTemp]
    };
    this.props = updated;
    this.actualizarProps.emit(updated);
    this.abrirConfigModal = false;
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
        '🔥': 12,
        '🤯': 6,
        '🙌': 15
      };
    }
    return this.faqReactions[faqIdx];
  }
}