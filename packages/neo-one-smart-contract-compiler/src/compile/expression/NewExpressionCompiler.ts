import { NewExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class NewExpressionCompiler extends NodeCompiler<NewExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.NewExpression;

  public visitNode(sb: ScriptBuilder, expr: NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [argsarr]
    sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.args);
    // [objectVal, argsarr]
    sb.visit(expr.getExpression(), sb.pushValueOptions(options));
    // [val]
    sb.emitHelper(expr, options, sb.helpers.invokeConstruct());

    if (!optionsIn.pushValue) {
      sb.emitOp(expr, 'DROP');
    }
  }
}
