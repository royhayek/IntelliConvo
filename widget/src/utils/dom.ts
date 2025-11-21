export function scrollToBottom(container: HTMLElement | null): void {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

export function injectCustomCss(css: string, id: string = 'widget-custom-css'): void {
  const existingStyle = document.getElementById(id);
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
