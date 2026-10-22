// Análise estática do JavaScript do app (ESLint): sintaxe ES5 (só async/await além dela), variáveis que
// não existem, código que nunca roda e recursos que o Chrome do notebook não tem (eslint-plugin-compat).
// Uso: node chaveiro/testes/lint.js   (as ferramentas vêm de .claude/hooks/session-start.sh)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { pathToFileURL } = require('url');

const FERR = process.env.CHAVEIRO_FERRAMENTAS || path.join(os.homedir(), '.cache', 'chaveiro-ferramentas');
const HTML = process.env.CHAVEIRO_HTML || path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html');
const acha = nome => { try { return require.resolve(nome, { paths: [FERR] }); } catch (e) { return null; } };
const carrega = async nome => { const m = await import(pathToFileURL(acha(nome)).href); return m.default || m; };

(async () => {
  if (!acha('eslint') || !acha('eslint-plugin-compat') || !acha('globals')) {
    console.log('PULADO: ESLint não está instalado em ' + FERR + ' (rode .claude/hooks/session-start.sh)');
    return;
  }
  const { Linter } = await carrega('eslint'), compat = await carrega('eslint-plugin-compat'), globals = await carrega('globals');
  const html = fs.readFileSync(HTML, 'utf8');
  const blocos = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const config = [{
    files: ['**/*.js'],
    plugins: { compat },
    languageOptions: { ecmaVersion: 2017, sourceType: 'script', globals: { ...globals.browser } },
    settings: { browsers: ['Chrome >= 109', 'Edge >= 109'] },
    rules: {
      'no-undef': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'error',
      'no-self-assign': 'error', 'no-cond-assign': ['error', 'except-parens'], 'no-fallthrough': 'error',
      'no-loss-of-precision': 'error', 'no-unsafe-finally': 'error', 'use-isnan': 'error', 'valid-typeof': 'error',
      'no-sparse-arrays': 'error', 'no-dupe-else-if': 'error', 'no-duplicate-case': 'error', 'no-func-assign': 'error',
      'no-shadow-restricted-names': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-constant-condition': 'warn', 'compat/compat': 'warn',
      'no-restricted-syntax': ['error'].concat([
        ['ArrowFunctionExpression', 'função seta (=>)'], ['TemplateLiteral', 'texto com crase'],
        ['VariableDeclaration[kind!="var"]', 'let/const'], ['ClassDeclaration', 'class'], ['ClassExpression', 'class'],
        ['SpreadElement', 'reticências (...)'], ['RestElement', 'reticências (...)'], ['ForOfStatement', 'for...of'],
        ['ObjectPattern', 'desestruturação'], ['ArrayPattern', 'desestruturação'], ['AssignmentPattern', 'valor padrão em parâmetro'],
        ['Property[shorthand=true]', 'propriedade abreviada'], ['Property[method=true]', 'método abreviado'], ['FunctionDeclaration[generator=true]', 'gerador']
      ].map(([selector, nome]) => ({ selector, message: nome + ' não é ES5 (o app usa ES5, só async/await além dela)' })))
    }
  }];
  const linter = new Linter({ configType: 'flat' });
  let erros = 0, avisos = 0;
  blocos.forEach(b => {
    const linhaInicial = html.slice(0, b.index).split('\n').length;
    linter.verify(b[1], config, { filename: 'app.js' }).forEach(m => {
      const grave = m.severity === 2 || m.fatal; if (grave) erros++; else avisos++;
      console.log(`  ${grave ? 'ERRO ' : 'aviso'} linha ${linhaInicial + (m.line || 1) - 1}: ${m.message} (${m.ruleId || 'sintaxe'})`);
    });
  });
  console.log(`ESLint: ${blocos.length} bloco(s) de script, ${erros} erro(s), ${avisos} aviso(s)`);
  process.exit(erros ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
