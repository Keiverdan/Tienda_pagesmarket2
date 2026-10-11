# Chupaalperro 668 - Supermercado Online

Aplicación de supermercado online construida con **React + TypeScript + Vite + Framer Motion**.

## Tecnologías
- React 18 + TypeScript
- Vite (build tool)
- Framer Motion (animaciones)
- Font Awesome (iconos)

## Estructura
```
src/
├── App.tsx              # Componente raíz (toda la lógica y animaciones)
├── main.tsx             # Entry point de React
├── types/index.ts       # Tipos TypeScript
└── styles/styles.css    # Estilos (sin animaciones CSS, todas en .tsx)
```

## Desarrollo local
```bash
pnpm install
pnpm dev
```

## Build
```bash
pnpm build
```

## Deployment a GitHub Pages
```bash
pnpm run deploy
```

## Características
- Catálogo de productos con filtros por categoría y búsqueda
- Carrito de compras con persisted storage (localStorage)
- Modal de cliente (nombre)
- Factura con desglose de productos y totales en Bs y USD
- Pago Móvil (copia de datos)
- Envío por WhatsApp
- Animaciones fluidas con Framer Motion
- Modo oscuro con efecto glass
- Diseño responsive (desktop, tablet, móvil)