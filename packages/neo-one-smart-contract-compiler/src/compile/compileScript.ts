import { CompileResult } from './types';
import { Context } from '../Context';

import { compile } from './compile';

export interface CompileScriptOptions {
  code: string;
  context?: Context | undefined;
}

export const compileScript = ({ code, context }: CompileScriptOptions): CompileResult => compile({ code, context });
