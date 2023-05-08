INSTALL PACKAGE:
Server:
sudo npm install -g http-server

Live-reload
sudo npm install -g nodemon

START SERVER:
http-server . -p 8080 --cors=./corsHeaders.json --mime.types=./mime.types
nodemon --watch . -p 8080 --cors=./corsHeaders.json --mime.types=./mime.types

RESET PAGE CACHE (MACOS):
SHIFT + CMD + R
