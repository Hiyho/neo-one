import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Types } from '../Types';

// Input: []
// Output: [objectVal]
export class CreateObjectHelper extends Helper<Node> {
  private exoticSet: (() => void) | undefined;

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      let length = 3;
      if (this.exoticSet != null) {
        length += 1;
        this.exoticSet();
      }
      /* create internal object */
      // [iobj]
      sb.emitOp(node, 'NEWMAP');

      /* create symbol obj */
      // [sobj, iobj]
      sb.emitOp(node, 'NEWMAP');

      /* create obj */
      // [pobj, sobj, iobj]
      sb.emitOp(node, 'NEWMAP');

      // TODO: Consolidate with ShallowCloneObjectHelper
      /* create object array */
      // [3, pobj, sobj, iobj]
      sb.emitPushInt(node, length);
      // [object]
      sb.emitOp(node, 'PACK');

      // [objectType, object]
      sb.emitPushInt(node, Types.Object);

      /* create object */
      // [2, objectType, object]
      sb.emitPushInt(node, 2);
      // [objectVal]
      sb.emitOp(node, 'PACK');
    }
  }
}
