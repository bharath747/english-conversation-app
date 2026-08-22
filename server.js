const http=require('http'),fs=require('fs'),path=require('path');
const port=process.env.PORT||4200;
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'};
http.createServer((req,res)=>{let url=(req.url||'/').split('?')[0];if(url==='/')url='/index.html';const file=path.join(__dirname,url);if(!file.startsWith(__dirname)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res)}).listen(port,()=>console.log(`Little English Friends running on http://localhost:${port}`));
