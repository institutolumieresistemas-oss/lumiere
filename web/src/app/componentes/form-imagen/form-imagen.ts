import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertaService } from '../../servicios/alerta.service';

@Component({
  selector: 'app-form-imagen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-imagen.html',
  styleUrls: ['./form-imagen.css']
})
export class FormImagen {
  @Input() props!: {
    titulo: string;
    subtitulo: string;
    imagenUrl: string;
    imagenDerecha: boolean;
    sendUrl?: string;
    sendToken?: string;
    pipelineId?: string;
    estilo?: 'split' | 'overlay' | 'notebook';
  };

  formNombre = '';
  formCelular = '';
  formPromedio: number | null = null;
  formCarrera = '';

  focusedField: string | null = null;
  isTyping = false;
  private typingTimeout: any;

  private http = inject(HttpClient);
  private alertaService = inject(AlertaService);

  onFocus(field: string) {
    this.focusedField = field;
  }

  onBlur() {
    this.focusedField = null;
    this.isTyping = false;
  }

  onTyping() {
    this.isTyping = true;
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 800); // detiene el movimiento del lápiz 800ms después del último input
  }

  enviarFormulario(event: Event) {
    event.preventDefault();

    if (!this.props?.sendUrl) {
      this.alertaService.info('Formulario Simulado', 'Tu información de registro fue simulada con éxito.');
      this.limpiarFormulario();
      return;
    }

    const esKommo = this.props.sendUrl.toLowerCase().includes('kommo.com');
    let urlFinal: string;
    let body: any;

    if (esKommo) {
      // Usar proxy del backend para evitar CORS
      urlFinal = 'https://api.lumieresiga.com/formularios/kommo/lead';
      body = {
        kommo_url: this.props.sendUrl,
        token: this.props.sendToken,
        pipeline_id: this.props.pipelineId,
        nombre: this.formNombre?.trim() || 'Nuevo Lead',
        celular: this.formCelular?.trim() || '',
        carrera: this.formCarrera?.trim() || ''
      };
    } else {
      urlFinal = this.props.sendUrl;
      body = {
        nombre: this.formNombre,
        celular: this.formCelular,
        promedio: this.formPromedio,
        carrera: this.formCarrera
      };
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (!esKommo && this.props.sendToken) {
      headers = headers.set('Authorization', 'Bearer ' + this.props.sendToken);
    }

    this.http.post(urlFinal, body, { headers }).subscribe({
      next: () => {
        this.alertaService.success('¡Registro Completado! 🎓', 'Hemos recibido tus datos. Te contactaremos muy pronto.');
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error envío:', err);
        this.alertaService.error('Error de Envío ✖', 'Hubo un inconveniente al registrar tus datos. Inténtalo de nuevo.');
      }
    });
  }

  private limpiarFormulario() {
    this.formNombre = '';
    this.formCelular = '';
    this.formPromedio = null;
    this.formCarrera = '';
  }
}
