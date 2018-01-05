import BN from 'bn.js';
import { Node, SourceFile, Type } from 'ts-simple-ast';
import { OpCode } from '@neo-one/client-core';

import { DiagnosticCode } from '../../DiagnosticCode';
import { Helpers, Helper } from '../helper';
import { JumpTable } from './JumpTable';
import { ProgramCounter, ProgramCounterHelper } from '../pc';
import { Scope } from '../scope';
import { VisitOptions } from '../types';

export type Bytecode = Array<[Node, Buffer | ProgramCounter]>;

export interface CaptureResult {
  length: number;
  bytecode: Bytecode;
}

export interface ScriptBuilder {
  scope: Scope;
  helpers: Helpers;
  jumpTable: JumpTable;
  process(node: SourceFile, onVisit?: () => void): void;
  visit(node: Node, options: VisitOptions): void;
  withScope(node: Node, options: VisitOptions, func: (options: VisitOptions) => void): void;
  withProgramCounter(func: (pc: ProgramCounterHelper) => void): void;
  emitOp(node: Node, code: OpCode): void;
  emitPushInt(node: Node, value: number | BN): void;
  emitPushBoolean(node: Node, value: boolean): void;
  emitPushString(node: Node, value: string): void;
  emitJump(node: Node, code: 'JMP' | 'JMPIF' | 'JMPIFNOT', pc: ProgramCounter): void;
  emitHelper<T extends Node>(node: T, options: VisitOptions, helper: Helper<T>): void;
  emitBytecode(bytecode: Bytecode): void;
  emitCall(node: Node): void;
  capture(func: () => void): CaptureResult;
  toBuffer(value: string): Buffer;
  plainOptions(options: VisitOptions): VisitOptions;
  pushValueOptions(options: VisitOptions): VisitOptions;
  noPushValueOptions(options: VisitOptions): VisitOptions;
  setValueOptions(options: VisitOptions): VisitOptions;
  noSetValueOptions(options: VisitOptions): VisitOptions;
  noValueOptions(options: VisitOptions): VisitOptions;
  breakPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  continuePCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  catchPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  reportError(node: Node, message: string, code: DiagnosticCode): void;
  reportUnsupported(node: Node): void;
  reportExpectedTranspiled(node: Node): void;
  getType(node: Node): Type | undefined;
  checkNumber(node: Node, type: Type | undefined): void;
  checkString(node: Node, type: Type | undefined): void;
  assertUnreachable(value: never): never;
  assertNotNull<T>(value: T | undefined | null): T;
}
