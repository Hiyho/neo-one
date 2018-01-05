import { PropertyAccessExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as typeUtils from '../../typeUtils';

export default class PropertyAccessExpressionCompiler extends NodeCompiler<
  PropertyAccessExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.PropertyAccessExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: PropertyAccessExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    const expression = expr.getExpression();
    // [val]
    sb.visit(expression, options);
    if (!typeUtils.isOnlyObject(sb.getType(expression))) {
      // [objectVal]
      sb.emitHelper(expression, options, sb.helpers.toObject);
    }

    if (optionsIn.setValue) {
      if (optionsIn.pushValue) {
        // [objectVal, value, objectVal]
        sb.emitOp(expression, 'TUCK');
      }
      // [name, objectVal, value, objectVal]
      sb.emitPushString(expr, expr.getName());
      // [value, name, objectVal, objectVal]
      sb.emitOp(expr, 'ROT');
      // [objectVal]
      sb.emitHelper(expr, options, sb.helpers.setPropertyObjectProperty);
    }

    if (optionsIn.pushValue || !optionsIn.setValue) {
      // [name, objectVal]
      sb.emitPushString(expr, expr.getName());
      // [value]
      sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);

      if (!optionsIn.pushValue) {
        sb.emitOp(expr, 'DROP');
      }
    }
  }
}
