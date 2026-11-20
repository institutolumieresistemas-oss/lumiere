import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertaService, AlertaConfig } from '../../servicios/alerta.service';

@Component({
  selector: 'app-alerta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerta.html',
  styleUrls: ['./alerta.css']
})
export class Alerta implements OnInit, OnDestroy {
  visible = false;
  config: AlertaConfig = {
    tipo: 'info',
    titulo: '',
    mensaje: ''
  };

  private subscription!: Subscription;

  constructor(private alertaService: AlertaService) {}

  ngOnInit() {
    this.subscription = this.alertaService.alerta$.subscribe((config) => {
      this.config = config;
      this.visible = true;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  cerrar() {
    this.visible = false;
    if (this.config.callback) {
      this.config.callback();
    }
  }

  getIconClass(): string {
    switch (this.config.tipo) {
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'error':
        return 'fa-solid fa-circle-xmark';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'info':
      default:
        return 'fa-solid fa-circle-info';
    }
  }
}
