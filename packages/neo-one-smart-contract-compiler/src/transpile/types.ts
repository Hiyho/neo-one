import { ABI } from '@neo-one/client';
import AST, { SourceFile } from 'ts-simple-ast';

export interface TranspileResult {
  ast: AST;
  sourceFile: SourceFile;
  abi: ABI;
}
