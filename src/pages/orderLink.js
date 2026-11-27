import { ROUTE_ID } from '../routes';

/** Query parameter that carries the chosen package id to the order page. */
export const PACKAGE_QUERY_PARAM = 'package';

/**
 * Path of the order page, optionally with a package preselected.
 *
 * @param {string} [packageId]  A tier id from the pricing content.
 * @returns {string} e.g. `'/order?package=custom'`, or `'/order'` without an id.
 */
export function getOrderPath(packageId) {
  const orderPath = `/${ROUTE_ID.ORDER}`;
  return packageId === undefined
    ? orderPath
    : `${orderPath}?${PACKAGE_QUERY_PARAM}=${encodeURIComponent(packageId)}`;
}
