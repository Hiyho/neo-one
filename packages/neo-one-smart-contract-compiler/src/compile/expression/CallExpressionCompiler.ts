import { CallExpression, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class CallExpressionCompiler extends NodeCompiler<
  CallExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.CallExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    // [argsarr]
    sb.emitHelper(expr, options, sb.helpers.args);

    const func = expr.getExpression();
    let bindThis;
    if (
      TypeGuards.isElementAccessExpression(func) ||
      TypeGuards.isPropertyAccessExpression(func)
    ) {
      bindThis = true;
      // [expr, argsarr]
      sb.visit(func.getExpression(), options);
      // [expr, expr, argsarr]
      sb.emitOp(func, 'DUP');
      // [arg, expr, expr, argsarr]
      if (TypeGuards.isElementAccessExpression(func)) {
        sb.visit(
          func.getArgumentExpressionOrThrow(),
          options,
        );
      } else {
        sb.emitPushString(func.getNameNode(), func.getName());
      }
      // [objectVal, expr, argsarr]
      sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);
    } else {
      bindThis = false;
      // [objectVal, argsarr]
      sb.visit(func, options);
    }

    sb.emitHelper(expr, options, sb.helpers.invokeCall({ bindThis }));

    if (!optionsIn.pushValue) {
      sb.emitOp(expr, 'DROP');
    }
  }
}
