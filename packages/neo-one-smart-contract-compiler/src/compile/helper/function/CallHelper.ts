import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export class CallHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // Push the scopes and this to the alt stack
    // [func, func]
    sb.emitOp(node, 'DUP');
    // [func, func, func]
    sb.emitOp(node, 'DUP');
    // [1, func, func, func]
    sb.emitPushInt(node, 1);
    // [[scopes, this], func, func]
    sb.emitOp(node, 'PICKITEM');
    // [[scopes, this], func, func]
    sb.emitHelper(node, options, sb.helpers.cloneArray);
    // [[scopes, this], [scopes, this], func, func]
    sb.emitOp(node, 'DUP');
    // [[scopes, this], [scopes, this], [scopes, this], func, func]
    sb.emitOp(node, 'DUP');
    // [0, [scopes, this], [scopes, this], [scopes, this], func, func]
    sb.emitPushInt(node, 0);
    // [scopes, [scopes, this], [scopes, this], func, func]
    sb.emitOp(node, 'PICKITEM');
    // [0, scopes, [scopes, this], [scopes, this], func, func]
    sb.emitPushInt(node, 0);
    // [scopes, 0, [scopes, this], [scopes, this], func, func]
    sb.emitOp(node, 'SWAP');
    // [[scopes, this], func, func]
    sb.emitOp(node, 'SETITEM');
    // [func, [scopes, this], func]
    sb.emitOp(node, 'ROT');
    // [[scopes, this], func]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, [scopes, this], func]
          sb.emitOp(node, 'ARRAYSIZE');
          // [3, size, [scopes, this], func]
          sb.emitPushInt(node, 3);
          // [hasThis, [scopes, this], func]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [func, [scopes, this]]
          sb.emitOp(node, 'SWAP');
          // [func, [scopes, this], func]
          sb.emitOp(node, 'TUCK');
          // [2, func, [scopes, this], func]
          sb.emitPushInt(node, 2);
          // [this, [scopes, this], func]
          sb.emitOp(node, 'PICKITEM');
          // [[scopes, this], this, func]
          sb.emitOp(node, 'SWAP');
          // [[scopes, this], this, [scopes, this], func]
          sb.emitOp(node, 'TUCK');
          // [1, [scopes, this], this, [scopes, this], func]
          sb.emitPushInt(node, 1);
          // [this, 1, [scopes, this], [scopes, this], func]
          sb.emitOp(node, 'ROT');
          // [[scopes, this], func]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );

    // [func]
    sb.emitOp(node, 'TOALTSTACK');

    // Push the target on the stack
    sb.emitPushInt(node, 0);
    sb.emitOp(node, 'PICKITEM');

    // Call function
    sb.emitCall(node);

    // Remove scope
    sb.emitOp(node, 'FROMALTSTACK');
    sb.emitOp(node, 'DROP');

    if (options.pushValue) {
      sb.emitOp(node, 'DUP');
    }
    sb.emitHelper(node, options, sb.helpers.handleCompletion);
    if (options.pushValue) {
      sb.emitHelper(node, options, sb.helpers.getCompletionVal);
    }
  }
}
