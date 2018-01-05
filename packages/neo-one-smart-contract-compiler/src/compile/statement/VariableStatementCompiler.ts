import { VariableStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableStatementCompiler extends NodeCompiler<
  VariableStatement
  > {
  public readonly kind: SyntaxKind = SyntaxKind.VariableStatement;

  public visitNode(sb: ScriptBuilder, node: VariableStatement, options: VisitOptions): void {
    sb.visit(node.getDeclarationList(), options);
  }
}
