interface ViteTypeOptions {
	// 添加这行代码，你就可以将 ImportMetaEnv 的类型设为严格模式，
	// 这样就不允许有未知的键值了。
	// strictImportMetaEnv: unknown
}

interface ServerEnv {
	readonly SERVER_NEXUS_URL: string
	readonly SERVER_NEXUS_REPOSITORY: string
	readonly SERVER_NEXUS_USERNAME: string
	readonly SERVER_NEXUS_PASSWORD: string
	readonly SERVER_NEXUS_DIRECTORY: string
}

interface ImportMetaEnv {}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare const VITE_MODE: string
declare const VITE_NEXUS_BASE: string
