import cac from 'cac'

type CliOption = {
	desc: string
	defaultValue: any
}

type FirstUppercase<S extends string> = S extends `${infer F}${infer R}`
	? `${Uppercase<F>}${R}`
	: S

type OptionName<
	Name extends string,
	Res extends string = '',
> = Name extends `${infer V}-${infer R}`
	? OptionName<R, `${Res}${Res extends '' ? V : FirstUppercase<V>}`>
	: Res extends ''
		? Name
		: `${Res}${FirstUppercase<Name>}`

export type ParsedOption<T extends Record<string, CliOption>> = {
	[Cmd in keyof T as Cmd extends `--${infer Name} ${infer _R}`
		? OptionName<Name>
		: Cmd extends `--${infer Name}`
			? OptionName<Name>
			: never]: T[Cmd] extends {
		defaultValue: infer ValType
	}
		? ValType | undefined
		: undefined
}

type ParsedArgv<Opts = { [key: string]: any }> = {
	args: ReadonlyArray<string>
	options: Opts
}

export function bootstrapCac<T extends Record<string, CliOption>>({
	options,
}: {
	options: T
}): ParsedArgv<ParsedOption<T>> {
	const cli = cac()
	for (let k in options) {
		const cmd = k as keyof T & string
		const { desc, defaultValue } = options[cmd]
		cli.option(cmd, desc, defaultValue ? { default: defaultValue } : undefined)
	}
	cli.help()
	return cli.parse() as ParsedArgv<ParsedOption<T>>
}
