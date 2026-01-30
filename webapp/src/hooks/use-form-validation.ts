import { useState, useCallback } from 'react';

export type ValidationRule<T> = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  custom?: (value: T) => string | boolean;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Form validation hook with built-in validation rules
 * 
 * Usage:
 * const { values, errors, handleChange, validate, isValid } = useFormValidation({
 *   initialValues: { email: '', password: '' },
 *   rules: {
 *     email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
 *     password: { required: true, minLength: 8 }
 *   }
 * });
 */
export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  rules,
}: {
  initialValues: T;
  rules: ValidationRules<T>;
}) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const fieldRules = rules[name];
      if (!fieldRules) return undefined;

      // Required
      if (fieldRules.required) {
        if (!value || (typeof value === 'string' && !value.trim())) {
          return typeof fieldRules.required === 'string'
            ? fieldRules.required
            : `${String(name)} is required`;
        }
      }

      // MinLength
      if (fieldRules.minLength && typeof value === 'string') {
        const min = typeof fieldRules.minLength === 'number'
          ? fieldRules.minLength
          : fieldRules.minLength.value;
        const message = typeof fieldRules.minLength === 'object'
          ? fieldRules.minLength.message
          : `${String(name)} must be at least ${min} characters`;

        if (value.length < min) {
          return message;
        }
      }

      // MaxLength
      if (fieldRules.maxLength && typeof value === 'string') {
        const max = typeof fieldRules.maxLength === 'number'
          ? fieldRules.maxLength
          : fieldRules.maxLength.value;
        const message = typeof fieldRules.maxLength === 'object'
          ? fieldRules.maxLength.message
          : `${String(name)} must be at most ${max} characters`;

        if (value.length > max) {
          return message;
        }
      }

      // Min (number)
      if (fieldRules.min !== undefined && typeof value === 'number') {
        const min = typeof fieldRules.min === 'number'
          ? fieldRules.min
          : fieldRules.min.value;
        const message = typeof fieldRules.min === 'object'
          ? fieldRules.min.message
          : `${String(name)} must be at least ${min}`;

        if (value < min) {
          return message;
        }
      }

      // Max (number)
      if (fieldRules.max !== undefined && typeof value === 'number') {
        const max = typeof fieldRules.max === 'number'
          ? fieldRules.max
          : fieldRules.max.value;
        const message = typeof fieldRules.max === 'object'
          ? fieldRules.max.message
          : `${String(name)} must be at most ${max}`;

        if (value > max) {
          return message;
        }
      }

      // Pattern
      if (fieldRules.pattern && typeof value === 'string') {
        const pattern = fieldRules.pattern instanceof RegExp
          ? fieldRules.pattern
          : fieldRules.pattern.value;
        const message = typeof fieldRules.pattern === 'object' && 'message' in fieldRules.pattern
          ? fieldRules.pattern.message
          : `${String(name)} is invalid`;

        if (!pattern.test(value)) {
          return message;
        }
      }

      // Custom
      if (fieldRules.custom) {
        const result = fieldRules.custom(value);
        if (typeof result === 'string') {
          return result;
        }
        if (result === false) {
          return `${String(name)} is invalid`;
        }
      }

      return undefined;
    },
    [rules]
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if already touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validateField]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const error = validateField(key as keyof T, values[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid,
    setValues,
  };
}
