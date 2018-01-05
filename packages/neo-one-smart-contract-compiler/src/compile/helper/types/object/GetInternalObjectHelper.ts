import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { GetObjectHelperBase } from './GetObjectHelperBase';

// Input: [objectVal]
// Output: [iobj]
export class GetInternalObjectHelper extends GetObjectHelperBase {
  protected index = 2;
}
