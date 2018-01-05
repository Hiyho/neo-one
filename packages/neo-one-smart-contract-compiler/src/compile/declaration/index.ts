import { ClassDeclarationCompiler } from './ClassDeclarationCompiler';
import { EnumDeclarationCompiler } from './EnumDeclarationCompiler';
import { EnumMemberCompiler } from './EnumMemberCompiler';
import { FunctionDeclarationCompiler } from './FunctionDeclarationCompiler';
import { VariableDeclarationCompiler } from './VariableDeclarationCompiler';
import { VariableDeclarationListCompiler } from './VariableDeclarationListCompiler';

export default [
  ClassDeclarationCompiler,
  EnumDeclarationCompiler,
  EnumMemberCompiler,
  FunctionDeclarationCompiler,
  VariableDeclarationCompiler,
  VariableDeclarationListCompiler,
];
