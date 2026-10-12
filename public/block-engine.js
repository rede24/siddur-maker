// Serializable recursive building blocks. Only the reader flattens the resolved tree.
export const page = id => ({id:String(id),type:'image'});
export const note = (id,title,body) => ({id,type:'note',title,body});
export const group = (id,title,children) => ({id,type:'group',title,children});
export const ref = id => ({type:'ref',ref:id});
export const when = (condition,then,otherwise=[]) => ({type:'when',condition,then,otherwise});
export const choose = (field,cases,fallback=[]) => ({type:'choose',field,cases,fallback});
const get = (context,path) => path.split('.').reduce((value,key)=>value?.[key],context);
function matches(condition,context) {
  if(typeof condition==='string')return Boolean(get(context,condition));
  if('not' in condition)return !matches(condition.not,context);
  if('all' in condition)return condition.all.every(item=>matches(item,context));
  if('any' in condition)return condition.any.some(item=>matches(item,context));
  if('eq' in condition)return get(context,condition.field)===condition.eq;
  throw new Error('Unknown block condition');
}
const interpolate = (text,context) => text.replace(/\{\{([\w.]+)\}\}/g,(_,path)=>{
  const value=get(context,path);
  if(value===undefined)throw new Error(`Missing block context: ${path}`);
  return String(value);
});
export function resolveBlocks(root,catalog,context) {
  function visit(node,stack=[]) {
    if(Array.isArray(node))return node.flatMap(child=>visit(child,stack));
    if(node.type==='ref') {
      if(!Object.hasOwn(catalog,node.ref))throw new Error(`Unknown block: ${node.ref}`);
      if(stack.includes(node.ref))throw new Error(`Cyclic block: ${[...stack,node.ref].join(' -> ')}`);
      return visit(catalog[node.ref],[...stack,node.ref]);
    }
    if(node.type==='when')return visit(matches(node.condition,context)?node.then:node.otherwise,stack);
    if(node.type==='choose') {
      const key=String(get(context,node.field));
      return visit(Object.hasOwn(node.cases,key)?node.cases[key]:node.fallback,stack);
    }
    if(node.type==='group')return [{...node,children:visit(node.children,stack)}].filter(item=>item.children.length);
    if(node.type==='note')return [{...node,title:interpolate(node.title,context),body:interpolate(node.body,context)}];
    if(node.type==='image')return [{...node}];
    throw new Error(`Unknown block type: ${node.type}`);
  }
  const result=visit(root);
  if(result.length!==1||result[0].type!=='group')throw new Error('Prayer root must resolve to one group');
  return result[0];
}
export function flattenBlocks(tree) {
  return tree.type==='group'?tree.children.flatMap(flattenBlocks):[{...tree}];
}
// Locate a reusable section, a primitive, or a source page in the resolved order.
export function blockIndex(tree,anchor) {
  let offset=0,found=-1;
  function visit(node) {
    if(found>=0)return;
    if(node.id===anchor){found=offset;return;}
    if(node.type==='group')node.children.forEach(visit);
    else offset++;
  }
  visit(tree);
  return found;
}
