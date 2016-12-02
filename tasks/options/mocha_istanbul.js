module.exports = () => ({
  coveralls: {
    src: 'test',
    options: {
      coverage: true,
      coverageFolder: 'coverage',
      check: {
        lines: 75,
        statements: 75,
      },
      root: './lib',
      reportFormats: [ 'cobertura', 'lcovonly' ]
    }
  }
});
