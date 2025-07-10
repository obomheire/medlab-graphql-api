import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsThreeDecimalPlaces', async: false })
export class IsThreeDP implements ValidatorConstraintInterface {
  validate(timeTaken: any, args: ValidationArguments) {
    if (typeof timeTaken !== 'number') {
      return false;
    }

    const [, decimalPart] = timeTaken.toString().split('.');
    if (!decimalPart) {
      // If there is no decimal part, it's still valid but should not have more than 3 decimal places.
      return true;
    }

    const trimmedDecimalPart = decimalPart.replace(/0+$/, ''); // Remove trailing zeroes
    return trimmedDecimalPart.length <= 3;
  }

  defaultMessage(args: ValidationArguments) {
    return 'The timeTaken must have at most 3 decimal places.';
  }
}
