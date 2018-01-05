import {
  BYTECODE_TO_BYTECODE_BUFFER,
  OPCODE_TO_BYTECODE,
  ByteCode,
  OpCode,
  UnknownOpError,
  utils,
} from '@neo-one/client-core';
import BN from 'bn.js';
import { Node, SourceFile, Type } from 'ts-simple-ast';

import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { Helper, Helpers, createHelpers } from '../helper';
import { JumpTable } from './JumpTable';
import { DeferredProgramCounter, ProgramCounterHelper, ProgramCounter } from '../pc';
import { NodeCompiler } from '../NodeCompiler';
import { Scope } from '../scope';
import { Bytecode, CaptureResult, ScriptBuilder } from './ScriptBuilder';
import { VisitOptions } from '../types';

import declarations from '../declaration';
import decorator from '../decorator';
import expression from '../expression';
import file from '../file';
import statement from '../statement';

const compilers = [
  declarations,
  decorator,
  expression,
  file,
  statement,
];

interface Compilers {
  [kind: number]: NodeCompiler<any>;
}

export abstract class BaseScriptBuilder<TScope extends Scope> implements ScriptBuilder {
  public readonly jumpTable: JumpTable = new JumpTable();
  public readonly helpers: Helpers;
  private currentScope: TScope | undefined;
  private readonly compilers: Compilers;
  private bytecode: Bytecode;
  private pc: number;
  private jumpTablePC: DeferredProgramCounter = new DeferredProgramCounter();
  private capturedBytecode: Bytecode | undefined = undefined;
  private readonly nodes: Map<Node, number> = new Map();

  constructor(private readonly context: Context) {
    this.bytecode = [];
    this.pc = 0;
    this.helpers = createHelpers();
    this.currentScope = undefined;
    this.compilers = (compilers as Array<Array<new () => NodeCompiler<any>>>)
      .reduce((acc, kindCompilers) => acc.concat(kindCompilers), [])
      .reduce(
        (acc, KindCompiler) => {
          const kindCompiler = new KindCompiler();
          if (acc[kindCompiler.kind] != null) {
            throw new Error(
              `Found duplicate compiler for kind ${kindCompiler.kind}`,
            );
          }

          acc[kindCompiler.kind] = kindCompiler;
          return acc;
        },
        {} as Compilers,
    );
  }

  get scope(): TScope {
    if (this.currentScope == null) {
      throw new Error('Scope has not been set');
    }
    return this.currentScope;
  }

  public process(sourceFile: SourceFile, onVisited?: () => void): void {
    const { bytecode } = this.capture(() => {
      this.currentScope = this.createScope(sourceFile, 0, undefined);
      const options = {};
      this.currentScope.emit(this, sourceFile, options, (innerOptions) => {
        // [globalObjectVal]
        this.emitHelper(sourceFile, this.pushValueOptions(options), this.helpers.createGlobalObject);
        // []
        this.scope.setGlobal(this, sourceFile, options);
        this.visit(sourceFile, innerOptions);
        if (onVisited != null) {
          onVisited();
        }
      });
    });

    this.withProgramCounter((pc) => {
      this.emitJump(sourceFile, 'JMP', pc.getLast());
      this.jumpTablePC.setPC(pc.getCurrent());
      this.jumpTable.emitTable(this, sourceFile);
    });
    this.emitBytecode(bytecode);
  }

  public getFinalBytecode(): Buffer {
    let pc = 0;
    const buffers = this.bytecode.map(([_, value]) => {
      if (value instanceof ProgramCounter) {
        const offsetPC = new BN(value.getPC()).sub(new BN(pc)).add(new BN(1));
        // @ts-ignore
        const jumpPC = offsetPC.toTwos(16);
        pc += 2;
        return jumpPC.toArrayLike(Buffer, 'le', 2);
      }

      pc += value.length;
      return value;
    }) as Buffer[];

    return Buffer.concat(buffers);
  }

  public visit(node: Node, options: VisitOptions): void {
    const compiler = this.compilers[node.compilerNode.kind];
    if (compiler == null) {
      this.reportUnsupported(node);
    } else {
      compiler.visitNode(this, node, options);
    }
  }

  public withScope(node: Node, options: VisitOptions, func: (options: VisitOptions) => void): void {
    let index = this.nodes.get(node);
    if (index == null) {
      index = 0;
    } else {
      index += 1;
    }

    this.nodes.set(node, index);

    const currentScope = this.currentScope;
    this.currentScope = this.createScope(node, index, currentScope);
    this.currentScope.emit(this, node, options, func);
    this.currentScope = currentScope;
  }

  public withProgramCounter(func: (pc: ProgramCounterHelper) => void): void {
    const pc = new ProgramCounterHelper(() => this.pc);
    func(pc);
    pc.setLast();
  }

  public emitOp(node: Node, code: OpCode, buffer?: Buffer | null | undefined): void {
    const bytecode = OPCODE_TO_BYTECODE[code];
    if (bytecode == null) {
      throw new UnknownOpError(code);
    }
    this.emitOpByte(node, bytecode, buffer);
  }

  public emitPushInt(node: Node, valueIn: number | BN): void {
    const value = new BN(valueIn);
    if (value.eq(utils.NEGATIVE_ONE)) {
      return this.emitOp(node, 'PUSHM1');
    } else if (value.eq(utils.ZERO)) {
      // TODO: Empty byte breaks equality with 0. Not sure if it's a bug in the vm or
      //       we need to explicitly push a buffer with one 0 byte rather than PUSH0
      // this.emitOp(node, 'PUSH0');
      return this.emitPush(node, utils.toSignedBuffer(value));
    } else if (value.gt(utils.ZERO) && value.lt(utils.SIXTEEN)) {
      return this.emitOpByte(
        node,
        OPCODE_TO_BYTECODE.PUSH1 - 1 + value.toNumber(),
      );
    }

    return this.emitPush(node, utils.toSignedBuffer(value));
  }

  public emitPushBoolean(node: Node, value: boolean): void {
    this.emitOp(node, value ? 'PUSH1' : 'PUSH0');
  }

  public emitPushString(node: Node, value: string): void {
    return this.emitPush(node, this.toBuffer(value));
  }

  public emitJump(node: Node, code: 'JMP' | 'JMPIF' | 'JMPIFNOT', pc: ProgramCounter): void {
    this.emitOp(node, code);
    this.emitPC(node, pc);
  }

  public emitHelper<T extends Node>(node: T, options: VisitOptions, helper: Helper<T>): void {
    helper.emit(this, node, options);
  }

  public emitBytecode(bytecode: Bytecode): void {
    const pc = this.pc;
    bytecode.forEach(([node, code]) => {
      if (code instanceof ProgramCounter) {
        if (code.equals(this.jumpTablePC)) {
          this.emitPC(node, code);
        } else {
          this.emitPC(node, code.plus(pc));
        }
      } else {
        this.emit(node, code);
      }
    });
  }

  public emitCall(node: Node): void {
    this.emitOp(node, 'CALL');
    this.emitPC(node, this.jumpTablePC);
  }

  public capture(func: () => void): CaptureResult {
    const originalCapturedBytecode = this.capturedBytecode;
    this.capturedBytecode = [];
    const originalPC = this.pc;
    this.pc = 0;
    func();
    const capturedBytecode = this.capturedBytecode;
    this.capturedBytecode = originalCapturedBytecode;
    const capturedLength = this.pc;
    this.pc = originalPC;
    return { length: capturedLength, bytecode: capturedBytecode };
  }

  public toBuffer(value: string): Buffer {
    return Buffer.from(value, 'utf8');
  }

  public plainOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: false, setValue: false, catchPC: undefined };
  }

  public pushValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: true };
  }

  public noPushValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: false };
  }

  public setValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, setValue: true };
  }

  public noSetValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, setValue: false };
  }

  public noValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: false, setValue: false };
  }

  public breakPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, breakPC: pc };
  }

  public continuePCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, continuePC: pc };
  }

  public catchPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, catchPC: pc };
  }

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.context.reportError(node, message, code);
  }

  public reportUnsupported(node: Node): void {
    this.context.reportUnsupported(node);
  }

  public reportExpectedTranspiled(node: Node): void {
    this.context.reportExpectedTranspiled(node);
  }

  public getType(node: Node): Type | undefined {
    return this.context.getType(node);
  }

  public checkNumber(node: Node, type: Type | undefined): void {
    this.context.checkNumber(node, type);
  }

  public checkString(node: Node, type: Type | undefined): void {
    this.context.checkString(node, type);
  }

  public assertUnreachable(value: never): never {
    throw new Error('Should not be reached.');
  }

  public assertNotNull<T>(value: T | undefined | null): T {
    return this.context.assertNotNull(value);
  }

  protected abstract createScope(node: Node, index: number, parent: TScope | undefined): TScope;

  private emitPush(node: Node, value: Buffer): void {
    if (value.length <= OPCODE_TO_BYTECODE.PUSHBYTES75) {
      this.emitOpByte(node, value.length, value);
    } else if (value.length < 0x100) {
      this.emitOp(node, 'PUSHDATA1');
      this.emitUInt8(node, value.length);
      this.emit(node, value);
    } else if (value.length < 0x10000) {
      this.emitOp(node, 'PUSHDATA2');
      this.emitUInt16LE(node, value.length);
      this.emit(node, value);
      // TODO: Check this condition if (data.Length < 0x100000000L)
    } else {
      this.emitOp(node, 'PUSHDATA4');
      this.emitUInt32LE(node, value.length);
      this.emit(node, value);
    }
  }

  private emitUInt8(node: Node, value: number): void {
    const buff = Buffer.allocUnsafe(1);
    buff.writeUInt8(value, 0);
    this.emit(node, buff);
  }

  private emitUInt16LE(node: Node, value: number): void {
    const buff = Buffer.allocUnsafe(2);
    buff.writeUInt16LE(value, 0);
    this.emit(node, buff);
  }

  private emitUInt32LE(node: Node, value: number): void {
    const buff = Buffer.allocUnsafe(4);
    buff.writeUInt32LE(value, 0);
    this.emit(node, buff);
  }

  private emitOpByte(node: Node, byteCodeIn: ByteCode | null, buffer?: Buffer | null | undefined): void {
    const byteCode = `${byteCodeIn == null ? '' : byteCodeIn}`;
    const byteCodeBuffer = BYTECODE_TO_BYTECODE_BUFFER[byteCode];
    if (byteCodeBuffer == null) {
      throw new UnknownOpError(byteCode);
    }
    this.emit(node, byteCodeBuffer);
    this.emit(node, buffer);
  }

  private emit(node: Node, buffer: Buffer | null | undefined): void {
    if (buffer != null) {
      this.push(node, buffer);
      this.pc += buffer.length;
    }
  }

  private emitPC(node: Node, pc: ProgramCounter): void {
    this.push(node, pc);
    this.pc += 2;
  }

  private push(node: Node, value: Buffer | ProgramCounter): void {
    if (this.capturedBytecode != null) {
      this.capturedBytecode.push([node, value]);
    } else {
      this.bytecode.push([node, value]);
    }
  }
}
