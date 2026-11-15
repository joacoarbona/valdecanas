#!/usr/bin/env python3
# mkst.py in.src out.txt: joins each block between lines '{{' and '}}' into one step line, so steps can be written over several lines.
# The block becomes 'js: …', or 'A: …' (B:, C:) when its first line starts with the player of mp2.py. Lines starting with // inside a block are dropped.
import re, sys
L=open(sys.argv[1]).read().split('\n'); out=[]; buf=None
for l in L:
    if l.strip()=='{{': buf=[]; continue
    if l.strip()=='}}':
        j=' '.join(x.strip() for x in buf if x.strip() and not x.strip().startswith('//'))
        out.append(j if re.match(r'^[ABC]: ',j) else 'js: '+j); buf=None; continue
    if buf is not None: buf.append(l)
    else: out.append(l)
open(sys.argv[2],'w').write('\n'.join(out)+'\n')
