package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	repoDir := `C:\Users\frank.wcw\Desktop\untitled`
	branch := "dev"

	tmpRoot, tmpProjectDir, cleanup, err := prepareTempWorkspaceWithGitWorktree(repoDir, branch)
	if err != nil {
		fatalErr(err)
	}
	defer cleanup()

	fmt.Printf("使用暫存 workspace: %s\n", tmpRoot)
	fmt.Printf("worktree 位置: %s\n", tmpProjectDir)

	fmt.Println("開始運行打包指令 ...")
	//if err := runLocalCommand(env.App.BuildExec, buildProjectDir); err != nil {
	//	fatalErr(err)
	//}
	fmt.Println("✅ 已完成運行打包指令")
}

func fatalErr(err error) {
	fmt.Fprintf(os.Stderr, "❌ %v\n", err)
	os.Exit(1)
}

func prepareTempWorkspaceWithGitWorktree(repoDir, branch string) (tmpRoot string, tmpProjectDir string, cleanup func(), err error) {
	absRepo, err := filepath.Abs(filepath.FromSlash(repoDir))
	if err != nil {
		return "", "", nil, fmt.Errorf("取得 repo 絕對路徑失敗: %w", err)
	}

	tmpRoot, err = os.MkdirTemp("", "pack-worktree-*")
	if err != nil {
		return "", "", nil, fmt.Errorf("建立暫存目錄失敗: %w", err)
	}

	tmpProjectDir = filepath.Join(tmpRoot, "project")

	cleanup = func() {
		// 先讓 git 正確移除 worktree，再刪資料夾
		_ = runGit(absRepo, "worktree", "remove", "--force", tmpProjectDir)
		_ = runGit(absRepo, "worktree", "prune")
		_ = os.RemoveAll(tmpRoot)
	}

	// 在 repo 上新增一個 dev 分支的 worktree 到 tmpProjectDir
	// --force：即使目的地資料夾存在也強制（我們是新 temp，一般不會碰到）
	if err := runGit(absRepo, "worktree", "add", "--force", tmpProjectDir, branch); err != nil {
		cleanup()
		return "", "", nil, err
	}

	return tmpRoot, tmpProjectDir, cleanup, nil
}

func runGit(repoDir string, args ...string) error {
	// 用 git -C <repoDir> ... 讓命令永遠在正確 repo 上執行
	fullArgs := append([]string{"-C", repoDir}, args...)
	cmd := exec.Command("git", fullArgs...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git %s 失敗: %w", strings.Join(args, " "), err)
	}
	return nil
}
