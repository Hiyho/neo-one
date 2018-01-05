import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: []
// Output: [globalObjectVal]
export class CreateGlobalObjectHelper extends Helper<Node> {
  public emit(
    sb: ScriptBuilder,
    node: Node,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);

    // [globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addObjectObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addBooleanObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addNumberObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addStringObject);
    // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addSymbolObject);
    // // [objectPrototypeVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.addArrayObject);
    // [globalObjectVal]
    sb.emitOp(node, 'DROP');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
