import { ArrayLiteralExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ArrayLiteralExpressionCompiler extends NodeCompiler<
  ArrayLiteralExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ArrayLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ArrayLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [arrayObjectVal]
    sb.emitHelper(node, options, sb.helpers.createArray);
    for (const [idx, element] of node.getElements().entries()) {
      // [arrayObjectVal, arrayObjectVal]
      sb.emitOp(node, 'DUP');
      // [idxNumber, arrayObjectVal, arrayObjectVal]
      sb.emitPushInt(node, idx);
      // [val, idxNumber, arrayObjectVal, arrayObjectVal]
      sb.visit(element, options);
      // [arrayObjectVal]
      sb.emitHelper(node, options, sb.helpers.setArrayIndex);
    }

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
