// utils.ts
export function setCookie(name: String, value: string, days: number) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  const cookieString = `${name}=${value};expires=${expirationDate.toUTCString()};path=/`;

  document.cookie = cookieString;
}

export function getCookie(name: string) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }

  return null; // Return null if the cookie is not found
}
