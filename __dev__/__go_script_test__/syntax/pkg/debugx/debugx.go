package debugx

import (
	"fmt"
	"syntax/pkg/schema"
)

type Debugx struct {
	schema.Schema
	log schema.Debugger
}

func NewDebugx(log schema.Logger) *Debugx {
	return &Debugx{log: log}
}

func (d *Debugx) Info() {
	d.log.Info()
}

func (d *Debugx) Debug() {
	fmt.Println("debugx.Debug()")
}
