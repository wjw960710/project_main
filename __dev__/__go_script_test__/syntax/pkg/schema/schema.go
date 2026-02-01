package schema

type Schema interface {
	Info()
	Debug()
}

type Logger interface {
	Schema
}

type Debugger interface {
	Schema
}
