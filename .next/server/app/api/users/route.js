"use strict";(()=>{var e={};e.id=701,e.ids=[701],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},6647:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>N,patchFetch:()=>A,requestAsyncStorage:()=>y,routeModule:()=>v,serverHooks:()=>R,staticGenerationAsyncStorage:()=>S});var a={};r.r(a),r.d(a,{GET:()=>g,PATCH:()=>x,POST:()=>f,PUT:()=>h});var s=r(3278),o=r(5002),i=r(4877),n=r(1309),l=r(3154),u=r(5713),d=r(3621),c=r(526),p=r(4691),m=r(1418);async function g(){try{let e=await (0,c.t)();if(!e)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(e.permissions,"users.view"))return n.NextResponse.json({error:"Sin permisos para ver usuarios"},{status:403});let t=await l._.user.findMany({orderBy:{createdAt:"desc"},select:{id:!0,fullName:!0,email:!0,isActive:!0,createdAt:!0,role:{select:{code:!0,name:!0}}}});return n.NextResponse.json({data:t})}catch(e){return console.error("GET /api/users error:",e),n.NextResponse.json({error:"Error obteniendo usuarios",details:String(e)},{status:500})}}async function f(e){try{let t=await (0,c.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(t.permissions,"users.create"))return n.NextResponse.json({error:"No tienes permiso para crear usuarios"},{status:403});let r=await e.json(),a=d.IK.safeParse(r);if(!a.success)return n.NextResponse.json({error:"Datos inv\xe1lidos",details:a.error.flatten()},{status:400});if(await l._.user.findUnique({where:{email:a.data.email}}))return n.NextResponse.json({error:"El correo ya existe"},{status:409});let s=await l._.role.findUnique({where:{code:a.data.roleCode}});if(!s)return n.NextResponse.json({error:"Rol no encontrado"},{status:404});let o=await (0,u.c_)(a.data.password),i=await l._.user.create({data:{fullName:a.data.fullName,username:a.data.username.trim(),email:a.data.email.trim(),passwordHash:o,mustChangePassword:!0,role:{connect:{id:s.id}}},select:{id:!0,fullName:!0,username:!0,email:!0,isActive:!0,mustChangePassword:!0,role:{select:{code:!0,name:!0}}}});try{await (0,m.ki)({to:i.email,fullName:i.fullName,username:i.username,password:a.data.password})}catch(e){console.error("Error enviando credenciales:",e)}return n.NextResponse.json({message:"Usuario creado",data:i},{status:201})}catch(e){return console.error("POST /api/users error:",e),n.NextResponse.json({error:"Error interno",details:String(e)},{status:500})}}async function x(e){try{let t=await (0,c.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,p.F)(t.permissions,"users.update"))return n.NextResponse.json({error:"No tienes permiso para editar usuarios"},{status:403});let{id:r,fullName:a,email:s,roleCode:o}=await e.json();if(!r||!a||!s||!o)return n.NextResponse.json({error:"Faltan campos obligatorios para editar"},{status:400});if(!await l._.user.findUnique({where:{id:r}}))return n.NextResponse.json({error:"Usuario no encontrado"},{status:404});if(await l._.user.findFirst({where:{email:s,NOT:{id:r}}}))return n.NextResponse.json({error:"El correo ya est\xe1 en uso por otro usuario"},{status:409});let i=await l._.role.findUnique({where:{code:o}});if(!i)return n.NextResponse.json({error:"Rol no encontrado"},{status:404});let u=await l._.user.update({where:{id:r},data:{fullName:a,email:s,role:{connect:{id:i.id}}},select:{id:!0,fullName:!0,email:!0,isActive:!0,role:{select:{code:!0,name:!0}}}});return n.NextResponse.json({message:"Usuario actualizado correctamente",data:u})}catch(e){return console.error("PATCH /api/users error:",e),n.NextResponse.json({error:"Error actualizando usuario",details:String(e)},{status:500})}}async function h(e){try{let t=await (0,c.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});let r=(0,p.F)(t.permissions,"users.activate"),a=(0,p.F)(t.permissions,"users.deactivate");if(!r&&!a)return n.NextResponse.json({error:"No tienes permiso para cambiar el estado de usuarios"},{status:403});let{id:s,isActive:o}=await e.json();if(!s||"boolean"!=typeof o)return n.NextResponse.json({error:"id e isActive son obligatorios"},{status:400});if(o&&!r)return n.NextResponse.json({error:"No tienes permiso para activar usuarios"},{status:403});if(!o&&!a)return n.NextResponse.json({error:"No tienes permiso para desactivar usuarios"},{status:403});if(!await l._.user.findUnique({where:{id:s}}))return n.NextResponse.json({error:"Usuario no encontrado"},{status:404});let i=await l._.user.update({where:{id:s},data:{isActive:o},select:{id:!0,fullName:!0,email:!0,isActive:!0,role:{select:{code:!0,name:!0}}}});return n.NextResponse.json({message:o?"Usuario activado correctamente":"Usuario desactivado correctamente",data:i})}catch(e){return console.error("PUT /api/users error:",e),n.NextResponse.json({error:"Error actualizando estado del usuario",details:String(e)},{status:500})}}let v=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/users/route",pathname:"/api/users",filename:"route",bundlePath:"app/api/users/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\users\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:y,staticGenerationAsyncStorage:S,serverHooks:R}=v,N="/api/users/route";function A(){return(0,i.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:S})}},5713:(e,t,r)=>{r.d(t,{Oe:()=>u,c_:()=>l,fT:()=>d,WX:()=>c});let a=require("bcrypt");var s=r.n(a),o=r(7390),i=r.n(o);let n=process.env.JWT_SECRET||"dev_secret";async function l(e){return s().hash(e,10)}async function u(e,t){return s().compare(e,t)}function d(e){return i().sign(e,n,{expiresIn:"8h"})}function c(e){try{return i().verify(e,n)}catch{return null}}},1418:(e,t,r)=>{r.d(t,{HE:()=>p,NX:()=>m,Pu:()=>g,So:()=>x,gw:()=>d,hp:()=>h,ki:()=>f,tJ:()=>c});var a=r(6742);let s=process.env.SMTP_HOST,o=Number(process.env.SMTP_PORT??587),i=process.env.SMTP_USER,n=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function u(){if(!s||!i||!n||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return a.createTransport({host:s,port:o,secure:465===o,auth:{user:i,pass:n}})}async function d(e){let t=u(),r=process.env.APP_BASE_URL??"http://localhost:3000",a=e.receiptUrl?`${r}${e.receiptUrl}`:null,s=`Q ${e.amountPaid.toFixed(2)}`,o=`Q ${e.remainingBalance.toFixed(2)}`,i=e.paymentDate.toLocaleString("es-GT"),n=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),d="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await t.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorer\xeda.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${s}</li>
          <li><strong>Saldo restante:</strong> ${o}</li>
          <li><strong>Estado actual:</strong> ${n}</li>
          <li><strong>M\xe9todo de pago:</strong> ${e.paymentMethod??"No especificado"}</li>
          <li><strong>Fecha:</strong> ${i}</li>
        </ul>

        ${d}

        ${a?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${a}" target="_blank" rel="noreferrer">${a}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function c(e){let t=u(),r=`Q ${e.amount.toFixed(2)}`,a=e.dueDate.toLocaleDateString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva Responsabilidad Asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

       <p>Se te ha asignado una nueva responsabilidad dentro de la hermandad.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Monto:</strong> ${r}</li>
          <li><strong>Fecha l\xedmite:</strong> ${a}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorer\xeda para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function p(e){let t=u(),r=e.activityDate.toLocaleString("es-GT"),a="APROBADA"===e.status?"Aprobada":"Rechazada",s="APROBADA"===e.status?"#166534":"#991b1b",o="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await t.sendMail({from:l,to:e.to,subject:`Excusa ${a.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${s};"><strong>${o}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${r}</li>
          <li><strong>Estado:</strong> ${a}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function m(e){let t=u(),r=e.activityDate.toLocaleString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva actividad asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva actividad dentro del sistema de la hermandad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Fecha y hora:</strong> ${r}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
        </ul>

        <p>Por favor revisa tu panel para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function g(e){let t=u(),r=e.activityDate.toLocaleString("es-GT"),a="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await t.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para esta actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${r}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
          <li><strong>Estado:</strong> ${a}</li>
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
    `})}async function x(e){let t=u();await t.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
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
    `})}async function h({items:e,batchSize:t=10,delayMs:r=1e3,send:a,onError:s}){for(let o=0;o<e.length;o+=t){let i=e.slice(o,o+t);await Promise.all(i.map(async e=>{try{await a(e)}catch(t){s?s(e,t):console.error("Error enviando correo:",t)}})),o+t<e.length&&await function(e){return new Promise(t=>setTimeout(t,e))}(r)}}},4691:(e,t,r)=>{function a(e,t){return e.includes(t)}r.d(t,{F:()=>a})},3154:(e,t,r)=>{r.d(t,{_:()=>s});let a=require("@prisma/client"),s=globalThis.prisma??new a.PrismaClient({log:["error"]})},526:(e,t,r)=>{r.d(t,{Z:()=>i,t:()=>n});var a=r(2845),s=r(5713);let o="tesoreria_token";function i(){return o}async function n(){let e=await (0,a.cookies)(),t=e.get(o)?.value;return t?(0,s.WX)(t):null}},3621:(e,t,r)=>{r.d(t,{IK:()=>s,Lp:()=>n,Zv:()=>i,l3:()=>o});var a=r(3389);a.Ry({email:a.Z_().email(),password:a.Z_().min(6)});let s=a.Ry({fullName:a.Z_().min(1,"El nombre es obligatorio"),username:a.Z_().min(3,"El usuario debe tener al menos 3 caracteres"),email:a.Z_().email("Correo inv\xe1lido"),password:a.Z_().min(6,"La contrase\xf1a debe tener al menos 6 caracteres"),roleCode:a.Km(["SUPERADMIN","ADMIN_GENERAL","JUNTA","TESORERIA","SECRETARIA","COLABORADOR"])}),o=a.Ry({title:a.Z_().min(3),description:a.Z_().optional(),activityDate:a.Z_(),location:a.Z_().optional(),createdById:a.Z_().uuid()});a.Ry({activityId:a.Z_().uuid(),userId:a.Z_().uuid(),status:a.Km(["PRESENTE","AUSENTE","EXCUSADO"]),registeredById:a.Z_().uuid(),notes:a.Z_().optional()});let i=a.Ry({title:a.Z_().min(3),description:a.Z_().optional(),amount:a.Rx().positive(),dueDate:a.Z_(),createdById:a.Z_().uuid(),userIds:a.IX(a.Z_().uuid()).default([])}),n=a.Ry({userObligationId:a.Z_().uuid(),amountPaid:a.Rx().positive(),paymentMethod:a.Z_().optional(),registeredById:a.Z_().uuid(),notes:a.Z_().optional()});a.Ry({activityId:a.Z_().uuid(),userId:a.Z_().uuid(),reason:a.Z_().min(5)})}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,68,742,168],()=>r(6647));module.exports=a})();