package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		go func(i int) {
			wg.Add(1)
			defer wg.Done()
			fmt.Println(i)
		}(i)
	}

	wg.Wait()
}
