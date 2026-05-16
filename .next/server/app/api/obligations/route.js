"use strict";(()=>{var e={};e.id=939,e.ids=[939],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},5418:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>S,patchFetch:()=>R,requestAsyncStorage:()=>x,routeModule:()=>h,serverHooks:()=>v,staticGenerationAsyncStorage:()=>y});var i={};a.r(i),a.d(i,{DELETE:()=>b,GET:()=>g,PATCH:()=>f,POST:()=>m});var r=a(3278),s=a(5002),o=a(4877),n=a(1309),l=a(3154),d=a(3621),u=a(526),c=a(4691),p=a(1418);async function g(){try{let e=await (0,u.t)();if(!e)return n.NextResponse.json({error:"No autenticado"},{status:401});let t=(0,c.F)(e.permissions,"treasury.view"),a=(0,c.F)(e.permissions,"treasury.view.own");if(!t&&!a)return n.NextResponse.json({error:"Sin permisos para ver tesorer\xeda"},{status:403});let i=await l._.userObligation.findMany({orderBy:{assignedAt:"desc"},include:{user:{select:{id:!0,fullName:!0,email:!0}},obligation:{select:{id:!0,title:!0,description:!0,amount:!0,dueDate:!0,isActive:!0}}},...a&&!t?{where:{userId:e.id}}:{}});return n.NextResponse.json({data:i})}catch(e){return console.error("GET /api/obligations error:",e),n.NextResponse.json({error:"Error obteniendo obligaciones",details:String(e)},{status:500})}}async function m(e){try{let t=await (0,u.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,c.F)(t.permissions,"obligations.create"))return n.NextResponse.json({error:"No tienes permiso para crear obligaciones"},{status:403});let a=await e.json(),i=d.Zv.safeParse({...a,createdById:t.id});if(!i.success)return n.NextResponse.json({error:"Datos inv\xe1lidos",details:i.error.flatten()},{status:400});let r=await l._.financialObligation.create({data:{title:i.data.title,description:i.data.description,amount:i.data.amount,dueDate:new Date(i.data.dueDate),createdById:t.id}}),s=[];for(let e of(i.data.userIds.length>0&&(await l._.userObligation.createMany({data:i.data.userIds.map(e=>({obligationId:r.id,userId:e,assignedAmount:i.data.amount,balance:i.data.amount,status:"PENDIENTE"}))}),s=await l._.user.findMany({where:{id:{in:i.data.userIds}},select:{fullName:!0,email:!0}})),s))try{await (0,p.tJ)({to:e.email,fullName:e.fullName,obligationTitle:r.title,description:r.description,amount:Number(r.amount),dueDate:new Date(r.dueDate)})}catch(t){console.error(`Error enviando correo de obligaci\xf3n a ${e.email}:`,t)}return n.NextResponse.json({message:"Obligaci\xf3n creada correctamente"},{status:201})}catch(e){return console.error("POST /api/obligations error:",e),n.NextResponse.json({error:"Error interno",details:String(e)},{status:500})}}async function f(e){try{let t=await (0,u.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,c.F)(t.permissions,"obligations.update"))return n.NextResponse.json({error:"No tienes permiso para editar obligaciones"},{status:403});let{obligationId:a,title:i,description:r,amount:s,dueDate:o}=await e.json();if(!a||!i||"number"!=typeof s||!o)return n.NextResponse.json({error:"Faltan campos obligatorios para editar la obligaci\xf3n"},{status:400});let d=await l._.financialObligation.findUnique({where:{id:a},include:{userObligations:{include:{payments:{select:{amountPaid:!0}}}}}});if(!d)return n.NextResponse.json({error:"Obligaci\xf3n no encontrada"},{status:404});return await l._.$transaction(async e=>{for(let t of(await e.financialObligation.update({where:{id:a},data:{title:i,description:r??"",amount:s,dueDate:new Date(o)}}),d.userObligations)){let a=t.payments.reduce((e,t)=>e+Number(t.amountPaid),0),i=Math.max(s-a,0),r=i<=0?"PAGADO":i<s?"PARCIAL":"PENDIENTE";await e.userObligation.update({where:{id:t.id},data:{assignedAmount:s,balance:i,status:r}})}}),n.NextResponse.json({message:"Obligaci\xf3n actualizada correctamente"})}catch(e){return console.error("PATCH /api/obligations error:",e),n.NextResponse.json({error:"Error actualizando obligaci\xf3n",details:String(e)},{status:500})}}async function b(e){try{let t=await (0,u.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,c.F)(t.permissions,"obligations.delete"))return n.NextResponse.json({error:"No tienes permiso para eliminar obligaciones"},{status:403});let{searchParams:a}=new URL(e.url),i=a.get("id");if(!i)return n.NextResponse.json({error:"El id de la obligaci\xf3n es obligatorio"},{status:400});let r=await l._.financialObligation.findUnique({where:{id:i},include:{userObligations:{include:{payments:{select:{id:!0}}}}}});if(!r)return n.NextResponse.json({error:"Obligaci\xf3n no encontrada"},{status:404});if(r.userObligations.some(e=>e.payments.length>0))return n.NextResponse.json({error:"No se puede eliminar la obligaci\xf3n porque ya tiene pagos registrados."},{status:409});return await l._.$transaction(async e=>{await e.userObligation.deleteMany({where:{obligationId:i}}),await e.financialObligation.delete({where:{id:i}})}),n.NextResponse.json({message:"Obligaci\xf3n eliminada correctamente"})}catch(e){return console.error("DELETE /api/obligations error:",e),n.NextResponse.json({error:"Error eliminando obligaci\xf3n",details:String(e)},{status:500})}}let h=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/obligations/route",pathname:"/api/obligations",filename:"route",bundlePath:"app/api/obligations/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\obligations\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:x,staticGenerationAsyncStorage:y,serverHooks:v}=h,S="/api/obligations/route";function R(){return(0,o.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:y})}},5713:(e,t,a)=>{a.d(t,{Oe:()=>d,c_:()=>l,fT:()=>u,WX:()=>c});let i=require("bcrypt");var r=a.n(i),s=a(7390),o=a.n(s);let n=process.env.JWT_SECRET||"dev_secret";async function l(e){return r().hash(e,10)}async function d(e,t){return r().compare(e,t)}function u(e){return o().sign(e,n,{expiresIn:"8h"})}function c(e){try{return o().verify(e,n)}catch{return null}}},1418:(e,t,a)=>{a.d(t,{HE:()=>p,NX:()=>g,Pu:()=>m,So:()=>b,gw:()=>u,hp:()=>h,ki:()=>f,tJ:()=>c});var i=a(6742);let r=process.env.SMTP_HOST,s=Number(process.env.SMTP_PORT??587),o=process.env.SMTP_USER,n=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function d(){if(!r||!o||!n||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return i.createTransport({host:r,port:s,secure:465===s,auth:{user:o,pass:n}})}async function u(e){let t=d(),a=process.env.APP_BASE_URL??"http://localhost:3000",i=e.receiptUrl?`${a}${e.receiptUrl}`:null,r=`Q ${e.amountPaid.toFixed(2)}`,s=`Q ${e.remainingBalance.toFixed(2)}`,o=e.paymentDate.toLocaleString("es-GT"),n=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),u="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await t.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorer\xeda.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${r}</li>
          <li><strong>Saldo restante:</strong> ${s}</li>
          <li><strong>Estado actual:</strong> ${n}</li>
          <li><strong>M\xe9todo de pago:</strong> ${e.paymentMethod??"No especificado"}</li>
          <li><strong>Fecha:</strong> ${o}</li>
        </ul>

        ${u}

        ${i?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${i}" target="_blank" rel="noreferrer">${i}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function c(e){let t=d(),a=`Q ${e.amount.toFixed(2)}`,i=e.dueDate.toLocaleDateString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva Responsabilidad Asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

       <p>Se te ha asignado una nueva responsabilidad dentro de la hermandad.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Monto:</strong> ${a}</li>
          <li><strong>Fecha l\xedmite:</strong> ${i}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorer\xeda para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function p(e){let t=d(),a=e.activityDate.toLocaleString("es-GT"),i="APROBADA"===e.status?"Aprobada":"Rechazada",r="APROBADA"===e.status?"#166534":"#991b1b",s="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await t.sendMail({from:l,to:e.to,subject:`Excusa ${i.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${r};"><strong>${s}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${a}</li>
          <li><strong>Estado:</strong> ${i}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function g(e){let t=d(),a=e.activityDate.toLocaleString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva actividad asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva actividad dentro del sistema de la hermandad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Fecha y hora:</strong> ${a}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
        </ul>

        <p>Por favor revisa tu panel para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function m(e){let t=d(),a=e.activityDate.toLocaleString("es-GT"),i="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await t.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para esta actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${a}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
          <li><strong>Estado:</strong> ${i}</li>
          <li><strong>Notas:</strong> ${e.notes||"Sin notas"}</li>
        </ul>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function f(e){let t=d();await t.sendMail({from:l,to:e.to,subject:"Credenciales de acceso al sistema",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Credenciales de acceso</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha creado tu usuario para ingresar al sistema interno de la hermandad.</p>

        <ul>
          <li><strong>Usuario:</strong> ${e.username}</li>
          <li><strong>Contrase\xf1a:</strong> ${e.password}</li>
        </ul>

        <p>Por favor conserva esta informaci\xf3n de forma segura.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function b(e){let t=d();await t.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Restablece tu contrase\xf1a</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha generado una contrase\xf1a temporal para tu usuario.</p>

        <ul>
          <li><strong>Usuario:</strong> ${e.username}</li>
          <li><strong>Contrase\xf1a temporal:</strong> ${e.temporaryPassword}</li>
        </ul>

        <p>Al ingresar al sistema, deber\xe1s cambiar esta contrase\xf1a por una nueva.</p>

        <p>Saludos,<br />Hermandad de San Francisco el grande</p>
      </div>
    `})}async function h({items:e,batchSize:t=10,delayMs:a=1e3,send:i,onError:r}){for(let s=0;s<e.length;s+=t){let o=e.slice(s,s+t);await Promise.all(o.map(async e=>{try{await i(e)}catch(t){r?r(e,t):console.error("Error enviando correo:",t)}})),s+t<e.length&&await function(e){return new Promise(t=>setTimeout(t,e))}(a)}}},4691:(e,t,a)=>{function i(e,t){return e.includes(t)}a.d(t,{F:()=>i})},3154:(e,t,a)=>{a.d(t,{_:()=>r});let i=require("@prisma/client"),r=globalThis.prisma??new i.PrismaClient({log:["error"]})},526:(e,t,a)=>{a.d(t,{Z:()=>o,t:()=>n});var i=a(2845),r=a(5713);let s="tesoreria_token";function o(){return s}async function n(){let e=await (0,i.cookies)(),t=e.get(s)?.value;return t?(0,r.WX)(t):null}},3621:(e,t,a)=>{a.d(t,{IK:()=>r,Lp:()=>n,Zv:()=>o,l3:()=>s});var i=a(3389);i.Ry({email:i.Z_().email(),password:i.Z_().min(6)});let r=i.Ry({fullName:i.Z_().min(1,"El nombre es obligatorio"),username:i.Z_().min(3,"El usuario debe tener al menos 3 caracteres"),email:i.Z_().email("Correo inv\xe1lido"),password:i.Z_().min(6,"La contrase\xf1a debe tener al menos 6 caracteres"),roleCode:i.Km(["SUPERADMIN","ADMIN_GENERAL","JUNTA","TESORERIA","SECRETARIA","COLABORADOR"])}),s=i.Ry({title:i.Z_().min(3),description:i.Z_().optional(),activityDate:i.Z_(),location:i.Z_().optional(),createdById:i.Z_().uuid()});i.Ry({activityId:i.Z_().uuid(),userId:i.Z_().uuid(),status:i.Km(["PRESENTE","AUSENTE","EXCUSADO"]),registeredById:i.Z_().uuid(),notes:i.Z_().optional()});let o=i.Ry({title:i.Z_().min(3),description:i.Z_().optional(),amount:i.Rx().positive(),dueDate:i.Z_(),createdById:i.Z_().uuid(),userIds:i.IX(i.Z_().uuid()).default([])}),n=i.Ry({userObligationId:i.Z_().uuid(),amountPaid:i.Rx().positive(),paymentMethod:i.Z_().optional(),registeredById:i.Z_().uuid(),notes:i.Z_().optional()});i.Ry({activityId:i.Z_().uuid(),userId:i.Z_().uuid(),reason:i.Z_().min(5)})}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[787,68,742,168],()=>a(5418));module.exports=i})();