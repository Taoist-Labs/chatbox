try {
  require('conf');
  console.log('CONF_LOAD_OK');
} catch (error) {
  console.error('CONF_LOAD_FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
