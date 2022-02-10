import { AppVersion } from '../models/app-version.model';

/**
 * Depending on if we are doing a hotfix or a regular release, this
 * method creates the array of suggested versions to pick from
 *
 * i.e. Hotfix from 13.2.5 -> [13.2.6, 13.2.7, 13.2.8, 13.2.9]
 * i.e. Release from 13.2.5 -> [13.3.0, 13.4.0, 13.5.0, 14.0.0, 15.0.0]
 */
export function generateSuggestedVersions(currentVersion: string, isHotfix = false): AppVersion[] {
  if (isHotfix) {
    return [
      { name: `${currentVersion} (current)`, value: currentVersion },
      { name: getHotfixVersion(currentVersion, 1) },
      { name: getHotfixVersion(currentVersion, 2) },
      { name: getHotfixVersion(currentVersion, 3) },
      { name: getHotfixVersion(currentVersion, 4) },
    ];
  }

  return [
    { name: `${currentVersion} (current)`, value: currentVersion },
    { name: getMinorVersion(currentVersion, 1) },
    { name: getMinorVersion(currentVersion, 2) },
    { name: getMinorVersion(currentVersion, 3) },
    { name: getMajorVersion(currentVersion, 1) },
    { name: getMajorVersion(currentVersion, 2) },
  ];
}

function getHotfixVersion(currentVersion: string, incrementBy = 1): string {
  return currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 1) return Number.parseInt(number, 10) + incrementBy;

      return number;
    })
    .join('.');
}

function getMinorVersion(currentVersion: string, incrementBy = 1): string {
  return currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 2) return Number.parseInt(number, 10) + incrementBy;
      if (index === currentVersion.split('.').length - 1) return 0;

      return number;
    })
    .join('.');
}

function getMajorVersion(currentVersion: string, incrementBy = 1): string {
  return currentVersion
    .split('.')
    .map((number, index) => {
      if (index === currentVersion.split('.').length - 3) return Number.parseInt(number, 10) + incrementBy;
      if (index === currentVersion.split('.').length - 2) return 0;
      if (index === currentVersion.split('.').length - 1) return 0;

      return number;
    })
    .join('.');
}
