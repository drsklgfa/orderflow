'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { apiFetch, ApiError } from '@/lib/api';
import { dateTime, money } from '@/lib/format';
import type { Order, Paginated } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function OrdersPage(){
  const {user,loading:authLoading}=useAuth();const router=useRouter();const [orders,setOrders]=useState<Order[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  async function load(){try{const data=await apiFetch<Paginated<Order>>('/orders/me?limit=50');setOrders(data.items)}catch{router.push('/login')}finally{setLoading(false)}}
  useEffect(()=>{if(!authLoading){if(!user)router.push('/login');else void load()}},[authLoading,user]);
  async function cancel(id:string){setError('');try{await apiFetch(`/orders/${id}/cancel`,{method:'PATCH'});await load()}catch(e){setError(e instanceof ApiError?e.message:'Não foi possível cancelar.')}}
  if(loading||authLoading)return <div className="loading">Carregando pedidos...</div>;
  return <section className="page"><div className="shell"><div className="page-head"><div><span className="eyebrow">HISTÓRICO</span><h1>Meus pedidos</h1><p>Acompanhe cada etapa do processamento.</p></div></div>{error&&<div className="form-error" style={{marginBottom:16}}>{error}</div>}{orders.length===0?<EmptyState title="Nenhum pedido encontrado" text="Seu histórico aparecerá aqui após o primeiro checkout." action="Ir ao catálogo" href="/catalog"/>:<div className="order-list">{orders.map(order=><article className="order-card" key={order.id}><div className="order-head"><div><h3>{order.number}</h3><small>{dateTime(order.createdAt)}</small></div><StatusBadge status={order.status}/></div><div className="order-items">{order.items.map(item=><div className="order-line" key={item.id}><span>{item.quantity}× {item.productName}</span><strong>{money(item.subtotalInCents)}</strong></div>)}</div><div className="order-foot"><strong>Total: {money(order.totalInCents)}</strong>{order.status==='PENDING'&&<button className="button danger small" onClick={()=>cancel(order.id)}>Cancelar pedido</button>}</div></article>)}</div>}</div></section>
}
