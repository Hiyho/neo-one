import { InvokeHelperBase } from './InvokeHelperBase';
import { FuncProperty, InternalFunctionProperties } from './InternalFunctionProperties';

export class InvokeCallHelper extends InvokeHelperBase {
  protected property: FuncProperty = InternalFunctionProperties.CALL;
}
