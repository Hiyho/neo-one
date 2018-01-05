import { AsExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class AsExpressionCompiler extends NodeCompiler<AsExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.AsExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: AsExpression,
    options: VisitOptions,
  ): void {
    // tslint:disable-line
  }
}
