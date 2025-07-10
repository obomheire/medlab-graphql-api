import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class UniqueEpisodeNoConstraint implements ValidatorConstraintInterface {
  validate(episodes: any[], args: ValidationArguments): boolean {
    const seen = new Set();
    for (const ep of episodes) {
      if (seen.has(ep.episode)) {
        return false;
      }
      seen.add(ep.episode);
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Duplicate episode numbers found in uploaded episodes';
  }
}

// Decorator wrapper
export function UniqueEpisodeNo(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'UniqueEpisodeNo',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: UniqueEpisodeNoConstraint,
    });
  };
}
