import { ObjectLiteralExpression, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ObjectLiteralExpressionCompiler extends NodeCompiler<
  ObjectLiteralExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ObjectLiteralExpression;

  public visitNode(sb: ScriptBuilder, expr: ObjectLiteralExpression, options: VisitOptions): void {
    sb.emitOp(expr, 'NEWMAP');
    expr.getProperties().forEach((prop) => {
      sb.emitOp(expr, 'DUP');
      if (
        TypeGuards.isPropertyAssignment(prop) ||
        TypeGuards.isShorthandPropertyAssignment(prop) ||
        TypeGuards.isMethodDeclaration(prop)
      ) {
        sb.emitPushString(prop, prop.getName());
        if (TypeGuards.isPropertyAssignment(prop)) {
          sb.visit(prop.getInitializerOrThrow(), sb.pushValueOptions(options));
        } else if (TypeGuards.isShorthandPropertyAssignment(prop)) {
          sb.visit(prop.getNameNode(), sb.pushValueOptions(options));
        } else if (TypeGuards.isMethodDeclaration(prop)) {
          sb.emitHelper(prop, sb.pushValueOptions(options), sb.helpers.createFunction);
        }
        sb.emitOp(prop, 'SETITEM');
      } else {
        sb.reportUnsupported(prop);
      }
    });

    if (!options.pushValue) {
      sb.emitOp(expr, 'DROP');
    }
  }
}
