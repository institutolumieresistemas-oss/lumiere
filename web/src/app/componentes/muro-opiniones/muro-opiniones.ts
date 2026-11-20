import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Opinion {
  id: string;
  autor: string;
  texto: string;
  color: string;
  foto?: string;
}

@Component({
  selector: 'app-muro-opiniones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './muro-opiniones.html',
  styleUrls: ['./muro-opiniones.css']
})
export class MuroOpiniones implements OnInit {
  @Input() props!: {
    title: string;
    subtitle: string;
    opiniones: Opinion[];
  };

  opinionesList: Opinion[] = [];
  
  // Form states
  showForm = false;
  showSuccess = false;
  folding = false;
  flying = false;
  
  newCommentText = '';
  newCommentAuthor = '';
  newCommentColor = 'sticky-yellow';
  photoStatus = '';
  uploadedPhotoBase64 = '';

  defaultOpiniones: Opinion[] = [
    {
      id: '1',
      autor: 'Mariana Ortega / Medicina (CUCS)',
      texto: '¡Gracias al curso subí 38 puntos en mi examen! Las asesorías de matemáticas son las mejores y los simulacros son idénticos al examen real.',
      color: 'sticky-yellow'
    },
    {
      id: '2',
      autor: 'Carlos Ruiz / Computación (CUCEI)',
      texto: 'Robert te enseña a contestar reactivos en segundos. No se necesita saber toda la teoría, solo los hacks clave. Recomiendo el curso al 100%.',
      color: 'sticky-pink'
    },
    {
      id: '3',
      autor: 'Sofia Mendoza / Derecho (CUCSH)',
      texto: 'Las técnicas de respiración de Carmen me salvaron. Estaba súper nerviosa antes del examen y logré calmarme. ¡Logré mi admisión!',
      color: 'sticky-blue'
    }
  ];

  ngOnInit() {
    this.opinionesList = this.props?.opiniones && this.props.opiniones.length > 0
      ? [...this.props.opiniones]
      : [...this.defaultOpiniones];
  }

  onPhotoUploaded(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.uploadedPhotoBase64 = e.target.result as string;
          this.photoStatus = 'Foto de perfil cargada con éxito ✅';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitComment() {
    // 1. Iniciar animación de doblado de avión de papel
    this.folding = true;
    
    // 2. Después de 400ms (cuando se dobló), iniciar el vuelo
    setTimeout(() => {
      this.flying = true;
      
      // 3. Después de 800ms (cuando voló lejos), mostrar el post-it de éxito y agregar al listado local
      setTimeout(() => {
        const nueva: Opinion = {
          id: crypto.randomUUID(),
          autor: this.newCommentAuthor,
          texto: this.newCommentText,
          color: this.newCommentColor,
          foto: this.uploadedPhotoBase64 || undefined
        };
        
        this.opinionesList.unshift(nueva);
        
        this.showForm = false;
        this.folding = false;
        this.flying = false;
        this.showSuccess = true;
      }, 800);
    }, 400);
  }

  resetForm() {
    this.newCommentText = '';
    this.newCommentAuthor = '';
    this.newCommentColor = 'sticky-yellow';
    this.uploadedPhotoBase64 = '';
    this.photoStatus = '';
    this.showSuccess = false;
  }
}
