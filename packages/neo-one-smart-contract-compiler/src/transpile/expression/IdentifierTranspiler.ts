import { Identifier } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class IdentifierTranspiler
  extends Transpiler<ts.Expression, Identifier> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.Identifier;

  public transpile(
    context: TranspilerContext,
    node: Identifier,
  ): ts.Expression | undefined {
    return ts.createIdentifier(node.getText());
  }
}
