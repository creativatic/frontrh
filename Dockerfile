# =============================================================
# Sistema RRHH — Frontend (Angular + Sakai-NG)
# Multi-stage build:
#   1) builder: compila Angular en modo producción
#   2) runtime: nginx alpine sirviendo los estáticos
# =============================================================

# ---- Stage 1: builder ----------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# IMPORTANTE: NO copiamos .npmrc al builder.
# El .npmrc del repo tiene `ignore-scripts=true` para defensa local,
# pero eso bloquea los binarios nativos opcionales (lightningcss para
# tailwind 4, etc.) durante el build de Angular. Aquí estamos en un
# contenedor descartable: aceptamos correr scripts para los paquetes
# que sí lo necesitan. La protección sigue activa en el repo y en runtime.
COPY package.json package-lock.json ./
RUN npm ci --include=optional

# Código fuente.
COPY tsconfig*.json angular.json .postcssrc.json ./
COPY src ./src
COPY public ./public

# Build producción (genera dist/sakai-ng/browser/).
RUN npm run build:prod

# ---- Stage 2: runtime ----------------------------------------
FROM nginx:1.31-alpine AS runtime

# Eliminar configuración por defecto de nginx.
RUN rm -f /etc/nginx/conf.d/default.conf

# Configuración propia: SPA routing + cache de assets hasheados.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Estáticos compilados.
COPY --from=builder /app/dist/sakai-ng/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
