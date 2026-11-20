import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
  selector: 'app-kommo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kommo-form.html',
  styleUrl: './kommo-form.css'
})
export class KommoForm implements OnChanges {

  @Input() props: { url: string; altura: number } = { url: '', altura: 600 };

  @Output() eliminarElemento = new EventEmitter<void>();
  @Output() actualizarProps  = new EventEmitter<{ url: string; altura: number }>();

  private sanitizer = inject(DomSanitizer);

  modoEdicion = true;
  urlTemp    = '';
  alturaTemp = 600;
  iframeSrc: SafeResourceUrl | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['props'] && this.props?.url?.trim()) {
      this.urlTemp    = this.props.url;
      this.alturaTemp = this.props.altura || 600;
      this.modoEdicion = false;
      this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.props.url);
    }
  }

  guardar(): void {
    const url = this.urlTemp.trim();
    if (!url) return;

    this.iframeSrc   = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.modoEdicion = false;
    this.actualizarProps.emit({ url, altura: this.alturaTemp });
  }

  editar(): void {
    this.modoEdicion = true;
  }

  eliminar(): void {
    this.eliminarElemento.emit();
  }
}
