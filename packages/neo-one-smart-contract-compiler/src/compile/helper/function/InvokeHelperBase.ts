import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { FuncProperty, InternalFunctionProperties } from '.';

export interface InvokeHelperBaseOptions {
  bindThis?: boolean;
  overwriteThis?: boolean;
  noArgs?: boolean;
}

// Input: [objectVal, ?val, ?argsarray]
// Output: [val]
export abstract class InvokeHelperBase extends Helper {
  protected abstract property: FuncProperty;
  private bindThis: boolean;
  private overwriteThis: boolean;
  private noArgs: boolean;

  constructor(options: InvokeHelperBaseOptions = { bindThis: false, noArgs: false }) {
    super();
    this.bindThis = options.bindThis || false;
    this.overwriteThis = options.overwriteThis || false;
    this.noArgs = options.noArgs || false;
  }

  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const bindThis = this.bindThis || this.property === InternalFunctionProperties.CONSTRUCT;
    const overwriteThis = this.overwriteThis || this.property === InternalFunctionProperties.CONSTRUCT;
    if (this.property === InternalFunctionProperties.CONSTRUCT) {
      // [val, objectVal, ?argsarray]
      sb.emitHelper(node, options, sb.helpers.createObject);
      if (this.noArgs) {
        // [val, objectVal, val]
        sb.emitOp(node, 'TUCK');
      } else {
        // [3, val, objectVal, argsarray]
        sb.emitPushInt(node, 3);
        // [val, objectVal, argsarray, val]
        sb.emitOp(node, 'XTUCK');
      }
      // [objectVal, val, ?argsarray, val]
      sb.emitOp(node, 'SWAP');
    }
    // ['call', objectVal, ?val, ?argsarray]
    sb.emitPushString(node, this.property);
    // [func, ?val, ?argsarray]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    if (bindThis) {
      // [func, ?argsarray]
      sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: overwriteThis }));
    }
    if (this.noArgs) {
      // [0, func]
      sb.emitPushInt(node, 0);
      // [argsarray, func]
      sb.emitOp(node, 'NEWARRAY');
      // [func, argsarray]
      sb.emitOp(node, 'SWAP');
    }
    // [val, ?val]
    sb.emitHelper(node, optionsIn, sb.helpers.call);

    if (this.property === InternalFunctionProperties.CONSTRUCT) {
      // [val]
      sb.emitOp(node, 'DROP');
    }
  }
}
