package util

type EmptyWithOption func(*emptyWithConfig)

type emptyWithConfig struct {
	customizer func(string) string
}

func WithCustomizer(fn func(string) string) EmptyWithOption {
	return func(config *emptyWithConfig) {
		config.customizer = fn
	}
}

func EmptyWith(txt string, nstr string, options ...EmptyWithOption) string {
	config := &emptyWithConfig{}

	// 應用所有選項
	for _, option := range options {
		option(config)
	}

	if txt == "" || txt == "-" {
		return nstr
	}

	if config.customizer != nil {
		return config.customizer(txt)
	}

	return txt
}
