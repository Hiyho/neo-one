import { Node } from 'ts-simple-ast';

export function visit(node: Node, visitor: (visited: Node) => boolean): boolean {
  return node.getChildren().some((visited) => {
    if (visitor(visited)) {
      return true;
    }

    return visit(visited, visitor);
  });
}
