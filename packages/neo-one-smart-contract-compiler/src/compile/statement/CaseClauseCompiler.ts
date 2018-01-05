import { CaseClause, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CaseClauseCompiler extends NodeCompiler<
  CaseClause
  > {
  public readonly kind: SyntaxKind = SyntaxKind.CaseClause;

  public visitNode(sb: ScriptBuilder, node: CaseClause, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.if({
      condition: () => {
        sb.visit(node.getExpression(), sb.pushValueOptions(options));
        sb.emitHelper(
          node,
          sb.pushValueOptions(options),
          sb.helpers.equalsEqualsEquals({
            leftType: options.switchExpressionType,
            rightType: sb.getType(node.getExpression()),
          }),
        );
      },
      whenTrue: () => {
        sb.emitHelper(node, options, sb.helpers.processStatements({ createScope: false }));
      },
    }));
  }
}
