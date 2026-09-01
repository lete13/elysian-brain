'use strict';
/**
 * Build fe/patches-145.json:
 * Configuration Fiscal contact (Oxygen) — clicking a search hit did not
 * show as linked because renderCfg() no-ops while the search input is
 * focused (mousedown runs before blur).
 * Run: node scripts/_build-oxy-fiscal-pick.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function applyKind(kind, untilName) {
  const baseName = kind === 'fe' ? 'index.html' : 'server.js';
  let src = fs.readFileSync(path.join(root, baseName), 'utf8').replace(/\r\n/g, '\n');
  for (let n = 1; ; n++) {
    const name = n === 1 ? 'patches.json' : 'patches-' + n + '.json';
    if (name === untilName) break;
    const file = path.join(root, kind, name);
    if (!fs.existsSync(file)) break;
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (spec.baseSha256 && sha256(src) !== spec.baseSha256) throw new Error(kind + '/' + name + ' base drift');
    for (const p of spec.patches || []) {
      const parts = src.split(p.find);
      if (parts.length - 1 !== (p.count || 1)) throw new Error(kind + '/' + name + ' anchor: ' + p.note);
      src = parts.join(p.replace);
    }
    if (spec.expectedSha256 && sha256(src) !== spec.expectedSha256) throw new Error(kind + '/' + name + ' expected sha');
  }
  return src;
}

function writePatch(kind, filename, src, patches, builtAt, assertions) {
  let out = src;
  for (const [i, p] of patches.entries()) {
    const parts = out.split(p.find);
    if (parts.length - 1 !== (p.count || 1)) {
      throw new Error(kind + ' patch ' + (i + 1) + ' (' + p.note + '): anchor count ' + (parts.length - 1));
    }
    out = parts.join(p.replace);
  }
  const cfg = {
    baseSha256: sha256(src),
    expectedSha256: sha256(out),
    builtAt: builtAt,
    patches: patches,
    assertions: assertions,
  };
  fs.writeFileSync(path.join(root, kind, filename), JSON.stringify(cfg, null, 1) + '\n');
  console.log('wrote', kind + '/' + filename, cfg.expectedSha256);
  return out;
}

const feSrc = applyKind('fe', 'patches-145.json');

writePatch(
  'fe',
  'patches-145.json',
  feSrc,
  [
    {
      note: 'setApt: match apartment ids as strings; do not rebuild Configuration while linking Oxygen',
      find: "function setApt(id,f,v){const a=S.apts.find(x=>x.id===id);if(a){a[f]=v;save();if(f==='ownerEmail'||f==='ownerEmail2'||f==='ownerEmail3'||f==='clearGroup'||f==='businessTaxAmt'||f==='ownerName'||f==='ownerSurname'||f==='ownerPhone')return;renderCfg();}}",
      replace: "function setApt(id,f,v){const a=S.apts.find(x=>String(x.id)===String(id));if(a){a[f]=v;save();if(f==='ownerEmail'||f==='ownerEmail2'||f==='ownerEmail3'||f==='clearGroup'||f==='businessTaxAmt'||f==='ownerName'||f==='ownerSurname'||f==='ownerPhone'||f==='oxyContactId'||f==='oxyContactName')return;renderCfg();}}",
      count: 1,
    },
    {
      note: 'Fiscal contact dropdown: keep the hit above following fields; mousedown preventDefault so the input does not steal the click',
      find: "            <div style=\"position:relative\">\n            <input type=\"text\" id=\"oxy-in-${a.id}\" autocomplete=\"off\" value=\"${((a.oxyContactName||'')+'').replace(/\"/g,'&quot;')}\" placeholder=\"Search owner by name or ΑΦΜ...\" oninput=\"_oxyFilter('${a.id}',this.value)\" onfocus=\"_oxyFilter('${a.id}',this.value)\" onblur=\"setTimeout(function(){var r=document.getElementById('oxy-res-${a.id}');if(r)r.style.display='none';},200)\" style=\"width:100%;font-size:12px;padding:7px;border-radius:var(--r);border:1px solid var(--bdr);background:var(--bg);color:var(--tx)\">\n            <div id=\"oxy-res-${a.id}\" style=\"display:none;position:absolute;z-index:60;left:0;right:0;top:100%;max-height:220px;overflow:auto;background:var(--bg);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:0 8px 24px rgba(0,0,0,.28)\"></div>",
      replace: "            <div style=\"position:relative;z-index:80\">\n            <input type=\"text\" id=\"oxy-in-${a.id}\" autocomplete=\"off\" autocorrect=\"off\" spellcheck=\"false\" value=\"${((a.oxyContactName||'')+'').replace(/\"/g,'&quot;')}\" placeholder=\"Search owner by name or ΑΦΜ...\" oninput=\"_oxyFilter('${a.id}',this.value)\" onfocus=\"_oxyFilter('${a.id}',this.value)\" onblur=\"setTimeout(function(){if(window._oxyPicking)return;var r=document.getElementById('oxy-res-${a.id}');if(r)r.style.display='none';},200)\" style=\"width:100%;font-size:12px;padding:7px;border-radius:var(--r);border:1px solid var(--bdr);background:var(--bg);color:var(--tx)\">\n            <div id=\"oxy-res-${a.id}\" style=\"display:none;position:absolute;z-index:90;left:0;right:0;top:100%;max-height:220px;overflow:auto;background:var(--bg);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:0 8px 24px rgba(0,0,0,.28)\"></div>",
      count: 1,
    },
    {
      note: 'Fiscal contact results: preventDefault so blur cannot cancel the pick',
      find: "    res.innerHTML=list.map(function(c){ var af=c.afm?(' — ΑΦΜ '+esc(c.afm)):''; return '<div onmousedown=\"_oxyPick(\\''+aptId+'\\',\\''+esc(c.id)+'\\')\" style=\"padding:7px 9px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--bdr)\">'+esc(c.name||('#'+c.id))+'<span style=\"color:var(--tx3)\">'+af+'</span></div>'; }).join('');",
      replace: "    res.innerHTML=list.map(function(c){ var af=c.afm?(' — ΑΦΜ '+esc(c.afm)):''; return '<div onmousedown=\"event.preventDefault();_oxyPick(\\''+aptId+'\\',\\''+esc(c.id)+'\\')\" style=\"padding:7px 9px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--bdr)\">'+esc(c.name||('#'+c.id))+'<span style=\"color:var(--tx3)\">'+af+'</span></div>'; }).join('');",
      count: 1,
    },
    {
      note: 'Fiscal contact pick: write the link even while the search box is focused, then refresh Configuration',
      find: "  window._oxyPick=function(aptId,id){ var c=(window._oxyContacts||[]).find(function(x){return String(x.id)===String(id);}); var nm=c?(c.name||id):id; if(typeof setApt==='function'){ setApt(aptId,'oxyContactId',id); setApt(aptId,'oxyContactName',nm);} var res=document.getElementById('oxy-res-'+aptId); if(res)res.style.display='none'; if(typeof renderCfg==='function')renderCfg(); };",
      replace: "  window._oxyPick=function(aptId,id){\n    window._oxyPicking=true;\n    var cid=String(id||'').trim();\n    var c=(window._oxyContacts||[]).find(function(x){return String(x.id)===cid;});\n    var nm=c?(c.name||cid):cid;\n    var a=null; (S.apts||[]).forEach(function(x){ if(x&&String(x.id)===String(aptId)) a=x; });\n    if(!a||!cid){ window._oxyPicking=false; if(typeof toast==='function') toast('Could not link that fiscal contact. Try again.', 'err'); return; }\n    a.oxyContactId=cid; a.oxyContactName=nm;\n    if(typeof save==='function') save();\n    var res=document.getElementById('oxy-res-'+aptId); if(res)res.style.display='none';\n    var inp=document.getElementById('oxy-in-'+aptId); if(inp){ inp.value=nm; try{ inp.blur(); }catch(e){} }\n    setTimeout(function(){ window._oxyPicking=false; if(typeof renderCfg==='function') renderCfg(); }, 0);\n    if(typeof toast==='function') toast('Linked fiscal contact: '+nm, 'ok');\n  };",
      count: 1,
    },
  ],
  '2026-09-01 Configuration: clicking an Oxygen fiscal contact now links it',
  [
    { has: "f==='oxyContactId'||f==='oxyContactName'", note: 'setApt does not rebuild mid-pick' },
    { has: 'window._oxyPicking=true', note: 'pick ignores blur hide' },
    { has: "a.oxyContactId=cid; a.oxyContactName=nm;", note: 'pick writes the apartment directly' },
    { has: 'event.preventDefault();_oxyPick(', note: 'mousedown does not blur first' },
  ]
);
