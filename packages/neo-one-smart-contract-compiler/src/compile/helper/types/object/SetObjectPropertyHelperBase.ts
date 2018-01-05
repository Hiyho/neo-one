import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [val, stringProp, objectVal]
// Output: []
export abstract class SetObjectPropertyHelperBase extends Helper<Node> {
  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [objectVal, value, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, value, stringProp]
    sb.emitHelper(node, sb.pushValueOptions(options), this.getObject(sb));
    // [stringProp, obj, value]
    sb.emitOp(node, 'ROT');
    // [value, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  protected abstract getObject(sb: ScriptBuilder): Helper<Node>;
}
