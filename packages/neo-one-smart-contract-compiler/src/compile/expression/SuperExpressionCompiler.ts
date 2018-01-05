import { SuperExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class SuperExpressionCompiler extends NodeCompiler<
  SuperExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.SuperKeyword;

  public visitNode(sb: ScriptBuilder, expr: SuperExpression, options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
