/**
 * Type declarations for Astro components
 * This allows TypeScript to understand .astro file imports
 */

declare module '*.astro' {
  const Component: any;
  export default Component;
}