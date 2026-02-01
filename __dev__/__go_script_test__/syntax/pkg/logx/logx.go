package logx

import (
	"fmt"
	"syntax/pkg/schema"
)

type Logx struct {
	schema.Schema
	debug schema.Debugger
}

func NewLogx(debug schema.Debugger) *Logx {
	return &Logx{debug: debug}
}

func (l *Logx) Info() {
	fmt.Println("logx.Info()")
}

func (l *Logx) Debug() {
	l.debug.Debug()
}
