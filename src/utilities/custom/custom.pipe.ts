/* eslint-disable @typescript-eslint/ban-types */
import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = this.flattenErrors(errors).join('; ');
      throw new BadRequestException(messages);
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private flattenErrors(errors: any[], parentProperty?: string): string[] {
    const messages: string[] = [];

    errors.forEach((err) => {
      if (err.constraints) {
        // If constraints are present, add error message
        messages.push(Object.values(err.constraints).join(', '));
      } else if (err.children && err.children.length > 0) {
        // If nested errors exist, recursively flatten them
        const propertyName = parentProperty
          ? `${parentProperty}.${err.property}`
          : err.property;

        messages.push(...this.flattenErrors(err.children, propertyName));
      } else {
        // Fallback message for unknown errors
        messages.push(`Validation error for property '${err.property}'`);
      }
    });

    return messages;
  }
}
