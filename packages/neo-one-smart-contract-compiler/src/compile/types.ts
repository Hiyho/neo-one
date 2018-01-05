import { Type, ts } from 'ts-simple-ast';

import { ProgramCounter } from './pc';

export interface VisitOptions {
  pushValue?: boolean | undefined;
  setValue?: boolean | undefined;
  catchPC?: ProgramCounter | undefined;
  breakPC?: ProgramCounter | undefined;
  continuePC?: ProgramCounter | undefined;
  switchExpressionType?: Type | undefined;
}

export interface CompileResult {
  code: Buffer;
  diagnostics: ts.Diagnostic[];
}
