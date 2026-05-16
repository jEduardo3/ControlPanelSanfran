"use strict";(()=>{var e={};e.id=649,e.ids=[649],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},5855:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>N,patchFetch:()=>R,requestAsyncStorage:()=>b,routeModule:()=>x,serverHooks:()=>S,staticGenerationAsyncStorage:()=>v});var r={};a.r(r),a.d(r,{DELETE:()=>h,GET:()=>g,PATCH:()=>y,POST:()=>f});var s=a(3278),i=a(5002),o=a(4877),n=a(1309),l=a(3154),u=a(3621),d=a(526),p=a(4691),c=a(1418);async function m(e,t){let a=await e.userObligation.findUnique({where:{id:t},include:{payments:{select:{amountPaid:!0}}}});if(!a)throw Error("Obligaci\xf3n del usuario no encontrada para recalcular");let r=Number(a.assignedAmount),s=Math.max(r-a.payments.reduce((e,t)=>e+Number(t.amountPaid),0),0);return await e.userObligation.update({where:{id:t},data:{balance:s,status:s<=0?"PAGADO":s<r?"PARCIAL":"PENDIENTE"}})}async function g(){try{let e=await (0,d.t)();if(!e)return n.NextResponse.json({error:"No autenticado"},{status:401});let t=(0,p.F)(e.permissions,"payments.view"),a=(0,p.F)(e.permissions,"payments.view.own");if(!t&&!a)return n.NextResponse.json({error:"Sin permisos para ver pagos"},{status:403});let r=await l._.payment.findMany({orderBy:{paymentDate:"desc"},include:{registeredBy:{select:{fullName:!0}},userObligation:{include:{user:{select:{id:!0,fullName:!0,email:!0}},obligation:{select:{id:!0,title:!0,amount:!0,dueDate:!0}}}}},...a&&!t?{where:{userObligation:{userId:e.id}}}:{}});return n.NextResponse.json({data:r})}catch(e){return console.error("GET /api/payments error:",e),n.NextResponse.json({error:"Error obteniendo pagos",details:String(e)},{status:500})}}async function f(e){try{let t=await (0,d.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(t.permissions,"payments.create"))return n.NextResponse.json({error:"No tienes permiso para registrar pagos"},{status:403});let a=await e.json(),r=u.Lp.safeParse({...a,registeredById:t.id});if(!r.success)return n.NextResponse.json({error:"Datos inv\xe1lidos",details:r.error.flatten()},{status:400});let s=await l._.userObligation.findUnique({where:{id:r.data.userObligationId},include:{user:{select:{fullName:!0,email:!0}},obligation:{select:{title:!0}}}});if(!s)return n.NextResponse.json({error:"Obligaci\xf3n del usuario no encontrada"},{status:404});let i=Number(s.balance),o=Number(r.data.amountPaid);if(o<=0)return n.NextResponse.json({error:"El monto pagado debe ser mayor que cero"},{status:400});if(o>i)return n.NextResponse.json({error:"El pago no puede ser mayor al saldo pendiente"},{status:400});let g=await l._.$transaction(async e=>{let a=await e.payment.create({data:{userObligationId:r.data.userObligationId,amountPaid:r.data.amountPaid,paymentMethod:r.data.paymentMethod,registeredById:t.id,notes:r.data.notes}}),s=await m(e,r.data.userObligationId),i=`/api/payments/${a.id}/receipt`;return{payment:await e.payment.update({where:{id:a.id},data:{receiptUrl:i}}),updatedUserObligation:s}});try{await (0,c.gw)({to:s.user.email,fullName:s.user.fullName,obligationTitle:s.obligation.title,amountPaid:Number(r.data.amountPaid),paymentMethod:r.data.paymentMethod,receiptUrl:g.payment.receiptUrl,paymentDate:new Date(g.payment.paymentDate),remainingBalance:Number(g.updatedUserObligation.balance),obligationStatus:g.updatedUserObligation.status})}catch(e){console.error("Error enviando correo de pago:",e)}return n.NextResponse.json({message:"Pago registrado correctamente",data:g},{status:201})}catch(e){return console.error("POST /api/payments error:",e),n.NextResponse.json({error:"Error interno",details:String(e)},{status:500})}}async function y(e){try{let t=await (0,d.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(t.permissions,"payments.update"))return n.NextResponse.json({error:"No tienes permiso para editar pagos"},{status:403});let{id:a,amountPaid:r,paymentMethod:s,notes:i}=await e.json();if(!a||"number"!=typeof r)return n.NextResponse.json({error:"id y amountPaid son obligatorios"},{status:400});let o=await l._.payment.findUnique({where:{id:a},include:{userObligation:!0}});if(!o)return n.NextResponse.json({error:"Pago no encontrado"},{status:404});if(r<=0)return n.NextResponse.json({error:"El monto pagado debe ser mayor que cero"},{status:400});let u=(await l._.payment.findMany({where:{userObligationId:o.userObligationId,NOT:{id:a}},select:{amountPaid:!0}})).reduce((e,t)=>e+Number(t.amountPaid),0),c=Number(o.userObligation.assignedAmount);if(u+r>c)return n.NextResponse.json({error:"El total de pagos supera el monto asignado de la obligaci\xf3n"},{status:400});return await l._.$transaction(async e=>{await e.payment.update({where:{id:a},data:{amountPaid:r,paymentMethod:s??o.paymentMethod,notes:i??""}}),await m(e,o.userObligationId)}),n.NextResponse.json({message:"Pago actualizado correctamente"})}catch(e){return console.error("PATCH /api/payments error:",e),n.NextResponse.json({error:"Error actualizando pago",details:String(e)},{status:500})}}async function h(e){try{let t=await (0,d.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(t.permissions,"payments.delete"))return n.NextResponse.json({error:"No tienes permiso para eliminar pagos"},{status:403});let{searchParams:a}=new URL(e.url),r=a.get("id");if(!r)return n.NextResponse.json({error:"El id del pago es obligatorio"},{status:400});let s=await l._.payment.findUnique({where:{id:r}});if(!s)return n.NextResponse.json({error:"Pago no encontrado"},{status:404});return await l._.$transaction(async e=>{await e.payment.delete({where:{id:r}}),await m(e,s.userObligationId)}),n.NextResponse.json({message:"Pago eliminado correctamente"})}catch(e){return console.error("DELETE /api/payments error:",e),n.NextResponse.json({error:"Error eliminando pago",details:String(e)},{status:500})}}let x=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/payments/route",pathname:"/api/payments",filename:"route",bundlePath:"app/api/payments/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\payments\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:b,staticGenerationAsyncStorage:v,serverHooks:S}=x,N="/api/payments/route";function R(){return(0,o.patchFetch)({serverHooks:S,staticGenerationAsyncStorage:v})}},5713:(e,t,a)=>{a.d(t,{Oe:()=>u,c_:()=>l,fT:()=>d,WX:()=>p});let r=require("bcrypt");var s=a.n(r),i=a(7390),o=a.n(i);let n=process.env.JWT_SECRET||"dev_secret";async function l(e){return s().hash(e,10)}async function u(e,t){return s().compare(e,t)}function d(e){return o().sign(e,n,{expiresIn:"8h"})}function p(e){try{return o().verify(e,n)}catch{return null}}},1418:(e,t,a)=>{a.d(t,{HE:()=>c,NX:()=>m,Pu:()=>g,So:()=>y,gw:()=>d,hp:()=>h,ki:()=>f,tJ:()=>p});var r=a(6742);let s=process.env.SMTP_HOST,i=Number(process.env.SMTP_PORT??587),o=process.env.SMTP_USER,n=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function u(){if(!s||!o||!n||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return r.createTransport({host:s,port:i,secure:465===i,auth:{user:o,pass:n}})}async function d(e){let t=u(),a=process.env.APP_BASE_URL??"http://localhost:3000",r=e.receiptUrl?`${a}${e.receiptUrl}`:null,s=`Q ${e.amountPaid.toFixed(2)}`,i=`Q ${e.remainingBalance.toFixed(2)}`,o=e.paymentDate.toLocaleString("es-GT"),n=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),d="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await t.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorer\xeda.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${s}</li>
          <li><strong>Saldo restante:</strong> ${i}</li>
          <li><strong>Estado actual:</strong> ${n}</li>
          <li><strong>M\xe9todo de pago:</strong> ${e.paymentMethod??"No especificado"}</li>
          <li><strong>Fecha:</strong> ${o}</li>
        </ul>

        ${d}

        ${r?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${r}" target="_blank" rel="noreferrer">${r}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function p(e){let t=u(),a=`Q ${e.amount.toFixed(2)}`,r=e.dueDate.toLocaleDateString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva Responsabilidad Asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

       <p>Se te ha asignado una nueva responsabilidad dentro de la hermandad.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Monto:</strong> ${a}</li>
          <li><strong>Fecha l\xedmite:</strong> ${r}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorer\xeda para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function c(e){let t=u(),a=e.activityDate.toLocaleString("es-GT"),r="APROBADA"===e.status?"Aprobada":"Rechazada",s="APROBADA"===e.status?"#166534":"#991b1b",i="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await t.sendMail({from:l,to:e.to,subject:`Excusa ${r.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${s};"><strong>${i}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${a}</li>
          <li><strong>Estado:</strong> ${r}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function m(e){let t=u(),a=e.activityDate.toLocaleString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
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
    `})}async function g(e){let t=u(),a=e.activityDate.toLocaleString("es-GT"),r="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await t.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para esta actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${a}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
          <li><strong>Estado:</strong> ${r}</li>
          <li><strong>Notas:</strong> ${e.notes||"Sin notas"}</li>
        </ul>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function f(e){let t=u();await t.sendMail({from:l,to:e.to,subject:"Credenciales de acceso al sistema",html:`
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
    `})}async function y(e){let t=u();await t.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
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
    `})}async function h({items:e,batchSize:t=10,delayMs:a=1e3,send:r,onError:s}){for(let i=0;i<e.length;i+=t){let o=e.slice(i,i+t);await Promise.all(o.map(async e=>{try{await r(e)}catch(t){s?s(e,t):console.error("Error enviando correo:",t)}})),i+t<e.length&&await function(e){return new Promise(t=>setTimeout(t,e))}(a)}}},4691:(e,t,a)=>{function r(e,t){return e.includes(t)}a.d(t,{F:()=>r})},3154:(e,t,a)=>{a.d(t,{_:()=>s});let r=require("@prisma/client"),s=globalThis.prisma??new r.PrismaClient({log:["error"]})},526:(e,t,a)=>{a.d(t,{Z:()=>o,t:()=>n});var r=a(2845),s=a(5713);let i="tesoreria_token";function o(){return i}async function n(){let e=await (0,r.cookies)(),t=e.get(i)?.value;return t?(0,s.WX)(t):null}},3621:(e,t,a)=>{a.d(t,{IK:()=>s,Lp:()=>n,Zv:()=>o,l3:()=>i});var r=a(3389);r.Ry({email:r.Z_().email(),password:r.Z_().min(6)});let s=r.Ry({fullName:r.Z_().min(1,"El nombre es obligatorio"),username:r.Z_().min(3,"El usuario debe tener al menos 3 caracteres"),email:r.Z_().email("Correo inv\xe1lido"),password:r.Z_().min(6,"La contrase\xf1a debe tener al menos 6 caracteres"),roleCode:r.Km(["SUPERADMIN","ADMIN_GENERAL","JUNTA","TESORERIA","SECRETARIA","COLABORADOR"])}),i=r.Ry({title:r.Z_().min(3),description:r.Z_().optional(),activityDate:r.Z_(),location:r.Z_().optional(),createdById:r.Z_().uuid()});r.Ry({activityId:r.Z_().uuid(),userId:r.Z_().uuid(),status:r.Km(["PRESENTE","AUSENTE","EXCUSADO"]),registeredById:r.Z_().uuid(),notes:r.Z_().optional()});let o=r.Ry({title:r.Z_().min(3),description:r.Z_().optional(),amount:r.Rx().positive(),dueDate:r.Z_(),createdById:r.Z_().uuid(),userIds:r.IX(r.Z_().uuid()).default([])}),n=r.Ry({userObligationId:r.Z_().uuid(),amountPaid:r.Rx().positive(),paymentMethod:r.Z_().optional(),registeredById:r.Z_().uuid(),notes:r.Z_().optional()});r.Ry({activityId:r.Z_().uuid(),userId:r.Z_().uuid(),reason:r.Z_().min(5)})}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[787,68,742,168],()=>a(5855));module.exports=r})();