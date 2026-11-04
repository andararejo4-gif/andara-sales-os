import {useSyncExternalStore} from 'react';
import type {TicketClass} from '@/lib/lead-rules';

const key='andara.ticket-mode';
const listeners=new Set<()=>void>();
const read=():TicketClass|null=>{if(typeof window==='undefined')return null;const value=window.localStorage.getItem(key);return value==='REGULER'||value==='BESAR'?value:null;};
export function setTicketMode(mode:TicketClass|null){if(mode)window.localStorage.setItem(key,mode);else window.localStorage.removeItem(key);listeners.forEach(listener=>listener());}
export function useTicketMode(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},read,()=>null);}
export function matchesTicketMode(leadClass:string|undefined,mode:TicketClass|null){return mode===null||(leadClass??'REGULER')===mode;}
