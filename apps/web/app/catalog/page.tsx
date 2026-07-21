'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import type { Paginated, Product } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function CatalogPage(){
  const {user}=useAuth(); const router=useRouter(); const [products,setProducts]=useState<Product[]>([]); const [search,setSearch]=useState(''); const [loading,setLoading]=useState(true); const [message,setMessage]=useState('');
  async function load(term=''){setLoading(true);try{const data=await apiFetch<Paginated<Product>>(`/products?limit=60${term?`&search=${encodeURIComponent(term)}`:''}`);setProducts(data.items);}finally{setLoading(false)}}
  useEffect(()=>{void load()},[]);
  async function add(product:Product){if(!user){router.push('/login');return;}setMessage('');try{await apiFetch('/cart/items',{method:'POST',body:JSON.stringify({productId:product.id,quantity:1})});setMessage(`${product.name} foi adicionado ao carrinho.`);}catch(e){setMessage(e instanceof ApiError?e.message:'Não foi possível adicionar o produto.')}}
  return <section className="page"><div className="shell"><div className="page-head"><div><span className="eyebrow">CATÁLOGO</span><h1>Produtos disponíveis</h1><p>Preços e estoque são sempre validados novamente pelo servidor.</p></div><form className="toolbar" onSubmit={e=>{e.preventDefault();void load(search)}}><input className="input" placeholder="Buscar nome ou SKU" value={search} onChange={e=>setSearch(e.target.value)}/><button className="button primary">Buscar</button></form></div>{message&&<div className={message.includes('adicionado')?'form-success':'form-error'} style={{marginBottom:16}}>{message}</div>}{loading?<div className="loading">Carregando produtos...</div>:<div className="product-grid">{products.map(product=><article className="product-card" key={product.id}><Image className="product-image" src={product.imageUrl||'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'} alt={product.name} width={900} height={600}/><div className="product-body"><small>{product.sku}</small><h3>{product.name}</h3><p>{product.description||'Produto disponível para demonstração.'}</p><div className="product-meta"><span className="price">{money(product.priceInCents)}</span><span className={`stock ${product.stock<=5?'low':''}`}>{product.stock>0?`${product.stock} em estoque`:'Esgotado'}</span></div><button className="button primary" disabled={product.stock===0} onClick={()=>add(product)}>{product.stock===0?'Indisponível':'Adicionar ao carrinho'}</button></div></article>)}</div>}</div></section>
}
