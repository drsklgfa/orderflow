'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import type { Cart } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { EmptyState } from '@/components/empty-state';

export default function CartPage(){
  const {user,loading:authLoading}=useAuth(); const router=useRouter(); const [cart,setCart]=useState<Cart|null>(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function load(){try{setCart(await apiFetch<Cart>('/cart'));}catch{router.push('/login')}finally{setLoading(false)}}
  useEffect(()=>{if(!authLoading){if(!user)router.push('/login');else void load()}},[authLoading,user]);
  async function quantity(productId:string,value:number){if(value<1)return;setError('');try{setCart(await apiFetch<Cart>(`/cart/items/${productId}`,{method:'PATCH',body:JSON.stringify({quantity:value})}));}catch(e){setError(e instanceof ApiError?e.message:'Falha ao atualizar.')};}
  async function remove(productId:string){await apiFetch(`/cart/items/${productId}`,{method:'DELETE'});await load()}
  async function checkout(){setBusy(true);setError('');try{await apiFetch('/orders/checkout',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()}});router.push('/orders');}catch(e){setError(e instanceof ApiError?e.message:'Não foi possível concluir o pedido.');await load();}finally{setBusy(false)}}
  if(loading||authLoading)return <div className="loading">Carregando carrinho...</div>;
  if(!cart?.items.length)return <section className="page"><div className="shell"><EmptyState title="Seu carrinho está vazio" text="Escolha um produto para iniciar um pedido." action="Ver produtos" href="/catalog"/></div></section>;
  return <section className="page"><div className="shell"><div className="page-head"><div><span className="eyebrow">CHECKOUT</span><h1>Seu carrinho</h1><p>O estoque será reservado de forma atômica ao finalizar.</p></div></div>{error&&<div className="form-error" style={{marginBottom:16}}>{error}</div>}<div className="cart-layout"><div className="cart-list">{cart.items.map(item=><article className="cart-item" key={item.id}><Image src={item.product.imageUrl||'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'} alt={item.product.name} width={180} height={160}/><div><h3>{item.product.name}</h3><p>{item.product.sku} • {money(item.product.priceInCents)} por unidade</p><div className="quantity"><button onClick={()=>quantity(item.productId,item.quantity-1)}>-</button><strong>{item.quantity}</strong><button onClick={()=>quantity(item.productId,item.quantity+1)}>+</button><button className="button danger small" onClick={()=>remove(item.productId)}>Remover</button></div></div><strong>{money(item.subtotalInCents)}</strong></article>)}</div><aside className="panel summary"><h2>Resumo</h2><div className="summary-row"><span>Itens</span><strong>{cart.totalItems}</strong></div><div className="summary-row"><span>Entrega</span><strong>Grátis</strong></div><div className="summary-total"><span>Total</span><span>{money(cart.totalInCents)}</span></div><button className="button primary" disabled={busy} onClick={checkout}>{busy?'Processando...':'Finalizar pedido'}</button><small style={{display:'block',color:'var(--muted)',marginTop:12,lineHeight:1.5}}>Cliques repetidos não criam pedidos duplicados graças à chave de idempotência.</small></aside></div></div></section>
}
