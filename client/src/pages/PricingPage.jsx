// src/pages/PricingPage.jsx
// Credit Top-Up and Razorpay checkout page in InterviewPilot design system.

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import {
  CreditCard,
  Coins,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [plans, setPlans] = useState([]);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/payments/plans');
        setPlans(res.data?.data?.plans || res.data?.plans || []);
      } catch {
        // Fallback reference plans
        setPlans([
          { id: 'plan_starter', name: 'Starter Pack', amountInr: 100, credits: 150, description: '3 full mock interviews + ATS scans' },
          { id: 'plan_pro', name: 'Placement Pro', amountInr: 500, credits: 650, description: '13 full mock interviews + AI avatar feedback', popular: true },
          { id: 'plan_unlimited', name: 'Campus Elite', amountInr: 999, credits: 1500, description: 'Unlimited coding, simulation rounds & roadmaps' },
        ]);
      }
    };
    fetchPlans();
  }, []);

  const handlePurchase = async (plan) => {
    setPurchasingPlanId(plan.id);
    setError('');
    setMessage('');

    try {
      // 1. Create order on backend
      const orderRes = await api.post('/payments/order', { planId: plan.id });
      const orderData = orderRes.data?.data || orderRes.data;

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      // If Razorpay SDK loaded and key present, open Razorpay Checkout
      if (window.Razorpay && razorpayKey) {
        const options = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'InterviewPilot AI',
          description: `Purchase ${plan.name} (+${plan.credits} credits)`,
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                ...response,
                planId: plan.id,
              });
              const verifyData = verifyRes.data?.data || verifyRes.data;
              updateUser({ credits: verifyData.newBalance });
              setMessage(`Success! Added ${plan.credits} credits to your account.`);
            } catch {
              setError('Payment verification failed.');
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#0A0A0A' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Dev mode simulated verification
        const verifyRes = await api.post('/payments/verify', {
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_signature',
          planId: plan.id,
        });
        const verifyData = verifyRes.data?.data || verifyRes.data;
        updateUser({ credits: verifyData.newBalance });
        setMessage(`Success! Simulated purchase added ${plan.credits} credits.`);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Could not initiate purchase.');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div style={layoutStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={badgePillStyle}>
            <Coins size={14} color="#FF5A1F" />
            <span>INTERVIEW CREDITS</span>
          </div>
          <h1 style={titleStyle}>Upgrade Your Preparation Capacity</h1>
          <p style={subtitleStyle}>
            Each mock interview or full ATS scan consumes 50 credits. Select a plan to top up.
          </p>
        </div>

        {/* Current Balance Card */}
        <div style={balanceBannerStyle}>
          <div>
            <span style={{ fontSize: '13px', color: '#6B675F', fontWeight: '600' }}>YOUR BALANCE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Coins size={24} color="#FF5A1F" />
              <span style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: '32px' }}>
                {user?.credits ?? 100} CREDITS
              </span>
            </div>
          </div>
          <span style={freeTagStyle}>100 Free Credits Active</span>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Plans Grid */}
        <div style={plansGridStyle}>
          {plans.map((p) => {
            const isPopular = p.popular || p.id === 'plan_pro';
            return (
              <div
                key={p.id}
                style={{
                  ...planCardStyle,
                  ...(isPopular ? popularCardStyle : {}),
                }}
              >
                {isPopular && <span style={popularTagStyle}>MOST POPULAR</span>}

                <h3 style={planNameStyle}>{p.name}</h3>
                <p style={planDescStyle}>{p.description}</p>

                <div style={priceWrapStyle}>
                  <span style={currencyStyle}>₹</span>
                  <span style={amountStyle}>{p.amountInr}</span>
                  <span style={perStyle}>/ one-time</span>
                </div>

                <div style={creditsPillStyle}>
                  <Zap size={14} color="#FF5A1F" />
                  <span>+{p.credits} Credits</span>
                </div>

                <ul style={featuresListStyle}>
                  <li style={featureItemStyle}><CheckCircle2 size={14} color="#16A34A" /> AI Avatar Mock Interviews</li>
                  <li style={featureItemStyle}><CheckCircle2 size={14} color="#16A34A" /> Detailed Gemini Evaluation</li>
                  <li style={featureItemStyle}><CheckCircle2 size={14} color="#16A34A" /> ATS Resume Match & PDF Export</li>
                  <li style={featureItemStyle}><CheckCircle2 size={14} color="#16A34A" /> Personalized Learning Roadmaps</li>
                </ul>

                <button
                  onClick={() => handlePurchase(p)}
                  disabled={purchasingPlanId === p.id}
                  style={{
                    ...buyBtnStyle,
                    ...(isPopular ? popularBtnStyle : {}),
                  }}
                >
                  {purchasingPlanId === p.id ? 'Processing...' : `Get ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── Inline Styles ────────────────────────────────────────────────────────────
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#F2EEE6',
  color: '#0A0A0A',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};

const mainContentStyle = {
  flex: 1,
  minWidth: 0,
  padding: 'clamp(20px, 3vw, 40px)',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const headerStyle = {
  marginBottom: '28px',
};

const badgePillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  marginBottom: '10px',
};

const titleStyle = {
  fontFamily: "'Anton', Impact, sans-serif",
  fontSize: 'clamp(32px, 4vw, 44px)',
  fontWeight: '400',
  textTransform: 'uppercase',
  margin: '0 0 8px',
  letterSpacing: '0.02em',
};

const subtitleStyle = {
  fontSize: '15px',
  color: '#6B675F',
  margin: 0,
};

const balanceBannerStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '20px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '28px',
};

const freeTagStyle = {
  background: '#F0FDF4',
  border: '1px solid #DCFCE7',
  color: '#16A34A',
  fontSize: '12px',
  fontWeight: '700',
  padding: '6px 14px',
  borderRadius: '999px',
};

const plansGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
};

const planCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '28px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
};

const popularCardStyle = {
  borderColor: '#0A0A0A',
  boxShadow: '0 8px 32px rgba(10,10,10,0.08)',
};

const popularTagStyle = {
  position: 'absolute',
  top: '-12px',
  right: '24px',
  background: '#F4CF63',
  color: '#0A0A0A',
  padding: '3px 12px',
  borderRadius: '999px',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '0.06em',
};

const planNameStyle = {
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const planDescStyle = {
  fontSize: '13px',
  color: '#6B675F',
  margin: '0 0 16px',
};

const priceWrapStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  marginBottom: '14px',
};

const currencyStyle = {
  fontSize: '20px',
  fontWeight: '700',
};

const amountStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '38px',
  fontWeight: '700',
  lineHeight: 1,
};

const perStyle = {
  fontSize: '12px',
  color: '#6B675F',
};

const creditsPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  marginBottom: '20px',
  width: 'fit-content',
};

const featuresListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
};

const featureItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  color: '#0A0A0A',
};

const buyBtnStyle = {
  width: '100%',
  height: '46px',
  borderRadius: '999px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  color: '#0A0A0A',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
};

const popularBtnStyle = {
  background: '#0A0A0A',
  color: '#F2EEE6',
  borderColor: '#0A0A0A',
};

const successStyle = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#EBF7EE',
  color: '#1E7E34',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '16px',
};

const errorStyle = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#FBEBED',
  color: '#EC4F5F',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '16px',
};

