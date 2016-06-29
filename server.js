var express = require('express'),
    app = express(),
    port = process.env.PORT || 8008;

app.get('/', function(request, response) {
  response.send(':)');
});

app.listen(port, function() {
  console.log('listening on port ' + port);
});
