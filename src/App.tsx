/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  ArrowRight, 
  CreditCard, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ChevronLeft,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_USER } from './constants';
import { Product, CheckoutStep, TransactionStatus } from './types';

// Utils
const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
const formatPoints = (val: number) => new Intl.NumberFormat('es-CO').format(val);

export default function App() {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [userPoints, setUserPoints] = useState(MOCK_USER.pointsBalance);
  const [allocations, setAllocations] = useState<Record<string, number>>({
    'prod-a': 0.5, // 50% default
    'prod-b': 1.0, // 100% fixed
  });
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Derived state
  const cartItems = MOCK_PRODUCTS;
  
  const totals = useMemo(() => {
    let totalPoints = 0;
    let totalCash = 0;
    
    cartItems.forEach(item => {
      const percentage = allocations[item.id] || (item.allowsMixedPayment ? 0.5 : 1.0);
      const pointsPart = item.pricePoints * percentage;
      const cashPart = (item.priceCOP * (1 - (pointsPart / item.pricePoints)));
      
      totalPoints += pointsPart;
      totalCash += cashPart;
    });

    return { totalPoints, totalCash };
  }, [allocations, cartItems]);

  const hasInsufficientPoints = totals.totalPoints > userPoints;

  const handleUpdateAllocation = (id: string, value: number) => {
    setAllocations(prev => ({ ...prev, [id]: value }));
  };

  const simulatePayment = () => {
    // If it's 100% points, we skip the redirecion screen and go straight to success
    if (totals.totalCash === 0) {
      const txId = `FTX-${Math.floor(Math.random() * 1000000)}`;
      setTransaction({
        id: txId,
        state: 'success_points_only',
        pointsUsed: totals.totalPoints,
        cashPaid: 0,
        timestamp: new Date().toISOString(),
      });
      setUserPoints(prev => prev - totals.totalPoints);
      setStep('confirmation');
      return;
    }

    setStep('payment');
    setIsSimulatingPayment(true);
    
    // Random outcome simulation after 2.5 seconds
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // 85% success rate
      const txId = `FTX-${Math.floor(Math.random() * 1000000)}`;
      
      if (isSuccess) {
        setTransaction({
          id: txId,
          state: 'success',
          pointsUsed: totals.totalPoints,
          cashPaid: totals.totalCash,
          timestamp: new Date().toISOString(),
        });
        setUserPoints(prev => prev - totals.totalPoints);
      } else {
        setTransaction({
          id: txId,
          state: 'failed',
          pointsUsed: totals.totalPoints,
          cashPaid: totals.totalCash,
          timestamp: new Date().toISOString(),
        });
      }
      setIsSimulatingPayment(false);
      setStep('confirmation');
    }, 2500);
  };

  const reset = () => {
    setStep('cart');
    setAllocations({
      'prod-a': 0.5,
      'prod-b': 1.0,
    });
    setTransaction(null);
  };

  // --- Screens ---

  const CartScreen = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tu Carrito</h1>
          <p className="text-slate-500">Revisa tus productos antes de pagar.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2">
          <Coins className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">{formatPoints(userPoints)} pts</span>
        </div>
      </header>

      <div className="space-y-4">
        {cartItems.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-blue-100 transition-colors">
            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center">
              <PackageCheck className="w-10 h-10 text-slate-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                  <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">{formatCOP(item.priceCOP)}</div>
                  <div className="text-sm font-medium text-blue-600">o {formatPoints(item.pricePoints)} pts</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-600 font-medium">{item.paymentRule}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 mt-12">
        <div className="space-y-1">
          <p className="text-slate-400 text-sm font-medium">Subtotal estimado</p>
          <p className="text-2xl font-bold">{formatCOP(cartItems.reduce((acc, i) => acc + i.priceCOP, 0))}</p>
        </div>
        <button 
          onClick={() => setStep('checkout')}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          Ir a pagar <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const CheckoutScreen = () => (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
      <div className="space-y-6">
        <button onClick={() => setStep('cart')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors mb-4">
          <ChevronLeft className="w-5 h-5" /> Volver al carrito
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Configura tu Pago Mixto</h2>
        
        <div className="space-y-6">
          {cartItems.map(item => {
            const currentPoints = Math.round(item.pricePoints * allocations[item.id]);
            const currentCash = Math.round(item.priceCOP * (1 - (currentPoints / item.pricePoints)));
            
            return (
              <div key={item.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-4 border-bottom border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                    <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.allowsMixedPayment ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {item.allowsMixedPayment ? 'Pago Mixto' : 'Solo Puntos'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                    <p className="text-xs text-blue-400 font-bold uppercase mb-1">Puntos a usar</p>
                    <p className="text-xl font-bold text-blue-700">{formatPoints(currentPoints)} pts</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Dinero restante</p>
                    <p className="text-xl font-bold text-slate-700">{formatCOP(currentCash)}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm font-bold text-slate-600">
                    <span>Proporción de puntos</span>
                    <span>{Math.round(allocations[item.id] * 100)}%</span>
                  </div>
                  
                  <input
                    type="range"
                    min={item.minPointsPercentage * 100}
                    max={100}
                    value={allocations[item.id] * 100}
                    disabled={!item.allowsMixedPayment}
                    onChange={(e) => handleUpdateAllocation(item.id, parseInt(e.target.value) / 100)}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${item.allowsMixedPayment ? 'bg-blue-200 accent-blue-600' : 'bg-slate-200 accent-slate-400 opacity-50'}`}
                  />
                  
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">
                    <span>Mín {item.minPointsPercentage * 100}%</span>
                    <span>Máx 100%</span>
                  </div>

                  {!item.allowsMixedPayment && (
                    <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Este producto es un bono digital y por regulación fiscal solo puede ser redimido al 100% con puntos.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-8 shadow-2xl overflow-hidden relative">
          {/* Abstract pattern bg */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <h3 className="text-xl font-bold mb-6">Resumen de Pago</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Total Puntos</span>
              <span className="text-white">{formatPoints(totals.totalPoints)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Total Dinero</span>
              <span className="text-white">{formatCOP(totals.totalCash)}</span>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-medium">Tus Puntos Actuales</span>
                <div className="text-right">
                  <div className="text-white font-bold">{formatPoints(userPoints)}</div>
                  <div className={`text-xs font-bold mt-1 ${hasInsufficientPoints ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hasInsufficientPoints ? 'Saldo insuficiente' : `Saldo final: ${formatPoints(userPoints - totals.totalPoints)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={hasInsufficientPoints}
            onClick={simulatePayment}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform ${
              hasInsufficientPoints 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-lg shadow-blue-500/20'
            }`}
          >
            {hasInsufficientPoints ? (
              <> <XCircle className="w-5 h-5" /> Puntos Insuficientes </>
            ) : (
              <> <ShieldCheck className="w-5 h-5" /> Confirmar Pago </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-500 mt-6 uppercase tracking-widest font-bold">
            Transacción 100% Segura
          </p>
        </div>
      </div>
    </div>
  );

  const PaymentScreen = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-20 bg-white rounded-[2.5rem] p-12 border border-slate-200 mt-12 shadow-sm">
      <div className="relative inline-block">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-24 h-24 border-4 border-blue-600/20 border-t-blue-600 rounded-full mx-auto"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <CreditCard className="w-10 h-10 text-blue-600" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Redirigiendo a Pasarela de Pago</h2>
        <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
          Serás redirigido a una pasarela de pago segura para completar el componente en dinero de <span className="font-bold text-slate-900">{formatCOP(totals.totalCash)}</span>.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 text-white font-bold bg-blue-600 w-fit mx-auto px-10 py-5 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
        <ExternalLink className="w-5 h-5" /> Continuar a pasarela de pago
      </div>
      
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">Tu sesión de puntos está protegida por CheckoutUnified</p>
    </div>
  );

  const ConfirmationScreen = () => {
    if (!transaction) return null;

    const isSuccess = transaction.state.startsWith('success');
    const isPointsOnly = transaction.state === 'success_points_only';

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500 pt-12">
        <div className={`p-12 rounded-[2.5rem] text-center border-2 shadow-sm ${isSuccess ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
          {isSuccess ? (
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
          )}

          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
            {isSuccess ? '¡Compra Exitosa!' : 'Pago Fallido'}
          </h2>
          
          <p className="text-slate-600 font-medium max-w-md mx-auto mb-8 px-4">
            {isSuccess 
              ? (isPointsOnly ? 'Tu compra fue completada usando únicamente puntos.' : 'Tu orden ha sido procesada correctamente con éxito.')
              : 'Hubo un problema procesando tu pago en dinero. Tus puntos han sido revertidos automáticamente a tu saldo.'}
          </p>

          <div className="bg-slate-50/80 backdrop-blur rounded-3xl p-8 max-w-md mx-auto text-left border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalles de Orden</span>
              <span className="text-xs font-mono font-black text-slate-700 bg-white px-2 py-1 rounded border border-slate-100">{transaction.id}</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">{isSuccess ? 'Puntos Utilizados' : 'Puntos Revertidos'}</span>
                <span className="font-black text-blue-600">{formatPoints(transaction.pointsUsed)} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">{isSuccess ? 'Dinero Pagado' : 'Dinero no cobrado'}</span>
                <span className="font-black text-slate-900">{formatCOP(transaction.cashPaid)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-200/50">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Estado Final</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isSuccess ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'}`}>
                  {isPointsOnly ? 'COMPLETADO / POINTS_ONLY' : (isSuccess ? 'COMPLETADO' : 'ESTADO REVERTIDO / ROLLBACK COMPLETED')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={reset}
              className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-100">
      {/* Nav Bar - High Density Theme Style */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-blue-900">
            LoyaltyPay <span className="font-normal text-slate-400 text-[10px] italic uppercase tracking-tighter ml-1">Fintech Edition</span>
          </span>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">Tu Saldo</p>
            <p className="text-blue-600 font-bold leading-none">{formatPoints(userPoints)} Puntos</p>
          </div>
          <div className="w-9 h-9 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-24 px-6 max-w-[1400px] mx-auto min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {step === 'cart' && <CartScreen />}
            
            {step === 'checkout' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                {/* Column 1: Order Recap */}
                <section className="col-span-12 md:col-span-4 flex flex-col gap-4">
                  <header className="flex items-center gap-3 px-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">1</div>
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resumen de Selección</h2>
                  </header>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {cartItems.map((item, idx) => (
                      <div key={item.id} className={`p-4 product-card ${idx === 0 ? 'product-card-active active' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${item.category === 'Tecnología' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {item.category}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">ID: {8000 + Math.floor(Math.random() * 1000)}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 leading-tight">{item.name}</h3>
                        <div className="mt-4 flex justify-between items-end">
                          <p className="text-sm font-black text-slate-900">{formatCOP(item.priceCOP)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatPoints(item.pricePoints)} pts</p>
                        </div>
                        <div className={`mt-3 p-2 rounded border text-[9px] font-semibold ${item.allowsMixedPayment ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                          Regla: {item.paymentRule}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep('cart')} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 px-2 mt-2 transition-colors">
                    <ChevronLeft className="w-3 h-3" /> Editar Carrito
                  </button>
                </section>

                {/* Column 2: Payment Configuration */}
                <section className="col-span-12 md:col-span-5 flex flex-col gap-4">
                  <header className="flex items-center gap-3 px-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">2</div>
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Configuración de Pago</h2>
                  </header>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-8 h-full">
                    {cartItems.map((item, idx) => {
                      const currentPoints = Math.round(item.pricePoints * allocations[item.id]);
                      const currentCash = Math.round(item.priceCOP * (1 - (currentPoints / item.pricePoints)));
                      
                      return (
                        <div key={item.id} className={!item.allowsMixedPayment ? 'opacity-70' : ''}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.name}</label>
                            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {Math.round(allocations[item.id] * 100)}% Puntos
                            </span>
                          </div>
                          
                          <div className="relative h-10 flex items-center px-1">
                            <input
                              type="range"
                              min={item.minPointsPercentage * 100}
                              max={100}
                              value={allocations[item.id] * 100}
                              disabled={!item.allowsMixedPayment}
                              onChange={(e) => handleUpdateAllocation(item.id, parseInt(e.target.value) / 100)}
                              className="w-full"
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            <span>Mín: {formatPoints(Math.round(item.pricePoints * item.minPointsPercentage))} pts ({item.minPointsPercentage * 100}%)</span>
                            <span>Máx: {formatPoints(item.pricePoints)} pts (100%)</span>
                          </div>

                          <div className="mt-3 flex gap-3">
                            <div className="flex-1 p-2 bg-blue-50/50 rounded border border-blue-100 text-center">
                              <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest leading-none mb-1">Puntos</p>
                              <p className="text-xs font-black text-blue-700">{formatPoints(currentPoints)}</p>
                            </div>
                            <div className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-center">
                              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Dinero</p>
                              <p className={`text-xs font-black ${!item.allowsMixedPayment ? 'text-slate-400 opacity-50 italic' : 'text-slate-700'}`}>
                                {item.allowsMixedPayment ? formatCOP(currentCash) : 'Bloqueado'}
                              </p>
                            </div>
                          </div>
                          
                          {idx < cartItems.length - 1 && <div className="mt-8 border-t border-slate-100" />}
                        </div>
                      );
                    })}
                    
                    {/* Regulation Notice for fixed items */}
                    {cartItems.some(i => !i.allowsMixedPayment) && (
                      <p className="mt-auto text-[9px] text-slate-400 italic leading-relaxed border-t border-slate-50 pt-4">
                        * Los productos tipo Bono Digital no admiten pago mixto por normativa fiscal de redención inmediata.
                      </p>
                    )}
                  </div>
                </section>

                {/* Column 3: Consolidated Summary */}
                <section className="col-span-12 md:col-span-3 flex flex-col gap-4">
                  <header className="flex items-center gap-3 px-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">3</div>
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resumen Consolidado</h2>
                  </header>
                  <div className="bg-slate-900 text-white rounded-xl shadow-xl p-6 flex flex-col h-full ring-1 ring-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                    
                    <div className="space-y-4 flex-1 relative z-10">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Total Puntos</span>
                        <span className="font-black text-blue-400 text-sm">{formatPoints(totals.totalPoints)} pts</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Total Dinero</span>
                        <span className="font-black text-emerald-400 text-sm">{formatCOP(totals.totalCash)}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-4" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-600 font-bold uppercase tracking-tighter">Saldo Actual</span>
                          <span className="font-bold opacity-60">{formatPoints(userPoints)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-600 font-bold uppercase tracking-tighter">Saldo proyectado</span>
                          <span className={`font-black tracking-tight ${hasInsufficientPoints ? 'text-rose-400' : 'text-blue-400 text-xs'}`}>
                            {hasInsufficientPoints ? 'Fondos Insuficientes' : `${formatPoints(userPoints - totals.totalPoints)} pts`}
                          </span>
                        </div>
                      </div>
                      
                      {!hasInsufficientPoints && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg mt-6 flex gap-2 items-start">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-emerald-400 leading-tight font-medium">
                            Cuentas con puntos suficientes para esta transacción.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-8 relative z-10">
                      <button 
                        disabled={hasInsufficientPoints}
                        onClick={simulatePayment}
                        className={`w-full py-4 rounded-lg font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
                          hasInsufficientPoints 
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/40 active:scale-95'
                        }`}
                      >
                        {hasInsufficientPoints ? 'Puntos Insuficientes' : 'PAGAR AHORA'}
                      </button>
                      <p className="text-[9px] text-center text-slate-600 leading-tight font-medium">
                        {totals.totalCash > 0 
                          ? `Serás redirigido a la pasarela externa para procesar el componente en dinero de ${formatCOP(totals.totalCash)}`
                          : 'Procesamiento directo vía redención de puntos.'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {step === 'payment' && <PaymentScreen />}
            {step === 'confirmation' && <ConfirmationScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - High Density Theme Style */}
      <footer className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-center gap-12 z-50">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Pago Seguro SSL</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Reversión automática</span>
        </div>
        <div className="hidden md:flex items-center gap-2 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Powered by CheckoutUnified</span>
        </div>
      </footer>
    </div>
  );
}
