import { MethodDeclaration, Statement } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class MethodDeclarationTranspiler extends Transpiler<ts.MethodDeclaration, MethodDeclaration> {
  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.MethodDeclaration;

  public transpile(context: TranspilerContext, node: MethodDeclaration): ts.MethodDeclaration | undefined {
    if (node.isAbstract()) {
      return undefined;
    }

    const returnType = context.transpileType(node, node.getReturnType());
    context.addFunction({
      name: context.getName(node),
      statements: node.getStatements() as Statement[],
      parameters: node.getParameters(),
      returnType: returnType == null
        ? undefined
        : context.getText(context.getTypeNodeFromType(returnType)),
    });
    return undefined;
  }
}
