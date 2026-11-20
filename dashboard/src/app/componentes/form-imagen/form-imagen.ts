import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-imagen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-imagen.html',
  styleUrls: ['./form-imagen.css']
})
export class FormImagen implements OnInit, OnChanges {
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

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  configOpen = false;
  propsEdit: any = {};

  formNombre = '';
  formCelular = '';
  formPromedio: number | null = null;
  formCarrera = '';

  focusedField: string | null = null;
  isTyping = false;
  private typingTimeout: any;

  ngOnInit() {
    if (!this.props) {
      this.props = this.getDefaultProps();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // React to change in builder
  }

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
    }, 800);
  }

  abrirConfig() {
    this.propsEdit = { ...this.props };
    this.configOpen = true;
  }

  cerrarConfig() {
    this.configOpen = false;
  }

  guardarConfig() {
    this.props = { ...this.propsEdit };
    this.actualizarProps.emit(this.props);
    this.cerrarConfig();
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.propsEdit.imagenUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  enviarFormulario(event: Event) {
    event.preventDefault();
    alert('Simulación de envío en modo Builder. Registro recibido.');
    this.formNombre = '';
    this.formCelular = '';
    this.formPromedio = null;
    this.formCarrera = '';
  }

  private getDefaultProps() {
    return {
      titulo: '¿Listo para iniciar tu futuro?',
      subtitulo: 'Regístrate hoy mismo y recibe asesoría personalizada sobre nuestros cursos y carreras.',
      imagenUrl: 'https://picsum.photos/800/600?random=44',
      imagenDerecha: false,
      sendUrl: '',
      sendToken: '',
      pipelineId: '',
      estilo: 'split' as const
    };
  }
}
