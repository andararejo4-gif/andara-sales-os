import {queryOptions} from '@tanstack/react-query';
import {getRevision} from '@/lib/revision.functions';
export const revisionOptions=queryOptions({queryKey:['revision'],queryFn:()=>getRevision(),staleTime:15000});