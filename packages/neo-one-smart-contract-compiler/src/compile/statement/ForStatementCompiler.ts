import { ForStatement, Node, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForStatementCompiler extends NodeCompiler<
  ForStatement
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ForStatement;

  public visitNode(sb: ScriptBuilder, node: ForStatement, options: VisitOptions): void {
    let initializer;
    const exprInitializer = node.getInitializer();
    if (exprInitializer != null) {
      initializer = (innerSB: ScriptBuilder, innerNode: Node, innerOptions: VisitOptions) => {
        innerSB.visit(exprInitializer, innerOptions);
      };
    }

    let condition;
    const exprCondition = node.getCondition();
    if (exprCondition != null) {
      condition = (innerSB: ScriptBuilder, innerNode: Node, innerOptions: VisitOptions) => {
        innerSB.visit(exprCondition, innerOptions);
      };
    }

    let incrementor;
    const exprIncrementor = node.getIncrementor();
    if (exprIncrementor != null) {
      incrementor = (innerSB: ScriptBuilder, innerNode: Node, innerOptions: VisitOptions) => {
        innerSB.visit(exprIncrementor, innerOptions);
      };
    }

    sb.emitHelper(node, options, sb.helpers.forLoop({
      initializer,
      condition,
      incrementor,
      each: (innerSB, innerNode, innerOptions) => {
        innerSB.visit(node.getStatement(), innerOptions);
      },
    }));
  }
}
