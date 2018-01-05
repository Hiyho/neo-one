// tslint:disable max-line-length
import {
  ComputedPropertyName,
  Decorator,
  Node,
  QualifiedName,
  TypeParameterDeclaration,
  ParameterDeclaration,
  PropertyDeclaration,
  PropertySignature,
  PropertyName,
  MethodSignature,
  MethodDeclaration,
  ConstructorDeclaration,
  GetAccessorDeclaration,
  SetAccessorDeclaration,
  TypeReferenceNode,
  ArrayLiteralExpression,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  ElementAccessExpression,
  CallExpression,
  NewExpression,
  TaggedTemplateExpression,
  TypeAssertion,
  ParenthesizedExpression,
  FunctionExpression,
  ArrowFunction,
  DeleteExpression,
  TypeOfExpression,
  VoidExpression,
  AwaitExpression,
  PrefixUnaryExpression,
  PostfixUnaryExpression,
  BinaryExpression,
  ConditionalExpression,
  TemplateExpression,
  YieldExpression,
  SpreadElement,
  Expression,
  ExpressionWithTypeArguments,
  AsExpression,
  NonNullExpression,
  MetaProperty,
  TemplateSpan,
  Statement,
  VariableStatement,
  VariableDeclarationList,
  ExpressionStatement,
  IfStatement,
  DoStatement,
  WhileStatement,
  ForStatement,
  ForInStatement,
  ForOfStatement,
  ContinueStatement,
  BreakStatement,
  ReturnStatement,
  WithStatement,
  SwitchStatement,
  LabeledStatement,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  FunctionDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  CaseBlock,
  CaseClause,
  DefaultClause,
  CatchClause,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SpreadAssignment,
  EnumMember,
  PartiallyEmittedExpression,
  CommaListExpression,
} from 'ts-simple-ast';

import * as ts from 'typescript';

import { DiagnosticCode } from '../DiagnosticCode';

import * as utils from '../utils';

export interface VisitorContext {
  reportError(node: Node, message: string, code: DiagnosticCode): void;
}
export type Visitor = (node: Node) => VisitResult<ts.Node>;
export type VisitResult<T extends ts.Node> = T | T[] | undefined;

export function visitNode<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  node: T,
  visitor: Visitor | undefined,
  test?: (node: ts.Node) => boolean,
  lift?: (context: VisitorContext, input: Node, node: ts.NodeArray<ts.Node>) => TSNode,
): TSNode;

export function visitNode<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  node: T | undefined,
  visitor: Visitor | undefined,
  test?: (node: ts.Node) => boolean,
  lift?: (context: VisitorContext, input: Node, node: ts.NodeArray<ts.Node>) => TSNode | undefined,
): TSNode | undefined;

export function visitNode<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  node: T | undefined,
  visitor: Visitor | undefined,
  test?: (node: ts.Node) => boolean,
  lift?: (context: VisitorContext, input: Node, node: ts.NodeArray<ts.Node>) => TSNode | undefined,
): TSNode | undefined {
  if (node == null || visitor == null) {
    return node == null ? undefined : node.compilerNode;
  }

  const visited = visitor(node);
  if (visited === node.compilerNode) {
    return node.compilerNode;
  }

  let visitedNode: ts.Node | undefined;
  if (visited == null) {
    return undefined;
  } else if (Array.isArray(visited)) {
    const doLift = lift == null ? extractSingleNode : lift;
    // TODO: Fix me
    // @ts-ignore
    visitedNode = doLift(context, node, visited);
  } else {
    visitedNode = visited;
  }

  if (test != null && visitedNode != null && !test(visitedNode)) {
    context.reportError(
      node,
      'Invalid node found',
      DiagnosticCode.SOMETHING_WENT_WRONG,
    );
  }

  return visitedNode as TSNode;
}

function isExpression(node: ts.Node): node is ts.Expression {
  return (ts as any).isExpression(node);
}

function isParameterDeclaration(node: ts.Node): node is ts.ParameterDeclaration {
  return (ts as any).isParameterDeclaration(node);
}

function isStatement(node: ts.Node): node is ts.Statement {
  return (ts as any).isStatement(node);
}

function or(a: (node: ts.Node) => boolean, b: (node: ts.Node) => boolean): (node: ts.Node) => boolean {
  return (node) => a(node) || b(node);
}

const isForInitializer = or(ts.isVariableDeclarationList, isExpression);

export function visitNodes<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  nodes: T[],
  visitor: Visitor,
  test?: (node: ts.Node) => boolean,
  start?: number,
  count?: number,
): ts.NodeArray<TSNode>;

export function visitNodes<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  nodes: T[] | undefined,
  visitor: Visitor,
  test?: (node: ts.Node) => boolean,
  start?: number,
  count?: number,
): ts.NodeArray<TSNode> | undefined;

/**
 * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
 *
 * @param nodes The NodeArray to visit.
 * @param visitor The callback used to visit a Node.
 * @param test A node test to execute for each node.
 * @param start An optional value indicating the starting offset at which to start visiting.
 * @param count An optional value indicating the maximum number of nodes to visit.
 */
export function visitNodes<TSNode extends ts.Node, T extends Node<TSNode>>(
  context: VisitorContext,
  nodes: T[] | undefined,
  visitor: Visitor,
  test?: (node: ts.Node) => boolean,
  start?: number,
  count?: number,
): ts.NodeArray<TSNode> | undefined {
  if (nodes == null) {
    return nodes;
  }

  // Ensure start and count have valid values
  const length = nodes.length;
  if (start == null || start < 0) {
    start = 0;
  }

  if (count == null || count > length - start) {
    count = length - start;
  }

  return ts.createNodeArray(
    nodes.slice(start, count).reduce(
      (acc, node) => {
        const visited = node != null ? visitor(node) : undefined;
        if (visited == null) {
          return acc;
        } else if (Array.isArray(visited)) {
          return acc.concat(visited);
        } else {
          return acc.concat([visited]);
        }
      },
      [] as ts.Node[],
    ).filter(utils.notNull),
  ) as any;
}

export function visitEachChild(
  context: VisitorContext,
  node: Node,
  visitor: Visitor,
  nodesVisitor = visitNodes,
  tokenVisitor?: Visitor,
): ts.Node | undefined {
  if (node == null) {
    return undefined;
  }

  const kind = node.getKind();

  switch (kind) {
    case ts.SyntaxKind.QualifiedName:
      return ts.createQualifiedName(
        visitNode(context, (node as QualifiedName).getLeft(), visitor, ts.isEntityName),
        visitNode(context, (node as QualifiedName).getRight(), visitor, ts.isIdentifier) as ts.Identifier,
      );

    case ts.SyntaxKind.ComputedPropertyName:
      return ts.createComputedPropertyName(
        visitNode(context, (node as ComputedPropertyName).getExpression(), visitor, isExpression));

    // Signature elements
    case ts.SyntaxKind.TypeParameter:
      return ts.createTypeParameterDeclaration(
        visitNode(context, (node as TypeParameterDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        visitNode(context, (node as TypeParameterDeclaration).getConstraintNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as TypeParameterDeclaration).getDefaultNode(), visitor, ts.isTypeNode),
      );

    case ts.SyntaxKind.Parameter:
      return ts.createParameter(
        nodesVisitor(context, (node as ParameterDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(
          context,
          (node as ParameterDeclaration).getModifiers() as Array<Node<ts.Modifier>>,
          visitor,
          ts.isModifier,
        ),
        visitNode(context, (node as ParameterDeclaration).getDotDotDotToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as ParameterDeclaration).getNameNodeOrThrow(), visitor, ts.isBindingName) as ts.Identifier,
        visitNode(context, (node as ParameterDeclaration).getQuestionTokenNode(), tokenVisitor, ts.isToken),
        visitNode(context, (node as ParameterDeclaration).getTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as ParameterDeclaration).getInitializer(), visitor, isExpression),
      );

    case ts.SyntaxKind.Decorator:
      return ts.createDecorator(
        visitNode(context, (node as Decorator).getExpression(), visitor, isExpression),
      );

    // Type elements
    case ts.SyntaxKind.PropertySignature:
      return ts.createPropertySignature(
        nodesVisitor(
          context,
          (node as PropertySignature).getModifiers() as Array<Node<ts.Modifier>>,
          visitor,
          ts.isToken,
        ),
        visitNode(
          context,
          (node as PropertySignature).getNameNode() as PropertyName,
          visitor,
          ts.isPropertyName,
        ) as ts.PropertyName,
        visitNode(context, (node as PropertySignature).getQuestionTokenNode(), tokenVisitor, ts.isToken),
        visitNode(context, (node as PropertySignature).getTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as PropertySignature).getInitializer(), visitor, isExpression));

    case ts.SyntaxKind.PropertyDeclaration:
      return ts.createProperty(
        nodesVisitor(context, (node as PropertyDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as PropertyDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as PropertyDeclaration).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        visitNode(context, (node as PropertyDeclaration).getQuestionTokenNode(), tokenVisitor, ts.isToken),
        visitNode(context, (node as PropertyDeclaration).getTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as PropertyDeclaration).getInitializer(), visitor, isExpression));

    case ts.SyntaxKind.MethodSignature:
      return ts.createMethodSignature(
        nodesVisitor(context, (node as MethodSignature).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as MethodSignature).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as MethodSignature).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as MethodSignature).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        visitNode(context, (node as MethodSignature).getQuestionTokenNode(), tokenVisitor, ts.isToken));

    case ts.SyntaxKind.MethodDeclaration:
      return ts.createMethod(
        nodesVisitor(context, (node as MethodDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as MethodDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as MethodDeclaration).getAsteriskToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as MethodDeclaration).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        undefined,
        // TODO: Me
        // visitNode(context, (node as MethodDeclaration).compilerNode.getQuestionToken(), tokenVisitor, ts.isToken),
        nodesVisitor(context, (node as MethodDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as MethodDeclaration).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as MethodDeclaration).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as MethodDeclaration).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.Constructor:
      return ts.createConstructor(
        // TODO: Me
        // nodesVisitor(context, (node as ConstructorDeclaration).compilerNode.getDecorators(), visitor, ts.isDecorator),
        undefined,
        nodesVisitor(context, (node as ConstructorDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        nodesVisitor(context, (node as ConstructorDeclaration).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as ConstructorDeclaration).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.GetAccessor:
      return ts.createGetAccessor(
        nodesVisitor(context, (node as GetAccessorDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as GetAccessorDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as GetAccessorDeclaration).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        nodesVisitor(context, (node as GetAccessorDeclaration).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as GetAccessorDeclaration).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as GetAccessorDeclaration).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.SetAccessor:
      return ts.createSetAccessor(
        nodesVisitor(context, (node as SetAccessorDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as SetAccessorDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as SetAccessorDeclaration).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        nodesVisitor(context, (node as SetAccessorDeclaration).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as SetAccessorDeclaration).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.CallSignature:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // nodesVisitor(context, (node as CallSignatureDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
    // nodesVisitor(context, (node as CallSignatureDeclaration).getParameters(), visitor, isParameterDeclaration),
    // visitNode(context, (node as CallSignatureDeclaration).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.ConstructSignature:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createConstructSignature(
    //   nodesVisitor(context, (node as ConstructSignatureDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
    //   nodesVisitor(context, (node as ConstructSignatureDeclaration).getParameters(), visitor, isParameterDeclaration),
    //   visitNode(context, (node as ConstructSignatureDeclaration).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.IndexSignature:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createIndexSignature(
    //   nodesVisitor(context, (node as IndexSignatureDeclaration).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as IndexSignatureDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   nodesVisitor(context, (node as IndexSignatureDeclaration).getParameters(), visitor, isParameterDeclaration),
    //   visitNode(context, (node as IndexSignatureDeclaration).getTypeNode(), visitor, ts.isTypeNode));

    // Types
    case ts.SyntaxKind.TypePredicate:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createTypePredicateNode(
    //   visitNode(context, (node as TypePredicateNode).parameterName, visitor),
    //   visitNode(context, (node as TypePredicateNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.TypeReference:
      return ts.createTypeReferenceNode(
        visitNode(context, (node as TypeReferenceNode).getTypeName(), visitor, ts.isEntityName) as ts.EntityName,
        nodesVisitor(context, (node as TypeReferenceNode).getTypeArguments(), visitor, ts.isTypeNode),
      );

    case ts.SyntaxKind.FunctionType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createFunctionTypeNode(
    //   nodesVisitor(context, (node as FunctionTypeNode).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
    //   nodesVisitor(context, (node as FunctionTypeNode).getParameters(), visitor, isParameterDeclaration),
    //   visitNode(context, (node as FunctionTypeNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.ConstructorType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createConstructorTypeNode(
    //   nodesVisitor(context, (node as ConstructorTypeNode).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
    //   nodesVisitor(context, (node as ConstructorTypeNode).getParameters(), visitor, isParameterDeclaration),
    //   visitNode(context, (node as ConstructorTypeNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.TypeQuery:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createTypeQueryNode((node as TypeQueryNode),
    //   visitNode(context, (node as TypeQueryNode).exprName, visitor, ts.isEntityName));

    case ts.SyntaxKind.TypeLiteral:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createTypeLiteralNode((node as TypeLiteralNode),
    //   nodesVisitor(context, (node as TypeLiteralNode).getMembers(), visitor, isTypeElement));

    case ts.SyntaxKind.ArrayType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createArrayTypeNode(
    //   visitNode(context, (node as ArrayTypeNode).elementType, visitor, ts.isTypeNode));

    case ts.SyntaxKind.TupleType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createTypleTypeNode((node as TupleTypeNode),
    //   nodesVisitor(context, (node as TupleTypeNode).elementTypes, visitor, ts.isTypeNode));

    case ts.SyntaxKind.UnionType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createUnionTypeNode(
    //   nodesVisitor(context, (node as UnionTypeNode).getTypeNode()s, visitor, ts.isTypeNode));

    case ts.SyntaxKind.IntersectionType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createIntersectionTypeNode(
    //   nodesVisitor(context, (node as IntersectionTypeNode).getTypeNode()s, visitor, ts.isTypeNode));

    case ts.SyntaxKind.ParenthesizedType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createParenthesizedType(
    //   visitNode(context, (node as ParenthesizedTypeNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.TypeOperator:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createTypeOperatorNode(
    //   visitNode(context, (node as TypeOperatorNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.IndexedAccessType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createIndexedAccessTypeNode((node as IndexedAccessTypeNode),
    //   visitNode(context, (node as IndexedAccessTypeNode).objectType, visitor, ts.isTypeNode),
    //   visitNode(context, (node as IndexedAccessTypeNode).indexType, visitor, ts.isTypeNode));

    case ts.SyntaxKind.MappedType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createMappedTypeNode((node as MappedTypeNode),
    //   visitNode(context, (node as MappedTypeNode).readonlyToken, tokenVisitor, ts.isToken),
    //   visitNode(context, (node as MappedTypeNode).getTypeNode()Parameter, visitor, ts.isTypeParameterDeclaration),
    //   visitNode(context, (node as MappedTypeNode).getQuestionToken(), tokenVisitor, ts.isToken),
    //   visitNode(context, (node as MappedTypeNode).getTypeNode(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.LiteralType:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createLiteralTypeNode(
    //   visitNode(context, (node as LiteralTypeNode).getLiteral(), visitor, isExpression));

    // Binding patterns
    case ts.SyntaxKind.ObjectBindingPattern:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createObjectBindingPattern(
    //   nodesVisitor(context, (node as ObjectBindingPattern).elements, visitor, isBindingElement));

    case ts.SyntaxKind.ArrayBindingPattern:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createArrayBindingPattern(
    //   nodesVisitor(context, (node as ArrayBindingPattern).elements, visitor, isArrayBindingElement));

    case ts.SyntaxKind.BindingElement:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createBindingElement(
    //   visitNode(context, (node as BindingElement).dotDotDotToken, tokenVisitor, ts.isToken),
    //   visitNode(context, (node as BindingElement).propertyName, visitor, ts.isPropertyName) as ts.PropertyName,
    //   visitNode(context, (node as BindingElement).getNameNode(), visitor, isBindingName),
    //   visitNode(context, (node as BindingElement).getInitializer(), visitor, isExpression));

    // Expression
    case ts.SyntaxKind.ArrayLiteralExpression:
      return ts.createArrayLiteral(
        nodesVisitor(context, (node as ArrayLiteralExpression).getElements(), visitor, isExpression),
      );

    case ts.SyntaxKind.ObjectLiteralExpression:
      return ts.createObjectLiteral(
        nodesVisitor(context, (node as ObjectLiteralExpression).getProperties(), visitor, ts.isObjectLiteralElementLike));

    case ts.SyntaxKind.PropertyAccessExpression:
      return ts.createPropertyAccess(
        visitNode(context, (node as PropertyAccessExpression).getExpression(), visitor, isExpression),
        visitNode(context, (node as PropertyAccessExpression).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.ElementAccessExpression:
      return ts.createElementAccess(
        visitNode(context, (node as ElementAccessExpression).getExpression(), visitor, isExpression),
        visitNode(context, (node as ElementAccessExpression).getArgumentExpressionOrThrow() as Expression, visitor, isExpression) as ts.Expression,
      );

    case ts.SyntaxKind.CallExpression:
      return ts.createCall(
        visitNode(context, (node as CallExpression).getExpression(), visitor, isExpression),
        nodesVisitor(context, (node as CallExpression).getTypeArguments(), visitor, ts.isTypeNode),
        nodesVisitor(context, (node as CallExpression).getArguments() as Expression[], visitor, isExpression));

    case ts.SyntaxKind.NewExpression:
      return ts.createNew(
        visitNode(context, (node as NewExpression).getExpression(), visitor, isExpression),
        nodesVisitor(context, (node as NewExpression).getTypeArguments(), visitor, ts.isTypeNode),
        nodesVisitor(context, (node as NewExpression).getArguments() as Expression[], visitor, isExpression));

    case ts.SyntaxKind.TaggedTemplateExpression:
      return ts.createTaggedTemplate(
        visitNode(context, (node as TaggedTemplateExpression).getTag(), visitor, isExpression),
        visitNode(context, (node as TaggedTemplateExpression).getTemplate(), visitor, ts.isTemplateLiteral));

    case ts.SyntaxKind.TypeAssertionExpression:
      return ts.createTypeAssertion(
        visitNode(context, (node as TypeAssertion).getTypeNodeOrThrow(), visitor, ts.isTypeNode),
        visitNode(context, (node as TypeAssertion).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.ParenthesizedExpression:
      return ts.createParen(
        visitNode(context, (node as ParenthesizedExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.FunctionExpression:
      return ts.createFunctionExpression(
        nodesVisitor(context, (node as FunctionExpression).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as FunctionExpression).getAsteriskToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as FunctionExpression).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as FunctionExpression).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as FunctionExpression).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as FunctionExpression).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as FunctionExpression).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.ArrowFunction:
      return ts.createArrowFunction(
        nodesVisitor(context, (node as ArrowFunction).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        nodesVisitor(context, (node as ArrowFunction).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as ArrowFunction).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as ArrowFunction).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as ArrowFunction).getEqualsGreaterThan() as any, visitor, ts.isToken) as any,
        visitNode(context, (node as ArrowFunction).getBody() as any, visitor, or(ts.isBlock, isExpression)),
      );

    case ts.SyntaxKind.DeleteExpression:
      return ts.createDelete(
        visitNode(context, (node as DeleteExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.TypeOfExpression:
      return ts.createTypeOf(
        visitNode(context, (node as TypeOfExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.VoidExpression:
      return ts.createVoid(
        visitNode(context, (node as VoidExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.AwaitExpression:
      return ts.createAwait(
        visitNode(context, (node as AwaitExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.PrefixUnaryExpression:
      return ts.createPrefix(
        visitNode(context, (node as PrefixUnaryExpression).getOperatorToken() as any, tokenVisitor, ts.isToken) as any,
        visitNode(context, (node as PrefixUnaryExpression).getOperand(), visitor, isExpression),
      );

    case ts.SyntaxKind.PostfixUnaryExpression:
      return ts.createPostfix(
        visitNode(context, (node as PostfixUnaryExpression).getOperand(), visitor, isExpression),
        visitNode(context, (node as PostfixUnaryExpression).getOperatorToken() as any, tokenVisitor, ts.isToken) as any,
      );

    case ts.SyntaxKind.BinaryExpression:
      return ts.createBinary(
        visitNode(context, (node as BinaryExpression).getLeft(), visitor, isExpression),
        visitNode(context, (node as BinaryExpression).getOperatorToken() as any, tokenVisitor, ts.isToken) as any,
        visitNode(context, (node as BinaryExpression).getRight(), visitor, isExpression),
      );

    case ts.SyntaxKind.ConditionalExpression:
      return ts.createConditional(
        visitNode(context, (node as ConditionalExpression).getCondition(), visitor, isExpression),
        visitNode(context, (node as ConditionalExpression).getQuestionToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as ConditionalExpression).getWhenTrue(), visitor, isExpression),
        visitNode(context, (node as ConditionalExpression).getColonToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as ConditionalExpression).getWhenFalse(), visitor, isExpression));

    case ts.SyntaxKind.TemplateExpression:
      return ts.createTemplateExpression(
        visitNode(context, (node as TemplateExpression).getHead(), visitor, ts.isTemplateHead),
        nodesVisitor(context, (node as TemplateExpression).getTemplateSpans(), visitor, ts.isTemplateSpan));

    case ts.SyntaxKind.YieldExpression:
      if ((node as YieldExpression).isGenerator()) {
        return ts.createYield(
          visitNode(context, (node as YieldExpression).getAsteriskToken(), tokenVisitor, ts.isToken) as any,
          visitNode(context, (node as YieldExpression).getExpressionOrThrow(), visitor, isExpression),
        );
      } else {
        return ts.createYield(visitNode(context, (node as YieldExpression).getExpression(), visitor, isExpression));
      }

    case ts.SyntaxKind.SpreadElement:
      return ts.createSpread(
        visitNode(context, (node as SpreadElement).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.ClassExpression:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createClassExpression(
    //   nodesVisitor(context, (node as ClassExpression).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ClassExpression).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
    //   nodesVisitor(context, (node as ClassExpression).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
    //   nodesVisitor(context, (node as ClassExpression).getHeritageClauses(), visitor, ts.isHeritageClause),
    //   nodesVisitor(context, (node as ClassExpression).getMembers(), visitor, ts.isClassElement));

    case ts.SyntaxKind.ExpressionWithTypeArguments:
      return ts.createExpressionWithTypeArguments(
        nodesVisitor(context, (node as ExpressionWithTypeArguments).getTypeArguments(), visitor, ts.isTypeNode),
        visitNode(context, (node as ExpressionWithTypeArguments).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.AsExpression:
      return ts.createAsExpression(
        visitNode(context, (node as AsExpression).getExpression(), visitor, isExpression),
        visitNode(context, (node as AsExpression).getTypeNodeOrThrow(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.NonNullExpression:
      return ts.createNonNullExpression(
        visitNode(context, (node as NonNullExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.MetaProperty:
      return ts.createMetaProperty(
        ts.SyntaxKind.NewKeyword,
        visitNode(context, (node as MetaProperty).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
      );

    // Misc
    case ts.SyntaxKind.TemplateSpan:
      return ts.createTemplateSpan(
        visitNode(context, (node as TemplateSpan).getExpression(), visitor, isExpression),
        visitNode(context, (node as TemplateSpan).getLiteral(), visitor, ts.isTemplateMiddleOrTemplateTail));

    // Element
    case ts.SyntaxKind.Block:
      return ts.createBlock(
        nodesVisitor(
          context,
          // TODO: Fix me
          (node as any).compilerNode.statements.map((statement: any) => (node as any).getNodeFromCompilerNode(statement)) as Statement[],
          visitor,
          isStatement,
        ));

    case ts.SyntaxKind.VariableStatement:
      return ts.createVariableStatement(
        nodesVisitor(context, (node as VariableStatement).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as VariableStatement).getDeclarationList() as VariableDeclarationList, visitor, ts.isVariableDeclarationList) as ts.VariableDeclarationList,
      );

    case ts.SyntaxKind.ExpressionStatement:
      return ts.createStatement(
        visitNode(context, (node as ExpressionStatement).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.IfStatement:
      return ts.createIf(
        visitNode(context, (node as IfStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as IfStatement).getThenStatement(), visitor, isStatement, liftToBlock),
        visitNode(context, (node as IfStatement).getElseStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.DoStatement:
      return ts.createDo(
        visitNode(context, (node as DoStatement).getStatement(), visitor, isStatement, liftToBlock),
        visitNode(context, (node as DoStatement).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.WhileStatement:
      return ts.createWhile(
        visitNode(context, (node as WhileStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as WhileStatement).getStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.ForStatement:
      return ts.createFor(
        visitNode(context, (node as ForStatement).getInitializer(), visitor, isForInitializer),
        visitNode(context, (node as ForStatement).getCondition(), visitor, isExpression),
        visitNode(context, (node as ForStatement).getIncrementor(), visitor, isExpression),
        visitNode(context, (node as ForStatement).getStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.ForInStatement:
      return ts.createForIn(
        visitNode(context, (node as ForInStatement).getInitializer(), visitor, isForInitializer),
        visitNode(context, (node as ForInStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as ForInStatement).getStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.ForOfStatement:
      return ts.createForOf(
        visitNode(context, (node as ForOfStatement).getAwaitKeyword(), visitor, ts.isToken) as any,
        visitNode(context, (node as ForOfStatement).getInitializer(), visitor, isForInitializer),
        visitNode(context, (node as ForOfStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as ForOfStatement).getStatement(), visitor, isStatement, liftToBlock),
      );

    case ts.SyntaxKind.ContinueStatement:
      return ts.createContinue(
        visitNode(context, (node as ContinueStatement).getLabel(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.BreakStatement:
      return ts.createBreak(
        visitNode(context, (node as BreakStatement).getLabel(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.ReturnStatement:
      return ts.createReturn(
        visitNode(context, (node as ReturnStatement).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.WithStatement:
      return ts.createWith(
        visitNode(context, (node as WithStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as WithStatement).getStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.SwitchStatement:
      return ts.createSwitch(
        visitNode(context, (node as SwitchStatement).getExpression(), visitor, isExpression),
        visitNode(context, (node as SwitchStatement).getCaseBlock(), visitor, ts.isCaseBlock));

    case ts.SyntaxKind.LabeledStatement:
      return ts.createLabel(
        visitNode(context, (node as LabeledStatement).getLabel(), visitor, ts.isIdentifier) as ts.Identifier,
        visitNode(context, (node as LabeledStatement).getStatement(), visitor, isStatement, liftToBlock));

    case ts.SyntaxKind.ThrowStatement:
      return ts.createThrow(
        visitNode(context, (node as ThrowStatement).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.TryStatement:
      return ts.createTry(
        visitNode(context, (node as TryStatement).getTryBlock(), visitor, ts.isBlock),
        visitNode(context, (node as TryStatement).getCatchClause(), visitor, ts.isCatchClause),
        visitNode(context, (node as TryStatement).getFinallyBlock(), visitor, ts.isBlock));

    case ts.SyntaxKind.VariableDeclaration:
      return ts.createVariableDeclaration(
        visitNode(context, (node as VariableDeclaration).getNameNode(), visitor, ts.isBindingName) as ts.Identifier,
        visitNode(context, (node as VariableDeclaration).getTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as VariableDeclaration).getInitializer(), visitor, isExpression));

    case ts.SyntaxKind.VariableDeclarationList:
      return ts.createVariableDeclarationList(
        nodesVisitor(context, (node as VariableDeclarationList).getDeclarations(), visitor, ts.isVariableDeclaration),
        (node as VariableDeclarationList).compilerNode.flags,
      );

    case ts.SyntaxKind.FunctionDeclaration:
      return ts.createFunctionDeclaration(
        // TODO: me
        undefined,
        // nodesVisitor(context, (node as FunctionDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as FunctionDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as FunctionDeclaration).getAsteriskToken(), tokenVisitor, ts.isToken),
        visitNode(context, (node as FunctionDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as FunctionDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as FunctionDeclaration).getParameters(), visitor, isParameterDeclaration),
        visitNode(context, (node as FunctionDeclaration).getReturnTypeNode(), visitor, ts.isTypeNode),
        visitNode(context, (node as FunctionExpression).getBody() as any, visitor, ts.isBlock) as ts.Block,
      );

    case ts.SyntaxKind.ClassDeclaration:
      return ts.createClassDeclaration(
        nodesVisitor(context, (node as ClassDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as ClassDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as ClassDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as ClassDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as ClassDeclaration).getHeritageClauses(), visitor, ts.isHeritageClause),
        nodesVisitor(context, (node as ClassDeclaration).getAllMembers().filter((value) => !(value instanceof ParameterDeclaration)) as Array<(MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration)>, visitor, ts.isClassElement));

    case ts.SyntaxKind.InterfaceDeclaration:
      return ts.createInterfaceDeclaration(
        // TODO: me
        undefined,
        // nodesVisitor(context, (node as InterfaceDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as InterfaceDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as InterfaceDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as InterfaceDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        nodesVisitor(context, (node as InterfaceDeclaration).getHeritageClauses(), visitor, ts.isHeritageClause),
        nodesVisitor(context, (node as InterfaceDeclaration).getAllMembers(), visitor, ts.isTypeElement));

    case ts.SyntaxKind.TypeAliasDeclaration:
      return ts.createTypeAliasDeclaration(
        // TODO: me
        undefined,
        // nodesVisitor(context, (node as TypeAliasDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as TypeAliasDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as TypeAliasDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as TypeAliasDeclaration).getTypeParameters(), visitor, ts.isTypeParameterDeclaration),
        visitNode(context, (node as TypeAliasDeclaration).getTypeNodeOrThrow(), visitor, ts.isTypeNode));

    case ts.SyntaxKind.EnumDeclaration:
      return ts.createEnumDeclaration(
        // TODO: me
        undefined,
        // nodesVisitor(context, (node as EnumDeclaration).getDecorators(), visitor, ts.isDecorator),
        nodesVisitor(context, (node as EnumDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
        visitNode(context, (node as EnumDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        nodesVisitor(context, (node as EnumDeclaration).getMembers(), visitor, ts.isEnumMember));

    case ts.SyntaxKind.ModuleDeclaration:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createModuleDeclaration(
    //   nodesVisitor(context, (node as ModuleDeclaration).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as ModuleDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ModuleDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as ModuleDeclaration).getBody(), visitor, isModuleBody));

    case ts.SyntaxKind.ModuleBlock:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createModuleBlock(
    //   nodesVisitor(context, (node as ModuleBlock).getStatements(), visitor, isStatement));

    case ts.SyntaxKind.CaseBlock:
      return ts.createCaseBlock(
        nodesVisitor(context, (node as CaseBlock).getClauses(), visitor, ts.isCaseOrDefaultClause));

    case ts.SyntaxKind.NamespaceExportDeclaration:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createNamespaceExportDeclaration(
    //   visitNode(context, (node as NamespaceExportDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.ImportEqualsDeclaration:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createImportEqualsDeclaration(
    //   nodesVisitor(context, (node as ImportEqualsDeclaration).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as ImportEqualsDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ImportEqualsDeclaration).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as ImportEqualsDeclaration).moduleReference, visitor, isModuleReference));

    case ts.SyntaxKind.ImportDeclaration:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createImportDeclaration(
    //   nodesVisitor(context, (node as ImportDeclaration).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as ImportDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ImportDeclaration).getImportClause(), visitor, ts.isImportClause),
    //   visitNode(context, (node as ImportDeclaration).moduleSpecifier, visitor, isExpression));

    case ts.SyntaxKind.ImportClause:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createImportClause(
    //   visitNode(context, (node as ImportClause).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as ImportClause).getNameNode()dBindings, visitor, isNamedImportBindings));

    case ts.SyntaxKind.NamespaceImport:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createNamespaceImport(
    //   visitNode(context, (node as NamespaceImport).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.NamedImports:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createNamedImports(
    //   nodesVisitor(context, (node as NamedImports).elements, visitor, isImportSpecifier));

    case ts.SyntaxKind.ImportSpecifier:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createImportSpecifier(
    //   visitNode(context, (node as ImportSpecifier).propertyName, visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as ImportSpecifier).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier);

    case ts.SyntaxKind.ExportAssignment:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createExportAssignment(
    //   nodesVisitor(context, (node as ExportAssignment).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as ExportAssignment).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ExportAssignment).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.ExportDeclaration:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createExportDeclaration(
    //   nodesVisitor(context, (node as ExportDeclaration).getDecorators(), visitor, ts.isDecorator),
    //   nodesVisitor(context, (node as ExportDeclaration).getModifiers() as Array<Node<ts.Modifier>>, visitor, ts.isModifier),
    //   visitNode(context, (node as ExportDeclaration).exportClause, visitor, isNamedExports),
    //   visitNode(context, (node as ExportDeclaration).moduleSpecifier, visitor, isExpression));

    case ts.SyntaxKind.NamedExports:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createNamedExports(
    //   nodesVisitor(context, (node as NamedExports).elements, visitor, isExportSpecifier));

    case ts.SyntaxKind.ExportSpecifier:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createExportSpecifier(
    //   visitNode(context, (node as ExportSpecifier).propertyName, visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as ExportSpecifier).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier);

    // Module references
    case ts.SyntaxKind.ExternalModuleReference:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createExternalModuleReference(
    //   visitNode(context, (node as ExternalModuleReference).getExpression(), visitor, isExpression));

    // JSX
    case ts.SyntaxKind.JsxElement:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxElement(
    //   visitNode(context, (node as JsxElement).openingElement, visitor, isJsxOpeningElement),
    //   nodesVisitor(context, (node as JsxElement).children, visitor, isJsxChild),
    //   visitNode(context, (node as JsxElement).closingElement, visitor, isJsxClosingElement));

    case ts.SyntaxKind.JsxSelfClosingElement:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxSelfClosingElement(
    //   visitNode(context, (node as JsxSelfClosingElement).getTag()Name, visitor, isJsxTagNameExpression),
    //   visitNode(context, (node as JsxSelfClosingElement).attributes, visitor, isJsxAttributes));

    case ts.SyntaxKind.JsxOpeningElement:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxOpeningElement(
    //   visitNode(context, (node as JsxOpeningElement).getTag()Name, visitor, isJsxTagNameExpression),
    //   visitNode(context, (node as JsxOpeningElement).attributes, visitor, isJsxAttributes));

    case ts.SyntaxKind.JsxClosingElement:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxClosingElement(
    //   visitNode(context, (node as JsxClosingElement).getTag()Name, visitor, isJsxTagNameExpression));

    case ts.SyntaxKind.JsxFragment:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxFragment(
    //   visitNode(context, (node as JsxFragment).openingFragment, visitor, isJsxOpeningFragment),
    //   nodesVisitor(context, (node as JsxFragment).children, visitor, isJsxChild),
    //   visitNode(context, (node as JsxFragment).closingFragment, visitor, isJsxClosingFragment));

    case ts.SyntaxKind.JsxAttribute:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxAttribute(
    //   visitNode(context, (node as JsxAttribute).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
    //   visitNode(context, (node as JsxAttribute).getInitializer(), visitor, isStringLiteralOrJsxExpression));

    case ts.SyntaxKind.JsxAttributes:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxAttributes(
    //   nodesVisitor(context, (node as JsxAttributes).properties, visitor, isJsxAttributeLike));

    case ts.SyntaxKind.JsxSpreadAttribute:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxSpreadAttribute(
    //   visitNode(context, (node as JsxSpreadAttribute).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.JsxExpression:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createJsxExpression(
    //   visitNode(context, (node as JsxExpression).getExpression(), visitor, isExpression));

    // Clauses
    case ts.SyntaxKind.CaseClause:
      return ts.createCaseClause(
        visitNode(context, (node as CaseClause).getExpression(), visitor, isExpression),
        nodesVisitor(context, (node as CaseClause).getStatements() as Statement[], visitor, isStatement),
      );

    case ts.SyntaxKind.DefaultClause:
      return ts.createDefaultClause(
        nodesVisitor(context, (node as DefaultClause).getStatements() as Statement[], visitor, isStatement));

    case ts.SyntaxKind.HeritageClause:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createHeritageClause(
    //   visitNode(context, (node as HeritageClause).getToken(), tokenVisitor, isExpression),
    //   visitNode(context, (node as HeritageClause).getTypes() as ExpressionWithTypeArguments[], visitor, ts.isExpressionWithTypeArguments)
    // );

    case ts.SyntaxKind.CatchClause:
      return ts.createCatchClause(
        visitNode(context, (node as CatchClause).getVariableDeclarationOrThrow(), visitor, ts.isVariableDeclaration) as ts.VariableDeclaration,
        visitNode(context, (node as CatchClause).getBlock(), visitor, ts.isBlock),
      );

    // Property assignments
    case ts.SyntaxKind.PropertyAssignment:
      return ts.createPropertyAssignment(
        visitNode(context, (node as PropertyAssignment).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        visitNode(context, (node as PropertyAssignment).getInitializerOrThrow(), visitor, isExpression));

    case ts.SyntaxKind.ShorthandPropertyAssignment:
      return ts.createShorthandPropertyAssignment(
        visitNode(context, (node as ShorthandPropertyAssignment).getNameNode(), visitor, ts.isIdentifier) as ts.Identifier,
        visitNode(context, (node as ShorthandPropertyAssignment).getObjectAssignmentInitializer(), visitor, isExpression),
      );

    case ts.SyntaxKind.SpreadAssignment:
      return ts.createSpreadAssignment(
        visitNode(context, (node as SpreadAssignment).getExpression(), visitor, isExpression));

    // Enum
    case ts.SyntaxKind.EnumMember:
      return ts.createEnumMember(
        visitNode(context, (node as EnumMember).getNameNode(), visitor, ts.isPropertyName) as ts.PropertyName,
        visitNode(context, (node as EnumMember).getInitializer(), visitor, isExpression));

    // Top-level nodes
    case ts.SyntaxKind.SourceFile:
      // TODO: me
      return ts.getMutableClone(node.compilerNode);
    // return ts.createSourceFileNode(
    //   visitLexicalEnvironment((node as SourceFile).getStatements(), visitor, context));

    // Transformation nodes
    case ts.SyntaxKind.PartiallyEmittedExpression:
      return ts.createPartiallyEmittedExpression(
        visitNode(context, (node as PartiallyEmittedExpression).getExpression(), visitor, isExpression));

    case ts.SyntaxKind.CommaListExpression:
      return ts.createCommaList(
        nodesVisitor(context, (node as CommaListExpression).getElements(), visitor, isExpression),
      );

    default:
      // No need to visit nodes with no children.
      return node.compilerNode;
  }
}

function extractSingleNode<TSNode extends ts.Node>(context: VisitorContext, input: Node, nodes: ReadonlyArray<TSNode>): TSNode | undefined {
  if (nodes.length <= 1) {
    context.reportError(
      input,
      'Too many nodes written to output',
      DiagnosticCode.SOMETHING_WENT_WRONG,
    );
    return undefined;
  } else {
    return nodes[0];
  }
}

function liftToBlock(context: VisitorContext, input: Node, nodesIn: ReadonlyArray<ts.Node>): ts.Statement {
  const nodes = nodesIn as any;
  if (nodes.length <= 1) {
    return nodes[0];
  }

  return ts.createBlock(nodes);
}
