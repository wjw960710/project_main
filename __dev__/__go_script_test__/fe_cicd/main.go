package main

import (
	"flag"
	"fmt"
	"runtime/debug"
)

func main() {
	/*
		流程：
		1. 配置 cli 取得建置相關參數
			-- app            前端專案名稱
			-- proj_dir       前端專案目錄
			-- proj_build_exc 前端專案構建指令
			-- proj_branch    前端專案分支
			-- proj_mode      前端專案 mode
			-- proj_argv      前端專案其他子參數 --x xx --y yy ...
			-- proj_outdir    前端專案 dist 目錄存放位置 (項目的 vite 要接入)
		2. 清理 proj_outdir
		3. cwd 到專案目錄並 fetch 到最新
		4. git worktree add 在臨時目錄
		5. 執行前端專案構建指令
		6. 清理臨時目錄與 git worktree
		7. cd 到 proj_outdir 中
		8. tar -czvf {APP_NAME} --exclude {APP_NAME} .
		9. 發包

		* 任何的失敗都要清理 proj_outdir, git worktree, git worktree 臨時目錄
	*/

	defer appPanicRecover()
	defer cleanUp()

	argv := parseArgv()
	fmt.Println("argv", argv)
}

type Argv struct {
	App          string
	ProjDir      string
	ProjBuildExc string
	ProjBranch   string
	ProjMode     string
	ProjArgv     string
	ProjOutDir   string
}

func parseArgv() Argv {
	config := Argv{}

	flag.StringVar(&config.ProjOutDir, "proj_outdir", "dist", "前端專案 dist 目錄存放位置 (項目的 vite 要接入)")
	flag.StringVar(&config.ProjArgv, "proj_argv", "", "前端專案其他子參數 --x xx --y yy ...")
	flag.StringVar(&config.ProjMode, "proj_mode", "production", "前端專案 mode")
	flag.StringVar(&config.ProjBranch, "proj_branch", "main", "前端專案分支")
	flag.StringVar(&config.ProjBuildExc, "proj_build_exc", "pnpm run build", "前端專案構建指令")
	flag.StringVar(&config.ProjDir, "proj_dir", "", "前端專案目錄")
	flag.StringVar(&config.App, "app", "", "前端專案名稱")
	flag.Parse()

	if config.ProjDir == "" {
		panic("--proj_dir 參數為必填")
	}

	if config.App == "" {
		panic("--app 參數為必填")
	}

	return config
}

func cleanUp() {

}

func appPanicRecover() {
	if err := recover(); err != nil {
		fmt.Println(err)
		fmt.Println(string(debug.Stack()))
	}
}
