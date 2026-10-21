import {NextRequest,NextResponse} from 'next/server';
const endpoint=process.env.BABI_API_URL||'http://127.0.0.1:8080';
export async function GET(){
 try {const r=await fetch(endpoint+'/api/v1/workspace',{cache:'no-store'});return new NextResponse(await r.text(),{status:r.status,headers:{'Content-Type':'application/json'}})}
 catch {return NextResponse.json({error:'Database API unavailable'},{status:503})}
}
export async function PUT(req:NextRequest){
 try {
  const body=await req.text();
  if(body.length>5*1024*1024)return NextResponse.json({error:'Workspace too large'},{status:413});
  const r=await fetch(endpoint+'/api/v1/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body,cache:'no-store'});
  return new NextResponse(await r.text(),{status:r.status,headers:{'Content-Type':'application/json'}});
 }catch{return NextResponse.json({error:'Database API unavailable'},{status:503})}
}
