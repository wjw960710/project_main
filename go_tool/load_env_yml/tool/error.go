package tool

import (
	"fmt"
	"runtime"
)

type withPosError struct {
	err  error
	file string
	line int
}

func (e withPosError) Error() string {
	return fmt.Sprintf("%s:%d: %v", e.file, e.line, e.err)
}

func WrapErr(err error) error {
	if err == nil {
		return nil
	}
	// WrapErr 的调用者位置：Caller(1)
	_, file, line, ok := runtime.Caller(1)
	if !ok {
		return err
	}
	return withPosError{err: err, file: file, line: line}
}
