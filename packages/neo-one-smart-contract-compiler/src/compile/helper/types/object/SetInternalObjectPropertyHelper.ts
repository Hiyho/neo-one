import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { SetObjectPropertyHelperBase } from './SetObjectPropertyHelperBase';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetInternalObjectPropertyHelper extends SetObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getInternalObject;
  }
}
