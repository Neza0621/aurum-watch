# AURUM — Calibre I

Experiencia web interactiva scrollytelling de alta relojería de lujo, desarrollada con **Three.js** y **GSAP ScrollTrigger**.

## Características

- **Geometría Procedural 3D:** Calibre mecánico modelado completamente en código (platina esqueletada, tren de engranajes, volante de inercia oscilando a 4 Hz, espiral arquimediana y rubíes de corindón sintético).
- **Materiales PBR y Entorno de Estudio:** Shader PBR con oro champagne de 18k, acero templado azulado y mapa de reflexión de estudio generado proceduralmente sin dependencias externas.
- **Scrollytelling Cinemático:** Despiece axial en capas al hacer scroll, macro-inspección del órgano regulador y reensamblaje monolítico con inercia suave (`scrub`).
- **Motion Safety & Accesibilidad:** Detección de `prefers-reduced-motion` y fallback funcional `<noscript>`.
- **Rendimiento:** Límite de `devicePixelRatio` y pausa automática del render loop al cambiar de pestaña.

## Tecnologías

- Three.js (r128)
- GSAP (3.12.5) + ScrollTrigger
- HTML5 Semántico + CSS3 Vanilla
