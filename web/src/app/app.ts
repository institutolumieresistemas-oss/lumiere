import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterFijo } from './componentes/footer-fijo/footer-fijo';
import { Alerta } from './componentes/alerta/alerta';
import { BanorteModal } from './componentes/banorte-modal/banorte-modal';
import { BanorteService } from './servicios/banorte.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterFijo, Alerta, BanorteModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('web');

  // Inyectar BanorteService para inicializar el interceptor global de enlaces de Mercado Pago
  constructor(private banorteService: BanorteService) {}
}

