javascript:ftb();
function ih(i,h)
{
	try{document.getElementById(i).innerHTML=h}catch(m){}
}
function ihn(i)
{
    i.forEach(b=>ih(b,""));
}
function ia(i,a,v)
{
    try{document.getElementById(i).setAttribute(a,v)}catch(m){}
}
function ro(n)
{
    return Math.round(n*10)/10;
}
function net(p)
{
    return p.slice(0,2)=="nr"?"nr":"lte";
}
function msg(m)
{
    console.log(m);
}
function tit(a=0,b=0)
{
    t=document.getElementById("tit").style;if(a){t.display="block";ih("tit",a)}else t.display="none";
}
function extractXML(t,d)
{
	try{return d.split("</"+t+">")[0].split("<"+t+">")[1]}catch(m){return m.message}
}
function typeBand(d)
{
	for(d1="",x=0;x<90;x++)tb=Math.pow(2,x),BigInt("0x"+d)&BigInt(tb)?d1+=String(x+1)+"+":"";return d1.replace(/\++$/,"");
}
function loadBTS()
{
    if(localStorage.getItem(store["bts"])===null)localStorage.setItem(store["bts"],JSON.stringify({}));    
    bts=JSON.parse(localStorage.getItem(store["bts"]));
    for(const[i,r]of Object.entries(bts_location))
        if(!(i in bts))bts[i]=[r[0],r[1]];else msg("Double BTS location, ENB Id: "+i);
}
function loadCel()
{
    if(localStorage.getItem(store["day"])===null||localStorage.getItem(store["cel"])===null){localStorage.setItem(store["day"],JSON.stringify([]));localStorage.setItem(store["cel"],JSON.stringify({}))}
    day=JSON.parse(localStorage.getItem(store["day"]));cel=JSON.parse(localStorage.getItem(store["cel"]));    
}
function reSetTimeout(t)
{
    fetch('/html/home.html').then(r=>r.text()).then(h=>/*get-html=>token*/
    {
        c=h.split('name="csrf_token" content="');token=c[c.length-1].split('"')[0];
        fetch("/api/webserver/accessibility",/*post-accessibility=>timeout*/
        {
            method: 'POST',headers: {'__RequestVerificationToken': token,'Content-Type': 'application/x-www-form-urlencoded'},body: '<?xml version="1.0" encoding="UTF-8"?><request><timeout>'+t+'</timeout></request>'
        });
    });
}
function start()
{
    fetch("/api/device/signal").then(r=>r.text()).then(d=>
    {
        pl=signval["plmn"]=extractXML("plmn",d);state=pl.slice(0,3);
        if(state=="222")/*set plmn&link lteitaly*/
            {if("22201"==pl)pl="2221";if("22299"==pl)pl="22288";link="https://lteitaly.it/internal/map.php%23bts="+pl+"."}
        else
            ia("enodeb_id","href","https://www.cellmapper.net");
        for(const[k]of Object.entries(defined))if(!(defined[k]="undefined"!=typeof extractXML(k,d)))undef.push(k);/*defined cqi0,enodeb_id,ltedlfreq,nrrssi,nrcqi0,scc_pci*/
        ["lte","nr"].forEach(b=>{if(defltenr[b]="undefined"!=typeof extractXML((b=="nr"?b:"")+"rsrp",d))ltenr.push(b)});/*defltenr&ltenr[lte,nr]*/
        h="";for(const v of undef){if(defltenr["lte"]&&(v=="enodeb_id"||v=="ltedlfreq"||v=="cqi0"))h+=v+(v!="cqi0"?"(resolved) ":" ");if(defltenr["nr"]&&(v=="nrrssi"||v=="nrcqi0"||v=="scc_pci"))h+=v+" "}if(h)msg("Absence modem API: "+h);/*console undefined*/
        undef.forEach(b=>{if(b.includes("cqi0"))document.getElementById("selsign"+net(b)).options[1].disabled=true});/*set LTE&NR HTML*/        
        ltenr.forEach(b=>document.querySelectorAll("."+b).forEach(e=>e.style.display="block"));
        if(ltenr.length==2)document.querySelectorAll(".ltenr").forEach(e=>e.style.display="inline-block");
        ia("ant","title",(ltenr.length==2?"(NR)\n":"")+"Ant1-Ant2");
        ia("enb","title",(defltenr["nr"]?"(LTE)\n":"")+"<plmn>"+pl);
    });
    loadBTS();loadCel();
    fetch("/api/webserver/accessibility").then(r=>r.text()).then(d=>/*if available stop(re-set)timeout;get-accessibility=>timeout*/
    {
        t=extractXML("timeout",d);if(t){msg("Restart timeout: "+t+"min");reSetTimeout(t);setInterval(reSetTimeout,60000*(t-.5),t)}
    });
}
function currentData()
{
	if(suspend)return;
    try{document.getElementById("dhcp_mask").style.display="block",document.getElementById("dhcp_dns").style.display="block"}catch(e){}
/*  start()          HUAWEI=>get-signal=>plmn,enodeb_id,nrrsrp,rsrp,nrrssi,nrcqi0,scc_pci(autouse);get-accessibility=>timeout(autouse)
    reSetTimeout()   HUAWEI=>get-html=>token,post-accessibility=>timeout(autouse)*/
    Promise.all([
        getSignal(), /*HUAWEI=>get-signal=>nrrsrp,nrrsrq,nrsinr,(nrrssi),(nrcqi0),(lte)rsrp,(lte)rsrq,(lte)sinr,(lte)rssi,(lte)cqi0,nrdlbandwidth, (lte)dlbandwidth,nrearfcn,(lte)earfcn,nrdlfreq,ltedlfreq,(nr)scc_pci,(lte)pci,band,enodeb_id,(lte)cell_id,nei_cellid*/
        getStatus(), /*HUAWEI=>get-status=>CurrentNetworkTypeEx=>is4gp*/
        getAntenna(),/*HUAWEI=>get-antenna_type=>antenna1type+antenna2type=>currant[]*/
        getNetmode(),/*HUAWEI=>get-net-mode=>LTEBand,NRBand(autouse)*/
    ]).then(function()
    {
        set();       /*extracts by API lte=>ENB_Id=cell_id,ltedlfreq=(lte)earfcn|lte&nr=>..earfcnul&..earfcndl=..earfcn,..main=band&..earfcndl,..dlfreq=..dlfreq,..dlbandwidth=..dlbandwidth,2nd(band,dlfrequency,dlbandwidth)=band|currval[..]=signval[..],currnei=nei_cellid*/
        Cells();
        neiCell();
        averges();
        chart();
        titleBar();
    });
/*  clickSetLTEBand()HUAWEI=>get-html=>token,post-net-mode=>LTEBand(autouse)
    clickSetNRBand() HUAWEI=>get-html=>token,post-net-mode=>NRBand(autouse)
    extractXML()     (sub for HUAWEI API)
    typeBand()       (sub for HUAWEI API)*/
}
function getSignal()
{
    return new Promise((resolve)=>{fetch("/api/device/signal").then(r=>r.text()).then(d=>
    {
/*get&view signal;undefined=""or0*/
        signnam.forEach(b=>{if(!undef.includes(b))ih(b,signval[b]=extractXML(b.replace("lte",""),d));else signval[b]=(b=="nrrssi"||b.includes("cqi0"))?"0":""});
/*get signal*/
        signnam2.forEach(b=>signval[b]=extractXML(b=="lteearfcn"?"earfcn":b,d));
        signal=d;resolve();
    })});
}
function getStatus()
{/*get aggregation*/
    return new Promise((resolve)=>{fetch("/api/monitoring/status").then(r=>r.text()).then(d=>
    {
        is4gp=1011==extractXML("CurrentNetworkTypeEx",d)?"+":"";status=d;resolve();
    })});
}
function getAntenna()
{/*get&view antenna*/
    return new Promise((resolve)=>{fetch("/api/device/antenna_type").then(r=>r.text()).then(d=>
    {
        ih("a1",currant[1]=extractXML("antenna1type",d)=="1"?"Ext":"Int");ih("a2",currant[2]=extractXML("antenna2type",d)=="1"?"Ext":"Int");antennatype=d;resolve();
    })});
}
function getNetmode()
{/*get&view bandallowed*/
    return new Promise((resolve)=>{fetch("/api/net/net-mode").then(r=>r.text()).then(d=>
    {
        if(defltenr["lte"])ih("lteallowed",typeBand(extractXML("LTEBand",d)));if(defltenr["nr"])ih("nrallowed",typeBand(extractXML("NRBand",d)));netmode=d;resolve();
    })});
}
function set()
{
    ce=signval["cell_id"];ba=signval["band"];curagg={"lte":[],"nr":[]};currnei=[];eat="";/*no NRcell_id*/
/*set string=>number&error*/
    for(i=defltenr["nr"]?0:7,l=defltenr["lte"]?12:5;i<l;i++)
    {
        if(i==5)i=7;k=signnam[i];
        currval[k]=+(signval[k].replace(/[^0-9\.\-]/g,"")||-999);if(currval[k]>100||currval[k]<-300)currval[k]=-999;/*error=-999*/
        if(currval[k]>-999)currval[k]+=(signval[k].includes("gt")?1:signval[k].includes("lt")?-1:0);/*">"+1 "<"-1*/
    }
/*set&view Signal%*/
    ltenr.forEach(b=>
    {
        currval[b+"sign"]=currval[b+"rsrp"]>-999&&currval[b+"rsrq"]>-999&&currval[b+"sinr"]>-999&&currval[b+"rssi"]>-999?ro(((currval[b+"rsrp"]-min_rsrp)/(max_rsrp-min_rsrp)*balance_rsrp+(currval[b+"rsrq"]-min_rsrq)/(max_rsrq-min_rsrq)*balance_rsrq+(currval[b+"sinr"]-min_sinr)/(max_sinr-min_sinr)*balance_sinr+(currval[b+"rssi"]-min_rssi)/(max_rssi-min_rssi)*balance_rssi)):-999;
        ih(b+"sign",signval[b+"sign"]=currval[b+"sign"]>-999?currval[b+"sign"]+"%":"%");
    });
    if(defltenr["lte"])
    {
/*set ENB_Id(no GNodeB)*/
        if(!defined["enodeb_id"]){mp=ce.indexOf("-");mp>0?signval["enodeb_id"]=Number(ce.substr(0,mp)):(hex=Number(ce).toString(16),hex2=hex.substring(0,hex.length-2),signval["enodeb_id"]=parseInt(hex2,16).toString().padStart(7,"0"))}
        en=signval["enodeb_id"];
/*view ENB_Id&Location+link*/
        ih("enodeb_id",en);if(state==222)ia("enodeb_id","href",link+en.replace(/^0+/,""));
        if(en in bts){ih("namebts",bts[en][0]);ih("bandsbts",bts[en][1])}
        else{ih("namebts","<button class='but'onclick='clickStorage(\"bts\",\""+en+"\")'>Add Location</button>");ih("bandsbts","")}
    }
/*set neighbor list <nei_cellid>No1:..No2:.. ..*/
    if(signval["nei_cellid"])currnei=signval["nei_cellid"].slice(2).split("No").map(e=>e.slice(2));
    ltenr.forEach(b=>
    {
        bb=b=="nr"?"N":"B";ba2="";p="";
/*set EARFCN LTE&NR=>dl&ul=>"<..earfcn>DL:.. UL:.."*/
        a=signval[b+"earfcn"].split(" ").map(e=>e.slice(3));signval[b+"earfcndl"]=a[0];signval[b+"earfcnul"]=a.length>1?a[1]:"";
        ea=signval[b+"earfcndl"];eat+="(main)<"+(b=="nr"?"nr":"")+"earfcn>"+signval[b+"earfcn"]+"\n";
/*set&view main band*/
        if(b!="nr"&&!isNaN(ba)){ba2=bb+ba;p=is4gp}/*LTE=>"<band>3"*/
        if(!ba2&&ba.includes("@"))/*LTE&NR=>1st"<band>..(B7) + ..(N78)"*/
            {ba2=ba.split("("+bb);if(ba2.length>1)ba2=bb+ba2[1].split(")")[0]}
        if(!ba2)/*LTE&NR=>earfcndl"*/
            for(const v of bands[geo_area][b])if(v in earfcndl[b])if(ea>=earfcndl[b][v][0]&&ea<=earfcndl[b][v][1]){ba2=bb+v;break}
        signval[b+"main"]=ba2;ih(b+"main",ba2+p);if(!recstatus[b])ih(b+"band",ba2);
/*set&view frequency LTE=><ltedlfreq>../10 NR=><nrdlfreq>..Khz/1000*/
        if(!defined["ltedlfreq"])if(b=="lte")signval["ltedlfreq"]=(freqdllow[ba2.slice(1)]+0.1*(ea-earfcndl["lte"][ba2.slice(1)][0]))*10;
        ih(b+"dlfreq",(signval[b+"dlfreq"]=parseInt(b=="nr"?signval["nrdlfreq"].replace(/[^0-9]/g,"")/1000:signval["ltedlfreq"]/10))+"Mhz");
/*set bandwidth LTE&NR <..bandwidth>..Mhz*/
        signval[b+"dlbandwidth"]=signval[b+"dlbandwidth"].replace(/[^0-9]/g,"");
/*set(1/5)aggregate bands list*/
        if((+ea||+signval[b+"earfcnul"])&&+ba2.slice(1))curagg[b=="nr"?"lte":"nr"].push(ea+"("+ba2+")");
/*set cellchange LTE=>enodeb_id+pci+earfcn&NR=>(scc_pci)+earfcn (cell_id&main low sensity)(no GNodeB)*/
        cellcurrent[b]=(b=="nr"?signval["scc_pci"]:en+signval["pci"])+ea;cellchange[b]=cellold[b]!=cellcurrent[b];cellold[b]=cellcurrent[b];
    });
/*set&view 2nd bands LTE&NR=>"<band>..Mhz@..(B7) + ..(N78) + ..(B1) + ..(N38)"*/
    if(ba.includes("@"))
    {
        b=0,bb="",n=0,nn="";g=[];
        for(const v of ba.split(" + "))
        {/*band&Frequency&Bandwidth*/
            if(!v.includes("(")||!v.includes("@"))continue;ba2=v.split("(")[1].slice(1,-1);ea2=v.split("@")[1].split("(")[0];bw=v.split("@")[0];
            if(v.includes("B"))
            {
                if(b++)
                {
/*LTE Frequency*/   fr=freqdllow[ba2]+0.1*(ea2-earfcndl["lte"][ba2][0]);
                    bb+="<br>Band:<span class='val'>B"+ba2+"</span>&ensp;Frequency dl:<span class='val'>"+fr+"Mhz</span>&ensp;Bandwidth dl:<span class='val'>"+bw+"</span>";
/*set(2)aggreg*/    if(+ea2&&+ba2)g.push(ea2+"(B"+ba2+")");
                }
            }
            else if(n++)
            {
/*NR Frequency*/for(const[k,c]of Object.entries(nrfreqratio))if(ea2>=c[0]&&ea2<=c[1]){fr=ro(+c[2]+k*(ea2-c[0])/1000);break}
                nn+="<br>NR Band:<span class='val'>N"+ba2+"</span>&ensp;NR Frequency dl:<span class='val'>"+fr+"Mhz</span>&ensp;NR Bandwidth dl:<span class='val'>"+bw+"</span>";
/*set(3)aggreg*/if(+ea2&&+ba2)g.push(ea2+"(N"+ba2+")");
            }
        }
        ih("ltebands",b>1?bb:"");ih("nrbands",n>1?nn:"");
        ltenr.forEach(b=>curagg[b]=curagg[b].concat(g));/*set(4)aggreg*/
    }
    
    ia("band","title",(!defltenr["lte"]?"":"(main"+(defltenr["nr"]?" 4G":"")+")<cell_id>"+ce+"\n")+eat+"<band>"+ba);
}
function Cells()
{
    s=false;
    for(const b of ltenr)
    {
        if(b=="nr"){pc=signval["scc_pci"];if(!pc)break;en="",c=pc+"-"+signval[b+"earfcndl"]}/*no scc_pci exit|NRcell=scc_pci+nrearfcndl (no GNodeB&NRcell_id)*/
        else{pc=signval["pci"],en=signval["enodeb_id"],c=signval["cell_id"]}
        if(cellchange[b])celcha[b]=true;
        if((celcha[b]||Date.now()>celint[b]+3600000)&&!cellchange[b]&&+pc&&(+signval[b+"earfcndl"]||+signval[b+"earfcnul"]))/*2nd interval&timeint&certain PCI+earfcn*/
        {
            if(!celcha[b]||(celcha[b]&&cellcurrent[b]!=celcur[b]))/*flash sign*/ 
            {
                s=true;celcur[b]=cellcurrent[b],celint[b]=Date.now(),t=new Date().toLocaleString(navigator.language,{dateStyle: 'short'});
/*add*/         if(!day.includes(t))
                {
/*add day*/         if(day.push(t).length>boxcl)day.shift();
                    localStorage.setItem(store["day"],JSON.stringify(day));
/*add num-%-change*/for(const[k]of Object.entries(cel))if(cel[k][6].push([0,0,""]).length>boxcl)cel[k][6].shift();
                }
/*update/add*/  if(c in cel)
                {
/*upd change*/      a="";if(cel[c][0]!=pc)a="1";if(cel[c][1]!=signval[b+"earfcndl"])a+="2";if(cel[c][2]!=signval[b+"main"])a+="3";if(cel[c][4]!=signval[b+"dlbandwidth"])a+="4";if(cel[c][5]!=en)a+="5";
                    if(a)cel[c]=[pc,signval[b+"earfcndl"],signval[b+"main"],signval[b+"dlfreq"],signval[b+"dlbandwidth"],en,cel[c][6],cel[c][7]];
/*upd num-%-change*/l=cel[c][6].length-1;cel[c][6][l]=[cel[c][6][l][0]+1,ro((cel[c][6][l][1]*(cel[c][6][l][0])+currval[b+"sign"])/(cel[c][6][l][0]+1)),a];
                }
/*add cell*/    else
                {
                    e=Array.from({length: day.length},(_,i)=>[0,0,""]);e[e.length-1]=[1,currval[b+"sign"],""];
                    cel[c]=[pc,signval[b+"earfcndl"],signval[b+"main"],signval[b+"dlfreq"],signval[b+"dlbandwidth"],en,e,[]];
                }
            }
            celcha[b]=false;
        }
        curagg[b].forEach(v=>{if(c in cel&&!cel[c][7].includes(v)){s=true;cel[c][7].push(v)}});/*set(5)aggreg*/
    }
    if(s)localStorage.setItem(store["cel"],JSON.stringify(cel));
}
function neiCell()
{
    if(!neistatus)return;
    tb=document.getElementById('neitab');
    if(signval["nei_cellid"])
    {
        h="";tb.style.opacity=1;
        currnei.forEach(v=>
        {
            b0="-",b1="-",b2=v;b3="-";
            for(const[a]of Object.entries(cel))
                if(cel[a][0]==v)
                {
/*unique*/          if(b0=="-"){b0=cel[a][5];b1=cel[a][2];b3=".."+a.slice(-4)}
/*double*/          else{b0="..";b1="..";b2=v+"*";b3=".."}
                }
            b3="<td>"+b3+"</td>";
            if(neistatus==1)b3="";
            else if(recstatus["nr"]||recstatus["lte"])b0+="<span name='recnei'style='position:absolute;left:5em'></span>";
            else if(b0 in bts)b0=bts[b0][0].slice(0,25).replace(/[^a-zA-Z]+$/,"");
            h+="<tr><td>"+b0+"</td><td>"+b1+"</td><td>"+b2+"</td>"+b3+"<tr>";
        });
        tb.innerHTML=h;
    }
    else if(tb.style.opacity>0)tb.style.opacity-=.4;
}
function averges()
{
    recvalnot={"nr":false,"lte":false};
    for(const[p,a]of Object.entries(currval))
        if(defltenr[b=net(p)])
        {
/*rec*/     if(currval[p]==-999&&p!=selsignnot[b])recvalnot[b]=true;
/*cur*/     if(!p.includes("rssi"))if(curmed[p].unshift(cellchange[b]?-999:a)>boxch*2)curmed[p].pop();/*error/break=-999*/
        }
    ltenr.forEach(b=>
    {
/*rec*/ if(recstatus[b]==1||recstatus[b]==2)
        {
            if(reccount[b]>=recmaxcount[b])
                {c=document.getElementById("rec"+b);c.checked=false;clickRecMed(c,b)}
            else if((b=="nr"?"":signval["enodeb_id"])!=recenb[b]||signval[b=="nr"?"scc_pci":"pci"]!=recpci[b]||signval[b+"earfcndl"]!=recearfcn[b]||cellchange[b]||recvalnot[b])/*no GNodeB*/
            {
                recstatus[b]=2;recpause[b]="►.";
                ih(b+"band",recband[b]+recpause[b]);
                ih("medcount"+b,reccount[b]+"./");
            }
            else
            {
                recstatus[b]=1;reccount[b]++;
                ih("medcount"+b,reccount[b]+"/");
            }
        }
/*cur*/ else if(!recstatus[b])
        {
            if(!curmaxcount[b])
                {if(curstatus[b]){curstatus[b]=0;ihn(["medcount"+b,"med"+b+"rsrp","med"+b+"rsrq","med"+b+"sinr","med"+selsign[b]])}}
            else
            {
                curstatus[b]=1;
                for(i=0,l=Math.min(curmaxcount[b],curmed[b+"rsrp"].length);i<l&&curmed[b+"sign"][i]>-999;i++);
                if(i>=curmaxcount[b])
                    ih("medcount"+b,"");
                else
                    {ih("medcount"+b,i-curmaxcount[b]+"/");ihn(["med"+b+"rsrp","med"+b+"rsrq","med"+b+"sinr","med"+selsign[b]])}
            }
        }
    });
    for(const[p]of Object.entries(currval)) 
    {
        if(defltenr[b=net(p)])
/*rec*/     if(recstatus[b]==1)
            {
                recmed[p]=(recmed[p]*(reccount[b]-1)+currval[p])/reccount[b];
                if(!p.includes("rssi"))
                {
                    if(currval[p]>recmax[p])recmax[p]=currval[p];if(currval[p]<recmin[p])recmin[p]=currval[p];
                    if(p!=selsignnot[b])ih("med"+p,"Max:<span class='val'>"+recmax[p]+"</span> Min:<span class='val'>"+recmin[p]+"</span> Med:<span class='val'>"+ro(recmed[p])+"</span>");
                }
                else if(b=="lte"||(b=="nr"&&defined["nrrssi"]))
                    ih("med"+p,"Med:<span class='val'>"+ro(recmed[p])+"</span>");
            }
/*cur*/     else if(!recstatus[b]&&curstatus[b]&&!p.includes("rssi"))
            {
                for(ma=-999,mi=999,me=0,i=0,l=Math.min(curmaxcount[b],curmed[p].length);i<l&&curmed[p][i]>-999;i++)
                {
                    a=+curmed[p][i];if(a>ma)ma=a;if(a<mi)mi=a;me+=a;
                }
                if(i>=curmaxcount[b]&&p!=selsignnot[b])
                {
                    curmedsign[b]=ro(me/i);
                    if(p!=selsignnot[b])ih("med"+p,"Max:<span class='val'>"+ma+"</span> Min:<span class='val'>"+mi+"</span> Med:<span class='val'>"+curmedsign[b]+"</span>")
                }
                else
                {
                    curmedsign[b]=0;
                    ih("med"+p,"");
                }
            }
    }
/*nei*/
    currnei.forEach((v,k)=>
    {
        h="";ltenr.forEach(b=>
        {
            if(recstatus[b]==1)
            {
                recnumnei[b][v]=(v in recnumnei[b])?recnumnei[b][v]+1:1;
                h+=(h?"&ensp;":"")+recnumnei[b][v];
            }
        });
        
        if(h&&neistatus==2)document.getElementsByName("recnei")[k].innerHTML=h;
    });
}
function chart()
{
    for(const[p,v]of Object.entries(currval))
    {
        b=net(p);
        if(!p.includes("rssi")&&defltenr[b])
        {
            bb=p.slice(b.length),min=window["min_"+bb],max=window["max_"+bb];
/*current*/ if(currcha[p].unshift([v<min?min:v>max?max:v,cellchange[b]?1:0,signval[p].includes("lt")||v<min?1:0,signval[p].includes("gt")||v>max?1:0]).length>boxch)currcha[p].pop();
/*recmed*/  if(recstatus[b])if(recmedcha[p].unshift(recstatus[b]==1?true:false).length>boxch)recmedcha[p].pop();
            if(p!=selsignnot[b])
            {
                h="";currcha[p].forEach((e,x)=>
                {
                    px=2+lch*x;
/*current*/         c=(e[0]-min)/(max-min);
                    d=c*100,co=e[1]?"blue":e[2]?"":e[3]?"green":"rgb("+5*Math.round(d<50?50:100-d)+" "+5*Math.round(d>50?50:d)+" 0)";
                    h+='<line x1="'+px+'"y1="'+hch+'"x2="'+px+'"y2="'+(hch-c*hch-1)+'"stroke="'+co+'"stroke-width="'+lch+'"/>';
/*curmed*/          if(!recstatus[b]&&curstatus[b]&&curmaxcount[b])
                    {
                        for(me=0,i=x,ll=Math.min(x+curmaxcount[b],curmed[p].length);i<ll&&curmed[p][i]>-999;i++)
                            me+=+curmed[p][i];
                        if(i>=x+curmaxcount[b])
                        {
                            me=me/(i-x);if(me>max)me=max;if(me<min)me=min;
                            py=hch-(me-min)/(max-min)*hch;
                            h+='<circle cx="'+px+'"cy="'+py+'"fill="black"r="'+lmch+'"/>';
                        }
                    }
/*recmed*/          if(recmedcha[p][x])
                    {
                        me=recmed[p];if(me>max)me=max;if(me<min)me=min;
                        py=hch-(me-min)/(max-min)*hch;
                        h+='<circle cx="'+px+'"cy="'+py+'"fill="black"r="'+lmch+'"/>';
                    }
                });
                document.getElementById("b"+p).innerHTML='<svg version="1.1"viewBox="0 0 '+wch+' '+hch+'"width="'+wch+'"height="'+hch+'"preserveAspectRatio="xMaxYMax slice"style="border:1px solid %23ccc;padding:1px;margin:-6px 0 -10px;width:'+wch+'px">'+h+'</svg>';
            }
        }
    }
}
function titleBar()
{
    let t=!isNaN(signval["enodeb_id"])?(signval["enodeb_id"] in bts?bts[signval["enodeb_id"]][0].slice(0,16).replace(/[^a-zA-Z]+$/,""):signval["enodeb_id"]):"";/*no GNodeB*/
    t+="|"+signval["ltemain"].slice(1)+is4gp+(defltenr["nr"]?" "+signval["nrmain"].slice(1):"")+"|";
    ltenr.forEach(b=>
    {
        if(recstatus[b])t+=reccount[b]+(recstatus[b]==2?".":recpause[b])+" ";
        else if(curstatus[b]){if(curmedsign[b])t+=curmedsign[b].toFixed(0)+"%"}
        else t+=currval[b+"sign"].toFixed(0)+"%";
    });
    document.title=t;
}
function clickRecMed(a,b)
{
	if(a.readOnly)a.checked=a.readOnly=false;else if(!a.checked)a.readOnly=a.indeterminate=true;
    c=document.getElementById("count"+b),ss=document.getElementById("selsign"+b),msc=document.getElementById("medsetcount"+b);
	if(a.checked)
	{
        recstatus[b]=1;recpci[b]=signval[b=="nr"?"scc_pci":"pci"],recearfcn[b]=signval[b+"earfcndl"],recant=currant[1]+"-"+currant[2],recband[b]=signval[b+"main"],recenb[b]=b=="nr"?"":signval["enodeb_id"],recenbnr=b=="nr"&&defltenr["lte"]?signval["enodeb_id"]+"(LTE)":"";/*no GNodeB*/        
		reccount[b]=0,recmaxcount[b]=999;recpause[b]="";ih(b+"band",recband[b]+"►");
        if(neistatus==2)ih("neitaps","<tr><td>ENB Id&emsp;&ensp;RecNum PCI</td><td>Band</td><td>PCI</td><td>Cell Id</td></tr>");
        c.firstChild.data="Count:",msc.value=recmaxcount[b],ia("medsetcount"+b,"onblur","clickNumRecMed(this,'"+b+"')"),ss.disabled=true;
	}
	else if(a.indeterminate)
    {
        recstatus[b]=3;recenb[b]+=recenbnr;/*no GNodeB*/
        for(r=[["","","",""],[0,0,0,0]],i=0;i<4;i++)for(const[k,v]of Object.entries(recnumnei[b]))if(!r[0].includes(k)&&v>r[1][i]){r[0][i]=k;r[1][i]=v}for(recneires[b]="",i=0;i<4;i++)if(r[0][i])recneires[b]+=r[0][i]+"("+r[1][i]+")-";recneires[b]=recneires[b].slice(0,-1);
        if(neistatus==2)ih("neirec"+b,"RecNum "+(b=="nr"?"NR ":"")+"PCI:<span class='val'>"+recneires[b]+"</span>");
        ih("medcount"+b,reccount[b]+"■/"),ih("store"+b,"<button class='but2'onclick='clickStorage(\"rec\",\""+b+"\")'>Save Rec.</button>");
    }
	else
	{
        recstatus[b]=0;
        for(const[p]of Object.entries(currval))if(net(p)==b){if(!p.includes("rssi")){recmax[p]=-999,recmin[p]=999,recmedcha[p].length=0}recmed[p]=0}
        Object.keys(recnumnei[b]).forEach(i=>delete recnumnei[b][i]);
        ihn(["med"+b+"rsrp","med"+b+"rsrq","med"+b+"sinr","med"+b+"rssi","med"+selsign[b]]);
        if(neistatus==2&&!recstatus["nr"]&&!recstatus["lte"])ih("neitaps","<tr><td>Location</td><td>Band</td><td>PCI</td><td>Cell Id</td></tr>"),ih("neirec"+b,"");
        c.firstChild.data="CurrentMed:",ih("medcount"+b,""),msc.value=curmaxcount[b]?curmaxcount[b]:"",ia("medsetcount"+b,"onblur","clickNumCurMed(this,'"+b+"')"),ih("store"+b,""),ss.disabled=false;
	}
}
function clickNei(a)
{
    if(a.readOnly)a.checked=a.readOnly=false;else if(!a.checked)a.readOnly=a.indeterminate=true;
    n=document.getElementById('nei').style;ih('neitab',"");
    function td(c,d,e,f)
    {
        s=document.documentElement.style,s.setProperty("--neitd1",c+"%"),s.setProperty("--neitd2",d+"%"),s.setProperty("--neitd3",e+"%"),s.setProperty("--neitd4",f+"%");
    }
    if(a.checked)
	{
        neistatus=1;
        ee=defltenr["lte"]?document.getElementById("chlte"):document.getElementById("chnr");n.height=ee.clientHeight-2*parseInt(getComputedStyle(ee).padding)+"px";
        td(44,28,28,0);ih("neitaps","<tr><td>ENB Id</td><td>Band</td><td>PCI</td></tr>");
    }
    else if(a.indeterminate)
    {
        neistatus=2,n.width="24em";
        td(56,14,14,16),ih("neitaps","<tr><td>"+(recstatus["nr"]||recstatus["lte"]?"ENB Id&emsp;&ensp;RecNum PCI":"Location")+"</td><td>Band</td><td>PCI</td><td>Cell Id</td></tr>");
        ltenr.forEach(b=>{if(recstatus[b]==3)ih("neirec"+b,"RecNum "+(b=="nr"?"NR ":"")+"PCI:<span class='val'>"+recneires[b]+"</span>")});
    }
    else
    {
        neistatus=0,n.width="12em",n.height="2em";
        td(0,0,0,0);ihn(["neitaps","neireclte","neirecnr"]);
    }
}
function clickSetLTEBand(bs)
{
    var band;if(mainband&&(mainband=null),0==arguments.length){if((band=prompt("Input LTE bands number allowed separated by '+', add 'm' to set main (ex. '1+3+20' or 'm3+7'); the main setting may have changed or not been accepted by the modem.\nFor use every supported bands, write 'AUTO'.","AUTO"))&&(band=band.toLowerCase()),null==band||""===band)return}else var band=arguments[0];var bs=band.split("+"),ltesum=0;if("AUTO"===band.toUpperCase())ltesum="7FFFFFFFFFFFFFFF";else{for(var i=0;i<bs.length;i++){if(-1!=bs[i].toLowerCase().indexOf("m")&&(bs[i]=bs[i].replace("m",""),mainband=bs[i]),"AUTO"===bs[i].toUpperCase()){ltesum="7FFFFFFFFFFFFFFF";break}ltesum+=Math.pow(2,parseInt(bs[i])-1)}ltesum=ltesum.toString(16)}if(mainband)return _2ndrun=bs,void clickSetLTEBand(String(mainband));suspend=1,tit("Please wait!"),fetch('/html/home.html').then(r=>r.text()).then(xhrh=>{var datas=xhrh.split('name="csrf_token" content="'),token=datas[datas.length-1].split('"')[0],nw="00";document.getElementById("f4g").checked&&(nw="03"),setTimeout((function(){fetch("/api/net/net-mode",{method: 'POST',headers: {'__RequestVerificationToken': token,'Content-Type': 'application/xml'},body: '<?xml version="1.0" encoding="UTF-8"?><request><NetworkMode>'+nw+'</NetworkMode><NetworkBand>3FFFFFFFFFFFFFFF</NetworkBand><LTEBand>'+ltesum+'</LTEBand>'+(defltenr["nr"]?'<NRBand>'+extractXML("NRBand",netmode)+'</NRBand>':'')+'</request>'}).then((r)=>{200===r.status?(ih("lteallowed",'<span style="color:green">OK</span>'),_2ndrun?window.setTimeout((function(){clickSetLTEBand(_2ndrun.join("+")),_2ndrun=!1}),2e3):(suspend=0,tit())):msg("Err net-mode: "+r.status);});}),2e3)});
}
function clickSetNRBand(bs)
{
    var band;if(mainband&&(mainband=null),0==arguments.length){if((band=prompt("Input NR bands number allowed separated by '+', add 'm' to set main (ex. '1+78' or 'm38+78'); the main setting may have changed or not been accepted by the modem.\nFor use every supported bands, write 'AUTO'.","AUTO"))&&(band=band.toLowerCase()),null==band||""===band)return}else var band=arguments[0];var bs=band.split("+"),nrsum=0;if("AUTO"===band.toUpperCase())nrsum="4000000000000000006";else{for(var i=0;i<bs.length;i++){if(-1!=bs[i].toLowerCase().indexOf("m")&&(bs[i]=bs[i].replace("m",""),mainband=bs[i]),"AUTO"===bs[i].toUpperCase()){nrsum="4000000000000000006";break}nrsum+=Math.pow(2,parseInt(bs[i])-1)}nrsum=nrsum.toString(16)}if(mainband)return _2ndrun=bs,void clickSetNRBand(String(mainband));suspend=1,tit("Please wait!"),fetch('/html/home.html').then(r=>r.text()).then(xhrh=>{var datas=xhrh.split('name="csrf_token" content="'),token=datas[datas.length-1].split('"')[0],nw="00";document.getElementById("f4g").checked&&(nw="03"),setTimeout((function(){fetch("/api/net/net-mode",{method: 'POST',headers: {'__RequestVerificationToken': token,'Content-Type': 'application/xml'},body: '<?xml version="1.0" encoding="UTF-8"?><request><NetworkMode>'+nw+'</NetworkMode><NetworkBand>3FFFFFFFFFFFFFFF</NetworkBand>'+(defltenr["lte"]?'<LTEBand>'+extractXML("LTEBand",netmode)+'</LTEBand>':'')+'<NRBand>'+NRsum+'</NRBand></request>'}).then((r)=>{200===r.status?(ih("nrallowed",'<span style="color:green">OK</span>'),_2ndrun?window.setTimeout((function(){clickSetNRBand(_2ndrun.join("+")),_2ndrun=!1}),2e3):(suspend=0,tit())):msg("Err net-mode: "+r.status);});}),2e3)});
}
function clickNumRecMed(a,b)
{
    recmaxcount[b]=parseInt(a.value=a.value?a.value:recmaxcount[b]);
}
function clickNumCurMed(a,b)
{
    curmaxcount[b]=parseInt(a.value=!a.value?"":a.value>boxch?boxch:a.value)||0;
}
function clickSelSign(a,b)
{
    ia(selsign[b],"id",a);ia("med"+selsign[b],"id","med"+a);ia("b"+selsign[b],"id","b"+a);selsignnot[b]=selsign[b];selsign[b]=a;
}
function clickTime()
{
    do{t=prompt("Input interval time (1-600 seconds)",itime/1000);if(t==null)return}while(t==""||t<1||t>600||isNaN(t))
    itime=+ro(t)*1000;clearInterval(interval);interval=setInterval(currentData,itime);
}
function clickInfo()
{
    alert("--- DEFINITIONS\n\n_ RSSI: Strength of the useful signal, Strength of interference signals from other sources and noise.\n_ RSRP: Strength of the useful signal.\n_ RSRQ: Quality of the useful signal strength relative to interference and noise (RSRP/RSSI).\n_ SINR: Quality of signal efficiency or purity relative to interference and noise (balance between purity and noise is 0).\n_ CQI: Standardized signal quality assessment calculated by the modem and sent to the BTS, which uses it to modulate the signal balancing volume of data transmitted per second (speed) with the reliability (0–15).\n_ Signal: Signal quality assessment calculated by balancing the underlying parameters (SPECIFIED IN THE SCRIPT).\n_ Frequency: Specific number of radio waves transmitted per second (speed).\n_ EARFCN: Standard identification value that identifies a specific radio frequency.\n_ Band: Standard identification number used to identify a portion or subdivision of radio frequencies.\n_ Bandwidth: Width of a radio frequency range or the interval between two radio frequencies (volume).\n_ Cell ID: Identifier number for a specific radio signal used for data transmission and reception.\n_ PCI: Shortened identifier number for a cell within a limited area.\n_ eNB ID: Identifier number for a transceiver or transmission node (4G ENodeB, 5G GNodeB) managing one or more radio signals.\n_ BTS: Base station with one or more transceivers.\n_ PLMN: Identifier number for the country and network operator.\n");
    alert("--- INFO\n\n"+info+"\n_ Unspecified data is LTE.\n_ With 4G+5G modem, external antenna are NR.\n_ Location or ENodeB in the title bar is LTE only.\n_ The Neighbor cell use the PCI modem API data which is not a unique cell identifier.\n_ The unavailable API data (report in console) entail a lack of information or potential anomalies:\n__ 5G:\n___ Always undefined: NRcell_id (identify cell, expected), GNodeB_id (identify BTS, expected), nrrssi (signal, arranged).\n___ Possible undefined: nrcqi0 (signal, arranged), scc_pci (identify cell, arranged).\n__ 4G:\n___ Possible undefined: cqi0 (signal, arranged), enodeb_id (identify BTS, resolved), ltedlfreq (frequency dl, resolved).");
    alert("--- PARAMETERS\n\n--- SIGNAL VALUE LIMITS\nmax_rssi="+max_rssi+"dBm\tmin_rssi="+min_rssi+"dBm\nmax_rsrp="+max_rsrp+"dBm\tmin_rsrp="+min_rsrp+"dBm\nmax_rsrq="+max_rsrq+"dB\tmin_rsrq="+min_rsrq+"dB\nmax_sinr="+max_sinr+"dB\tmin_sinr="+min_sinr+"dB (set in Hack script)\n--- SIGNAL QUALITY BALANCED\nsignal_balance_rssi="+signal_balance_rssi+"%\nsignal_balance_rsrp="+signal_balance_rsrp+"%\nsignal_balance_rsrq="+signal_balance_rsrq+"%\nsignal_balance_sinr="+signal_balance_sinr+"% (set in Hack script)\n--- GEOGRAPHICAL AREA BANDS\ngeo_area="+geo_area+"\n(list, add & set in Hack script)\n--- EARFCN DL\n(list, add in Hack script)\n--- FREQUENCY BANDS LOW\n(list, add in Hack script)\n--- BTS LOCATIONS\n(list, add & change in Hack script)");
}
function clickStorage(tipo,b)
{
    sn=store[tipo];if(localStorage.getItem(sn)===null)localStorage.setItem(sn,JSON.stringify([]));
    if(tipo=="rec")
    {
        savq=["Input record info (optional)."],savl=[35];
        h0="Records:",h1="* Unavailable for NR in modem API, LTE alternative if available is indicative.<br>** Unique identification unavailable in API.<br>For analysis of recordings, select table, copy and paste it into an Excel sheet or 'Export'.";
        re1=[["","Date, Time","Info","Network","Antennas","PCI","EARFCN dl","Band","ENB Id*","Count-Interval","RSSI","RSRP","","","RSRQ","","","SINR","","","Signal","","","CQI","","","Neighbor cell**"],["","","","","Ant1-Ant2","","","","","Num-Sec","Med","Med","Max","Min","Med","Max","Min","Med","Max","Min","Med","Max","Min","Med","Max","Min","1st(Num)-2nd(Num)-3rd(Num)-4th(Num)"]];
        re2=[];
        re3=JSON.parse(localStorage.getItem(sn));
    }
    if(tipo=="bts")
    {
        savq=["Input ENodeB location name (optional).\n(permanent ENodeB locations (in grey) at the bottom of the Hack script)\nInformation about ENodeB and BTS locations in cellmapper.net, lteitaly.it or other.","Input availables ENodeB bands (optional)."],savl=[35,35];
        h0="Locations:",h1="* Douplicate.<br>The values may be subject to change by the network operator.<br>For a permanent inclusion of the location (grey in table), add them manually to the bottom of the Hack script.";
        re1=[["ENB Id","ENB & BTS location","Availables bands"]];
        re2=JSON.parse(JSON.stringify(bts_location));
        re3=JSON.parse(localStorage.getItem(sn));
    }
    if(tipo=="cel")
    {
        h0="Main band cells:",h1="* NR 'Cell Id' & 'GNB Id' are unavailable in modem API, the 'PCI-EARFCN' alternative may have possible anomalous; If NR 'PCI' is unavailable this function is disabled.<br>** Douplicate 'PCI', not identifiable in 'Neighbor cell'.<br>*** The daily average is calculated from averages recorded at the time of connection to a cell and after every hour of continuous connection to it.; The daily average signal quality is green/red lines, daily hits is black lines or dots or blue dots for cell data change; Changes:1='PCI' 2='EARFCN dl'/'Frequency dl' 3='Band' 4='Bandwidth dl' 5='ENB Id'; Max days stored:"+boxcl+"; For daily or total info move the cursor over charts.<br>**** If availables; Unique identification unavailable in API.<br>The cells data may be subject to change by the network operator.<br>The cells can be identified as 'Cell Id' or 'PCI'+'EARFCN dl'.<br>To get good performance connect to band with high 'Frequency dl', 'Bandwidth dl' and Signal quality.<br>To set the specific bands cells, use 'PCI' and 'EARFCN dl'/'Frequency dl' data in '192.168.8.1/->...->System Settings->Developer options->Band selection->...'(if available).";
        re1=[["Cell Id*","PCI**","EARFCN dl","Band","Frequency dl","Bandwidth dl","ENB Id*","Location","Daily hits & Signal quality***","Aggregate bands****"],["","","","","Mhz","Mhz","","","","EARFCN dl(Band)"]];
        re2={"Total daily hits":["","","","","","","","",""]};
        re3=JSON.parse(localStorage.getItem(sn));re3s=JSON.parse(JSON.stringify(re3));
        re4=JSON.parse(localStorage.getItem(store["day"]));
        max=0;ttt=0;tt=Array.from({length: day.length},(_,i)=>0);
        for(const[,a]of Object.entries(re3)){a[6].forEach((e,k)=>{tt[k]+=e[0];ttt+=e[0];if(tt[k]>max)max=tt[k]});}
        for(const[k,a]of Object.entries(re3))/*cell chart*/
        {
            h="",hh="",tn=0,tm=0,px=a[6].length*lcl+2;
            a[6].forEach((e,kk)=>
            {
                tm=(tm*tn+e[1]*e[0])/(tn+e[0])||0;tn+=e[0];
                px-=lcl;py1=hcl-e[0]/tt[kk]*hcl;
                py2=hcl-e[1]/100*hcl;co1=e[2]?"blue":"black";co2="rgb("+5*Math.round(e[1]<50?50:100-e[1])+","+5*Math.round(e[1]>50?50:e[1])+",0)";
                if(e[0]!=0){h+='<line x1="'+px+'"y1="'+hcl+'"x2="'+px+'"y2="'+py2+'"stroke="'+co2+'"stroke-width="'+lcl+'"/><circle cx="'+px+'"cy="'+py1+'"fill="'+co1+'"r="'+(lcl/2)+'"/>'}
                hh+='<div style="position:absolute;left:'+px+'px;height:'+hcl+'px;width:'+lcl+'px"title="'+re4[kk]+'\nHits:'+ro(e[0]/tt[kk]*100)+'% ('+e[0]+'/'+tt[kk]+')\nMedSigal:'+e[1]+'%'+(e[2]?'\nChanges:'+e[2]:'')+'"></div>';
            });
            re3[k][6]='<div style="position:relative"title="Total\nHits:'+ro(tn/ttt*100)+'% ('+tn+'/'+ttt+')\nMedSigal:'+ro(tm)+'%">'+hh+'<svg version="1.1"viewBox="0 0 '+wcl+' '+hcl+'"width="'+wcl+'"height="'+hcl+'"preserveAspectRatio="xMaxYMax slice"style="border:1px solid %23448;padding:1px;margin:0 0 -4px;width:'+wcl+'px">'+h+'</svg><div>';
/*aggregat*/re3[k][7]='<div style="font-size:11px;overflow-wrap:break-word;white-space:normal;max-width:300px">'+a[7].toString().replaceAll(",","-")+'</div>';
/*ENB&loca*/re3[k].splice(6,0,"");
            if(a[5] in bts)re3[k][6]=bts[a[5]][0].slice(0,26).replace(/[^a-zA-Z]+$/,"");
            else if(a[5]){re3[k][6]="<button onclick='window.opener.clickStorage(\"bts\",\""+a[5]+"\")'>Add Location</button>";a[5]="<a target='_blank'href='"+link+a[5].replace(/^0+/,"")+"'>"+a[5]+"</a>"}
        }
        h="",hh="",px=re4.length*lcl+2;/*1st chart*/
        re4.forEach((e,k)=>
        {
            px-=lcl;py=hcl-tt[k]/max*hcl;
            h+='<line x1="'+px+'"y1="'+hcl+'"x2="'+px+'"y2="'+py+'"stroke="black"stroke-width="'+lcl+'"/>';hh+='<div style="position:absolute;left:'+px+'px;height:'+hcl+'px;width:'+lcl+'px"title="'+e+'\nHits:'+tt[k]+'"></div>';
        });
        if(h)re2["Total daily hits"][7]='<div style="position:relative"title="Total\nHits:'+ttt+'">'+hh+'<svg version="1.1"viewBox="0 0 '+wcl+' '+hcl+'"width="'+wcl+'"height="'+hcl+'"preserveAspectRatio="xMaxYMax slice"style="border:1px solid %23448;padding:1px;margin:0 0 -4px;width:'+wcl+'px;background-color:white">'+h+'</svg></div>';
/*PCI*/ for(const[a]of Object.entries(re3))for(const[aa]of Object.entries(re3))if(re3[aa][0]==re3[a][0].replace("**","")&&a!=aa)re3[aa][0]+="**";
    }
    h1+=tipo=="rec"?"":"<br>For info <a href='https://lteitaly.it'target='_blank'>lteitaly.it</a> (registration recommended), <a href='https://www.cellmapper.net'target='_blank'>cellmapper.net</a>, <a href='https://celltracker.it'target='_blank'>Celltracker.it</a>, <a href='https://sqimway.com/'target='_blank'>sqimway.com</a>, <a href='https://5g-tools.com/'target='_blank'>5g-tools</a> or other.";
    function tab()
    {
        h="";
        for(a in re1){h+="<tr bgcolor='B0E0E6'>";re1[a].forEach(c=>h+="<td>"+c+"</td>");h+="</tr>"};
        for(const[a]of Object.entries(re2)){h+="<tr bgcolor='%23bbb'><td>"+a+(a in re3?"*":"")+"</td>";for(const[,c]of Object.entries(re2[a]))h+='<td>'+c+'</td>';h+='</tr>'}
        for(const[a]of Object.entries(re3)){h+="<tr><td bgcolor='B0E0E6'>"+a+(a in re2?"*":"")+" <input type='checkbox'name='c'value='"+a+"'></td>";for(const[,c]of Object.entries(re3[a]))h+='<td>'+c+'</td>';h+='</tr>'}
        h+="<tr><td bgcolor='B0E0E6' style='text-align:right'><input id='cc'type='checkbox'onclick='c=document.getElementsByName(\"c\");for(i in c)c[i].checked=this.checked;'></td><td style='text-align:left'><button onclick='delsto()'>Delete</button></td></tr>";
        t=document.createElement('table'),t.innerHTML=h;w.document.getElementById('tb').replaceChildren(t);
    };
    w=window.open("","Storage","width="+screen.availWidth);w.focus();w.document.body.innerHTML="";
    w.delsto=function()
    {
        for(const c of w.document.getElementsByName('c'))
            if(c.checked)
            {
                delete re3[c.value];
                if(tipo=="rec"){localStorage.setItem(sn,JSON.stringify(re3.filter(n=>n!=null)))}
                if(tipo=="bts"){localStorage.setItem(sn,JSON.stringify(re3));loadBTS()}
                if(tipo=="cel"){delete re3s[c.value];localStorage.setItem(sn,JSON.stringify(re3s));loadCel()}
            }
        if(tipo=="cel"&&Object.keys(cel).length===0){re2["Total daily hits"][7]="";day=[];localStorage.setItem(store["day"],JSON.stringify([]))}
        w.document.getElementById("cc").checked=false;
        tab();
    };
    w.savtxt=function()
    {
        r="_ Script";re1.forEach(v=>r+="\n"+v);
        if(tipo!="cel"){r+="\n\n_ Script";for(const[k,v]of Object.entries(re2))r+="\n"+k+" "+v}
        else{a=JSON.parse(localStorage.getItem(store["day"]));r+="\n\n_ Local storage: "+store["day"];for(const[k,v]of Object.entries(a))r+="\n"+k+" "+v}
        a=JSON.parse(localStorage.getItem(sn));r+="\n\n_ Local storage: "+sn;for(const[k,v]of Object.entries(a))r+="\n"+k+" "+v;
        b=new Blob([r],{type:"text/plain"});l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=sn+".txt";l.click();
    };
    w.document.write("<!DOCTYPE html><html><style>body{font-family:Arial;font-size:14px}table{text-align:center;white-space:nowrap;border:2px solid %23bbb}</style><body>"+h0+"<br><span id='tb'></span>"+h1+"<br><b>Saves made to the browser's local storage, are browser and address dependent and can be deleted by system cleaning programs.</b><button onclick='savtxt()'>Export</button> in .txt format.</body></html>");tab();
    if(b)setTimeout(function()
    {
        for(var inf=[],l=savq.length,i=0;i<l;i++)do{inf[i]=w.prompt(savq[i]+"\nMax "+savl[i]+" char.");if(inf[i]===null)return}while(inf[i].length>savl[i]);
        if(tipo=="rec")
        {
            t=new Date().toLocaleString(navigator.language,{dateStyle: 'short',timeStyle: 'short'});
            if(selsign[b]==b+"cqi0"){rmes=rmis=rmas="";rmec=ro(recmed[b+"cqi0"]);rmic=recmin[b+"cqi0"];rmac=recmax[b+"cqi0"]}else{rmec=rmic=rmac="";rmes=ro(recmed[b+"sign"]);rmis=ro(recmin[b+"sign"]);rmas=ro(recmax[b+"sign"])}
            re3.push([t,inf[0],b.toUpperCase(),recant,recpci[b],recearfcn[b],recband[b],recenb[b],recpause[b]+reccount[b]+"-"+(itime/1000),ro(recmed[b+"rssi"]),ro(recmed[b+"rsrp"]),recmax[b+"rsrp"],recmin[b+"rsrp"],ro(recmed[b+"rsrq"]),recmax[b+"rsrq"],recmin[b+"rsrq"],ro(recmed[b+"sinr"]),recmax[b+"sinr"],recmin[b+"sinr"],rmes,rmas,rmis,rmec,rmac,rmic,recneires[b]]);
        }
        if(tipo=="bts"){bts[b]=[inf[0],inf[1]];re3[b]=[inf[0],inf[1]]}
        localStorage.setItem(sn,JSON.stringify(re3));
        tab();
    },200);
}
function ftb()
{
	document.body.insertAdjacentHTML("afterbegin",'
<style>
:root
{
    --neitd1:0;--neitd2:0;--neitd3:0;--neitd4:0;
}
.val,.vali
{
    color:%23b00;
    font-weight:bold;
}  
.vali
{
    height:13px;
    width:28px;
    font-family:inherit;
    font-size:inherit;
}
.valr
{
    float:right;
}
.valm
{
    position:absolute;
    left:9.5em;
}
.sel
{
    height:20px;
    appearance:none;
    border-radius:2px;
    font-family:inherit;
    font-size:inherit;
}
.but,.but2
{
    font-weight:bold;
    background-color:%23448;
    border:none;
    color:white;
    padding:5px;
    border-radius:5px;
}
.but2
{
    padding:2px 5px 2px 5px;
}
.nei
{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
}
.nei td:nth-child(1) 
{
    width:var(--neitd1);
}
.nei td:nth-child(2) 
{
    width:var(--neitd2);
}
.nei td:nth-child(3) 
{
    width:var(--neitd3);
}
.nei td:nth-child(4) 
{
    width:var(--neitd4);
}
.f,.fc,.ft
{
    border-radius:5px;
    padding:2px;
    line-height:2em;
    margin:2px;
    float:left;
    position:relative;
}
.f,.ft
{
    display:inline;
}
.f,.fc
{
    border:1px solid %23bbb;
}
.ft
{
    border:1px solid %23448;
}
.lte,.nr,.ltenr
{
    display:none;
}
</style>
<div style="position:relative;display:inline-block;width:calc(100% - 7em);font-size:14px;overflow:auto">
<div id="tit" style="color:white;background-color:%23b00;margin:6px;padding:5px;border-radius:5px;text-align:center;font-weight:bold"></div>
<div id="chlte" class="fc lte">
RSSI:<span id="lterssi" class="val"></span><span id="medlterssi" class="valm"></span><span class="valr">Main:<span id="lteband" class="val"></span></span><br>
RSRP:<span id="ltersrp" class="val"></span><span id="medltersrp" class="valm"></span><span class="valr">RecordMed <input type="checkbox" id="reclte" onclick="clickRecMed(this,\'lte\')"></span><div id="bltersrp"></div>
RSRQ:<span id="ltersrq" class="val"></span><span id="medltersrq" class="valm"></span><span class="valr" id="countlte">CurrentMed:<span id="medcountlte" class="val"></span><input id="medsetcountlte" class="vali" maxlength="4" onkeypress="return(event.charCode>=48&&event.charCode<=57)" onblur="clickNumCurMed(this,\'lte\')" onfocus="this.value=\'\'"></span><div id="bltersrq"></div>
SINR:<span id="ltesinr" class="val"></span><span id="medltesinr" class="valm"></span><span class="valr" id="storelte" style="margin-top:-2px"></span><div id="bltesinr"></div>
<select id="selsignlte" class="sel" onchange="clickSelSign(this.value,\'lte\')"><option value="ltesign">Signal</option><option value="ltecqi0">CQI</option></select>:<span id="ltesign" class="val"></span><span id="medltesign" class="valm"></span><div id="bltesign"></div>
</div>
<div id="chnr" class="fc nr">
NR RSSI:<span id="nrrssi" class="val"></span><span id="mednrrssi" class="valm"></span><span class="valr">NR Main:<span id="nrband" class="val"></span></span><br>
NR RSRP:<span id="nrrsrp" class="val"></span><span id="mednrrsrp" class="valm"></span><span class="valr">RecordMed <input type="checkbox" id="recnr" onclick="clickRecMed(this,\'nr\')"></span><div id="bnrrsrp"></div>
NR RSRQ:<span id="nrrsrq" class="val"></span><span id="mednrrsrq" class="valm"></span><span class="valr" id="countnr">CurrentMed:<span id="medcountnr" class="val"></span><input id="medsetcountnr" class="vali" maxlength="4" onkeypress="return(event.charCode>=48&&event.charCode<=57)" onblur="clickNumCurMed(this,\'nr\')" onfocus="this.value=\'\'"></span><div id="bnrrsrq"></div>
NR SINR:<span id="nrsinr" class="val"></span><span id="mednrsinr" class="valm"></span><span class="valr" id="storenr" style="margin-top:-2px"></span><div id="bnrsinr"></div>
<select id="selsignnr" class="sel" onchange="clickSelSign(this.value,\'nr\')"><option value="nrsign">NR Signal</option><option value="nrcqi0">NR CQI</option></select>:<span id="nrsign" class="val"></span><span id="mednrsign" class="valm"></span><div id="bnrsign"></div>
</div>
<div id="nei" class="f" style="position:relative;width:12em;height:2em;overflow:hidden">
Neighbor cell <input id="neifor" type="checkbox" onclick="clickNei(this)">
<table id="neitaps" class="nei"></table><table id="neitab" class="nei val"></table>
<span style="position:absolute;bottom:0"><span id="neireclte"></span><br><span id="neirecnr"></span></span>
</div>
<div id="ant" class="ft">
<span class="ltenr">NR&nbsp;</span>Antennas:<span id="a1" class="val"></span>-<span id="a2" class="val"></span>
</div>
<div class="f">
<span class="ltenr">Force 4G Set only <input id="f4g" type="checkbox"></span><span class="lte"><button class="but" onclick="clickSetLTEBand()">Set Bands</button>  Allowed:<span id="lteallowed" class="val"></span></span>
<span class="nr"><button class="but" onclick="clickSetNRBand()">Set NR Bands</button> NR Allowed:<span id="nrallowed" class="val"></span></span>
</div>
<div id="enb" class="ft lte">
ENB Id:<a id="enodeb_id" class="val" target="lteitaly" href="%23">%23</a><br>
Location:<span id="namebts" class="val"></span><br>
Availables:<span id="bandsbts" class="val"></span>
</div>
<div id="band" class="ft">
<span class="lte">
Main:<span id="ltemain" class="val"></span><span id="mode" class="val"></span>&ensp;Frequency dl:<span id="ltedlfreq" class="val"></span>&ensp;Bandwidth dl:<span id="ltedlbandwidth" class="val"></span>&ensp;PCI:<span id="pci" class="val"></span>
<span id="ltebands"></span>
</span>
<span class="nr">
NR Main:<span id="nrmain" class="val"></span>&ensp;NR Frequency dl:<span id="nrdlfreq" class="val"></span>&ensp;NR Bandwidth dl:<span id="nrdlbandwidth" class="val"></span>&ensp;NR PCI:<span id="scc_pci" class="val"></span>
<span id="nrbands"></span>
</span>
</div>
</div>
<div style="position:absolute;display:inline-block;top:0;font-size:14px">
<div class="f" >
<button class="but" onclick="clickStorage(\'cel\')">Open Cells</button><br>
<button class="but" onclick="clickStorage(\'rec\')">Open Rec.</button><br>
<button class="but" onclick="clickStorage(\'bts\')">Open Loc.</button><br>
<button class="but" onclick="clickTime()">Set Int.</button>
<button class="but" onclick="clickInfo()">i</button>
</div>
</div>
    ');
}
/*current value*/
signnam=
["nrrsrp"      ,"nrrsrq"      ,"nrsinr"      ,"nrcqi0"                     ,"nrrssi"    ,"nrdlbandwidth"    ,"scc_pci"
,"ltersrp"     ,"ltersrq"     ,"ltesinr"     ,"ltecqi0"                    ,"lterssi"   ,"ltedlbandwidth"   ,"pci"];
signnam2=
["nrearfcn" ,"nrdlfreq"
,"lteearfcn","ltedlfreq","cell_id","enodeb_id"
,"band","nei_cellid"];
signval=
{"nrrsrp":""   ,"nrrsrq":""   ,"nrsinr":""   ,"nrcqi0":""   ,"nrsign":""   ,"nrrssi":"" ,"nrdlbandwidth":"" ,"scc_pci":""
,"nrearfcn":"","nrearfcndl":"","nrearfcnul":"","nrdlfreq":"","nrmain":""
,"ltersrp":""  ,"ltersrq":""  ,"ltesinr":""  ,"ltecqi0":""  ,"ltesign":""  ,"lterssi":"","ltedlbandwidth":"","pci":""
,"lteearfcn":"","lteearfcndl":"","lteearfcnul":"","ltedlfreq":"","ltemain":"","cell_id":"","enodeb_id":""
,"band":"","nei_cellid":"","plmn":""};
currval=
{"nrrsrp":0    ,"nrrsrq":0    ,"nrsinr":0    ,"nrcqi0":0    ,"nrsign":0    ,"nrrssi":0
,"ltersrp":0   ,"ltersrq":0   ,"ltesinr":0   ,"ltecqi0":0   ,"ltesign":0   ,"lterssi":0};
currcha=
{"nrrsrp":[]   ,"nrrsrq":[]   ,"nrsinr":[]   ,"nrcqi0":[]   ,"nrsign":[]
,"ltersrp":[]  ,"ltersrq":[]  ,"ltesinr":[]  ,"ltecqi0":[]  ,"ltesign":[]};
currnei=[],neistatus=0;/*status 0off1min2max*/
curagg={"lte":[],"nr":[]},currant={1:"",2:""},selsign={"lte":"ltesign","nr":"nrsign"},selsignnot={"lte":"ltecqi0","nr":"nrcqi0"};/*assign 1st select/notSel*/
/*recMed*/
recmax=
{"nrrsrp":-999 ,"nrrsrq":-999 ,"nrsinr":-999 ,"nrcqi0":-999 ,"nrsign":-999
,"ltersrp":-999,"ltersrq":-999,"ltesinr":-999,"ltecqi0":-999,"ltesign":-999};
recmin=
{"nrrsrp":999  ,"nrrsrq":999  ,"nrsinr":999  ,"nrcqi0":999  ,"nrsign":999
,"ltersrp":999 ,"ltersrq":999 ,"ltesinr":999 ,"ltecqi0":999 ,"ltesign":999};
recmed=
{"nrrsrp":0    ,"nrrsrq":0    ,"nrsinr":0    ,"nrcqi0":0    ,"nrsign":0    ,"nrrssi":0
,"ltersrp":0   ,"ltersrq":0   ,"ltesinr":0   ,"ltecqi0":0   ,"ltesign":0   ,"lterssi":0};
recmedcha=
{"nrrsrp":[]   ,"nrrsrq":[]   ,"nrsinr":[]   ,"nrcqi0":[]   ,"nrsign":[]
,"ltersrp":[]  ,"ltersrq":[]  ,"ltesinr":[]  ,"ltecqi0":[]  ,"ltesign":[]};
recnumnei={"lte":{},"nr":{}},recneires={"lte":"","nr":""};
recant="",recpci={"lte":"","nr":""},recearfcn={"lte":"","nr":""},recband={"lte":"","nr":""},recenb={"lte":"","nr":""},recenbnr="";
reccount={"lte":0,"nr":0},recmaxcount={"lte":999,"nr":999},recpause={"lte":"","nr":""},recstatus={"lte":0,"nr":0};/*status 0off1on2pause3end*/
recvalnot={"lte":false,"nr":false};
/*curMed*/
curmed=
{"nrrsrp":[]   ,"nrrsrq":[]  ,"nrsinr":[]    ,"nrsign":[]   ,"nrcqi0":[]
,"ltersrp":[]  ,"ltersrq":[] ,"ltesinr":[]   ,"ltesign":[]  ,"ltecqi0":[]};
curmedsign={"lte":0,"nr":0},curmaxcount={"lte":0,"nr":0},curstatus={"lte":0,"nr":0};/*status 0off1on*/
/*defined*/
defined={"cqi0":false,"enodeb_id":false,"ltedlfreq":false,"nrrssi":false,"nrcqi0":false,"scc_pci":false},undef=[],defltenr={"lte":false,"nr":false},ltenr=[];
/*other*/
store={"rec":"Hack_recmed","bts":"Hack_locbts","cel":"Hack_cells","day":"Hack_cells_day"},bts={},cel={},day=[];
celint={"lte":0,"nr":0},celcur={"lte":"","nr":""},celcha={"lte":false,"nr":false};
cellchange={"lte":false,"nr":false},cellcurrent={"lte":"","nr":""};cellold={"lte":"","nr":""};
mainband=null,_2ndrun=null,suspend=false,itime=2000,state="",link="";
/*chart signal&cells window width,height,line width*/
wch=500,hch=40,lch=4,boxch=parseInt(wch/lch),lmch=lch/4;
wcl=600,hcl=35,lcl=3,boxcl=parseInt(wcl/lcl);
/*------ SIGNAL VALUE LIMITS
set limits LTE&NR per usual use (for calc Signal and chart limits)(max extremes +998,-998)*/
max_rssi=-51,min_rssi=-100; /*dBm RSSI >=-51 -110(?)<-example max/min Huawei router hardware limits*/
max_rsrp=-55,min_rsrp=-125; /*dBm RSRP -44   -140(?)*/
max_rsrq=-3, min_rsrq=-19.5;/*dB  RSRQ -3    <-19.5*/
max_sinr=25, min_sinr=-20;  /*dB  SINR >=30  <-20*/
max_sign=100,min_sign=0;    /*100-0%*/
max_cqi0=15, min_cqi0=0;    /*15-0
------ SIGNAL QUALITY BALANCED
set balance ratio LTE&NR (for calc Signal quality %)*/
signal_balance_rssi=0; /*% RSSI*/
signal_balance_rsrp=40;/*% RSRP*/
signal_balance_rsrq=15;/*% RSRQ*/
signal_balance_sinr=45;/*% SINR
set volatility LTE&NR (for calc Signal q.)(circumstantial average volatility of min-max values)*/
signal_volatility_rssi=0;/*RSSI*/
signal_volatility_rsrp=4;/*RSRP*/
signal_volatility_rsrq=8;/*RSRQ*/
signal_volatility_sinr=8;/*SINR
balancing calc sign. q.*/
qi=signal_balance_rssi*(1-signal_volatility_rssi/(max_rssi-min_rssi));qp=signal_balance_rsrp*(1-signal_volatility_rsrp/(max_rsrp-min_rsrp));
qq=signal_balance_rsrq*(1-signal_volatility_rsrq/(max_rsrq-min_rsrq));qr=signal_balance_sinr*(1-signal_volatility_sinr/(max_sinr-min_sinr));
totq=(qp+qq+qr+qi)/100;
balance_rssi=qi/totq;balance_rsrp=qp/totq;
balance_rsrq=qq/totq;balance_sinr=qr/totq;
/*--- add&change all 3 step: (1)GEOGRAPHICAL AREA BANDS & set available (2)EARFCN DL (3)FREQUENCY BANDS LOW(sqimway.com)
------ GEOGRAPHICAL AREA BANDS*/
geo_area="eur";/*set availables "eur","usa",...
,"geoarea":{"lte":[bands list]},{"nr":[bands list]}*/
bands=
{"eur":{"lte":[1,3,7,8,20,28,32,38,40],"nr":[1,3,7,8,20,28,32,38,40,78,258]}
,"usa":{"lte":[2,4,5,12,13,14,17,25,26,29,30,41,46,48,66,71],"nr":[2,4,5,12,13,14,17,25,26,29,30,41,46,48,66,71,77,258,260,261]}
};
/*------ EARFCN DL
,"band":[EARFCN downlink low,EARFCN downlink high]*/
earfcndl=
{"lte":
{1: [0,599]        ,2: [600,1199]     ,3: [1200,1949]    ,4: [1950,2399]
,5: [2400,2649]    ,7: [2750,3449]    ,8: [3450,3799]    ,12:[5010,5179]
,13:[5180,5279]    ,14:[5280,5379]    ,17:[5730,5849]    ,20:[6150,6449]
,25:[8040,8689]    ,26:[8690,9039]    ,28:[9210,9659]    ,29:[9660,9769]
,30:[9770,9869]    ,32:[9920,10359]   ,38:[37750,38249]  ,40:[38650,39649]
,41:[39650,41589]  ,42:[41590,43589]  ,43:[43590,45589]  ,46:[46790,54539]
,48:[55240,56739]  ,66:[66436,67335]  ,71:[68586,68935]}
,"nr":
{1: [422000,434000],2: [386000,398000],3: [361000,376000]
,5: [173800,178800],7: [524000,538000],8: [185000,192000],12:[145800,149200]
,13:[149200,151200],14:[151600,153600]                   ,20:[158200,164200]
,25:[386000,399000],26:[171800,178800],28:[151600,160600],29:[143400,145600]
,30:[470000,472000]                   ,38:[514000,524000],40:[460000,470000]
,41:[499200,537999]                                      ,46:[743334,795000]
,48:[636668,646666],66:[422000,440000],71:[123400,130400]
,77:[620000,680000],78:[620000,653333],257:[2054166,2104165],258:[2016667,2070832],260:[2229166,2279165],261:[2070833,2084999]}
};
/*------ FREQUENCY BANDS LOW
,band:frequency downlink low*/
freqdllow=
 {1:2110,2:1930 ,3:1805 ,4:1950
 ,5:869 ,7:2620 ,8:925  ,12:729
,13:746 ,14:758 ,17:734 ,20:791
,25:1930,26:859 ,28:758 ,29:717
,30:2350,32:1452,38:2570,40:2300
,41:2496,42:3400,43:3600,46:5150
,48:3550,66:2110,71:617
,77:3300,78:3300,257:26500,258:24250.1,260:37000,261:27500};
/*ARFCN frequency ratio ΔFGlobal:[NRARFCN low,NRARFCN high,NRFrequency low](5g-tools.com)*/
nrfreqratio={5:[0,599999,0],15:[600000,2016666,3000],60:[2016667,3279165,24250.08]};
/*--- add&change (lteitaly.it,cellmapper.net or other)
------ BTS LOCATION
"0eNB Id":["name&info location(optional)"       ,"Availables bands(optional)"],*/
var bts_location={
"0362381":["1:Piscille cimitero 1,7km"          ,"B3+ B20 B28 N3 N28 N38 N78"],
"0363381":["2:Piscille cimitero 1,7km"          ,"B7+ B1+"],
"0363035":["2:Piscille volumni 1,9km"           ,"B7+ B1+"],
"0362035":["1:Piscille volumni 1,9km"           ,"B3+ B20 B28 N3 N28 N38 N78"],
"0362005":["Borgo XX giugno S.Pietro 2,3km"     ,"B1+ B3+ N3"],
"0362379":["1:Balanzano 4,6km"                  ,"B3+ N3"],
"0363379":["2:Balanzano 4,6km"                  ,"B1+"],
"0363316":["2:S.Martino in campo 8,6km"         ,"B7 B1"],
"0362316":["1:S.Martino in campo 8,6km"         ,"B3 B20 B28 N3 N28"],
};
status="",netmode="",signal="",antennatype="",start(),currentData(),interval=setInterval(currentData,itime);
tit("Che la banda sia con te! Hack by Miononno&%239829; & Riccardo Fanelli"),setTimeout(tit,4000);
info="_ Huawei router Hack - Base code v5.0 by miononno.it, Advanced v2.0.0 by Riccardo Fanelli.\n_ Tested with Huawei B818 and B636 4G router and Firefox, Edge, Chrome browsers.",msg(info+"\n_ Type: netmode, signal, status, antennatype");
/*for URLformat "#"=>"%23"*/