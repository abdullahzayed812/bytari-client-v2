/** Metro resolves image imports to a numeric asset id at runtime. */
declare module '*.png' {
  const value: number;
  export default value;
}
