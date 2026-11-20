import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulador.html',
  styleUrls: ['./simulador.css']
})
export class Simulador {
  @Input() props!: {
    title: string;
    subtitle: string;
    tipsPool?: Array<{ title: string; text: string; color: string }>;
  };
  
  prepaScore: number | null = null;
  examScore: number | null = null;
  finalScore: number | null = null;
  careerSuggestion = '';
  showResult = false;

  // Hack board state
  showHack = false;
  currentTipIndex = 0;
  
  defaultTips = [
    {
      title: '¡Hack de Mate! 📐⚡',
      text: '¡No te claves resolviendo todo el procedimiento! En la PAA de la UDG, muchas veces puedes estimar el resultado o sustituir las opciones directo en la pregunta. ¡Así respondes en 10 segundos!',
      color: 'sticky-yellow'
    },
    {
      title: '¡Hack de Vida o Muerte! 💀🎖️',
      text: 'Recuerda: Tu promedio de la prepa vale el 50% y tu examen el otro 50%. Si saliste con promedio bajo, ¡necesitas romperla en la PAA sí o sí para compensar!',
      color: 'sticky-pink'
    },
    {
      title: '¡Speedrun de Lectura! 📚💨',
      text: 'Lee las preguntas ANTES de aventarte todo el texto largo. Así sabrás exactamente qué buscar y no perderás tiempo leyendo paja.',
      color: 'sticky-blue'
    }
  ];

  get tips() {
    return this.props.tipsPool && this.props.tipsPool.length > 0 
      ? this.props.tipsPool 
      : this.defaultTips;
  }

  calcular() {
    if (this.prepaScore === null || this.examScore === null) return;
    
    const prepa = this.prepaScore;
    const exam = this.examScore;

    if (prepa < 60 || prepa > 100 || exam < 0 || exam > 100) {
      alert('Por favor introduce calificaciones válidas. Promedio Prepa (60-100) y Examen PAA (0-100).');
      return;
    }

    this.finalScore = prepa + exam;
    this.showResult = true;

    if (this.finalScore >= 180) {
      this.careerSuggestion = 'Excelente puntaje. Estás listo para carreras de alta demanda como Medicina (CUCS) o Ingeniería en Computación (CUCEI).';
    } else if (this.finalScore >= 160) {
      this.careerSuggestion = 'Muy buen puntaje. Tienes altas probabilidades para carreras como Derecho, Administración, o Psicología.';
    } else if (this.finalScore >= 140) {
      this.careerSuggestion = 'Puntaje competitivo. Estás en rango para la mayoría de las licenciaturas. ¡Sigue preparándote para asegurar tu lugar!';
    } else {
      this.careerSuggestion = 'Con este puntaje podrías ingresar a algunas carreras, pero te recomendamos intensificar tu preparación para subir tus opciones en carreras de media-alta demanda.';
    }
  }

  showRandomTip() {
    this.currentTipIndex = Math.floor(Math.random() * this.tips.length);
    this.showHack = true;
  }
}
