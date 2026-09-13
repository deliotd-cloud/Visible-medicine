/** Transport only. The source-bound module validates identity, revision and scope.
 * Unknown query fields (including private identifiers/URLs) are never relayed. */
export function atlasStudySuffix(params:Record<string,string|string[]|undefined>):string|null {
  const rules:Record<string,RegExp>={
    study:/^[12]$/,structure:/^[a-zA-Z0-9:_-]{1,240}$/,
    side:/^(both|left|right)$/,source:/^[a-f0-9]{64}$/,
    focus:/^[a-zA-Z0-9_-]{1,100}$/,
    detail:/^[a-z]+(?:-[a-z]+){0,4}$/,
    part:/^[a-zA-Z0-9:_-]{1,240}$/,partSource:/^[a-f0-9]{64}$/,
  };
  const result=new URLSearchParams();
  for(const [key,rule] of Object.entries(rules)){
    if(!Object.hasOwn(params,key))continue;
    const value=params[key];
    if(typeof value!=='string'||value.length>240||!rule.test(value))return null;
    result.set(key,value);
  }
  // Partial, unsupported nested combinations and stale hashes stay subject to
  // the module's existing fail-closed parser; never silently choose another part.
  return result.size?'&'+result.toString():'';
}
