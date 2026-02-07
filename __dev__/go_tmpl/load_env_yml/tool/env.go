package tool

import (
	"fmt"
	"load_env_yml/constant"
	"os"

	"gopkg.in/yaml.v3"
)

func LoadEnv(configPath string) (*constant.Env, error) {
	b, err := os.ReadFile(configPath)
	if err != nil {
		return nil, WrapErr(fmt.Errorf("讀取 config 失敗: %w", err))
	}

	env := constant.Env{}
	if err := yaml.Unmarshal(b, &env); err != nil {
		return nil, WrapErr(fmt.Errorf("YAML 解析失敗: %w", err))
	}

	return &env, nil
}
