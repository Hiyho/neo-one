import { StringLiteral } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class StringLiteralTranspiler
  extends Transpiler<ts.Expression, StringLiteral> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.StringLiteral;

  public transpile(
    context: TranspilerContext,
    node: StringLiteral,
  ): ts.Expression | undefined {
    return ts.createLiteral(node.getLiteralValue());
  }
}
