const files={
 'marketing.mp4':{size:56910157,sha256:'569f06f6d8280a36d24a094341a3368edc4fa42bd7047e135e415b5020aef187'},
 'alejandra-56ffa174.mp4':{size:50673002,sha256:'56ffa1744f9acd4e99c4cb795bac3df9623980db14d491f232d33bd4bdeef1e1'},
 'momentos-b1419dbd.mp4':{size:67653469,sha256:'b1419dbdfc24f4784ef9163214f3c4a0c460b410ebcaaf4af75cda6afa1e9ae4'},
 'habibis-8f2f4875.mp4':{size:6861838,sha256:'8f2f4875068ec539a3337d2a6640041e46b5a7ec5e6912abcc59673906d98e6f'},
 'meses-59f537b7.mp4':{size:3336042,sha256:'59f537b7b29d20c52ae3a9578275fdb3a34ce892c82741de6c9ef2b28e32ad27'}
};
export async function media(request,env){
 const name=new URL(request.url).pathname.split('/').pop(),file=files[name];
 if(!file)return new Response('No encontrado',{status:404});
 if(!env.BUCKET)return new Response('Video no disponible',{status:503});
 const key='portfolio/'+name;
 try{
  if(request.method==='PUT'){
   // Temporary import accepts only the exact owner-supplied selection.
   if(!env.MEDIA_IMPORT_TOKEN||request.headers.get('authorization')!=='Bearer '+env.MEDIA_IMPORT_TOKEN)return new Response('No autorizado',{status:403});
   if(Number(request.headers.get('content-length'))!==file.size)return new Response('Tamaño incorrecto',{status:400});
   await env.BUCKET.put(key,request.body,{sha256:file.sha256,httpMetadata:{contentType:'video/mp4'}});
   return new Response('Guardado');
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
  const meta=await env.BUCKET.head(key);if(!meta)return new Response('Video no disponible',{status:404});
  const headers=new Headers({'content-type':'video/mp4','accept-ranges':'bytes','cache-control':'private, max-age=3600','etag':meta.httpEtag,'x-content-type-options':'nosniff'});
  let start=0,end=meta.size-1,status=200;
  const range=request.method==='GET'?request.headers.get('range'):null;
  if(range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'content-range':`bytes */${meta.size}`}});
   start=m[1]?Number(m[1]):Math.max(0,meta.size-Number(m[2]));end=m[1]&&m[2]?Math.min(Number(m[2]),end):end;
   if(start>end||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return new Response(null,{status:416,headers:{'content-range':`bytes */${meta.size}`}});
   headers.set('content-range',`bytes ${start}-${end}/${meta.size}`);status=206;
  }
  headers.set('content-length',String(end-start+1));
  if(request.method==='HEAD')return new Response(null,{headers});
  const obj=await env.BUCKET.get(key,range?{range:{offset:start,length:end-start+1}}:undefined);
  return new Response(obj.body,{status,headers});
 }catch{ return new Response('No se pudo cargar el video',{status:503}); }
}
