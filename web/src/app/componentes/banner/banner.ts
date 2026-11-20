import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertaService } from '../../servicios/alerta.service';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './banner.html',
  styleUrls: ['./banner.css']
})
export class Banner implements OnInit {

  @Input() images: string[] = [];
  @Input() styleType: 'classic' | 'neon' | 'split' | 'grid' = 'classic';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() highlightText: string = '';
  @Input() buttonText: string = '';
  @Input() infoText: string = '';
  @Input() linkType: 'page' | 'url' = 'url';
  @Input() linkPageSlug: string = '';
  @Input() linkUrl: string = '';
  
  // Propiedades del Botón 2 (Saber más)
  @Input() button2Text: string = 'Saber más';
  @Input() link2Type: 'page' | 'url' = 'url';
  @Input() link2PageSlug: string = '';
  @Input() link2Url: string = '';

  @Input() sendUrl: string = '';
  @Input() sendToken: string = '';
  @Input() pipelineId: string = '';

  currentIndex = 0;
  flash = false;
  intervalId: any;

  formNombre = '';
  formCorreo = '';
  formTelefono = '';

  private http = inject(HttpClient);
  private alertaService = inject(AlertaService);

  ngOnInit() {
    this.iniciarSlider();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  iniciarSlider() {
    this.intervalId = setInterval(() => {
      if (this.images.length > 1) {
        this.triggerFlash();
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
      }
    }, 5000);
  }

  triggerFlash() {
    this.flash = true;
    setTimeout(() => (this.flash = false), 250);
  }

  get cleanPageSlug(): string {
    if (!this.linkPageSlug) return '';
    return this.linkPageSlug.replace(/^[\/]+/, '');
  }

  get clean2PageSlug(): string {
    if (!this.link2PageSlug) return '';
    return this.link2PageSlug.replace(/^[\/]+/, '');
  }

  enviarFormulario(event: Event) {
    event.preventDefault();
    if (!this.sendUrl) {
      this.alertaService.info('Formulario Simulado', 'Tu información fue procesada con éxito (Modo Simulación).');
      return;
    }

    const esKommo = this.sendUrl.toLowerCase().includes('kommo.com');
    let urlFinal: string;
    let body: any;

    if (esKommo) {
      // Usar proxy del backend para evitar CORS
      urlFinal = 'https://api.lumieresiga.com/formularios/kommo/lead';
      body = {
        kommo_url: this.sendUrl,
        token: this.sendToken,
        pipeline_id: this.pipelineId,
        nombre: this.formNombre?.trim() || 'Nuevo Lead',
        correo: this.formCorreo?.trim() || '',
        telefono: this.formTelefono?.trim() || ''
      };
    } else {
      urlFinal = this.sendUrl;
      body = { nombre: this.formNombre };
      if (this.styleType === 'grid') {
        body.telefono = this.formTelefono;
      } else {
        body.correo = this.formCorreo;
      }
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (!esKommo && this.sendToken) {
      headers = headers.set('Authorization', 'Bearer ' + this.sendToken);
    }

    this.http.post(urlFinal, body, { headers }).subscribe({
      next: () => {
        this.alertaService.success('¡Registro Exitoso! 🎉', 'Te enviaremos los detalles sobre nuestros cursos muy pronto.');
        this.formNombre = '';
        this.formCorreo = '';
        this.formTelefono = '';
      },
      error: (err) => {
        console.error('Error envío:', err);
        this.alertaService.error('Error de Envío ✖', 'Hubo un error al procesar tu solicitud. Código de error: ' + err.status);
      }
    });
  }
}
