import { navigate } from './navigation';

const PRIMARY_BUTTON = 0;
const SAME_TAB_TARGET = '_self';

/**
 * An `<a>` for internal paths that navigates without reloading the document.
 * Modified clicks (new tab, download…) and non-`_self` targets are left to the browser.
 *
 * @param {{ to: string, onClick?: (event: import('react').MouseEvent) => void } & import('react').AnchorHTMLAttributes<HTMLAnchorElement>} props
 */
export default function Link({ to, onClick, ...rest }) {
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== PRIMARY_BUTTON) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== SAME_TAB_TARGET) return;
    event.preventDefault();
    navigate(to);
  };

  return <a href={to} {...rest} onClick={handleClick} />;
}
