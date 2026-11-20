import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pregunta {
  id: number;
  materia: 'espanol' | 'matematicas';
  texto: string;
  opciones: string[];
  respuestaCorrecta: number;
}

@Component({
  selector: 'app-examen-gratis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examen-gratis.html',
  styleUrls: ['./examen-gratis.css']
})
export class ExamenGratis implements OnInit {

  @Input() props: any = {};

  fase: 'inicio' | 'examen' | 'resultado' = 'inicio';
  materiaActual: 'espanol' | 'matematicas' = 'espanol';
  preguntaActualIndex = 0;
  respuestasUsuario: (number | null)[] = [];
  mostrandoFeedback = false;
  ultimaRespuestaCorrecta = false;

  preguntas: Pregunta[] = [
    // ESPAÑOL
    {
      id: 1, materia: 'espanol',
      texto: '¿Cuál es el sinónimo de "efímero"?',
      opciones: ['Eterno', 'Pasajero', 'Duradero', 'Permanente'],
      respuestaCorrecta: 1
    },
    {
      id: 2, materia: 'espanol',
      texto: 'Identifica el tipo de oración: "El perro ladra fuerte."',
      opciones: ['Interrogativa', 'Imperativa', 'Declarativa', 'Exclamativa'],
      respuestaCorrecta: 2
    },
    {
      id: 3, materia: 'espanol',
      texto: '¿Cuál es el antónimo de "tacaño"?',
      opciones: ['Generoso', 'Avaro', 'Mezquino', 'Miserable'],
      respuestaCorrecta: 0
    },
    {
      id: 4, materia: 'espanol',
      texto: '¿Cuál de las siguientes palabras está escrita correctamente?',
      opciones: ['Excelente', 'Exelente', 'Exzalente', 'Eccelente'],
      respuestaCorrecta: 0
    },
    {
      id: 5, materia: 'espanol',
      texto: 'En la oración "María compró flores", ¿cuál es el sujeto?',
      opciones: ['compró', 'flores', 'María', 'compró flores'],
      respuestaCorrecta: 2
    },
    {
      id: 6, materia: 'espanol',
      texto: '¿Qué figura retórica usa "el sol sonríe"?',
      opciones: ['Metáfora', 'Personificación', 'Hipérbole', 'Símil'],
      respuestaCorrecta: 1
    },
    {
      id: 7, materia: 'espanol',
      texto: '¿Cuál de los siguientes es un sustantivo abstracto?',
      opciones: ['Mesa', 'Felicidad', 'Perro', 'Casa'],
      respuestaCorrecta: 1
    },
    {
      id: 8, materia: 'espanol',
      texto: 'El plural de "crisis" es:',
      opciones: ['Crisises', 'Las crisis', 'Crises', 'Crisi'],
      respuestaCorrecta: 1
    },
    {
      id: 9, materia: 'espanol',
      texto: '¿Cuál es el verbo en infinitivo de "Ellos corrieron"?',
      opciones: ['Corriendo', 'Correr', 'Corrido', 'Corro'],
      respuestaCorrecta: 1
    },
    {
      id: 10, materia: 'espanol',
      texto: '¿Qué tipo de texto es una receta de cocina?',
      opciones: ['Narrativo', 'Descriptivo', 'Instructivo', 'Argumentativo'],
      respuestaCorrecta: 2
    },
    {
      id: 11, materia: 'espanol',
      texto: '¿Cuál de las siguientes palabras tiene tilde?',
      opciones: ['Casa', 'Camión', 'Libro', 'Puerta'],
      respuestaCorrecta: 1
    },
    {
      id: 12, materia: 'espanol',
      texto: '¿Cuál es el sujeto de "Los estudiantes estudiaron mucho"?',
      opciones: ['estudiaron', 'mucho', 'Los estudiantes', 'estudiantes'],
      respuestaCorrecta: 2
    },
    {
      id: 13, materia: 'espanol',
      texto: '"No vine porque tenía sueño." ¿Qué tipo de oración compuesta es?',
      opciones: ['Coordinada', 'Subordinada causal', 'Yuxtapuesta', 'Subordinada adjetiva'],
      respuestaCorrecta: 1
    },
    {
      id: 14, materia: 'espanol',
      texto: '¿Cuál es el adjetivo en "El carro rojo es nuevo"?',
      opciones: ['El', 'carro', 'rojo', 'es'],
      respuestaCorrecta: 2
    },
    {
      id: 15, materia: 'espanol',
      texto: '¿Qué significa "dilema"?',
      opciones: ['Una certeza absoluta', 'Un problema con dos opciones difíciles', 'Una solución fácil', 'Una pregunta simple'],
      respuestaCorrecta: 1
    },
    // MATEMÁTICAS
    {
      id: 16, materia: 'matematicas',
      texto: '¿Cuánto es 15% de 200?',
      opciones: ['20', '30', '25', '35'],
      respuestaCorrecta: 1
    },
    {
      id: 17, materia: 'matematicas',
      texto: 'Si x + 5 = 12, ¿cuánto vale x?',
      opciones: ['6', '7', '8', '17'],
      respuestaCorrecta: 1
    },
    {
      id: 18, materia: 'matematicas',
      texto: '¿Cuál es el resultado de 3² + 4²?',
      opciones: ['25', '49', '14', '12'],
      respuestaCorrecta: 0
    },
    {
      id: 19, materia: 'matematicas',
      texto: 'Un rectángulo tiene base 8 cm y altura 5 cm. ¿Cuál es su área?',
      opciones: ['13 cm²', '26 cm²', '40 cm²', '80 cm²'],
      respuestaCorrecta: 2
    },
    {
      id: 20, materia: 'matematicas',
      texto: '¿Cuál es el mínimo común múltiplo de 4 y 6?',
      opciones: ['8', '12', '24', '6'],
      respuestaCorrecta: 1
    },
    {
      id: 21, materia: 'matematicas',
      texto: 'Simplifica la fracción 18/24:',
      opciones: ['3/4', '6/8', '9/12', '2/3'],
      respuestaCorrecta: 0
    },
    {
      id: 22, materia: 'matematicas',
      texto: '¿Cuánto es (-3) × (-4)?',
      opciones: ['-12', '12', '-7', '7'],
      respuestaCorrecta: 1
    },
    {
      id: 23, materia: 'matematicas',
      texto: 'Un artículo cuesta $150 y tiene 20% de descuento. ¿Cuánto cuesta?',
      opciones: ['$110', '$120', '$130', '$140'],
      respuestaCorrecta: 1
    },
    {
      id: 24, materia: 'matematicas',
      texto: '¿Cuál es la raíz cuadrada de 144?',
      opciones: ['11', '12', '13', '14'],
      respuestaCorrecta: 1
    },
    {
      id: 25, materia: 'matematicas',
      texto: 'Resuelve: 2x - 3 = 7',
      opciones: ['x = 2', 'x = 5', 'x = 4', 'x = 3'],
      respuestaCorrecta: 1
    },
    {
      id: 26, materia: 'matematicas',
      texto: '¿Cuántos lados tiene un hexágono?',
      opciones: ['5', '7', '6', '8'],
      respuestaCorrecta: 2
    },
    {
      id: 27, materia: 'matematicas',
      texto: 'Un tren recorre 120 km en 2 horas. ¿Cuál es su velocidad media?',
      opciones: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
      respuestaCorrecta: 1
    },
    {
      id: 28, materia: 'matematicas',
      texto: '¿Qué número sigue en la secuencia: 2, 4, 8, 16, ___?',
      opciones: ['24', '30', '32', '64'],
      respuestaCorrecta: 2
    },
    {
      id: 29, materia: 'matematicas',
      texto: 'El perímetro de un cuadrado con lado 7 cm es:',
      opciones: ['21 cm', '28 cm', '49 cm', '14 cm'],
      respuestaCorrecta: 1
    },
    {
      id: 30, materia: 'matematicas',
      texto: '¿Cuánto es 2/3 + 1/4?',
      opciones: ['3/7', '11/12', '8/12', '3/12'],
      respuestaCorrecta: 1
    }
  ];

  get preguntasEspanol() { return this.preguntas.filter(p => p.materia === 'espanol'); }
  get preguntasMatematicas() { return this.preguntas.filter(p => p.materia === 'matematicas'); }
  get preguntasActuales() { return this.preguntas.filter(p => p.materia === this.materiaActual); }
  get preguntaActual(): Pregunta { return this.preguntasActuales[this.preguntaActualIndex]; }

  get progresoTotal() {
    const respondidas = this.respuestasUsuario.filter(r => r !== null).length;
    return Math.round((respondidas / this.preguntas.length) * 100);
  }

  get aciertosEspanol() {
    return this.preguntasEspanol.filter((p, i) => this.respuestasUsuario[i] === p.respuestaCorrecta).length;
  }

  get aciertosMatematicas() {
    return this.preguntasMatematicas.filter((p, i) => this.respuestasUsuario[15 + i] === p.respuestaCorrecta).length;
  }

  get totalAciertos() { return this.aciertosEspanol + this.aciertosMatematicas; }
  get calificacion() { return Math.round((this.totalAciertos / 30) * 100); }

  get nivel(): { texto: string; emoji: string; color: string; descripcion: string } {
    const cal = this.calificacion;
    if (cal >= 80) return { texto: 'Excelente', emoji: '🏆', color: '#16a34a', descripcion: '¡Tienes bases muy sólidas para tu examen!' };
    if (cal >= 60) return { texto: 'Bueno', emoji: '💪', color: '#d97706', descripcion: 'Vas bien, con un poco más de repaso estarás listo.' };
    if (cal >= 40) return { texto: 'Regular', emoji: '📚', color: '#dc2626', descripcion: 'Necesitas reforzar algunos temas, ¡nosotros te ayudamos!' };
    return { texto: 'Inicio', emoji: '🚀', color: '#7c3aed', descripcion: '¡Empecemos juntos! Nuestros cursos son perfectos para ti.' };
  }

  get indexGlobalActual() {
    return this.materiaActual === 'espanol' ? this.preguntaActualIndex : 15 + this.preguntaActualIndex;
  }

  ngOnInit() {}

  iniciarExamen() {
    this.fase = 'examen';
    this.materiaActual = 'espanol';
    this.preguntaActualIndex = 0;
    this.respuestasUsuario = new Array(30).fill(null);
    this.mostrandoFeedback = false;
  }

  responder(opcionIndex: number) {
    if (this.mostrandoFeedback) return;
    this.respuestasUsuario[this.indexGlobalActual] = opcionIndex;
    this.ultimaRespuestaCorrecta = opcionIndex === this.preguntaActual.respuestaCorrecta;
    this.mostrandoFeedback = true;
    setTimeout(() => {
      this.mostrandoFeedback = false;
      this.avanzar();
    }, 1200);
  }

  avanzar() {
    const total = this.preguntasActuales.length;
    if (this.preguntaActualIndex < total - 1) {
      this.preguntaActualIndex++;
    } else if (this.materiaActual === 'espanol') {
      this.materiaActual = 'matematicas';
      this.preguntaActualIndex = 0;
    } else {
      this.fase = 'resultado';
    }
  }

  getRespuestaUsuario(): number | null { return this.respuestasUsuario[this.indexGlobalActual]; }
  esOpcionCorrecta(idx: number): boolean { return idx === this.preguntaActual.respuestaCorrecta; }
  esOpcionSeleccionada(idx: number): boolean { return this.getRespuestaUsuario() === idx; }

  reiniciar() {
    this.fase = 'inicio';
    this.respuestasUsuario = [];
    this.preguntaActualIndex = 0;
    this.materiaActual = 'espanol';
  }

  letras = ['A', 'B', 'C', 'D'];
}
