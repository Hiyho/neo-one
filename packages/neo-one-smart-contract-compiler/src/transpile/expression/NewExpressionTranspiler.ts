import { Expression, NewExpression } from 'ts-simple-ast';

import * as ts from 'typescript';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

import * as utils from '../../utils';

export class NewExpressionTranspiler
  extends Transpiler<ts.Expression, NewExpression> {

  public readonly kind: ts.SyntaxKind = ts.SyntaxKind.NewExpression;

  public transpile(
    context: TranspilerContext,
    node: NewExpression,
  ): ts.Expression | undefined {
    const expr = node.getExpression();
    const symbol = context.getSymbol(expr);
    if (symbol != null && context.isDerivedEvent(expr)) {
      const name = symbol.getName();
      return context.createCastBufferArray(ts.createArrayLiteral(
        ([
          ts.createLiteral(`${name.charAt(0).toLowerCase()}${name.slice(1)}`),
        ] as ts.Expression[]).concat(
          node.getArguments()
            .map((argument) => context.transpile(argument as Expression))
            .filter(utils.notNull),
        ),
      ));
    }

    context.reportUnsupported(node);
    return undefined;
  }
}
