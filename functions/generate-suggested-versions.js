import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = require('../package.json');

/**
 * TODO: Not used right now but can be useful in the future
 *
 * It starts form one version and generates 2 hotfix versions + 1 minor version
 * ie. 13.2.5 -> [13.2.6, 13.2.7, 13.3.0]
 */
export function generateSuggestedVersions() {
  const currentVersion = app.version;
  const nextHotfixVersion = app.version
    .split('.')
    .map((number, index) => {
      if (index === app.version.split('.').length - 1) return Number.parseInt(number, 10) + 1;

      return number;
    })
    .join('.');
  const secondNextHotfixVersion = app.version
    .split('.')
    .map((number, index) => {
      if (index === app.version.split('.').length - 1) return Number.parseInt(number, 10) + 2;

      return number;
    })
    .join('.');
  const nextMinorVersion = app.version
    .split('.')
    .map((number, index) => {
      if (index === app.version.split('.').length - 2) return Number.parseInt(number, 10) + 1;
      if (index === app.version.split('.').length - 1) return 0;

      return number;
    })
    .join('.');

  return [
    { title: `${currentVersion} (current)`, value: currentVersion },
    { title: nextHotfixVersion },
    { title: secondNextHotfixVersion },
    { title: nextMinorVersion },
  ];
}
