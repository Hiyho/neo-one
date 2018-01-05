import { BinaryExpressionTranspiler } from './BinaryExpressionTranspiler';
import { CallExpressionTranspiler } from './CallExpressionTranspiler';
import { IdentifierTranspiler } from './IdentifierTranspiler';
import { NewExpressionTranspiler } from './NewExpressionTranspiler';
import { NumericLiteralTranspiler } from './NumericLiteralTranspiler';
import { PropertyAccessExpressionTranspiler } from './PropertyAccessExpressionTranspiler';
import { StringLiteralTranspiler } from './StringLiteralTranspiler';

export default [
  BinaryExpressionTranspiler,
  CallExpressionTranspiler,
  IdentifierTranspiler,
  NewExpressionTranspiler,
  NumericLiteralTranspiler,
  PropertyAccessExpressionTranspiler,
  StringLiteralTranspiler,
];
