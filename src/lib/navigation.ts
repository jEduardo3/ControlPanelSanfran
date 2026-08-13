'use client';

export function navigateFresh(path: string) {
  const separator = path.includes('?') ? '&' : '?';
  window.location.assign(`${path}${separator}_fresh=${Date.now()}`);
}
