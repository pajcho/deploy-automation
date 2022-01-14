import { AppVersion } from '../models/app-version.model';
import { version as currentVersion } from '../../package.json';

/**
 * TODO: Not used right now but can be useful in the future
 *
 * It starts form one version and generates 2 hotfix versions + 1 minor version + 1 major version
 * ie. 13.2.5 -> [13.2.6, 13.2.7, 13.3.0, 14.0.0]
 */
export function generateSuggestedVersions(): AppVersion[] {
  const nextHotfixVersion: string = currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 1) return Number.parseInt(number, 10) + 1;

      return number;
    })
    .join('.');

  const secondNextHotfixVersion: string = currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 1) return Number.parseInt(number, 10) + 2;

      return number;
    })
    .join('.');

  const nextMinorVersion: string = currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 2) return Number.parseInt(number, 10) + 1;
      if (index === currentVersion.split('.').length - 1) return 0;

      return number;
    })
    .join('.');

  const nextMajorVersion: string = currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 3) return Number.parseInt(number, 10) + 1;
      if (index === currentVersion.split('.').length - 2) return 0;
      if (index === currentVersion.split('.').length - 1) return 0;

      return number;
    })
    .join('.');

  return [
    { title: `${currentVersion} (current)`, value: currentVersion },
    { title: nextHotfixVersion },
    { title: secondNextHotfixVersion },
    { title: nextMinorVersion },
    { title: nextMajorVersion },
  ];
}
