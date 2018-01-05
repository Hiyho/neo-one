import { FunctionDeclaration, ParameterDeclaration, Statement, TypeGuards, SyntaxKind, ts } from 'ts-simple-ast';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

import * as utils from '../../utils';

export class FunctionDeclarationTranspiler extends Transpiler<
  ts.FunctionDeclaration,
  FunctionDeclaration
  > {
  public readonly kind: SyntaxKind = SyntaxKind.FunctionDeclaration;

  public transpile(context: TranspilerContext, node: FunctionDeclaration): ts.FunctionDeclaration | undefined {
    const statements = node.getStatements().map((statement) => context.transpile(statement as Statement))
      .filter(utils.notNull);
    const name = context.getName(node);
    const parameters = node.getParameters()
      .map((param) => context.transpile(param as ParameterDeclaration))
      .filter(utils.notNull);
    const returnType = context.transpileType(node, node.getReturnType());
    const returnTypeNode = returnType == null
      ? undefined
      : context.getTypeNodeFromType(returnType);

    const parent = node.getParent();
    if (parent != null && TypeGuards.isSourceFile(parent)) {
      context.addFunction({
        name,
        parameters,
        statements,
        returnType: returnTypeNode == null ? undefined : context.getText(returnTypeNode),
      });
      return undefined;
    }

    return ts.createFunctionDeclaration(
      [], // decorators
      [], // modifiers
      undefined, // asteriskToken
      name, // name
      [], // typeParameters
      parameters, // parameters
      returnTypeNode,
      ts.createBlock(statements), // body
    );
  }
}
