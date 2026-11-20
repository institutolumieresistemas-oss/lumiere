import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-minibanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minibanner.html',
  styleUrls: ['./minibanner.css']
})
export class Minibanner implements OnInit {

  @Input() props: {
    imagen: string;
  } = {
    imagen: ''
  };

  @Output() actualizarProps = new EventEmitter<any>();
  @Output() eliminarElemento = new EventEmitter<void>();

  abrirConfigModal = false;

  propsTemp: {
    imagen: string;
  } = {
    imagen: ''
  };

  ngOnInit() {
    if (!this.props.imagen) {
      this.props = {
        imagen: 'https://picsum.photos/1200/100?random=1'
      };
      this.actualizarProps.emit(this.props);
    }
  }

  openModal() {
    this.propsTemp = JSON.parse(JSON.stringify(this.props));
    this.abrirConfigModal = true;
  }

  closeModal() {
    this.abrirConfigModal = false;
  }

  eliminar() {
    this.eliminarElemento.emit();
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.propsTemp.imagen = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardar() {
    this.props = { ...this.propsTemp };
    this.actualizarProps.emit(this.props);
    this.abrirConfigModal = false;
  }
}
