import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [stringProp, objectVal]
// Output: [val]
export abstract class GetObjectPropertyHelperBase extends Helper<Node> {

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');
      return;
    }

    // [oarr, prop]
    sb.emitOp(node, 'SWAP');
    // [obj, prop]
    sb.emitHelper(node, options, this.getObject(sb));
    // [obj, prop, obj]
    sb.emitOp(node, 'TUCK');
    // [obj, prop, obj, obj]
    sb.emitOp(node, 'TUCK');
    // [prop, obj, obj, obj]
    sb.emitOp(node, 'SWAP');
    // [3, prop, obj, obj, obj]
    sb.emitPushInt(node, 4);
    // [prop, obj, obj, obj, prop]
    sb.emitOp(node, 'XTUCK');

    // TODO: This is broken for symbol property inheritance.
    sb.emitHelper(node, options, sb.helpers.forLoop({
      condition: () => {
        // [hasKey, obj, obj, prop]
        sb.emitOp(node, 'HASKEY');
        // [notHasKey, obj, obj, prop]
        sb.emitOp(node, 'NOT');
        // [obj, notHasKey, obj, prop]
        sb.emitOp(node, 'SWAP');
        // ['prototype', obj, notHasKey, obj, prop]
        sb.emitPushString(node, 'prototype');
        // [hasPrototypeKey, notHasKey, obj, prop]
        sb.emitOp(node, 'HASKEY');
        // [condition, obj, prop]
        sb.emitOp(node, 'AND');
      },
      each: () => {
        // ['prototype', obj, prop]
        sb.emitPushString(node, 'prototype');
        // [oarr, prop]
        sb.emitOp(node, 'PICKITEM');
        // [obj, prop]
        sb.emitHelper(node, options, this.getObject(sb));
        // [obj, prop, obj]
        sb.emitOp(node, 'TUCK');
        // [obj, prop, obj, obj]
        sb.emitOp(node, 'TUCK');
        // [prop, obj, obj, obj]
        sb.emitOp(node, 'SWAP');
        // [3, prop, obj, obj, obj]
        sb.emitPushInt(node, 4);
        // [prop, obj, obj, obj, prop]
        sb.emitOp(node, 'XTUCK');
      },
      withScope: false,
    }));
    // [obj, prop, obj]
    sb.emitOp(node, 'TUCK');
    // [prop, obj, prop, obj]
    sb.emitOp(node, 'OVER');
    // [value]
    sb.emitHelper(node, options, sb.helpers.if({
      condition: () => {
        // [hasKey, prop, obj]
        sb.emitOp(node, 'HASKEY');
      },
      whenTrue: () => {
        // [value]
        sb.emitOp(node, 'PICKITEM');
      },
      whenFalse: () => {
        // [obj]
        sb.emitOp(node, 'DROP');
        // []
        sb.emitOp(node, 'DROP');
        // [undefined]
        sb.emitHelper(node, options, sb.helpers.createUndefined);
      },
    }));
  }

  protected abstract getObject(sb: ScriptBuilder): Helper<Node>;
}
