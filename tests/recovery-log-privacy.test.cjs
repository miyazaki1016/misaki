const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
for(const file of ['app/api/chat/route.ts','app/api/persona/history/route.ts','lib/canonical-state.ts','lib/persona/persona-store.ts'])test(`recovery entry logs exclude exception payloads and conversation content: ${file}`,()=>{
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 function visit(node){
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.expression.getText(source)==='console'){
   for(const arg of node.arguments){
    function inspect(n){
     if(ts.isIdentifier(n)&&['reply','memory','history','contents','temporaryState','token','apiKey','firstProblems','finalProblems','error'].includes(n.text)){
      const p=n.parent;
      if(ts.isPropertyAssignment(p)&&p.name===n)return;
      if(ts.isPropertyAccessExpression(p)&&p.expression===n&&p.name.text==='length')return;
      assert.fail(`unsafe log expression in ${file}: ${n.getText(source)}`);
     }
     if(ts.isPropertyAccessExpression(n)&&['data','details','hint','message'].includes(n.name.text))assert.fail(`raw payload in ${file}: ${n.getText(source)}`);
     ts.forEachChild(n,inspect);
    }inspect(arg);
   }
  }ts.forEachChild(node,visit);
 }visit(source);
});
