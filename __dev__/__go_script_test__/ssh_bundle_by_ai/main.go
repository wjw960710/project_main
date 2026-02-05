package main

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"gopkg.in/yaml.v3"
)

type Env struct {
	SSHHost     string            `yaml:"ssh_host"`
	SSHUsername string            `yaml:"ssh_username"`
	SSHPassword string            `yaml:"ssh_password"`
	SSHStatic   string            `yaml:"ssh_static"`
	App         map[string]EnvApp `yaml:"app"`
}

type EnvApp struct {
	SSHName    string `yaml:"ssh_name"`
	ProjectDir string `yaml:"project_dir"`
	UploadFile string `yaml:"upload_file"`
	BuildExec  string `yaml:"build_exec"`
}

type ResultEnv struct {
	SSHHost     string
	SSHUsername string
	SSHPassword string
	SSHStatic   string
	App         EnvApp
}

func main() {
	var configPath string
	var envName string
	var appName string
	var branchName string
	var skipBuild bool

	flag.StringVar(&configPath, "config", "", "config 檔路徑")
	flag.StringVar(&envName, "env", "", "執行環境")
	flag.StringVar(&appName, "app", "", "應用名稱")
	flag.StringVar(&branchName, "branch", "", "分支名稱")
	flag.BoolVar(&skipBuild, "skip_build", false, "略過打包")
	flag.Parse()

	fmt.Println("子指令參數：")
	fmt.Printf("{\n  \"config\": %q,\n  \"env\": %q,\n  \"app\": %q\n}\n", configPath, envName, appName)

	if configPath == "" || envName == "" || appName == "" || branchName == "" {
		fatalf("缺少必要的配置檔參數 --config, --env, --app, --branch")
		return
	}

	env, err := loadAndResolveEnv(configPath, envName, appName)
	if err != nil {
		fatalErr(err)
		return
	}

	fmt.Printf("env: %+v\n", env)

	if env.SSHHost == "" || env.SSHUsername == "" || env.SSHPassword == "" {
		fatalf("缺少必要的 SSH 連線參數 ssh_host, ssh_username, ssh_password")
		return
	}
	if env.SSHStatic == "" || env.App.SSHName == "" || env.App.ProjectDir == "" || env.App.UploadFile == "" || env.App.BuildExec == "" {
		fatalf("缺少打包/上傳必要的參數 ssh_static, app.ssh_name, app.project_dir, app.upload_file, app.build_exec")
		return
	}

	buildProjectDir := env.App.ProjectDir

	if !skipBuild {
		tmpRoot, tmpProjectDir, cleanup, err := prepareTempWorkspaceWithGitWorktree(buildProjectDir, branchName)
		if err != nil {
			fatalErr(err)
			return
		}
		defer cleanup()

		buildProjectDir = tmpProjectDir
		fmt.Printf("使用暫存 workspace: %s\n", tmpRoot)
		fmt.Printf("worktree 位置: %s\n", buildProjectDir)

		fmt.Println("開始運行打包指令 ...")
		if err := runLocalCommand(env.App.BuildExec, buildProjectDir); err != nil {
			fatalErr(err)
			return
		}
		fmt.Println("✅ 已完成運行打包指令")
	}

	sshClient, err := connectSSH(env.SSHHost, env.SSHUsername, env.SSHPassword, 22)
	if err != nil {
		fatalErr(err)
		return
	}
	defer sshClient.Close()
	fmt.Println("✅ SSH 連線成功!")

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		fatalErr(fmt.Errorf("建立 SFTP 失敗: %w", err))
		return
	}
	defer sftpClient.Close()

	homePath, err := resolveRemotePath(sshClient, "~")
	if err != nil {
		fatalErr(err)
		return
	}

	localZipPath := filepath.Join(buildProjectDir, filepath.FromSlash(env.App.UploadFile))
	remoteZipPath, err := uploadFileSFTP(sftpClient, sshClient, localZipPath, homePath)
	if err != nil {
		fatalErr(err)
		return
	}
	fmt.Println("✅ 檔案上傳成功!")

	remoteAppDir := path.Join(env.SSHStatic, env.App.SSHName) // POSIX path
	fmt.Printf("開始將檔案解壓縮至 %s\n", remoteAppDir)

	// 注意：sudo 可能需要 TTY/密碼，這裡假設遠端已設定免密 sudo 或允許非互動 sudo。
	if _, err := execRemote(sshClient, fmt.Sprintf(`sudo unzip -o %q -d %q`, remoteZipPath, remoteAppDir)); err != nil {
		fatalErr(err)
		return
	}
	fmt.Println("✅ 檔案解壓縮成功!")

	if err := deleteRemoteFile(sshClient, remoteZipPath); err != nil {
		fatalErr(err)
		return
	}

	fmt.Println("🔒 SSH 連線已關閉")
}

func fatalf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, "❌ "+format+"\n", a...)
}

func fatalErr(err error) {
	fmt.Fprintf(os.Stderr, "❌ %v\n", err)
}

func loadAndResolveEnv(configPath, envName, appName string) (*ResultEnv, error) {
	b, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("讀取 config 失敗: %w", err)
	}

	all := map[string]Env{}
	if err := yaml.Unmarshal(b, &all); err != nil {
		return nil, fmt.Errorf("YAML 解析失敗: %w", err)
	}

	base := all["base"]
	target, ok := all[envName]
	if !ok {
		return nil, fmt.Errorf("環境 %s 配置不存在", envName)
	}

	// 合併 app map：base.app 覆蓋到 env.app（env 優先）
	mergedApps := map[string]EnvApp{}
	for k, v := range base.App {
		mergedApps[k] = v
	}
	for k, v := range target.App {
		mergedApps[k] = mergeEnvApp(mergedApps[k], v) // env 補/覆蓋 base
	}

	appCfg, ok := mergedApps[appName]
	if !ok {
		return nil, fmt.Errorf("%s app 配置不存在", appName)
	}

	// 合併 base + env（env 優先）
	merged := mergeEnv(base, target)

	return &ResultEnv{
		SSHHost:     merged.SSHHost,
		SSHUsername: merged.SSHUsername,
		SSHPassword: merged.SSHPassword,
		SSHStatic:   merged.SSHStatic,
		App:         appCfg,
	}, nil
}

func mergeEnv(base, env Env) Env {
	out := base
	if env.SSHHost != "" {
		out.SSHHost = env.SSHHost
	}
	if env.SSHUsername != "" {
		out.SSHUsername = env.SSHUsername
	}
	if env.SSHPassword != "" {
		out.SSHPassword = env.SSHPassword
	}
	if env.SSHStatic != "" {
		out.SSHStatic = env.SSHStatic
	}
	// App 在外面另行處理
	return out
}

func mergeEnvApp(base, env EnvApp) EnvApp {
	out := base
	if env.SSHName != "" {
		out.SSHName = env.SSHName
	}
	if env.ProjectDir != "" {
		out.ProjectDir = env.ProjectDir
	}
	if env.UploadFile != "" {
		out.UploadFile = env.UploadFile
	}
	if env.BuildExec != "" {
		out.BuildExec = env.BuildExec
	}
	return out
}

func runLocalCommand(command, cwd string) error {
	fmt.Printf("📂 目录: %s\n", cwd)
	fmt.Printf("🚀 命令: %s\n", command)

	var cmd *exec.Cmd
	if isWindows() {
		cmd = exec.Command("cmd.exe", "/C", command)
	} else {
		cmd = exec.Command("sh", "-lc", command)
	}
	cmd.Dir = cwd
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("命令執行失敗: %w", err)
	}
	fmt.Println("✅ 执行成功")
	return nil
}

func connectSSH(host, username, password string, port int) (*ssh.Client, error) {
	cfg := &ssh.ClientConfig{
		User:            username,
		Auth:            []ssh.AuthMethod{ssh.Password(password)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // 生產環境建議改成固定 known_hosts 驗證
		Timeout:         20 * time.Second,
	}
	addr := fmt.Sprintf("%s:%d", host, port)
	return ssh.Dial("tcp", addr, cfg)
}

func execRemote(client *ssh.Client, command string) (string, error) {
	sess, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("建立 SSH session 失敗: %w", err)
	}
	defer sess.Close()

	var stdout, stderr bytes.Buffer
	sess.Stdout = &stdout
	sess.Stderr = &stderr

	if err := sess.Run(command); err != nil {
		return "", fmt.Errorf("遠端命令失敗: %w\nstderr: %s", err, strings.TrimSpace(stderr.String()))
	}
	if s := strings.TrimSpace(stderr.String()); s != "" {
		// 有些命令會寫 stderr 但仍成功，這裡不當錯誤，只回傳給你參考
	}
	return strings.TrimSpace(stdout.String()), nil
}

func resolveRemotePath(client *ssh.Client, remotePath string) (string, error) {
	if strings.HasPrefix(remotePath, "~") {
		home, err := execRemote(client, "echo $HOME")
		if err != nil {
			return "", err
		}
		return home + remotePath[1:], nil
	}
	return remotePath, nil
}

func uploadFileSFTP(sftpClient *sftp.Client, sshClient *ssh.Client, localPath, remoteDir string) (string, error) {
	fi, err := os.Stat(localPath)
	if err != nil {
		return "", fmt.Errorf("本機檔案不存在或不可讀: %w", err)
	}
	if fi.IsDir() {
		return "", errors.New("localPath 是目錄，預期是檔案")
	}

	filename := filepath.Base(localPath)

	resolvedRemoteDir, err := resolveRemotePath(sshClient, remoteDir)
	if err != nil {
		return "", err
	}
	resolvedRemoteDir = strings.TrimRight(resolvedRemoteDir, "/")
	fullRemotePath := resolvedRemoteDir + "/" + filename

	src, err := os.Open(localPath)
	if err != nil {
		return "", fmt.Errorf("打開本機檔案失敗: %w", err)
	}
	defer src.Close()

	dst, err := sftpClient.Create(fullRemotePath)
	if err != nil {
		return "", fmt.Errorf("建立遠端檔案失敗: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("上傳失敗: %w", err)
	}

	fmt.Printf("📁 文件上傳成功: %s -> %s\n", filename, fullRemotePath)
	return fullRemotePath, nil
}

func deleteRemoteFile(client *ssh.Client, remotePath string) error {
	resolved, err := resolveRemotePath(client, remotePath)
	if err != nil {
		return err
	}
	_, err = execRemote(client, fmt.Sprintf(`rm -f %q`, resolved))
	if err != nil {
		return fmt.Errorf("刪除檔案時出錯: %w", err)
	}
	fmt.Printf("🗑️ 檔案刪除成功: %s\n", resolved)
	return nil
}

func isWindows() bool {
	return strings.Contains(strings.ToLower(os.Getenv("OS")), "windows") || (os.PathSeparator == '\\')
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

	// worktree 建好後，把分支更新到最新：
	// 這裡用「fetch + reset --hard origin/<branch>」最穩，不依賴 upstream 設定，也避免 pull 互動式合併。
	if err := runGit(tmpProjectDir, "fetch", "--prune", "origin", branch); err != nil {
		cleanup()
		return "", "", nil, err
	}

	if err := runGit(tmpProjectDir, "reset", "--hard", "origin/"+branch); err != nil {
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
