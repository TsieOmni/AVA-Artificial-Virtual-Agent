import React, { useState } from 'react';
import { XMarkIcon, LightningBoltIcon, ArrowUpTrayIcon, PhotoIcon, CpuChipIcon, MagnifyingGlassIcon, CubeIcon } from './Icons';

// Sub-component for a single feature list item
const FeatureItem: React.FC<{ children: React.ReactNode, icon: React.ReactElement }> = ({ children, icon }) => (
  <li className="flex items-start gap-3">
    {React.cloneElement(icon, { className: 'w-5 h-5 mt-0.5 text-zinc-400 flex-shrink-0' })}
    <span className="text-zinc-300">{children}</span>
  </li>
);

interface Plan {
    name: string;
    description: string;
    price: string;
    badge?: string;
    features: { text: string, icon: React.ReactElement }[];
}

// Sub-component for a pricing plan card
const PlanCard: React.FC<{ plan: Plan; isCurrent: boolean; isHighlighted: boolean; onClick: () => void }> = ({ plan, isCurrent, isHighlighted, onClick }) => {
  const cardClasses = `
    p-8 rounded-2xl flex flex-col
    ${isHighlighted ? 'bg-[#3e338b] border-2 border-[var(--color-accent)]' : 'bg-zinc-800/50 border border-zinc-700'}
  `;
  const buttonClasses = `
    w-full py-3 mt-8 rounded-lg font-semibold transition-colors text-center
    ${isCurrent 
      ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-default' 
      : isHighlighted 
      ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white' 
      : 'bg-white hover:bg-zinc-200 text-black'
    }
  `;

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
        {plan.badge && <span className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded-full">{plan.badge}</span>}
      </div>
      <p className="text-zinc-400 mt-2 h-10">{plan.description}</p>
      <div className="mt-6 flex items-baseline">
        <span className="text-4xl font-bold text-white tracking-tight">R {plan.price}</span>
        <span className="text-zinc-400 ml-1.5 text-sm">ZAR / month</span>
      </div>
      
      <button onClick={onClick} className={buttonClasses}>
        {isCurrent ? 'Your current plan' : `Upgrade to ${plan.name}`}
      </button>

      <ul className="mt-8 space-y-4 text-sm flex-1">
        {plan.features.map((feature, index) => (
          <FeatureItem key={index} icon={feature.icon}>
            {feature.text}
          </FeatureItem>
        ))}
      </ul>
    </div>
  );
};

const personalPlans: Plan[] = [
    {
        name: 'Free', price: '0', description: 'Intelligence for everyday tasks',
        features: [
            { text: 'Access to GPT-5', icon: <LightningBoltIcon /> },
            { text: 'Limited file uploads', icon: <ArrowUpTrayIcon /> },
            { text: 'Limited and slower image generation', icon: <PhotoIcon /> },
            { text: 'Limited memory and context', icon: <CpuChipIcon /> },
            { text: 'Limited deep research', icon: <MagnifyingGlassIcon /> },
        ]
    },
    {
        name: 'Go', price: '149', badge: 'NEW', description: 'More access to popular features',
        features: [
            { text: 'Expanded Access to GPT-5', icon: <LightningBoltIcon /> },
            { text: 'Expanded messaging and uploads', icon: <ArrowUpTrayIcon /> },
            { text: 'Expanded and faster image creation', icon: <PhotoIcon /> },
            { text: 'Longer memory and context', icon: <CpuChipIcon /> },
            { text: 'Limited deep research', icon: <MagnifyingGlassIcon /> },
            { text: 'Projects, tasks, custom GPTs', icon: <CubeIcon /> },
        ]
    },
    {
        name: 'Plus', price: '399', description: 'More access to advanced intelligence',
        features: [
            { text: 'GPT-5 with advanced reasoning', icon: <LightningBoltIcon /> },
            { text: 'Expanded messaging and uploads', icon: <ArrowUpTrayIcon /> },
            { text: 'Expanded and faster image creation', icon: <PhotoIcon /> },
            { text: 'Expanded memory and context', icon: <CpuChipIcon /> },
            { text: 'Expanded deep research and agent mode', icon: <MagnifyingGlassIcon /> },
        ]
    },
    {
        name: 'Pro', price: '3,999.99', description: 'Full access to the best of ChatGPT',
        features: [
            { text: 'GPT-5 with pro reasoning', icon: <LightningBoltIcon /> },
            { text: 'Unlimited messages and uploads', icon: <ArrowUpTrayIcon /> },
            { text: 'Unlimited and faster image creation', icon: <PhotoIcon /> },
            { text: 'Maximum memory and context', icon: <CpuChipIcon /> },
            { text: 'Maximum deep research and agent mode', icon: <MagnifyingGlassIcon /> },
            { text: 'Expanded projects, tasks, and agents', icon: <CubeIcon /> },
        ]
    },
];

// Placeholder, can be different
const businessPlans: Plan[] = personalPlans.map(p => ({...p, price: (parseFloat(p.price.replace(/,/g, '')) * 1.5).toFixed(2) })); 
const educationPlans: Plan[] = personalPlans.map(p => ({...p, price: (parseFloat(p.price.replace(/,/g, '')) * 0.8).toFixed(2) }));


interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [planType, setPlanType] = useState<'personal' | 'business' | 'education'>('personal');
  const currentPlanName = 'Free'; // Hardcoded for this example

  if (!isOpen) return null;

  const plans = planType === 'personal' ? personalPlans : planType === 'business' ? businessPlans : educationPlans;

  const getTransform = () => {
    if (planType === 'personal') return 'translateX(0%)';
    if (planType === 'business') return 'translateX(100%)';
    return 'translateX(200%)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-900 text-white w-full max-w-7xl max-h-[95vh] flex flex-col rounded-2xl border border-zinc-800 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center pt-10 px-6 flex-shrink-0">
            <h2 className="text-4xl font-bold text-center">Upgrade your plan</h2>
            <div className="mt-6">
                <div className="relative flex p-1 bg-zinc-800 rounded-full">
                    <button
                        onClick={() => setPlanType('personal')}
                        className={`relative w-20 py-1 text-xs font-semibold transition-colors z-10 ${planType === 'personal' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setPlanType('business')}
                        className={`relative w-20 py-1 text-xs font-semibold transition-colors z-10 ${planType === 'business' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Business
                    </button>
                     <button
                        onClick={() => setPlanType('education')}
                        className={`relative w-20 py-1 text-xs font-semibold transition-colors z-10 ${planType === 'education' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Education
                    </button>
                    <div
                        className="absolute top-1 h-[26px] w-20 rounded-full bg-black transition-transform duration-300 ease-in-out"
                        style={{ transform: getTransform() }}
                    />
                </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-10 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map(plan => (
                    <PlanCard
                        key={plan.name}
                        plan={plan}
                        isCurrent={plan.name === currentPlanName}
                        isHighlighted={plan.name === 'Go'}
                        onClick={() => alert(`Upgrading to ${plan.name}!`)}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;