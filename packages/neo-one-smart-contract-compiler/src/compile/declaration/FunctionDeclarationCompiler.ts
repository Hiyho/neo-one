import { FunctionDeclaration, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionDeclarationCompiler extends NodeCompiler<
  FunctionDeclaration
  > {
  public readonly kind: SyntaxKind = SyntaxKind.FunctionDeclaration;

  public visitNode(sb: ScriptBuilder, decl: FunctionDeclaration, options: VisitOptions): void {
    const name = sb.scope.add(decl.getName());
    sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.createFunctionObject);
    sb.scope.set(sb, decl, options, name);
  }
}
