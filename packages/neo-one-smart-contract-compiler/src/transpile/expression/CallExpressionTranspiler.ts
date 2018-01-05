import { CallExpression, Expression, TypeGuards } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class CallExpressionTranspiler
  extends Transpiler<ts.Expression, CallExpression> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.CallExpression;

  public transpile(
    context: TranspilerContext,
    node: CallExpression,
  ): ts.Expression | undefined {
    const result = this.handleComplexStorage(context, node);
    if (result != null) {
      return result;
    }

    return context.visitChildren(node);
  }

  private handleComplexStorage(
    context: TranspilerContext,
    node: CallExpression,
  ): ts.Expression | undefined {
    const expr = node.getExpression();

    // this.foo.set()
    if (TypeGuards.isPropertyAccessExpression(expr)) {
      // this.foo
      const accessExpr = expr.getExpression();
      if (
        TypeGuards.isPropertyAccessExpression(accessExpr) &&
        context.isDerivedSmartContract(accessExpr.getExpression()) &&
        context.isStorageComplexType(accessExpr)
      ) {
        const prefix = expr.getName();
        const args = node.getArguments() as Expression[];
        if (args.length > 0) {
          let keys = context.transpile(args[0]);
          const keyType = context.getType(args[0]);
          if (keys != null && keyType != null) {
            if (!context.isArrayType(args[0], keyType)) {
              keys = ts.createArrayLiteral([keys]);
            }

            if (
              context.isMapStorageSet(expr) ||
              context.isSetStorageAdd(expr) ||
              context.isMapStorageDelete(expr) ||
              context.isSetStorageDelete(expr)
            ) {
              if (
                (args.length === 2 && context.isMapStorageSet(expr)) ||
                context.isSetStorageAdd(expr)
              ) {
                let value: ts.Expression | undefined;
                if (context.isMapStorageSet(expr)) {
                  value = context.transpile(args[1] as Expression);
                } else {
                  value = ts.createLiteral(true);
                }

                if (value != null) {
                  return context.createPutStorage({ prefix, keys, value });
                }
              } else if (
                context.isMapStorageDelete(expr) ||
                context.isSetStorageDelete(expr)
              ) {
                return context.createDeleteStorage({ prefix, keys });
              }
            } else if (
              context.isMapStorageHas(expr) ||
              context.isSetStorageHas(expr) ||
              context.isMapStorageGet(expr)
            ) {
              let type: ts.Type | undefined;
              if (context.isMapStorageGet(expr)) {
                type = context.getMapStorageValueType(accessExpr);
              } else {
                type = context.getBooleanType();
              }

              if (type != null) {
                return context.createGetStorage({
                  prefix,
                  keys,
                  type: context.getTypeNodeFromType(type),
                });
              }
            }
          }
        }
      }
    }

    return undefined;
  }
}
