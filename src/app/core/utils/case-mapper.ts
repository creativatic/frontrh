/**
 * Utility functions to map object keys between camelCase and snake_case recursively.
 */

export function toCamelCase(val: any): any {
  if (val === null || val === undefined) {
    return val;
  }

  if (Array.isArray(val)) {
    return val.map(toCamelCase);
  }

  if (typeof val === 'object' && val.constructor === Object) {
    const newObj: any = {};
    for (const key of Object.keys(val)) {
      const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
      newObj[camelKey] = toCamelCase(val[key]);
    }
    return newObj;
  }

  return val;
}

export function toSnakeCase(val: any): any {
  if (val === null || val === undefined) {
    return val;
  }

  if (Array.isArray(val)) {
    return val.map(toSnakeCase);
  }

  if (typeof val === 'object' && val.constructor === Object) {
    const newObj: any = {};
    for (const key of Object.keys(val)) {
      const snakeKey = key.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
      newObj[snakeKey] = toSnakeCase(val[key]);
    }
    return newObj;
  }

  return val;
}
