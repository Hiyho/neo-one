import { Node, SignaturedDeclaration, StatementedNode, TypeGuards, BodiedNode, BodyableNode } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from './InternalFunctionProperties';

// Input: []
// Output: [objectVal]
export class CreateFunctionObjectHelper
  extends Helper<Node & StatementedNode & SignaturedDeclaration & (BodiedNode | BodyableNode)> {
  public emit(
    sb: ScriptBuilder,
    node: Node & StatementedNode & SignaturedDeclaration & (BodiedNode | BodyableNode),
    outerOptions: VisitOptions,
  ): void {
    sb.emitHelper(node, outerOptions, sb.helpers.createFunctionObjectBase({
      property: InternalFunctionProperties.CALL,
      body: () => {
        sb.withScope(node, outerOptions, (options) => {
          sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.parameters);
          let body;
          if (TypeGuards.isBodyableNode(node)) {
            body = node.getBodyOrThrow();
          } else {
            body = node.getBody();
          }
          if (TypeGuards.isExpression(body)) {
            // [val]
            sb.visit(body, sb.pushValueOptions(options));
            // [completion]
            sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createNormalCompletion);
            // [completion]
            sb.emitOp(node, 'RET');
          } else {
            sb.visit(body, sb.noPushValueOptions(options));
          }
        });
      },
    }));
  }
}
