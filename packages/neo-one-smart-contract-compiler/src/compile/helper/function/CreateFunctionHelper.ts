import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface CreateFunctionHelperOptions {
  body: () => void;
}

// Input: []
// Output: [farr]
export class CreateFunctionHelper extends Helper<Node> {
  private body: () => void;

  constructor({ body }: CreateFunctionHelperOptions) {
    super();
    this.body = body;
  }

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      /* create function */
      // [2]
      sb.emitPushInt(node, 2);
      // [arr]
      sb.emitOp(node, 'NEWARRAY');
      // [arr, arr]
      sb.emitOp(node, 'DUP');
      // [1, arr, arr]
      sb.emitPushInt(node, 1);
      // [scopes, 1, arr, arr]
      sb.scope.pushAll(sb, node, options);
      // [arr]
      sb.emitOp(node, 'SETITEM');
      // [arr, arr]
      sb.emitOp(node, 'DUP');
      // [0, arr, arr]
      sb.emitPushInt(node, 0);
      // [target, 0, arr, arr]
      sb.emitHelper(node, options, sb.helpers.function({ body: this.body }));
      // [arr]
      sb.emitOp(node, 'SETITEM');
    }
  }
}
