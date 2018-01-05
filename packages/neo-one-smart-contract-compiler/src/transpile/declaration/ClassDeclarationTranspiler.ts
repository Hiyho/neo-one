import { ClassDeclaration, SyntaxKind } from 'ts-simple-ast';

import { Transpiler } from '../Transpiler';
import { TranspilerContext } from '../TranspilerContext';

export class ClassDeclarationTranspiler extends Transpiler<
  ts.ClassDeclaration,
  ClassDeclaration
  > {
  public readonly kind: SyntaxKind = SyntaxKind.ClassDeclaration;

  public transpile(context: TranspilerContext, node: ClassDeclaration): ts.ClassDeclaration | undefined {
    if (context.isDerivedEvent(node)) {
      const constructors = node.getConstructors();
      if (constructors.length === 0) {
        return undefined;
      } else if (constructors.length === 1) {
        const constructor = constructors[0];
        if (constructor.getParameters().every(
          (parameter) =>
            parameter.isParameterProperty() &&
            parameter.isReadonly() &&
            parameter.hasModifier(SyntaxKind.PrivateKeyword) &&
            context.isValidValueType(parameter, context.getType(parameter)),
        )) {
          return undefined;
        }
      }
    }

    context.reportUnsupported(node);
    return undefined;
  }
}
