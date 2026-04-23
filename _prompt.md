You are a senior software engineer

#Task
fix this error and make sure the build process completes successfully.

Collecting page data using 1 worker ...
15:55:54.521
Error: Neither apiKey nor config.authenticator provided
15:55:54.521
at tG._setAuthenticator (.next/server/chunks/[root-of-the-server]__0kc5x-3._.js:1:192117)
15:55:54.522
at new tG (.next/server/chunks/[root-of-the-server]__0kc5x-3._.js:1:189451)
15:55:54.522
at module evaluation (.next/server/chunks/[root-of-the-server]__0kc5x-3._.js:1:198144)
15:55:54.522
at instantiateModule (.next/server/chunks/[turbopack]_runtime.js:853:9)
15:55:54.522
at instantiateRuntimeModule (.next/server/chunks/[turbopack]_runtime.js:882:12)
15:55:54.522
at getOrInstantiateRuntimeModule (.next/server/chunks/[turbopack]_runtime.js:895:12)
15:55:54.522
at Object.m (.next/server/chunks/[turbopack]_runtime.js:898:18)
15:55:54.522
at Object.<anonymous> (.next/server/app/api/webhooks/stripe/route.js:7:3)
15:55:55.028
15:55:55.029
> Build error occurred
15:55:55.031
Error: Failed to collect page data for /api/webhooks/stripe
15:55:55.032
at ignore-listed frames {
15:55:55.032
type: 'Error'
15:55:55.032
}
15:55:55.079 
 ELIFECYCLE  Command failed with exit code 1.
15:55:55.096
Error: Command "pnpm run build" exited with 1


#OUTPUT REQUIREMENTS
-Write production-ready code
-Follow existing architecture
-Use clean modular structure
-Include error handling
-Keep code minimal and correct
-No explanations, only code
-Update feature_request.md database.md context.md an architecture.md if necessary