import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: []
// Output: [objectVal]
export class CreateArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [globalObjectVal]
      sb.scope.getGlobal(sb, node, options);
      // ['Array', globalObjectVal]
      sb.emitPushString(node, 'Array');
      // [Array]
      sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.invokeConstruct({ noArgs: true }));
    }
  }
}
