/**
 * Applies the saved theme before first paint.
 *
 * Inlined in `<head>` as a raw string rather than rendered through a React
 * component: a `<script>` rendered by React is inert on the client and logs a
 * warning, which is exactly the error this replaces. It runs once, before the
 * body is parsed, so no light flash can happen.
 *
 * It mirrors `components/wild/theme.ts`: same storage key, same class.
 */
export const THEME_SCRIPT = `(function(){try{
  var key='marginalia:theme';
  var saved=localStorage.getItem(key);
  var mode=saved==='light'||saved==='dark'||saved==='system'?saved:'system';
  var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  var root=document.documentElement;
  root.classList.toggle('dark',dark);
  root.dataset.theme=mode;
}catch(e){}})();`;
