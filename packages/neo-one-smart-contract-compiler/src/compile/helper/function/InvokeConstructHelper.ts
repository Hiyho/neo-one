import { InvokeHelperBase } from './InvokeHelperBase';
import { FuncProperty, InternalFunctionProperties } from './InternalFunctionProperties';

export class InvokeConstructHelper extends InvokeHelperBase {
  protected property: FuncProperty = InternalFunctionProperties.CONSTRUCT;
}
