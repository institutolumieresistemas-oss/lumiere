import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { Builder } from '../../servicios/builder';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
  imports: [RouterLink, CommonModule]
})
export class Menu implements OnInit {
  
  @Input() styleType: 'capsule' | 'neon' | 'playful' | 'liquid' | 'bento' | 'wave' | 'tech' = 'capsule';
  sinTransparencia: boolean = false;

  isLanding = false;
  scrolled = false;

  constructor(
    private builderService: Builder,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkRoute(this.router.url);
    this.router.events.subscribe(() => {
      this.checkRoute(this.router.url);
    });

    // Cargar la configuración de la página de inicio para obtener el estilo del menú global
    this.builderService.contenido({ id: '215b86d9-b308-43f5-b649-d8d234580607' }).subscribe({
      next: (res: any) => {
        const elements = res?.content?.elements || [];
        const menuEl = elements.find((el: any) => el.type === 'menu');
        if (menuEl && menuEl.props?.styleType) {
          this.styleType = menuEl.props.styleType;
        }
        if (menuEl) {
          this.sinTransparencia = menuEl.props?.sinTransparencia ?? false;
        }
      },
      error: (err) => {
        console.error('Error cargando el menú global:', err);
      }
    });
  }

  private checkRoute(url: string) {
    this.isLanding = url.includes('/landing');
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;  // 50px de scroll para activar el cambio
  }
}
