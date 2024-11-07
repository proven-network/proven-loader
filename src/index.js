import { parse } from '@babel/parser'
import { getOptions } from 'loader-utils'
import { validate } from 'schema-utils'

import schema from './options.json'

export default function provenLoader(source) {
  const options = getOptions(this)

  validate(schema, options, {
    name: 'Proven Loader',
    baseDataPath: 'options',
  })

  const serializedSource = JSON.stringify(source)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

  const esModule =
    typeof options.esModule !== 'undefined' ? options.esModule : true

  const exportedFunctions = findExportedFunctions(source)

  // Generate new export statements wrappers for each exported function
  const exportStatements = exportedFunctions
    .map((funcName) =>
      esModule
        ? `
          export const ${funcName} = (...args) => {
            return __enqueueRpcCall__('${funcName}', ...args);
          };`
        : `
          module.exports.${funcName} = (...args) => {
            return __enqueueRpcCall__('${funcName}', ...args);
          };`,
    )
    .join('\n')

  return `const source = ${serializedSource};
    function __enqueueRpcCall__(exportName, ...args) {
      window.provenRpcQueue = window.provenRpcQueue || [];
      return new Promise((resolve, reject) => {
        window.provenRpcQueue.push({
          rpcCallData: {
            args,
            exportName,
            source,
          },
          resolve,
          reject,
        });
      });
    }

    ${exportStatements}
  `
}

function findExportedFunctions(source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const exportedFunctions = []

  ast.program.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration') {
          exportedFunctions.push(node.declaration.id.name)
        } else if (node.declaration.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach((declaration) => {
            if (
              declaration.init &&
              (declaration.init.type === 'FunctionExpression' ||
                declaration.init.type === 'ArrowFunctionExpression' ||
                (declaration.init.type === 'CallExpression' &&
                  declaration.init.callee.name === 'runWithOptions'))
            ) {
              exportedFunctions.push(declaration.id.name)
            }
          })
        }
      } else if (node.specifiers) {
        node.specifiers.forEach((specifier) => {
          if (specifier.exported && specifier.exported.type === 'Identifier') {
            exportedFunctions.push(specifier.exported.name)
          }
        })
      }
    }
  })

  return exportedFunctions
}
