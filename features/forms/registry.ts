import "server-only";

// Application imports use this protected boundary. CLI/server scripts should
// import registry-core directly because they do not run in Next's server graph.
export * from "./registry-core";
