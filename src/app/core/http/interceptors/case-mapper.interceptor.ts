import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { toCamelCase, toSnakeCase } from '../../utils/case-mapper';

/**
 * Interceptor para mapear automáticamente:
 * - Peticiones (Request) de camelCase a snake_case.
 * - Respuestas (Response) de snake_case a camelCase.
 */
export const caseMapperInterceptor: HttpInterceptorFn = (req, next) => {
  let clonedReq = req;

  // Evitar mutar FormData (cargas de archivos)
  if (req.body && !(req.body instanceof FormData)) {
    const snakeBody = toSnakeCase(req.body);
    clonedReq = req.clone({ body: snakeBody });
  }

  return next(clonedReq).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        const camelBody = toCamelCase(event.body);
        return event.clone({ body: camelBody });
      }
      return event;
    }),
  );
};
