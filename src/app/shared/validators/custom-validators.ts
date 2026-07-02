import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores reactivos personalizados para el contexto peruano.
 */
export class CustomValidators {
  /**
   * Valida que el campo tenga exactamente 8 dígitos numéricos.
   */
  static dni(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const isValid = /^\d{8}$/.test(val);
      return isValid ? null : { dni: true };
    };
  }

  /**
   * Valida un RUC de 11 dígitos utilizando el algoritmo de SUNAT.
   */
  static ruc(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const rucStr = String(val);
      if (!/^\d{11}$/.test(rucStr)) {
        return { ruc: true };
      }

      const firstTwo = rucStr.substring(0, 2);
      if (firstTwo !== '10' && firstTwo !== '15' && firstTwo !== '17' && firstTwo !== '20') {
        return { ruc: true };
      }

      const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(rucStr.charAt(i), 10) * weights[i];
      }

      const remainder = sum % 11;
      let check = 11 - remainder;
      if (check === 10) check = 0;
      else if (check === 11) check = 1;

      const lastDigit = parseInt(rucStr.charAt(10), 10);
      return check === lastDigit ? null : { ruc: true };
    };
  }

  /**
   * Valida un teléfono celular peruano (comienza con 9 y tiene 9 dígitos).
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const cleanVal = String(val).replace(/\s+/g, '');
      const isValid = /^9\d{8}$/.test(cleanVal);
      return isValid ? null : { phone: true };
    };
  }

  /**
   * Valida una cuenta bancaria (solo dígitos y guiones).
   */
  static bankAccount(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const isValid = /^[0-9-]+$/.test(val);
      return isValid ? null : { bankAccount: true };
    };
  }

  /**
   * Valida que el CCI tenga exactamente 20 dígitos numéricos.
   */
  static cci(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const isValid = /^\d{20}$/.test(val);
      return isValid ? null : { cci: true };
    };
  }

  /**
   * Valida que el código CUSPP tenga exactamente 12 caracteres alfanuméricos.
   */
  static cuspp(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const isValid = /^[a-zA-Z0-9]{12}$/.test(val);
      return isValid ? null : { cuspp: true };
    };
  }

  /**
   * Valida un formato de teléfono general (números, espacios, guiones, paréntesis y +).
   */
  static generalPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const isValid = /^[0-9+\s()-]+$/.test(val);
      return isValid ? null : { generalPhone: true };
    };
  }
}
