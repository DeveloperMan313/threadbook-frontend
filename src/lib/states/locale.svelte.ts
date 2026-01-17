import { setLocale, type Locale } from '$lib/paraglide/runtime';

// locale is stored in paraglide, use getLocale()

export const initLocale = () => {
  const locale = localStorage.getItem('locale') || navigator.language.slice(0, 2).toLowerCase();
  setLocale(locale as Locale);
};

export const applyLocale = (locale: Locale) => {
  localStorage.setItem('locale', locale);
  setLocale(locale);
};
