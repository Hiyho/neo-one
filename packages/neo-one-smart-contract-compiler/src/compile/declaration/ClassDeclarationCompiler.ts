import { ClassDeclaration, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ClassDeclarationCompiler extends NodeCompiler<
  ClassDeclaration
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ClassDeclaration;

  public visitNode(sb: ScriptBuilder, decl: ClassDeclaration, outerOptions: VisitOptions): void {
    const name = sb.scope.add(decl.getNameOrThrow());
    const baseClass = decl.getBaseClass();
    /* Create constructor function */
    // [fobj]
    sb.emitHelper(decl, sb.pushValueOptions(outerOptions), sb.helpers.createFunctionObjectBase({
      property: 'construct',
      body: () => {
        sb.withScope(decl, outerOptions, (options) => {
          // [argsarr]
          const ctorImpl = decl.getConstructors().find((ctor) => ctor.isImplementation());
          // Default value assignments
          if (ctorImpl != null) {
            // []
            sb.emitHelper(ctorImpl, sb.pushValueOptions(options), sb.helpers.parameters);
          }
          // Super call statement
          if (ctorImpl == null && baseClass != null) {
            // [thisoarr, argsarr]
            sb.scope.getThis(sb, decl, sb.pushValueOptions(options));
            // [thisoarr, thisoarr, argsarr]
            sb.emitOp(decl, 'DUP');
            // ['prototype', thisoarr, thisoarr, argsarr]
            sb.emitPushString(decl, 'prototype');
            // [prototype, thisoarr, argsarr]
            sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.getPropertyObjectProperty);
            // ['prototype', prototype, thisoarr, argsarr]
            sb.emitPushString(decl, 'prototype');
            // [prototype, thisoarr, argsarr]
            sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.getPropertyObjectProperty);
            // ['constructor', prototype, thisoarr, argsarr]
            sb.emitPushString(decl, 'constructor');
            // [ctor, thisoarr, argsarr]
            sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.getPropertyObjectProperty);
            // ['construct', ctor, thisoarr, argsarr]
            sb.emitPushString(decl, 'construct');
            // [farr, thisoarr, argsarr]
            sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.getInternalObjectProperty);
            // [farr, argsarr]
            sb.emitHelper(decl, sb.pushValueOptions(options), sb.helpers.bindFunctionThis({ overwrite: true }));
            // []
            sb.emitHelper(decl, sb.noPushValueOptions(options), sb.helpers.call);
          } else if (ctorImpl == null) {
            // []
            sb.emitOp(decl, 'DROP');
          }
          // Parameter property assignments
          // Member variable assignments
          // [this]
          sb.scope.getThis(sb, decl, sb.pushValueOptions(options));
          decl.getInstanceProperties()
            .filter(TypeGuards.isPropertyDeclaration)
            .forEach((property) => {
              const initializer = property.getInitializer();
              if (initializer != null) {
                sb.emitOp(decl, 'DUP');
                // [prop, this, this]
                sb.emitPushString(initializer, property.getName());
                // [init, prop, this, this]
                sb.visit(initializer, sb.pushValueOptions(options));
                // [this]
                sb.emitHelper(initializer, options, sb.helpers.setPropertyObjectProperty);
              }
            });
          // []
          sb.emitOp(decl, 'DROP');
          // Constructor statements
          if (ctorImpl != null) {
            sb.visit(ctorImpl.getBodyOrThrow(), sb.noPushValueOptions(options));
          }
        });
      },
    }));

    /* Create prototype */
    // [fobj, fobj]
    sb.emitOp(decl, 'DUP');
    // ['prototype', fobj, fobj]
    sb.emitPushString(decl, 'prototype');
    // [fobj, 'prototype', fobj, fobj]
    sb.emitOp(decl, 'OVER');
    // [oarr, fobj, 'prototype', fobj, fobj]
    sb.emitHelper(decl, sb.pushValueOptions(outerOptions), sb.helpers.createObject);
    // [oarr, fobj, oarr, 'prototype', fobj, fobj]
    sb.emitOp(decl, 'TUCK');
    // ['constructor', oarr, fobj, oarr, 'prototype', fobj, fobj]
    sb.emitPushString(decl, 'constructor');
    // [fobj, 'constructor', oarr, oarr, 'prototype', fobj, fobj]
    sb.emitOp(decl, 'ROT');
    // [oarr, 'prototype', fobj, fobj]
    sb.emitHelper(decl, sb.noPushValueOptions(outerOptions), sb.helpers.setPropertyObjectProperty);
    decl.getInstanceMethods().forEach((method) => {
      if (method.isImplementation()) {
        // [oarr, oarr, 'prototype', fobj, fobj]
        sb.emitOp(method, 'DUP');
        // [name, oarr, oarr, 'prototype', fobj, fobj]
        sb.emitPushString(method, method.getName());
        // [func, name, oarr, oarr, 'prototype', fobj, fobj]
        sb.emitHelper(method, sb.pushValueOptions(outerOptions), sb.helpers.createFunctionObject);
        // [oarr, 'prototype', fobj, fobj]
        sb.emitHelper(method, sb.noPushValueOptions(outerOptions), sb.helpers.setPropertyObjectProperty);
      }
    });

    /* Set superclass prototype */
    if (baseClass != null) {
      // [oarr, oarr, 'prototype', fobj, fobj]
      sb.emitOp(baseClass, 'DUP');
      // ['prototype', oarr, oarr, 'prototype', fobj, fobj]
      sb.emitPushString(baseClass, 'prototype');
      // [superoarr, 'prototype', oarr, oarr, 'prototype', fobj, fobj]
      sb.scope.get(sb, baseClass, sb.pushValueOptions(outerOptions), baseClass.getNameOrThrow());
      // ['prototype', superoarr, 'prototype', oarr, oarr, 'prototype', fobj, fobj]
      sb.emitPushString(baseClass, 'prototype');
      // [superprototype, 'prototype', oarr, oarr, 'prototype', fobj, fobj]
      sb.emitHelper(baseClass, sb.pushValueOptions(outerOptions), sb.helpers.getPropertyObjectProperty);
      // [oarr, 'prototype', fobj, fobj]
      sb.emitHelper(baseClass, sb.noPushValueOptions(outerOptions), sb.helpers.setPropertyObjectProperty);
    }

    // [fobj]
    sb.emitHelper(decl, sb.noPushValueOptions(outerOptions), sb.helpers.setPropertyObjectProperty);
    // []
    sb.scope.set(sb, decl, outerOptions, name);
  }
}
