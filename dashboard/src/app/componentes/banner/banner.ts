import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';
import { PagesService } from '../../servicios/page';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, RouterModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})

export class Banner implements OnInit {
  
  private _images: string[] = [];

  @Input()
  set images(value: string[]) {
    this._images = value || [];
    this.currentIndex = 0;
  }
  get images() {
    return this._images;
  }

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

  @Output() eliminarElemento = new EventEmitter<void>();
  @Output() actualizarProps = new EventEmitter<any>();

  currentIndex = 0;
  flash = false;
  intervalId: any;
  mostrarModal = false;
  pagesList: any[] = [];

  formNombre = '';
  formCorreo = '';
  formTelefono = '';

  private pagesService = inject(PagesService);
  private http = inject(HttpClient);

  ngOnInit() {
    this.iniciarSlider();
    this.pagesService.mostrar().subscribe((res: any) => {
      this.pagesList = res.data || res;
    });
  }

  iniciarSlider() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.images.length > 0) {
        this.triggerFlash();
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
      }
    }, 5000);
  }

  triggerFlash() {
    this.flash = true;
    setTimeout(() => this.flash = false, 250);
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  agregarImagen() {
    this.images.push('');
    this.emitirCambio();
  }

  eliminarImagen(index: number) {
    this.images.splice(index, 1);
    this.emitirCambio();
  }

  seleccionarImagen(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.images[index] = e.target.result;
      this.emitirCambio();
    };
    reader.readAsDataURL(file);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.emitirCambio();
  }

  enviarFormulario(event: Event) {
    event.preventDefault();
    if (!this.sendUrl) {
      alert('Formulario enviado (simulado)');
      return;
    }

    const esKommo = this.sendUrl.toLowerCase().includes('kommo.com');

    let body: any;

    if (esKommo) {
      // Formato requerido por Kommo /api/v4/leads/complex
      const customFields: any[] = [];

      const correo = this.formCorreo?.trim();
      const telefono = this.formTelefono?.trim();

      if (correo) {
        customFields.push({
          field_code: 'EMAIL',
          values: [{ value: correo, enum_code: 'WORK' }]
        });
      }

      if (telefono) {
        customFields.push({
          field_code: 'PHONE',
          values: [{ value: telefono, enum_code: 'WORK' }]
        });
      }

      const nombreCompleto = this.formNombre?.trim() || 'Nuevo Lead';

      body = [
        {
          name: nombreCompleto,
          _embedded: {
            contacts: [
              {
                first_name: nombreCompleto,
                custom_fields_values: customFields
              }
            ]
          }
        }
      ];
    } else {
      // Formato genérico para cualquier otra API
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

    if (this.sendToken) {
      headers = headers.set('Authorization', 'Bearer ' + this.sendToken);
    }

    this.http.post(this.sendUrl, body, { headers }).subscribe({
      next: (res) => {
        alert('¡Información enviada con éxito! 🎉');
        this.formNombre = '';
        this.formCorreo = '';
        this.formTelefono = '';
      },
      error: (err) => {
        console.error('Error Kommo:', err);
        // Si es error de CORS (status 0), mostrar mensaje específico
        if (err.status === 0) {
          alert('Error de conexión: Kommo no permite peticiones directas desde el navegador (CORS). Contacta al administrador.');
        } else {
          alert('Hubo un error al enviar la información. Código: ' + err.status);
        }
      }
    });
  }

  emitirCambio() {
    this.actualizarProps.emit({
      images: this.images,
      styleType: this.styleType,
      title: this.title,
      subtitle: this.subtitle,
      description: this.description,
      highlightText: this.highlightText,
      buttonText: this.buttonText,
      infoText: this.infoText,
      linkType: this.linkType,
      linkPageSlug: this.linkPageSlug,
      linkUrl: this.linkUrl,
      button2Text: this.button2Text,
      link2Type: this.link2Type,
      link2PageSlug: this.link2PageSlug,
      link2Url: this.link2Url,
      sendUrl: this.sendUrl,
      sendToken: this.sendToken,
      pipelineId: this.pipelineId
    });
  }
}
