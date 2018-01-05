import { TryStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TryStatementCompiler extends NodeCompiler<
  TryStatement
  > {
  public readonly kind: SyntaxKind = SyntaxKind.TryStatement;

  public visitNode(sb: ScriptBuilder, node: TryStatement, options: VisitOptions): void {
    const catchClause = node.getCatchClause();
    if (catchClause == null) {
      sb.visit(node.getTryBlock(), options);
    } else {
      sb.withProgramCounter((pc) => {
        sb.withProgramCounter((innerPC) => {
          sb.visit(node.getTryBlock(), sb.catchPCOptions(options, innerPC.getLast()));
          sb.emitJump(node, 'JMP', pc.getLast());
        });

        sb.visit(catchClause, options);
      });
    }

    const finallyBlock = node.getFinallyBlock();
    if (finallyBlock != null) {
      sb.reportUnsupported(finallyBlock);
    }
  }
}