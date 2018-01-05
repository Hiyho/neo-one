import { NumericLiteral } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class NumericLiteralTranspiler
  extends Transpiler<ts.Expression, NumericLiteral> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.NumericLiteral;

  public transpile(
    context: TranspilerContext,
    node: NumericLiteral,
  ): ts.Expression | undefined {
    return ts.createLiteral(node.getLiteralValue());
  }
}
