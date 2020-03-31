module.exports = {
    "parser": "babel-eslint",
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "airbnb",
    "plugins": [
        "react", "flowtype", "react-hooks"
    ],
    "rules": {
        "indent": [2, "tab"],
		"no-tabs": 0,
		'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
		"no-console": "off",
		"react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
		"react/jsx-indent": [0, 'tab'|2],
		"react/jsx-indent-props": [0, 'tab'|2|'first'],
		"jsx-quotes": ["error", "prefer-single"],
		"react/jsx-curly-spacing": [1, "always"],
		"template-curly-spacing": ["error", "always"],
		"react/prefer-stateless-function": [0, { "ignorePureComponents": true }],
		"no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
		"react/destructuring-assignment": [0, "always"],
		"react/jsx-one-expression-per-line": "off",
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": "warn"
    }
};
