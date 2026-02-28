package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var total int
	var rwlock sync.RWMutex
	var wg sync.WaitGroup

	wg.Add(6)

	// write
	go func() {
		defer wg.Done()
		time.Sleep(2 * time.Second)
		rwlock.Lock() // 加寫鎖, 防止讀寫鎖獲取
		defer rwlock.Unlock()
		fmt.Println("get wirte lock")
		time.Sleep(5 * time.Second)
		total = 17
	}()

	time.Sleep(time.Second)

	for i := 0; i < 5; i++ {
		//	read
		go func() {
			defer wg.Done()

			for {
				rwlock.RLock() // 加讀鎖, 讀鎖不會阻止別人讀
				time.Sleep(500 * time.Millisecond)
				fmt.Println("get read lock")
				fmt.Println(total)
				rwlock.RUnlock()
			}
		}()
	}

	wg.Wait()
}
