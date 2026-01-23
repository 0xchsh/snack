import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

// Deep linking configuration
export const LINKING_CONFIG: LinkingOptions<any> = {
  prefixes: [
    Linking.createURL('/'),
    'snack://',
    'https://snack.app',
    'https://www.snack.app',
  ],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: 'discover',
          saved: 'saved',
          profile: 'profile',
        },
      },
      '(auth)': {
        screens: {
          'sign-in': 'sign-in',
          'sign-up': 'sign-up',
        },
      },
      'list/[id]': 'list/:id',
      'user/[username]': {
        path: '@:username',
        parse: {
          username: (username: string) => username.replace('@', ''),
        },
        stringify: {
          username: (username: string) => `@${username}`,
        },
      },
      'purchase/checkout': 'purchase/checkout',
      'purchase/success': 'purchase/success',
      'auth/callback': 'auth/callback',
    },
  },
};

// URL helpers
export function getListUrl(listId: string, username?: string): string {
  if (username) {
    return `https://snack.app/@${username}/${listId}`;
  }
  return `https://snack.app/list/${listId}`;
}

export function getUserUrl(username: string): string {
  return `https://snack.app/@${username}`;
}

export function getDeepLinkUrl(path: string): string {
  return Linking.createURL(path);
}

// Parse universal links
export function parseUniversalLink(url: string): { type: 'list' | 'user' | 'unknown'; id?: string } {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match /@username/listId pattern
    const userListMatch = pathname.match(/^\/@([^/]+)\/([^/]+)$/);
    if (userListMatch) {
      return { type: 'list', id: userListMatch[2] };
    }

    // Match /list/id pattern
    const listMatch = pathname.match(/^\/list\/([^/]+)$/);
    if (listMatch) {
      return { type: 'list', id: listMatch[1] };
    }

    // Match /@username pattern
    const userMatch = pathname.match(/^\/@([^/]+)$/);
    if (userMatch) {
      return { type: 'user', id: userMatch[1] };
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}
