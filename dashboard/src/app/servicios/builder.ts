import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { PageElement } from '../models/element.model';
import { map } from 'rxjs/operators';
import { PagesService } from './page';

@Injectable({ providedIn: 'root' })
export class Builder {

  private currentPage$ = new BehaviorSubject<Page | null>(null);
  private menuStyle$ = new BehaviorSubject<string>('capsule');
  private menuSinTransparencia$ = new BehaviorSubject<boolean>(false);

  constructor(private pagesService: PagesService) {
    // Cargar estilo del menú global de la página de inicio al inicializar
    this.pagesService.traer({ id: '215b86d9-b308-43f5-b649-d8d234580607' }).subscribe((res: any) => {
      const elements = res?.content?.elements || [];
      const menuEl = elements.find((el: any) => el.type === 'menu');
      if (menuEl) {
        this.menuStyle$.next(menuEl.props?.styleType || 'capsule');
        this.menuSinTransparencia$.next(menuEl.props?.sinTransparencia ?? false);
      }
    });
  }

  getCurrentPage(): Observable<Page | null> {
    return this.currentPage$.asObservable();
  }

  getCurrentPageValue(): Page | null {
    return this.currentPage$.value;
  }

  getMenuStyle(): Observable<string> {
    return this.menuStyle$.asObservable();
  }

  getMenuStyleValue(): string {
    return this.menuStyle$.value;
  }

  getMenuSinTransparenciaValue(): boolean {
    return this.menuSinTransparencia$.value;
  }

  saveGlobalMenu(styleType: string, sinTransparencia: boolean = false) {
    this.menuStyle$.next(styleType);
    this.menuSinTransparencia$.next(sinTransparencia);
    this.pagesService.traer({ id: '215b86d9-b308-43f5-b649-d8d234580607' }).subscribe((res: any) => {
      const elements = res?.content?.elements || [];
      let menuEl = elements.find((el: any) => el.type === 'menu');
      if (menuEl) {
        menuEl.props = { styleType, sinTransparencia };
      } else {
        elements.unshift({
          type: 'menu',
          props: { styleType, sinTransparencia }
        });
      }
      this.pagesService.contenido({ id: '215b86d9-b308-43f5-b649-d8d234580607', content: { elements } }).subscribe(() => {
        console.log("💾 Menú global guardado en Home (Página de inicio)");
      });
    });
  }

  loadPage(pageId: string) {

    this.pagesService.traer({ id: pageId })
      .pipe(
        map((res: any) => ({
          id: res.id,
          name: res.name,
          slug: res.slug,
          elements: res.content?.elements || []
        } as Page))
      )
      .subscribe(page => {

        console.log("📥 Página cargada desde BD:", page);

        this.currentPage$.next(page);

      });

  }

  addElement(type: PageElement['type'], props?: any) {

    const page = this.currentPage$.value;
  
    if (!page) return;
  
    const newElement: PageElement = {
      id: crypto.randomUUID(),
      type,
      col: 12,
      props: props || this.getDefaultProps(type)
    };
  
    const updatedPage: Page = {
      ...page,
      elements: [...page.elements, newElement]
    };
  
    this.currentPage$.next(updatedPage);
    this.saveCurrentPage();
  
  }

  saveCurrentPage() {

    const page = this.getCurrentPageValue(); // 🔥 usar getter
  
    if (!page) return;

    // Normalizar: si algún elemento no tiene col, asignar 12 por default
    const elements = page.elements.map(el => ({
      ...el,
      col: el.col ?? 12
    }));
  
    const payload = {
      id: page.id,
      content: { elements }
    };
  
    this.pagesService.contenido(payload).subscribe(
      res => {
        console.log("✅ RESPUESTA BACKEND:", res);
      },
      err => {
        console.error("❌ ERROR GUARDANDO CONFIGURACIÓN:", err);
      }
    );
  
  }

  updateElements(elements: PageElement[]) {

    const page = this.getCurrentPageValue();
  
    if (!page) return;
  
    const updatedPage: Page = {
      ...page,
      elements: [...elements]
    };
  
    this.currentPage$.next(updatedPage);
    this.saveCurrentPage();
  
  }

  private getDefaultProps(type: PageElement['type']): any {

    switch (type) {

      case 'hero':
        return {
          badge: '¡Convocatoria Abierta!',
          titleStart: 'Asegura tu lugar en la',
          titleHighlight: 'Universidad de Guadalajara',
          titleMiddle: 'con el mejor',
          titleCircle: 'Curso PAA',
          description: 'Te preparamos con exámenes de simulación reales, asesorías personalizadas con profesores del más alto nivel y el método de estudio más efectivo de la ZMG.',
          stats: [
            { value: '94.6%', label: 'De Aprobación', tag: '¡Súper alto! 📈' },
            { value: '+15k', label: 'Alumnos Admitidos' },
            { value: '+35 pts', label: 'Promedio de Incremento' }
          ],
          stickyNoteTitle: '¡Ojo! 📝',
          stickyNoteText: 'El examen PAA es por tiempo. ¡Te enseñamos a contestar en segundos!',
          floatingTitle: '¡Inscripciones Abiertas!',
          floatingSubtitle: 'Siguientes Calendarios 2026B y 2027A',
          floatingAvatar: 'UDG',
          heroImage: 'assets/hero.jpg',
          btn1Text: 'Explorar Cursos',
          btn1LinkType: 'url',
          btn1Url: '',
          btn1PageSlug: '',
          btn2Text: 'Calcular Mi Puntaje',
          btn2LinkType: 'url',
          btn2Url: '',
          btn2PageSlug: ''
        };

      case 'simulador':
        return {
          title: 'Simulador de Admisión',
          subtitle: 'En la UDG, tu puntaje final se calcula sumando el promedio de tu preparatoria (escala 0-100) y tu calificación del examen PAA (escala 0-100). Calcula tu proyección aquí:',
          tipsPool: [
            {
              title: '¡Hack de Mate! 📐⚡',
              text: '¡No te claves resolviendo todo el procedimiento! En la PAA de la UDG, muchas veces puedes estimar el resultado o sustituir las opciones directo en la pregunta. ¡Así respondes en 10 segundos!',
              color: 'sticky-yellow'
            },
            {
              title: '¡Hack de Vida o Muerte! 💀🎖️',
              text: 'Recuerda: Tu promedio de la prepa vale el 50% y tu examen el otro 50%. Si saliste con promedio bajo, ¡necesitas romperla en la PAA sí o sí para compensar!',
              color: 'sticky-pink'
            },
            {
              title: '¡Speedrun de Lectura! 📚💨',
              text: 'Lee las preguntas ANTES de aventarte todo el texto largo. Así sabrás exactamente qué buscar y no perderás tiempo leyendo paja.',
              color: 'sticky-blue'
            }
          ]
        };

      case 'cursos-udg':
        return {
          title: 'Cursos para Calendarios Posteriores',
          subtitle: 'Elige la modalidad que mejor se adapte a tu ritmo de estudio. Diseñados especialmente para las convocatorias 2026B, 2027A y periodos intensivos.',
          stickyNoteTitle: '¡Plan de Pagos! 💳',
          stickyNoteText: 'Pregunta por nuestras facilidades de pago diferido y promociones bancarias.',
          courses: [
            {
              title: 'Curso Semestral Premium',
              calendar: '2026b',
              price: '$5,800 MXN',
              priceSuffix: 'Pago único',
              features: [
                '120 horas de clase presencial',
                '10 exámenes de simulación PAA',
                'Asesorías personalizadas los sábados',
                'Acceso completo a plataforma digital',
                'Garantía de aprobación'
              ]
            },
            {
              title: 'Sabatino Intensivo',
              calendar: '2026b',
              price: '$4,900 MXN',
              priceSuffix: 'Pago único',
              features: [
                'Clases exclusivas el Sábado (9am - 2pm)',
                '8 exámenes de simulación PAA',
                'Guías de estudio impresas',
                'Talleres de matemáticas avanzados',
                'Plataforma digital 24/7'
              ]
            },
            {
              title: 'Anual Garantizado',
              calendar: '2027a',
              price: '$8,500 MXN',
              priceSuffix: 'Plan de pagos',
              features: [
                'Preparación a largo plazo (2 semestres)',
                '16 exámenes de simulación PAA',
                'Regularización de promedio escolar',
                'Orientación vocacional con expertos',
                'Acompañamiento en trámites UDG'
              ]
            }
          ]
        };

      case 'muro-opiniones':
        return {
          title: 'Muro de Opiniones',
          subtitle: 'Nuestros estudiantes comparten sus experiencias de estudio. ¡Deja tu nota adhesiva en nuestra pizarra digital!',
          opiniones: [
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
          ]
        };

      case 'badge-flotante':
        return {
          text: '+12k Admitidos UDG! 🎓🔥',
          color: 'sticky-pink',
          position: 'bottom-left',
          rotation: -4
        };

      case 'banner':
        return {
          styleType: 'classic',
          sendUrl: '',
          sendToken: '',
          pipelineId: '',
          images: [
            {
              thumb: 'https://picsum.photos/300/170?1',
              medium: 'https://picsum.photos/800/450?1',
              large: 'https://picsum.photos/1920/1080?1'
            },
            {
              thumb: 'https://picsum.photos/300/170?2',
              medium: 'https://picsum.photos/800/450?2',
              large: 'https://picsum.photos/1920/1080?2'
            }
          ]
        };

      case 'menu':
        return {
          styleType: 'classic'
        };

      case 'whatsapp':
        return { phone: "523335893912" };

      case 'faq':
        return {
          layout: 'notebook',
          faqs: [
            {
              pregunta: "¿Qué horarios de clase manejan para UDG?",
              respuesta: "Contamos con dos modalidades principales: Sabatino intensivo (9:00 AM a 2:00 PM) y Semanal por las tardes (4:00 PM a 7:00 PM). ¡Ideal para que no interfiera con tu prepa!"
            },
            {
              pregunta: "¿Cómo calculo si tengo posibilidades de entrar a Medicina o Ingenierías?",
              respuesta: "Recuerda que en UDG tu promedio de prepa vale el 50% y tu examen PAA el otro 50%. En nuestro Simulador arriba puedes proyectar tu puntaje mínimo y ver estadísticas reales."
            },
            {
              pregunta: "¿Qué pasa si no alcanzo el puntaje mínimo de mi carrera?",
              respuesta: "¡No te desanimes! Contamos con garantía de aprobación. Si por algún motivo no eres admitido, puedes recursar el siguiente ciclo con nosotros sin costo adicional."
            }
          ]
        };

      case 'foto-planteles':
        return {
          images: [
            'https://picsum.photos/1920/1080?1',
            'https://picsum.photos/1920/1080?2',
            'https://picsum.photos/1920/1080?1',
            'https://picsum.photos/1920/1080?2'
          ],
          autoPlay: true,
          interval: 3000,
          showThumbnails: true
        };

      case 'mensaje':
        return {
          texto: '¡Sigue aprendiendo! Cada día estás más cerca de tus metas ✨',
          layout: 'classic'
        };

      case 'numeros':
        return {
          titulo: 'Números Lumière',
          subtitulo: 'Los resultados dicen más que las palabras',
          layout: 'classic',
          stats: [
            { valor: '+90%', texto: 'Alumnos aceptados a UdeG', tipo: 'graduados' },
            { valor: '+50,000', texto: 'Alumnos admitidos', tipo: 'alumnos' },
            { valor: '+17 años', texto: 'Ayudando a cumplir sueños', tipo: 'anios' }
          ]
        };

      case 'profesores':
        return {
          layout: 'scroll',
          profesores: [
            {
              nombre: 'Ana López',
              especialidad: 'Matemáticas',
              descripcion: 'Especialista en educación matemática con enfoque práctico y pedagógico.',
              foto: 'https://picsum.photos/260/160?random=1'
            },
            {
              nombre: 'Carlos Méndez',
              especialidad: 'Programación',
              descripcion: 'Desarrollador Full Stack con experiencia en Angular y sistemas modernos.',
              foto: 'https://picsum.photos/260/160?random=2'
            },
            {
              nombre: 'María Torres',
              especialidad: 'Diseño Digital',
              descripcion: 'Diseñadora UX/UI enfocada en productos digitales y experiencia de usuario.',
              foto: 'https://picsum.photos/260/160?random=3'
            },
            {
              nombre: 'Luis Herrera',
              especialidad: 'Marketing',
              descripcion: 'Estratega digital especializado en crecimiento de marcas.',
              foto: 'https://picsum.photos/260/160?random=4'
            }
          ]
        };

      case 'cursos':
        return {
          cursos: [
            {
              id: 1,
              titulo: 'Curso de Ingreso a UdeG',
              imagen: 'https://picsum.photos/400/250?random=10',
              modalidad: 'Presencial',
              duracion: '6 meses',
              inicio: '15 de Febrero 2026',
              termina: '15 de Agosto 2026',
              simulacros: 'Incluidos',
              horas: 180,
              descuento: 30,
              precioLista: 12000,
              precioPromo: 8400,
              ahorro: 3600,
              limiteLiquidar: '31 de Enero 2026',
              textoLiquidar: '¡Liquídalo antes del:',
              textoMeses: 'Hasta 12 meses sin intereses',
              apartado: 1500,
              duracionSemanas: 12,
              horarios: ['Matutino: 08:00 - 12:00', 'Vespertino: 14:00 - 18:00']
            }
          ]
        };

      case 'testimonios':
        return {
          titulo: 'Lo que opinan nuestros alumnos',
          layout: 'classic',
          testimonios: [
            {
              nombre: 'Ana López',
              texto: 'El curso cambió totalmente mi forma de aprender. Súper dinámico y divertido.',
              imagen: 'https://i.pravatar.cc/150?img=32',
              calificacion: 5
            },
            {
              nombre: 'Carlos Méndez',
              texto: 'Los instructores son buenísimos y el contenido es muy práctico.',
              imagen: 'https://i.pravatar.cc/150?img=12',
              calificacion: 4
            },
            {
              nombre: 'Sofía Ramírez',
              texto: 'Nunca había aprendido tan rápido. ¡Recomendado totalmente!',
              imagen: 'https://i.pravatar.cc/150?img=45',
              calificacion: 5
            }
          ]
        };
      // En builder.service.ts -> getDefaultProps(type)

      case 'streaming':
        return {
          url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', // URL de ejemplo
          titulo: 'Transmisión en Vivo',
          autoplay: true,
          mute: false
        };
      case 'experiencia-evento':
        return {
          layout: 'classic',
          titulo: '¿Qué vivirás en este evento?',
          subtitulo: 'Una jornada diseñada para poner a prueba tus conocimientos y llevarlos al siguiente nivel.',
          cards: [
            {
              imagen: 'assets/img/builder/exam.svg',
              titulo: 'Simulación Real',
              descripcion: 'Enfréntate a un examen de práctica impreso, con la misma estructura y límite de tiempo que tendrás el gran día.'
            },
            {
              imagen: 'assets/img/builder/target.svg',
              titulo: 'Diagnóstico Preciso',
              descripcion: 'Conoce tu puntaje real y descubre en qué temas específicos necesitas enfocarte.'
            },
            {
              imagen: 'assets/img/builder/brain.svg',
              titulo: 'Resolución en Vivo',
              descripcion: 'Repasaremos frente a ti los reactivos clave de Español y Matemáticas.'
            }
          ]
        };
      case 'categorias':
        return {
          titulo: 'CONOCE NUESTROS CURSOS',
          cuadros: [
            { imagen: 'https://picsum.photos/250/80?random=1', enlace: '' },
            { imagen: 'https://picsum.photos/250/80?random=2', enlace: '' }
          ]
        };
      case 'modalidades':
        return {
          titulo: 'SELECCIONA UNA MODALIDAD:',
          subtitulo: 'CURSOS 2027A',
          detalle: 'Examen Admisión UDG: NOVIEMBRE 2026',
          modalidades: [
            {
              imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-easel" viewBox="0 0 16 16"><path d="M8 0a.5.5 0 0 1 .473.337L9.046 2H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1.85l1.323 3.837a.5.5 0 1 1-.946.326L11.092 11H4.908l-1.435 4.163a.5.5 0 1 1-.946-.326L3.85 11H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4.954L7.527.337A.5.5 0 0 1 8 0M2 3v7h12V3z"/></svg>',
              titulo: 'Modalidad Presencial',
              colorTexto: '#07004d',
              colorFondo: '#93c5fd',
              btnColor: '#fb923c',
              btnColorTexto: '#ffffff',
              btnTexto: 'MÁS INFORMACIÓN',
              infoTitulo: 'Modalidad Presencial',
              infoDescripcion: 'Clases 100% presenciales en nuestras instalaciones equipadas con profesores expertos de nivel académico excelente.',
              infoImagen: 'https://picsum.photos/600/400?random=1'
            },
            {
              imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-camera-video" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v3.06l2.67-1.6a1 1 0 0 1 1.485.867v4.347a1 1 0 0 1-1.485.867L11.5 10.94V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm11.5 5.16 2.5 1.5V5.34l-2.5 1.5zm-1.5-5.16H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1"/></svg>',
              titulo: 'Modalidad Vía ZOOM',
              colorTexto: '#07004d',
              colorFondo: '#fcd34d',
              btnColor: '#fb923c',
              btnColorTexto: '#ffffff',
              btnTexto: 'MÁS INFORMACIÓN',
              infoTitulo: 'Clases en Vivo vía ZOOM',
              infoDescripcion: 'Interactúa con los profesores y compañeros en tiempo real desde la comodidad de tu hogar con sesiones grabadas para repaso.',
              infoImagen: 'https://picsum.photos/600/400?random=2'
            },
            {
              imagen: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%231e293b" class="bi bi-laptop" viewBox="0 0 16 16"><path d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2zM0 12.5h16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5"/></svg>',
              titulo: 'Modalidad a tu Ritmo',
              colorTexto: '#07004d',
              colorFondo: '#e9d5ff',
              btnColor: '#fb923c',
              btnColorTexto: '#ffffff',
              btnTexto: 'MÁS INFORMACIÓN',
              infoTitulo: 'A tu Propio Ritmo',
              infoDescripcion: 'Acceso ilimitado a nuestra plataforma las 24 horas del día. Estudia, repasa y realiza exámenes de simulación en tus tiempos libres.',
              infoImagen: 'https://picsum.photos/600/400?random=3'
            }
          ]
        };
      case 'minibanner':
        return {
          imagen: 'https://picsum.photos/1200/100?random=1',
          tipoEnlace: 'externa',
          enlace: 'https://google.com'
        };
      case 'galeria-carrusel':
        return {
          titulo: 'Galería de Experiencias',
          items: [
            {
              nombre: 'Jesus Alanis',
              ubicacion: 'Zapopan, Jalisco',
              avatar: 'https://i.pravatar.cc/150?img=11',
              imagen: 'https://picsum.photos/500/500?random=81',
              liked: false,
              bookmarked: false
            },
            {
              nombre: 'Carlos Mendez',
              ubicacion: 'Zapopan, Jalisco',
              avatar: 'https://i.pravatar.cc/150?img=12',
              imagen: 'https://picsum.photos/500/500?random=82',
              liked: true,
              bookmarked: false
            },
            {
              nombre: 'Graciela Perez',
              ubicacion: 'Zapopan, Jalisco',
              avatar: 'https://i.pravatar.cc/150?img=14',
              imagen: 'https://picsum.photos/500/500?random=83',
              liked: false,
              bookmarked: true
            },
            {
              nombre: 'Carlos Zamora',
              ubicacion: 'Guadalajara, Jalisco',
              avatar: 'https://i.pravatar.cc/150?img=15',
              imagen: 'https://picsum.photos/500/500?random=84',
              liked: false,
              bookmarked: false
            }
          ]
        };
      case 'video-texto':
        return {
          titulo: 'Conoce Nuestra Metodología',
          descripcion: 'Descubre en este video cómo ayudamos a cientos de estudiantes a asegurar su ingreso a la universidad mediante técnicas de estudio eficientes y profesores altamente capacitados.',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoDerecha: false,
          botonTexto: 'MÁS INFORMACIÓN',
          botonEnlace: ''
        };
      case 'tabla-admitidos':
        return {
          titulo: 'Lista de Admitidos a UdeG',
          filas: [
            {
              alumno: 'Andrea Cárdenas Allec',
              puntaje: '189.97',
              carrera: 'Médico Cirujano y Partero',
              curso: 'Maestro plus',
              calendario: '2026A'
            },
            {
              alumno: 'Cristopher Aaron Dominguez Mora',
              puntaje: '189.97',
              carrera: 'Médico Cirujano y Partero',
              curso: 'Maestro',
              calendario: '2026A'
            },
            {
              alumno: 'Diana Jacqueline Mercado Arvizu',
              puntaje: '189.84',
              carrera: 'Médico Cirujano y Partero',
              curso: 'Maestro plus',
              calendario: '2026A'
            },
            {
              alumno: 'Gladys Ordaz Mendoza',
              puntaje: '189.77',
              carrera: 'Médico Cirujano y Partero',
              curso: 'Alto Rendimiento',
              calendario: '2026A'
            },
            {
              alumno: 'Eduardo Verduzco Aslan',
              puntaje: '189.72',
              carrera: 'Médico Cirujano y Partero',
              curso: 'Especial Altos Puntajes',
              calendario: '2026A'
            }
          ]
        };
      case 'kommo-form':
        return { url: '', altura: 600 };
      case 'banner-descripcion':
        return {
          nombre: 'Plantel Zapopan Centro',
          direccion: 'Av. Hidalgo 123, Zapopan Centro, CP 45100',
          descripcion: 'Nuestras instalaciones cuentan con aulas climatizadas, proyectores de alta definición, biblioteca estudiantil y espacios comunes diseñados para el estudio grupal e individual.',
          mapaUrl: 'https://maps.google.com',
          galeria: [
            'https://picsum.photos/600/400?random=11',
            'https://picsum.photos/600/400?random=12',
            'https://picsum.photos/600/400?random=13'
          ],
          galleryPosition: 'left',
          autoPlayInterval: 3000
        };
      case 'imagen':
        return {
          imageUrl: 'https://placehold.co/1200x500?text=Haz+clic+en+configurar+para+subir+tu+imagen',
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0
        };
      case 'documentos-pdf':
        return {
          tituloSeccion: 'Materiales y Guías de Estudio',
          columnas: 3,
          documentos: [
            {
              titulo: 'Guía del Examen PAA',
              descripcion: 'Temario completo con explicaciones detalladas y ejemplos de reactivos.',
              pdfUrl: ''
            },
            {
              titulo: 'Ejercicios de Práctica',
              descripcion: 'Colección de reactivos de matemáticas y lectura redactada.',
              pdfUrl: ''
            }
          ]
        };
      case 'tabla-carreras':
        return {
          centroUniversitario: 'CUCEI',
          titulo: 'Puntajes Mínimos de Admisión',
          colorFondo: '#3b82f6',
          colorLetra: '#ffffff',
          carreras: [
            {
              carrera: 'Ingeniería en Computación',
              puntaje: '154.55',
              cupos: '180',
              aspirantes: '1250',
              calendario: '2025-B'
            },
            {
              carrera: 'Licenciatura en Informática',
              puntaje: '142.10',
              cupos: '120',
              aspirantes: '820',
              calendario: '2025-B'
            }
          ]
        };
      case 'form-imagen':
        return {
          titulo: '¿Listo para iniciar tu futuro?',
          subtitulo: 'Regístrate hoy mismo y recibe asesoría personalizada sobre nuestros cursos y carreras.',
          imagenUrl: 'https://picsum.photos/800/600?random=44',
          imagenDerecha: false,
          sendUrl: '',
          sendToken: '',
          pipelineId: '',
          estilo: 'split'
        };
      case 'espacio-menu':
        return { altura: 90 };

      default:
        return {};
    }

  }

}