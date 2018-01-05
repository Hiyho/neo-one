import { BinaryExpression, TypeGuards } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class BinaryExpressionTranspiler
  extends Transpiler<ts.Expression, BinaryExpression> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.BinaryExpression;

  public transpile(
    context: TranspilerContext,
    node: BinaryExpression,
  ): ts.Expression | undefined {
    const kind = node.getOperatorToken().getKind() as ts.BinaryOperator;

    switch (kind) {
      case ts.SyntaxKind.EqualsToken:
      case ts.SyntaxKind.PlusEqualsToken:
      case ts.SyntaxKind.MinusEqualsToken:
      case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      case ts.SyntaxKind.AsteriskEqualsToken:
      case ts.SyntaxKind.SlashEqualsToken:
      case ts.SyntaxKind.PercentEqualsToken:
      case ts.SyntaxKind.AmpersandEqualsToken:
      case ts.SyntaxKind.BarEqualsToken:
      case ts.SyntaxKind.CaretEqualsToken:
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        return this.visitAssignmentOperator(context, kind, node);
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.SlashToken:
      case ts.SyntaxKind.PercentToken:
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
      case ts.SyntaxKind.LessThanLessThanToken:
      case ts.SyntaxKind.LessThanToken:
      case ts.SyntaxKind.LessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanToken:
      case ts.SyntaxKind.GreaterThanEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.AmpersandToken:
      case ts.SyntaxKind.BarToken:
      case ts.SyntaxKind.CaretToken:
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      case ts.SyntaxKind.InKeyword:
      case ts.SyntaxKind.InstanceOfKeyword:
      case ts.SyntaxKind.CommaToken:
      case ts.SyntaxKind.AsteriskAsteriskToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        return context.visitChildren(node);
      default:
        context.assertUnreachable(kind);
        return context.visitChildren(node);
    }
  }

  public visitAssignmentOperator(
    context: TranspilerContext,
    kind: ts.AssignmentOperator,
    expr: BinaryExpression,
  ): ts.Expression | undefined {
    const left = expr.getLeft();
    const leftSymbol = context.getSymbol(left);
    if (
      leftSymbol != null &&
      TypeGuards.isPropertyAccessExpression(left) &&
      context.isDerivedSmartContract(left.getExpression())
    ) {
      const leftType = context.getTypeOfSymbol(leftSymbol, left);
      const transpiled = context.transpileType(left, leftType);
      const right = context.visitChildren(expr.getRight());
      if (transpiled != null && right != null) {
        const prefix = left.getName();
        const type = context.getTypeNodeFromType(transpiled);
        const getValue = context.createGetStorage({ prefix, type });
        switch (kind) {
          case ts.SyntaxKind.EqualsToken:
            return ts.createCommaList([
              context.createPutStorage({ prefix, value: right }),
              getValue,
            ]);
          default:
            return ts.createCommaList([
              context.createPutStorage({
                prefix,
                value: ts.createBinary(getValue, kind, right),
              }),
              getValue,
            ]);
        }
      }
    }

    return context.visitChildren(expr);
  }
}
