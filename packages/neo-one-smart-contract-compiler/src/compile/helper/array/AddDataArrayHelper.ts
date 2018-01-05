import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalArrayProperties } from './InternalArrayProperties';

// Input: [objectVal]
// Output: []
export class AddDataArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // ['DataArray', objectVal]
    sb.emitPushString(node, InternalArrayProperties.DATA_ARRAY);
    // [0, 'DataArray', objectVal]
    sb.emitPushInt(node, 0);
    // [arr, 'DataArray', objectVal]
    sb.emitOp(node, 'NEWARRAY');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
