import { InvocationResult } from '@neo-one/client-core';

import { checkResult } from './extractors';
import { executeScript } from '../../executeScript';
import { monitor } from './monitor';

export const executeString = async (
  code: string,
): Promise<InvocationResult> => {
  const result = await executeScript(monitor, code);
  checkResult(result);
  return result;
};
