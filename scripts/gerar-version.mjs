// gera public/version.json (versão + novidades) antes do build; o app consulta para avisar que saiu versão nova
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const novidades = JSON.parse(readFileSync('./novidades.json', 'utf8'));
writeFileSync('./public/version.json', JSON.stringify({ versao: pkg.version, novidades: novidades.slice(0, 15) }));
