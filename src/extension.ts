import * as vscode from "vscode";
import * as ts from "typescript";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.sortingImports",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const fullText = document.getText();
        const { sortedImports, endOfImportsPos } = sortImports(fullText);

        editor.edit((editBuilder) => {
          const importRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(endOfImportsPos)
          );
          editBuilder.replace(importRange, sortedImports);
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

function sortImports(sourceCode: string): {
  sortedImports: string;
  endOfImportsPos: number;
} {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  const lastImport = imports[imports.length - 1];
  const endOfImportsPos = lastImport ? lastImport.end : 0;

  const sortedImports = categorizeAndSortImports(imports);

  const result = sortedImports
    .map((group) => group.join("\n"))
    .filter((group) => group.length > 0)
    .join("\n\n");

  return { sortedImports: result, endOfImportsPos };
}

function categorizeAndSortImports(imports: ts.ImportDeclaration[]): string[][] {
  const globalImports: string[] = [];
  const thirdPartyImports: string[] = [];
  const outerFolderImports: string[] = [];
  const currentFolderImports: string[] = [];

  imports.forEach((imp) => {
    const importText = imp.getText().trim();

        if (importText.includes('react')) {
            globalImports.push(importText);
        } else if (importText.match(/import.*from\s+'[^.\/]/)) {
            if (importText.match(/import.*from\s+'@/)) {
                outerFolderImports.push(importText);
            } else {
                thirdPartyImports.push(importText);
            }
        } else if (importText.match(/import.*from\s+'\.\.\//)) {
            outerFolderImports.push(importText);
        } else {
            currentFolderImports.push(importText);
        }
  });

  return [
    globalImports,
    thirdPartyImports,
    outerFolderImports,
    currentFolderImports,
  ];
}

export function deactivate() {}
