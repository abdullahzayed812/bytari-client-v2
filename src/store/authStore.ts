/**
 * @deprecated Compatibility shim. The auth store lives in
 * `@/features/auth/store/authStore` since Mobile Phase 2. Re-exporting here also
 * runs the module's `configureApiAuth` side-effect for legacy importers.
 */
export * from '@/features/auth/store/authStore';
