// ponytail: v4 transition shim. The header now lives in the root layout; pages still importing these render nothing
// until each is rebuilt (slices v4-4 and v4-5), then this file is deleted.
export function SiteNav() {
  return null;
}

export function SiteHeader() {
  return null;
}
