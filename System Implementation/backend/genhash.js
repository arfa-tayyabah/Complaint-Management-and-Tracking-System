const b = require('bcryptjs');
(async () => {
  const hash = await b.hash('demo1234', 10);
  console.log(hash);
})();
