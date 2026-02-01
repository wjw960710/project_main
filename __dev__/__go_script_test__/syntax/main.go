package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"net/http"
	"os"
	"runtime/debug"
	"strconv"
	"syntax/internal/config"
	"syntax/internal/handler"
	"syntax/pkg/debugx"
	logx2 "syntax/pkg/logx"
	_ "syntax/side1ffects" // 引入不使用，但 init 仍然觸發
	"syntax/util"
	"time"
)

func main() {
	fmt.Println("=== ↓ ifswitch() ===\n")
	ifswitch()
	fmt.Println("\n=== ↑ ifswitch()  ↓ afor() ===\n")
	afor()
	fmt.Println("\n=== ↑ afor()  ↓ aslice() ===\n")
	aslice()
	fmt.Println("\n=== ↑ aslice()  ↓ amap() ===\n")
	amap()
	fmt.Println("\n=== ↑ amap()  ↓ pointer() ===\n")
	pointer()
	fmt.Println("\n=== ↑ pointer()  ↓ fn() ===\n")
	fn()
	fmt.Println("\n=== ↑ fn()  ↓ astruct() ===\n")
	astruct()
	fmt.Println("\n=== ↑ astruct()  ↓ atype() ===\n")
	atype()
	fmt.Println("\n=== ↑ atype()  ↓ ajson() ===\n")
	ajson()
	fmt.Println("\n=== ↑ ajson()  ↓ typeFunc() ===\n")
	typeFunc()
	fmt.Println("\n=== ↑ typeFunc()  ↓ ainterface() ===\n")
	ainterface()
	fmt.Println("\n=== ↑ ainterface()  ↓ adefer() ===\n")
	adefer()
	fmt.Println("\n=== ↑ adefer()  ↓ aerror() ===\n")
	aerror()
	fmt.Println("\n=== ↑ aerror()  ↓ generic() ===\n")
	generic()
	fmt.Println("\n=== ↑ generic()  ↓ amodule() ===\n")
	amodule()
	fmt.Println("\n=== ↑ amodule()  ↓ goroutine() ===\n")
	goroutine()
	fmt.Println("\n=== ↑ goroutine() ===")
}

func goroutine() {

}

func amodule() {
	util.Test()

	http.HandleFunc("/", handler.HttpHomeHandler)
	if err := http.ListenAndServe(config.Http.Port, nil); err != nil {
		fmt.Println("(演示用所以給錯誤的 port) ListenAndServe:", err)
	}

	fmt.Println("嵌套引用可多加一層來處理掉但不建議這麼搞")
	logx := logx2.NewLogx(debugx.NewDebugx(nil))
	logx.Debug()
	logx.Info()
}

func generic() {
	arr1 := []string{"str 1", "str 2", "str 3"}
	arr2 := []int{1, 2, 3}
	arr3 := []float64{1.1, 2.2, 3.3}

	arrGenerics(arr1)
	arrGenerics(arr2)
	arrGenerics(arr3)

	type Response[T any] struct {
		Data    T       `json:"data"`
		Success bool    `json:"success"`
		Error   *string `json:"error,omitempty"`
	}

	type User struct {
		ID   int
		Name string
	}

	var response = Response[User]{
		Data: User{
			ID:   1,
			Name: "frank",
		},
		Success: true,
		Error:   nil,
	}
	fmt.Println("response:", response)
}

/*
T - 通用, K - 鍵, V - 值, E - 元素
*/
func arrGenerics[T int | string | float64](vs []T) {
	for _, v := range vs {
		fmt.Println(v)
	}
}

var (
	myReadFileError = NewMyErrNotExists(1, "os.ReadFile 異常 error")
)

func aerror() {
	defer func() {
		// recover 捕獲 panic 錯誤
		if err := recover(); err != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()
	err := errors.New("錯誤訊息")
	fmt.Printf("err.Error() type: %T msg: %s\n", err, err.Error())

	file, err := ReadFile("not_exist_file.txt")
	if err != nil {
		fmt.Println("err:", err)
		fmt.Println("err is os.ErrNotExist?", errors.Is(err, os.ErrNotExist))

		var myErr *MyErrNotExists
		fmt.Println("err is MyErrNotExists?", errors.As(err, &myErr))

		var myErr2 *MyErrNotExists2
		fmt.Println("err is MyErrNotExists2?", errors.As(err, &myErr2))

		fmt.Println("err is myReadFileError?", errors.Is(err, myReadFileError))
	} else {
		fmt.Println("file:", string(file))
	}

	a := "hello"
	b := []byte(a)
	c := string(b)
	fmt.Println("[]byte string 可以互轉 a", a, "-> b", b, "-> c", c)

	fmt.Println("開始製造一些 panic 錯誤")
	var d map[string]any
	d["1"] = 1
	logErr(nil)
	loadConfig()
}

func logErr(err error) {
	fmt.Println("logErr:", err.Error())
}

func loadConfig() {
	if _, err := os.ReadFile("config.json"); err != nil {
		panic("配置文件不存在")
	}
}

type MyErrNotExists struct {
	Code int
	Msg  string
}

func NewMyErrNotExists(code int, msg string) error {
	return &MyErrNotExists{Code: code, Msg: msg}
}

func (e *MyErrNotExists) Error() string {
	return fmt.Sprintf("MyErrNotExists Code: %d Msg: %s", e.Code, e.Msg)
}

type MyErrNotExists2 struct {
	Code int
	Msg  string
}

func NewMyErrNotExists2(code int, msg string) error {
	return &MyErrNotExists{Code: code, Msg: msg}
}

func (e *MyErrNotExists2) Error() string {
	return fmt.Sprintf("MyErrNotExists Code: %d Msg: %s", e.Code, e.Msg)
}

func ReadFile(filename string) ([]byte, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, myReadFileError
	}
	return data, nil
}

const (
	Guest = iota + 1
	Developer
	Admin
)

func ifswitch() {
	role := Developer

	if role == Guest {
		fmt.Println("if Guest")
		return
	} else if role == Developer || role == Admin {
		fmt.Println("else if Developer or Admin")
	}

	fmt.Println("after if 業務")

	switch role {
	case Guest:
		fmt.Println("switch Guest")
	case Developer, Admin:
		fmt.Println("switch Developer or Admin")
	default:
		fmt.Println("after switch 業務")
	}

	fmt.Println("go switch 不需要 break，所以上面 default 沒有執行")

	var a interface{}
	a = 1
	fmt.Printf("%T \n", a)

	switch a.(type) {
	case int:
		fmt.Println("a = int")
	}
}

func afor() {
	for i := 0; i < 5; i++ {
		fmt.Printf("i: %d\n", i)
	}

	i2 := 0
	for {
		if i2 >= 5 {
			break
		}
		fmt.Printf("i2: %d\n", i2)
		i2++
	}
}

func aslice() {
	var users [3]string
	users[0] = "frank"
	users[1] = "jeff"
	users[2] = "jack"
	fmt.Println("users:", users)

	var users2 = [3]string{"2_frank", "2_jeff", "2_jack"}
	fmt.Println("users2:", users2)

	var users3 []string
	users3 = append(users3, "3_frank", "3_jeff", "3_jack")
	fmt.Println("users3:", users3)

	for i, _ := range users3 {
		fmt.Println(i, "_ 申明表示不用，所以用[i]取", users3[i])
	}

	fmt.Println("users3[:]:", users3[:])
	fmt.Println("users3[:2]:", users3[:2])
	fmt.Println("users3[2]:", users3[2])
	fmt.Println("users3[2:3]:", users3[2:3])

	var idxes []int
	for i := 0; i < 5; i++ {
		idxes = append(idxes, i)
		fmt.Println(fmt.Sprintf("var = append() 地址不變 %p ", &idxes), "idxes:", idxes, "len:", len(idxes), "cap:", cap(idxes))
	}

	idxes2 := idxes[1:2]
	fmt.Println("idxes2 := idxes[1:2] idxes2:", idxes2)
	idxes2[0] = 100
	fmt.Println("[:] 並不會深拷貝，所以 idxes2[0] = 100 idxes:", idxes, "idxes2:", idxes2)

	idxes = append([]int{}, idxes[2:4]...)
	fmt.Println("刪除元素可以這麼搞，idxes = append([]int{}, idxes[2:4]...)，而且這樣會克隆", idxes)

	idxes = append([]int{}, idxes[:len(idxes)-1]...)
	fmt.Println("idxes = append([]int{}, idxes[:len(idxes)]...)", idxes)
}

func amap() {
	var a = map[string]string{}
	a["user"] = "a_frank"
	fmt.Println("map a:", a)

	var b = make(map[string]string)
	b["user"] = "b_frank"
	fmt.Println("map b:", b, "b[\"user\"]:", b["user"])

	c := map[string]string{"user": "c_frank", "age": "29"}
	fmt.Println("map c:", c)
	for k := range c {
		fmt.Println("map c - k:", k, "c[k]:", c[k])
	}
	for k, v := range c {
		fmt.Println("map c - k:", k, "v:", v)
	}
	fmt.Println("map c - len(c):", len(c))
	delete(c, "age")
	fmt.Println("map c - delete(c, \"age\"):", c)
	fmt.Println("map c - len(c):", len(c))

	d := make(map[int]int, 10 /*可以預設空間*/)
	fmt.Println("map d:", d)
	for i := 0; i < 5; i++ {
		d[i] = 777
	}
	fmt.Println("for i := 0; i < 5; i++ { d[i] = 777 } - map d:", d)
	v, ok := d[7]
	if ok {
		fmt.Println("d[7] 存在，d[7]:", v)
	}
	fmt.Println("d[7] 不存在 !ok, d7 為", d[7], "沒值的話取零值 (int = 0)")

	e := make(map[int]string, 10 /*可以預設空間*/)
	fmt.Println("e[7] 不存在, e7 為", e[7], "沒值的話取零值 (string = \"\")")

	f := make(map[int]bool)
	fmt.Println("f[7] 不存在, f7 為", f[7], "沒值的話取零值 (bool = false)")

	var g map[string]int
	fmt.Println("map 沒創建 {} 的話為 nil map[string]int g == nil", g == nil, "len(g)", len(g))

	h := map[string]int{}
	fmt.Println("map 有創建 {} 但為空的話不為 nil map[string]int{} h == nil", h == nil, "len(h)", len(h))
}

func adefer() {
	openFile()
	defer adefer2()
	defer fmt.Println("defer 在函數結束前先進後出執行: 邏輯執行 > return執行 > defer執行 > 函數返回")
	defer closeFile()

	fmt.Println("do something")

	if true {
		//closeFile()
		//return
	}

	//closeFile()

	calcTimer(func() {
		//for {
		optionsFile()
		// 產生 1..200 的整數（含 1 與 200）
		ms := rand.IntN(200) + 1
		d := time.Duration(ms) * time.Millisecond
		time.Sleep(d)
		//}
	})
}

func adefer2() {
	i := 0
	defer fmt.Println("defer 值捕獲申明值 a:", i)
	defer func() { fmt.Println("defer 閉包捕獲最後值 b:", i) }()
	fmt.Println("i:", i)
	i++
	fmt.Println("i++ i:", i)
}

func calcTimer(handler func()) {
	t := time.Now()
	defer fmt.Println("耗時: ", time.Since(t))

	fmt.Println("calcTimer handle() 執行開始...")
	handler()
}

func optionsFile() {
	file, err := os.OpenFile(".gitignore", os.O_RDONLY|os.O_WRONLY, 0666)
	if err != nil {
		fmt.Println("文件開啟失敗:", err)
		return
	}
	defer file.Close()

	fmt.Println("open file 後的業務邏輯")
}

func openFile() {
	fmt.Println("open file")
}

func closeFile() {
	fmt.Println("close file")
}

func ainterface() {
	if n, ok := AddByGeneric(1, 2); ok == nil {
		fmt.Println("AddByGeneric(1, 2): ", n)
	}
	if n, ok := AddByAny(3, 4); ok == nil {
		fmt.Println("AddByAny(3, 4): ", n)
	}

	var student Person
	student = &Student{}
	student.Study("數學")
	fmt.Println("student.GetClass():", student.GetClass())
	fmt.Println("斷言調用 student.(*Student).GetClass2():", student.(*Student).GetClass2())

	var excelExporter DataExporter = &ExcelExporter{}
	excelExporter.Export()
	excelExporter.Keys()
	excelExporter.Validate()
}

type ExcelExporter struct{}

func (e *ExcelExporter) Export() error {
	fmt.Println("ExcelExporter Export")
	return nil
}

func (e *ExcelExporter) Validate() error {
	fmt.Println("ExcelExporter Validate")
	return nil
}

func (e *ExcelExporter) Keys() error {
	fmt.Println("ExcelExporter Keys")
	return nil
}

type Validator interface {
	Validate() error
	Keys() error
}

type DataExporter interface {
	Export() error
	Validator // interface 繼承
}

// 先用未使用的變數去接就能即時發現未申明的函數
var _ DataExporter = (*ExcelExporter)(nil)

type Person interface {
	Study(class string)
	GetClass() string
}

type Student struct {
	Class string
}

func (s *Student) Study(class string) {
	s.Class = class
	fmt.Println("學生正學習:", s.Class)
}

func (s *Student) GetClass() string {
	return s.Class
}

func (s *Student) GetClass2() string {
	return s.Class
}

func toIntByGeneric[T ~string | ~int](v T) (int, error) {
	switch _v := any(v).(type) {
	case int:
		return _v, nil
	case string:
		return strconv.Atoi(_v)
	default:
		return 0, fmt.Errorf("unsupport type: %T", _v)
	}
}

func AddByGeneric[T ~string | ~int](v, v2 T) (int, error) {
	_v, err := toIntByGeneric(v)
	if err != nil {
		return 0, err
	}
	_v2, err := toIntByGeneric(v2)
	if err != nil {
		return 0, err
	}

	return _v + _v2, nil
}

func toIntByAny(v any) (int, error) {
	switch _v := v.(type) {
	case int:
		return _v, nil
	case string:
		return strconv.Atoi(_v)
	default:
		return 0, fmt.Errorf("unsupport type: %T", _v)
	}
}

func AddByAny(v, v2 any) (int, error) {
	_v, err := toIntByAny(v)
	if err != nil {
		return 0, err
	}
	_v2, err := toIntByAny(v2)
	if err != nil {
		return 0, err
	}

	return _v + _v2, nil
}

type handle func() error

func withRetry(fn handle, retry int) error {
	var err error
	for i := 0; i < retry; i++ {
		err = fn()
		if err == nil {
			break
		}
		fmt.Println("#", i+1, "retry error --", err)
	}
	return err
}

func callApi(api string) error {
	return errors.New("api: " + api + " 訪問失敗")
	//return nil
}

type Ctx struct{}
type Handle func(ctx *Ctx)

func log(handle Handle) Handle {
	return func(ctx *Ctx) {
		fmt.Println("--- log start ---")
		handle(ctx)
		fmt.Println("--- log end ---")
	}
}

func err(handle Handle) Handle {
	return func(ctx *Ctx) {
		fmt.Println("--- err start ---")
		handle(ctx)
		fmt.Println("--- err end ---")
	}
}

func typeFunc() {
	f := func(n int) int {
		return n + 1
	}
	fmt.Printf("%T\n", f)

	api := "https://google.tw"
	if ok := withRetry(func() error { return callApi(api) }, 3); ok == nil {
		fmt.Println("api 訪問成功")
	}

	fmt.Println("中間件套娃寫法 err(log(handle))(ctx):")
	ctx := new(Ctx)
	handle := func(ctx *Ctx) {
		fmt.Println("handle")
	}
	err(log(handle))(ctx)
}

var configStr = `{
	"name": "dev",
	"host": "localhost",
	"port": 3306,
	"mysql": {
		"user": "root",
		"pwd": "0000"
	}
}`

type Config struct {
	Name string `json:"name"`
	Host string `json:"host"`
	Port int    `json:"port"`
	Mysql/*屬性名與類型一致，可以簡寫*/ `json:"mysql"`
}

type Mysql struct {
	User     string `json:"user"`
	Password string `json:"pwd"`
}

func ajson() {
	var config Config
	if ok := json.Unmarshal([]byte(configStr), &config); ok == nil {
		fmt.Printf("config: %+v\n", config)
	}
}

type loop [5]string

func (l *loop) Add(val string) {
	for i := 1; i < len(l); i++ {
		l[i-1] = l[i]
	}
	l[len(l)-1] = val
}

func (l *loop) Print() {
	fmt.Println(l)
}

func atype() {
	var l loop
	l.Add("a")
	l.Add("b")
	l.Add("c")
	l.Add("d")
	l.Add("e")
	l.Print()
	l.Add("f")
	l.Add("g")
	l.Print()
}

type Info struct {
	Address []string
	Desc    string
}
type User struct {
	Name string
	Age  int
	Info Info
}

func (u *User) ToString() string {
	return fmt.Sprintf("User: %s, %d", u.Name, u.Age)
}

func NewUser(name string, age int) *User {
	return &User{Name: name, Age: age}
}

func NewUser2(name string, age int) User {
	return User{Name: name, Age: age}
}

func astruct() {
	u := User{"wjw", 20, Info{Address: []string{"a"}}}
	fmt.Printf("u: %+v address: %v\n", u.ToString(), u.Info.Address)

	u2 := User{Name: "wjw2", Age: 20}
	u2.Age = u2.Age + 1
	fmt.Printf("u2: %+v\n", u2)

	u3 := NewUser("wjw3", 20)
	u3_2 := u3
	u3.Age = 23
	fmt.Printf("u3: %+v\n", u3)
	fmt.Printf("u3_2: %+v\n", u3_2)

	u4 := NewUser2("wjw4", 20)
	u4_2 := u4
	u4_3 := &u4
	u4.Age = 24
	fmt.Printf("u4: %+v\n", u4)
	fmt.Printf("u4_2: %+v\n", u4_2)
	fmt.Printf("u4_3: %+v\n", u4_3)
}

func fn() {
	a := func(n1, n2 int) int {
		return n1 + n2
	}(1, 2)

	fmt.Printf("a: %d\n", a)

	b := func(n1, n2 int) (res int) {
		res = 9
		n3 := n1 + n2
		return n3
	}(1, 2)

	fmt.Printf("b: %d\n", b)

	y, m, d := func(t int) (y, m, d int) {
		y = t / 10000
		m = t/100 - y*100
		d = t - y*10000 - m*100
		return y, m, d
	}(20060115)

	fmt.Printf("y: %d, m: %d, d: %d\n", y, m, d)
}

func pointer() {
	a := 1
	b := 2
	c := &a
	*c = 3
	fmt.Printf("a, b, c: %d, %d, %d\n", a, b, *c)
	fmt.Printf("a %p, b %p, c %p\n", &a, &b, c)
	d := *c
	fmt.Printf("d: %d\n", d)

	var e *string
	if e == nil {
		fmt.Println("e 指針為空需要創建")
		e = new(string)
	}
	*e = "wjw"
	fmt.Printf("e %s\n", *e)
}
