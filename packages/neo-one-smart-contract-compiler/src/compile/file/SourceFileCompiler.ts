import { SourceFile, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SourceFileCompiler extends NodeCompiler<
  SourceFile
  > {
  public readonly kind: SyntaxKind = SyntaxKind.SourceFile;

  public visitNode(sb: ScriptBuilder, node: SourceFile, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.processStatements({ createScope: false }));
  }
}
