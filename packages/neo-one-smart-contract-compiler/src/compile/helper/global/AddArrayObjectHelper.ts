import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';
import { InternalFunctionProperties } from '..';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddArrayObjectHelper extends AddConstructorObjectHelper {
  protected name: string = 'Array';

  protected addConstructorProperties(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [objectVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');
    // ['construct', objectVal, objectVal, globalObjectVal]
    sb.emitPushString(node, InternalFunctionProperties.CONSTRUCT);
    // [func, 'construct', objectVal, objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.createFunction({
      body: () => {
        // Drop the argsarray TODO: This seems easy to mess up.
        // []
        sb.emitOp(node, 'DROP');
        // [objectVal]
        sb.scope.getThis(sb, node, options);
        // [objectVal, objectVal]
        sb.emitOp(node, 'DUP');
        // [objectVal]
        sb.emitHelper(node, options, sb.helpers.addDataArray);
        // [objectVal, objectVal]
        sb.emitOp(node, 'DUP');
        // ['length', objectVal, objectVal]
        sb.emitPushString(node, 'length');
        // [0, 'length', objectVal, objectVal]
        sb.emitPushInt(node, 0);
        // [lengthVal, 'length', objectVal, objectVal]
        sb.emitHelper(node, options, sb.helpers.createNumber);
        // [objectVal]
        sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
        // []
        this.setInstancePrototype(sb, node, options);
      },
    }));
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
