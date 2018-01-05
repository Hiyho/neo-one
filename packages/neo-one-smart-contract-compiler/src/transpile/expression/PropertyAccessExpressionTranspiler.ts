import { PropertyAccessExpression, TypeGuards } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class PropertyAccessExpressionTranspiler
  extends Transpiler<ts.Expression, PropertyAccessExpression> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.PropertyAccessExpression;

  public transpile(
    context: TranspilerContext,
    node: PropertyAccessExpression,
  ): ts.Expression | undefined {
    if (context.isVerifySender(node)) {
      return context.createNEOPropertyAccess(context.internalNEO.checkWitness);
    }

    if (context.isNotify(node)) {
      return context.createNEOPropertyAccess(context.internalNEO.notify);
    }

    if (context.isGetCurrentTransaction(node)) {
      return context.createNEOPropertyAccess(context.internalNEO.getCurrentTransaction);
    }

    if (context.isGetCurrentTime(node)) {
      return context.createNEOPropertyAccess(context.internalNEO.getCurrentTime);
    }

    const expr = node.getExpression();
    if (TypeGuards.isThisExpression(expr) || TypeGuards.isSuperExpression(expr)) {
      const symbol = context.getSymbol(node);
      if (symbol != null) {
        const declarations = symbol.getDeclarations();
        if (declarations.length === 1) {
          const declaration = declarations[0];
          if (context.isGetContract(node)) {
            return context.createNEOCall({ method: context.internalNEO.getCurrentContract });
          } else if (TypeGuards.isMethodDeclaration(declaration)) {
            context.transpile(declaration);
            return context.createIdentifier(declaration);
          } else if (
            context.isDerivedSmartContract(expr) &&
            TypeGuards.isPropertyDeclaration(declaration)
          ) {
            const type = context.getTypeOfSymbol(symbol, node);
            const transpiled = context.transpileType(node, type);
            if (transpiled != null) {
              return context.createGetStorage({
                prefix: node.getName(),
                type: context.getTypeNodeFromType(transpiled),
              });
            }
          }
        }
      }
    }

    return context.visitChildren(node);
  }
}
